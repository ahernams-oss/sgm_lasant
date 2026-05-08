import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isBcryptHash(s: string | null | undefined): boolean {
  if (!s) return false;
  return /^\$2[aby]\$\d{2}\$/.test(s);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const senha = String(body?.senha ?? "");

    if (!email || !senha) {
      return new Response(JSON.stringify({ error: "E-mail e senha são obrigatórios." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: rows, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("tipo", "Fornecedor")
      .ilike("email", email)
      .limit(1);

    if (error) {
      console.error("[fornecedor-login] DB error:", error);
      return new Response(JSON.stringify({ error: "Erro ao consultar fornecedor." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = rows?.[0];
    if (!user || !user.senha_portal) {
      return new Response(JSON.stringify({ error: "Credenciais inválidas." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ok = isBcryptHash(user.senha_portal) && bcrypt.compareSync(senha, user.senha_portal);
    if (!ok) {
      return new Response(JSON.stringify({ error: "Credenciais inválidas." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safe = {
      id: user.id,
      nome: user.nome,
      nomeFantasia: user.nome_fantasia,
      email: user.email,
      cnpj: user.cnpj,
    };

    return new Response(JSON.stringify({ fornecedor: safe }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[fornecedor-login] Unexpected:", e);
    return new Response(JSON.stringify({ error: "Erro inesperado." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
