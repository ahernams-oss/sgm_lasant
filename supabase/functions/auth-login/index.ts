import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function isBcryptHash(s: string | null | undefined): boolean {
  if (!s) return false;
  return /^\$2[aby]\$\d{2}\$/.test(s);
}

function getClientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");

  const logAudit = async (params: {
    usuario_id: string | null;
    email: string;
    nome: string | null;
    sucesso: boolean;
    motivo: string | null;
  }) => {
    try {
      await supabase.from("login_auditoria").insert({
        usuario_id: params.usuario_id,
        email: params.email,
        nome: params.nome,
        sucesso: params.sucesso,
        motivo: params.motivo,
        ip,
        user_agent: userAgent,
      });
    } catch (e) {
      console.error("[auth-login] Falha ao registrar auditoria:", e);
    }
  };

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const senha = String(body?.senha ?? "");

    if (!email || !senha) {
      await logAudit({ usuario_id: null, email: email || "(vazio)", nome: null, sucesso: false, motivo: "Campos obrigatórios não preenchidos" });
      return new Response(
        JSON.stringify({ error: "E-mail e senha são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: user, error } = await supabase
      .from("usuarios")
      .select("*")
      .ilike("email", email)
      .maybeSingle();

    if (error) {
      console.error("[auth-login] DB error:", error);
      await logAudit({ usuario_id: null, email, nome: null, sucesso: false, motivo: "Erro ao consultar usuário" });
      return new Response(JSON.stringify({ error: "Erro ao consultar usuário." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!user || !user.senha) {
      await logAudit({ usuario_id: user?.id ?? null, email, nome: user?.nome ?? null, sucesso: false, motivo: !user ? "Usuário não encontrado" : "Usuário sem senha cadastrada" });
      return new Response(JSON.stringify({ error: "Credenciais inválidas." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let ok = false;
    let migrated = false;

    if (isBcryptHash(user.senha)) {
      ok = bcrypt.compareSync(senha, user.senha);
    } else {
      ok = senha.trim() === String(user.senha).trim();
      if (ok) {
        const hash = bcrypt.hashSync(senha, bcrypt.genSaltSync(10));
        await supabase.from("usuarios").update({ senha: hash }).eq("id", user.id);
        migrated = true;
      }
    }

    if (!ok) {
      await logAudit({ usuario_id: user.id, email, nome: user.nome, sucesso: false, motivo: "Senha incorreta" });
      return new Response(JSON.stringify({ error: "Credenciais inválidas." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await logAudit({ usuario_id: user.id, email, nome: user.nome, sucesso: true, motivo: migrated ? "Login OK (senha migrada para hash)" : "Login OK" });

    const { senha: _omit, ...safe } = user;
    return new Response(JSON.stringify({ usuario: safe, migrated }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[auth-login] Unexpected:", e);
    await logAudit({ usuario_id: null, email: "(erro)", nome: null, sucesso: false, motivo: "Erro inesperado no servidor" });
    return new Response(JSON.stringify({ error: "Erro inesperado." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
