import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Orcamento } from "@/contexts/OrcamentosContext";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function gerarPdfOrcamento(orc: Orcamento, empresaNome?: string) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 58, 107);
  doc.rect(0, 0, pw, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Orçamento de Serviço", 14, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Orçamento Nº ${orc.numero}  —  SS Nº ${orc.solicitacaoNumero}`, 14, 22);
  doc.text(`Status: ${orc.status}`, 14, 28);
  doc.setFontSize(9);
  doc.text(empresaNome || "", pw - 14, 14, { align: "right" });
  doc.text(`Data: ${orc.createdAt ? new Date(orc.createdAt).toLocaleDateString("pt-BR") : ""}`, pw - 14, 22, { align: "right" });
  if (orc.aprovadoPor) {
    doc.text(`Aprovado por: ${orc.aprovadoPor}`, pw - 14, 28, { align: "right" });
  }

  doc.setTextColor(30, 30, 30);
  let y = 44;

  // Client info
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Dados do Cliente", 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Cliente: ${orc.clienteNome}`, 14, y);
  y += 12;

  // SCO Items
  if (orc.itensSco.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Itens SCO", 14, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [["Código", "Descrição", "Unidade", "Qtd", "Valor Unit.", "Total"]],
      body: [
        ...orc.itensSco.map(i => [
          i.codSco,
          i.descricao,
          i.unidade,
          String(i.quantidade),
          fmt(i.valorUnitario),
          fmt(i.valorTotal),
        ]),
        [{ content: "Subtotal SCO:", colSpan: 5, styles: { halign: "right", fontStyle: "bold" } }, { content: fmt(orc.itensSco.reduce((s, i) => s + i.valorTotal, 0)), styles: { fontStyle: "bold" } }],
      ],
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 58, 107], textColor: 255 },
      theme: "grid",
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Material Items
  if (orc.itensMateriais.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Materiais", 14, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [["Código", "Descrição", "Unidade", "Qtd", "Valor Unit.", "Total"]],
      body: [
        ...orc.itensMateriais.map(i => [
          i.codigo,
          i.descricao,
          i.unidade,
          String(i.quantidade),
          fmt(i.valorUnitario),
          fmt(i.valorTotal),
        ]),
        [{ content: "Subtotal Materiais:", colSpan: 5, styles: { halign: "right", fontStyle: "bold" } }, { content: fmt(orc.itensMateriais.reduce((s, i) => s + i.valorTotal, 0)), styles: { fontStyle: "bold" } }],
      ],
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 58, 107], textColor: 255 },
      theme: "grid",
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Total
  doc.setFillColor(240, 240, 245);
  doc.roundedRect(14, y, pw - 28, 16, 3, 3, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 107);
  doc.text("Valor Total do Orçamento:", 20, y + 10);
  doc.text(fmt(orc.valorTotal), pw - 20, y + 10, { align: "right" });
  y += 24;

  // Observations
  doc.setTextColor(30, 30, 30);
  if (orc.observacoes) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Observações", 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(orc.observacoes, pw - 28);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 8;
  }

  // Approval info
  if (orc.aprovadoPor) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(`Aprovado por ${orc.aprovadoPor} em ${orc.dataAprovacao ? new Date(orc.dataAprovacao).toLocaleDateString("pt-BR") : ""}`, 14, y);
  }

  doc.save(`Orcamento_${orc.numero}_SS${orc.solicitacaoNumero}.pdf`);
}
