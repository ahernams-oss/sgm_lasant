import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SolicitacaoServico } from "@/contexts/SolicitacoesServicosContext";
import { Empresa } from "@/contexts/EmpresaContext";
import { formatNumeroAno } from "@/lib/formatNumero";

const ORANGE = [230, 150, 50] as const;
const DARK_BLUE = [30, 58, 107] as const;
const BORDER_COLOR = [180, 180, 180] as const;

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function compressImage(dataUrl: string, maxWidth = 800, quality = 0.5): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/** Renders a single SS into an existing jsPDF doc (starting on current page). */
async function renderSolicitacao(
  doc: jsPDF,
  ss: SolicitacaoServico,
  comImagens: boolean,
  empresa?: Empresa,
  equipamento?: any
) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ml = 14;
  const mr = 14;
  const cw = pw - ml - mr;

  let y = 14;

  // ===== LOGO =====
  if (empresa?.logoUrl) {
    const logoData = await loadImageAsDataUrl(empresa.logoUrl);
    if (logoData) {
      try {
        doc.addImage(logoData, "PNG", ml, y, 40, 18);
      } catch { /* ignore */ }
    }
  }

  // ===== TITLE =====
  doc.setFontSize(16);
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(...DARK_BLUE);
  doc.text("SOLICITAÇÃO DE SERVIÇO", pw / 2, y + 10, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(80, 80, 80);
  doc.text(ss.clienteNome || "Cliente", pw / 2, y + 18, { align: "center" });

  y += 24;
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.5);
  doc.line(ml, y, pw - mr, y);
  y += 8;

  // ===== INFO TABLE =====
  const dataFormatada = ss.dataHoraSolicitacao
    ? new Date(ss.dataHoraSolicitacao).toLocaleDateString("pt-BR")
    : "dd/mm/yyyy";

  autoTable(doc, {
    startY: y,
    theme: "plain",
    styles: { fontSize: 8, cellPadding: 2.5, lineColor: [180, 180, 180], lineWidth: 0.3, textColor: [30, 30, 30] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 32 },
      1: { cellWidth: 48 },
      2: { fontStyle: "bold", cellWidth: 28 },
      3: { cellWidth: "auto" },
    },
    body: [
      [
        { content: "Número da SS:", styles: { fontStyle: "bold" } },
        `SS ${formatNumeroAno(ss.numero, ss.createdAt)}`,
        { content: "Prioridade:", styles: { fontStyle: "bold" } },
        { content: ss.prioridade || "-", styles: { fontStyle: "bold", textColor: ss.prioridade === "Emergencial" ? [200, 0, 0] : ss.prioridade === "Urgente" ? [200, 150, 0] : [30, 30, 30] } },
      ],
      [
        { content: "Data solicitação:", styles: { fontStyle: "bold" } },
        dataFormatada,
        { content: "Situação:", styles: { fontStyle: "bold" } },
        { content: ss.situacao || "-", styles: { fontStyle: "bold", textColor: [...DARK_BLUE] } },
      ],
      [
        { content: "Data aprovação:", styles: { fontStyle: "bold" } },
        "-",
        { content: "Solicitante:", styles: { fontStyle: "bold" } },
        ss.solicitanteNome || "-",
      ],
    ],
    margin: { left: ml, right: mr },
  });

  y = (doc as any).lastAutoTable.finalY;

  // ===== LOCATION TABLE =====
  autoTable(doc, {
    startY: y,
    theme: "plain",
    styles: { fontSize: 8, cellPadding: 2.5, lineColor: [180, 180, 180], lineWidth: 0.3, textColor: [30, 30, 30] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 24 },
      1: { cellWidth: 56 },
      2: { fontStyle: "bold", cellWidth: 28 },
      3: { cellWidth: "auto" },
    },
    body: [
      [
        { content: "Local:", styles: { fontStyle: "bold" } },
        ss.localDescricao || "-",
        { content: "Pavimento:", styles: { fontStyle: "bold" } },
        ss.pavimentoDescricao || "-",
      ],
      [
        { content: "Setor:", styles: { fontStyle: "bold" } },
        ss.setorDescricao || "-",
        { content: "Autorizado por:", styles: { fontStyle: "bold" } },
        "-",
      ],
      [
        { content: "Visitado:", styles: { fontStyle: "bold" } },
        ss.visitado ? "Sim" : "Não",
        "",
        "",
      ],
    ],
    margin: { left: ml, right: mr },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ===== SERVIÇO SOLICITADO =====
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Serviço solicitado:", ml, y);
  y += 3;

  const descHeight = 18;
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.rect(ml, y, cw, descHeight);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  const descLines = doc.splitTextToSize(ss.descricaoServicos || "", cw - 4);
  doc.text(descLines, ml + 2, y + 4);
  y += descHeight + 6;

  // ===== RESSALVA DA FISCALIZAÇÃO =====
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Ressalva da fiscalização:", ml, y);
  y += 3;

  const ressalvaHeight = 14;
  doc.setDrawColor(...BORDER_COLOR);
  doc.rect(ml, y, cw, ressalvaHeight);
  if (ss.observacoes) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    const obsLines = doc.splitTextToSize(ss.observacoes, cw - 4);
    doc.text(obsLines, ml + 2, y + 4);
  }
  y += ressalvaHeight + 6;

  // ===== MATERIAL / SERVIÇO UTILIZADO =====
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2.5, lineColor: [180, 180, 180], lineWidth: 0.3, textColor: [30, 30, 30] },
    headStyles: { fillColor: [230, 150, 50], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
    head: [[{ content: "MATERIAL / SERVIÇO UTILIZADO", colSpan: 4, styles: { halign: "center" } }]],
    body: [],
    margin: { left: ml, right: mr },
  });

  y = (doc as any).lastAutoTable.finalY;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2.5, lineColor: [180, 180, 180], lineWidth: 0.3, textColor: [30, 30, 30], minCellHeight: 8 },
    headStyles: { fillColor: [255, 255, 255], textColor: [30, 30, 30], fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { cellWidth: 25, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 28, halign: "center" },
    },
    head: [["Código", "Descrição", "Unid.", "Quantidade"]],
    body: [["", "", "", ""], ["", "", "", ""], ["", "", "", ""], ["", "", "", ""], ["", "", "", ""], ["", "", "", ""]],
    margin: { left: ml, right: mr },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ===== EQUIPMENT INFO =====
  if (ss.tipo === "Equipamentos" || equipamento) {
    const eqData = equipamento || {};
    autoTable(doc, {
      startY: y,
      theme: "plain",
      styles: { fontSize: 8, cellPadding: 2, lineColor: [180, 180, 180], lineWidth: 0.3, textColor: [30, 30, 30] },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 30, fillColor: [230, 150, 50], textColor: [255, 255, 255] },
        1: { cellWidth: "auto" },
      },
      body: [
        ["Modelo:", eqData.modelo || ""],
        ["Serie:", eqData.serie || ""],
        ["Amperagem:", eqData.corrente || ""],
        ["Pressão:", ""],
        ["Tipo de Gás:", ""],
        ["Voltagem:", eqData.tensao || ""],
      ],
      margin: { left: ml, right: ml + 80 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ===== IMAGENS =====
  if (comImagens && ss.imagens && ss.imagens.length > 0) {
    doc.addPage();
    y = 20;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_BLUE);
    doc.text("Imagens", ml, y);
    y += 8;

    for (let i = 0; i < ss.imagens.length; i++) {
      const dataUrl = await loadImageAsDataUrl(ss.imagens[i]);
      if (dataUrl) {
        const compressed = await compressImage(dataUrl, 800, 0.45);
        const imgWidth = cw;
        const imgHeight = 100;

        if (y + imgHeight + 10 > ph - 30) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`Imagem ${i + 1}`, ml, y);
        y += 4;

        try {
          doc.addImage(compressed, "JPEG", ml, y, imgWidth, imgHeight);
        } catch { /* ignore */ }
        y += imgHeight + 10;
      } else {
        doc.setFontSize(8);
        doc.setTextColor(200, 0, 0);
        doc.text(`Erro ao carregar imagem ${i + 1}`, ml, y);
        y += 10;
      }
    }
  }
}

