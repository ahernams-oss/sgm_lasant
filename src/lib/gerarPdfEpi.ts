import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Funcionario } from "@/contexts/FuncionariosContext";

interface EpiPdfOptions {
  cargoNome?: string;
  clienteNome?: string;
  setor?: string;
}

export function gerarPdfEpi(func: Funcionario, opts: EpiPdfOptions = {}) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  // Header
  doc.setFillColor(30, 58, 107);
  doc.rect(0, 0, pw, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("LASANT", 14, 12);
  doc.setFontSize(14);
  doc.text("FICHA DE CONTROLE DE EPI", pw / 2, 12, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("CNPJ: 16.432.951/0001-70", pw - 14, 12, { align: "right" });

  doc.setTextColor(30, 30, 30);
  let y = 36;

  // Dados do funcionário
  const formatDate = (d: string) => {
    if (!d) return "";
    const parts = d.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d;
  };

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Nome: ", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(func.nome || "", 14 + doc.getTextWidth("Nome: "), y);

  doc.setFont("helvetica", "bold");
  doc.text("CPF/MF: ", pw / 2 + 10, y);
  doc.setFont("helvetica", "normal");
  doc.text(func.cpf || "", pw / 2 + 10 + doc.getTextWidth("CPF/MF: "), y);

  y += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Adm: ", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(func.dataAdmissao) || "", 14 + doc.getTextWidth("Adm: "), y);

  doc.setFont("helvetica", "bold");
  doc.text("Função: ", pw / 2 + 10, y);
  doc.setFont("helvetica", "normal");
  doc.text(opts.cargoNome || "", pw / 2 + 10 + doc.getTextWidth("Função: "), y);

  y += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Unidade: ", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(opts.clienteNome || "", 14 + doc.getTextWidth("Unidade: "), y);

  doc.setFont("helvetica", "bold");
  doc.text("Matrícula: ", pw / 2 + 10, y);
  doc.setFont("helvetica", "normal");
  doc.text("", pw / 2 + 10 + doc.getTextWidth("Matrícula: "), y);

  y += 10;

  // Linha divisória
  doc.setDrawColor(30, 58, 107);
  doc.setLineWidth(0.5);
  doc.line(14, y, pw - 14, y);
  y += 8;

  // Termo de Responsabilidade
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TERMO DE RESPONSABILIDADE", pw / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  const termoTexto = "Recebi da Lasant LTDA ME. os equipamentos de proteção individual (EPI) discriminados, ficando obrigado a usá-los em serviço ou em trânsito por área de risco, sob pena de ser punido por ato faltoso com base no artigo 158 Único da Consolidação das Leis do Trabalho – CLT.";
  const termoLines = doc.splitTextToSize(termoTexto, pw - 28);
  doc.text(termoLines, 14, y);
  y += termoLines.length * 3.5 + 3;

  const termoTexto2 = "Estou ciente que os EPI's citados estão sob a minha inteira responsabilidade, guarda e conservação, para utilização no desenvolvimento das atividades que me forem atribuídas e que conheço o disposto nas normas regulamentares, extraviados ou danificados.";
  const termoLines2 = doc.splitTextToSize(termoTexto2, pw - 28);
  doc.text(termoLines2, 14, y);
  y += termoLines2.length * 3.5 + 6;

  // NR01
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("NR01 – DISPOSIÇÕES GERAIS", 14, y);
  y += 5;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  const nr01Items = [
    "a) cumprir as disposições legais e regulamentares sobre segurança e saúde no trabalho;",
    "b) submeter-se aos exames médicos previstos nas NR;",
    "c) colaborar com a organização na aplicação das NR;",
    "d) usar o equipamento de proteção individual fornecido pelo empregador.",
  ];
  nr01Items.forEach((item) => {
    doc.text(item, 18, y);
    y += 3.5;
  });
  y += 2;

  doc.setFontSize(7);
  const faltoso = "1.4.2.1 Constitui ato faltoso a recusa injustificada do empregado ao cumprimento do disposto nas alíneas do subitem anterior.";
  const faltosoLines = doc.splitTextToSize(faltoso, pw - 32);
  doc.text(faltosoLines, 18, y);
  y += faltosoLines.length * 3.5 + 4;

  // NR06
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text('NR06 – "EQUIPAMENTOS DE PROTEÇÃO INDIVIDUAL"', 14, y);
  y += 5;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  const nr06Items = [
    "a) usar o fornecido pela organização;",
    "b) usá-lo apenas para a finalidade a que se destina;",
    "c) responsabilizar-se pela sua limpeza, guarda e conservação;",
    "d) comunicar à organização quando extraviado, danificado ou qualquer alteração que o torne impróprio para uso;",
    "e) cumprir as determinações da organização sobre o uso adequado.",
  ];
  nr06Items.forEach((item) => {
    doc.text(item, 18, y);
    y += 3.5;
  });
  y += 4;

  // CLT Art. 462
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Consolidação das Leis do Trabalho", 14, y);
  y += 5;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  const clt = "Art. 462 – Ao empregador é vedado efetuar qualquer desconto nos salários do empregado, salvo quando este resultar de adiantamentos de dispositivos de lei ou de contrato coletivo.";
  const cltLines = doc.splitTextToSize(clt, pw - 28);
  doc.text(cltLines, 14, y);
  y += cltLines.length * 3.5 + 2;

  const cltP = "§ 1º - Em caso de dano causado pelo empregado, o desconto será lícito, desde que esta possibilidade tenha sido acordada ou na ocorrência de dolo do empregado.";
  const cltPLines = doc.splitTextToSize(cltP, pw - 28);
  doc.text(cltPLines, 14, y);
  y += cltPLines.length * 3.5 + 4;

  // Termo de uso de imagem
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Termo de autorização de uso de imagem", 14, y);
  y += 5;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  const imagem = "Autoriza, de forma livre, expressa e informada, a captação, utilização e armazenamento de sua imagem pela empresa, por meio de fotografias ou vídeos realizados durante o exercício de suas atividades profissionais, para fins de controle do uso de EPI, cumprimento de obrigações legais, auditorias, treinamentos internos, defesa administrativa ou judicial e divulgação institucional, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).";
  const imagemLines = doc.splitTextToSize(imagem, pw - 28);
  doc.text(imagemLines, 14, y);
  y += imagemLines.length * 3.5 + 2;

  const declaro = "Declaro ciência de que esta autorização não gera direito a qualquer indenização e poderá ser revogada mediante solicitação formal, respeitados os registros necessários ao cumprimento das obrigações legais.";
  const declaroLines = doc.splitTextToSize(declaro, pw - 28);
  doc.text(declaroLines, 14, y);
  y += declaroLines.length * 3.5 + 8;

  // Data e assinatura
  doc.setFontSize(9);
  doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 14, y);
  y += 16;
  doc.line(14, y, 90, y);
  y += 4;
  doc.setFontSize(8);
  doc.text("Assinatura do Empregado", 14, y);

  // Page 2 - Tabela de EPIs
  doc.addPage();
  y = 20;

  doc.setFillColor(30, 58, 107);
  doc.rect(0, 0, pw, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("CONTROLE DE EPIs - " + (func.nome || "").toUpperCase(), pw / 2, 10, { align: "center" });
  doc.setTextColor(30, 30, 30);

  const epis = func.epis || [];

  // Build table with empty rows to fill the page
  const epiRows = epis.map((e) => [
    String(e.quantidade).padStart(2, "0"),
    e.descricao,
    e.ca,
    formatDate(e.dataEntrega),
    "", // Assinatura
  ]);

  // Add empty rows to make at least 20
  while (epiRows.length < 20) {
    epiRows.push(["", "", "", "", ""]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [["Quant.", "E.P.I", "CA", "Data", "Assinatura do Empregado"]],
    body: epiRows,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 3, minCellHeight: 8 },
    headStyles: {
      fillColor: [30, 58, 107],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 16, halign: "center" },
      1: { cellWidth: 65 },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 24, halign: "center" },
      4: { cellWidth: "auto" },
    },
  });

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
