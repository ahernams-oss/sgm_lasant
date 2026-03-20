import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useUsuarios, Usuario } from "./UsuariosContext";

interface AuthContextType {
  usuarioLogado: Usuario | null;
  login: (email: string, senha: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { usuarios } = useUsuarios();
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem("usuarioLogado");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (usuarioLogado) {
      localStorage.setItem("usuarioLogado", JSON.stringify(usuarioLogado));
    } else {
      localStorage.removeItem("usuarioLogado");
    }
  }, [usuarioLogado]);

  // Keep logged user in sync with usuarios list
  useEffect(() => {
    if (usuarioLogado) {
      const atualizado = usuarios.find((u) => u.id === usuarioLogado.id);
      if (atualizado) {
        setUsuarioLogado(atualizado);
      }
    }
  }, [usuarios]);

  const login = (email: string, senha: string): boolean => {
    const found = usuarios.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
    );
    if (found) {
      setUsuarioLogado(found);
      return true;
    }
    return false;
  };

  const logout = () => setUsuarioLogado(null);

  return (
    <AuthContext.Provider
      value={{ usuarioLogado, login, logout, isAuthenticated: !!usuarioLogado }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
