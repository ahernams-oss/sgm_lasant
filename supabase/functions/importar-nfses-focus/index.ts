import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const URL_HOM = "https://homologacao.focusnfe.com.br";
const URL_PROD = "https://api.focusnfe.com.br";
const digitsOnly = (s: string) => (s || "").replace(/\D+/g, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { empresaId, baixarXml = true, dataInicial, dataFinal } = await req.json().catch(() => ({}));
    if (!empresaId) return json({ ok: false, error: "empresaId obrigatório" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: emp, error: empErr } = await admin
      .from("empresa").select("cnpj, nfe_ambiente").eq("id", empresaId).maybeSingle();
    if (empErr || !emp) return json({ ok: false, error: "Empresa não encontrada" }, 404);

    const cnpj = digitsOnly(emp.cnpj || "");
    if (cnpj.length !== 14) return json({ ok: false, error: "CNPJ inválido" }, 400);

    const ambiente = String(emp.nfe_ambiente || "homologacao").toLowerCase();
    const baseUrl = ambiente === "producao" ? URL_PROD : URL_HOM;
    const tokenName = ambiente === "producao" ? "FOCUS_NFE_TOKEN_PRODUCAO" : "FOCUS_NFE_TOKEN_HOMOLOGACAO";
    const token = Deno.env.get(tokenName);
    if (!token) return json({ ok: false, error: `Token ${tokenName} não configurado` }, 400);
    const auth = "Basic " + btoa(`${token}:`);

    const params = new URLSearchParams({ cnpj, completa: "1" });
    // Focus NFe — NFSe Nacional Recebidas (ADN)
    const listUrl = `${baseUrl}/v2/nfsens_recebidas?${params.toString()}`;
    const lst = await fetch(listUrl, { headers: { Authorization: auth, Accept: "application/json" } });
    const lstText = await lst.text();
    let arr: any[] = [];
    try { const j = JSON.parse(lstText); arr = Array.isArray(j) ? j : (j?.nfses || j?.data || []); } catch {}
    if (!lst.ok) return json({ ok: false, httpStatus: lst.status, url: listUrl, error: lstText.slice(0, 800) }, 502);

    let inseridas = 0, atualizadas = 0, comXml = 0, erros = 0;

    for (const n of arr) {
      const chave = n.chave_nfse || n.chave || n.codigo_verificacao || n.numero_nfse || n.id;
      if (!chave) continue;

      let xmlPath: string | null = null;
      if (baixarXml) {
        try {
          const xmlPathApi = n.caminho_xml_nfse || n.caminho_xml || `/v2/nfsens_recebidas/${chave}.xml`;
          const xmlUrl = xmlPathApi.startsWith("http") ? xmlPathApi : `${baseUrl}${xmlPathApi}`;
          const xr = await fetch(xmlUrl, { headers: { Authorization: auth } });
          if (xr.ok) {
            const xmlBuf = new Uint8Array(await xr.arrayBuffer());
            const path = `${empresaId}/nfse/${chave}.xml`;
            const up = await admin.storage.from("nfes-xml").upload(path, xmlBuf, {
              upsert: true, contentType: "application/xml",
            });
            if (!up.error) { xmlPath = path; comXml++; }
          }
        } catch { erros++; }
      }

      const row = {
        empresa_id: empresaId,
        chave: String(chave),
        numero: String(n.numero_nfse ?? n.numero ?? ""),
        serie: String(n.serie ?? n.serie_rps ?? ""),
        codigo_verificacao: n.codigo_verificacao || null,
        prestador_cnpj: digitsOnly(n.cnpj_prestador || n.prestador_cnpj || ""),
        prestador_nome: n.nome_prestador || n.prestador_nome || n.razao_social_prestador || "",
        tomador_cnpj: cnpj,
        valor_servicos: Number(n.valor_servicos || n.valor_servico || 0) || 0,
        valor_iss: Number(n.valor_iss || n.iss || 0) || 0,
        base_calculo: Number(n.base_calculo || 0) || 0,
        valor_total: Number(n.valor_total || n.valor_liquido || n.valor_servicos || 0) || 0,
        discriminacao: n.discriminacao || n.descricao_servico || "",
        municipio_prestacao: n.municipio_prestacao || n.cidade_prestacao || "",
        data_emissao: n.data_emissao || n.data_emissao_nfse || null,
        data_recebimento: n.data_recebimento || null,
        ambiente,
        status: n.status || n.situacao || null,
        origem: "focus",
        xml_url: xmlPath,
        payload: n,
      };

      const { data: existing } = await admin.from("nfses_tomadas")
        .select("id").eq("chave", row.chave).maybeSingle();
      if (existing?.id) {
        await admin.from("nfses_tomadas").update(row).eq("id", existing.id);
        atualizadas++;
      } else {
        await admin.from("nfses_tomadas").insert(row);
        inseridas++;
      }
    }

    return json({ ok: true, total: arr.length, inseridas, atualizadas, comXml, erros, ambiente });
  } catch (e) {
    console.error("importar-nfses-focus erro:", e);
    return json({ ok: false, error: (e as Error).message || "Erro inesperado" }, 500);
  }
});
