import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface FinReport {
  titulo: string;
  subtitulo?: string;
  filtros?: string;
  colunas: string[];
  linhas: (string | number)[][];
  totais?: { label: string; valor: string }[];
}

export function gerarPdfFinanceiro(r: FinReport) {
  const orient = r.colunas.length > 6 ? "landscape" : "portrait";
  const doc = new jsPDF({ orientation: orient });
  const pw = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 58, 107);
  doc.rect(0, 0, pw, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(r.titulo, 14, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (r.subtitulo) doc.text(r.subtitulo, 14, 20);
  const dt = new Date();
  doc.text(`Gerado em: ${dt.toLocaleDateString("pt-BR")} ${dt.toLocaleTimeString("pt-BR")}`, pw - 14, 12, { align: "right" });
  if (r.filtros) doc.text(r.filtros, pw - 14, 20, { align: "right" });

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.text(`Total de registros: ${r.linhas.length}`, 14, 36);

  autoTable(doc, {
    startY: 42,
    head: [r.colunas],
    body: r.linhas.map((row) => row.map((c) => (c == null ? "" : String(c)))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 58, 107], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  if (r.totais && r.totais.length) {
    const finalY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    let y = finalY;
    r.totais.forEach((t) => {
      doc.text(`${t.label}: ${t.valor}`, pw - 14, y, { align: "right" });
      y += 6;
    });
  }

  // Footer
  const pages = doc.getNumberOfPages();
  const ph = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pages}`, pw / 2, ph - 8, { align: "center" });
    doc.text("SGM Lasant - Financeiro", 14, ph - 8);
  }

  doc.save(`${r.titulo.replace(/\s+/g, "_").toLowerCase()}.pdf`);
}

export function gerarExcelFinanceiro(r: FinReport) {
  const wb = XLSX.utils.book_new();
  const data = r.linhas.map((row) => {
    const o: Record<string, any> = {};
    r.colunas.forEach((c, i) => { o[c] = row[i] ?? ""; });
    return o;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = r.colunas.map(() => ({ wch: 20 }));
  if (r.totais && r.totais.length) {
    XLSX.utils.sheet_add_aoa(ws, [[]], { origin: -1 });
    r.totais.forEach((t) => {
      XLSX.utils.sheet_add_aoa(ws, [[t.label, t.valor]], { origin: -1 });
    });
  }
  XLSX.utils.book_append_sheet(wb, ws, r.titulo.substring(0, 31));
  XLSX.writeFile(wb, `${r.titulo.replace(/\s+/g, "_").toLowerCase()}.xlsx`);
}
