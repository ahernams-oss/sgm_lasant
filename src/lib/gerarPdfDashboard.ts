import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Requisicao } from "@/contexts/RequisicaoContext";

interface DashboardReportData {
  requisicoes: Requisicao[];
  dateFrom?: string;
  dateTo?: string;
}

export function gerarPdfDashboard({ requisicoes, dateFrom, dateTo }: DashboardReportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 58, 107);
  doc.rect(0, 0, pageWidth, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Requisições", 14, 16);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const periodo = dateFrom || dateTo
    ? `Período: ${dateFrom || "—"} a ${dateTo || "—"}`
    : "Período: Todos";
  doc.text(periodo, 14, 24);
  doc.setFontSize(9);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, pageWidth - 14, 16, { align: "right" });
  doc.text(`Total de requisições: ${requisicoes.length}`, pageWidth - 14, 24, { align: "right" });

  doc.setTextColor(30, 30, 30);
  let y = 46;

  // --- Resumo por Status ---
  const statusCounts: Record<string, number> = {};
  requisicoes.forEach((r) => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 107);
  doc.text("Resumo por Status", 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [["Status", "Quantidade", "Percentual"]],
    body: Object.entries(statusCounts).map(([status, count]) => [
      status,
      count.toString(),
      `${((count / requisicoes.length) * 100).toFixed(1)}%`,
    ]),
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 58, 107], textColor: [255, 255, 255], fontStyle: "bold" },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // --- Solicitações por Cliente/Unidade ---
  const clienteCounts: Record<string, number> = {};
  requisicoes.forEach((r) => { clienteCounts[r.unidade || "Sem unidade"] = (clienteCounts[r.unidade || "Sem unidade"] || 0) + 1; });
  const clienteSorted = Object.entries(clienteCounts).sort((a, b) => b[1] - a[1]);

  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + clienteSorted.length * 10 + 20 > pageHeight - 30) { doc.addPage(); y = 20; }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 107);
  doc.text("Solicitações por Cliente/Unidade", 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [["Cliente/Unidade", "Quantidade", "Percentual"]],
    body: clienteSorted.map(([name, count]) => [
      name,
      count.toString(),
      `${((count / requisicoes.length) * 100).toFixed(1)}%`,
    ]),
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 58, 107], textColor: [255, 255, 255], fontStyle: "bold" },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // --- Solicitações por Cargo ---
  const cargoCounts: Record<string, number> = {};
  requisicoes.forEach((r) => { cargoCounts[r.cargoNome || "Sem cargo"] = (cargoCounts[r.cargoNome || "Sem cargo"] || 0) + 1; });
  const cargoSorted = Object.entries(cargoCounts).sort((a, b) => b[1] - a[1]);

  if (y + cargoSorted.length * 10 + 20 > pageHeight - 30) { doc.addPage(); y = 20; }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 107);
  doc.text("Solicitações por Cargo", 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [["Cargo", "Quantidade", "Percentual"]],
    body: cargoSorted.map(([name, count]) => [
      name,
      count.toString(),
      `${((count / requisicoes.length) * 100).toFixed(1)}%`,
    ]),
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 58, 107], textColor: [255, 255, 255], fontStyle: "bold" },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // --- Lista detalhada das requisições ---
  if (y + 30 > pageHeight - 30) { doc.addPage(); y = 20; }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 107);
  doc.text("Lista Detalhada das Requisições", 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [["RC Nº", "Data", "Unidade", "Cargo", "Status", "Tipo Contratação"]],
    body: requisicoes.map((r) => [
      `RC ${r.numero}`,
      r.dataCriacao,
      r.unidade,
      r.cargoNome,
      r.status,
      r.tipoContratacao?.join(", ") || "",
    ]),
    theme: "striped",
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 58, 107], textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 22 },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200, 200, 200);
    doc.line(14, ph - 20, pageWidth - 14, ph - 20);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text("Relatório gerado automaticamente — SGM Lasant", 14, ph - 14);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, ph - 14, { align: "center" });
  }

  return doc;
}

export function downloadPdfDashboard(data: DashboardReportData) {
  const doc = gerarPdfDashboard(data);
  const periodoLabel = data.dateFrom || data.dateTo
    ? `${(data.dateFrom || "").replace(/\//g, "-")}_${(data.dateTo || "").replace(/\//g, "-")}`
    : "completo";
  doc.save(`Relatorio_Requisicoes_${periodoLabel}_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf`);
}

export function gerarTextoDashboard(requisicoes: Requisicao[], dateFrom?: string, dateTo?: string): string {
  const periodo = dateFrom || dateTo
    ? `Período: ${dateFrom || "—"} a ${dateTo || "—"}`
    : "Período: Todos";

  const statusCounts: Record<string, number> = {};
  requisicoes.forEach((r) => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });

  const clienteCounts: Record<string, number> = {};
  requisicoes.forEach((r) => { clienteCounts[r.unidade || "Sem unidade"] = (clienteCounts[r.unidade || "Sem unidade"] || 0) + 1; });

  let msg = `📊 *Relatório de Requisições*\n${periodo}\n\n`;
  msg += `📋 *Total:* ${requisicoes.length}\n\n`;

  msg += `*Por Status:*\n`;
  Object.entries(statusCounts).forEach(([status, count]) => {
    msg += `• ${status}: ${count} (${((count / requisicoes.length) * 100).toFixed(0)}%)\n`;
  });

  msg += `\n*Por Unidade:*\n`;
  Object.entries(clienteCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([name, count]) => {
      msg += `• ${name}: ${count}\n`;
    });

  msg += `\n_Gerado em ${new Date().toLocaleString("pt-BR")}_`;
  return msg;
}
