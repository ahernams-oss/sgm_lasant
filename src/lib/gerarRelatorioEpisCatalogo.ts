import { addHeader, addFooter } from "@/lib/gerarRelatorioEstoque";
import type { EpiCatalogo } from "@/contexts/EpisCatalogoContext";

const val = (m: number | null) => (m ? `${m} ${m === 1 ? "mês" : "meses"}` : "—");

export async function gerarPdfEpisCatalogo(epis: EpiCatalogo[], filtros?: string) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ compress: true, orientation: "landscape" });
  await addHeader(doc, { title: "Relatório do Catálogo de EPIs", subtitle: `Total: ${epis.length} EPI(s)`, filters: filtros });
  autoTable(doc, {
    startY: 44,
    head: [["Código", "Descrição", "CA", "Validade", "Observação"]],
    body: epis.map((e) => [e.codigo || "—", e.descricao, e.ca || "—", val(e.validadeMeses), e.observacao || ""]),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 58, 107], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: "auto", fontStyle: "bold" }, 2: { cellWidth: 25, halign: "center" }, 3: { cellWidth: 25, halign: "center" }, 4: { cellWidth: 80 } },
    margin: { bottom: 16 },
  });
  addFooter(doc);
  doc.save("relatorio-catalogo-epis.pdf");
}

export async function gerarExcelEpisCatalogo(epis: EpiCatalogo[]) {
  const XLSX = await import("xlsx");
  const data = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  const ws = XLSX.utils.aoa_to_sheet([
    ["LASANT — SGM"], ["Relatório do Catálogo de EPIs"], [`Emitido em: ${data} · Total: ${epis.length} EPI(s)`], [],
    ["Código", "Descrição", "CA", "Validade (meses)", "Observação"],
    ...epis.map((e) => [e.codigo || "", e.descricao, e.ca || "", e.validadeMeses ?? "", e.observacao || ""]),
  ]);
  ws["!cols"] = [{ wch: 14 }, { wch: 50 }, { wch: 12 }, { wch: 16 }, { wch: 50 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "EPIs");
  XLSX.writeFile(wb, "relatorio-catalogo-epis.xlsx", { compression: true });
}
