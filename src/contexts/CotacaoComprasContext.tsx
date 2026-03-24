import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow } from "@/lib/supabaseHelper";

export type StatusCotacao = "Em Andamento" | "Aguardando Aprovação" | "Finalizada" | "Cancelada";

export interface ItemCotacaoFornecedor {
  itemId: string; descricao: string; quantidade: number; unidadeMedida: string;
  precoUnitario: number; prazoEntrega: string; observacao: string;
}
export interface PropostaFornecedor {
  id: string; fornecedorId: string; fornecedorNome: string;
  condicaoPagamento: string; prazoEntrega: string; validadeProposta: string;
  observacao: string; itens: ItemCotacaoFornecedor[]; valorTotal: number;
}
export interface ItemVencedor { itemId: string; fornecedorId: string; fornecedorNome: string; }

export interface CotacaoCompras {
  id: string; requisicaoId: string; requisicaoNumero: number; numero: number;
  dataCriacao: string; comprador: string; status: StatusCotacao;
  propostas: PropostaFornecedor[]; fornecedorVencedorId: string;
  justificativaEscolha: string; itensVencedores: ItemVencedor[];
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

const rowToCotacao = (r: any): CotacaoCompras => ({
  id: r.id, requisicaoId: r.requisicao_id ?? "", requisicaoNumero: r.requisicao_numero ?? 0,
  numero: r.numero ?? 0, dataCriacao: r.data_criacao ?? "", comprador: r.comprador ?? "",
  status: r.status ?? "Em Andamento", propostas: r.propostas ?? [],
  fornecedorVencedorId: r.fornecedor_vencedor_id ?? "",
  justificativaEscolha: r.justificativa_escolha ?? "", itensVencedores: r.itens_vencedores ?? [],
});

const cotacaoToRow = (c: CotacaoCompras) => ({
  requisicao_id: c.requisicaoId, requisicao_numero: c.requisicaoNumero,
  numero: c.numero, data_criacao: c.dataCriacao, comprador: c.comprador,
  status: c.status, propostas: c.propostas as any,
  fornecedor_vencedor_id: c.fornecedorVencedorId,
  justificativa_escolha: c.justificativaEscolha, itens_vencedores: c.itensVencedores as any,
});

export function CotacaoComprasProvider({ children }: { children: ReactNode }) {
  const [cotacoes, setCotacoes] = useState<CotacaoCompras[]>([]);

  const load = useCallback(async () => {
    const data = await fetchAll("cotacoes_compras", "created_at");
    setCotacoes(data.map(rowToCotacao));
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveAndReload = async (id: string, updated: CotacaoCompras) => {
    await updateRow("cotacoes_compras", id, cotacaoToRow(updated));
    await load();
  };

  const addCotacao = (data: Omit<CotacaoCompras, "id" | "numero" | "dataCriacao" | "status" | "propostas" | "fornecedorVencedorId" | "justificativaEscolha" | "itensVencedores">) => {
    const maxNum = cotacoes.length > 0 ? Math.max(...cotacoes.map(c => c.numero)) : 0;
    const cot: CotacaoCompras = {
      ...data, id: crypto.randomUUID(), numero: maxNum + 1,
      dataCriacao: new Date().toISOString(), status: "Em Andamento",
      propostas: [], fornecedorVencedorId: "", justificativaEscolha: "", itensVencedores: [],
    };
    // Fire and forget insert
    insertRow("cotacoes_compras", cotacaoToRow(cot)).then(() => load());
    return cot;
  };

  const addProposta = async (cotacaoId: string, proposta: Omit<PropostaFornecedor, "id" | "valorTotal">) => {
    const c = cotacoes.find(c => c.id === cotacaoId);
    if (!c || c.status !== "Em Andamento") return;
    const valorTotal = proposta.itens.reduce((sum, i) => sum + i.precoUnitario * i.quantidade, 0);
    const updated = { ...c, propostas: [...c.propostas, { ...proposta, id: crypto.randomUUID(), valorTotal }] };
    await saveAndReload(cotacaoId, updated);
  };

  const removeProposta = async (cotacaoId: string, propostaId: string) => {
    const c = cotacoes.find(c => c.id === cotacaoId);
    if (!c || c.status !== "Em Andamento") return;
    await saveAndReload(cotacaoId, { ...c, propostas: c.propostas.filter(p => p.id !== propostaId) });
  };

  const submeterAprovacao = async (cotacaoId: string) => {
    const c = cotacoes.find(c => c.id === cotacaoId);
    if (!c || c.status !== "Em Andamento") return;
    await saveAndReload(cotacaoId, { ...c, status: "Aguardando Aprovação" });
  };

  const aprovarCotacao = async (cotacaoId: string, fornecedorVencedorId: string, justificativa: string, itensVencedores?: ItemVencedor[]) => {
    const c = cotacoes.find(c => c.id === cotacaoId);
    if (!c) return;
    await saveAndReload(cotacaoId, { ...c, status: "Finalizada", fornecedorVencedorId, justificativaEscolha: justificativa, itensVencedores: itensVencedores || [] });
  };

  const finalizarCotacao = async (cotacaoId: string, fornecedorVencedorId: string, justificativa: string, itensVencedores?: ItemVencedor[]) => {
    await aprovarCotacao(cotacaoId, fornecedorVencedorId, justificativa, itensVencedores);
  };

  const cancelarCotacao = async (cotacaoId: string) => {
    const c = cotacoes.find(c => c.id === cotacaoId);
    if (!c) return;
    await saveAndReload(cotacaoId, { ...c, status: "Cancelada" });
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
