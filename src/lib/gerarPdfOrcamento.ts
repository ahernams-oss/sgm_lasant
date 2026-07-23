import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Orcamento } from "@/contexts/OrcamentosContext";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type LinhaItem = {
  origem: "SCO" | "MAT";
  familia: string;
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
};

const SEM_FAMILIA = "SEM FAMÍLIA";

function agruparPorFamilia(orc: Orcamento) {
  const linhas: LinhaItem[] = [
    ...orc.itensSco.map<LinhaItem>(i => ({
      origem: "SCO",
      familia: (i.familia || SEM_FAMILIA).trim().toUpperCase() || SEM_FAMILIA,
      codigo: i.codSco, descricao: i.descricao, unidade: i.unidade,
      quantidade: i.quantidade, valorUnitario: i.valorUnitario, valorTotal: i.valorTotal,
    })),
    ...orc.itensMateriais.map<LinhaItem>(i => ({
      origem: "MAT",
      familia: (i.familia || SEM_FAMILIA).trim().toUpperCase() || SEM_FAMILIA,
      codigo: i.codigo, descricao: i.descricao, unidade: i.unidade,
      quantidade: i.quantidade, valorUnitario: i.valorUnitario, valorTotal: i.valorTotal,
    })),
  ];
  const grupos = new Map<string, LinhaItem[]>();
  for (const l of linhas) {
    if (!grupos.has(l.familia)) grupos.set(l.familia, []);
    grupos.get(l.familia)!.push(l);
  }
  return Array.from(grupos.entries()).sort(([a], [b]) => a.localeCompare(b, "pt-BR"));
}

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
  doc.text(`Status: ${orc.status}${orc.categoria ? "  |  Categoria: " + orc.categoria : ""}`, 14, 28);
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
  y += 8;

  // Tabela agrupada por Família (estilo planilha modelo)
  const grupos = agruparPorFamilia(orc);

  if (grupos.length > 0) {
    const body: any[] = [];
    for (const [familia, itens] of grupos) {
      // Cabeçalho da família (linha destacada)
      body.push([{
        content: familia,
        colSpan: 6,
        styles: { fillColor: [220, 228, 240], textColor: 30, fontStyle: "bold", halign: "left" },
      }]);
      let subtotal = 0;
      for (const it of itens) {
        subtotal += it.valorTotal;
        body.push([
          it.codigo,
          it.descricao,
          it.unidade,
          it.quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 4 }),
          fmt(it.valorUnitario),
          fmt(it.valorTotal),
        ]);
      }
      // Subtotal da família
      body.push([
        { content: `Subtotal ${familia}:`, colSpan: 5, styles: { halign: "right", fontStyle: "bold", fillColor: [245, 247, 252] } },
        { content: fmt(subtotal), styles: { fontStyle: "bold", fillColor: [245, 247, 252] } },
      ]);
    }
    // Total geral
    body.push([
      { content: "TOTAL GERAL:", colSpan: 5, styles: { halign: "right", fontStyle: "bold", fillColor: [30, 58, 107], textColor: 255 } },
      { content: fmt(orc.valorTotal), styles: { fontStyle: "bold", fillColor: [30, 58, 107], textColor: 255 } },
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Código", "Descrição", "Unid", "Quant", "Pr. Unit.", "Pr. Total"]],
      body,
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 58, 107], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 28 },
        2: { cellWidth: 14, halign: "center" },
        3: { cellWidth: 18, halign: "right" },
        4: { cellWidth: 24, halign: "right" },
        5: { cellWidth: 26, halign: "right" },
      },
      theme: "grid",
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Observations
  if (orc.observacoes) {
    if (y > 250) { doc.addPage(); y = 20; }
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
