import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const apiKey = Deno.env.get("NFEIO_API_KEY");
    const companyId = Deno.env.get("NFEIO_COMPANY_ID");
    if (!apiKey) return json({ ok: false, error: "NFEIO_API_KEY não configurada" }, 400);
    if (!companyId) return json({ ok: false, error: "NFEIO_COMPANY_ID não configurado" }, 400);

    const url = `https://api.nfe.io/v1/companies/${companyId}`;
    let resp: Response;
    try {
      resp = await fetch(url, {
        method: "GET",
        headers: { Authorization: apiKey, Accept: "application/json" },
      });
    } catch (e) {
      return json({ ok: false, error: `Falha de rede: ${(e as Error).message}`, url }, 502);
    }

    const text = await resp.text();
    let body: any = text;
    try { body = JSON.parse(text); } catch {}

    const company = body?.companies || body?.company || body;
    return json({
      ok: resp.ok,
      httpStatus: resp.status,
      url,
      companyId,
      provider: "NFe.io",
      empresa: resp.ok ? {
        nome: company?.name,
        cnpj: company?.federalTaxNumber,
        im: company?.municipalTaxNumber,
        ie: company?.stateTaxNumber,
        regimeTributario: company?.taxRegime,
        ambiente: company?.environment,
        cidade: company?.address?.city,
        uf: company?.address?.state,
        status: company?.status,
      } : null,
      preview: body,
      error: resp.ok ? undefined : (typeof body === "object" ? body?.message || JSON.stringify(body) : String(body).slice(0, 500)),
    });
  } catch (e) {
    console.error("testar-nfeio erro:", e);
    return json({ ok: false, error: (e as Error).message || "Erro inesperado" }, 500);
  }
});
