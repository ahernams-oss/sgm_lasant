import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type StatusCotacao = "Em Andamento" | "Aguardando Aprovação" | "Finalizada" | "Cancelada";

export interface ItemCotacaoFornecedor {
  itemId: string;
  descricao: string;
  quantidade: number;
  unidadeMedida: string;
  precoUnitario: number;
  prazoEntrega: string;
  observacao: string;
}

export interface PropostaFornecedor {
  id: string;
  fornecedorId: string;
  fornecedorNome: string;
  condicaoPagamento: string;
  prazoEntrega: string;
  validadeProposta: string;
  observacao: string;
  itens: ItemCotacaoFornecedor[];
  valorTotal: number;
}

export interface ItemVencedor {
  itemId: string;
  fornecedorId: string;
  fornecedorNome: string;
}

export interface CotacaoCompras {
  id: string;
  requisicaoId: string;
  requisicaoNumero: number;
  numero: number;
  dataCriacao: string;
  comprador: string;
  status: StatusCotacao;
  propostas: PropostaFornecedor[];
  fornecedorVencedorId: string;
  justificativaEscolha: string;
  itensVencedores: ItemVencedor[];
}

interface CotacaoComprasContextType {
  cotacoes: CotacaoCompras[];
  addCotacao: (data: Omit<CotacaoCompras, "id" | "numero" | "dataCriacao" | "status" | "propostas" | "fornecedorVencedorId" | "justificativaEscolha" | "itensVencedores">) => CotacaoCompras;
  addProposta: (cotacaoId: string, proposta: Omit<PropostaFornecedor, "id" | "valorTotal">) => void;
  removeProposta: (cotacaoId: string, propostaId: string) => void;
  submeterAprovacao: (cotacaoId: string) => void;
  aprovarCotacao: (cotacaoId: string, fornecedorVencedorId: string, justificativa: string, itensVencedores?: ItemVencedor[]) => void;
  finalizarCotacao: (cotacaoId: string, fornecedorVencedorId: string, justificativa: string, itensVencedores?: ItemVencedor[]) => void;
  cancelarCotacao: (cotacaoId: string) => void;
  getCotacaoByRequisicao: (requisicaoId: string) => CotacaoCompras | undefined;
}

const CotacaoComprasContext = createContext<CotacaoComprasContextType | undefined>(undefined);

export function CotacaoComprasProvider({ children }: { children: ReactNode }) {
  const [cotacoes, setCotacoes] = useState<CotacaoCompras[]>(() => {
    const saved = localStorage.getItem("cotacoes_compras");
    return saved ? JSON.parse(saved) : [];
  });

  const [nextNumero, setNextNumero] = useState(() => {
    const saved = localStorage.getItem("cotacoes_compras");
    if (!saved) return 1;
    const list: CotacaoCompras[] = JSON.parse(saved);
    return list.length > 0 ? Math.max(...list.map(c => c.numero)) + 1 : 1;
  });

  useEffect(() => { localStorage.setItem("cotacoes_compras", JSON.stringify(cotacoes)); }, [cotacoes]);

  const addCotacao = (data: Omit<CotacaoCompras, "id" | "numero" | "dataCriacao" | "status" | "propostas" | "fornecedorVencedorId" | "justificativaEscolha" | "itensVencedores">) => {
    const cot: CotacaoCompras = {
      ...data,
      id: crypto.randomUUID(),
      numero: nextNumero,
      dataCriacao: new Date().toISOString(),
      status: "Em Andamento",
      propostas: [],
      fornecedorVencedorId: "",
      justificativaEscolha: "",
      itensVencedores: [],
    };
    setCotacoes(prev => [...prev, cot]);
    setNextNumero(n => n + 1);
    return cot;
  };

  const addProposta = (cotacaoId: string, proposta: Omit<PropostaFornecedor, "id" | "valorTotal">) => {
    setCotacoes(prev => prev.map(c => {
      if (c.id !== cotacaoId || c.status !== "Em Andamento") return c;
      const valorTotal = proposta.itens.reduce((sum, i) => sum + i.precoUnitario * i.quantidade, 0);
      return { ...c, propostas: [...c.propostas, { ...proposta, id: crypto.randomUUID(), valorTotal }] };
    }));
  };

  const removeProposta = (cotacaoId: string, propostaId: string) => {
    setCotacoes(prev => prev.map(c => {
      if (c.id !== cotacaoId || c.status !== "Em Andamento") return c;
      return { ...c, propostas: c.propostas.filter(p => p.id !== propostaId) };
    }));
  };

  const submeterAprovacao = (cotacaoId: string) => {
    setCotacoes(prev => prev.map(c => {
      if (c.id !== cotacaoId || c.status !== "Em Andamento") return c;
      return { ...c, status: "Aguardando Aprovação" as StatusCotacao };
    }));
  };

  const aprovarCotacao = (cotacaoId: string, fornecedorVencedorId: string, justificativa: string, itensVencedores?: ItemVencedor[]) => {
    setCotacoes(prev => prev.map(c => {
      if (c.id !== cotacaoId) return c;
      return { ...c, status: "Finalizada" as StatusCotacao, fornecedorVencedorId, justificativaEscolha: justificativa, itensVencedores: itensVencedores || [] };
    }));
  };

  const finalizarCotacao = (cotacaoId: string, fornecedorVencedorId: string, justificativa: string, itensVencedores?: ItemVencedor[]) => {
    setCotacoes(prev => prev.map(c => {
      if (c.id !== cotacaoId) return c;
      return { ...c, status: "Finalizada" as StatusCotacao, fornecedorVencedorId, justificativaEscolha: justificativa, itensVencedores: itensVencedores || [] };
    }));
  };

  const cancelarCotacao = (cotacaoId: string) => {
    setCotacoes(prev => prev.map(c => c.id === cotacaoId ? { ...c, status: "Cancelada" as StatusCotacao } : c));
  };

  const getCotacaoByRequisicao = (requisicaoId: string) => cotacoes.find(c => c.requisicaoId === requisicaoId);

  return (
    <CotacaoComprasContext.Provider value={{ cotacoes, addCotacao, addProposta, removeProposta, submeterAprovacao, aprovarCotacao, finalizarCotacao, cancelarCotacao, getCotacaoByRequisicao }}>
      {children}
    </CotacaoComprasContext.Provider>
  );
}

export function useCotacaoCompras() {
  const ctx = useContext(CotacaoComprasContext);
  if (!ctx) throw new Error("useCotacaoCompras must be used within CotacaoComprasProvider");
  return ctx;
}
