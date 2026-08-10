import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Orcamento } from "@/contexts/OrcamentosContext";
import { Empresa } from "@/contexts/EmpresaContext";

const DARK_BLUE: [number, number, number] = [30, 58, 107];
const BORDER_COLOR: [number, number, number] = [180, 180, 180];

const nf = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Tipo = "area" | "mao_de_obra" | "unidade";

const UNIDADE_LABEL: Record<Tipo, string> = {
  area: "ÁREA (m²)",
  mao_de_obra: "HORA TOTAL",
  unidade: "UNIDADE",
};

const calcLinha = (tipo: Tipo, l: any): number => {
  if (tipo === "area") return (l.quantidade || 0) * (l.comprimento || 0) * (l.largura || 0);
  if (tipo === "mao_de_obra") return (l.hrDia || 0) * (l.dias || 0);
  return l.quantidade || 0;
};

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

export async function gerarPdfMemoriaCalculo(orc: Orcamento, empresa?: Empresa) {
  const grupos: any[] = Array.isArray(orc.memoriaCalculo) ? orc.memoriaCalculo : [];
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ml = 14;
  const mr = 14;

  // ===== Cabeçalho padrão LASANT =====
  let y = 14;
  const logoH = 18;
  const logoW = 40;

  if (empresa?.logoUrl) {
    const logoData = await loadImageAsDataUrl(empresa.logoUrl);
    if (logoData) {
      try { doc.addImage(logoData, "PNG", ml, y, logoW, logoH); } catch { /* ignore */ }
    }
  }

  const center = pw / 2;
  doc.setFontSize(18);
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(...DARK_BLUE);
  doc.text("MEMÓRIA DE CÁLCULO", center, y + 9, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "italic");
  doc.text(orc.clienteNome || "Cliente", center, y + 17, { align: "center" });

  y += logoH + 6;
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.5);
  doc.line(ml, y, pw - mr, y);
  y += 8;

  doc.setTextColor(30, 30, 30);
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
      ["Nº Orçamento:", String(orc.numero ?? "-"), "Nº SS:", String(orc.solicitacaoNumero ?? "-")],
      [
        "Data:",
        orc.createdAt ? new Date(orc.createdAt).toLocaleDateString("pt-BR") : "-",
        "Categoria:",
        orc.categoria || "-",
      ],
    ],
    margin: { left: ml, right: mr },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  if (!grupos.length) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Nenhuma memória de cálculo cadastrada neste orçamento.", ml, y + 4);
  }

  for (const g of grupos) {
    const tipo: Tipo = (g.tipo || "unidade") as Tipo;
    const linhas: any[] = Array.isArray(g.linhas) ? g.linhas : [];
    const total = linhas.reduce((s, l) => s + calcLinha(tipo, l), 0);

    const head =
      tipo === "area"
        ? [["ITEM", "CÓDIGO", "DESCRIÇÃO", "SETOR", "QTD", "COMP.", "LARG.", UNIDADE_LABEL[tipo]]]
        : tipo === "mao_de_obra"
        ? [["ITEM", "CÓDIGO", "DESCRIÇÃO", "SETOR", "HR/DIA", "DIAS", UNIDADE_LABEL[tipo]]]
        : [["ITEM", "CÓDIGO", "DESCRIÇÃO", "SETOR", UNIDADE_LABEL[tipo]]];

    const body: any[] = [
      [{
        content: `${g.item ? g.item + " - " : ""}${g.titulo || "SEM TÍTULO"}`,
        colSpan: head[0].length,
        styles: { fillColor: [220, 228, 240], textColor: 30, fontStyle: "bold", halign: "left" },
      }],
    ];

    for (const l of linhas) {
      const base = [l.item || "", l.codigo || "", l.descricao || "", l.setor || ""];
      if (tipo === "area") {
        body.push([...base, nf(l.quantidade || 0), nf(l.comprimento || 0), nf(l.largura || 0), nf(calcLinha(tipo, l))]);
      } else if (tipo === "mao_de_obra") {
        body.push([...base, nf(l.hrDia || 0), nf(l.dias || 0), nf(calcLinha(tipo, l))]);
      } else {
        body.push([...base, nf(calcLinha(tipo, l))]);
      }
    }

    body.push([
      { content: "TOTAL:", colSpan: head[0].length - 1, styles: { halign: "right", fontStyle: "bold", fillColor: [245, 247, 252] } },
      { content: nf(total), styles: { fontStyle: "bold", fillColor: [245, 247, 252] } },
    ]);

    autoTable(doc, {
      startY: y,
      head,
      body,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 58, 107], textColor: 255 },
      columnStyles: { 0: { cellWidth: 14 }, 1: { cellWidth: 24 } },
      theme: "grid",
      margin: { left: ml, right: mr },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
    if (y > 260) { doc.addPage(); y = 20; }
  }

  // Rodapé padrão
  const pages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(
      `${empresa?.razaoSocial || empresa?.nomeFantasia || "LASANT"} — Memória de Cálculo`,
      ml,
      doc.internal.pageSize.getHeight() - 8,
    );
    doc.text(`Página ${p} de ${pages}`, pw - mr, doc.internal.pageSize.getHeight() - 8, { align: "right" });
  }

  doc.save(`Memoria_Calculo_Orcamento_${orc.numero}.pdf`);
}
