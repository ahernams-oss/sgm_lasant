import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";
import { toast } from "sonner";

export interface EventogramaEvento {
  id: string;
  ordem: number;
  marco: string;
  descricao: string;
  prazo: string;          // ex: "Mês 1", "Etapa 2"
  data_prevista: string;  // YYYY-MM-DD
  data_realizada: string; // YYYY-MM-DD | ""
  percentual: number;     // % do contrato
  valor: number;          // R$
  criterio_medicao: string;
  status: "Planejado" | "Em andamento" | "Concluído" | "Cancelado";
  observacao: string;
}

export interface Eventograma {
  id: string;
  numero: number;
  cliente_id: string;
  cliente_nome: string;
  obra: string;
  descricao: string;
  responsavel: string;
  contrato_numero: string;
  data_assinatura: string;
  valor_total: number;
  eventos: EventogramaEvento[];
  status: string;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

interface Ctx {
  eventogramas: Eventograma[];
  loading: boolean;
  addEventograma: (e: Partial<Eventograma>) => Promise<Eventograma | null>;
  updateEventograma: (id: string, e: Partial<Eventograma>) => Promise<boolean>;
  deleteEventograma: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const EventogramasContext = createContext<Ctx>({} as Ctx);
export const useEventogramas = () => useContext(EventogramasContext);

export function EventogramasProvider({ children }: { children: ReactNode }) {
  const [eventogramas, setEventogramas] = useState<Eventograma[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await fetchAll("eventogramas", "created_at");
    setEventogramas((data as Eventograma[]).reverse());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addEventograma = async (e: Partial<Eventograma>) => {
    const data = await insertRow("eventogramas", e);
    if (data) { await load(); toast.success("Eventograma criado!"); }
    return data;
  };

  const updateEventograma = async (id: string, e: Partial<Eventograma>) => {
    const ok = await updateRow("eventogramas", id, { ...e, updated_at: new Date().toISOString() });
    if (ok) { await load(); toast.success("Eventograma atualizado!"); }
    return ok;
  };

  const deleteEventograma = async (id: string) => {
    const ok = await deleteRow("eventogramas", id);
    if (ok) { await load(); toast.success("Eventograma removido!"); }
    return ok;
  };

  return (
    <EventogramasContext.Provider value={{ eventogramas, loading, addEventograma, updateEventograma, deleteEventograma, refresh: load }}>
      {children}
    </EventogramasContext.Provider>
  );
}
