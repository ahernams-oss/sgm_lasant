// Edge Function: pontomais-sync
// Sincroniza funcionários, marcações e espelho diário do Pontomais para a base Lasant.
// Documentação API: https://api.pontomais.com.br/external_api/v1
// verify_jwt = false (padrão do projeto)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const PONTOMAIS_BASE = "https://api.pontomais.com.br/external_api/v1";

interface AuthHeaders {
  "access-token": string;
  client: string;
  uid: string;
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function onlyDigits(v: unknown): string {
  return String(v ?? "").replace(/\D+/g, "");
}

async function pontomaisSignIn(login: string, password: string): Promise<AuthHeaders> {
  const res = await fetch(`${PONTOMAIS_BASE}/sign_in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Falha no login Pontomais (${res.status}): ${txt}`);
  }
  const accessToken = res.headers.get("access-token");
  const client = res.headers.get("client");
  const uid = res.headers.get("uid");
  if (!accessToken || !client || !uid) {
    throw new Error("Pontomais não retornou os headers de autenticação esperados.");
  }
  return { "access-token": accessToken, client, uid };
}

async function pontomaisGet<T = any>(path: string, auth: AuthHeaders, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${PONTOMAIS_BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: { ...auth, "Content-Type": "application/json" } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GET ${path} falhou (${res.status}): ${txt}`);
  }
  return (await res.json()) as T;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Cria registro de log "em andamento"
  const body = await req.json().catch(() => ({}));
  const origem = body?.origem ?? "manual";
  const diasAtras = Number(body?.diasAtras ?? 2); // padrão: pega últimos 2 dias para capturar correções
  const hoje = new Date();
  const inicio = new Date(hoje);
  inicio.setDate(inicio.getDate() - diasAtras);
  const periodoIni = inicio.toISOString().slice(0, 10);
  const periodoFim = hoje.toISOString().slice(0, 10);

  const { data: logRow, error: logErr } = await supabase
    .from("ponto_sync_log")
    .insert({ origem, periodo_ini: periodoIni, periodo_fim: periodoFim, status: "em_andamento" })
    .select()
    .single();
  if (logErr) {
    return new Response(JSON.stringify({ error: logErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const logId = logRow.id;

  const detalhes: any = { erros: [] };
  let totalFuncionarios = 0;
  let totalVinculados = 0;
  let totalMarcacoes = 0;
  let totalEspelhos = 0;

  try {
    const login = Deno.env.get("PONTOMAIS_LOGIN");
    const password = Deno.env.get("PONTOMAIS_PASSWORD");
    if (!login || !password) throw new Error("Credenciais PONTOMAIS_LOGIN/PONTOMAIS_PASSWORD não configuradas.");

    const auth = await pontomaisSignIn(login, password);

    // 1) Funcionários do Pontomais (paginado)
    const employeesAll: any[] = [];
    let page = 1;
    while (true) {
      const data = await pontomaisGet<any>(`/employees`, auth, {
        page: String(page),
        per_page: "100",
        attributes: "id,name,cpf,pis,registration_number",
      });
      const list = data?.employees ?? data?.data ?? [];
      employeesAll.push(...list);
      if (!list.length || list.length < 100) break;
      page++;
      if (page > 50) break; // proteção
    }
    totalFuncionarios = employeesAll.length;

    // Mapa CPF -> { funcionario_id, pontomais_id }
    const { data: funcionariosDb } = await supabase
      .from("funcionarios")
      .select("id, cpf")
      .not("cpf", "is", null);

    const cpfMap = new Map<string, string>();
    (funcionariosDb ?? []).forEach((f: any) => {
      const c = onlyDigits(f.cpf);
      if (c) cpfMap.set(c, f.id);
    });

    const pontomaisMap = new Map<number, { funcionario_id: string | null; cpf: string }>();
    employeesAll.forEach((e: any) => {
      const cpf = onlyDigits(e.cpf);
      const funcId = cpfMap.get(cpf) ?? null;
      if (funcId) totalVinculados++;
      pontomaisMap.set(Number(e.id), { funcionario_id: funcId, cpf });
    });

    // 2) Marcações (time_cards) do período
    const tcData = await pontomaisGet<any>(`/time_cards`, auth, {
      start_date: periodoIni,
      end_date: periodoFim,
      per_page: "500",
    });
    const timeCards: any[] = tcData?.time_cards ?? tcData?.data ?? [];

    for (const tc of timeCards) {
      const empId = Number(tc.employee_id ?? tc.employee?.id);
      const ref = pontomaisMap.get(empId);
      const dataHora = tc.time ?? tc.date_time ?? tc.created_at;
      if (!dataHora) continue;
      const hashSource = `${empId}|${dataHora}|${tc.id ?? ""}`;
      const hash = await sha256(hashSource);
      const { error: insErr } = await supabase.from("ponto_marcacoes").upsert(
        {
          funcionario_id: ref?.funcionario_id ?? null,
          cpf: ref?.cpf ?? null,
          pontomais_employee_id: empId,
          pontomais_time_card_id: tc.id ?? null,
          data_hora: dataHora,
          tipo: tc.kind ?? tc.type ?? null,
          latitude: tc.latitude ?? null,
          longitude: tc.longitude ?? null,
          endereco: tc.address ?? null,
          origem: tc.origin ?? tc.source ?? null,
          hash,
          raw: tc,
        },
        { onConflict: "hash" },
      );
      if (insErr) detalhes.erros.push(`marcacao ${tc.id}: ${insErr.message}`);
      else totalMarcacoes++;
    }

    // 3) Espelho (work_days) do período
    const wdData = await pontomaisGet<any>(`/work_days`, auth, {
      start_date: periodoIni,
      end_date: periodoFim,
      per_page: "500",
    });
    const workDays: any[] = wdData?.work_days ?? wdData?.data ?? [];

    for (const wd of workDays) {
      const empId = Number(wd.employee_id ?? wd.employee?.id);
      const ref = pontomaisMap.get(empId);
      const dataDia = wd.date ?? wd.day;
      if (!dataDia || !ref?.cpf) continue;
      const { error: upErr } = await supabase.from("ponto_espelho_dia").upsert(
        {
          funcionario_id: ref.funcionario_id ?? null,
          cpf: ref.cpf,
          pontomais_employee_id: empId,
          data: dataDia,
          horas_trabalhadas_min: Number(wd.worked_minutes ?? wd.worked_time ?? 0) || 0,
          horas_extras_min: Number(wd.extra_minutes ?? 0) || 0,
          horas_faltantes_min: Number(wd.missing_minutes ?? 0) || 0,
          atrasos_min: Number(wd.delay_minutes ?? 0) || 0,
          saldo_min: Number(wd.balance_minutes ?? 0) || 0,
          status: wd.status ?? null,
          observacao: wd.observation ?? null,
          raw: wd,
        },
        { onConflict: "cpf,data" },
      );
      if (upErr) detalhes.erros.push(`espelho ${empId}/${dataDia}: ${upErr.message}`);
      else totalEspelhos++;
    }

    await supabase
      .from("ponto_sync_log")
      .update({
        finalizado_em: new Date().toISOString(),
        status: detalhes.erros.length ? "concluido_com_erros" : "sucesso",
        total_funcionarios: totalFuncionarios,
        total_funcionarios_vinculados: totalVinculados,
        total_marcacoes: totalMarcacoes,
        total_espelhos: totalEspelhos,
        detalhes,
      })
      .eq("id", logId);

    return new Response(
      JSON.stringify({
        ok: true,
        log_id: logId,
        totalFuncionarios,
        totalVinculados,
        totalMarcacoes,
        totalEspelhos,
        erros: detalhes.erros,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    await supabase
      .from("ponto_sync_log")
      .update({
        finalizado_em: new Date().toISOString(),
        status: "erro",
        mensagem: String(err?.message ?? err),
        detalhes,
      })
      .eq("id", logId);
    return new Response(JSON.stringify({ ok: false, error: String(err?.message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
