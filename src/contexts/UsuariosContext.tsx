import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";

export interface Usuario {
  id: string; nome: string; cargoId: string; telefone: string;
  email: string; senha: string; clientesPermitidos: string[];
  perfilAcessoId: string; matricula: string; ramal: string;
}

interface UsuariosContextType {
  usuarios: Usuario[]; addUsuario: (u: Omit<Usuario, "id">) => void;
  updateUsuario: (id: string, u: Omit<Usuario, "id">) => void;
  deleteUsuario: (id: string) => void;
}

const UsuariosContext = createContext<UsuariosContextType | undefined>(undefined);

const rowToUsuario = (r: any): Usuario => ({
  id: r.id, nome: r.nome ?? "", cargoId: r.cargo_id ?? "",
  telefone: r.telefone ?? "", email: r.email ?? "", senha: r.senha ?? "",
  clientesPermitidos: r.clientes_permitidos ?? [],
  perfilAcessoId: r.perfil_acesso_id ?? "",
  matricula: r.matricula ?? "", ramal: r.ramal ?? "",
});

const usuarioToRow = (u: Omit<Usuario, "id">) => ({
  nome: u.nome, cargo_id: u.cargoId, telefone: u.telefone,
  email: u.email, senha: u.senha, clientes_permitidos: u.clientesPermitidos as any,
  perfil_acesso_id: u.perfilAcessoId,
});

export function UsuariosProvider({ children }: { children: ReactNode }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const load = useCallback(async () => {
    const data = await fetchAll("usuarios", "nome");
    setUsuarios(data.map(rowToUsuario));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addUsuario = async (u: Omit<Usuario, "id">) => {
    await insertRow("usuarios", usuarioToRow(u));
    await load();
  };

  const updateUsuario = async (id: string, data: Omit<Usuario, "id">) => {
    await updateRow("usuarios", id, usuarioToRow(data));
    await load();
  };

  const deleteUsuario = async (id: string) => {
    await deleteRow("usuarios", id);
    await load();
  };

  return (
    <UsuariosContext.Provider value={{ usuarios, addUsuario, updateUsuario, deleteUsuario }}>
      {children}
    </UsuariosContext.Provider>
  );
}

export function useUsuarios() {
  const ctx = useContext(UsuariosContext);
  if (!ctx) throw new Error("useUsuarios must be used within UsuariosProvider");
  return ctx;
}
