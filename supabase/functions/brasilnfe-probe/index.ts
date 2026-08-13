import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const BASE = "https://api.brasilnfe.com.br/services/fiscal";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const token = Deno.env.get("BRASILNFE_TOKEN")!;
  const { chave, codLote, endpoints } = await req.json().catch(() => ({} as any));
  const eps: string[] = endpoints ?? [
    "ObterXml", "ObterXML", "ObterNotaFiscal", "ObterDocumentoFiscal", "ObterXmlNotaFiscal", "DownloadXml", "ObterArquivoXml",
  ];
  const out: any[] = [];
  for (const ep of eps) {
    try {
      const r = await fetch(`${BASE}/${ep}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Token: token },
        body: JSON.stringify({ Chave: chave, CodLote: codLote }),
      });
      const t = await r.text();
      out.push({ ep, status: r.status, body: t.slice(0, 300) });
    } catch (e) {
      out.push({ ep, error: (e as Error).message });
    }
  }
  return new Response(JSON.stringify({ out }, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
