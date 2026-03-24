import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { useUsuarios, Usuario } from "./UsuariosContext";
import { useCargos } from "./CargosContext";
import { useClientes } from "./ClientesContext";

const CARGOS_ACESSO_TOTAL = ["Diretor", "Gerente Executivo", "Coordenador de Departamento"];

interface AuthContextType {
  usuarioLogado: Usuario | null;
  login: (email: string, senha: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  temAcessoTotal: boolean;
  clientesPermitidosIds: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { usuarios } = useUsuarios();
  const { cargos } = useCargos();
  const { clientes } = useClientes();
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

  const temAcessoTotal = useMemo(() => {
    if (!usuarioLogado) return false;
    const cargo = cargos.find((c) => c.id === usuarioLogado.cargoId);
    return cargo ? CARGOS_ACESSO_TOTAL.includes(cargo.nome) : false;
  }, [usuarioLogado, cargos]);

  const clientesPermitidosIds = useMemo(() => {
    if (!usuarioLogado) return [];
    if (temAcessoTotal) return clientes.map((c) => c.id);
    return usuarioLogado.clientesPermitidos;
  }, [usuarioLogado, temAcessoTotal, clientes]);

  const login = (email: string, senha: string): boolean => {
    const found = usuarios.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
    );
    if (found) { setUsuarioLogado(found); return true; }
    return false;
  };

  const logout = () => setUsuarioLogado(null);

  return (
    <AuthContext.Provider value={{ usuarioLogado, login, logout, isAuthenticated: !!usuarioLogado, temAcessoTotal, clientesPermitidosIds }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
