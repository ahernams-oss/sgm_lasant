import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";

export type StatusPagar = "aberta" | "paga" | "parcial" | "cancelada";
export type StatusReceber = "aberta" | "recebida" | "parcial" | "cancelada";

export interface ContaBancaria {
  id: string;
  nome: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  tipo: "corrente" | "poupanca" | "caixa" | "cartao";
  saldo_inicial: number;
  ativo: boolean;
  observacao?: string;
}

export interface PlanoConta {
  id: string;
  codigo?: string;
  nome: string;
  tipo: "receita" | "despesa";
  parent_id?: string | null;
  ativo: boolean;
}

export interface CentroCusto {
  id: string;
  codigo?: string;
  nome: string;
  cliente_id?: string | null;
  ativo: boolean;
}

export interface ContaPagar {
  id: string;
  descricao: string;
  fornecedor_id?: string | null;
  fornecedor_nome?: string;
  valor_total: number;
  valor_pago: number;
  data_emissao?: string | null;
  data_vencimento: string;
  data_pagamento?: string | null;
  conta_bancaria_id?: string | null;
  plano_conta_id?: string | null;
  centro_custo_id?: string | null;
  status: StatusPagar;
  parcela_num: number;
  parcela_total: number;
  recorrencia?: any;
  anexo_url?: string;
  anexo_nome?: string;
  observacao?: string;
  pedido_compra_id?: string | null;
  origem?: string;
  created_at?: string;
}

export interface ContaReceber {
  id: string;
  descricao: string;
  cliente_id?: string | null;
  cliente_nome?: string;
  valor_total: number;
  valor_recebido: number;
  data_emissao?: string | null;
  data_vencimento: string;
  data_recebimento?: string | null;
  conta_bancaria_id?: string | null;
  plano_conta_id?: string | null;
  centro_custo_id?: string | null;
  status: StatusReceber;
  parcela_num: number;
  parcela_total: number;
  anexo_url?: string;
  anexo_nome?: string;
  observacao?: string;
  contrato_id?: string | null;
  faturamento_id?: string | null;
  origem?: string;
  created_at?: string;
}

export interface Lancamento {
  id: string;
  tipo: "entrada" | "saida" | "transferencia";
  conta_bancaria_id: string;
  conta_destino_id?: string | null;
  valor: number;
  data: string;
  descricao?: string;
  conta_pagar_id?: string | null;
  conta_receber_id?: string | null;
  plano_conta_id?: string | null;
  centro_custo_id?: string | null;
  conciliado: boolean;
  anexos?: { url: string; nome: string }[];
}

export interface MovimentoOfx {
  id: string;
  conta_bancaria_id: string;
  fitid: string;
  data: string;
  valor: number;
  descricao?: string;
  conciliado: boolean;
  lancamento_id?: string | null;
}

interface Ctx {
  loading: boolean;
  contasBancarias: ContaBancaria[];
  planoContas: PlanoConta[];
  centrosCusto: CentroCusto[];
  contasPagar: ContaPagar[];
  contasReceber: ContaReceber[];
  lancamentos: Lancamento[];
  movimentosOfx: MovimentoOfx[];
  reload: () => Promise<void>;
  // CRUD
  addContaBancaria: (c: Omit<ContaBancaria, "id">) => Promise<ContaBancaria | null>;
  updateContaBancaria: (id: string, c: Partial<ContaBancaria>) => Promise<void>;
  deleteContaBancaria: (id: string) => Promise<void>;
  addPlanoConta: (c: Omit<PlanoConta, "id">) => Promise<void>;
  updatePlanoConta: (id: string, c: Partial<PlanoConta>) => Promise<void>;
  deletePlanoConta: (id: string) => Promise<void>;
  addCentroCusto: (c: Omit<CentroCusto, "id">) => Promise<void>;
  updateCentroCusto: (id: string, c: Partial<CentroCusto>) => Promise<void>;
  deleteCentroCusto: (id: string) => Promise<void>;
  addContaPagar: (c: Omit<ContaPagar, "id">) => Promise<ContaPagar | null>;
  updateContaPagar: (id: string, c: Partial<ContaPagar>) => Promise<void>;
  deleteContaPagar: (id: string) => Promise<void>;
  addContaReceber: (c: Omit<ContaReceber, "id">) => Promise<ContaReceber | null>;
  updateContaReceber: (id: string, c: Partial<ContaReceber>) => Promise<void>;
  deleteContaReceber: (id: string) => Promise<void>;
  addLancamento: (c: Omit<Lancamento, "id">) => Promise<Lancamento | null>;
  deleteLancamento: (id: string) => Promise<void>;
  addMovimentoOfx: (m: Omit<MovimentoOfx, "id">) => Promise<void>;
  updateMovimentoOfx: (id: string, m: Partial<MovimentoOfx>) => Promise<void>;
  // helpers
  saldoConta: (contaId: string) => number;
}

const FinanceiroContext = createContext<Ctx | undefined>(undefined);

