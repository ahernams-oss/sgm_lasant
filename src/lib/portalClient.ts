import { supabase } from "@/integrations/supabase/client";

const TOKEN_KEY = "portalToken";
const USER_KEY = "portalUser";

export interface PortalUser {
  tipo: "funcionario" | "candidato";
  nome: string;
  cpf: string;
}

const PUBLIC_ACTIONS = ["login", "signup", "reset-request"];

const isBrowser = () => typeof window !== "undefined";

const redirectToPortalLogin = () => {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event("portal-session-expired"));
  if (window.location.pathname !== "/portal") {
    window.location.replace("/portal");
  }
};

export const portalStore = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser: (): PortalUser | null => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PortalUser;
    } catch {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
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

async function readFunctionError(error: unknown, data: unknown) {
  let bodyErr: string | undefined = (data as { error?: string } | null)?.error;
  let status: number | undefined = (error as any)?.context?.status;

  if (error && !bodyErr) {
    try {
      const ctx = (error as any).context;
      if (ctx && typeof ctx.clone === "function") {
        const cloned = ctx.clone();
        status = status ?? cloned.status;
        const parsed = await cloned.json().catch(() => null);
        bodyErr = parsed?.error;
      } else if (ctx && typeof ctx.json === "function") {
        const parsed = await ctx.json();
        bodyErr = parsed?.error;
      } else if (ctx && typeof ctx.text === "function") {
        const txt = await ctx.text();
        try {
          bodyErr = JSON.parse(txt)?.error;
        } catch {
          bodyErr = txt;
        }
      }
    } catch {
      // mantém a mensagem padrão do supabase-js
    }
  }

  return { bodyErr, status, message: bodyErr || (error as Error | null)?.message };
}

export async function portalCall<T = any>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const token = portalStore.getToken();
  const { data, error } = await supabase.functions.invoke("portal-api", {
    body: { action, ...payload },
    headers: token ? { "x-portal-token": token } : undefined,
  });

  const { bodyErr, status, message } = await readFunctionError(error, data);

  const isSessionInvalid =
    !PUBLIC_ACTIONS.includes(action) &&
    ((typeof bodyErr === "string" && /sess[ãa]o inv[áa]lida|expirada/i.test(bodyErr)) ||
      (status === 401 && typeof message === "string" && /non-2xx|401/i.test(message)));

  if (isSessionInvalid) {
    portalStore.clear();
    redirectToPortalLogin();
    return new Promise<T>(() => undefined);
  }

  if (error) throw new Error(message || "Erro ao processar requisição.");
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
