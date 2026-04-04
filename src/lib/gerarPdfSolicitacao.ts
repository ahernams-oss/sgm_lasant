import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SolicitacaoServico } from "@/contexts/SolicitacoesServicosContext";

export async function gerarPdfSolicitacao(ss: SolicitacaoServico, comImagens: boolean) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 58, 107);
  doc.rect(0, 0, pw, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Solicitação de Serviço", 14, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`SS Nº ${ss.numero}`, 14, 22);
  doc.setFontSize(9);
  const dataFormatada = ss.dataHoraSolicitacao
    ? new Date(ss.dataHoraSolicitacao).toLocaleString("pt-BR")
    : "-";
  doc.text(`Data: ${dataFormatada}`, pw - 14, 14, { align: "right" });
  doc.text(`Situação: ${ss.situacao}`, pw - 14, 20, { align: "right" });
  if (ss.prioridade) {
    doc.text(`Prioridade: ${ss.prioridade}`, pw - 14, 26, { align: "right" });
  }

  doc.setTextColor(30, 30, 30);
  let y = 44;

  const addSection = (title: string, rows: [string, string][]) => {
    const filteredRows = rows.filter(([, val]) => val && val.trim() !== "");
    if (filteredRows.length === 0) return;

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

  addSection("Informações Gerais", [
    ["Nº SS", String(ss.numero)],
    ["Data/Hora", dataFormatada],
    ["Solicitante", ss.solicitanteNome || "-"],
    ["Tipo", ss.tipo || "-"],
    ["Situação", ss.situacao],
    ["Prioridade", ss.prioridade || "-"],
    ["Visitado", ss.visitado ? "Sim" : "Não"],
  ]);

  addSection("Localização", [
    ["Cliente", ss.clienteNome || "-"],
    ["Local", ss.localDescricao || "-"],
    ["Pavimento", ss.pavimentoDescricao || "-"],
    ["Setor", ss.setorDescricao || "-"],
    ...(ss.tipo === "Equipamentos" ? [["Equipamento", ss.equipamentoNome || "-"] as [string, string]] : []),
  ]);

  addSection("Descrição dos Serviços", [
    ["Descrição", ss.descricaoServicos || "-"],
  ]);

  if (ss.observacoes) {
    addSection("Observações", [
      ["Observações", ss.observacoes],
    ]);
  }

  // Histórico
  if (ss.historico && ss.historico.length > 0) {
    const pageHeight = doc.internal.pageSize.getHeight();
    const estimatedHeight = ss.historico.length * 10 + 20;
    if (y + estimatedHeight > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 107);
    doc.text("Histórico", 14, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [["Situação", "Data/Hora", "Usuário"]],
      body: ss.historico.map((h) => [
        h.situacao,
        h.data ? new Date(h.data).toLocaleString("pt-BR") : "-",
        h.usuario || "-",
      ]),
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 58, 107], textColor: [255, 255, 255], fontStyle: "bold" },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Imagens
  if (comImagens && ss.imagens && ss.imagens.length > 0) {
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.addPage();
    y = 20;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 107);
    doc.text("Imagens", 14, y);
    y += 8;

    for (let i = 0; i < ss.imagens.length; i++) {
      try {
        const response = await fetch(ss.imagens[i]);
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        const imgWidth = pw - 28;
        const imgHeight = 100;

        if (y + imgHeight + 10 > pageHeight - 30) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`Imagem ${i + 1}`, 14, y);
        y += 4;

        doc.addImage(dataUrl, "JPEG", 14, y, imgWidth, imgHeight);
        y += imgHeight + 10;
      } catch (err) {
        console.error("Erro ao carregar imagem para PDF:", err);
        doc.setFontSize(8);
        doc.setTextColor(200, 0, 0);
        doc.text(`Erro ao carregar imagem ${i + 1}`, 14, y);
        y += 10;
      }
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200, 200, 200);
    doc.line(14, pageHeight - 20, pw - 14, pageHeight - 20);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text("Documento gerado automaticamente — SGM Lasant", 14, pageHeight - 14);
    doc.text(`Página ${i} de ${pageCount}`, pw / 2, pageHeight - 14, { align: "center" });
    doc.text(`SS Nº ${ss.numero}`, pw - 14, pageHeight - 14, { align: "right" });
  }

  doc.save(`SS_${ss.numero}_${ss.clienteNome?.replace(/\s+/g, "_") || "sem_cliente"}.pdf`);
}
