import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const { path } = await req.json().catch(() => ({}));
    if (!path) return json({ ok: false, error: "path obrigatório" }, 400);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await admin.storage.from("nfes-xml").createSignedUrl(path, 300);
    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true, url: data.signedUrl });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500);
  }
});
