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

export interface AnexoNF {
  nome: string;
  tipo: string;
  dados: string; // base64
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
  anexosNF: AnexoNF[];
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

    // Calculate if THIS pedido is fully received after this receipt
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

    setRecebimentos(prev => {
      const updatedRecebimentos = [...prev, recebimento];

      // Update ONLY this pedido's status — never touch other pedidos
      if (allFullyReceived) {
        updatePedidoStatus(pedido.id, "Entregue", data.usuario, `Recebimento total - NF: ${data.notaFiscal || "N/A"}`);
      } else {
        if (pedido.status !== "Entregue Parcial") {
          updatePedidoStatus(pedido.id, "Entregue Parcial", data.usuario, `Recebimento parcial - NF: ${data.notaFiscal || "N/A"}`);
        }
      }

      // Update RC status based on ACTUAL receipts across ALL pedidos of this RC
      const pedidosRC = pedidos.filter(p => p.requisicaoId === pedido.requisicaoId && p.status !== "Cancelado");

      // Check each PO: is it fully received based on actual recebimentos?
      const pedidoStatusMap = pedidosRC.map(p => {
        const isCurrentPedido = p.id === pedido.id;
        const fullyReceived = p.itens.every(pi => {
          const jaRecebido = updatedRecebimentos
            .filter(r => r.pedidoId === p.id)
            .reduce((sum, r) => {
              const item = r.itens.find(i => i.itemId === pi.itemId);
              return sum + (item?.quantidadeRecebida || 0);
            }, 0);
          return jaRecebido >= pi.quantidade;
        });

        const hasAnyReceipt = updatedRecebimentos.some(r => r.pedidoId === p.id);

        return { pedidoId: p.id, fullyReceived, hasAnyReceipt };
      });

      const allPedidosFullyReceived = pedidoStatusMap.every(s => s.fullyReceived);
      const anyPedidoHasReceipt = pedidoStatusMap.some(s => s.hasAnyReceipt);

      if (allPedidosFullyReceived) {
        updateReqStatus(pedido.requisicaoId, "Recebida", data.usuario, "Todos os pedidos de todos os fornecedores recebidos");
      } else if (anyPedidoHasReceipt) {
        const req = requisicoes.find(r => r.id === pedido.requisicaoId);
        if (req && req.status !== "Recebida") {
          updateReqStatus(pedido.requisicaoId, "Recebida Parcial", data.usuario, "Recebimento parcial - nem todos os fornecedores entregaram");
        }
      }

      return updatedRecebimentos;
    });
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
