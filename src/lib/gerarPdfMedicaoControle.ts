import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Cliente, Contrato, Faturamento } from "@/contexts/ClientesContext";
import type { OrdemServico } from "@/contexts/OrdensServicoContext";

const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (s?: string) => s ? new Date(s + "T00:00:00").toLocaleDateString("pt-BR") : "";

// Sigla derivada do nome da categoria. Mantém abreviações comuns.
const SIGLAS: Record<string, string> = {
  "ELETRICA": "EL", "ELÉTRICA": "EL",
  "ELETRO-MECANICA": "EM", "ELETRO-MECÂNICA": "EM", "ELETROMECANICA": "EM", "ELETROMECÂNICA": "EM",
  "ESQUADRIAS": "ES",
  "GASES MEDICINAIS": "GM",
  "HIDROSANITARIA": "HS", "HIDROSANITÁRIA": "HS", "HIDRO-SANITARIA": "HS", "HIDRO-SANITÁRIA": "HS",
  "PINTURA": "PI",
  "OBRAS CIVIS": "OC",
  "PROTECAO CONTRA INCENDIO": "PCI", "PROTEÇÃO CONTRA INCENDIO": "PCI", "PROTEÇÃO CONTRA INCÊNDIO": "PCI",
};

function siglaFromCategoria(cat: string): { sigla: string; nome: string } {
  if (!cat) return { sigla: "-", nome: "—" };
  // formato comum: "01 - ELETRICA"
  const parts = cat.split(" - ");
  const nome = (parts[1] || parts[0] || cat).trim();
  const key = nome.toUpperCase();
  const sigla = SIGLAS[key] || nome.substring(0, 2).toUpperCase();
  return { sigla, nome: `${sigla}-${nome.toUpperCase()}` };
}

function valorOS(os: OrdemServico): number {
  const bdi = Number(os.bdi || 0);
  const totalMat = (os.materiais || []).reduce((s: number, m: any) => s + (Number(m.valorTotal) || 0), 0);
  const totalEst = (os.materiaisEstoque || []).reduce((s: number, m: any) => s + (Number(m.valorTotal) || 0), 0);
  const subtotal = totalMat + totalEst;
  return subtotal * (1 + bdi / 100);
}

interface Params {
  cliente: Cliente;
  contrato: Contrato;
  faturamento: Faturamento;
  ordens: OrdemServico[];
  empresaNome?: string;
}

