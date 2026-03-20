import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Funcionario {
  id: string;
  nome: string;
  cargoId: string;
  telefone: string;
  email: string;
  senha: string;
  clientesPermitidos: string[]; // IDs dos clientes que o usuário pode acessar
}

interface FuncionariosContextType {
  funcionarios: Funcionario[];
  addFuncionario: (f: Omit<Funcionario, "id">) => void;
  updateFuncionario: (id: string, f: Omit<Funcionario, "id">) => void;
  deleteFuncionario: (id: string) => void;
}

const FuncionariosContext = createContext<FuncionariosContextType | undefined>(undefined);

export function FuncionariosProvider({ children }: { children: ReactNode }) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);

  const addFuncionario = (f: Omit<Funcionario, "id">) =>
    setFuncionarios((prev) => [...prev, { id: crypto.randomUUID(), ...f }]);

  const updateFuncionario = (id: string, data: Omit<Funcionario, "id">) =>
    setFuncionarios((prev) => prev.map((f) => (f.id === id ? { ...f, ...data } : f)));

  const deleteFuncionario = (id: string) =>
    setFuncionarios((prev) => prev.filter((f) => f.id !== id));

  return (
    <FuncionariosContext.Provider value={{ funcionarios, addFuncionario, updateFuncionario, deleteFuncionario }}>
      {children}
    </FuncionariosContext.Provider>
  );
}

export function useFuncionarios() {
  const ctx = useContext(FuncionariosContext);
  if (!ctx) throw new Error("useFuncionarios must be used within FuncionariosProvider");
  return ctx;
}
