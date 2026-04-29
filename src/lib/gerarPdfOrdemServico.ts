import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { OrdemServico, MaterialOS } from "@/contexts/OrdensServicoContext";
import { Empresa } from "@/contexts/EmpresaContext";
import { Cliente } from "@/contexts/ClientesContext";

const DARK = [60, 60, 60] as const;
const BORDER: [number, number, number] = [60, 60, 60];

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

const fmtBRL = (n: number) =>
  `R$ ${(Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDateTime = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const fmtDate = (s?: string) => {
  if (!s) return "";
  if (s.includes("/")) return s;
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("pt-BR");
};

export interface RenderOSOptions {
  os: OrdemServico;
  empresa?: Empresa;
  cliente?: Cliente;
}

async function renderOS(doc: jsPDF, { os, empresa, cliente }: RenderOSOptions) {
  const pw = doc.internal.pageSize.getWidth();
  const ml = 12, mr = 12;
  const cw = pw - ml - mr;
  let y = 12;

  // ===== HEADER =====
  // Logo empresa (esquerda), nome cliente centralizado, número OS à direita
  if (empresa?.logoUrl) {
    const data = await loadImageAsDataUrl(empresa.logoUrl);
    if (data) {
      try { doc.addImage(data, "PNG", ml, y, 32, 18); } catch { /* ignore */ }
    }
  }

  // Centro: nome cliente + título
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);
  const clienteNome = cliente?.nome || cliente?.nomeFantasia || os.clienteNome || "";
  const cap = cliente?.cap ? `CAP ${cliente.cap}` : "";

  doc.text(clienteNome, pw / 2, y + 4, { align: "center" });
  if (cap) doc.text(cap, pw / 2, y + 9, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("ORDEM DE SERVIÇO DE MANUTENÇÃO", pw / 2, y + 17, { align: "center" });

  // Número da OS (direita) — formato: CAP-NUMERO/ANO-TIPO
  const anoOS = (() => {
    const d = os.createdAt ? new Date(os.createdAt) : new Date();
    return isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  })();
  const numeroFormatado = `${cliente?.cap || "—"}-${os.numero}/${anoOS}-${os.tipoOs?.sigla || ""}`;
  const boxW = 55, boxH = 10;
  const boxX = pw - mr - boxW;
  const boxY = y + 11;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Nº", boxX - 4, boxY + 6, { align: "right" });
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.4);
  doc.rect(boxX, boxY, boxW, boxH);
  doc.setFontSize(10);
  doc.text(numeroFormatado, boxX + boxW / 2, boxY + 7, { align: "center" });

  y += 24;

  // ===== INFO TABLE: Unidade Requisitante / Data Aprovação =====
  const localText = os.localDescricao || "";
  const dataCriacao = fmtDateTime(os.createdAt);
  const dataValidacao = (() => {
    const h = (os.historico || []).find((h: any) => h.situacao === "Validada");
    return h ? fmtDateTime(h.data) : "";
  })();
  const dataSolicitacao = (() => {
    // Tenta data do histórico "Aberta" como aproximação
    const h = (os.historico || []).find((h: any) => h.situacao === "Aberta");
    return h ? fmtDateTime(h.data) : dataCriacao;
  })();
  const dataExecucao = os.dataInicio
    ? `${fmtDate(os.dataInicio)}${os.horaInicio ? ` ${os.horaInicio}` : ""}`
    : "";

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 7.5, cellPadding: 1.5, lineColor: BORDER, lineWidth: 0.3, textColor: [30, 30, 30] },
    body: [
      [
        { content: "Unidade Requisitante:", styles: { fontStyle: "normal", fontSize: 6.5, valign: "top" } },
        { content: "Data aprovação:", styles: { fontStyle: "normal", fontSize: 6.5, valign: "top" } },
      ],
      [
        { content: localText, styles: { fontStyle: "bold", fontSize: 10, halign: "center", minCellHeight: 8 } },
        { content: dataValidacao || "-", styles: { fontStyle: "bold", halign: "center", minCellHeight: 8 } },
      ],
    ],
    columnStyles: { 0: { cellWidth: cw * 0.7 }, 1: { cellWidth: cw * 0.3 } },
    margin: { left: ml, right: mr },
  });
  y = (doc as any).lastAutoTable.finalY;

  // ===== Datas: Solicitação / Execução, Pavimento / Setor =====
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 7.5, cellPadding: 1.8, lineColor: BORDER, lineWidth: 0.3, textColor: [30, 30, 30], halign: "center", valign: "middle" },
    body: [
      [
        { content: "Data da Solicitação:", styles: { fontStyle: "bold" } },
        { content: dataSolicitacao || "-", styles: { fontStyle: "bold" } },
        { content: "Data de Execução:", styles: { fontStyle: "bold" } },
        { content: dataExecucao || "-", styles: { fontStyle: "bold" } },
      ],
      [
        { content: "Pavimento:", styles: { fontStyle: "bold" } },
        { content: os.pavimentoDescricao || "-", styles: { fontStyle: "bold" } },
        { content: "Setor:", styles: { fontStyle: "bold" } },
        { content: os.setorDescricao || "-", styles: { fontStyle: "bold" } },
      ],
      [
        { content: "Processo:", styles: { fontStyle: "bold" } },
        {
          content: (() => {
            const contratos = (cliente as any)?.contratos || [];
            const ativo = contratos.find((c: any) => c?.numero) || contratos[0];
            return ativo?.numero || "-";
          })(),
          styles: { fontStyle: "bold" },
        },
        { content: "Tipo de serviço:", styles: { fontStyle: "bold" } },
        { content: os.categoria || os.servico || "-", styles: { fontStyle: "bold" } },
      ],
    ],
    columnStyles: {
      0: { cellWidth: cw * 0.22 }, 1: { cellWidth: cw * 0.28 },
      2: { cellWidth: cw * 0.22 }, 3: { cellWidth: cw * 0.28 },
    },
    margin: { left: ml, right: mr },
  });
  y = (doc as any).lastAutoTable.finalY + 4;

  // ===== Descrição do Serviço Pretendido + Nome do Solicitante =====
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 7.5, cellPadding: 1.8, lineColor: BORDER, lineWidth: 0.3, textColor: [30, 30, 30] },
    body: [
      [
        { content: `Descrição do Serviço Pretendido — Nº da SS: ${os.solicitacaoNumero || "-"}`, styles: { fontSize: 6.5 } },
        { content: "Nome do solicitante:", styles: { fontSize: 6.5 } },
      ],
      [
        { content: os.descricaoServicos || "", styles: { fontStyle: "bold", minCellHeight: 14, valign: "middle" } },
        { content: os.solicitante || "-", styles: { fontStyle: "bold", fontSize: 10, halign: "center", valign: "middle", minCellHeight: 14 } },
      ],
    ],
    columnStyles: { 0: { cellWidth: cw * 0.75 }, 1: { cellWidth: cw * 0.25 } },
    margin: { left: ml, right: mr },
  });
  y = (doc as any).lastAutoTable.finalY + 4;

  // ===== Aprovação da Fiscalização + Carimbo =====
  const fiscalizada = !!(os.historico || []).find((h: any) =>
    ["Executada", "Serviço Confirmado", "Validada"].includes(h.situacao)
  );
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 7.5, cellPadding: 1.8, lineColor: BORDER, lineWidth: 0.3, textColor: [30, 30, 30] },
    body: [
      [
        { content: "Aprovação da Fiscalização", styles: { fontSize: 6.5 } },
        { content: "Carimbo e assinatura", styles: { fontSize: 6.5 } },
      ],
      [
        {
          content: fiscalizada ? "Autorizado pelo Departamento de Engenharia / Fiscalização" : "",
          styles: { fontStyle: "bold", halign: "center", valign: "middle", minCellHeight: 18, fontSize: 9 },
        },
        { content: "", styles: { minCellHeight: 18 } },
      ],
    ],
    columnStyles: { 0: { cellWidth: cw * 0.75 }, 1: { cellWidth: cw * 0.25 } },
    margin: { left: ml, right: mr },
  });
  y = (doc as any).lastAutoTable.finalY + 4;

  // ===== MATERIAIS SCO =====
  // BDI: prioriza o contrato do cliente; cai para os.bdi se não houver
  const parseBdi = (v: any): number => {
    if (v === null || v === undefined || v === "") return NaN;
    const n = Number(String(v).replace(",", "."));
    return isNaN(n) ? NaN : n;
  };
  const contratoBdi = (() => {
    const contratos = (cliente as any)?.contratos || [];
    if (contratos.length === 0) return NaN;
    const ativo = contratos.find((c: any) => parseBdi(c?.bdi) > 0) || contratos[0];
    return parseBdi(ativo?.bdi);
  })();
  const bdi = !isNaN(contratoBdi) ? contratoBdi : (Number(os.bdi) || 0);
  const totalSCO = (os.materiais || []).reduce((s, m) => s + (Number(m.valorTotal) || 0), 0);
  const bdiSCO = totalSCO * (bdi / 100);
  const totalSCOcomBDI = totalSCO + bdiSCO;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 7.5, cellPadding: 1.5, lineColor: BORDER, lineWidth: 0.3, textColor: [30, 30, 30], halign: "center", valign: "middle" },
    headStyles: { fillColor: [255, 255, 255], textColor: [30, 30, 30], fontStyle: "bold", lineColor: BORDER, lineWidth: 0.3 },
    columnStyles: {
      0: { cellWidth: cw * 0.13 },
      1: { cellWidth: cw * 0.45, halign: "left" },
      2: { cellWidth: cw * 0.08 },
      3: { cellWidth: cw * 0.08 },
      4: { cellWidth: cw * 0.13, halign: "right" },
      5: { cellWidth: cw * 0.13, halign: "right" },
    },
    head: [["Código", "Descrição", "Und", "Qtd", "Pr. Unit.", "Pr. Total"]],
    body: (() => {
      const rows: any[] = (os.materiais || []).map((m: MaterialOS) => [
        m.codigo || "",
        m.descricao || "",
        m.unidade || "",
        String(m.quantidade ?? ""),
        fmtBRL(Number(m.valorUnitario) || 0),
        fmtBRL(Number(m.valorTotal) || 0),
      ]);
      if (rows.length === 0) {
        rows.push([{ content: "Sem materiais SCO", colSpan: 6, styles: { fontStyle: "italic", textColor: [120, 120, 120] } }]);
      }
      rows.push([
        { content: "TOTAL MATERIAL SCO", colSpan: 5, styles: { fontStyle: "bold", halign: "right" } },
        { content: fmtBRL(totalSCO), styles: { fontStyle: "bold", halign: "right" } },
      ]);
      rows.push([
        { content: "BDI (Benefícios e Despesas Indiretas)", colSpan: 4, styles: { fontStyle: "bold", halign: "left" } },
        { content: `${bdi.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`, styles: { fontStyle: "bold", halign: "right" } },
        { content: fmtBRL(bdiSCO), styles: { fontStyle: "bold", halign: "right" } },
      ]);
      rows.push([
        { content: "TOTAL SCO + BDI", colSpan: 5, styles: { fontStyle: "bold", halign: "right", fillColor: [240, 240, 240] } },
        { content: fmtBRL(totalSCOcomBDI), styles: { fontStyle: "bold", halign: "right", fillColor: [240, 240, 240] } },
      ]);
      return rows;
    })(),
    margin: { left: ml, right: mr },
  });
  y = (doc as any).lastAutoTable.finalY + 2;

  // ===== MATERIAIS DE ESTOQUE =====
  const totalEst = (os.materiaisEstoque || []).reduce((s, m) => s + (Number(m.valorTotal) || 0), 0);
  const bdiEst = totalEst * (bdi / 100);
  const totalEstcomBDI = totalEst + bdiEst;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 7.5, cellPadding: 1.5, lineColor: BORDER, lineWidth: 0.3, textColor: [30, 30, 30], halign: "center", valign: "middle" },
    columnStyles: {
      0: { cellWidth: cw * 0.13 },
      1: { cellWidth: cw * 0.45, halign: "left" },
      2: { cellWidth: cw * 0.08 },
      3: { cellWidth: cw * 0.08 },
      4: { cellWidth: cw * 0.13, halign: "right" },
      5: { cellWidth: cw * 0.13, halign: "right" },
    },
    body: (() => {
      const rows: any[] = [
        [{ content: "Materiais de Estoque", colSpan: 6, styles: { fontStyle: "bold", halign: "center", fillColor: [240, 240, 240] } }],
      ];
      const itens = os.materiaisEstoque || [];
      if (itens.length === 0) {
        rows.push([{ content: "Sem materiais de estoque", colSpan: 6, styles: { fontStyle: "italic", textColor: [120, 120, 120] } }]);
      } else {
        itens.forEach((m: MaterialOS) => {
          rows.push([
            m.codigo || "",
            m.descricao || "",
            m.unidade || "",
            String(m.quantidade ?? ""),
            fmtBRL(Number(m.valorUnitario) || 0),
            fmtBRL(Number(m.valorTotal) || 0),
          ]);
        });
      }
      rows.push([
        { content: "TOTAL MATERIAL ESTOQUE", colSpan: 5, styles: { fontStyle: "bold", halign: "right" } },
        { content: fmtBRL(totalEst), styles: { fontStyle: "bold", halign: "right" } },
      ]);
      rows.push([
        { content: "BDI (Benefícios e Despesas Indiretas)", colSpan: 4, styles: { fontStyle: "bold", halign: "left" } },
        { content: `${bdi.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`, styles: { fontStyle: "bold", halign: "right" } },
        { content: fmtBRL(bdiEst), styles: { fontStyle: "bold", halign: "right" } },
      ]);
      rows.push([
        { content: "TOTAL MATERIAIS ESTOQUE + BDI", colSpan: 5, styles: { fontStyle: "bold", halign: "right", fillColor: [240, 240, 240] } },
        { content: fmtBRL(totalEstcomBDI), styles: { fontStyle: "bold", halign: "right", fillColor: [240, 240, 240] } },
      ]);
      rows.push([
        { content: "TOTAL GERAL", colSpan: 5, styles: { fontStyle: "bold", halign: "right", fillColor: [220, 220, 220], fontSize: 9 } },
        { content: fmtBRL(totalSCOcomBDI + totalEstcomBDI), styles: { fontStyle: "bold", halign: "right", fillColor: [220, 220, 220], fontSize: 9 } },
      ]);
      return rows;
    })(),
    margin: { left: ml, right: mr },
  });
  y = (doc as any).lastAutoTable.finalY + 4;

  // ===== DADOS FINAIS / Avaliação + Carimbo gerente =====
  const validada = os.situacao === "Validada";
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 7.5, cellPadding: 1.8, lineColor: BORDER, lineWidth: 0.3, textColor: [30, 30, 30] },
    body: [
      [
        { content: "DADOS FINAIS:", colSpan: 2, styles: { fontStyle: "bold", fontSize: 7 } },
        { content: "Carimbo e assinatura", styles: { fontSize: 6.5, halign: "center" } },
      ],
      [
        { content: "Qual a avaliação do requisitante quanto à execução do serviço solicitado nesta OS?", colSpan: 2, styles: { fontSize: 7 } },
        { content: "", rowSpan: 4, styles: { minCellHeight: 30 } },
      ],
      [
        { content: validada ? "X" : "", styles: { halign: "center", valign: "middle", fontStyle: "bold", fontSize: 14, minCellHeight: 8 } },
        { content: "A CONTENTO", styles: { fontStyle: "bold", valign: "middle" } },
      ],
      [
        { content: "", styles: { halign: "center", valign: "middle", fontStyle: "bold", fontSize: 14, minCellHeight: 8 } },
        { content: "NÃO A CONTENTO", styles: { fontStyle: "bold", valign: "middle" } },
      ],
      [
        { content: "OBSERVAÇÕES:", colSpan: 2, styles: { fontSize: 7, fontStyle: "bold" } },
      ],
    ],
    columnStyles: {
      0: { cellWidth: cw * 0.15 },
      1: { cellWidth: cw * 0.55 },
      2: { cellWidth: cw * 0.30 },
    },
    margin: { left: ml, right: mr },
  });
  y = (doc as any).lastAutoTable.finalY;

  // Caixa de observações grande
  const obsTexto = (os.observacoes || []).map((o: any) => `• ${o.descricao || ""}`).join("\n") || "";
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2, lineColor: BORDER, lineWidth: 0.3, textColor: [30, 30, 30] },
    body: [[{ content: obsTexto, styles: { minCellHeight: 28, valign: "top" } }]],
    columnStyles: { 0: { cellWidth: cw } },
    margin: { left: ml, right: mr },
  });
}

function addFooter(doc: jsPDF, empresa?: Empresa, osNumero?: number) {
  const pw = doc.internal.pageSize.getWidth();
  const ml = 12, mr = 12;
  const pages = doc.getNumberOfPages();
  const nome = empresa?.nomeFantasia || empresa?.razaoSocial || "SGM Lasant";
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200, 200, 200);
    doc.line(ml, ph - 10, pw - mr, ph - 10);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text(`Documento gerado automaticamente — ${nome}`, ml, ph - 5);
    doc.text(`Página ${i} de ${pages}`, pw / 2, ph - 5, { align: "center" });
    if (osNumero) doc.text(`OS Nº ${osNumero}`, pw - mr, ph - 5, { align: "right" });
  }
}

export async function gerarPdfOrdemServico(opts: RenderOSOptions) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  await renderOS(doc, opts);
  addFooter(doc, opts.empresa, opts.os.numero);
  doc.save(`OS_${opts.os.numero}_${(opts.os.clienteNome || "").replace(/\s+/g, "_")}.pdf`);
}

export async function gerarPdfOrdemServicoLote(lista: RenderOSOptions[]) {
  if (lista.length === 0) return;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  for (let i = 0; i < lista.length; i++) {
    if (i > 0) doc.addPage();
    await renderOS(doc, lista[i]);
  }
  addFooter(doc, lista[0].empresa);
  const nums = lista.map(l => l.os.numero).join("_");
  doc.save(`OS_Lote_${nums}.pdf`);
}