export function gerarPdfMedicaoControle({ cliente, contrato, faturamento, ordens, empresaNome }: Params): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();

  // Filtra OS pelo cliente e período do faturamento
  const ini = faturamento.periodoInicio || "";
  const fim = faturamento.periodoFim || "";
  const inRange = (d: string) => {
    if (!d) return false;
    const dd = d.substring(0, 10);
    return (!ini || dd >= ini) && (!fim || dd <= fim);
  };
  const osFiltradas = (ordens || []).filter(o => o.clienteId === cliente.id && (
    inRange(o.dataTermino) || inRange(o.dataInicio) || inRange((o.createdAt || "").substring(0, 10))
  ) && o.situacao !== "Aberta");

  // Cabeçalho institucional
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(60, 60, 60);
  doc.text("Coordenadoria Técnica de Avaliação de Tecnologia em Saúde e Insumos Estratégicos", 14, 10);
  doc.text("Coordenação de Engenharia e Arquitetura", 14, 14);
  doc.text("S/IVISA-RIO/CTATS/CEA", 14, 18);

  // Título
  doc.setFillColor(30, 58, 107);
  doc.rect(0, 24, pw, 12, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("PLANILHA 3: CONTROLE GERAL DE OS's GERAL", pw / 2, 32, { align: "center" });

  // Subtítulo unidade
  doc.setTextColor(30, 30, 30); doc.setFontSize(10); doc.setFont("helvetica", "bold");
  const unidade = `UNIDADE DA SMS: ${(empresaNome || "").toUpperCase()}     ${cliente.nome.toUpperCase()}`;
  doc.text(unidade, 14, 44);

  // Bloco Processo / Contrato / Período
  let y = 50;
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [220, 220, 220], textColor: [30, 30, 30], fontStyle: "bold", halign: "center" },
    body: [
      [
        { content: "PROCESSO Nº", styles: { fontStyle: "bold", fillColor: [240, 240, 240] } },
        { content: contrato.numeroProcesso || "—" },
        { content: "CONTRATO Nº", styles: { fontStyle: "bold", fillColor: [240, 240, 240] } },
        { content: contrato.numero || "—" },
        { content: "PERÍODO", styles: { fontStyle: "bold", fillColor: [240, 240, 240] } },
        { content: `${fmtDate(ini)} a ${fmtDate(fim)}` },
      ],
    ],
  });
  y = (doc as any).lastAutoTable.finalY + 4;

  // Agrupar OS por categoria
  const grupos = new Map<string, { sigla: string; nome: string; numeros: number[]; qtd: number; valor: number }>();
  for (const os of osFiltradas) {
    const { sigla, nome } = siglaFromCategoria(os.categoria || "");
    const key = sigla;
    const g = grupos.get(key) || { sigla, nome, numeros: [], qtd: 0, valor: 0 };
    if (os.numero) g.numeros.push(os.numero);
    g.qtd += 1;
    g.valor += valorOS(os);
    grupos.set(key, g);
  }

  // Garante linhas padrão (mesmo que vazias)
  const padrao: Array<[string, string]> = [
    ["EL", "EL-ELÉTRICA"],
    ["EM", "EM-ELETRO-MECÂNICA"],
    ["ES", "ES-ESQUADRIAS"],
    ["GM", "GM-GASES MEDICINAIS"],
    ["HS", "HS-HIDROSANITÁRIA"],
    ["PI", "PI-PINTURA"],
    ["OC", "OC-OBRAS CIVIS"],
    ["PCI", "PCI-PROTEÇÃO CONTRA INCENDIO"],
  ];
  for (const [s, n] of padrao) if (!grupos.has(s)) grupos.set(s, { sigla: s, nome: n, numeros: [], qtd: 0, valor: 0 });

  const localUnidade = cliente.nome.toUpperCase();
  const dataRef = fmtDate(fim) || fmtDate(ini) || new Date().toLocaleDateString("pt-BR");

  const linhas: any[] = [];
  let totalQtd = 0; let totalValor = 0;
  // Ordena seguindo a ordem padrão depois extras
  const ordemKeys = [...padrao.map(p => p[0]), ...Array.from(grupos.keys()).filter(k => !padrao.some(p => p[0] === k))];
  for (const key of ordemKeys) {
    const g = grupos.get(key); if (!g) continue;
    const numerosTxt = g.numeros.length ? g.numeros.sort((a, b) => a - b).join(" ") : "0";
    linhas.push([
      localUnidade,
      dataRef,
      numerosTxt,
      g.sigla,
      g.nome,
      String(g.qtd),
      "R$",
      g.valor > 0 ? fmt(g.valor) : "-",
      "CONCLUÍDO",
    ]);
    totalQtd += g.qtd; totalValor += g.valor;
  }

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 1.8, valign: "middle" },
    headStyles: { fillColor: [30, 58, 107], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 22, halign: "center" },
      2: { cellWidth: 90 },
      3: { cellWidth: 14, halign: "center" },
      4: { cellWidth: 50 },
      5: { cellWidth: 14, halign: "center" },
      6: { cellWidth: 10, halign: "right" },
      7: { cellWidth: 24, halign: "right" },
      8: { cellWidth: 24, halign: "center" },
    },
    head: [[
      "LOCAL DA UNIDADE HOSPITALAR", "DATA", "Nº DE O.S.", "ITEM", "SERVIÇOS (RESUMO)", "QTOS", "", "VALOR", "SITUAÇÃO",
    ]],
    body: linhas,
    foot: [[
      { content: "TOTAL", colSpan: 5, styles: { fontStyle: "bold", halign: "right", fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
      { content: String(totalQtd), styles: { fontStyle: "bold", halign: "center", fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
      { content: "R$", styles: { fontStyle: "bold", halign: "right", fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
      { content: fmt(totalValor), styles: { fontStyle: "bold", halign: "right", fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
      { content: "", styles: { fillColor: [220, 220, 220] } },
    ]],
  });

  // Rodapé
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(8); doc.setTextColor(80, 80, 80);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, finalY);
  doc.text(`Faturamento: Medição ${faturamento.numeroMedicao || "—"}  |  NF ${faturamento.numeroNf || "—"}`, pw - 14, finalY, { align: "right" });

  return doc;
}
