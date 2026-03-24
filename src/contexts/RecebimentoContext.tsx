import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePedidoCompra } from "@/contexts/PedidoCompraContext";
import { useRequisicaoCompras } from "@/contexts/RequisicaoComprasContext";

export interface ItemRecebimento {
  itemId: string;
  descricao: string;
  quantidadePedida: number;
  quantidadeRecebida: number;
  unidadeMedida: string;
  observacao: string;
}

export interface Recebimento {
  id: string;
  pedidoId: string;
  pedidoNumero: number;
  requisicaoId: string;
  requisicaoNumero: number;
  fornecedorNome: string;
  localEntrega: string;
  dataRecebimento: string;
  usuario: string;
  itens: ItemRecebimento[];
  observacaoGeral: string;
  tipo: "Total" | "Parcial";
  notaFiscal: string;
}

interface RecebimentoContextType {
  recebimentos: Recebimento[];
  registrarRecebimento: (data: Omit<Recebimento, "id" | "dataRecebimento" | "tipo">) => void;
  getRecebimentosByPedido: (pedidoId: string) => Recebimento[];
  getTotalRecebidoPorItem: (pedidoId: string, itemId: string) => number;
}

const RecebimentoContext = createContext<RecebimentoContextType | undefined>(undefined);

export function RecebimentoProvider({ children }: { children: ReactNode }) {
  const { pedidos, updateStatus: updatePedidoStatus } = usePedidoCompra();
  const { requisicoes, updateStatus: updateReqStatus } = useRequisicaoCompras();

  const [recebimentos, setRecebimentos] = useState<Recebimento[]>(() => {
    const saved = localStorage.getItem("recebimentos_compras");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("recebimentos_compras", JSON.stringify(recebimentos));
  }, [recebimentos]);

  const getRecebimentosByPedido = (pedidoId: string) =>
    recebimentos.filter(r => r.pedidoId === pedidoId);

  const getTotalRecebidoPorItem = (pedidoId: string, itemId: string) => {
    return recebimentos
      .filter(r => r.pedidoId === pedidoId)
      .reduce((sum, r) => {
        const item = r.itens.find(i => i.itemId === itemId);
        return sum + (item?.quantidadeRecebida || 0);
      }, 0);
  };

  const registrarRecebimento = (data: Omit<Recebimento, "id" | "dataRecebimento" | "tipo">) => {
    const pedido = pedidos.find(p => p.id === data.pedidoId);
    if (!pedido) return;

    // Calculate if this is total or partial
    const allFullyReceived = pedido.itens.every(pi => {
      const jaRecebido = getTotalRecebidoPorItem(pedido.id, pi.itemId);
      const recebendoAgora = data.itens.find(i => i.itemId === pi.itemId)?.quantidadeRecebida || 0;
      return (jaRecebido + recebendoAgora) >= pi.quantidade;
    });

    const tipo = allFullyReceived ? "Total" : "Parcial";

    const recebimento: Recebimento = {
      ...data,
      id: crypto.randomUUID(),
      dataRecebimento: new Date().toISOString(),
      tipo,
    };

    setRecebimentos(prev => [...prev, recebimento]);

    // Update pedido status
    if (allFullyReceived) {
      updatePedidoStatus(pedido.id, "Entregue", data.usuario, `Recebimento total - NF: ${data.notaFiscal || "N/A"}`);
    } else {
      if (pedido.status !== "Entregue Parcial") {
        updatePedidoStatus(pedido.id, "Entregue Parcial", data.usuario, `Recebimento parcial - NF: ${data.notaFiscal || "N/A"}`);
      }
    }

    // Update RC status
    if (allFullyReceived) {
      // Check if all pedidos for this RC are delivered
      const pedidosRC = pedidos.filter(p => p.requisicaoId === pedido.requisicaoId);
      const allPedidosEntregues = pedidosRC.every(p => {
        if (p.id === pedido.id) return true; // This one will be "Entregue"
        return p.status === "Entregue";
      });

      if (allPedidosEntregues) {
        updateReqStatus(pedido.requisicaoId, "Recebida", data.usuario, "Todos os pedidos recebidos");
      } else {
        updateReqStatus(pedido.requisicaoId, "Recebida Parcial", data.usuario, "Recebimento parcial de pedidos");
      }
    } else {
      const req = requisicoes.find(r => r.id === pedido.requisicaoId);
      if (req && req.status !== "Recebida Parcial" && req.status !== "Recebida") {
        updateReqStatus(pedido.requisicaoId, "Recebida Parcial", data.usuario, "Recebimento parcial iniciado");
      }
    }
  };

  return (
    <RecebimentoContext.Provider value={{ recebimentos, registrarRecebimento, getRecebimentosByPedido, getTotalRecebidoPorItem }}>
      {children}
    </RecebimentoContext.Provider>
  );
}

export function useRecebimento() {
  const ctx = useContext(RecebimentoContext);
  if (!ctx) throw new Error("useRecebimento must be used within RecebimentoProvider");
  return ctx;
}
