import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const URL_HOM = "https://homologacao.focusnfe.com.br";
const URL_PROD = "https://api.focusnfe.com.br";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const { empresaId, chave } = await req.json().catch(() => ({}));
    if (!empresaId || !chave) return json({ ok: false, error: "empresaId e chave são obrigatórios" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: emp } = await admin.from("empresa").select("nfe_ambiente").eq("id", empresaId).maybeSingle();
    const ambiente = String(emp?.nfe_ambiente || "homologacao").toLowerCase();
    const baseUrl = ambiente === "producao" ? URL_PROD : URL_HOM;
    const tokenName = ambiente === "producao" ? "FOCUS_NFE_TOKEN_PRODUCAO" : "FOCUS_NFE_TOKEN_HOMOLOGACAO";
    const token = Deno.env.get(tokenName);
    if (!token) return json({ ok: false, error: `Token ${tokenName} não configurado` }, 400);
    const auth = "Basic " + btoa(`${token}:`);

    // Focus só disponibiliza DANFE de NFes recebidas após manifestação (ou pode não estar disponível)
    const candidatos = [
      `${baseUrl}/v2/nfes_recebidas/${chave}.pdf`,
      `${baseUrl}/v2/nfes_recebidas/${chave}/danfe`,
      `${baseUrl}/v2/nfes/${chave}.pdf`,
    ];
    let r: Response | null = null;
    let lastText = "";
    for (const url of candidatos) {
      r = await fetch(url, { headers: { Authorization: auth } });
      if (r.ok) break;
      lastText = await r.text();
    }
    if (!r || !r.ok) {
      let msg = "DANFE não disponível para esta NFe. A Focus NFe só fornece o PDF após a manifestação do destinatário ou quando o emitente o disponibiliza.";
      try { const j = JSON.parse(lastText); if (j?.mensagem) msg = j.mensagem; } catch {}
      return json({ ok: false, httpStatus: r?.status ?? 404, error: msg }, 200);
    }
    const buf = new Uint8Array(await r.arrayBuffer());
    let bin = "";
    const chunk = 0x8000;
    for (let i = 0; i < buf.length; i += chunk) {
      bin += String.fromCharCode(...buf.subarray(i, i + chunk));
    }
    const b64 = btoa(bin);
    return json({ ok: true, pdfBase64: b64 });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500);
  }
});
