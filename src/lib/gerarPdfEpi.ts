import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Funcionario } from "@/contexts/FuncionariosContext";

interface EpiPdfOptions {
  cargoNome?: string;
  clienteNome?: string;
  setor?: string;
}

const formatDate = (d: string) => {
  if (!d) return "";
  const parts = d.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d;
};

function drawHeader(doc: jsPDF, pw: number) {
  // Blue header band
  doc.setFillColor(30, 58, 107);
  doc.rect(0, 0, pw, 28, "F");

  // LASANT text (left)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("LASANT", 14, 14);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("CONSTRUÇÕES", 14, 20);

  // Title (center)
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("FICHA DE CONTROLE DE EPI", pw / 2, 16, { align: "center" });

  // Green cross icon (right) - drawn as a simple cross shape
  const cx = pw - 24;
  const cy = 14;
  doc.setFillColor(0, 150, 60);
  doc.rect(cx - 4, cy - 8, 8, 16, "F");
  doc.rect(cx - 8, cy - 4, 16, 8, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(cx - 2, cy - 6, 4, 12, "F");
  doc.rect(cx - 6, cy - 2, 12, 4, "F");
}

function drawEmployeeData(doc: jsPDF, func: Funcionario, opts: EpiPdfOptions, pw: number): number {
  let y = 34;
  const leftCol = 14;
  const rightCol = pw / 2 + 10;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);

  // Row 1: Nome + CPF/MF
  doc.setFont("helvetica", "bold");
  doc.text("Nome:", leftCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(func.nome || "", leftCol + doc.getTextWidth("Nome:") + 2, y);

  doc.setFont("helvetica", "bold");
  doc.text("CPF/MF:", rightCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(func.cpf || "", rightCol + doc.getTextWidth("CPF/MF:") + 2, y);

  // Row 2: Adm + CNPJ
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Adm:", leftCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(func.dataAdmissao) || "", leftCol + doc.getTextWidth("Adm:") + 2, y);

  doc.setFont("helvetica", "bold");
  doc.text("CNPJ:", rightCol, y);
  doc.setFont("helvetica", "normal");
  doc.text("16.432.951/0001-70", rightCol + doc.getTextWidth("CNPJ:") + 2, y);

  // Row 3: Setor + Função
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Setor:", leftCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(opts.setor || "", leftCol + doc.getTextWidth("Setor:") + 2, y);

  doc.setFont("helvetica", "bold");
  doc.text("Função:", rightCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(opts.cargoNome || "", rightCol + doc.getTextWidth("Função:") + 2, y);

  // Row 4: Unidade + Matrícula
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Unidade:", leftCol, y);
  doc.setFont("helvetica", "normal");
  doc.text(opts.clienteNome || "", leftCol + doc.getTextWidth("Unidade:") + 2, y);

  doc.setFont("helvetica", "bold");
  doc.text("Matrícula:", rightCol, y);
  doc.setFont("helvetica", "normal");
  doc.text("", rightCol + doc.getTextWidth("Matrícula:") + 2, y);

  return y + 8;
}

function drawTermoResponsabilidade(doc: jsPDF, pw: number, startY: number): number {
  let y = startY;
  const margin = 14;
  const contentW = pw - margin * 2;

  // Divider
  doc.setDrawColor(30, 58, 107);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pw - margin, y);
  y += 7;

  // Title
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TERMO DE RESPONSABILIDADE", pw / 2, y, { align: "center" });
  y += 7;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");

  const t1 = "Recebi da Lasant Construções LTDA ME. os equipamentos de proteção individual (EPI) abaixo discriminados, ficando obrigado a usá-los em serviço ou em trânsito por área de risco, sob pena de ser punido por ato faltoso com base no artigo 482, letras E e H 158 Único da Consolidação das Leis do Trabalho – CLT.";
  const l1 = doc.splitTextToSize(t1, contentW);
  doc.text(l1, margin, y);
  y += l1.length * 3.5 + 3;

  const t2 = "Estou ciente que os EPI's citados estão sob a minha inteira responsabilidade, guarda e conservação, para utilização no desenvolvimento das atividades que me forem atribuídas e que conheço o disposto nas normas regulamentares, extraviados ou danificados.";
  const l2 = doc.splitTextToSize(t2, contentW);
  doc.text(l2, margin, y);
  y += l2.length * 3.5 + 5;

  return y;
}

function drawNR01(doc: jsPDF, pw: number, startY: number): number {
  let y = startY;
  const margin = 14;
  const contentW = pw - margin * 2;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("NR01 – 'DISPOSIÇÕES GERAIS'", pw / 2, y, { align: "center" });
  y += 5;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("1.4.2 Cabe ao trabalhador:", margin, y);
  y += 4;

  const items = [
    "a) cumprir as disposições legais e regulamentares sobre segurança e saúde no trabalho, inclusive as ordens de serviço expedidas pelo empregador;",
    "b) submeter-se aos exames médicos previstos nas NR;",
    "c) colaborar com a organização na aplicação das NR;",
    "d) usar o equipamento de proteção individual fornecido pelo empregador.",
  ];
  items.forEach((item) => {
    const lines = doc.splitTextToSize(item, contentW - 4);
    doc.text(lines, margin + 4, y);
    y += lines.length * 3.5;
  });
  y += 1;

  const faltoso = "1.4.2.1 Constitui ato faltoso a recusa injustificada do empregado ao cumprimento do disposto nas alíneas do subitem anterior.";
  const fl = doc.splitTextToSize(faltoso, contentW - 4);
  doc.text(fl, margin + 4, y);
  y += fl.length * 3.5 + 4;

  return y;
}

function drawNR06(doc: jsPDF, pw: number, startY: number): number {
  let y = startY;
  const margin = 14;
  const contentW = pw - margin * 2;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text('NR06 – "EQUIPAMENTOS DE PROTEÇÃO INDIVIDUAL"', pw / 2, y, { align: "center" });
  y += 5;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Item 6.6 Responsabilidades do trabalhador", margin, y);
  y += 4;
  doc.text("6.6.1 Cabe ao trabalhador, quanto ao EPI:", margin, y);
  y += 4;

  const items = [
    "a) usar o fornecido pela organização, observado o disposto no item 6.5.2;",
    "b) usá-lo apenas para a finalidade a que se destina;",
    "c) responsabilizar-se pela sua limpeza, guarda e conservação;",
    "d) comunicar à organização quando extraviado, danificado ou qualquer alteração que o torne impróprio para uso, e",
    "e) cumprir as determinações da organização sobre o uso adequado.",
  ];
  items.forEach((item) => {
    const lines = doc.splitTextToSize(item, contentW - 4);
    doc.text(lines, margin + 4, y);
    y += lines.length * 3.5;
  });
  y += 4;

  return y;
}

function drawCLT(doc: jsPDF, pw: number, startY: number): number {
  let y = startY;
  const margin = 14;
  const contentW = pw - margin * 2;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Consolidação das Leis do Trabalho", pw / 2, y, { align: "center" });
  y += 6;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  const clt = "Art. 462 – Ao empregador é vedado efetuar qualquer desconto nos salários do empregado, salvo quando este resultar de adiantamentos, de dispositivos de lei ou de contrato coletivo.";
  const cl = doc.splitTextToSize(clt, contentW);
  doc.text(cl, margin, y);
  y += cl.length * 3.5 + 2;

  const p1 = "§ 1º - Em caso de dano causado pelo empregado, o desconto será lícito, desde que esta possibilidade tenha sido acordada ou na ocorrência de dolo do empregado.";
  const pl = doc.splitTextToSize(p1, contentW);
  doc.text(pl, margin, y);
  y += pl.length * 3.5 + 4;

  return y;
}

function drawTermoImagem(doc: jsPDF, pw: number, startY: number): number {
  let y = startY;
  const margin = 14;
  const contentW = pw - margin * 2;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Termo de autorização de termo de uso de imagem.", pw / 2, y, { align: "center" });
  y += 6;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  const t1 = "Autoriza, de forma livre, expressa e informada, a captação, utilização e armazenamento de sua imagem pela empresa, por meio de fotografias ou vídeos realizados durante o exercício de suas atividades profissionais, para fins de controle do uso de EPI, cumprimento de obrigações legais, auditorias, treinamentos internos, defesa administrativa ou judicial e divulgação institucional, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).";
  const l1 = doc.splitTextToSize(t1, contentW);
  doc.text(l1, margin, y);
  y += l1.length * 3.5 + 3;

  const t2 = "Declaro ciência de que esta autorização não gera direito a qualquer indenização e poderá ser revogada mediante solicitação formal, respeitados os registros necessários ao cumprimento das obrigações legais.";
  const l2 = doc.splitTextToSize(t2, contentW);
  doc.text(l2, margin, y);
  y += l2.length * 3.5 + 8;

  return y;
}

function drawSignature(doc: jsPDF, startY: number): number {
  let y = startY;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 14, y);

  // Signature line on the right
  doc.line(120, y, 196, y);
  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Assinatura do Empregado", 158, y, { align: "center" });

  return y;
}

function drawEpiTable(doc: jsPDF, func: Funcionario, pw: number) {
  const epis = func.epis || [];

  const epiRows = epis.map((e) => [
    String(e.quantidade).padStart(2, "0"),
    e.descricao,
    e.ca,
    formatDate(e.dataEntrega),
    "",
  ]);

  autoTable(doc, {
    startY: 20,
    margin: { left: 14, right: 14 },
    head: [["Quant.", "E.P.I", "CA", "Data", "Assinatura do Empregado"]],
    body: epiRows.length > 0 ? epiRows : [["", "", "", "", ""]],
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 3, minCellHeight: 8, lineColor: [0, 0, 0], lineWidth: 0.3 },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 16, halign: "center", fontStyle: "bold" },
      1: { cellWidth: 65 },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 24, halign: "center" },
      4: { cellWidth: "auto" },
    },
  });
}

export function gerarPdfEpi(func: Funcionario, opts: EpiPdfOptions = {}) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  // Page 1 - Termo
  drawHeader(doc, pw);
  let y = drawEmployeeData(doc, func, opts, pw);
  y = drawTermoResponsabilidade(doc, pw, y);
  y = drawNR01(doc, pw, y);
  y = drawNR06(doc, pw, y);
  y = drawCLT(doc, pw, y);
  y = drawTermoImagem(doc, pw, y);
  drawSignature(doc, y);

  // Page 2 - EPI Table
  doc.addPage();
  drawEpiTable(doc, func, pw);

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`${i}`, pw / 2, ph - 8, { align: "center" });
  }

  doc.save(`EPI_${func.nome.replace(/\s+/g, "_")}.pdf`);
}
