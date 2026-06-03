// Lê registros da tabela auditoria com service_role (RLS bypass controlado).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const { dataIni, dataFim, limit } = await req.json().catch(() => ({}));
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let q = admin.from("auditoria").select("*").order("created_at", { ascending: false }).limit(Number(limit) || 2000);
    if (dataIni) q = q.gte("created_at", new Date(dataIni + "T00:00:00").toISOString());
    if (dataFim) q = q.lte("created_at", new Date(dataFim + "T23:59:59").toISOString());
    const { data, error } = await q;
    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true, data });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500);
  }
});
