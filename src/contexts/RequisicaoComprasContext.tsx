import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type StatusRequisicaoCompras =
  | "Rascunho"
  | "Enviada"
  | "Em Cotação"
  | "Aguardando Aprovação"
  | "Aprovada"
  | "Reprovada"
  | "Pedido Emitido"
  | "Em Entrega"
  | "Recebida Parcial"
  | "Recebida"
  | "Concluída"
  | "Cancelada";

export type GrauUrgencia = "Baixa" | "Normal" | "Alta" | "Urgente";

export interface ItemRequisicaoCompras {
  id: string;
  materialId: string;
  descricao: string;
  especificacaoTecnica: string;
  observacao: string;
  quantidade: number;
  unidadeMedida: string;
}

export interface HistoricoStatusCompras {
  status: StatusRequisicaoCompras;
  dataHora: string;
  usuario: string;
  observacao: string;
}

export interface AnexoRequisicaoCompras {
  id: string;
  nome: string;
  tipo: string;
  base64: string;
}

export interface RequisicaoCompras {
  id: string;
  numero: number;
  dataCriacao: string;
  solicitante: string;
  centroCusto: string;
  centroCustoNome: string;
  localEntrega: string;
  justificativa: string;
  urgencia: GrauUrgencia;
  prazoDesejado: string;
  status: StatusRequisicaoCompras;
  itens: ItemRequisicaoCompras[];
  anexos: AnexoRequisicaoCompras[];
  historicoStatus: HistoricoStatusCompras[];
}

interface RequisicaoComprasContextType {
  requisicoes: RequisicaoCompras[];
  addRequisicao: (data: Omit<RequisicaoCompras, "id" | "numero" | "dataCriacao" | "status" | "historicoStatus">) => void;
  updateRequisicao: (id: string, data: Partial<Omit<RequisicaoCompras, "id" | "numero" | "dataCriacao">>) => void;
  updateStatus: (id: string, status: StatusRequisicaoCompras, usuario: string, observacao?: string) => void;
  cancelarRequisicao: (id: string, usuario: string, motivo: string) => void;
}

const RequisicaoComprasContext = createContext<RequisicaoComprasContextType | undefined>(undefined);

export function RequisicaoComprasProvider({ children }: { children: ReactNode }) {
  const [requisicoes, setRequisicoes] = useState<RequisicaoCompras[]>(() => {
    const saved = localStorage.getItem("requisicoes_compras");
    return saved ? JSON.parse(saved) : [];
  });

  const [nextNumero, setNextNumero] = useState(() => {
    const saved = localStorage.getItem("requisicoes_compras");
    if (!saved) return 1;
    const list: RequisicaoCompras[] = JSON.parse(saved);
    return list.length > 0 ? Math.max(...list.map(r => r.numero)) + 1 : 1;
  });

  useEffect(() => { localStorage.setItem("requisicoes_compras", JSON.stringify(requisicoes)); }, [requisicoes]);

  const addRequisicao = (data: Omit<RequisicaoCompras, "id" | "numero" | "dataCriacao" | "status" | "historicoStatus">) => {
    const now = new Date().toISOString();
    const req: RequisicaoCompras = {
      ...data,
      id: crypto.randomUUID(),
      numero: nextNumero,
      dataCriacao: now,
      status: "Enviada",
      historicoStatus: [{ status: "Enviada", dataHora: now, usuario: data.solicitante, observacao: "Solicitação criada" }],
    };
    setRequisicoes(prev => [...prev, req]);
    setNextNumero(n => n + 1);
  };

  const updateRequisicao = (id: string, data: Partial<Omit<RequisicaoCompras, "id" | "numero" | "dataCriacao">>) => {
    setRequisicoes(prev => prev.map(r => {
      if (r.id !== id) return r;
      if (!["Rascunho", "Enviada"].includes(r.status)) return r;
      return { ...r, ...data };
    }));
  };

  const updateStatus = (id: string, status: StatusRequisicaoCompras, usuario: string, observacao = "") => {
    setRequisicoes(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        status,
        historicoStatus: [...r.historicoStatus, { status, dataHora: new Date().toISOString(), usuario, observacao }],
      };
    }));
  };

  const cancelarRequisicao = (id: string, usuario: string, motivo: string) => {
    updateStatus(id, "Cancelada", usuario, motivo);
  };

  return (
    <RequisicaoComprasContext.Provider value={{ requisicoes, addRequisicao, updateRequisicao, updateStatus, cancelarRequisicao }}>
      {children}
    </RequisicaoComprasContext.Provider>
  );
}

export function useRequisicaoCompras() {
  const ctx = useContext(RequisicaoComprasContext);
  if (!ctx) throw new Error("useRequisicaoCompras must be used within RequisicaoComprasProvider");
  return ctx;
}
