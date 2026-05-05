import { useMemo, useState } from "react";
import { FileText, FileSpreadsheet, BarChart3 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { OrdemServico } from "@/contexts/OrdensServicoContext";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { formatNumeroAno } from "@/lib/formatNumero";

type Periodo = "semanal" | "quinzenal" | "mensal" | "personalizado";
type TipoRelatorio = "fechamento_validadas" | "analitico" | "sintetico" | "financeiro" | "produtividade" | "situacao";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  ordens: OrdemServico[];
  clientes: { id: string; nome: string }[];
}

const PERIODOS: { value: Periodo; label: string; desc: string }[] = [
  { value: "semanal", label: "Semanal", desc: "Últimos 7 dias." },
  { value: "quinzenal", label: "Quinzenal", desc: "Últimos 15 dias." },
  { value: "mensal", label: "Mensal", desc: "Últimos 30 dias." },
  { value: "personalizado", label: "Personalizado", desc: "Definir intervalo de datas." },
];

const TIPOS: { value: TipoRelatorio; label: string; desc: string }[] = [
  { value: "fechamento_validadas", label: "Fechamento (Validadas)", desc: "Apenas OSs Validadas — OS, Unidade, Categoria e Valor, com totais, BDI e gráfico por categoria." },
  { value: "analitico", label: "Analítico (detalhado)", desc: "Lista completa de OSs com nº, cliente, situação, prioridade, datas e descrição." },
  { value: "sintetico", label: "Sintético (resumo)", desc: "Resumo por situação e por cliente, com totais." },
  { value: "financeiro", label: "Financeiro", desc: "Totais de materiais SCO, estoque, BDI e total geral por OS." },
  { value: "produtividade", label: "Produtividade", desc: "OSs por operador/profissional com tempo médio de execução." },
  { value: "situacao", label: "Por Situação", desc: "Quantidade e percentual de OSs em cada situação no período." },
];

