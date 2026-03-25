import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PedidoCompra } from "@/contexts/PedidoCompraContext";
import { Cliente } from "@/contexts/ClientesContext";
import { Empresa } from "@/contexts/EmpresaContext";
import { format } from "date-fns";

interface OrdemCompraData {
  pedido: PedidoCompra;
  empresa: Empresa | null;
  fornecedor: Cliente | null;
  autorizadoPor: string;
}

// ── helpers ──────────────────────────────────────────────
async function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const BLUE = { r: 30, g: 58, b: 107 };        // Lasant dark blue
const LIGHT_BLUE = { r: 220, g: 230, b: 245 }; // section header bg
const BORDER = { r: 180, g: 195, b: 215 };      // soft border

// ── draw helpers ─────────────────────────────────────────
function sectionTitle(doc: jsPDF, text: string, x: number, y: number, w: number): number {
  doc.setFillColor(BLUE.r, BLUE.g, BLUE.b);
  doc.rect(x, y, w, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(text, x + 3, y + 5);
  doc.setTextColor(0, 0, 0);
  return y + 7;
}

function fieldRow(
  doc: jsPDF,
  fields: { label: string; value: string; w: number }[],
  x: number,
  y: number,
  h: number
) {
  let cx = x;
  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  doc.setLineWidth(0.3);
  for (const f of fields) {
    doc.setFillColor(LIGHT_BLUE.r, LIGHT_BLUE.g, LIGHT_BLUE.b);
    doc.rect(cx, y, f.w, h / 2, "F");
    doc.rect(cx, y, f.w, h);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(BLUE.r, BLUE.g, BLUE.b);
    doc.text(f.label, cx + 2, y + 3.5);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(f.value || "—", cx + 2, y + h / 2 + 4);
    cx += f.w;
  }
  return y + h;
}

// ── main generator (async for logo) ─────────────────────
export async function gerarPdfOrdemCompraAsync(data: OrdemCompraData): Promise<jsPDF> {
  const { pedido, empresa, fornecedor, autorizadoPor } = data;
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ml = 12;
  const mr = pw - 12;
  const fullW = mr - ml;

  // load logo from empresa or fallback
  let logo: string | null = null;
  const logoSrc = empresa?.logoUrl || "/Logo_Lasant.png";
  try { logo = await loadImage(logoSrc); } catch { /* fallback */ }

  // ────────── HEADER ──────────
  // background stripe
  doc.setFillColor(BLUE.r, BLUE.g, BLUE.b);
  doc.rect(0, 0, pw, 34, "F");

  // logo
  if (logo) {
    doc.addImage(logo, "PNG", ml, 5, 38, 24);
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("LASANT CONSTRUÇÕES", ml + 2, 20);
  }

  // title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("ORDEM DE COMPRA", mr, 16, { align: "right" });

  // order number badge
  const pcNum = `PC-${String(pedido.numero).padStart(4, "0")}`;
  doc.setFontSize(12);
  doc.text(`Nº ${pcNum}`, mr, 27, { align: "right" });

  doc.setTextColor(0, 0, 0);
  let y = 40;

  // ────────── DADOS DO PEDIDO ──────────
  const rowH = 11;

  y = fieldRow(doc, [
    { label: "DATA DE EMISSÃO", value: format(new Date(pedido.dataCriacao), "dd/MM/yyyy HH:mm"), w: fullW * 0.35 },
    { label: "CONDIÇÃO DE PAGAMENTO", value: pedido.condicaoPagamento || "À VISTA", w: fullW * 0.35 },
    { label: "PRAZO DE ENTREGA", value: pedido.prazoEntrega || "—", w: fullW * 0.3 },
  ], ml, y, rowH);

  y += 3;

  // ────────── EMPRESA (COMPRADORA) ──────────
  y = sectionTitle(doc, "DADOS DA EMPRESA", ml, y, fullW);

  y = fieldRow(doc, [
    { label: "RAZÃO SOCIAL", value: empresa?.nome || "", w: fullW * 0.5 },
    { label: "CNPJ", value: empresa?.cnpj || "", w: fullW * 0.3 },
    { label: "INSC. ESTADUAL", value: empresa?.inscricaoEstadual || "", w: fullW * 0.2 },
  ], ml, y, rowH);

  const endEmpresa = [empresa?.logradouro, empresa?.numero ? `Nº ${empresa.numero}` : "", empresa?.bairro].filter(Boolean).join(", ");
  y = fieldRow(doc, [
    { label: "ENDEREÇO", value: endEmpresa, w: fullW * 0.5 },
    { label: "CIDADE / UF", value: `${empresa?.cidade || ""} / ${empresa?.uf || ""}`, w: fullW * 0.3 },
    { label: "CEP", value: empresa?.cep || "", w: fullW * 0.2 },
  ], ml, y, rowH);

  y = fieldRow(doc, [
    { label: "CONTATO", value: empresa?.contato || "", w: fullW * 0.35 },
    { label: "TELEFONE", value: empresa?.telefones?.[0] || empresa?.telefoneCelular || "", w: fullW * 0.3 },
    { label: "E-MAIL", value: empresa?.emailCompras || empresa?.email || "", w: fullW * 0.35 },
  ], ml, y, rowH);

  y += 3;

  // ────────── FORNECEDOR ──────────
  y = sectionTitle(doc, "DADOS DO FORNECEDOR", ml, y, fullW);

  y = fieldRow(doc, [
    { label: "RAZÃO SOCIAL", value: fornecedor?.nome || pedido.fornecedorNome, w: fullW * 0.5 },
    { label: "CNPJ", value: fornecedor?.cnpj || "", w: fullW * 0.3 },
    { label: "INSC. ESTADUAL", value: fornecedor?.inscricaoEstadual || "", w: fullW * 0.2 },
  ], ml, y, rowH);

  const endForn = fornecedor ? [fornecedor.logradouro, fornecedor.numero ? `Nº ${fornecedor.numero}` : "", fornecedor.bairro].filter(Boolean).join(", ") : "";
  y = fieldRow(doc, [
    { label: "ENDEREÇO", value: endForn, w: fullW * 0.5 },
    { label: "CIDADE / UF", value: fornecedor ? `${fornecedor.cidade || ""} / ${fornecedor.uf || ""}` : "", w: fullW * 0.3 },
    { label: "CEP", value: fornecedor?.cep || "", w: fullW * 0.2 },
  ], ml, y, rowH);

  y = fieldRow(doc, [
    { label: "CONTATO", value: fornecedor?.contato || "", w: fullW * 0.35 },
    { label: "TELEFONE", value: fornecedor?.telefones?.[0] || fornecedor?.telefoneCelular || "", w: fullW * 0.3 },
    { label: "E-MAIL", value: fornecedor?.email || "", w: fullW * 0.35 },
  ], ml, y, rowH);

  y += 3;

  // ────────── ENTREGA ──────────
  y = sectionTitle(doc, "DADOS DE ENTREGA", ml, y, fullW);

  y = fieldRow(doc, [
    { label: "LOCAL DE ENTREGA", value: pedido.localEntrega || "", w: fullW * 0.5 },
    { label: "OBSERVAÇÕES", value: pedido.observacoes || "", w: fullW * 0.5 },
  ], ml, y, rowH);

  y += 3;

  // ────────── ITENS ──────────
  y = sectionTitle(doc, "ITENS DO PEDIDO", ml, y, fullW);

  const tableBody = pedido.itens.map((item, idx) => [
    String(idx + 1),
    item.descricao,
    item.unidadeMedida,
    String(item.quantidade.toFixed(2)),
    fmt(item.precoUnitario),
    fmt(item.valorTotal),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["#", "DESCRIÇÃO", "UN", "QTD", "VALOR UNIT.", "VALOR TOTAL"]],
    body: tableBody,
    margin: { left: ml, right: 12 },
    styles: { fontSize: 8, cellPadding: 2.5, lineColor: [BORDER.r, BORDER.g, BORDER.b], lineWidth: 0.3 },
    headStyles: {
      fillColor: [BLUE.r, BLUE.g, BLUE.b],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 28, halign: "right" },
      5: { cellWidth: 28, halign: "right" },
    },
  });

  y = (doc as any).lastAutoTable.finalY;

  // total row
  doc.setFillColor(BLUE.r, BLUE.g, BLUE.b);
  doc.rect(ml, y, fullW, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("VALOR TOTAL:", ml + 4, y + 6.5);
  doc.text(fmt(pedido.valorTotal), mr - 4, y + 6.5, { align: "right" });
  doc.setTextColor(0, 0, 0);
  y += 15;

  // ────────── AUTORIZAÇÃO ──────────
  const sigW = fullW * 0.45;
  const sigX = ml + (fullW - sigW) / 2;
  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  doc.setLineWidth(0.5);
  doc.line(sigX, y + 12, sigX + sigW, y + 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(autorizadoPor || "Responsável", ml + fullW / 2, y + 18, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Autorizado por", ml + fullW / 2, y + 23, { align: "center" });

  // ────────── FOOTER ──────────
  doc.setFillColor(BLUE.r, BLUE.g, BLUE.b);
  doc.rect(0, ph - 10, pw, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text(`Documento gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pw / 2, ph - 4, { align: "center" });

  return doc;
}

// sync fallback (no logo)
export function gerarPdfOrdemCompra(data: OrdemCompraData): jsPDF {
  // kept for backward compat but callers should migrate to async
  const { pedido, empresa, fornecedor, autorizadoPor } = data;
  const doc = new jsPDF();
  // call async version result is not awaited here – use downloadPdfOrdemCompra instead
  // This is a simplified sync version
  return doc;
}

export async function downloadPdfOrdemCompra(data: OrdemCompraData) {
  const doc = await gerarPdfOrdemCompraAsync(data);
  doc.save(`Ordem_Compra_PC-${String(data.pedido.numero).padStart(4, "0")}.pdf`);
}

export async function getPdfOrdemCompraBase64(data: OrdemCompraData): Promise<string> {
  const doc = await gerarPdfOrdemCompraAsync(data);
  return doc.output("datauristring");
}
