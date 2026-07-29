// Lê registros da tabela auditoria com service_role (RLS bypass controlado).
// A listagem NÃO traz os snapshots JSONB (dados_antes/dados_depois) para evitar
// estouro de memória; o detalhe é carregado sob demanda via { id }.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const LIST_COLS =
  "id,created_at,usuario_id,usuario_nome,usuario_email,modulo,acao,entidade_id,entidade_descricao";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const { dataIni, dataFim, limit, id } = await req.json().catch(() => ({}));
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Detalhe de um único registro (com snapshots completos)
    if (id) {
      const { data, error } = await admin.from("auditoria").select("*").eq("id", id).maybeSingle();
      if (error) return json({ ok: false, error: error.message }, 500);
      return json({ ok: true, data });
    }

    const max = Math.min(Number(limit) || 500, 1000);
    let q = admin.from("auditoria").select(LIST_COLS).order("created_at", { ascending: false }).limit(max);
    if (dataIni) q = q.gte("created_at", new Date(dataIni + "T00:00:00").toISOString());
    if (dataFim) q = q.lte("created_at", new Date(dataFim + "T23:59:59").toISOString());
    const { data, error } = await q;
    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true, data });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500);
  }
});
