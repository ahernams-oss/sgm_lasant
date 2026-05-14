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
    const { empresaId } = await req.json().catch(() => ({}));
    if (!empresaId) return json({ ok: false, error: "empresaId obrigatório" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: emp, error: empErr } = await admin
      .from("empresa")
      .select("cnpj, nfe_ambiente")
      .eq("id", empresaId)
      .maybeSingle();
    if (empErr || !emp) return json({ ok: false, error: "Empresa não encontrada" }, 404);

    const cnpj = digitsOnly(emp.cnpj || "");
    if (cnpj.length !== 14) return json({ ok: false, error: "CNPJ inválido" }, 400);

    const ambiente = String(emp.nfe_ambiente || "homologacao").toLowerCase();
    const baseUrl = ambiente === "producao" ? URL_PROD : URL_HOM;
    const tokenName = ambiente === "producao" ? "FOCUS_NFE_TOKEN_PRODUCAO" : "FOCUS_NFE_TOKEN_HOMOLOGACAO";
    const token = Deno.env.get(tokenName);
    if (!token) return json({ ok: false, error: `Token ${tokenName} não configurado` }, 400);

    // Focus NFe: GET /v2/nfes_recebidas?cnpj=...  — Basic auth: token:
    const url = `${baseUrl}/v2/nfes_recebidas?cnpj=${cnpj}`;
    const auth = "Basic " + btoa(`${token}:`);

    let resp: Response;
    try {
      resp = await fetch(url, { method: "GET", headers: { Authorization: auth, Accept: "application/json" } });
    } catch (e) {
      return json({ ok: false, error: `Falha de rede: ${(e as Error).message}`, url, ambiente }, 502);
    }

    const text = await resp.text();
    let body: any = text;
    try { body = JSON.parse(text); } catch { /* keep text */ }

    const totalDocumentos = Array.isArray(body) ? body.length : 0;
    const ok = resp.ok;

    return json({
      ok,
      httpStatus: resp.status,
      ambiente,
      url,
      cnpj,
      totalDocumentos,
      provider: "Focus NFe",
      // amostra dos primeiros 5 registros se array, senão corpo cru
      preview: Array.isArray(body) ? body.slice(0, 5) : body,
      error: ok ? undefined : (typeof body === "object" ? body?.mensagem || body?.erro || JSON.stringify(body) : String(body).slice(0, 500)),
    });
  } catch (e) {
    console.error("buscar-nfes-focus erro:", e);
    return json({ ok: false, error: (e as Error).message || "Erro inesperado" }, 500);
  }
});
