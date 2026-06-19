import { useEffect, useMemo, useState } from "react";
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
import { fetchAll } from "@/lib/supabaseHelper";
import { formatNumeroAno } from "@/lib/formatNumero";

type Periodo = "semanal" | "quinzenal" | "mensal" | "personalizado";
type TipoRelatorio = "fechamento_validadas" | "fechamento_categoria" | "analitico" | "sintetico" | "financeiro" | "produtividade" | "situacao" | "ciclo_ss" | "ciclo_os";

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
  { value: "fechamento_validadas", label: "Fechamento (Validadas)", desc: "Apenas OSs Validadas — OS, Unidade, Categoria e Valor, com totais e gráfico por categoria." },
  { value: "fechamento_categoria", label: "Fechamento por Categoria", desc: "Apenas OSs Validadas, agrupadas por categoria com Nº OS, Setor, Valor e Valor com BDI, totais e gráficos." },
  { value: "analitico", label: "Analítico (detalhado)", desc: "Lista completa de OSs com nº, cliente, situação, prioridade, datas e descrição." },
  { value: "sintetico", label: "Sintético (resumo)", desc: "Resumo por situação e por cliente, com totais." },
  { value: "financeiro", label: "Financeiro", desc: "Totais de materiais SCO, estoque, BDI e total geral por OS." },
  { value: "produtividade", label: "Produtividade", desc: "OSs por operador/profissional com tempo médio de execução." },
  { value: "situacao", label: "Por Situação", desc: "Quantidade e percentual de OSs em cada situação no período." },
  { value: "ciclo_ss", label: "Ciclo de Vida — Solicitações (SS)", desc: "Tempo entre solicitação, aprovação e conclusão (baseado no workflow), com médias." },
  { value: "ciclo_os", label: "Ciclo de Vida — Ordens de Serviço (OS)", desc: "Tempo entre as situações do workflow até a confirmação/validação, com tempos médios." },
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
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  useEffect(() => {
    if (!open) return;
    fetchAll("solicitacoes_servicos", "numero")
      .then(rows => setSolicitacoes((rows || []).map((r: any) => ({
        id: r.id,
        numero: r.numero ?? 0,
        clienteId: r.cliente_id ?? "",
        clienteNome: r.cliente_nome ?? "",
        situacao: r.situacao ?? "",
        createdAt: r.created_at ?? "",
        dataHoraSolicitacao: r.data_hora_solicitacao ?? "",
        historico: Array.isArray(r.historico) ? r.historico : [],
      }))))
      .catch(() => setSolicitacoes([]));
  }, [open]);
  const [periodo, setPeriodo] = useState<Periodo>("semanal");
  const [tipo, setTipo] = useState<TipoRelatorio>("fechamento_validadas");
  const [clienteSel, setClienteSel] = useState<string>("todos");
  const [situacaoSel, setSituacaoSel] = useState<string>("todas");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [orientacao, setOrientacao] = useState<"p" | "l">("p");

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
      if (tipo === "fechamento_validadas" || tipo === "fechamento_categoria") {
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

    // Agregação por categoria (sem BDI)
    const catMap = new Map<string, number>();
    let totalGeral = 0;
    const totalSemBdi = (o: any) => {
      const { sco, est } = totalOS(o);
      return sco + est;
    };
    ordensFiltradas.forEach(o => {
      const total = totalSemBdi(o);
      totalGeral += total;
      const cat = o.categoria || "SEM CATEGORIA";
      catMap.set(cat, (catMap.get(cat) || 0) + total);
    });
    const catList = Array.from(catMap.entries())
      .map(([nome, valor]) => ({ nome, valor, pct: totalGeral > 0 ? (valor / totalGeral) * 100 : 0 }))
      .sort((a, b) => a.nome.localeCompare(b.nome));

    if (formato === "excel") {
      const data = ordensFiltradas.map(o => {
        const total = totalSemBdi(o);
        return {
          "OS": formatNumeroAno(o.numero, o.createdAt),
          "Unidade": o.clienteNome || "-",
          "Categoria": o.categoria || "-",
          "Valor": Number(total.toFixed(2)),
        };
      });
      data.push({ "OS": "" as any, "Unidade": `Nº de OS: ${ordensFiltradas.length}` as any, "Categoria": "Total Geral" as any, "Valor": Number(totalGeral.toFixed(2)) });
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

    const doc = new jsPDF({ orientation: orientacao, unit: "mm", format: "a4" });
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
      const total = totalSemBdi(o);
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

  const drawPieChartLabeled = (
    items: { nome: string; valor: number; pct: number }[],
    titulo: string,
    formatValor: (v: number) => string,
  ): string => {
    const W = 1100, H = 700;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
    // Título
    ctx.fillStyle = "#111"; ctx.font = "bold 36px Helvetica"; ctx.textAlign = "center";
    ctx.fillText(titulo, W / 2, 50);
    // Pizza
    const cx = 320, cy = 400, r = 200;
    const total = items.reduce((s, c) => s + c.valor, 0) || 1;
    let acc = -Math.PI / 2;
    items.forEach((c, i) => {
      const ang = (c.valor / total) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, acc, acc + ang); ctx.closePath();
      ctx.fillStyle = PIE_COLORS[i % PIE_COLORS.length]; ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
      // Linha-rótulo
      const mid = acc + ang / 2;
      const x1 = cx + Math.cos(mid) * r;
      const y1 = cy + Math.sin(mid) * r;
      const x2 = cx + Math.cos(mid) * (r + 30);
      const y2 = cy + Math.sin(mid) * (r + 30);
      ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.fillStyle = "#111"; ctx.font = "bold 14px Helvetica";
      ctx.textAlign = x2 >= cx ? "left" : "right"; ctx.textBaseline = "middle";
      ctx.fillText(c.nome, x2 + (x2 >= cx ? 4 : -4), y2);
      acc += ang;
    });
    // Legenda
    const lx = 700, ly = 280;
    ctx.strokeStyle = "#999"; ctx.lineWidth = 1;
    ctx.strokeRect(lx - 10, ly - 30, 360, items.length * 28 + 50);
    items.forEach((c, i) => {
      const y = ly + i * 28;
      ctx.fillStyle = PIE_COLORS[i % PIE_COLORS.length];
      ctx.fillRect(lx, y - 12, 18, 18);
      ctx.fillStyle = "#111"; ctx.font = "14px Helvetica";
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(c.nome, lx + 26, y - 3);
      ctx.textAlign = "right";
      ctx.fillText(`${formatValor(c.valor)}   ${c.pct.toFixed(1)}%`, lx + 350, y - 3);
    });
    const yT = ly + items.length * 28;
    ctx.fillStyle = "#111"; ctx.font = "bold 14px Helvetica";
    ctx.textAlign = "left"; ctx.fillText("Total:", lx + 26, yT + 5);
    ctx.textAlign = "right"; ctx.fillText(`${formatValor(total)}   100.0%`, lx + 350, yT + 5);
    return canvas.toDataURL("image/png");
  };

  const exportarFechamentoCategoria = async (formato: "pdf" | "excel") => {
    const clienteNome = clienteSel !== "todos"
      ? (clientes.find(c => c.id === clienteSel)?.nome || "TODOS OS CLIENTES")
      : "TODOS OS CLIENTES";
    const dataIni = fmtData(intervalo.ini.toISOString());
    const dataFimStr = fmtData(intervalo.fim.toISOString());

    // Agrupar por categoria
    const catMap = new Map<string, OrdemServico[]>();
    ordensFiltradas.forEach(o => {
      const cat = (o.categoria || "SEM CATEGORIA").toUpperCase();
      const arr = catMap.get(cat) || [];
      arr.push(o);
      catMap.set(cat, arr);
    });
    const categorias = Array.from(catMap.entries())
      .map(([nome, list]) => {
        const valor = list.reduce((s, o) => s + totalOS(o).sco + totalOS(o).est, 0);
        const valorBdi = list.reduce((s, o) => s + totalOS(o).total, 0);
        return { nome, list, valor, valorBdi };
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));

    const totalGeral = categorias.reduce((s, c) => s + c.valor, 0);
    const totalGeralBdi = categorias.reduce((s, c) => s + c.valorBdi, 0);

    // Tipos de OS (subtipo)
    const tipoMap = new Map<string, number>();
    ordensFiltradas.forEach(o => {
      const t = (o.tipoOs?.descricao || o.tipoOs?.sigla || "—").toUpperCase();
      tipoMap.set(t, (tipoMap.get(t) || 0) + 1);
    });

    if (formato === "excel") {
      const linhas: any[] = [];
      categorias.forEach(c => {
        linhas.push({ "Nº OS": c.nome, "Tipo": "", "Setor": "", "Valor": "", "Valor com BDI": "" });
        c.list.forEach(o => {
          const { sco, est, total } = totalOS(o);
          linhas.push({
            "Nº OS": formatNumeroAno(o.numero, o.createdAt),
            "Tipo": o.tipoOs?.sigla || o.tipoOs?.descricao || "",
            "Setor": o.setorDescricao || o.localDescricao || "-",
            "Valor": Number((sco + est).toFixed(2)),
            "Valor com BDI": Number(total.toFixed(2)),
          });
        });
        linhas.push({ "Nº OS": "", "Tipo": "", "Setor": "TOTAL CATEGORIA", "Valor": Number(c.valor.toFixed(2)), "Valor com BDI": Number(c.valorBdi.toFixed(2)) });
      });
      linhas.push({ "Nº OS": "", "Tipo": "", "Setor": `TOTAL DE OS: ${ordensFiltradas.length}`, "Valor": Number(totalGeral.toFixed(2)), "Valor com BDI": Number(totalGeralBdi.toFixed(2)) });
      const ws = XLSX.utils.json_to_sheet(linhas);
      ws["!cols"] = [{ wch: 14 }, { wch: 10 }, { wch: 40 }, { wch: 14 }, { wch: 16 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Por Categoria");
      XLSX.writeFile(wb, `relatorio_fechamento_categoria.xlsx`);
      toast.success("Excel gerado!");
      onOpenChange(false);
      return;
    }

    const doc = new jsPDF({ orientation: orientacao, unit: "mm", format: "a4" });
    const pw = doc.internal.pageSize.getWidth();

    // ===== Capa =====
    if (empresa?.logoUrl) {
      const logo = await loadImg(empresa.logoUrl);
      if (logo) { try { doc.addImage(logo, "PNG", 14, 12, 50, 25); } catch {} }
    }
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(30, 30, 30);
    doc.text(clienteNome.toUpperCase(), pw / 2, 55, { align: "center" });
    doc.setFontSize(13); doc.setTextColor(80, 80, 80);
    doc.text("RELATÓRIO DE FECHAMENTO POR CATEGORIA", pw / 2, 64, { align: "center" });
    autoTable(doc, {
      startY: 76,
      head: [["Data inicial", "Data final"]],
      body: [[dataIni, dataFimStr]],
      theme: "grid",
      styles: { halign: "center", fontSize: 11, cellPadding: 3 },
      headStyles: { fillColor: [30, 58, 107], textColor: 255 },
      tableWidth: 120,
      margin: { left: (pw - 120) / 2 },
    });

    // ===== Tabela agrupada =====
    doc.addPage();
    addHeader(doc, "Fechamento por Categoria", `${clienteNome} — ${ordensFiltradas.length} OS Validadas`, `Período: ${dataIni} a ${dataFimStr}`);

    const body: any[] = [];
    categorias.forEach(c => {
      // Linha-cabeçalho da categoria (laranja)
      body.push([{
        content: c.nome,
        colSpan: 5,
        styles: { fillColor: [248, 180, 130], textColor: 30, fontStyle: "bold", fontSize: 10 },
      }]);
      c.list.forEach(o => {
        const { sco, est, total } = totalOS(o);
        body.push([
          formatNumeroAno(o.numero, o.createdAt),
          o.tipoOs?.sigla || (o.tipoOs?.descricao || "").charAt(0) || "-",
          o.setorDescricao || o.localDescricao || "-",
          { content: fmtBRL(sco + est), styles: { halign: "right" as const } },
          { content: fmtBRL(total), styles: { halign: "right" as const } },
        ]);
      });
      // Linha total da categoria (verde)
      body.push([
        { content: "TOTAL CATEGORIA --->>>", colSpan: 3, styles: { fillColor: [144, 238, 144], textColor: 30, fontStyle: "bold" as const, halign: "right" as const } },
        { content: fmtBRL(c.valor), styles: { fillColor: [144, 238, 144], textColor: 30, fontStyle: "bold" as const, halign: "right" as const } },
        { content: fmtBRL(c.valorBdi), styles: { fillColor: [144, 238, 144], textColor: 30, fontStyle: "bold" as const, halign: "right" as const } },
      ]);
    });

    autoTable(doc, {
      startY: 32,
      head: [["Nº OS", "Tipo", "Setor", "Valor", "Valor com BDI"]],
      body,
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [30, 58, 107], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 12, halign: "center" },
        3: { cellWidth: 30, halign: "right" },
        4: { cellWidth: 32, halign: "right" },
      },
      didDrawPage: () => {
        addHeader(doc, "Fechamento por Categoria", `${clienteNome} — ${ordensFiltradas.length} OS Validadas`, `Período: ${dataIni} a ${dataFimStr}`);
      },
      margin: { top: 32 },
    });

    // ===== Página de totais gerais =====
    doc.addPage();
    addHeader(doc, "Fechamento por Categoria", "Totais Gerais", `Período: ${dataIni} a ${dataFimStr}`);
    autoTable(doc, {
      startY: 50,
      body: [[
        { content: "TOTAL DE O.S. EXECUTADAS NO PERIODO --->>>", styles: { fontStyle: "bold" as const, halign: "right" as const } },
        { content: String(ordensFiltradas.length), styles: { fontStyle: "bold" as const, halign: "center" as const } },
      ]],
      theme: "grid",
      styles: { fontSize: 11, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 30 } },
      margin: { left: (pw - 150) / 2 },
    });
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 4,
      body: [[
        { content: "Valor Total", styles: { fillColor: [120, 230, 120], fontStyle: "bold" as const } },
        { content: fmtBRL(totalGeral), styles: { fillColor: [120, 230, 120], fontStyle: "bold" as const, halign: "right" as const } },
        { content: "Valor Total com BDI", styles: { fillColor: [120, 230, 120], fontStyle: "bold" as const } },
        { content: fmtBRL(totalGeralBdi), styles: { fillColor: [120, 230, 120], fontStyle: "bold" as const, halign: "right" as const } },
      ]],
      theme: "grid",
      styles: { fontSize: 11, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 40 }, 2: { cellWidth: 45 }, 3: { cellWidth: 40 } },
      margin: { left: (pw - 165) / 2 },
    });

    // ===== Gráfico por categoria =====
    if (categorias.length > 0) {
      doc.addPage();
      addHeader(doc, "Fechamento por Categoria", "Demanda de serviços por categoria", `Período: ${dataIni} a ${dataFimStr}`);
      const pieCats = categorias.map(c => ({ nome: c.nome, valor: c.valor, pct: totalGeral > 0 ? (c.valor / totalGeral) * 100 : 0 }));
      const img = drawPieChartLabeled(pieCats, "Demanda de serviços por categoria", fmtBRL);
      doc.addImage(img, "PNG", 14, 36, pw - 28, 160);
    }

    // ===== Gráfico de tipos de OS =====
    if (tipoMap.size > 0) {
      doc.addPage();
      addHeader(doc, "Fechamento por Categoria", "Tipos de OS", `Período: ${dataIni} a ${dataFimStr}`);
      const totalTipos = Array.from(tipoMap.values()).reduce((s, v) => s + v, 0) || 1;
      const tipoItems = Array.from(tipoMap.entries())
        .map(([nome, q]) => ({ nome, valor: q, pct: (q / totalTipos) * 100 }))
        .sort((a, b) => b.valor - a.valor);
      const img = drawPieChartLabeled(tipoItems, "Tipos de OS", (v) => String(v));
      doc.addImage(img, "PNG", 14, 36, pw - 28, 160);
    }

    addFooter(doc);
    doc.save(`relatorio_fechamento_categoria.pdf`);
    toast.success("PDF gerado!");
    onOpenChange(false);
  };

  // ============ Ciclo de Vida — Solicitações de Serviço ============
  const findHistDate = (hist: { situacao: string; data: string }[] | undefined, pattern: RegExp): string | null => {
    if (!Array.isArray(hist)) return null;
    const found = hist.find(h => pattern.test((h.situacao || "").toLowerCase()));
    return found?.data || null;
  };
  const diffMs = (a?: string | null, b?: string | null): number | null => {
    if (!a || !b) return null;
    const ta = new Date(a).getTime();
    const tb = new Date(b).getTime();
    if (isNaN(ta) || isNaN(tb)) return null;
    return tb - ta;
  };
  const fmtHoraMin = (ms: number | null) => {
    if (ms == null || ms < 0) return "—";
    const totalMinutes = Math.round(ms / (1000 * 60));
    const horas = Math.floor(totalMinutes / 60);
    const minutos = totalMinutes % 60;
    return `${horas}h ${minutos.toString().padStart(2, "0")}m`;
  };
  const avg = (arr: (number | null)[]) => {
    const v = arr.filter((x): x is number => x != null);
    return v.length === 0 ? null : v.reduce((s, x) => s + x, 0) / v.length;
  };

  const ssFiltradas = useMemo(() => {
    const { ini, fim } = intervalo;
    const iniMs = new Date(ini).setHours(0, 0, 0, 0);
    const fimMs = new Date(fim).setHours(23, 59, 59, 999);
    return solicitacoes.filter(s => {
      const ref = s.createdAt ? new Date(s.createdAt).getTime() : 0;
      if (isNaN(ref) || ref < iniMs || ref > fimMs) return false;
      if (clienteSel !== "todos" && s.clienteId !== clienteSel) return false;
      return true;
    });
  }, [solicitacoes, intervalo, clienteSel]);

  const exportarCicloSS = async (formato: "pdf" | "excel") => {
    if (ssFiltradas.length === 0) {
      toast.error("Nenhuma SS encontrada no período/filtros selecionados.");
      return;
    }
    const dataIni = fmtData(intervalo.ini.toISOString());
    const dataFimStr = fmtData(intervalo.fim.toISOString());

    const linhas = ssFiltradas.map(s => {
      const dSol = s.dataHoraSolicitacao || s.createdAt;
      const dAprov = findHistDate(s.historico, /aprov/);
      const dConcl = findHistDate(s.historico, /conclu|final|valid|encerr/);
      const tSA = diffMs(dSol, dAprov);
      const tAC = diffMs(dAprov, dConcl);
      const tTot = diffMs(dSol, dConcl);
      return { s, dSol, dAprov, dConcl, tSA, tAC, tTot };
    });
    const mSA = avg(linhas.map(l => l.tSA));
    const mAC = avg(linhas.map(l => l.tAC));
    const mTot = avg(linhas.map(l => l.tTot));

    if (formato === "excel") {
      const data = linhas.map(({ s, dSol, dAprov, dConcl, tSA, tAC, tTot }) => ({
        "Nº SS": formatNumeroAno(s.numero, s.createdAt),
        "Cliente": s.clienteNome || "-",
        "Situação atual": s.situacao || "-",
        "Solicitação": fmtDataHora(dSol),
        "Aprovação": fmtDataHora(dAprov),
        "Conclusão": fmtDataHora(dConcl),
        "Solic → Aprov (dias)": tSA == null ? "" : Number(tSA.toFixed(2)),
        "Aprov → Concl (dias)": tAC == null ? "" : Number(tAC.toFixed(2)),
        "Total (dias)": tTot == null ? "" : Number(tTot.toFixed(2)),
      }));
      data.push({
        "Nº SS": "" as any, "Cliente": "" as any, "Situação atual": "MÉDIA" as any,
        "Solicitação": "" as any, "Aprovação": "" as any, "Conclusão": "" as any,
        "Solic → Aprov (dias)": (mSA == null ? "" : Number(mSA.toFixed(2))) as any,
        "Aprov → Concl (dias)": (mAC == null ? "" : Number(mAC.toFixed(2))) as any,
        "Total (dias)": (mTot == null ? "" : Number(mTot.toFixed(2))) as any,
      });
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ciclo SS");
      XLSX.writeFile(wb, "ciclo_vida_solicitacoes.xlsx");
      toast.success("Excel gerado!");
      onOpenChange(false);
      return;
    }

    const doc = new jsPDF({ orientation: "l", unit: "mm", format: "a4" });
    addHeader(doc, "Ciclo de Vida — Solicitações de Serviço", `${ssFiltradas.length} SS(s) no período`, `Período: ${dataIni} a ${dataFimStr}`);
    autoTable(doc, {
      startY: 32,
      head: [["Nº SS", "Cliente", "Situação", "Solicitação", "Aprovação", "Conclusão", "Sol-Apr", "Apr-Con", "Total"]],
      body: linhas.map(({ s, dSol, dAprov, dConcl, tSA, tAC, tTot }) => [
        formatNumeroAno(s.numero, s.createdAt),
        s.clienteNome || "-",
        s.situacao || "-",
        fmtDataHora(dSol),
        fmtDataHora(dAprov),
        fmtDataHora(dConcl),
        fmtDias(tSA), fmtDias(tAC), fmtDias(tTot),
      ]),
      foot: [[
        { content: "MÉDIA", colSpan: 6, styles: { halign: "right" as const, fontStyle: "bold" as const } },
        fmtDias(mSA), fmtDias(mAC), fmtDias(mTot),
      ]],
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [30, 58, 107], textColor: 255, fontStyle: "bold" },
      footStyles: { fillColor: [230, 235, 245], textColor: 30, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    addFooter(doc);
    doc.save("ciclo_vida_solicitacoes.pdf");
    toast.success("PDF gerado!");
    onOpenChange(false);
  };

  // ============ Ciclo de Vida — Ordens de Serviço ============
  const exportarCicloOS = async (formato: "pdf" | "excel") => {
    // usa todas as OSs do período (sem restrição de situação)
    const { ini, fim } = intervalo;
    const iniMs = new Date(ini).setHours(0, 0, 0, 0);
    const fimMs = new Date(fim).setHours(23, 59, 59, 999);
    const osList = ordens.filter(o => {
      const ref = o.createdAt ? new Date(o.createdAt).getTime() : 0;
      if (isNaN(ref) || ref < iniMs || ref > fimMs) return false;
      if (clienteSel !== "todos" && o.clienteId !== clienteSel) return false;
      return true;
    });
    if (osList.length === 0) {
      toast.error("Nenhuma OS encontrada no período/filtros selecionados.");
      return;
    }
    const dataIni = fmtData(intervalo.ini.toISOString());
    const dataFimStr = fmtData(intervalo.fim.toISOString());

    const linhas = osList.map(o => {
      const dAbert = o.createdAt;
      const dExec = findHistDate(o.historico, /execu|andamento/);
      const dConcl = findHistDate(o.historico, /conclu|final/);
      const dConf = findHistDate(o.historico, /valid|confirm|encerr/);
      const tAE = diffMs(dAbert, dExec);
      const tEC = diffMs(dExec, dConcl);
      const tCV = diffMs(dConcl, dConf);
      const tTot = diffMs(dAbert, dConf || dConcl);
      return { o, dAbert, dExec, dConcl, dConf, tAE, tEC, tCV, tTot };
    });
    const mAE = avg(linhas.map(l => l.tAE));
    const mEC = avg(linhas.map(l => l.tEC));
    const mCV = avg(linhas.map(l => l.tCV));
    const mTot = avg(linhas.map(l => l.tTot));

    if (formato === "excel") {
      const data = linhas.map(({ o, dAbert, dExec, dConcl, dConf, tAE, tEC, tCV, tTot }) => ({
        "Nº OS": formatNumeroAno(o.numero, o.createdAt),
        "Cliente": o.clienteNome || "-",
        "Situação atual": o.situacao || "-",
        "Abertura": fmtDataHora(dAbert),
        "Em Execução": fmtDataHora(dExec),
        "Concluída": fmtDataHora(dConcl),
        "Confirmada/Validada": fmtDataHora(dConf),
        "Aber → Exec (dias)": tAE == null ? "" : Number(tAE.toFixed(2)),
        "Exec → Concl (dias)": tEC == null ? "" : Number(tEC.toFixed(2)),
        "Concl → Conf (dias)": tCV == null ? "" : Number(tCV.toFixed(2)),
        "Total até Confirmação (dias)": tTot == null ? "" : Number(tTot.toFixed(2)),
      }));
      data.push({
        "Nº OS": "" as any, "Cliente": "" as any, "Situação atual": "MÉDIA" as any,
        "Abertura": "" as any, "Em Execução": "" as any, "Concluída": "" as any, "Confirmada/Validada": "" as any,
        "Aber → Exec (dias)": (mAE == null ? "" : Number(mAE.toFixed(2))) as any,
        "Exec → Concl (dias)": (mEC == null ? "" : Number(mEC.toFixed(2))) as any,
        "Concl → Conf (dias)": (mCV == null ? "" : Number(mCV.toFixed(2))) as any,
        "Total até Confirmação (dias)": (mTot == null ? "" : Number(mTot.toFixed(2))) as any,
      });
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ciclo OS");
      XLSX.writeFile(wb, "ciclo_vida_ordens_servico.xlsx");
      toast.success("Excel gerado!");
      onOpenChange(false);
      return;
    }

    const doc = new jsPDF({ orientation: "l", unit: "mm", format: "a4" });
    addHeader(doc, "Ciclo de Vida — Ordens de Serviço", `${osList.length} OS(s) no período`, `Período: ${dataIni} a ${dataFimStr}`);
    autoTable(doc, {
      startY: 32,
      head: [["Nº OS", "Cliente", "Situação", "Abertura", "Execução", "Conclusão", "Confirmação", "Ab-Ex", "Ex-Co", "Co-Cf", "Total"]],
      body: linhas.map(({ o, dAbert, dExec, dConcl, dConf, tAE, tEC, tCV, tTot }) => [
        formatNumeroAno(o.numero, o.createdAt),
        o.clienteNome || "-",
        o.situacao || "-",
        fmtDataHora(dAbert),
        fmtDataHora(dExec),
        fmtDataHora(dConcl),
        fmtDataHora(dConf),
        fmtDias(tAE), fmtDias(tEC), fmtDias(tCV), fmtDias(tTot),
      ]),
      foot: [[
        { content: "MÉDIA", colSpan: 7, styles: { halign: "right" as const, fontStyle: "bold" as const } },
        fmtDias(mAE), fmtDias(mEC), fmtDias(mCV), fmtDias(mTot),
      ]],
      styles: { fontSize: 7.5, cellPadding: 1.3 },
      headStyles: { fillColor: [30, 58, 107], textColor: 255, fontStyle: "bold" },
      footStyles: { fillColor: [230, 235, 245], textColor: 30, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    addFooter(doc);
    doc.save("ciclo_vida_ordens_servico.pdf");
    toast.success("PDF gerado!");
    onOpenChange(false);
  };

  const exportar = async (formato: "pdf" | "excel") => {
    if (tipo === "ciclo_ss") { await exportarCicloSS(formato); return; }
    if (tipo === "ciclo_os") { await exportarCicloOS(formato); return; }
    if (ordensFiltradas.length === 0) {
      toast.error("Nenhuma OS encontrada no período/filtros selecionados.");
      return;
    }
    if (tipo === "fechamento_validadas") {
      await exportarFechamentoValidadas(formato);
      return;
    }
    if (tipo === "fechamento_categoria") {
      await exportarFechamentoCategoria(formato);
      return;
    }
    const { titulo, columns, rows, orientation } = buildData();
    const fileBase = titulo.replace(/[^\w]+/g, "_").toLowerCase();

    if (formato === "pdf") {
      const doc = new jsPDF({ orientation: orientacao, unit: "mm", format: "a4" });
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
              <Select value={(tipo === "fechamento_validadas" || tipo === "fechamento_categoria") ? "Validada" : situacaoSel} onValueChange={setSituacaoSel} disabled={tipo === "fechamento_validadas" || tipo === "fechamento_categoria"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {situacoesUnicas.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  {(tipo === "fechamento_validadas" || tipo === "fechamento_categoria") && !situacoesUnicas.includes("Validada") && <SelectItem value="Validada">Validada</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Orientação da Impressão (PDF)</Label>
            <RadioGroup value={orientacao} onValueChange={(v) => setOrientacao(v as "p" | "l")} className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 border rounded-md p-2">
                <RadioGroupItem value="p" id="ori-p" />
                <Label htmlFor="ori-p" className="font-normal cursor-pointer flex-1 text-sm">Retrato</Label>
              </div>
              <div className="flex items-center gap-2 border rounded-md p-2">
                <RadioGroupItem value="l" id="ori-l" />
                <Label htmlFor="ori-l" className="font-normal cursor-pointer flex-1 text-sm">Paisagem</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/40 rounded-md p-2">
            <strong>{tipo === "ciclo_ss" ? ssFiltradas.length : ordensFiltradas.length}</strong>{" "}
            {tipo === "ciclo_ss" ? "SS(s)" : "OS(s)"} no período — {filtrosLabel}
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
