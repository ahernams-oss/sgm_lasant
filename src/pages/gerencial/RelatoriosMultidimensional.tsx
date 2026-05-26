import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, FileSpreadsheet, Boxes } from "lucide-react";
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

const monthOf = (d?: string | null) =>
  d ? d.slice(0, 7) : "—"; // YYYY-MM
const yearOf = (d?: string | null) => (d ? d.slice(0, 4) : "—");

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
  const { ordensServico } = useOrdensServico();
  const { solicitacoes } = useSolicitacoesServicos();

  const cargoNome = (id: string) => cargos.find((c) => c.id === id)?.nome || "—";
  const clienteNome = (id?: string | null) => clientes.find((c) => c.id === id)?.nome || "—";

  const datasets: Dataset[] = useMemo(
    () => [
      {
        key: "os",
        label: "Ordens de Serviço",
        rows: ordensServico,
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
          { key: "bdi", label: "BDI", get: (r) => Number(r.bdi || 0) },
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
          { key: "salario", label: "Salário", get: (r) => Number(String(r.salario || "0").replace(/[^\d,]/g, "").replace(",", ".")) || 0, format: formatBRL },
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
    ],
    [ordensServico, solicitacoes, pedidos, requisicoes, funcionarios, fin, clientes, cargos],
  );

  const [dsKey, setDsKey] = useState<string>("os");
  const ds = datasets.find((d) => d.key === dsKey) || datasets[0];

  const [rowDim, setRowDim] = useState<string>(ds.dimensions[0]?.key || "");
  const [colDim, setColDim] = useState<string>("__none__");
  const [metric, setMetric] = useState<Metric>("count");
  const [valueKey, setValueKey] = useState<string>(ds.values[0]?.key || "");
  const hoje = new Date().toISOString().slice(0, 10);
  const inicioAno = `${new Date().getFullYear()}-01-01`;
  const [dataIni, setDataIni] = useState(inicioAno);
  const [dataFim, setDataFim] = useState(hoje);

  // Reset dim choices when dataset changes
  const handleDsChange = (k: string) => {
    setDsKey(k);
    const nd = datasets.find((d) => d.key === k)!;
    setRowDim(nd.dimensions[0]?.key || "");
    setColDim("__none__");
    setValueKey(nd.values[0]?.key || "");
    if (!nd.values.length) setMetric("count");
  };

  const cube = useMemo(() => {
    const rowDef = ds.dimensions.find((d) => d.key === rowDim);
    const colDef = ds.dimensions.find((d) => d.key === colDim);
    const valDef = ds.values.find((v) => v.key === valueKey);
    if (!rowDef) return null;

    const rowsFiltered = ds.rows.filter((r) => {
      if (!ds.dateField) return true;
      const d = ds.dateField(r);
      if (!d) return true;
      const s = String(d).slice(0, 10);
      return s >= dataIni && s <= dataFim;
    });

    const map: Record<string, Record<string, number>> = {};
    const colsSet = new Set<string>();

    rowsFiltered.forEach((r) => {
      const rk = rowDef.get(r);
      const ck = colDef ? colDef.get(r) : "Total";
      colsSet.add(ck);
      map[rk] ||= {};
      const v = metric === "count" ? 1 : valDef ? valDef.get(r) : 0;
      map[rk][ck] = (map[rk][ck] || 0) + v;
    });

    const cols = Array.from(colsSet).sort();
    const rowKeys = Object.keys(map).sort();
    const fmt = metric === "sum" && valDef?.format ? valDef.format : (n: number) => String(n);

    const matrix = rowKeys.map((rk) => {
      const cells = cols.map((ck) => map[rk][ck] || 0);
      const tot = cells.reduce((s, n) => s + n, 0);
      return { rk, cells, tot };
    });

    const colTotals = cols.map((_, i) => matrix.reduce((s, row) => s + row.cells[i], 0));
    const grandTotal = matrix.reduce((s, row) => s + row.tot, 0);

    return { rowDef, colDef, valDef, cols, matrix, colTotals, grandTotal, fmt };
  }, [ds, rowDim, colDim, metric, valueKey, dataIni, dataFim]);

  const exportar = (fmt: "pdf" | "xlsx") => {
    if (!cube) return;
    if (!cube.matrix.length) {
      toast.warning("Nenhum dado para exportar.");
      return;
    }
    const cols = [cube.rowDef.label, ...cube.cols, "Total"];
    const linhas = cube.matrix.map((r) => [
      r.rk,
      ...r.cells.map((n) => cube.fmt(n)),
      cube.fmt(r.tot),
    ]);
    linhas.push([
      "TOTAL GERAL",
      ...cube.colTotals.map((n) => cube.fmt(n)),
      cube.fmt(cube.grandTotal),
    ]);
    const valLabel = metric === "count" ? "Contagem" : cube.valDef?.label || "Valor";
    const report = {
      titulo: `Cubo Multidimensional - ${ds.label}`,
      subtitulo: `${cube.rowDef.label}${cube.colDef ? ` × ${cube.colDef.label}` : ""} | Métrica: ${valLabel}`,
      filtros: `Período: ${formatDate(dataIni)} a ${formatDate(dataFim)}`,
      colunas: cols,
      linhas,
      totais: [{ label: "Total Geral", valor: cube.fmt(cube.grandTotal) }],
    };
    try {
      if (fmt === "pdf") gerarPdfFinanceiro(report);
      else gerarExcelFinanceiro(report);
      toast.success(`${fmt.toUpperCase()} gerado com sucesso!`);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar exportação");
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Boxes className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-serif font-semibold">Relatórios Multidimensional (Cubo)</h1>
          <p className="text-sm text-muted-foreground">
            Análise dinâmica em cubo: escolha o dataset, dimensões e métrica para explorar cenários.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuração do Cubo</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <Label>Dataset</Label>
            <Select value={dsKey} onValueChange={handleDsChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {datasets.map((d) => <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Linhas (Dimensão)</Label>
            <Select value={rowDim} onValueChange={setRowDim}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ds.dimensions.map((d) => <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Colunas (Dimensão)</Label>
            <Select value={colDim} onValueChange={setColDim}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Nenhuma —</SelectItem>
                {ds.dimensions.filter((d) => d.key !== rowDim).map((d) => (
                  <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
                ))}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Resultado: {ds.label} — {cube?.rowDef.label}
            {cube?.colDef ? ` × ${cube.colDef.label}` : ""}
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
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum dado para exibir.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="border px-3 py-2 text-left font-semibold">{cube.rowDef.label}</th>
                    {cube.cols.map((c) => (
                      <th key={c} className="border px-3 py-2 text-right font-semibold">{c}</th>
                    ))}
                    <th className="border px-3 py-2 text-right font-semibold bg-primary/10">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cube.matrix.map((row) => (
                    <tr key={row.rk} className="hover:bg-muted/40">
                      <td className="border px-3 py-1.5">{row.rk}</td>
                      {row.cells.map((n, i) => (
                        <td key={i} className="border px-3 py-1.5 text-right tabular-nums">{cube.fmt(n)}</td>
                      ))}
                      <td className="border px-3 py-1.5 text-right tabular-nums font-semibold bg-primary/5">
                        {cube.fmt(row.tot)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted font-semibold">
                    <td className="border px-3 py-2">TOTAL GERAL</td>
                    {cube.colTotals.map((n, i) => (
                      <td key={i} className="border px-3 py-2 text-right tabular-nums">{cube.fmt(n)}</td>
                    ))}
                    <td className="border px-3 py-2 text-right tabular-nums bg-primary/10">{cube.fmt(cube.grandTotal)}</td>
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