const fmtBRL = (n: number) => `R$ ${(Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtData = (d?: string) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("pt-BR");
};
const fmtDataHora = (d?: string) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

function addHeader(doc: jsPDF, titulo: string, subtitulo?: string, filtros?: string) {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(30, 58, 107);
  doc.rect(0, 0, pw, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text(titulo, 14, 12);
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  if (subtitulo) doc.text(subtitulo, 14, 20);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, pw - 14, 12, { align: "right" });
  if (filtros) doc.text(filtros, pw - 14, 20, { align: "right" });
  doc.setTextColor(30, 30, 30);
}

function addFooter(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  const ph = doc.internal.pageSize.getHeight();
  const pw = doc.internal.pageSize.getWidth();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(150);
    doc.text(`Página ${i} de ${pages}`, pw / 2, ph - 8, { align: "center" });
  }
}

const totalOS = (o: OrdemServico) => {
  const sco = (o.materiais || []).reduce((s, m) => s + (Number(m.valorTotal) || 0), 0);
  const est = (o.materiaisEstoque || []).reduce((s, m) => s + (Number(m.valorTotal) || 0), 0);
  const bdi = Number(o.bdi) || 0;
  const total = (sco + est) * (1 + bdi / 100);
  return { sco, est, bdi, total };
};

export default function RelatorioFechamentoOSDialog({ open, onOpenChange, ordens, clientes }: Props) {
  const { empresa } = useEmpresa();
  const [periodo, setPeriodo] = useState<Periodo>("semanal");
  const [tipo, setTipo] = useState<TipoRelatorio>("fechamento_validadas");
  const [clienteSel, setClienteSel] = useState<string>("todos");
  const [situacaoSel, setSituacaoSel] = useState<string>("todas");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");

  const intervalo = useMemo(() => {
    const fim = new Date();
    const ini = new Date();
    if (periodo === "semanal") ini.setDate(fim.getDate() - 7);
    else if (periodo === "quinzenal") ini.setDate(fim.getDate() - 15);
    else if (periodo === "mensal") ini.setDate(fim.getDate() - 30);
    else {
      if (dataInicio) ini.setTime(new Date(dataInicio).getTime());
      if (dataFim) fim.setTime(new Date(dataFim).getTime());
    }
    return { ini, fim };
  }, [periodo, dataInicio, dataFim]);

  const ordensFiltradas = useMemo(() => {
    const { ini, fim } = intervalo;
    const iniMs = ini.setHours(0, 0, 0, 0);
    const fimMs = fim.setHours(23, 59, 59, 999);
    return ordens.filter(o => {
      const ref = o.createdAt ? new Date(o.createdAt).getTime() : 0;
      if (isNaN(ref) || ref < iniMs || ref > fimMs) return false;
      if (clienteSel !== "todos" && o.clienteId !== clienteSel) return false;
      if (tipo === "fechamento_validadas") {
        if (o.situacao !== "Validada") return false;
      } else if (situacaoSel !== "todas" && o.situacao !== situacaoSel) return false;
      return true;
    });
  }, [ordens, intervalo, clienteSel, situacaoSel, tipo]);

  const situacoesUnicas = useMemo(() => Array.from(new Set(ordens.map(o => o.situacao).filter(Boolean))), [ordens]);

  const filtrosLabel = useMemo(() => {
    const parts: string[] = [];
    parts.push(`Período: ${fmtData(intervalo.ini.toISOString())} a ${fmtData(intervalo.fim.toISOString())}`);
    if (clienteSel !== "todos") parts.push(`Cliente: ${clientes.find(c => c.id === clienteSel)?.nome}`);
    if (situacaoSel !== "todas") parts.push(`Situação: ${situacaoSel}`);
    return parts.join(" | ");
  }, [intervalo, clienteSel, situacaoSel, clientes]);

  const buildData = (): { titulo: string; columns: string[]; rows: string[][]; orientation: "p" | "l" } => {
    const periodoLabel = PERIODOS.find(p => p.value === periodo)?.label || "";
    const tituloBase = `Fechamento ${periodoLabel} de OS`;

    if (tipo === "analitico") {
      let tTotal = 0;
      const rows = ordensFiltradas.map(o => {
        const { total } = totalOS(o);
        tTotal += total;
        return [
          String(o.numero), o.clienteNome || "-", o.setorDescricao || "-",
          o.tipoOs?.descricao || "-", o.prioridade || "-", o.situacao || "-",
          fmtDataHora(o.createdAt), fmtData(o.dataInicio), fmtData(o.dataTermino),
          o.solicitante || "-", fmtBRL(total),
        ];
      });
      rows.push(["", "", "", "", "", "", "", "", "", `TOTAL (${ordensFiltradas.length} OS)`, fmtBRL(tTotal)]);
      return {
        titulo: `${tituloBase} — Analítico`,
        columns: ["Nº", "Cliente", "Setor", "Tipo", "Prioridade", "Situação", "Abertura", "Início", "Término", "Solicitante", "Total"],
        rows, orientation: "l",
      };
    }

    if (tipo === "sintetico") {
      const porSituacao = new Map<string, number>();
      const porCliente = new Map<string, number>();
      ordensFiltradas.forEach(o => {
        porSituacao.set(o.situacao, (porSituacao.get(o.situacao) || 0) + 1);
        porCliente.set(o.clienteNome, (porCliente.get(o.clienteNome) || 0) + 1);
      });
      const rows: string[][] = [];
      rows.push(["— Por Situação —", ""]);
      Array.from(porSituacao.entries()).forEach(([k, v]) => rows.push([k, String(v)]));
      rows.push(["— Por Cliente —", ""]);
      Array.from(porCliente.entries()).forEach(([k, v]) => rows.push([k, String(v)]));
      rows.push(["TOTAL GERAL", String(ordensFiltradas.length)]);
      return { titulo: `${tituloBase} — Sintético`, columns: ["Categoria", "Quantidade"], rows, orientation: "p" };
    }

    if (tipo === "financeiro") {
      let tSco = 0, tEst = 0, tTot = 0;
      const rows = ordensFiltradas.map(o => {
        const { sco, est, bdi, total } = totalOS(o);
        tSco += sco; tEst += est; tTot += total;
        return [
          String(o.numero), o.clienteNome || "-", o.situacao,
          fmtBRL(sco), fmtBRL(est), `${bdi.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`, fmtBRL(total),
        ];
      });
      rows.push(["", "", "TOTAIS", fmtBRL(tSco), fmtBRL(tEst), "-", fmtBRL(tTot)]);
      return {
        titulo: `${tituloBase} — Financeiro`,
        columns: ["Nº", "Cliente", "Situação", "Mat. SCO", "Mat. Estoque", "BDI", "Total"],
        rows, orientation: "l",
      };
    }

    if (tipo === "produtividade") {
      const porOp = new Map<string, { qtd: number; tempos: number[] }>();
      ordensFiltradas.forEach(o => {
        const nome = o.operadorNome || "Não atribuído";
        const acc = porOp.get(nome) || { qtd: 0, tempos: [] };
        acc.qtd += 1;
        if (o.dataInicio && o.dataTermino) {
          const ini = new Date(o.dataInicio).getTime();
          const fim = new Date(o.dataTermino).getTime();
          if (!isNaN(ini) && !isNaN(fim) && fim >= ini) acc.tempos.push((fim - ini) / (1000 * 60 * 60 * 24));
        }
        porOp.set(nome, acc);
      });
      const rows = Array.from(porOp.entries()).map(([nome, v]) => {
        const media = v.tempos.length === 0 ? 0 : v.tempos.reduce((s, t) => s + t, 0) / v.tempos.length;
        return [nome, String(v.qtd), `${media.toFixed(1)} dias`];
      });
      const totalQtd = rows.reduce((s, r) => s + (Number(r[1]) || 0), 0);
      const mediaGeral = rows.length === 0 ? 0 : rows.reduce((s, r) => s + parseFloat(r[2]), 0) / rows.length;
      rows.push(["TOTAL", String(totalQtd), `${mediaGeral.toFixed(1)} dias (média)`]);
      return { titulo: `${tituloBase} — Produtividade`, columns: ["Operador", "Qtd OSs", "Tempo Médio"], rows, orientation: "p" };
    }

    // situacao
    const map = new Map<string, number>();
    ordensFiltradas.forEach(o => map.set(o.situacao, (map.get(o.situacao) || 0) + 1));
    const total = ordensFiltradas.length || 1;
    const rows = Array.from(map.entries()).map(([s, q]) => [s, String(q), `${((q / total) * 100).toFixed(1)}%`]);
    rows.push(["TOTAL", String(ordensFiltradas.length), "100%"]);
    return { titulo: `${tituloBase} — Por Situação`, columns: ["Situação", "Quantidade", "% do Total"], rows, orientation: "p" };
  };

  const loadImg = async (url: string): Promise<string | null> => {
    try {
      const r = await fetch(url); const b = await r.blob();
      return await new Promise<string>(res => { const fr = new FileReader(); fr.onloadend = () => res(fr.result as string); fr.readAsDataURL(b); });
    } catch { return null; }
  };

  const PIE_COLORS = ["#1e3a6b", "#2a8819", "#e7b73b", "#dc2626", "#7dd3fc", "#8b4513", "#6b7280", "#9333ea", "#0ea5e9", "#f97316"];
  const hexToRgb = (h: string): [number, number, number] => {
    const s = h.replace("#", "");
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  };

  const drawPieChart = (categorias: { nome: string; valor: number; pct: number }[]): string => {
    const size = 400;
    const cx = size / 2, cy = size / 2, r = 150;
    const total = categorias.reduce((s, c) => s + c.valor, 0) || 1;
    let acc = -Math.PI / 2;
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, size, size);
    categorias.forEach((c, i) => {
      const ang = (c.valor / total) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, acc, acc + ang);
      ctx.closePath();
      ctx.fillStyle = PIE_COLORS[i % PIE_COLORS.length]; ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
      const mid = acc + ang / 2;
      const lx = cx + Math.cos(mid) * (r * 0.65);
      const ly = cy + Math.sin(mid) * (r * 0.65);
      if (c.pct >= 3) {
        ctx.fillStyle = "#fff"; ctx.font = "bold 14px Helvetica"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(`${c.pct.toFixed(2)}%`, lx, ly);
      }
      acc += ang;
    });
    return canvas.toDataURL("image/png");
  };

  const exportarFechamentoValidadas = async (formato: "pdf" | "excel") => {
    const clienteNome = clienteSel !== "todos"
      ? (clientes.find(c => c.id === clienteSel)?.nome || "TODOS OS CLIENTES")
      : "TODOS OS CLIENTES";
    const dataIni = fmtData(intervalo.ini.toISOString());
    const dataFimStr = fmtData(intervalo.fim.toISOString());

    // Agregação por categoria
    const catMap = new Map<string, number>();
    let totalGeral = 0; let bdiSomaPond = 0;
    ordensFiltradas.forEach(o => {
      const { total, bdi } = totalOS(o);
      totalGeral += total; bdiSomaPond += total * (bdi || 0);
      const cat = o.categoria || "SEM CATEGORIA";
      catMap.set(cat, (catMap.get(cat) || 0) + total);
    });
    const bdiMedio = totalGeral > 0 ? bdiSomaPond / totalGeral : 0;
    const bdiValor = totalGeral * (bdiMedio / 100);
    const totalComBdi = totalGeral + bdiValor;
    const catList = Array.from(catMap.entries())
      .map(([nome, valor]) => ({ nome, valor, pct: totalGeral > 0 ? (valor / totalGeral) * 100 : 0 }))
      .sort((a, b) => a.nome.localeCompare(b.nome));

    if (formato === "excel") {
      const data = ordensFiltradas.map(o => {
        const { total } = totalOS(o);
        return {
          "OS": formatNumeroAno(o.numero, o.createdAt),
          "Unidade": o.clienteNome || "-",
          "Categoria": o.categoria || "-",
          "Valor": Number(total.toFixed(2)),
        };
      });
      data.push({ "OS": "" as any, "Unidade": `Nº de OS: ${ordensFiltradas.length}` as any, "Categoria": "Total Geral" as any, "Valor": Number(totalGeral.toFixed(2)) });
      data.push({ "OS": "" as any, "Unidade": "" as any, "Categoria": `BDI: ${bdiMedio.toFixed(4)}%` as any, "Valor": Number(bdiValor.toFixed(2)) });
      data.push({ "OS": "" as any, "Unidade": "" as any, "Categoria": "Total Geral c/ BDI" as any, "Valor": Number(totalComBdi.toFixed(2)) });
      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [{ wch: 14 }, { wch: 40 }, { wch: 30 }, { wch: 14 }];
      const wsCat = XLSX.utils.json_to_sheet(catList.map(c => ({ Categoria: c.nome, Valor: Number(c.valor.toFixed(2)), Percentual: `${c.pct.toFixed(2)}%` })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Fechamento");
      XLSX.utils.book_append_sheet(wb, wsCat, "Por Categoria");
      XLSX.writeFile(wb, `relatorio_fechamento_validadas.xlsx`);
      toast.success("Excel gerado!");
      onOpenChange(false);
      return;
    }

    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const pw = doc.internal.pageSize.getWidth();

    // Capa
    if (empresa?.logoUrl) {
      const logo = await loadImg(empresa.logoUrl);
      if (logo) { try { doc.addImage(logo, "PNG", 14, 12, 40, 20); } catch {} }
    }
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(30, 30, 30);
    doc.text(clienteNome.toUpperCase(), pw / 2, 50, { align: "center" });
    doc.setFontSize(13); doc.setTextColor(80, 80, 80);
    doc.text("RELATÓRIO DE FECHAMENTO - VALIDADAS", pw / 2, 60, { align: "center" });

    autoTable(doc, {
      startY: 72,
      head: [["Data inicial", "Data final"]],
      body: [[dataIni, dataFimStr]],
      theme: "grid",
      styles: { halign: "center", fontSize: 11, cellPadding: 3 },
      headStyles: { fillColor: [30, 58, 107], textColor: 255 },
      tableWidth: 120,
      margin: { left: (pw - 120) / 2 },
    });

    // Tabela principal
    doc.addPage();
    const rows = ordensFiltradas.map(o => {
      const { total } = totalOS(o);
      return [formatNumeroAno(o.numero, o.createdAt), o.clienteNome || "-", o.categoria || "-", fmtBRL(total)];
    });
    autoTable(doc, {
      startY: 14,
      head: [["OS", "Unidade", "Categoria", "Valor"]],
      body: rows,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [30, 58, 107], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: { 0: { cellWidth: 22 }, 3: { halign: "right", cellWidth: 30 } },
      foot: [
        [{ content: `Nº de OS: ${ordensFiltradas.length}`, colSpan: 2 }, "Total Geral", fmtBRL(totalGeral)],
        [{ content: "", colSpan: 2 }, `BDI %: ${bdiMedio.toFixed(4)}%`, fmtBRL(bdiValor)],
        [{ content: "Total Geral c/ BDI", colSpan: 3 }, fmtBRL(totalComBdi)],
      ],
      footStyles: { fillColor: [230, 235, 245], textColor: 30, fontStyle: "bold" },
    });

    // Gráfico por categoria
    if (catList.length > 0) {
      doc.addPage();
      doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(30, 30, 30);
      doc.text("Gráfico de serviço por categoria", pw / 2, 18, { align: "center" });
      const pie = drawPieChart(catList);
      doc.addImage(pie, "PNG", (pw - 100) / 2, 26, 100, 100);

      autoTable(doc, {
        startY: 135,
        head: [["Categoria", "Valor", "Percentual"]],
        body: catList.map((c, i) => [
          { content: c.nome, styles: { fillColor: hexToRgb(PIE_COLORS[i % PIE_COLORS.length]), textColor: 255 } as any },
          fmtBRL(c.valor),
          `${c.pct.toFixed(2)}%`,
        ]),
        foot: [["Total", fmtBRL(totalGeral), "100,00%"]],
        styles: { fontSize: 10, cellPadding: 2.5 },
        headStyles: { fillColor: [30, 58, 107], textColor: 255 },
        footStyles: { fillColor: [230, 235, 245], textColor: 30, fontStyle: "bold" },
      });
    }

    addFooter(doc);
    doc.save(`relatorio_fechamento_validadas.pdf`);
    toast.success("PDF gerado!");
    onOpenChange(false);
  };

  const exportar = async (formato: "pdf" | "excel") => {
    if (ordensFiltradas.length === 0) {
      toast.error("Nenhuma OS encontrada no período/filtros selecionados.");
      return;
    }
    if (tipo === "fechamento_validadas") {
      await exportarFechamentoValidadas(formato);
      return;
    }
    const { titulo, columns, rows, orientation } = buildData();
    const fileBase = titulo.replace(/[^\w]+/g, "_").toLowerCase();

    if (formato === "pdf") {
      const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
      addHeader(doc, titulo, `Total: ${ordensFiltradas.length} OS(s)`, filtrosLabel);
      autoTable(doc, {
        startY: 32,
        head: [columns],
        body: rows,
        styles: { fontSize: 7.5, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fillColor: [30, 58, 107], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });
      addFooter(doc);
      doc.save(`${fileBase}.pdf`);
      toast.success("PDF gerado!");
    } else {
      const data = rows.map(r => {
        const o: Record<string, string> = {};
        columns.forEach((c, i) => { o[c] = r[i] || ""; });
        return o;
      });
      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = columns.map(() => ({ wch: 20 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, titulo.substring(0, 31));
      XLSX.writeFile(wb, `${fileBase}.xlsx`);
      toast.success("Excel gerado!");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Relatórios de Fechamento — Ordens de Serviço</DialogTitle>
          <DialogDescription>Gere relatórios semanais, quinzenais ou mensais em PDF ou Excel.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Período de Fechamento</Label>
            <RadioGroup value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)} className="grid grid-cols-2 gap-2">
              {PERIODOS.map(p => (
                <div key={p.value} className="flex items-start gap-2 border rounded-md p-2">
                  <RadioGroupItem value={p.value} id={`p-${p.value}`} className="mt-1" />
                  <Label htmlFor={`p-${p.value}`} className="font-normal cursor-pointer flex-1">
                    <div className="font-medium text-sm">{p.label}</div>
                    <div className="text-xs text-muted-foreground">{p.desc}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {periodo === "personalizado" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Data Início</Label>
                <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm">Data Fim</Label>
                <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
              </div>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium mb-2 block">Tipo de Relatório</Label>
            <RadioGroup value={tipo} onValueChange={(v) => setTipo(v as TipoRelatorio)} className="space-y-2 border rounded-md p-3">
              {TIPOS.map(t => (
                <div key={t.value} className="flex items-start gap-2">
                  <RadioGroupItem value={t.value} id={`t-${t.value}`} className="mt-1" />
                  <Label htmlFor={`t-${t.value}`} className="font-normal cursor-pointer flex-1">
                    <div className="font-medium text-sm">{t.label}</div>
                    <div className="text-xs text-muted-foreground">{t.desc}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Cliente</Label>
              <Select value={clienteSel} onValueChange={setClienteSel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os clientes</SelectItem>
                  {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Situação</Label>
              <Select value={situacaoSel} onValueChange={setSituacaoSel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {situacoesUnicas.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/40 rounded-md p-2">
            <strong>{ordensFiltradas.length}</strong> OS(s) no período — {filtrosLabel}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="outline" onClick={() => exportar("excel")} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
          <Button onClick={() => exportar("pdf")} className="gap-2">
            <FileText className="h-4 w-4" /> PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
