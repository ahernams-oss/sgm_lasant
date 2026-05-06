import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { PmocPlano, PmocAtividade, PmocOrdemServico, PmocInconformidade } from "@/contexts/PmocContext";

interface PmocReportData {
  planos: PmocPlano[];
  atividades: PmocAtividade[];
  ordensServico: PmocOrdemServico[];
  inconformidades: PmocInconformidade[];
  filtroCliente?: string;
  tipo: "geral" | "cliente" | "conformidade";
}

function header(doc: jsPDF, titulo: string, subtitulo: string) {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(30, 58, 107);
  doc.rect(0, 0, pw, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${titulo} — Engenharia e Manutenção`, 14, 16);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(subtitulo, 14, 24);
  doc.setFontSize(9);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, pw - 14, 16, { align: "right" });
}

function footer(doc: jsPDF) {
  const pw = doc.internal.pageSize.getWidth();
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200, 200, 200);
    doc.line(14, ph - 20, pw - 14, ph - 20);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text("Relatório PMOC — SGM Lasant", 14, ph - 14);
    doc.text(`Página ${i} de ${pages}`, pw / 2, ph - 14, { align: "center" });
  }
}

function tabelaResumo(doc: jsPDF, y: number, titulo: string, head: string[], body: string[][]) {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 107);
  doc.text(titulo, 14, y);
  y += 3;
  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 58, 107], textColor: [255, 255, 255], fontStyle: "bold" },
    margin: { left: 14, right: 14 },
  });
  return (doc as any).lastAutoTable.finalY + 10;
}

export function gerarPdfPmocGeral(data: PmocReportData): jsPDF {
  const doc = new jsPDF();
  header(doc, "Relatório Geral PMOC", `Total: ${data.planos.length} planos | ${data.atividades.length} atividades | ${data.ordensServico.length} OS`);
  doc.setTextColor(30, 30, 30);
  let y = 46;

  // Resumo status planos
  const statusPlanos: Record<string, number> = {};
  data.planos.forEach(p => { statusPlanos[p.status] = (statusPlanos[p.status] || 0) + 1; });
  y = tabelaResumo(doc, y, "Planos por Status", ["Status", "Quantidade"],
    Object.entries(statusPlanos).map(([s, c]) => [s, c.toString()]));

  // Resumo OS por status
  const statusOS: Record<string, number> = {};
  data.ordensServico.forEach(o => { statusOS[o.status] = (statusOS[o.status] || 0) + 1; });
  y = tabelaResumo(doc, y, "Ordens de Serviço por Status", ["Status", "Quantidade"],
    Object.entries(statusOS).map(([s, c]) => [s, c.toString()]));

  // Atividades por tipo
  const tipoAtiv: Record<string, number> = {};
  data.atividades.forEach(a => { tipoAtiv[a.tipo] = (tipoAtiv[a.tipo] || 0) + 1; });
  y = tabelaResumo(doc, y, "Atividades por Tipo", ["Tipo", "Quantidade"],
    Object.entries(tipoAtiv).map(([s, c]) => [s, c.toString()]));

  // Lista de planos
  const ph = doc.internal.pageSize.getHeight();
  if (y + 30 > ph - 30) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 107);
  doc.text("Lista de Planos", 14, y);
  y += 3;
  autoTable(doc, {
    startY: y,
    head: [["Título", "Cliente", "Vigência", "Status", "RT"]],
    body: data.planos.map(p => [
      p.titulo, p.clienteNome || "-",
      p.vigenciaInicio && p.vigenciaFim ? `${p.vigenciaInicio} a ${p.vigenciaFim}` : "-",
      p.status, p.responsavelTecnicoNome || "-",
    ]),
    theme: "striped",
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 58, 107], textColor: [255, 255, 255], fontStyle: "bold" },
    margin: { left: 14, right: 14 },
  });

  footer(doc);
  return doc;
}

export function gerarPdfPmocCliente(data: PmocReportData): jsPDF {
  const doc = new jsPDF();
  const clienteNome = data.filtroCliente || "Todos";
  header(doc, "Relatório PMOC por Cliente", `Cliente: ${clienteNome}`);
  doc.setTextColor(30, 30, 30);
  let y = 46;

  const planosFiltrados = data.filtroCliente
    ? data.planos.filter(p => p.clienteNome === data.filtroCliente) : data.planos;
  const planosIds = new Set(planosFiltrados.map(p => p.id));
  const atividadesFiltradas = data.atividades.filter(a => planosIds.has(a.planoId));
  const osFiltradas = data.ordensServico.filter(o => planosIds.has(o.planoId));

  // KPIs
  const exec = atividadesFiltradas.filter(a => a.ultimaExecucao).length;
  const pct = atividadesFiltradas.length > 0 ? Math.round((exec / atividadesFiltradas.length) * 100) : 0;
  y = tabelaResumo(doc, y, "Resumo", ["Indicador", "Valor"], [
    ["Planos", planosFiltrados.length.toString()],
    ["Atividades Programadas", atividadesFiltradas.length.toString()],
    ["Atividades Executadas", exec.toString()],
    ["% Execução", `${pct}%`],
    ["Ordens de Serviço", osFiltradas.length.toString()],
  ]);

  // OS detalhada
  if (osFiltradas.length > 0) {
    const ph = doc.internal.pageSize.getHeight();
    if (y + 30 > ph - 30) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 107);
    doc.text("Ordens de Serviço", 14, y);
    y += 3;
    autoTable(doc, {
      startY: y,
      head: [["Nº", "Equipamento", "Tipo", "Prioridade", "Status", "Abertura", "Conclusão"]],
      body: osFiltradas.map(o => [
        o.numero.toString(), o.equipamentoNome || "-", o.tipo, o.prioridade,
        o.status, o.dataAbertura || "-", o.dataConclusao || "-",
      ]),
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 58, 107], textColor: [255, 255, 255], fontStyle: "bold" },
      margin: { left: 14, right: 14 },
    });
  }

  footer(doc);
  return doc;
}

export function gerarPdfPmocConformidade(data: PmocReportData): jsPDF {
  const doc = new jsPDF();
  const totalAtiv = data.atividades.length;
  const exec = data.atividades.filter(a => a.ultimaExecucao).length;
  const pct = totalAtiv > 0 ? Math.round((exec / totalAtiv) * 100) : 0;
  header(doc, "Relatório de Conformidade PMOC", `Conformidade geral: ${pct}% | Inconformidades: ${data.inconformidades.length}`);
  doc.setTextColor(30, 30, 30);
  let y = 46;

  // Conformidade por plano
  const porPlano = data.planos.map(p => {
    const ativs = data.atividades.filter(a => a.planoId === p.id);
    const ex = ativs.filter(a => a.ultimaExecucao).length;
    return [p.titulo, p.clienteNome, ativs.length.toString(), ex.toString(),
      ativs.length > 0 ? `${Math.round((ex / ativs.length) * 100)}%` : "0%"];
  });
  y = tabelaResumo(doc, y, "Conformidade por Plano",
    ["Plano", "Cliente", "Atividades", "Executadas", "% Conformidade"], porPlano);

  // Inconformidades
  if (data.inconformidades.length > 0) {
    const ph = doc.internal.pageSize.getHeight();
    if (y + 30 > ph - 30) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 107);
    doc.text("Inconformidades", 14, y);
    y += 3;
    autoTable(doc, {
      startY: y,
      head: [["Nº", "Equipamento", "Gravidade", "Responsável", "Status", "Prazo"]],
      body: data.inconformidades.map(i => [
        i.numero.toString(), i.equipamentoNome || "-", i.gravidade,
        i.responsavel || "-", i.status, i.prazo || "-",
      ]),
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 58, 107], textColor: [255, 255, 255], fontStyle: "bold" },
      margin: { left: 14, right: 14 },
    });
  }

  footer(doc);
  return doc;
}

export function downloadPdfPmoc(data: PmocReportData) {
  let doc: jsPDF;
  let nome: string;
  const ts = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
  if (data.tipo === "cliente") {
    doc = gerarPdfPmocCliente(data);
    nome = `PMOC_Cliente_${(data.filtroCliente || "todos").replace(/\s+/g, "_")}_${ts}.pdf`;
  } else if (data.tipo === "conformidade") {
    doc = gerarPdfPmocConformidade(data);
    nome = `PMOC_Conformidade_${ts}.pdf`;
  } else {
    doc = gerarPdfPmocGeral(data);
    nome = `PMOC_Relatorio_Geral_${ts}.pdf`;
  }
  doc.save(nome);
}
