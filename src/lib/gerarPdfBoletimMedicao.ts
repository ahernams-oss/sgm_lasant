import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { BoletimMedicao, BoletimMedicaoFrente } from "@/contexts/BoletinsMedicaoContext";
import type { Empresa } from "@/contexts/EmpresaContext";

const DARK: [number, number, number] = [30, 30, 30];

const fmtMoney = (n: number) =>
  (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (n: number) =>
  `${(Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const fmtDate = (s?: string) => {
  if (!s) return "";
  const [y, m, d] = String(s).split("-");
  return d && m && y ? `${d}/${m}/${y}` : String(s);
};
const ordinal = (n: number) => `${n}ª MEDIÇÃO`;

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const r = await fetch(url);
    const b = await r.blob();
    return await new Promise<string>((resolve) => {
      const fr = new FileReader();
      fr.onloadend = () => resolve(fr.result as string);
      fr.readAsDataURL(b);
    });
  } catch {
    return null;
  }
}

interface Bloco {
  titulo: string;
  linhas: Array<{ label: string; periodo: string; valor: number | null }>;
  valorContrato: number;
  destaque?: boolean;
}

function montarBlocos(boletim: BoletimMedicao): Bloco[] {
  const frentes: BoletimMedicaoFrente[] = boletim.frentes || [];
  const minLinhas = 6;

  const blocos: Bloco[] = frentes.map((f) => {
    const meds = [...(f.medicoes || [])].sort((a, b) => (a.numero || 0) - (b.numero || 0));
    const linhas = meds.map((m) => ({
      label: ordinal(m.numero),
      periodo: m.periodo_inicio || m.periodo_fim ? `${fmtDate(m.periodo_inicio)} A ${fmtDate(m.periodo_fim)}` : "",
      valor: Number(m.valor) || 0,
    }));
    for (let i = linhas.length; i < minLinhas; i++) {
      linhas.push({ label: ordinal(i + 1), periodo: "", valor: null });
    }
    return { titulo: `Obra: ${f.nome || "-"}`, linhas, valorContrato: Number(f.valor_contrato) || 0 };
  });

  // Sintético
  const maxMed = Math.max(
    minLinhas,
    ...frentes.map((f) => (f.medicoes || []).reduce((mx, m) => Math.max(mx, Number(m.numero) || 0), 0)),
  );
  const sintLinhas: Bloco["linhas"] = [];
  for (let n = 1; n <= maxMed; n++) {
    let soma = 0;
    let algum = false;
    let periodo = "";
    frentes.forEach((f) => {
      const m = (f.medicoes || []).find((x) => Number(x.numero) === n);
      if (m) {
        algum = true;
        soma += Number(m.valor) || 0;
        if (!periodo && (m.periodo_inicio || m.periodo_fim)) {
          periodo = `${fmtDate(m.periodo_inicio)} A ${fmtDate(m.periodo_fim)}`;
        }
      }
    });
    sintLinhas.push({ label: ordinal(n), periodo, valor: algum ? soma : null });
  }
  const totalContrato =
    Number(boletim.valor_total_contrato) || frentes.reduce((s, f) => s + (Number(f.valor_contrato) || 0), 0);

  blocos.push({ titulo: "SINTÉTICO", linhas: sintLinhas, valorContrato: totalContrato, destaque: true });
  return blocos;
}

function desenharBloco(doc: jsPDF, bloco: Bloco, startY: number, ml: number, cw: number): number {
  const faturado = bloco.linhas.reduce((s, l) => s + (l.valor || 0), 0);
  const contrato = bloco.valorContrato || 0;
  const pct = (v: number) => (contrato > 0 ? (v / contrato) * 100 : 0);
  const saldo = contrato - faturado;

  const body: any[] = bloco.linhas.map((l) => [
    l.label,
    l.periodo,
    l.valor === null ? "" : `R$ ${fmtMoney(l.valor)}`,
    l.valor === null ? "" : fmtPct(pct(l.valor)),
  ]);

  body.push([
    { content: "VALOR TOTAL FATURADO", colSpan: 2, styles: { fontStyle: "bold", halign: "center" } },
    { content: `R$ ${fmtMoney(faturado)}`, styles: { fontStyle: "bold" } },
    { content: fmtPct(pct(faturado)), styles: { fontStyle: "bold" } },
  ]);
  body.push([
    { content: "VALOR CONTRATO", colSpan: 2, styles: { fontStyle: "bold", halign: "center" } },
    { content: `R$ ${fmtMoney(contrato)}`, styles: { fontStyle: "bold" } },
    { content: fmtPct(contrato > 0 ? 100 : 0), styles: { fontStyle: "bold" } },
  ]);
  body.push([
    { content: "SALDO A FATURAR", colSpan: 2, styles: { fontStyle: "bold", halign: "center" } },
    { content: `R$ ${fmtMoney(saldo)}`, styles: { fontStyle: "bold" } },
    { content: fmtPct(pct(saldo)), styles: { fontStyle: "bold" } },
  ]);

  autoTable(doc, {
    startY,
    margin: { left: ml, right: ml },
    tableWidth: cw,
    head: [
      [{ content: bloco.titulo, colSpan: 4, styles: { halign: "center", fontStyle: "bold" } }],
      ["MEDIÇÃO", "PERÍODO", "VALOR", "PORC (%)"],
    ],
    body,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 1.6, lineColor: [40, 40, 40], lineWidth: 0.2, textColor: DARK },
    headStyles: { fillColor: bloco.destaque ? [225, 225, 225] : [240, 240, 240], textColor: DARK, halign: "center" },
    columnStyles: {
      0: { cellWidth: cw * 0.22, halign: "center" },
      1: { cellWidth: cw * 0.36, halign: "center" },
      2: { cellWidth: cw * 0.24, halign: "right" },
      3: { cellWidth: cw * 0.18, halign: "center" },
    },
  });

  return (doc as any).lastAutoTable.finalY + 6;
}

export async function gerarPdfBoletimMedicao(boletim: BoletimMedicao, empresa?: Empresa) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ml = 14;
  const cw = pw - ml * 2;
  let y = 12;

  // ===== CABEÇALHO =====
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.6);
  doc.rect(ml, y, cw, 20);

  if (empresa?.logoUrl) {
    const data = await loadImageAsDataUrl(empresa.logoUrl);
    if (data) {
      try { doc.addImage(data, "PNG", ml + 3, y + 3, 34, 14); } catch { /* ignora */ }
    }
  }
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text((empresa?.nomeFantasia || empresa?.razaoSocial || "LASANT CONSTRUÇÕES").toUpperCase(), pw / 2 + 8, y + 8, { align: "center" });
  doc.setFontSize(9);
  doc.text((boletim.cliente_nome || "").toUpperCase(), pw / 2 + 8, y + 14, { align: "center", maxWidth: cw - 50 });
  y += 26;

  // ===== IDENTIFICAÇÃO =====
  doc.setFontSize(8.5);
  if (boletim.objeto) {
    doc.setFont("helvetica", "bold");
    const txt = doc.splitTextToSize(`Objeto: ${boletim.objeto}`, cw);
    doc.text(txt, ml, y);
    y += txt.length * 4 + 2;
  }
  doc.setFont("helvetica", "bold");
  doc.text(
    `Contrato: N.º ${boletim.contrato_numero || "-"}   |   PROCESSO N.º ${boletim.processo_numero || "-"}`,
    ml,
    y,
  );
  y += 5;
  const totalContrato =
    Number(boletim.valor_total_contrato) ||
    (boletim.frentes || []).reduce((s, f) => s + (Number(f.valor_contrato) || 0), 0);
  doc.text(`Valor total do contrato:   R$ ${fmtMoney(totalContrato)}`, ml, y);
  y += 5;
  if (boletim.responsavel_tecnico) {
    doc.setFont("helvetica", "normal");
    doc.text(`Responsável Técnico: ${boletim.responsavel_tecnico}`, ml, y);
    y += 5;
  }
  doc.setFont("helvetica", "normal");
  doc.text(
    `Boletim de Medição N.º ${String(boletim.numero || "").padStart(2, "0")}/${boletim.ano || ""}   |   Emissão: ${fmtDate(boletim.data_emissao)}`,
    ml,
    y,
  );
  y += 7;

  // ===== BLOCOS =====
  const blocos = montarBlocos(boletim);
  blocos.forEach((b) => {
    const alturaEstimada = (b.linhas.length + 5) * 6 + 12;
    if (y + alturaEstimada > ph - 20) {
      doc.addPage();
      y = 14;
    }
    y = desenharBloco(doc, b, y, ml, cw);
  });

  if (boletim.observacoes) {
    if (y + 20 > ph - 20) { doc.addPage(); y = 14; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Observações:", ml, y);
    doc.setFont("helvetica", "normal");
    const obs = doc.splitTextToSize(boletim.observacoes, cw);
    doc.text(obs, ml, y + 4);
    y += obs.length * 4 + 8;
  }

  // ===== RODAPÉ =====
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(110, 110, 110);
    const enderecoEmpresa = [empresa?.logradouro, empresa?.numero, empresa?.bairro, empresa?.cidade, empresa?.uf]
      .filter(Boolean)
      .join(", ");
    const rodape = [empresa?.site, enderecoEmpresa, empresa?.email].filter(Boolean).join("  |  ");
    if (rodape) doc.text(rodape, pw / 2, ph - 10, { align: "center" });
    doc.text(`Página ${i} de ${pages}`, pw - ml, ph - 10, { align: "right" });
  }

  doc.save(`Boletim_Medicao_${String(boletim.numero || "").padStart(2, "0")}-${boletim.ano || ""}.pdf`);
}
