import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow } from "@/lib/supabaseHelper";

export interface MovimentacaoEstoque {
  id: string;
  materialId: string;
  materialCodigo: string;
  materialDescricao: string;
  tipo: "entrada" | "saida" | "ajuste";
  quantidade: number;
  local: string;
  documentoRef: string;
  observacao: string;
  usuario: string;
  dataMovimentacao: string;
  lote: string;
  validade: string;
  depositoOrigem: string;
  depositoDestino: string;
  fornecedorNome: string;
  valorUnitario: number;
}

export interface ItemInventario {
  materialId: string;
  materialCodigo: string;
  materialDescricao: string;
  saldoSistema: number;
  quantidadeContada: number;
  diferenca: number;
  observacao: string;
}

export interface Inventario {
  id: string;
  dataInventario: string;
  local: string;
  status: "Aberto" | "Fechado";
  itens: ItemInventario[];
  usuario: string;
  observacao: string;
}

export interface SaldoEstoque {
  materialId: string;
  materialCodigo: string;
  materialDescricao: string;
  local: string;
  quantidade: number;
}

interface EstoqueContextType {
  movimentacoes: MovimentacaoEstoque[];
  inventarios: Inventario[];
  registrarMovimentacao: (data: Omit<MovimentacaoEstoque, "id" | "dataMovimentacao">) => Promise<void>;
  registrarEntradaRecebimento: (itens: { materialId: string; materialCodigo: string; materialDescricao: string; quantidade: number; unidadeMedida: string }[], local: string, documentoRef: string, usuario: string) => Promise<void>;
  getSaldos: () => SaldoEstoque[];
  getSaldoPorMaterial: (materialId: string) => number;
  getSaldoPorLocal: (materialId: string, local: string) => number;
  criarInventario: (data: Omit<Inventario, "id" | "dataInventario" | "status">) => Promise<void>;
  atualizarInventario: (id: string, itens: ItemInventario[], observacao: string) => Promise<void>;
  fecharInventario: (id: string, usuario: string) => Promise<void>;
  reload: () => Promise<void>;
}

const EstoqueContext = createContext<EstoqueContextType | undefined>(undefined);

const rowToMov = (r: any): MovimentacaoEstoque => ({
  id: r.id, materialId: r.material_id ?? "", materialCodigo: r.material_codigo ?? "",
  materialDescricao: r.material_descricao ?? "", tipo: r.tipo ?? "entrada",
  quantidade: Number(r.quantidade ?? 0), local: r.local ?? "",
  documentoRef: r.documento_ref ?? "", observacao: r.observacao ?? "",
  usuario: r.usuario ?? "", dataMovimentacao: r.data_movimentacao ?? "",
  lote: r.lote ?? "", validade: r.validade ?? "",
  depositoOrigem: r.deposito_origem ?? "", depositoDestino: r.deposito_destino ?? "",
  fornecedorNome: r.fornecedor_nome ?? "",
});

const rowToInv = (r: any): Inventario => ({
  id: r.id, dataInventario: r.data_inventario ?? "", local: r.local ?? "",
  status: r.status ?? "Aberto", itens: r.itens ?? [], usuario: r.usuario ?? "",
  observacao: r.observacao ?? "",
});

