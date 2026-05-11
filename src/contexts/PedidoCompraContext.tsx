import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow } from "@/lib/supabaseHelper";
import { gerarContasPagarDePC } from "@/lib/financeiroFromPC";

export type StatusPedido = "Emitido" | "Comprado" | "Em Entrega" | "Entregue Parcial" | "Entregue" | "Cancelado";

export interface ItemPedidoCompra {
  itemId: string; descricao: string; quantidade: number; unidadeMedida: string;
  precoUnitario: number; valorTotal: number;
}
export interface HistoricoPedido { status: StatusPedido; dataHora: string; usuario: string; observacao: string; }

export interface PedidoCompra {
  id: string; numero: number; cotacaoId: string; requisicaoId: string;
  requisicaoNumero: number; dataCriacao: string; comprador: string;
  fornecedorId: string; fornecedorNome: string; itens: ItemPedidoCompra[];
  condicaoPagamento: string; prazoEntrega: string; localEntrega: string;
  observacoes: string; valorTotal: number; status: StatusPedido;
  historicoStatus: HistoricoPedido[];
}

interface PedidoCompraContextType {
  pedidos: PedidoCompra[];
  addPedido: (data: Omit<PedidoCompra, "id" | "numero" | "dataCriacao" | "status" | "historicoStatus" | "valorTotal">) => PedidoCompra;
  updateStatus: (id: string, status: StatusPedido, usuario: string, observacao?: string) => void;
  cancelarPedido: (id: string, usuario: string, motivo: string) => void;
}

const PedidoCompraContext = createContext<PedidoCompraContextType | undefined>(undefined);

const rowToPedido = (r: any): PedidoCompra => ({
  id: r.id, numero: r.numero ?? 0, cotacaoId: r.cotacao_id ?? "",
  requisicaoId: r.requisicao_id ?? "", requisicaoNumero: r.requisicao_numero ?? 0,
  dataCriacao: r.data_criacao ?? "", comprador: r.comprador ?? "",
  fornecedorId: r.fornecedor_id ?? "", fornecedorNome: r.fornecedor_nome ?? "",
  itens: r.itens ?? [], condicaoPagamento: r.condicao_pagamento ?? "",
  prazoEntrega: r.prazo_entrega ?? "", localEntrega: r.local_entrega ?? "",
  observacoes: r.observacoes ?? "", valorTotal: Number(r.valor_total) || 0,
  status: r.status ?? "Emitido", historicoStatus: r.historico_status ?? [],
});

const pedidoToRow = (p: PedidoCompra) => ({
  numero: p.numero, cotacao_id: p.cotacaoId, requisicao_id: p.requisicaoId,
  requisicao_numero: p.requisicaoNumero, data_criacao: p.dataCriacao,
  comprador: p.comprador, fornecedor_id: p.fornecedorId, fornecedor_nome: p.fornecedorNome,
  itens: p.itens as any, condicao_pagamento: p.condicaoPagamento,
  prazo_entrega: p.prazoEntrega, local_entrega: p.localEntrega,
  observacoes: p.observacoes, valor_total: p.valorTotal,
  status: p.status, historico_status: p.historicoStatus as any,
});

export function PedidoCompraProvider({ children }: { children: ReactNode }) {
  const [pedidos, setPedidos] = useState<PedidoCompra[]>([]);

  const load = useCallback(async () => {
    const data = await fetchAll("pedidos_compra", "created_at");
    setPedidos(data.map(rowToPedido));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addPedido = (data: Omit<PedidoCompra, "id" | "numero" | "dataCriacao" | "status" | "historicoStatus" | "valorTotal">) => {
    const now = new Date().toISOString();
    const valorTotal = data.itens.reduce((sum, i) => sum + i.valorTotal, 0);
    const maxNum = pedidos.length > 0 ? Math.max(...pedidos.map(p => p.numero)) : 0;
    const pedido: PedidoCompra = {
      ...data, id: crypto.randomUUID(), numero: maxNum + 1, dataCriacao: now,
      valorTotal, status: "Emitido",
      historicoStatus: [{ status: "Emitido", dataHora: now, usuario: data.comprador, observacao: "Pedido emitido" }],
    };
    insertRow("pedidos_compra", pedidoToRow(pedido)).then(() => load());
    return pedido;
  };

  const updateStatus = async (id: string, status: StatusPedido, usuario: string, observacao = "") => {
    const current = pedidos.find(p => p.id === id);
    if (!current) return;
    const updated = {
      ...current, status,
      historicoStatus: [...current.historicoStatus, { status, dataHora: new Date().toISOString(), usuario, observacao }],
    };
    await updateRow("pedidos_compra", id, pedidoToRow(updated));
    await load();
  };

  const cancelarPedido = (id: string, usuario: string, motivo: string) => {
    updateStatus(id, "Cancelado", usuario, motivo);
  };

  return (
    <PedidoCompraContext.Provider value={{ pedidos, addPedido, updateStatus, cancelarPedido }}>
      {children}
    </PedidoCompraContext.Provider>
  );
}

export function usePedidoCompra() {
  const ctx = useContext(PedidoCompraContext);
  if (!ctx) throw new Error("usePedidoCompra must be used within PedidoCompraProvider");
  return ctx;
}