/** Adds footers to all pages of the doc. */
function addFooters(doc: jsPDF, empresa?: Empresa, ssNumero?: string) {
  const pw = doc.internal.pageSize.getWidth();
  const ml = 14;
  const mr = 14;
  const pageCount = doc.getNumberOfPages();
  const empresaNome = empresa?.nomeFantasia || empresa?.razaoSocial || "SGM Lasant";

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200, 200, 200);
    doc.line(ml, pageH - 20, pw - mr, pageH - 20);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text(`Documento gerado automaticamente — ${empresaNome}`, ml, pageH - 14);
    doc.text(`Página ${i} de ${pageCount}`, pw / 2, pageH - 14, { align: "center" });
    if (ssNumero) {
      doc.text(`SS Nº ${ssNumero}`, pw - mr, pageH - 14, { align: "right" });
    }
  }
}

/** Generates a single PDF for one SS. */
export async function gerarPdfSolicitacao(
  ss: SolicitacaoServico,
  comImagens: boolean,
  empresa?: Empresa,
  equipamento?: any
) {
  const doc = new jsPDF();
  await renderSolicitacao(doc, ss, comImagens, empresa, equipamento);
  addFooters(doc, empresa, formatNumeroAno(ss.numero, ss.createdAt));
  doc.save(`SS_${formatNumeroAno(ss.numero, ss.createdAt)}_${ss.clienteNome?.replace(/\s+/g, "_") || "sem_cliente"}.pdf`);
}

/** Generates a single PDF containing multiple SS (one per page group). */
export async function gerarPdfSolicitacaoLote(
  lista: { ss: SolicitacaoServico; equipamento?: any }[],
  comImagens: boolean,
  empresa?: Empresa
) {
  if (lista.length === 0) return;

  const doc = new jsPDF();

  for (let idx = 0; idx < lista.length; idx++) {
    if (idx > 0) doc.addPage();
    const { ss, equipamento } = lista[idx];
    await renderSolicitacao(doc, ss, comImagens, empresa, equipamento);
  }

  // Footers on all pages
  const pw = doc.internal.pageSize.getWidth();
  const ml = 14;
  const mr = 14;
  const pageCount = doc.getNumberOfPages();
  const empresaNome = empresa?.nomeFantasia || empresa?.razaoSocial || "SGM Lasant";

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200, 200, 200);
    doc.line(ml, pageH - 20, pw - mr, pageH - 20);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text(`Documento gerado automaticamente — ${empresaNome}`, ml, pageH - 14);
    doc.text(`Página ${i} de ${pageCount}`, pw / 2, pageH - 14, { align: "center" });
  }

  const numeros = lista.map(l => l.ss.numero).join("_");
  doc.save(`SS_Lote_${numeros}.pdf`);
}
