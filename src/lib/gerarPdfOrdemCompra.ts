import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PedidoCompra } from "@/contexts/PedidoCompraContext";
import { Cliente } from "@/contexts/ClientesContext";
import { format } from "date-fns";

interface OrdemCompraData {
  pedido: PedidoCompra;
  empresa: Cliente | null;
  fornecedor: Cliente | null;
  autorizadoPor: string;
}

export function gerarPdfOrdemCompra({ pedido, empresa, fornecedor, autorizadoPor }: OrdemCompraData): jsPDF {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ml = 10;
  const mr = pw - 10;

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // ==================== HEADER ====================
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("ORDEM DE", pw - 14, 18, { align: "right" });
  doc.text("COMPRA", pw - 14, 28, { align: "right" });

  // Company name area (top left)
  if (empresa) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(empresa.nome || "EMPRESA", ml, 18);
    if (empresa.nomeFantasia) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(empresa.nomeFantasia, ml, 24);
    }
  }

  let y = 38;

  // ==================== DADOS DO PEDIDO ====================
  const drawLabelValue = (label: string, value: string, x: number, yp: number, w: number) => {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(label, x + 1, yp - 1);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(value || "", x + 1, yp + 4);
  };

  const drawBox = (x: number, yp: number, w: number, h: number) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(x, yp, w, h);
  };

  // Row 1: Nº ordem / Data aprovação
  const rowH = 12;
  const halfW = (mr - ml) / 2;

  drawBox(ml, y, halfW, rowH);
  drawLabelValue("Nº da ordem de compra:", `PC-${String(pedido.numero).padStart(4, "0")}`, ml, y + 3, halfW);

  drawBox(ml + halfW, y, halfW, rowH);
  drawLabelValue("Data e Hora de aprovação:", format(new Date(pedido.dataCriacao), "dd/MM/yyyy HH:mm:ss"), ml + halfW, y + 3, halfW);
  y += rowH;

  // Row 2: Prioridade / Tipo Pedido
  drawBox(ml, y, halfW, rowH);
  drawLabelValue("PRIORIDADE:", "", ml, y + 3, halfW);

  drawBox(ml + halfW, y, halfW, rowH);
  drawLabelValue("TIPO PEDIDO:", "", ml + halfW, y + 3, halfW);
  y += rowH + 4;

  // ==================== EMPRESA (COMPRADORA) ====================
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");

  const colW1 = (mr - ml) * 0.5;
  const colW2 = (mr - ml) * 0.3;
  const colW3 = (mr - ml) * 0.2;

  // Row: Empresa | CNPJ | Insc.Est
  drawBox(ml, y, colW1, rowH);
  drawLabelValue("EMPRESA:", empresa?.nome || "", ml, y + 3, colW1);
  drawBox(ml + colW1, y, colW2, rowH);
  drawLabelValue("CNPJ:", empresa?.cnpj || "", ml + colW1, y + 3, colW2);
  drawBox(ml + colW1 + colW2, y, colW3, rowH);
  drawLabelValue("Insc. Est:", empresa?.inscricaoEstadual || "", ml + colW1 + colW2, y + 3, colW3);
  y += rowH;

  // Row: Endereço | Cidade/UF
  const addrW = (mr - ml) * 0.65;
  const cityW = (mr - ml) * 0.35;
  const endEmpresa = [empresa?.logradouro, empresa?.numero ? `Nº ${empresa.numero}` : "", empresa?.bairro].filter(Boolean).join(", ");
  drawBox(ml, y, addrW, rowH);
  drawLabelValue("ENDEREÇO:", endEmpresa, ml, y + 3, addrW);
  drawBox(ml + addrW, y, cityW, rowH);
  drawLabelValue("", `${empresa?.cidade || ""} / ${empresa?.uf || ""}`, ml + addrW, y + 3, cityW);
  y += rowH;

  // Row: CEP | TEL | EMAIL
  const col3W = (mr - ml) / 3;
  drawBox(ml, y, col3W, rowH);
  drawLabelValue("CEP:", empresa?.cep || "", ml, y + 3, col3W);
  drawBox(ml + col3W, y, col3W, rowH);
  drawLabelValue("TEL:", empresa?.telefones?.[0] || empresa?.telefoneCelular || "", ml + col3W, y + 3, col3W);
  drawBox(ml + col3W * 2, y, col3W, rowH);
  drawLabelValue("E-MAIL:", empresa?.emailCompras || empresa?.email || "", ml + col3W * 2, y + 3, col3W);
  y += rowH;

  // Row: Contato | Departamento
  drawBox(ml, y, halfW, rowH);
  drawLabelValue("CONTATO:", empresa?.contato || "", ml, y + 3, halfW);
  drawBox(ml + halfW, y, halfW, rowH);
  drawLabelValue("", "DEPARTAMENTO DE COMPRAS", ml + halfW, y + 3, halfW);
  y += rowH + 4;

  // ==================== FORNECEDOR ====================
  drawBox(ml, y, colW1, rowH);
  drawLabelValue("EMPRESA:", fornecedor?.nome || pedido.fornecedorNome, ml, y + 3, colW1);
  drawBox(ml + colW1, y, colW2, rowH);
  drawLabelValue("CNPJ:", fornecedor?.cnpj || "", ml + colW1, y + 3, colW2);
  drawBox(ml + colW1 + colW2, y, colW3, rowH);
  drawLabelValue("Insc. Est:", fornecedor?.inscricaoEstadual || "", ml + colW1 + colW2, y + 3, colW3);
  y += rowH;

  const endForn = fornecedor ? [fornecedor.logradouro, fornecedor.numero ? `Nº ${fornecedor.numero}` : "", fornecedor.bairro].filter(Boolean).join(", ") : "";
  drawBox(ml, y, addrW, rowH);
  drawLabelValue("ENDEREÇO:", endForn, ml, y + 3, addrW);
  drawBox(ml + addrW, y, cityW, rowH);
  drawLabelValue("", fornecedor ? `${fornecedor.cidade || ""} / ${fornecedor.uf || ""}` : "", ml + addrW, y + 3, cityW);
  y += rowH;

  drawBox(ml, y, col3W, rowH);
  drawLabelValue("CEP:", fornecedor?.cep || "", ml, y + 3, col3W);
  drawBox(ml + col3W, y, col3W, rowH);
  drawLabelValue("TEL.:", fornecedor?.telefones?.[0] || fornecedor?.telefoneCelular || "", ml + col3W, y + 3, col3W);
  drawBox(ml + col3W * 2, y, col3W, rowH);
  drawLabelValue("E-MAIL:", fornecedor?.email || "", ml + col3W * 2, y + 3, col3W);
  y += rowH + 4;

  // ==================== ENTREGA ====================
  drawBox(ml, y, halfW, rowH);
  drawLabelValue("LOCAL DE ENTREGA:", pedido.localEntrega || "", ml, y + 3, halfW);
  drawBox(ml + halfW, y, halfW, rowH);
  drawLabelValue("", "", ml + halfW, y + 3, halfW);
  y += rowH;

  drawBox(ml, y, halfW, rowH);
  drawLabelValue("CONTATO ENTREGA:", "", ml, y + 3, halfW);
  drawBox(ml + halfW, y, halfW, rowH);
  drawLabelValue("TEL.:", "", ml + halfW, y + 3, halfW);
  y += rowH;

  drawBox(ml, y, mr - ml, rowH);
  drawLabelValue("OBSERVAÇÃO:", pedido.observacoes || "", ml, y + 3, mr - ml);
  y += rowH + 4;

  // ==================== ITENS TABLE ====================
  const tableBody = pedido.itens.map((item, idx) => [
    String(idx + 1),
    item.descricao,
    item.unidadeMedida,
    String(item.quantidade.toFixed(2)),
    formatCurrency(item.precoUnitario),
    formatCurrency(item.valorTotal),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["#", "DESCRIÇÃO", "UN", "QTD", "Valor Unit.", "Valor Total"]],
    body: tableBody,
    foot: [["", "TOTAL GERAL", "", "", formatCurrency(pedido.valorTotal), ""]],
    margin: { left: ml, right: 10 },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 18, halign: "center" },
      4: { cellWidth: 28, halign: "right" },
      5: { cellWidth: 28, halign: "right" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ==================== CONDIÇÃO DE PAGAMENTO ====================
  const payH = 14;
  drawBox(ml, y, halfW, payH);
  drawLabelValue("CONDIÇÃO DE PAGAMENTO:", "", ml, y + 4, halfW);
  drawBox(ml + halfW, y, halfW, payH);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(pedido.condicaoPagamento || "A VISTA", ml + halfW + halfW / 2, y + 9, { align: "center" });
  y += payH + 6;

  // ==================== AUTORIZAÇÃO ====================
  drawBox(ml + halfW, y, halfW, payH);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`AUTORIZADO POR: ${autorizadoPor}`, ml + halfW + 4, y + 9);

  return doc;
}

export function downloadPdfOrdemCompra(data: OrdemCompraData) {
  const doc = gerarPdfOrdemCompra(data);
  doc.save(`Ordem_Compra_PC-${String(data.pedido.numero).padStart(4, "0")}.pdf`);
}

export function getPdfOrdemCompraBase64(data: OrdemCompraData): string {
  const doc = gerarPdfOrdemCompra(data);
  return doc.output("datauristring");
}
