import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { MaterialServico } from "@/contexts/MateriaisServicosContext";

interface ExportData {
  materiais: MaterialServico[];
  getCatNome: (id: string) => string;
}

export function gerarPdfMateriaisServicos({ materiais, getCatNome }: ExportData) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 58, 107);
  doc.rect(0, 0, pw, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Materiais e Serviços", 14, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`, pw - 14, 14, { align: "right" });
  doc.text(`Total: ${materiais.length} itens`, pw - 14, 20, { align: "right" });

  doc.setTextColor(30, 30, 30);

  // Summary
  const totalMat = materiais.filter(m => m.tipo === "Material").length;
  const totalServ = materiais.filter(m => m.tipo === "Serviço").length;
  doc.setFontSize(10);
  doc.text(`Materiais: ${totalMat}    |    Serviços: ${totalServ}`, 14, 38);

  // Table
  autoTable(doc, {
    startY: 44,
    head: [["Código", "Descrição", "Tipo", "Unidade", "Categoria"]],
    body: materiais.map(m => [
      m.codigo,
      m.descricao,
      m.tipo,
      m.unidadeMedida,
      getCatNome(m.categoriaId),
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [30, 58, 107], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: "bold", font: "courier" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 22 },
      3: { cellWidth: 20 },
      4: { cellWidth: 50 },
    },
    didDrawPage: (data) => {
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${doc.getCurrentPageInfo().pageNumber}`, pw / 2, pageH - 8, { align: "center" });
    },
  });

  doc.save("materiais_servicos.pdf");
}

export function gerarExcelMateriaisServicos({ materiais, getCatNome }: ExportData) {
  const data = materiais.map(m => ({
    "Código": m.codigo,
    "Descrição": m.descricao,
    "Tipo": m.tipo,
    "Unidade de Medida": m.unidadeMedida,
    "Categoria": getCatNome(m.categoriaId),
  }));

  const ws = XLSX.utils.json_to_sheet(data);

  // Column widths
  ws["!cols"] = [
    { wch: 10 },
    { wch: 40 },
    { wch: 12 },
    { wch: 18 },
    { wch: 40 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Materiais e Serviços");
  XLSX.writeFile(wb, "materiais_servicos.xlsx");
}