export function EstoqueProvider({ children }: { children: ReactNode }) {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [inventarios, setInventarios] = useState<Inventario[]>([]);

  const load = useCallback(async () => {
    const [movData, invData] = await Promise.all([
      fetchAll("estoque_movimentacoes", "created_at"),
      fetchAll("estoque_inventarios", "created_at"),
    ]);
    setMovimentacoes(movData.map(rowToMov));
    setInventarios(invData.map(rowToInv));
  }, []);

  useEffect(() => { load(); }, [load]);

  const registrarMovimentacao = async (data: Omit<MovimentacaoEstoque, "id" | "dataMovimentacao">) => {
    await insertRow("estoque_movimentacoes", {
      material_id: data.materialId, material_codigo: data.materialCodigo,
      material_descricao: data.materialDescricao, tipo: data.tipo,
      quantidade: data.quantidade, local: data.local,
      documento_ref: data.documentoRef, observacao: data.observacao,
      usuario: data.usuario, data_movimentacao: new Date().toISOString(),
      lote: data.lote || "", validade: data.validade || null,
      deposito_origem: data.depositoOrigem || "", deposito_destino: data.depositoDestino || "",
      fornecedor_nome: data.fornecedorNome || "",
    });
    await load();
  };

  const registrarEntradaRecebimento = async (
    itens: { materialId: string; materialCodigo: string; materialDescricao: string; quantidade: number; unidadeMedida: string }[],
    local: string, documentoRef: string, usuario: string
  ) => {
    for (const item of itens) {
      if (item.quantidade > 0) {
        await insertRow("estoque_movimentacoes", {
          material_id: item.materialId, material_codigo: item.materialCodigo,
          material_descricao: item.materialDescricao, tipo: "entrada",
          quantidade: item.quantidade, local,
          documento_ref: documentoRef, observacao: "Entrada automática via recebimento",
          usuario, data_movimentacao: new Date().toISOString(),
        });
      }
    }
    await load();
  };

  const getSaldos = useCallback((): SaldoEstoque[] => {
    const map = new Map<string, SaldoEstoque>();
    for (const m of movimentacoes) {
      const key = `${m.materialId}__${m.local}`;
      if (!map.has(key)) {
        map.set(key, { materialId: m.materialId, materialCodigo: m.materialCodigo, materialDescricao: m.materialDescricao, local: m.local, quantidade: 0 });
      }
      const s = map.get(key)!;
      if (m.tipo === "entrada") s.quantidade += m.quantidade;
      else if (m.tipo === "saida") s.quantidade -= m.quantidade;
      else s.quantidade += m.quantidade; // ajuste pode ser +/-
    }
    return Array.from(map.values()).filter(s => s.quantidade !== 0);
  }, [movimentacoes]);

  const getSaldoPorMaterial = useCallback((materialId: string): number => {
    return movimentacoes
      .filter(m => m.materialId === materialId)
      .reduce((sum, m) => {
        if (m.tipo === "entrada") return sum + m.quantidade;
        if (m.tipo === "saida") return sum - m.quantidade;
        return sum + m.quantidade;
      }, 0);
  }, [movimentacoes]);

  const getSaldoPorLocal = useCallback((materialId: string, local: string): number => {
    return movimentacoes
      .filter(m => m.materialId === materialId && m.local === local)
      .reduce((sum, m) => {
        if (m.tipo === "entrada") return sum + m.quantidade;
        if (m.tipo === "saida") return sum - m.quantidade;
        return sum + m.quantidade;
      }, 0);
  }, [movimentacoes]);

  const criarInventario = async (data: Omit<Inventario, "id" | "dataInventario" | "status">) => {
    await insertRow("estoque_inventarios", {
      data_inventario: new Date().toISOString(), local: data.local,
      status: "Aberto", itens: data.itens as any, usuario: data.usuario,
      observacao: data.observacao,
    });
    await load();
  };

  const atualizarInventario = async (id: string, itens: ItemInventario[], observacao: string) => {
    await updateRow("estoque_inventarios", id, { itens: itens as any, observacao });
    await load();
  };

  const fecharInventario = async (id: string, usuario: string) => {
    const inv = inventarios.find(i => i.id === id);
    if (!inv) return;
    // Gerar ajustes para cada diferença
    for (const item of inv.itens) {
      const diferenca = item.quantidadeContada - item.saldoSistema;
      if (diferenca !== 0) {
        await insertRow("estoque_movimentacoes", {
          material_id: item.materialId, material_codigo: item.materialCodigo,
          material_descricao: item.materialDescricao, tipo: "ajuste",
          quantidade: diferenca, local: inv.local,
          documento_ref: `Inventário ${inv.dataInventario}`,
          observacao: item.observacao || "Ajuste de inventário",
          usuario, data_movimentacao: new Date().toISOString(),
        });
      }
    }
    await updateRow("estoque_inventarios", id, { status: "Fechado" });
    await load();
  };

  return (
    <EstoqueContext.Provider value={{
      movimentacoes, inventarios, registrarMovimentacao, registrarEntradaRecebimento,
      getSaldos, getSaldoPorMaterial, getSaldoPorLocal, criarInventario, atualizarInventario, fecharInventario, reload: load,
    }}>
      {children}
    </EstoqueContext.Provider>
  );
}

export function useEstoque() {
  const ctx = useContext(EstoqueContext);
  if (!ctx) throw new Error("useEstoque must be used within EstoqueProvider");
  return ctx;
}
