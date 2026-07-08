import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, FileSpreadsheet, Boxes, GripVertical } from "lucide-react";
import { useFinanceiro, formatBRL, formatDate } from "@/contexts/FinanceiroContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useFuncionarios } from "@/contexts/FuncionariosContext";
import { useCargos } from "@/contexts/CargosContext";
import { usePedidoCompra } from "@/contexts/PedidoCompraContext";
import { useRequisicaoCompras } from "@/contexts/RequisicaoComprasContext";
import { useOrdensServico } from "@/contexts/OrdensServicoContext";
import { useSolicitacoesServicos } from "@/contexts/SolicitacoesServicosContext";
import { gerarPdfFinanceiro, gerarExcelFinanceiro } from "@/lib/gerarRelatoriosFinanceiros";
import { usePermissao } from "@/hooks/usePermissao";
import { toast } from "sonner";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

type Metric = "count" | "sum";

interface Dimension {
  key: string;
  label: string;
  get: (r: any) => string;
}
interface ValueField {
  key: string;
  label: string;
  get: (r: any) => number;
  format?: (n: number) => string;
}
interface Dataset {
  key: string;
  label: string;
  rows: any[];
  dateField?: (r: any) => string | null | undefined;
  dimensions: Dimension[];
  values: ValueField[];
}

const monthOf = (d?: string | null) => (d ? String(d).slice(0, 7) : "—");
const yearOf = (d?: string | null) => (d ? String(d).slice(0, 4) : "—");

type ZoneId = "available" | "rows" | "cols";
const ZONES: { id: ZoneId; title: string; hint: string }[] = [
  { id: "available", title: "Dimensões Disponíveis", hint: "Arraste para Linhas ou Colunas" },
  { id: "rows", title: "Linhas", hint: "Dimensões empilhadas verticalmente" },
  { id: "cols", title: "Colunas", hint: "Dimensões empilhadas horizontalmente" },
];

function Chip({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 text-xs shadow-sm cursor-grab active:cursor-grabbing select-none hover:bg-muted/50"
    >
      <GripVertical className="h-3 w-3 text-muted-foreground" />
      {label}
    </div>
  );
}