export function FinanceiroProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [planoContas, setPlanoContas] = useState<PlanoConta[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [movimentosOfx, setMovimentosOfx] = useState<MovimentoOfx[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    const [cb, pc, cc, cp, cr, ln, ofx] = await Promise.all([
      fetchAll("fin_contas_bancarias", "nome"),
      fetchAll("fin_plano_contas", "codigo"),
      fetchAll("fin_centros_custo", "nome"),
      fetchAll("fin_contas_pagar", "data_vencimento"),
      fetchAll("fin_contas_receber", "data_vencimento"),
      fetchAll("fin_lancamentos", "data"),
      fetchAll("fin_movimentos_ofx", "data"),
    ]);
    setContasBancarias(cb);
    setPlanoContas(pc);
    setCentrosCusto(cc);
    setContasPagar(cp);
    setContasReceber(cr);
    setLancamentos(ln);
    setMovimentosOfx(ofx);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const wrap = <T extends { id: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>) => ({
    add: async (table: string, row: any) => {
      const created = await insertRow(table, row);
      if (created) setter((prev) => [...prev, created]);
      return created as T | null;
    },
    update: async (table: string, id: string, row: any) => {
      const ok = await updateRow(table, id, row);
      if (ok) setter((prev) => prev.map((p) => (p.id === id ? { ...p, ...row } : p)));
    },
    remove: async (table: string, id: string) => {
      const ok = await deleteRow(table, id);
      if (ok) setter((prev) => prev.filter((p) => p.id !== id));
    },
  });

  const cb = wrap(setContasBancarias);
  const pc = wrap(setPlanoContas);
  const cc = wrap(setCentrosCusto);
  const cp = wrap(setContasPagar);
  const cr = wrap(setContasReceber);
  const ln = wrap(setLancamentos);
  const ofx = wrap(setMovimentosOfx);

  const saldoConta = (contaId: string) => {
    const conta = contasBancarias.find((c) => c.id === contaId);
    if (!conta) return 0;
    let s = Number(conta.saldo_inicial) || 0;
    lancamentos.forEach((l) => {
      if (l.conta_bancaria_id === contaId) {
        if (l.tipo === "entrada") s += Number(l.valor);
        else if (l.tipo === "saida") s -= Number(l.valor);
        else if (l.tipo === "transferencia") s -= Number(l.valor);
      }
      if (l.tipo === "transferencia" && l.conta_destino_id === contaId) {
        s += Number(l.valor);
      }
    });
    return s;
  };

  return (
    <FinanceiroContext.Provider
      value={{
        loading, contasBancarias, planoContas, centrosCusto,
        contasPagar, contasReceber, lancamentos, movimentosOfx, reload,
        addContaBancaria: (r) => cb.add("fin_contas_bancarias", r) as Promise<ContaBancaria | null>,
        updateContaBancaria: (id, r) => cb.update("fin_contas_bancarias", id, r),
        deleteContaBancaria: (id) => cb.remove("fin_contas_bancarias", id),
        addPlanoConta: (r) => pc.add("fin_plano_contas", r).then(() => undefined),
        updatePlanoConta: (id, r) => pc.update("fin_plano_contas", id, r),
        deletePlanoConta: (id) => pc.remove("fin_plano_contas", id),
        addCentroCusto: (r) => cc.add("fin_centros_custo", r).then(() => undefined),
        updateCentroCusto: (id, r) => cc.update("fin_centros_custo", id, r),
        deleteCentroCusto: (id) => cc.remove("fin_centros_custo", id),
        addContaPagar: (r) => cp.add("fin_contas_pagar", r) as Promise<ContaPagar | null>,
        updateContaPagar: (id, r) => cp.update("fin_contas_pagar", id, r),
        deleteContaPagar: (id) => cp.remove("fin_contas_pagar", id),
        addContaReceber: (r) => cr.add("fin_contas_receber", r) as Promise<ContaReceber | null>,
        updateContaReceber: (id, r) => cr.update("fin_contas_receber", id, r),
        deleteContaReceber: (id) => cr.remove("fin_contas_receber", id),
        addLancamento: (r) => ln.add("fin_lancamentos", r) as Promise<Lancamento | null>,
        deleteLancamento: (id) => ln.remove("fin_lancamentos", id),
        addMovimentoOfx: (r) => ofx.add("fin_movimentos_ofx", r).then(() => undefined),
        updateMovimentoOfx: (id, r) => ofx.update("fin_movimentos_ofx", id, r),
        saldoConta,
      }}
    >
      {children}
    </FinanceiroContext.Provider>
  );
}

export function useFinanceiro() {
  const ctx = useContext(FinanceiroContext);
  if (!ctx) throw new Error("useFinanceiro deve ser usado dentro de FinanceiroProvider");
  return ctx;
}

export const formatBRL = (v: number) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatDate = (d?: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

export const isVencida = (c: { data_vencimento: string; status: string }) => {
  if (c.status !== "aberta" && c.status !== "parcial") return false;
  return new Date(c.data_vencimento + "T23:59:59") < new Date();
};
