import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface I0 {
  id: string;
  mes: number;
  ano: number;
  codSco: string;
  valor: number;
}

export const emptyI0Form: Omit<I0, "id"> = {
  mes: new Date().getMonth() + 1,
  ano: new Date().getFullYear(),
  codSco: "",
  valor: 0,
};

interface I0ContextType {
  items: I0[];
  addItem: (item: Omit<I0, "id">) => void;
  updateItem: (id: string, data: Partial<Omit<I0, "id">>) => void;
  deleteItem: (id: string) => void;
}

const I0Context = createContext<I0ContextType | undefined>(undefined);

export function I0Provider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<I0[]>(() => {
    const saved = localStorage.getItem("i0_items");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("i0_items", JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<I0, "id">) =>
    setItems((prev) => [...prev, { id: crypto.randomUUID(), ...item }]);

  const updateItem = (id: string, data: Partial<Omit<I0, "id">>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));

  const deleteItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <I0Context.Provider value={{ items, addItem, updateItem, deleteItem }}>
      {children}
    </I0Context.Provider>
  );
}

export function useI0() {
  const ctx = useContext(I0Context);
  if (!ctx) throw new Error("useI0 must be used within I0Provider");
  return ctx;
}