function Zone({
  id,
  title,
  hint,
  items,
  labelOf,
}: {
  id: ZoneId;
  title: string;
  hint: string;
  items: string[];
  labelOf: (k: string) => string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border-2 border-dashed p-3 min-h-[110px] transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-border bg-muted/20",
      )}
    >
      <div className="mb-2">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-[11px] text-muted-foreground">{hint}</div>
      </div>
      <SortableContext items={items} strategy={rectSortingStrategy}>
        <div className="flex flex-wrap gap-1.5">
          {items.length === 0 && (
            <span className="text-xs text-muted-foreground italic">— vazio —</span>
          )}
          {items.map((k) => (
            <Chip key={k} id={`${id}::${k}`} label={labelOf(k)} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function RelatoriosMultidimensional() {
  const { tem } = usePermissao();
  const podePdf = tem("gerencial_multidim.exportar_pdf");
  const podeExcel = tem("gerencial_multidim.exportar_excel");

  const fin = useFinanceiro();
  const { clientes } = useClientes();
  const { funcionarios } = useFuncionarios();
  const { cargos } = useCargos();
  const { pedidos } = usePedidoCompra();
  const { requisicoes } = useRequisicaoCompras();
  const { ordens } = useOrdensServico();
  const { solicitacoes } = useSolicitacoesServicos();

  const cargoNome = (id: string) => cargos.find((c) => c.id === id)?.nome || "—";
  const clienteNome = (id?: string | null) => clientes.find((c) => c.id === id)?.nome || "—";

  const datasets: Dataset[] = useMemo(
    () => [
      {
        key: "os",
        label: "Ordens de Serviço",
        rows: ordens,
        dateField: (r) => r.createdAt,
        dimensions: [
          { key: "cliente", label: "Cliente", get: (r) => r.clienteNome || "—" },
          { key: "situacao", label: "Situação", get: (r) => r.situacao || "—" },
          { key: "prioridade", label: "Prioridade", get: (r) => r.prioridade || "—" },
          { key: "complexidade", label: "Complexidade", get: (r) => r.complexidade || "—" },
          { key: "categoria", label: "Categoria", get: (r) => r.categoria || "—" },
          { key: "tipoOs", label: "Tipo OS", get: (r) => r.tipoOs || "—" },
          { key: "operador", label: "Operador", get: (r) => r.operadorNome || "—" },
          { key: "mes", label: "Mês", get: (r) => monthOf(r.createdAt) },
          { key: "ano", label: "Ano", get: (r) => yearOf(r.createdAt) },
        ],
        values: [
          {
            key: "valor",
            label: "Valor da OS",
            get: (r) => {
              const itens = (r.materiais || []).reduce((s: number, m: any) => s + (Number(m.valorTotal) || 0), 0)
                + (r.materiaisEstoque || []).reduce((s: number, m: any) => s + (Number(m.valorTotal) || 0), 0);
              const bdi = itens * (Number(r.bdi || 0) / 100);
              return itens + bdi;
            },
            format: formatBRL,
          },
          { key: "bdi_pct", label: "BDI (%)", get: (r) => Number(r.bdi || 0) },
          { key: "qtd", label: "Quantidade (contagem)", get: () => 1 },
        ],
      },
      {
        key: "ss",
        label: "Solicitações de Serviço",
        rows: solicitacoes,
        dateField: (r) => r.createdAt,
        dimensions: [
          { key: "cliente", label: "Cliente", get: (r) => r.clienteNome || "—" },
          { key: "tipo", label: "Tipo", get: (r) => r.tipo || "—" },
          { key: "situacao", label: "Situação", get: (r) => r.situacao || "—" },
          { key: "prioridade", label: "Prioridade", get: (r) => r.prioridade || "—" },
          { key: "mes", label: "Mês", get: (r) => monthOf(r.createdAt) },
          { key: "ano", label: "Ano", get: (r) => yearOf(r.createdAt) },
        ],
        values: [],
      },
      {
        key: "pc",
        label: "Pedidos de Compra",
        rows: pedidos,
        dateField: (r) => r.dataCriacao,
        dimensions: [
          { key: "fornecedor", label: "Fornecedor", get: (r) => r.fornecedorNome || "—" },
          { key: "comprador", label: "Comprador", get: (r) => r.comprador || "—" },
          { key: "status", label: "Status", get: (r) => r.status || "—" },
          { key: "condicao", label: "Cond. Pagamento", get: (r) => r.condicaoPagamento || "—" },
          { key: "mes", label: "Mês", get: (r) => monthOf(r.dataCriacao) },
          { key: "ano", label: "Ano", get: (r) => yearOf(r.dataCriacao) },
        ],
        values: [
          { key: "valor", label: "Valor Total", get: (r) => Number(r.valorTotal || 0), format: formatBRL },
        ],
      },
      {
        key: "rc",
        label: "Requisições de Compras",
        rows: requisicoes,
        dateField: (r) => r.dataCriacao,
        dimensions: [
          { key: "centro_custo", label: "Centro de Custo", get: (r) => r.centroCustoNome || "—" },
          { key: "solicitante", label: "Solicitante", get: (r) => r.solicitante || "—" },
          { key: "urgencia", label: "Urgência", get: (r) => r.urgencia || "—" },
          { key: "status", label: "Status", get: (r) => r.status || "—" },
          { key: "mes", label: "Mês", get: (r) => monthOf(r.dataCriacao) },
          { key: "ano", label: "Ano", get: (r) => yearOf(r.dataCriacao) },
        ],
        values: [],
      },
      {
        key: "func",
        label: "Funcionários",
        rows: funcionarios,
        dateField: (r) => r.dataAdmissao,
        dimensions: [
          { key: "cliente", label: "Cliente/Contrato", get: (r) => clienteNome(r.clienteId) },
          { key: "cargo", label: "Cargo", get: (r) => cargoNome(r.cargoId) },
          { key: "status", label: "Status", get: (r) => r.status || "—" },
          { key: "tipoContrato", label: "Tipo Contrato", get: (r) => r.tipoContrato || "—" },
          { key: "sexo", label: "Sexo", get: (r) => r.sexo || "—" },
          { key: "uf", label: "UF", get: (r) => r.uf || "—" },
          { key: "ano_admissao", label: "Ano Admissão", get: (r) => yearOf(r.dataAdmissao) },
        ],
        values: [
          {
            key: "salario",
            label: "Salário",
            get: (r) =>
              Number(String(r.salario || "0").replace(/[^\d,]/g, "").replace(",", ".")) || 0,
            format: formatBRL,
          },
        ],
      },
      {
        key: "cp",
        label: "Contas a Pagar",
        rows: fin.contasPagar,
        dateField: (r) => r.data_vencimento,
        dimensions: [
          { key: "status", label: "Status", get: (r) => r.status || "—" },
          { key: "fornecedor", label: "Fornecedor", get: (r) => r.fornecedor_nome || "—" },
          { key: "centro_custo", label: "Centro de Custo", get: (r) => fin.centrosCusto.find((c) => c.id === r.centro_custo_id)?.nome || "—" },
          { key: "plano", label: "Plano de Contas", get: (r) => fin.planoContas.find((c) => c.id === r.plano_conta_id)?.nome || "—" },
          { key: "mes", label: "Mês (Venc.)", get: (r) => monthOf(r.data_vencimento) },
          { key: "ano", label: "Ano (Venc.)", get: (r) => yearOf(r.data_vencimento) },
        ],
        values: [
          { key: "total", label: "Valor Total", get: (r) => Number(r.valor_total || 0), format: formatBRL },
          { key: "pago", label: "Valor Pago", get: (r) => Number(r.valor_pago || 0), format: formatBRL },
        ],
      },
      {
        key: "cr",
        label: "Contas a Receber",
        rows: fin.contasReceber,
        dateField: (r) => r.data_vencimento,
        dimensions: [
          { key: "status", label: "Status", get: (r) => r.status || "—" },
          { key: "cliente", label: "Cliente", get: (r) => r.cliente_nome || "—" },
          { key: "centro_custo", label: "Centro de Custo", get: (r) => fin.centrosCusto.find((c) => c.id === r.centro_custo_id)?.nome || "—" },
          { key: "plano", label: "Plano de Contas", get: (r) => fin.planoContas.find((c) => c.id === r.plano_conta_id)?.nome || "—" },
          { key: "mes", label: "Mês (Venc.)", get: (r) => monthOf(r.data_vencimento) },
          { key: "ano", label: "Ano (Venc.)", get: (r) => yearOf(r.data_vencimento) },
        ],
        values: [
          { key: "total", label: "Valor Total", get: (r) => Number(r.valor_total || 0), format: formatBRL },
          { key: "recebido", label: "Valor Recebido", get: (r) => Number(r.valor_recebido || 0), format: formatBRL },
        ],
      },
      (() => {
        const parseNum = (v: any) =>
          Number(
            String(v ?? "0")
              .replace(/[^\d,.-]/g, "")
              .replace(/\.(?=\d{3}(\D|$))/g, "")
              .replace(",", "."),
          ) || 0;
        type FRow = {
          clienteNome: string;
          contratoNumero: string;
          periodo: string;
          mes: string;
          ano: string;
          numeroNf: string;
          valorFolha: number;
          valorVariavel: number;
          valorNota: number;
          moMensal: number;
          verbaVarMensal: number;
          saldoMO: number;
          saldoVar: number;
        };
        const rows: FRow[] = [];
        clientes.forEach((c) => {
          (c.contratos || []).forEach((ct: any) => {
            const moMensal = parseNum(ct.maoDeObraMensal);
            const verbaVarMensal = parseNum(ct.maoDeObraAnual) / 12;
            (ct.faturamentos || []).forEach((f: any) => {
              const valorFolha = parseNum(f.valorFolha);
              const valorVariavel = parseNum(f.valorVariavel);
              const periodo = f.periodoInicio || f.dataEmissaoNf || "";
              rows.push({
                clienteNome: c.nome || "—",
                contratoNumero: ct.numero || "—",
                periodo,
                mes: monthOf(periodo),
                ano: yearOf(periodo),
                numeroNf: f.numeroNf || "—",
                valorFolha,
                valorVariavel,
                valorNota: valorFolha + valorVariavel,
                moMensal,
                verbaVarMensal,
                saldoMO: moMensal - valorFolha,
                saldoVar: verbaVarMensal - valorVariavel,
              });
            });
          });
        });
        return {
          key: "saldos_fat",
          label: "Saldos de Faturamento (M.O. Fixa e Variável)",
          rows,
          dateField: (r: FRow) => r.periodo,
          dimensions: [
            { key: "cliente", label: "Cliente", get: (r: FRow) => r.clienteNome },
            { key: "contrato", label: "Contrato", get: (r: FRow) => r.contratoNumero },
            { key: "mes", label: "Mês", get: (r: FRow) => r.mes },
            { key: "ano", label: "Ano", get: (r: FRow) => r.ano },
            { key: "nf", label: "Nº Nota Fiscal", get: (r: FRow) => r.numeroNf },
          ],
          values: [
            { key: "valorFolha", label: "V. Fat. - M.O. Fixa", get: (r: FRow) => r.valorFolha, format: formatBRL },
            { key: "valorVariavel", label: "V. Fat. - Variável", get: (r: FRow) => r.valorVariavel, format: formatBRL },
            { key: "valorNota", label: "V. Total - Nota Fiscal", get: (r: FRow) => r.valorNota, format: formatBRL },
            { key: "moMensal", label: "V. Prev. - M.O. Fixa", get: (r: FRow) => r.moMensal, format: formatBRL },
            { key: "verbaVarMensal", label: "V. Prev. - Variável", get: (r: FRow) => r.verbaVarMensal, format: formatBRL },
            { key: "saldoMO", label: "Saldo - M.O. Fixa", get: (r: FRow) => r.saldoMO, format: formatBRL },
            { key: "saldoVar", label: "Saldo - Variável", get: (r: FRow) => r.saldoVar, format: formatBRL },
          ],
        } as Dataset;
      })(),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ordens, solicitacoes, pedidos, requisicoes, funcionarios, fin, clientes, cargos],
  );

  const [dsKey, setDsKey] = useState<string>("os");
  const ds = datasets.find((d) => d.key === dsKey) || datasets[0];

  const [rowsDims, setRowsDims] = useState<string[]>([ds.dimensions[0]?.key].filter(Boolean) as string[]);
  const [colsDims, setColsDims] = useState<string[]>([]);
  const available = ds.dimensions.map((d) => d.key).filter((k) => !rowsDims.includes(k) && !colsDims.includes(k));
  const labelOf = (k: string) => ds.dimensions.find((d) => d.key === k)?.label || k;

  const [metric, setMetric] = useState<Metric>("count");
  const [valueKey, setValueKey] = useState<string>(ds.values[0]?.key || "");
  const hoje = new Date().toISOString().slice(0, 10);
  const inicioAno = `${new Date().getFullYear()}-01-01`;
  const [dataIni, setDataIni] = useState(inicioAno);
  const [dataFim, setDataFim] = useState(hoje);

  // Reset when dataset changes
  useEffect(() => {
    setRowsDims(ds.dimensions[0]?.key ? [ds.dimensions[0].key] : []);
    setColsDims([]);
    setValueKey(ds.values[0]?.key || "");
    if (!ds.values.length) setMetric("count");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dsKey]);

  // DnD
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const parseId = (id: string) => {
    const [zone, key] = id.split("::");
    return { zone: zone as ZoneId, key };
  };
  const getList = (z: ZoneId) => (z === "rows" ? rowsDims : z === "cols" ? colsDims : available);
  const setList = (z: ZoneId, v: string[]) => {
    if (z === "rows") setRowsDims(v);
    else if (z === "cols") setColsDims(v);
    // available is derived
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const a = parseId(String(active.id));
    let targetZone: ZoneId;
    let targetKey: string | null = null;
    const overId = String(over.id);
    if (overId === "available" || overId === "rows" || overId === "cols") {
      targetZone = overId as ZoneId;
    } else {
      const o = parseId(overId);
      targetZone = o.zone;
      targetKey = o.key;
    }
    if (a.zone === targetZone) {
      // reorder within same zone (rows/cols only)
      if (targetZone === "available") return;
      const list = [...getList(targetZone)];
      const oldIdx = list.indexOf(a.key);
      const newIdx = targetKey ? list.indexOf(targetKey) : list.length - 1;
      if (oldIdx < 0) return;
      setList(targetZone, arrayMove(list, oldIdx, newIdx));
      return;
    }
    // move between zones
    // remove from source (only rows/cols are stateful)
    if (a.zone === "rows") setRowsDims((r) => r.filter((k) => k !== a.key));
    if (a.zone === "cols") setColsDims((r) => r.filter((k) => k !== a.key));
    // add to target
    if (targetZone === "rows") {
      setRowsDims((r) => {
        const next = r.filter((k) => k !== a.key);
        const idx = targetKey ? next.indexOf(targetKey) : next.length;
        next.splice(idx >= 0 ? idx : next.length, 0, a.key);
        return next;
      });
    } else if (targetZone === "cols") {
      setColsDims((r) => {
        const next = r.filter((k) => k !== a.key);
        const idx = targetKey ? next.indexOf(targetKey) : next.length;
        next.splice(idx >= 0 ? idx : next.length, 0, a.key);
        return next;
      });
    }
    // dropping into "available" simply removes from rows/cols (handled above)
  };

  // Build nested keys
  const cube = useMemo(() => {
    const rowDefs = rowsDims.map((k) => ds.dimensions.find((d) => d.key === k)!).filter(Boolean);
    const colDefs = colsDims.map((k) => ds.dimensions.find((d) => d.key === k)!).filter(Boolean);
    const valDef = ds.values.find((v) => v.key === valueKey);
    if (!rowDefs.length) return null;

    const rowsFiltered = ds.rows.filter((r) => {
      if (!ds.dateField) return true;
      const d = ds.dateField(r);
      if (!d) return true;
      const s = String(d).slice(0, 10);
      return s >= dataIni && s <= dataFim;
    });

    const SEP = " ▸ ";
    const map: Record<string, Record<string, number>> = {};
    const rowKeysSet = new Set<string>();
    const colKeysSet = new Set<string>();

    rowsFiltered.forEach((r) => {
      const rk = rowDefs.map((d) => d.get(r) || "—").join(SEP);
      const ck = colDefs.length ? colDefs.map((d) => d.get(r) || "—").join(SEP) : "Total";
      rowKeysSet.add(rk);
      colKeysSet.add(ck);
      map[rk] ||= {};
      const v = metric === "count" ? 1 : valDef ? valDef.get(r) : 0;
      map[rk][ck] = (map[rk][ck] || 0) + v;
    });

    const cols = Array.from(colKeysSet).sort();
    const rowKeys = Array.from(rowKeysSet).sort();
    const fmt = metric === "sum" && valDef?.format ? valDef.format : (n: number) => String(n);

    const matrix = rowKeys.map((rk) => {
      const cells = cols.map((ck) => map[rk]?.[ck] || 0);
      const tot = cells.reduce((s, n) => s + n, 0);
      return { rk, parts: rk.split(SEP), cells, tot };
    });
    const colTotals = cols.map((_, i) => matrix.reduce((s, row) => s + row.cells[i], 0));
    const grandTotal = matrix.reduce((s, row) => s + row.tot, 0);

    return { rowDefs, colDefs, valDef, cols, matrix, colTotals, grandTotal, fmt };
  }, [ds, rowsDims, colsDims, metric, valueKey, dataIni, dataFim]);

  const exportar = (fmtType: "pdf" | "xlsx") => {
    if (!cube) return;
    if (!cube.matrix.length) {
      toast.warning("Nenhum dado para exportar.");
      return;
    }
    const rowHeaders = cube.rowDefs.map((d) => d.label);
    const colHeader = cube.colDefs.length ? cube.colDefs.map((d) => d.label).join(" × ") : "Total";
    const colunas = [...rowHeaders, ...cube.cols, `${colHeader} (Total)`];
    const linhas = cube.matrix.map((r) => [
      ...r.parts,
      ...r.cells.map((n) => cube.fmt(n)),
      cube.fmt(r.tot),
    ]);
    linhas.push([
      "TOTAL GERAL",
      ...Array(rowHeaders.length - 1).fill(""),
      ...cube.colTotals.map((n) => cube.fmt(n)),
      cube.fmt(cube.grandTotal),
    ]);
    const valLabel = metric === "count" ? "Contagem" : cube.valDef?.label || "Valor";
    const report = {
      titulo: `Cubo Multidimensional - ${ds.label}`,
      subtitulo: `Linhas: ${rowHeaders.join(" × ") || "—"} | Colunas: ${colHeader} | Métrica: ${valLabel}`,
      filtros: `Período: ${formatDate(dataIni)} a ${formatDate(dataFim)}`,
      colunas,
      linhas,
      totais: [{ label: "Total Geral", valor: cube.fmt(cube.grandTotal) }],
    };
    try {
      if (fmtType === "pdf") gerarPdfFinanceiro(report);
      else gerarExcelFinanceiro(report);
      toast.success(`${fmtType.toUpperCase()} gerado com sucesso!`);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar exportação");
    }
  };

  const swapRowsCols = () => {
    setRowsDims(colsDims);
    setColsDims(rowsDims);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Boxes className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-serif font-semibold">Relatórios Multidimensional (Cubo)</h1>
          <p className="text-sm text-muted-foreground">
            Arraste dimensões entre as áreas para montar visões multidimensionais.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Configuração do Cubo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <Label>Dataset</Label>
              <Select value={dsKey} onValueChange={setDsKey}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {datasets.map((d) => <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Métrica</Label>
              <Select value={metric} onValueChange={(v) => setMetric(v as Metric)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">Contagem (Qtd. de Registros)</SelectItem>
                  {ds.values.length > 0 && <SelectItem value="sum">Soma de Valor</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            {metric === "sum" && ds.values.length > 0 && (
              <div>
                <Label>Campo de Valor</Label>
                <Select value={valueKey} onValueChange={setValueKey}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ds.values.map((v) => <SelectItem key={v.key} value={v.key}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Período Início</Label>
              <Input type="date" value={dataIni} onChange={(e) => setDataIni(e.target.value)} />
            </div>
            <div>
              <Label>Período Fim</Label>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(e) => setActiveId(String(e.active.id))}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {ZONES.map((z) => (
                <Zone
                  key={z.id}
                  id={z.id}
                  title={z.title}
                  hint={z.hint}
                  items={getList(z.id)}
                  labelOf={labelOf}
                />
              ))}
            </div>
            <DragOverlay>
              {activeId ? (
                <div className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 text-xs shadow-lg">
                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                  {labelOf(parseId(activeId).key)}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={swapRowsCols}>
              ⇄ Inverter Linhas e Colunas
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setRowsDims(ds.dimensions[0]?.key ? [ds.dimensions[0].key] : []);
                setColsDims([]);
              }}
            >
              Limpar Pivot
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Resultado: {ds.label} — Linhas:{" "}
            {cube?.rowDefs.map((d) => d.label).join(" × ") || "—"}
            {cube?.colDefs.length ? ` | Colunas: ${cube.colDefs.map((d) => d.label).join(" × ")}` : ""}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!podePdf} onClick={() => exportar("pdf")} className="gap-2">
              <FileText className="h-4 w-4" /> PDF
            </Button>
            <Button variant="outline" size="sm" disabled={!podeExcel} onClick={() => exportar("xlsx")} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!cube || !cube.matrix.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {rowsDims.length === 0
                ? "Adicione ao menos uma dimensão em Linhas para visualizar o cubo."
                : "Nenhum dado para exibir."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted">
                    {cube.rowDefs.map((d) => (
                      <th key={d.key} className="border px-3 py-2 text-left font-semibold whitespace-nowrap">
                        {d.label}
                      </th>
                    ))}
                    {cube.cols.map((c) => (
                      <th key={c} className="border px-3 py-2 text-right font-semibold whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                    <th className="border px-3 py-2 text-right font-semibold bg-primary/10">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cube.matrix.map((row) => (
                    <tr key={row.rk} className="hover:bg-muted/40">
                      {row.parts.map((p, i) => (
                        <td key={i} className="border px-3 py-1.5 whitespace-nowrap">{p}</td>
                      ))}
                      {row.cells.map((n, i) => (
                        <td key={i} className="border px-3 py-1.5 text-right tabular-nums">
                          {cube.fmt(n)}
                        </td>
                      ))}
                      <td className="border px-3 py-1.5 text-right tabular-nums font-semibold bg-primary/5">
                        {cube.fmt(row.tot)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted font-semibold">
                    <td className="border px-3 py-2" colSpan={cube.rowDefs.length}>TOTAL GERAL</td>
                    {cube.colTotals.map((n, i) => (
                      <td key={i} className="border px-3 py-2 text-right tabular-nums">{cube.fmt(n)}</td>
                    ))}
                    <td className="border px-3 py-2 text-right tabular-nums bg-primary/10">
                      {cube.fmt(cube.grandTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
