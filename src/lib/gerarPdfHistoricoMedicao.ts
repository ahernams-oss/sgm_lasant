import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { MedicaoServico } from "@/contexts/MedicoesContext";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtPerc = (v: number) => `${v.toFixed(2)}%`;

export function gerarPdfHistoricoMedicao(med: MedicaoServico): jsPDF {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 58, 107);
  doc.rect(0, 0, pw, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Medição #${med.numero} — ${med.descricao || ""}`, 14, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 22);
  doc.text(`Status: ${med.status}`, 14, 28);

  doc.setTextColor(30, 30, 30);
  let y = 44;

  // Info
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Cliente / Obra:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(med.cliente_nome || "—", 55, y);

  doc.setFont("helvetica", "bold");
  doc.text("Fornecedor:", 110, y);
  doc.setFont("helvetica", "normal");
  doc.text((med as any).fornecedor_nome || "—", 145, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.text("Contrato:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(med.contrato || "—", 55, y);

  doc.setFont("helvetica", "bold");
  doc.text("Data Pgto:", 110, y);
  doc.setFont("helvetica", "normal");
  doc.text((med as any).data_pagamento || "—", 145, y);
  y += 10;

  // Summary box
  doc.setFillColor(240, 243, 248);
  doc.roundedRect(14, y, pw - 28, 18, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 107);
  doc.text(`Valor Contratado: ${fmt(med.valor_total_contratado || 0)}`, 20, y + 8);
  doc.text(`Valor Medido: ${fmt(med.valor_total_medido || 0)}`, 90, y + 8);
  doc.text(`% Executado: ${fmtPerc(med.percentual_medido || 0)}`, 155, y + 8);
  y += 28;

  // Itens do contrato
  doc.setTextColor(30, 58, 107);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Itens do Contrato", 14, y);
  y += 3;

  if (med.itens && med.itens.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Item", "Unidade", "Qtd Contratada", "Valor Unitário", "Valor Total"]],
      body: med.itens.map((item) => [
        item.descricao,
        item.unidade,
        item.quantidade_contratada.toString(),
        fmt(item.valor_unitario),
        fmt(item.valor_total_contratado),
      ]),
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 58, 107], textColor: [255, 255, 255], fontStyle: "bold" },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.text("Nenhum item cadastrado.", 14, y);
    y += 10;
  }

  // Histórico de medições
  const ph = doc.internal.pageSize.getHeight();
  if (y + 30 > ph - 30) { doc.addPage(); y = 20; }

  doc.setTextColor(30, 58, 107);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Histórico de Medições", 14, y);
  y += 3;

  if (med.medicoes && med.medicoes.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["#", "Data", "Tipo", "Valor", "%", "Status", "Observação"]],
      body: med.medicoes.map((l) => [
        l.numero.toString(),
        l.data,
        l.tipo === "percentual" ? "Percentual" : "Valor",
        fmt(l.valor_total),
        fmtPerc(l.percentual_total),
        l.status,
        l.observacao || "",
      ]),
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 58, 107], textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 10 }, 6: { cellWidth: 40 } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Totals row
    const totalValor = med.medicoes.reduce((s, l) => s + (l.valor_total || 0), 0);
    const totalPerc = med.medicoes.reduce((s, l) => s + (l.percentual_total || 0), 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(`Total das Medições: ${fmt(totalValor)} | ${fmtPerc(totalPerc)}`, 14, y);
  } else {
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.text("Nenhuma medição lançada.", 14, y);
  }

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const h = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200, 200, 200);
    doc.line(14, h - 18, pw - 14, h - 18);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text("Relatório gerado automaticamente — SGM Lasant", 14, h - 12);
    doc.text(`Página ${i} de ${pages}`, pw / 2, h - 12, { align: "center" });
  }

  return doc;
}

export function downloadPdfHistoricoMedicao(med: MedicaoServico) {
  const doc = gerarPdfHistoricoMedicao(med);
  doc.save(`Medicao_${med.numero}_Historico.pdf`);
}
