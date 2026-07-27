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
  const errMsg = (data as any)?.error || error?.message;
  const isSessionInvalid =
    typeof errMsg === "string" &&
    /sess[ãa]o inv[áa]lida|expirada|Edge function returned 401/i.test(errMsg);

  if (isSessionInvalid && !["login", "signup", "reset-request"].includes(action)) {
    portalStore.clear();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/portal")) {
      window.location.href = "/portal";
    } else if (typeof window !== "undefined" && window.location.pathname !== "/portal") {
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
