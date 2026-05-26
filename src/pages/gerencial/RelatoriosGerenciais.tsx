import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, FileSpreadsheet, BarChart3 } from "lucide-react";
import { useFinanceiro, formatBRL, formatDate } from "@/contexts/FinanceiroContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useFuncionarios } from "@/contexts/FuncionariosContext";
import { useCargos } from "@/contexts/CargosContext";
import { usePedidoCompra } from "@/contexts/PedidoCompraContext";
import { useRequisicaoCompras } from "@/contexts/RequisicaoComprasContext";
import { useOrdensServico } from "@/contexts/OrdensServicoContext";
import { useSolicitacoesServicos } from "@/contexts/SolicitacoesServicosContext";
import { gerarPdfFinanceiro, gerarExcelFinanceiro, FinReport } from "@/lib/gerarRelatoriosFinanceiros";
import { usePermissao } from "@/hooks/usePermissao";
import { toast } from "sonner";

interface RelDef {
  id: string;
  titulo: string;
  descricao: string;
  build: () => FinReport;
}

export default function RelatoriosGerenciais() {
  const { tem } = usePermissao();
  const podePdf = tem("gerencial_relatorios.exportar_pdf");
  const podeExcel = tem("gerencial_relatorios.exportar_excel");

  const fin = useFinanceiro();
  const { clientes } = useClientes();
  const { funcionarios } = useFuncionarios();
  const { cargos } = useCargos();
  const { pedidos } = usePedidoCompra();
  const { requisicoes } = useRequisicaoCompras();
  const { ordensServico } = useOrdensServico();
  const { solicitacoes } = useSolicitacoesServicos();

  const hoje = new Date().toISOString().slice(0, 10);
  const inicioAno = `${new Date().getFullYear()}-01-01`;
  const [dataIni, setDataIni] = useState(inicioAno);
  const [dataFim, setDataFim] = useState(hoje);

  const inRange = (d?: string | null) => {
    if (!d) return false;
    const s = d.slice(0, 10);
    return s >= dataIni && s <= dataFim;
  };
  const cargoNome = (id: string) => cargos.find((c) => c.id === id)?.nome || "—";
  const clienteNome = (id: string) => clientes.find((c) => c.id === id)?.nome || "—";
  const periodoTxt = `Período: ${formatDate(dataIni)} a ${formatDate(dataFim)}`;

  const groupBy = <T,>(arr: T[], keyFn: (x: T) => string): Record<string, T[]> => {
    const m: Record<string, T[]> = {};
    arr.forEach((it) => {
      const k = keyFn(it) || "—";
      (m[k] ||= []).push(it);
    });
    return m;
  };

  const relatorios: RelDef[] = useMemo(
    () => [
      {
        id: "os_status",
        titulo: "OS por Situação",
        descricao: "Total de Ordens de Serviço agrupadas por situação no período.",
        build: () => {
          const lista = ordensServico.filter((o) => inRange(o.createdAt));
          const g = groupBy(lista, (o) => o.situacao || "—");
          const linhas = Object.entries(g)
            .map(([k, v]) => [k, v.length, `${((v.length / Math.max(1, lista.length)) * 100).toFixed(1)}%`])
            .sort((a: any, b: any) => b[1] - a[1]);
          return {
            titulo: "OS por Situação",
            filtros: periodoTxt,
            colunas: ["Situação", "Quantidade", "% do Total"],
            linhas: linhas as any,
            totais: [{ label: "Total OS", valor: String(lista.length) }],
          };
        },
      },
      {
        id: "os_cliente",
        titulo: "OS por Cliente",
        descricao: "Quantidade de Ordens de Serviço por cliente no período.",
        build: () => {
          const lista = ordensServico.filter((o) => inRange(o.createdAt));
          const g = groupBy(lista, (o) => o.clienteNome);
          const linhas = Object.entries(g)
            .map(([k, v]) => [k, v.length])
            .sort((a: any, b: any) => b[1] - a[1]);
          return {
            titulo: "OS por Cliente",
            filtros: periodoTxt,
            colunas: ["Cliente", "Quantidade"],
            linhas: linhas as any,
            totais: [{ label: "Total", valor: String(lista.length) }],
          };
        },
      },
      {
        id: "ss_status",
        titulo: "SS por Situação",
        descricao: "Solicitações de Serviço agrupadas por situação no período.",
        build: () => {
          const lista = solicitacoes.filter((s) => inRange(s.createdAt));
          const g = groupBy(lista, (s) => s.situacao || "—");
          return {
            titulo: "SS por Situação",
            filtros: periodoTxt,
            colunas: ["Situação", "Quantidade"],
            linhas: Object.entries(g).map(([k, v]) => [k, v.length]) as any,
            totais: [{ label: "Total SS", valor: String(lista.length) }],
          };
        },
      },
      {
        id: "compras_pedidos",
        titulo: "Pedidos de Compra - Valores por Fornecedor",
        descricao: "Total emitido em pedidos de compra agrupado por fornecedor.",
        build: () => {
          const lista = pedidos.filter((p) => inRange(p.dataCriacao));
          const g = groupBy(lista, (p) => p.fornecedorNome || "—");
          const linhas = Object.entries(g)
            .map(([k, v]) => {
              const total = v.reduce((s, p) => s + Number(p.valorTotal || 0), 0);
              return [k, v.length, formatBRL(total)];
            })
            .sort((a: any, b: any) => parseFloat(String(b[2]).replace(/[^\d,]/g, "").replace(",", ".")) - parseFloat(String(a[2]).replace(/[^\d,]/g, "").replace(",", ".")));
          const total = lista.reduce((s, p) => s + Number(p.valorTotal || 0), 0);
          return {
            titulo: "Pedidos de Compra por Fornecedor",
            filtros: periodoTxt,
            colunas: ["Fornecedor", "Qtd. Pedidos", "Valor Total"],
            linhas: linhas as any,
            totais: [{ label: "Total Geral", valor: formatBRL(total) }],
          };
        },
      },
      {
        id: "requisicoes_status",
        titulo: "Requisições de Compras por Status",
        descricao: "Volume e percentual de RCs por status no período.",
        build: () => {
          const lista = requisicoes.filter((r) => inRange(r.dataCriacao));
          const g = groupBy(lista, (r) => r.status || "—");
          return {
            titulo: "Requisições de Compras por Status",
            filtros: periodoTxt,
            colunas: ["Status", "Quantidade", "% do Total"],
            linhas: Object.entries(g).map(([k, v]) => [
              k,
              v.length,
              `${((v.length / Math.max(1, lista.length)) * 100).toFixed(1)}%`,
            ]) as any,
            totais: [{ label: "Total RC", valor: String(lista.length) }],
          };
        },
      },
      {
        id: "funcionarios_cliente",
        titulo: "Funcionários Ativos por Cliente",
        descricao: "Quadro de funcionários ativos distribuídos por cliente/contrato.",
        build: () => {
          const lista = funcionarios.filter((f) => f.status === "Ativo");
          const g = groupBy(lista, (f) => clienteNome(f.clienteId));
          return {
            titulo: "Funcionários Ativos por Cliente",
            filtros: "Status: Ativo",
            colunas: ["Cliente", "Quantidade"],
            linhas: Object.entries(g)
              .map(([k, v]) => [k, v.length])
              .sort((a: any, b: any) => b[1] - a[1]) as any,
            totais: [{ label: "Total Ativos", valor: String(lista.length) }],
          };
        },
      },
      {
        id: "funcionarios_cargo",
        titulo: "Funcionários por Cargo",
        descricao: "Distribuição de funcionários ativos por cargo (CBO).",
        build: () => {
          const lista = funcionarios.filter((f) => f.status === "Ativo");
          const g = groupBy(lista, (f) => cargoNome(f.cargoId));
          return {
            titulo: "Funcionários por Cargo",
            filtros: "Status: Ativo",
            colunas: ["Cargo", "Quantidade"],
            linhas: Object.entries(g)
              .map(([k, v]) => [k, v.length])
              .sort((a: any, b: any) => b[1] - a[1]) as any,
            totais: [{ label: "Total Ativos", valor: String(lista.length) }],
          };
        },
      },
      {
        id: "fin_resumo",
        titulo: "Resumo Financeiro do Período",
        descricao: "Recebimentos, pagamentos e saldo do período.",
        build: () => {
          const cr = fin.contasReceber.filter((c) => c.status === "recebida" && inRange(c.data_recebimento));
          const cp = fin.contasPagar.filter((c) => c.status === "paga" && inRange(c.data_pagamento));
          const totalR = cr.reduce((s, c) => s + Number(c.valor_recebido || 0), 0);
          const totalP = cp.reduce((s, c) => s + Number(c.valor_pago || 0), 0);
          return {
            titulo: "Resumo Financeiro do Período",
            filtros: periodoTxt,
            colunas: ["Indicador", "Quantidade", "Valor"],
            linhas: [
              ["Contas Recebidas", cr.length, formatBRL(totalR)],
              ["Contas Pagas", cp.length, formatBRL(totalP)],
              ["Saldo (R - P)", "—", formatBRL(totalR - totalP)],
            ],
            totais: [{ label: "Saldo Período", valor: formatBRL(totalR - totalP) }],
          };
        },
      },
    ],
    [ordensServico, solicitacoes, pedidos, requisicoes, funcionarios, fin, dataIni, dataFim, cargos, clientes],
  );

  const exportar = (r: RelDef, fmt: "pdf" | "xlsx") => {
    try {
      const report = r.build();
      if (!report.linhas.length) {
        toast.warning("Nenhum dado encontrado para os filtros aplicados.");
        return;
      }
      if (fmt === "pdf") gerarPdfFinanceiro(report);
      else gerarExcelFinanceiro(report);
      toast.success(`${fmt.toUpperCase()} gerado com sucesso!`);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar relatório");
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-serif font-semibold">Relatórios Gerenciais</h1>
          <p className="text-sm text-muted-foreground">
            Relatórios consolidados entre módulos com exportação em PDF e Excel.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Data Início</Label>
            <Input type="date" value={dataIni} onChange={(e) => setDataIni(e.target.value)} />
          </div>
          <div>
            <Label>Data Fim</Label>
            <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relatorios.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle className="text-base">{r.titulo}</CardTitle>
              <p className="text-xs text-muted-foreground">{r.descricao}</p>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!podePdf}
                onClick={() => exportar(r, "pdf")}
                className="gap-2"
              >
                <FileText className="h-4 w-4" /> PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!podeExcel}
                onClick={() => exportar(r, "xlsx")}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" /> Excel
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
