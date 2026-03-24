import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type StatusPedido = "Emitido" | "Confirmado" | "Em Entrega" | "Entregue Parcial" | "Entregue" | "Cancelado";

export interface ItemPedidoCompra {
  itemId: string;
  descricao: string;
  quantidade: number;
  unidadeMedida: string;
  precoUnitario: number;
  valorTotal: number;
}

export interface HistoricoPedido {
  status: StatusPedido;
  dataHora: string;
  usuario: string;
  observacao: string;
}

export interface PedidoCompra {
  id: string;
  numero: number;
  cotacaoId: string;
  requisicaoId: string;
  requisicaoNumero: number;
  dataCriacao: string;
  comprador: string;
  fornecedorId: string;
  fornecedorNome: string;
  itens: ItemPedidoCompra[];
  condicaoPagamento: string;
  prazoEntrega: string;
  localEntrega: string;
  observacoes: string;
  valorTotal: number;
  status: StatusPedido;
  historicoStatus: HistoricoPedido[];
}

interface PedidoCompraContextType {
  pedidos: PedidoCompra[];
  addPedido: (data: Omit<PedidoCompra, "id" | "numero" | "dataCriacao" | "status" | "historicoStatus" | "valorTotal">) => PedidoCompra;
  updateStatus: (id: string, status: StatusPedido, usuario: string, observacao?: string) => void;
  cancelarPedido: (id: string, usuario: string, motivo: string) => void;
}

const PedidoCompraContext = createContext<PedidoCompraContextType | undefined>(undefined);

export function PedidoCompraProvider({ children }: { children: ReactNode }) {
  const [pedidos, setPedidos] = useState<PedidoCompra[]>(() => {
    const saved = localStorage.getItem("pedidos_compra");
    return saved ? JSON.parse(saved) : [];
  });

  const [nextNumero, setNextNumero] = useState(() => {
    const saved = localStorage.getItem("pedidos_compra");
    if (!saved) return 1;
    const list: PedidoCompra[] = JSON.parse(saved);
    return list.length > 0 ? Math.max(...list.map(p => p.numero)) + 1 : 1;
  });

  useEffect(() => { localStorage.setItem("pedidos_compra", JSON.stringify(pedidos)); }, [pedidos]);

  const addPedido = (data: Omit<PedidoCompra, "id" | "numero" | "dataCriacao" | "status" | "historicoStatus" | "valorTotal">) => {
    const now = new Date().toISOString();
    const valorTotal = data.itens.reduce((sum, i) => sum + i.valorTotal, 0);
    const pedido: PedidoCompra = {
      ...data,
      id: crypto.randomUUID(),
      numero: nextNumero,
      dataCriacao: now,
      valorTotal,
      status: "Emitido",
      historicoStatus: [{ status: "Emitido", dataHora: now, usuario: data.comprador, observacao: "Pedido emitido" }],
    };
    setPedidos(prev => [...prev, pedido]);
    setNextNumero(n => n + 1);
    return pedido;
  };

  const updateStatus = (id: string, status: StatusPedido, usuario: string, observacao = "") => {
    setPedidos(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, status, historicoStatus: [...p.historicoStatus, { status, dataHora: new Date().toISOString(), usuario, observacao }] };
    }));
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
