import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { useUsuarios, Usuario } from "./UsuariosContext";
import { useCargos } from "./CargosContext";
import { supabase } from "@/integrations/supabase/client";

// Cargos com acesso total ao sistema
const CARGOS_ACESSO_TOTAL = ["Diretor", "Gerente Executivo", "Coordenador de Departamento"];

const STORAGE_KEY = "usuarioLogado";

interface AuthContextType {
  usuarioLogado: Usuario | null;
  login: (email: string, senha: string, lembrar?: boolean) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  temAcessoTotal: boolean;
  clientesPermitidosIds: string[];
  resetSenha: (email: string) => Promise<{ ok: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readStored = (): Usuario | null => {
  const persisted = localStorage.getItem(STORAGE_KEY);
  if (persisted) return JSON.parse(persisted);
  const session = sessionStorage.getItem(STORAGE_KEY);
  return session ? JSON.parse(session) : null;
};

const writeStored = (user: Usuario | null, lembrar: boolean) => {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  if (!user) return;
  const target = lembrar ? localStorage : sessionStorage;
  target.setItem(STORAGE_KEY, JSON.stringify(user));
};

const gerarSenhaTemporaria = (): string => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { usuarios } = useUsuarios();
  const { cargos } = useCargos();
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(() => readStored());
  const [lembrar, setLembrar] = useState<boolean>(() => !!localStorage.getItem(STORAGE_KEY));

  useEffect(() => {
    writeStored(usuarioLogado, lembrar);
  }, [usuarioLogado, lembrar]);

  // Keep logged user in sync with usuarios list
  useEffect(() => {
    if (usuarioLogado) {
      const atualizado = usuarios.find((u) => u.id === usuarioLogado.id);
      if (atualizado) {
        setUsuarioLogado(atualizado);
      }
    }
  }, [usuarios]);

  const temAcessoTotal = useMemo(() => {
    if (!usuarioLogado) return false;
    const cargo = cargos.find((c) => c.id === usuarioLogado.cargoId);
    return cargo ? CARGOS_ACESSO_TOTAL.includes(cargo.nome) : false;
  }, [usuarioLogado, cargos]);

  const clientesPermitidosIds = useMemo(() => {
    if (!usuarioLogado) return [];
    return usuarioLogado.clientesPermitidos;
  }, [usuarioLogado]);

  const login = (email: string, senha: string, lembrarMe = false): boolean => {
    const emailNorm = email.trim().toLowerCase();
    const senhaNorm = senha.trim();
    const found = usuarios.find(
      (u) => (u.email || "").trim().toLowerCase() === emailNorm && (u.senha || "").trim() === senhaNorm
    );
    if (!found) {
      console.warn("[Login] Falha ao autenticar:", { emailDigitado: emailNorm, totalUsuarios: usuarios.length });
    }
    if (found) {
      setLembrar(lembrarMe);
      setUsuarioLogado(found);
      return true;
    }
    return false;
  };

  const logout = () => setUsuarioLogado(null);

  const resetSenha = async (email: string): Promise<{ ok: boolean; message: string }> => {
    const emailNormalizado = email.trim().toLowerCase();
    if (!emailNormalizado) return { ok: false, message: "Informe um e-mail válido." };

    const user = usuarios.find((u) => u.email.toLowerCase() === emailNormalizado);
    if (!user) {
      // Resposta neutra para evitar enumeração de e-mails
      return { ok: true, message: "Se o e-mail estiver cadastrado, enviaremos uma senha temporária." };
    }

    const novaSenha = gerarSenhaTemporaria();

    // Atualiza a senha no banco
    const { error: updateError } = await supabase
      .from("usuarios")
      .update({ senha: novaSenha })
      .eq("id", user.id);

    if (updateError) {
      return { ok: false, message: "Erro ao gerar nova senha. Tente novamente." };
    }

    // Envia por e-mail
    try {
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "password-reset",
          recipientEmail: user.email,
          idempotencyKey: `pwd-reset-${user.id}-${Date.now()}`,
          templateData: {
            nomeUsuario: user.nome,
            senhaTemporaria: novaSenha,
            nomeEmpresa: "LASANT CONSTRUÇÕES",
          },
        },
      });
      if (error) throw error;
    } catch {
      return {
        ok: false,
        message: "Senha redefinida, mas houve falha no envio do e-mail. Contate o administrador.",
      };
    }

    return { ok: true, message: "Senha temporária enviada para o seu e-mail." };
  };

  return (
    <AuthContext.Provider
      value={{
        usuarioLogado,
        login,
        logout,
        isAuthenticated: !!usuarioLogado,
        temAcessoTotal,
        clientesPermitidosIds,
        resetSenha,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
