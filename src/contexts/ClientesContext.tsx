import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Cliente {
  id: string;
  nome: string;
  cnpj: string;
  contato: string;
  telefone: string;
  email: string;
  endereco: string;
  grupoWhatsapp: string;
}

interface ClientesContextType {
  clientes: Cliente[];
  addCliente: (cliente: Omit<Cliente, "id">) => void;
  updateCliente: (id: string, cliente: Omit<Cliente, "id">) => void;
  deleteCliente: (id: string) => void;
}

const ClientesContext = createContext<ClientesContextType | undefined>(undefined);

export function ClientesProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const saved = localStorage.getItem("clientes");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem("clientes", JSON.stringify(clientes)); }, [clientes]);

  const addCliente = (cliente: Omit<Cliente, "id">) =>
    setClientes((prev) => [...prev, { id: crypto.randomUUID(), ...cliente }]);

  const updateCliente = (id: string, data: Omit<Cliente, "id">) =>
    setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));

  const deleteCliente = (id: string) =>
    setClientes((prev) => prev.filter((c) => c.id !== id));

  return (
    <ClientesContext.Provider value={{ clientes, addCliente, updateCliente, deleteCliente }}>
      {children}
    </ClientesContext.Provider>
  );
}

export function useClientes() {
  const ctx = useContext(ClientesContext);
  if (!ctx) throw new Error("useClientes must be used within ClientesProvider");
  return ctx;
}
