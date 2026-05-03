import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Cronograma } from "@/contexts/CronogramasContext";
import type { Empresa } from "@/contexts/EmpresaContext";

const BORDER: [number, number, number] = [60, 60, 60];

async function loadImage(url: string): Promise<string | null> {
  try {
    const r = await fetch(url);
    const b = await r.blob();
    return await new Promise<string>((resolve) => {
      const fr = new FileReader();
      fr.onloadend = () => resolve(fr.result as string);
      fr.readAsDataURL(b);
    });
  } catch { return null; }
}

const fmtDate = (s?: string) => {
  if (!s) return "-";
  const d = new Date(s + (s.length === 10 ? "T00:00:00" : ""));
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("pt-BR");
};
const fmtMoney = (n: number) =>
  (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (n: number) => `${(Number(n) || 0).toFixed(2)}%`;

export async function gerarPdfCronograma(cronograma: Cronograma, empresa?: Empresa) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pw = doc.internal.pageSize.getWidth();
  const ml = 10, mr = 10;
  let y = 10;

  if (empresa?.logoUrl) {
    const data = await loadImage(empresa.logoUrl);
    if (data) { try { doc.addImage(data, "PNG", pw - mr - 32, y, 32, 16); } catch {} }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("CRONOGRAMA FÍSICO-FINANCEIRO", pw / 2, y + 6, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Nº ${cronograma.numero}/${new Date(cronograma.created_at).getFullYear()}`, pw / 2, y + 11, { align: "center" });
  y += 18;

  // INFO
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 1.5, lineColor: BORDER, lineWidth: 0.3 },
    body: [
      [
        { content: "Cliente:", styles: { fontStyle: "bold" } }, cronograma.cliente_nome || "-",
        { content: "Obra:", styles: { fontStyle: "bold" } }, cronograma.obra || "-",
      ],
      [
        { content: "Responsável:", styles: { fontStyle: "bold" } }, cronograma.responsavel || "-",
        { content: "Status:", styles: { fontStyle: "bold" } }, cronograma.status || "-",
      ],
      [
        { content: "Início:", styles: { fontStyle: "bold" } }, fmtDate(cronograma.data_inicio),
        { content: "Fim:", styles: { fontStyle: "bold" } }, fmtDate(cronograma.data_fim),
      ],
      [
        { content: "Granularidade:", styles: { fontStyle: "bold" } },
        cronograma.granularidade === "mensal" ? "Mensal" : "Semanal",
        { content: "Valor Total:", styles: { fontStyle: "bold" } },
        fmtMoney(cronograma.valor_total || 0),
      ],
    ],
    margin: { left: ml, right: mr },
  });
  y = (doc as any).lastAutoTable.finalY + 4;

  // CRONOGRAMA FÍSICO
  const periodos = cronograma.periodos || [];
  const atividades = cronograma.atividades || [];

  const head = [["#", "Atividade", "Tipo", ...periodos.map(p => p.rotulo), "Total"]];

  const bodyFisico: any[] = [];
  atividades.forEach((a, i) => {
    const prevRow = [String(i + 1), a.descricao, "Prev. %"];
    const realRow = ["", "", "Real. %"];
    let totalPrev = 0, totalReal = 0;
    periodos.forEach(p => {
      const v = a.valores?.[p.rotulo] || { previsto_fisico: 0, realizado_fisico: 0, previsto_financeiro: 0, realizado_financeiro: 0 };
      prevRow.push(fmtPct(v.previsto_fisico));
      realRow.push(fmtPct(v.realizado_fisico));
      totalPrev += Number(v.previsto_fisico) || 0;
      totalReal += Number(v.realizado_fisico) || 0;
    });
    prevRow.push(fmtPct(totalPrev));
    realRow.push(fmtPct(totalReal));
    bodyFisico.push(prevRow, realRow);
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("CRONOGRAMA FÍSICO (% de avanço)", ml, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    head,
    body: bodyFisico,
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 1, lineColor: BORDER, lineWidth: 0.2 },
    headStyles: { fillColor: [103, 58, 183], textColor: 255, fontStyle: "bold", fontSize: 7 },
    columnStyles: { 0: { cellWidth: 8, halign: "center" }, 2: { cellWidth: 16, halign: "center", fontStyle: "bold" } },
    margin: { left: ml, right: mr },
  });
  y = (doc as any).lastAutoTable.finalY + 4;

  if (y > 170) { doc.addPage(); y = 10; }

  // CRONOGRAMA FINANCEIRO
  const bodyFinanceiro: any[] = [];
  const totaisPrevPorPeriodo: Record<string, number> = {};
  const totaisRealPorPeriodo: Record<string, number> = {};
  periodos.forEach(p => { totaisPrevPorPeriodo[p.rotulo] = 0; totaisRealPorPeriodo[p.rotulo] = 0; });
  let totalGeralPrev = 0, totalGeralReal = 0;

  atividades.forEach((a, i) => {
    const prevRow = [String(i + 1), a.descricao, "Prev. R$"];
    const realRow = ["", "", "Real. R$"];
    let tPrev = 0, tReal = 0;
    periodos.forEach(p => {
      const v = a.valores?.[p.rotulo] || { previsto_fisico: 0, realizado_fisico: 0, previsto_financeiro: 0, realizado_financeiro: 0 };
      prevRow.push(fmtMoney(v.previsto_financeiro));
      realRow.push(fmtMoney(v.realizado_financeiro));
      tPrev += Number(v.previsto_financeiro) || 0;
      tReal += Number(v.realizado_financeiro) || 0;
      totaisPrevPorPeriodo[p.rotulo] += Number(v.previsto_financeiro) || 0;
      totaisRealPorPeriodo[p.rotulo] += Number(v.realizado_financeiro) || 0;
    });
    prevRow.push(fmtMoney(tPrev));
    realRow.push(fmtMoney(tReal));
    totalGeralPrev += tPrev;
    totalGeralReal += tReal;
    bodyFinanceiro.push(prevRow, realRow);
  });

  // Totais
  const totalRowPrev: any[] = ["", { content: "TOTAL", styles: { fontStyle: "bold" } }, "Prev. R$"];
  const totalRowReal: any[] = ["", "", "Real. R$"];
  periodos.forEach(p => {
    totalRowPrev.push(fmtMoney(totaisPrevPorPeriodo[p.rotulo]));
    totalRowReal.push(fmtMoney(totaisRealPorPeriodo[p.rotulo]));
  });
  totalRowPrev.push(fmtMoney(totalGeralPrev));
  totalRowReal.push(fmtMoney(totalGeralReal));
  bodyFinanceiro.push(totalRowPrev, totalRowReal);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("CRONOGRAMA FINANCEIRO (R$)", ml, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    head,
    body: bodyFinanceiro,
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 1, lineColor: BORDER, lineWidth: 0.2 },
    headStyles: { fillColor: [76, 175, 80], textColor: 255, fontStyle: "bold", fontSize: 7 },
    columnStyles: { 0: { cellWidth: 8, halign: "center" }, 2: { cellWidth: 16, halign: "center", fontStyle: "bold" } },
    margin: { left: ml, right: mr },
  });

  // Footer
  const pages = doc.getNumberOfPages();
  const nome = empresa?.nomeFantasia || empresa?.razaoSocial || "Lasant";
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200, 200, 200);
    doc.line(ml, ph - 8, pw - mr, ph - 8);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text(`Documento gerado automaticamente — ${nome}`, ml, ph - 4);
    doc.text(`Página ${i} de ${pages}`, pw / 2, ph - 4, { align: "center" });
    doc.text(`Cronograma Nº ${cronograma.numero}`, pw - mr, ph - 4, { align: "right" });
  }

  doc.save(`Cronograma_${cronograma.numero}_${(cronograma.cliente_nome || "").replace(/\s+/g, "_")}.pdf`);
}
