import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ReportHeader {
  title: string;
  subtitle?: string;
  filters?: string;
}

function addHeader(doc: jsPDF, h: ReportHeader) {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(30, 58, 107);
  doc.rect(0, 0, pw, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(h.title, 14, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (h.subtitle) doc.text(h.subtitle, 14, 20);
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`, pw - 14, 12, { align: "right" });
  if (h.filters) doc.text(h.filters, pw - 14, 20, { align: "right" });
  doc.setTextColor(30, 30, 30);
}

function addFooter(doc: jsPDF) {
  const ph = doc.internal.pageSize.getHeight();
  const pw = doc.internal.pageSize.getWidth();
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pages}`, pw / 2, ph - 8, { align: "center" });
  }
}

export function gerarPdfEstoque(title: string, columns: string[], rows: string[][], filters?: string) {
  const doc = new jsPDF({ orientation: columns.length > 6 ? "landscape" : "portrait" });
  addHeader(doc, { title, subtitle: `Total: ${rows.length} registros`, filters });
  autoTable(doc, {
    startY: 34,
    head: [columns],
    body: rows,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [30, 58, 107], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    didDrawPage: () => {},
  });
  addFooter(doc);
  doc.save(`${title.replace(/\s+/g, "_").toLowerCase()}.pdf`);
}

export function gerarExcelEstoque(title: string, columns: string[], rows: string[][]) {
  const data = rows.map(row => {
    const obj: Record<string, string> = {};
    columns.forEach((col, i) => { obj[col] = row[i] || ""; });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = columns.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 31));
  XLSX.writeFile(wb, `${title.replace(/\s+/g, "_").toLowerCase()}.xlsx`);
}
