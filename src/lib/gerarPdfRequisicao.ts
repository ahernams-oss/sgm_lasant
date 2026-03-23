import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Requisicao } from "@/contexts/RequisicaoContext";

export function gerarPdfRequisicao(req: Requisicao) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 58, 107);
  doc.rect(0, 0, pageWidth, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Requisição de Colaborador", 14, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`RC Nº ${req.numero}`, 14, 22);
  doc.setFontSize(9);
  doc.text(`Data: ${req.dataCriacao}`, pageWidth - 14, 14, { align: "right" });
  doc.text(`Status: ${req.status}`, pageWidth - 14, 20, { align: "right" });
  if (req.aprovadoPor) {
    doc.text(`Aprovador: ${req.aprovadoPor}`, pageWidth - 14, 26, { align: "right" });
  }

  doc.setTextColor(30, 30, 30);
  let y = 44;

  const addSection = (title: string, rows: [string, string][]) => {
    const filteredRows = rows.filter(([, val]) => val && val.trim() !== "");
    if (filteredRows.length === 0) return;

    // Check if section fits on current page
    const estimatedHeight = filteredRows.length * 10 + 16;
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + estimatedHeight > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 107);
    doc.text(title, 14, y);
    y += 2;

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
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  };

  addSection("Especificação da Vaga", [
    ["Unidade", req.unidade],
    ["Cargo", req.cargoNome],
    ["Salário", req.salarioVaga ? `R$ ${req.salarioVaga}` : ""],
  ]);

  addSection("Jornada de Trabalho", [
    ["Jornada", req.jornada],
    ["Carga Horária", req.cargaHoraria],
  ]);

  addSection("Contratação", [
    ["Tipo", req.tipoContratacao?.join(", ") || ""],
    ["Recrutamento", req.internoExterno],
    ["Origem da Vaga", req.origemVaga],
    ["Motivo (Outros)", req.motivoOutros],
  ]);

  addSection("Colaborador Substituído", [
    ["Nome", req.nomeSubstituido],
    ["Matrícula", req.matricula],
    ["Cargo", req.cargoSubstituido],
    ["Salário", req.salarioSubstituido ? `R$ ${req.salarioSubstituido}` : ""],
    ["Data Desligamento", req.dataDesligamento],
  ]);

  addSection("Qualificação", [
    ["Formação", req.formacao?.join(", ") || ""],
    ["Detalhe Formação", req.formacaoDetalhe],
    ["Experiência", req.experiencia],
    ["Informática", req.conhecimentoInformatica],
  ]);

  addSection("Atividades do Cargo", [
    ["Atividades", req.atividadesCargo],
  ]);

  // Histórico de Status
  if (req.historicoStatus && req.historicoStatus.length > 0) {
    const pageHeight = doc.internal.pageSize.getHeight();
    const estimatedHeight = req.historicoStatus.length * 10 + 20;
    if (y + estimatedHeight > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 107);
    doc.text("Histórico de Status", 14, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [["Status", "Data/Hora", "Usuário"]],
      body: req.historicoStatus.map((h) => [
        h.status,
        h.dataHora,
        h.usuario || "—",
      ]),
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 58, 107], textColor: [255, 255, 255], fontStyle: "bold" },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200, 200, 200);
    doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text("Documento gerado automaticamente — SGM Lasant", 14, pageHeight - 14);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 14, { align: "center" });
    doc.text(`RC Nº ${req.numero}`, pageWidth - 14, pageHeight - 14, { align: "right" });
  }

  doc.save(`RC_${req.numero}_${req.unidade.replace(/\s+/g, "_")}_${req.dataCriacao.replace(/\//g, "-")}.pdf`);
}
