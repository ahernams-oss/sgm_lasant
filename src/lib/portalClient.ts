import { supabase } from "@/integrations/supabase/client";

const TOKEN_KEY = "portalToken";
const USER_KEY = "portalUser";

export interface PortalUser {
  tipo: "funcionario" | "candidato";
  nome: string;
  cpf: string;
}

export const portalStore = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser: (): PortalUser | null => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  set: (token: string, user: PortalUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export async function portalCall<T = any>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const token = portalStore.getToken();
  const { data, error } = await supabase.functions.invoke("portal-api", {
    body: { action, ...payload },
    headers: token ? { "x-portal-token": token } : undefined,
  });

  // Try to extract body from FunctionsHttpError (supabase-js wraps non-2xx responses)
  let bodyErr: string | undefined = (data as any)?.error;
  let status: number | undefined = (error as any)?.context?.status;
  if (error && !bodyErr) {
    try {
      const ctx = (error as any).context;
      if (ctx && typeof ctx.json === "function") {
        const parsed = await ctx.json();
        bodyErr = parsed?.error;
      } else if (ctx && typeof ctx.text === "function") {
        const txt = await ctx.text();
        try { bodyErr = JSON.parse(txt)?.error; } catch { bodyErr = txt; }
      }
    } catch { /* ignore */ }
  }

  const errMsg = bodyErr || error?.message;
  const isSessionInvalid =
    status === 401 ||
    (typeof errMsg === "string" &&
      /sess[ãa]o inv[áa]lida|expirada|non-2xx|401/i.test(errMsg));

  if (isSessionInvalid && !["login", "signup", "reset-request"].includes(action)) {
    portalStore.clear();
    if (typeof window !== "undefined" && window.location.pathname !== "/portal") {
      window.location.href = "/portal";
    }
    throw new Error("Sua sessão expirou. Faça login novamente.");
  }
  if (error) throw new Error(errMsg || "Erro ao processar requisição.");
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
