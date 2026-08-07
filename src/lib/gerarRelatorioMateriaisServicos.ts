import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { MaterialServico } from "@/contexts/MateriaisServicosContext";
import { addHeader, addFooter } from "@/lib/gerarRelatorioEstoque";

interface ExportData {
  materiais: MaterialServico[];
  getCatNome: (id: string) => string;
}

export async function gerarPdfMateriaisServicos({ materiais, getCatNome }: ExportData) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();

  const totalMat = materiais.filter(m => m.tipo === "Material").length;
  const totalServ = materiais.filter(m => m.tipo === "Serviço").length;

  await addHeader(doc, {
    title: "Relatório de Materiais e Serviços",
    subtitle: `Total: ${materiais.length} itens`,
    filters: `Materiais: ${totalMat} | Serviços: ${totalServ}`,
  });

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
  });

  addFooter(doc);
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
