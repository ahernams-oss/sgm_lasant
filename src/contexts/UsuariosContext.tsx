import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Usuario {
  id: string;
  nome: string;
  cargoId: string;
  telefone: string;
  email: string;
  senha: string;
  clientesPermitidos: string[];
}

interface UsuariosContextType {
  usuarios: Usuario[];
  addUsuario: (u: Omit<Usuario, "id">) => void;
  updateUsuario: (id: string, u: Omit<Usuario, "id">) => void;
  deleteUsuario: (id: string) => void;
}

const UsuariosContext = createContext<UsuariosContextType | undefined>(undefined);

export function UsuariosProvider({ children }: { children: ReactNode }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const addUsuario = (u: Omit<Usuario, "id">) =>
    setUsuarios((prev) => [...prev, { id: crypto.randomUUID(), ...u }]);

  const updateUsuario = (id: string, data: Omit<Usuario, "id">) =>
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));

  const deleteUsuario = (id: string) =>
    setUsuarios((prev) => prev.filter((u) => u.id !== id));

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
