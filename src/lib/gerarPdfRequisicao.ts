import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Requisicao } from "@/contexts/RequisicaoContext";
import { Empresa } from "@/contexts/EmpresaContext";

const DARK_BLUE: [number, number, number] = [30, 58, 107];
const BORDER_COLOR: [number, number, number] = [180, 180, 180];

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

export async function gerarPdfRequisicao(req: Requisicao, empresa?: Empresa) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ml = 14;
  const mr = 14;

  let y = 10;

  // ===== HEADER =====
  // Logo on the left
  if (empresa?.logoUrl) {
    const logoData = await loadImageAsDataUrl(empresa.logoUrl);
    if (logoData) {
      try {
        doc.addImage(logoData, "PNG", ml, y, 40, 18);
      } catch { /* ignore */ }
    }
  }

  // Dark blue banner in the center
  const bannerX = 70;
  const bannerW = 90;
  const bannerH = 24;
  doc.setFillColor(...DARK_BLUE);
  doc.rect(bannerX, y, bannerW, bannerH, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Requisição de Colaborador", bannerX + bannerW / 2, y + 10, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`RC Nº ${req.numero}`, bannerX + bannerW / 2, y + 18, { align: "center" });

  // Date & Status on the right
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.text(`Data: ${req.dataCriacao}`, pw - mr, y + 8, { align: "right" });
  doc.text(`Status: ${req.status}`, pw - mr, y + 15, { align: "right" });

  y += bannerH + 14;

  // ===== HELPER: Section with bordered table =====
  const addSection = (title: string, rows: [string, string][]) => {
    const filteredRows = rows.filter(([, val]) => val && val.trim() !== "");
    if (filteredRows.length === 0) return;

    const estimatedHeight = filteredRows.length * 10 + 18;
    if (y + estimatedHeight > ph - 30) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_BLUE);
    doc.text(title, ml, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [],
      body: filteredRows,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: BORDER_COLOR,
        lineWidth: 0.3,
        textColor: [40, 40, 40],
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 55, textColor: [60, 60, 60] },
        1: { cellWidth: "auto" },
      },
      tableWidth: 130,
      margin: { left: ml, right: mr },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  };

  // ===== UNIDADE =====
  addSection("", [["Unidade", req.unidade]]);

  // ===== CLASSIFICAÇÃO DA VAGA =====
  addSection("Classificação da Vaga", [
    ["Headcount", req.headcount],
    ["Orçamento", req.orcamento],
    ["Tipo de Vaga", req.tipoVaga],
  ]);

  // ===== ESPECIFICAÇÃO DA VAGA =====
  const cargoLabel = req.cargoNome || "";
  addSection("Especificação da Vaga", [
    ["Cargo", cargoLabel],
    ["Salário", req.salarioVaga ? `R$ ${req.salarioVaga}` : ""],
  ]);

  // ===== JORNADA DE TRABALHO =====
  addSection("Jornada de Trabalho", [
    ["Jornada", req.jornada],
    ["Carga Horária", req.cargaHoraria],
  ]);

  // ===== CONTRATAÇÃO =====
  addSection("Contratação", [
    ["Modalidade", req.tipoContratacao?.join(", ") || ""],
    ["Recrutamento", req.internoExterno],
  ]);

  // ===== ORIGEM DA VAGA =====
  addSection("Origem da Vaga", [
    ["Origem", req.origemVaga],
    ["Motivo (Outros)", req.motivoOutros],
  ]);

  // ===== COLABORADOR SUBSTITUÍDO =====
  addSection("Colaborador Substituído", [
    ["Nome", req.nomeSubstituido],
    ["Matrícula", req.matricula],
    ["Cargo", req.cargoSubstituido],
    ["Salário", req.salarioSubstituido ? `R$ ${req.salarioSubstituido}` : ""],
    ["Data Desligamento", req.dataDesligamento],
  ]);

  // ===== QUALIFICAÇÃO =====
  addSection("Qualificação", [
    ["Formação", req.formacao?.join(", ") || ""],
    ["Detalhe Formação", req.formacaoDetalhe],
    ["Experiência", req.experiencia],
    ["Informática", req.conhecimentoInformatica],
  ]);

  // ===== ATIVIDADES DO CARGO =====
  addSection("Atividades do Cargo", [
    ["Atividades", req.atividadesCargo],
  ]);

  // ===== ANEXOS =====
  if (y + 20 > ph - 30) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_BLUE);
  doc.text("Anexos", ml, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.text("Não possui anexos vinculados", ml, y);
  y += 12;

  // ===== HISTÓRICO DE STATUS =====
  if (req.historicoStatus && req.historicoStatus.length > 0) {
    const estHeight = req.historicoStatus.length * 10 + 24;
    if (y + estHeight > ph - 30) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_BLUE);
    doc.text("Histórico de Status", ml, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Status", "Data/Hora", "Usuário"]],
      body: req.historicoStatus.map((h) => [
        h.status,
        h.dataHora,
        h.usuario || "—",
      ]),
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 4, textColor: [40, 40, 40] },
      headStyles: {
        fillColor: DARK_BLUE,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      margin: { left: ml, right: mr },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ===== FOOTER =====
  const empresaNome = empresa?.nomeFantasia || empresa?.razaoSocial || "SGM Lasant";
  const pageCount = doc.getNumberOfPages();
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
    doc.text(`RC Nº ${req.numero}`, pw - mr, pageH - 14, { align: "right" });
  }

  doc.save(`RC_${req.numero}_${req.unidade.replace(/\s+/g, "_")}_${req.dataCriacao.replace(/\//g, "-")}.pdf`);
}
