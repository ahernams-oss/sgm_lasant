import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { LaudoCondenacao, FotoLaudo } from "@/contexts/LaudosCondenacaoContext";

const fmtDate = (d: string) => {
  if (!d) return "";
  const parts = d.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d;
};
const fmtBRL = (n: number) => (n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function loadImageWithMarcadores(foto: FotoLaudo): Promise<{ dataUrl: string; w: number; h: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); return; }
      ctx.drawImage(img, 0, 0);
      // Draw marcadores
      const r = Math.max(18, Math.min(img.width, img.height) * 0.03);
      ctx.font = `bold ${Math.round(r * 1.1)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const m of foto.marcadores || []) {
        const cx = m.x * img.width;
        const cy = m.y * img.height;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = "#dc2626";
        ctx.fill();
        ctx.lineWidth = Math.max(2, r * 0.15);
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.fillText(String(m.n), cx, cy);
      }
      resolve({ dataUrl: canvas.toDataURL("image/jpeg", 0.85), w: img.width, h: img.height });
    };
    img.onerror = () => resolve(null);
    img.src = foto.url;
  });
}

export async function gerarPdfLaudoCondenacao(laudo: LaudoCondenacao, empresa?: { razaoSocial?: string; cnpj?: string }) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  let y = 15;

  // Header
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("LAUDO TÉCNICO DE CONDENAÇÃO DE EQUIPAMENTO", pw / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text("Documento de Avaliação Técnica para Baixa e Descontinuidade de Ativos", pw / 2, y, { align: "center" });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const yearNum = laudo.data_emissao ? new Date(laudo.data_emissao).getFullYear() : new Date().getFullYear();
  const numeroFmt = `${String(laudo.numero).padStart(3, "0")}/${yearNum}`;
  doc.text(`Documento nº: ${numeroFmt}`, 14, y);
  doc.text(`Data de emissão: ${fmtDate(laudo.data_emissao)}`, pw - 14, y, { align: "right" });
  y += 5;
  if (empresa?.razaoSocial) {
    doc.text(`Empresa: ${empresa.razaoSocial}${empresa.cnpj ? ` — CNPJ: ${empresa.cnpj}` : ""}`, 14, y);
    y += 5;
  }
  doc.text(`Responsável técnico: ${laudo.responsavel_tecnico || "-"}`, 14, y);
  doc.text(`Registro (CFT/CREA): ${laudo.registro_profissional || "-"}`, pw - 14, y, { align: "right" });
  y += 8;

  const sectionTitle = (t: string) => {
    if (y > ph - 30) { doc.addPage(); y = 15; }
    doc.setFillColor(30, 58, 107);
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.rect(14, y - 4, pw - 28, 6, "F");
    doc.text(t, 16, y);
    doc.setTextColor(0);
    y += 5;
  };

  // 1. Identificação
  sectionTitle("1. IDENTIFICAÇÃO DO EQUIPAMENTO");
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 1.5 },
    body: [
      ["Tipo do equipamento", laudo.tipo || laudo.equipamento_nome || "-", "Marca", laudo.marca || "-"],
      ["Modelo", laudo.modelo || "-", "Nº de série", laudo.serie || "-"],
      ["Patrimônio/TAG", laudo.patrimonio || laudo.equipamento_tag || "-", "Ano fabricação", laudo.ano_fabricacao || "-"],
      ["Data aquisição", fmtDate(laudo.data_aquisicao) || "-", "Localização", laudo.localizacao || "-"],
      ["Estado conservação", laudo.estado_conservacao || "-", "", ""],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 }, 2: { fontStyle: "bold", cellWidth: 35 } },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  const textBlock = (title: string, text: string) => {
    sectionTitle(title);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(text || "-", pw - 28);
    if (y + lines.length * 4 > ph - 15) { doc.addPage(); y = 15; }
    doc.text(lines, 14, y);
    y += lines.length * 4 + 4;
  };

  // 2. Histórico
  textBlock("2. HISTÓRICO", laudo.historico);

  // 3. Inspeção Técnica
  sectionTitle("3. INSPEÇÃO TÉCNICA");
  const sub = (t: string, txt: string) => {
    if (y > ph - 25) { doc.addPage(); y = 15; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(t, 14, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(txt || "-", pw - 28);
    doc.text(lines, 14, y);
    y += lines.length * 4 + 3;
  };
  sub("3.1 Condições Físicas", laudo.insp_condicoes_fisicas);
  sub("3.2 Condições Elétricas/Eletrônicas", laudo.insp_condicoes_eletricas);
  sub("3.3 Condições Mecânicas", laudo.insp_condicoes_mecanicas);
  sub("3.4 Funcionalidade", laudo.insp_funcionalidade);

  // 4. Fundamentação
  sectionTitle("4. FUNDAMENTAÇÃO TÉCNICA DA CONDENAÇÃO");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Motivos que fundamentam a condenação:", 14, y);
  y += 5;
  (laudo.motivos_condenacao || []).forEach((m, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${m}`, pw - 32);
    if (y + lines.length * 4 > ph - 15) { doc.addPage(); y = 15; }
    doc.text(lines, 18, y);
    y += lines.length * 4 + 1;
  });
  y += 3;

  const pct = laudo.valor_novo_equivalente > 0
    ? (laudo.custo_reparo / laudo.valor_novo_equivalente) * 100
    : 0;
  const viavel = pct > 0 && pct < 50 ? "economicamente viável" : "economicamente inviável";
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 1.5 },
    body: [
      ["Custo estimado de reparo", fmtBRL(laudo.custo_reparo)],
      ["Valor residual do equipamento", fmtBRL(laudo.valor_residual)],
      ["Valor equipamento novo equivalente", fmtBRL(laudo.valor_novo_equivalente)],
      ["Custo de reparo sobre valor novo", `${pct.toFixed(1)}%`],
      ["Análise", `A reparação é ${viavel}.`],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 70 } },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // 5. Conclusão
  sectionTitle("5. CONCLUSÃO TÉCNICA");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const conclusaoTxt = `Com base na inspeção técnica realizada e nos fundamentos apresentados neste laudo, atesta-se que o equipamento descrito encontra-se em condições ${laudo.conclusao_condicoes || "___"} que inviabilizam sua utilização segura e/ou econômica, recomendando-se a CONDENAÇÃO do bem para fins de baixa patrimonial.`;
  const cLines = doc.splitTextToSize(conclusaoTxt, pw - 28);
  doc.text(cLines, 14, y);
  y += cLines.length * 4 + 4;
  doc.setFont("helvetica", "bold");
  doc.text(`Parecer técnico: ${laudo.parecer || "-"}`, 14, y); y += 5;
  doc.setFont("helvetica", "normal");
  doc.text(`Data da inspeção: ${fmtDate(laudo.data_inspecao) || "-"}`, 14, y);
  doc.text(`Local: ${laudo.local_inspecao || "-"}`, pw / 2, y);
  y += 15;

  // Assinatura
  if (y > ph - 30) { doc.addPage(); y = 15; }
  doc.setDrawColor(0);
  doc.line(pw / 2 - 40, y, pw / 2 + 40, y);
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Responsável Técnico", pw / 2, y, { align: "center" });
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(laudo.responsavel_tecnico || "-", pw / 2, y, { align: "center" });
  if (laudo.registro_profissional) {
    y += 4;
    doc.text(`Registro: ${laudo.registro_profissional}`, pw / 2, y, { align: "center" });
  }

  // Anexos - Fotos (4 por página)
  if (laudo.fotos && laudo.fotos.length > 0) {
    doc.addPage();
    y = 15;
    sectionTitle("ANEXO I — FOTOGRAFIAS");
    let count = 0;
    const cellW = (pw - 28 - 6) / 2;
    const cellH = 70;
    let cx = 14;
    let cy = y;
    for (const foto of laudo.fotos) {
      const img = await loadImageWithMarcadores(foto);
      if (!img) continue;
      const col = count % 2;
      const row = Math.floor((count % 4) / 2);
      cx = 14 + col * (cellW + 6);
      cy = y + row * (cellH + 6);
      // fit
      const ratio = img.w / img.h;
      let iw = cellW, ih = cellW / ratio;
      if (ih > cellH - 12) { ih = cellH - 12; iw = ih * ratio; }
      const ix = cx + (cellW - iw) / 2;
      doc.addImage(img.dataUrl, "JPEG", ix, cy, iw, ih);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      const descLines = doc.splitTextToSize(foto.descricao || `Foto ${count + 1}`, cellW);
      doc.text(descLines.slice(0, 2), cx, cy + ih + 3);
      // Legendas
      if (foto.marcadores && foto.marcadores.length > 0) {
        const leg = foto.marcadores.map(m => `${m.n}. ${m.legenda || "-"}`).join(" | ");
        const legLines = doc.splitTextToSize(leg, cellW);
        doc.setFont("helvetica", "italic");
        doc.text(legLines.slice(0, 2), cx, cy + ih + 8);
      }
      count++;
      if (count % 4 === 0 && count < laudo.fotos.length) {
        doc.addPage();
        y = 15;
        sectionTitle("ANEXO I — FOTOGRAFIAS (cont.)");
      }
    }
  }

  // Anexos - Orçamentos e outros
  if ((laudo.anexos_orcamentos?.length || 0) + (laudo.outros_anexos?.length || 0) > 0) {
    doc.addPage();
    y = 15;
    sectionTitle("ANEXO II — DOCUMENTOS ANEXOS");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    if (laudo.anexos_orcamentos?.length) {
      doc.setFont("helvetica", "bold");
      doc.text("Orçamentos de reparo:", 14, y); y += 5;
      doc.setFont("helvetica", "normal");
      laudo.anexos_orcamentos.forEach(a => { doc.text(`• ${a.nome}`, 18, y); y += 4; });
      y += 3;
    }
    if (laudo.outros_anexos?.length) {
      doc.setFont("helvetica", "bold");
      doc.text("Outros anexos:", 14, y); y += 5;
      doc.setFont("helvetica", "normal");
      laudo.outros_anexos.forEach(a => { doc.text(`• ${a.nome}`, 18, y); y += 4; });
    }
    if (laudo.observacoes_outros) {
      y += 3;
      doc.setFont("helvetica", "bold");
      doc.text("Observações:", 14, y); y += 5;
      doc.setFont("helvetica", "normal");
      const oLines = doc.splitTextToSize(laudo.observacoes_outros, pw - 28);
      doc.text(oLines, 14, y);
    }
  }

  // Footer pagination
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(`Laudo nº ${numeroFmt} · Página ${i} de ${total}`, pw - 14, ph - 6, { align: "right" });
  }

  doc.save(`Laudo_Condenacao_${numeroFmt.replace("/", "-")}_${(laudo.equipamento_tag || "equipamento").replace(/\s+/g, "_")}.pdf`);
}
