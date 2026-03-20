import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Requisicao } from "@/contexts/RequisicaoContext";

export function gerarPdfRequisicao(req: Requisicao) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 58, 107); // primary blue
  doc.rect(0, 0, pageWidth, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Requisição de Colaborador", 14, 18);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Data: ${req.dataCriacao}`, pageWidth - 14, 18, { align: "right" });
  doc.text(`Status: ${req.status}`, pageWidth - 14, 24, { align: "right" });

  // Reset text color
  doc.setTextColor(30, 30, 30);

  let y = 44;

  const addSection = (title: string, rows: [string, string][]) => {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 107);
    doc.text(title, 14, y);
    y += 2;

    const filteredRows = rows.filter(([, val]) => val && val.trim() !== "");
    if (filteredRows.length === 0) {
      y += 6;
      return;
    }

    autoTable(doc, {
      startY: y,
      head: [],
      body: filteredRows,
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 3, textColor: [40, 40, 40] },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 55, textColor: [80, 80, 80] },
        1: { cellWidth: "auto" },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: () => {},
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  };

  addSection("Especificação da Vaga", [
    ["Unidade", req.unidade],
    ["Cargo", req.cargoNome],
  ]);

  addSection("Jornada de Trabalho", [
    ["Jornada", req.jornada],
  ]);

  addSection("Contratação", [
    ["Tipo", req.tipoContratacao?.join(", ") || ""],
    ["Origem da Vaga", req.origemVaga],
  ]);

  if (req.nomeSubstituido) {
    addSection("Colaborador Substituído", [
      ["Nome", req.nomeSubstituido],
    ]);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(200, 200, 200);
  doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.text("Documento gerado automaticamente — Sistema de RH Lasant", 14, pageHeight - 14);
  doc.text(`ID: ${req.id.slice(0, 8)}`, pageWidth - 14, pageHeight - 14, { align: "right" });

  doc.save(`RC_${req.unidade.replace(/\s+/g, "_")}_${req.dataCriacao.replace(/\//g, "-")}.pdf`);
}
