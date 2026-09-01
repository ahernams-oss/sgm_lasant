import jsPDF from "jspdf";

export interface HoleriteDados {
  competenciaMes?: number | null;
  competenciaAno?: number | null;
  tipo?: string | null;
  funcionarioNome?: string | null;
  funcionarioCpf?: string | null;
  funcionarioCargo?: string | null;
  salarioBase?: number | null;
  horasTrabalhadas?: number | null;
  horasExtras?: number | null;
  valorHorasExtras?: number | null;
  totalProventos?: number | null;
  totalDescontos?: number | null;
  valorLiquido?: number | null;
}

export interface EmpresaHolerite {
  razaoSocial?: string;
  cnpj?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
}

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const TIPOS: Record<string, string> = {
  folha: "Folha Mensal",
  "13o": "13º Salário",
  ferias: "Férias",
  rescisao: "Rescisão",
  outros: "Outros",
};

const money = (v?: number | null) =>
  (Number(v) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (v?: number | null) =>
  v == null ? "" : Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 2 });

function desenharHolerite(doc: jsPDF, d: HoleriteDados, empresa?: EmpresaHolerite, topo = 15) {
  const pw = doc.internal.pageSize.getWidth();
  const ml = 14;
  const mr = 14;
  const w = pw - ml - mr;
  let y = topo;

  // Cabeçalho
  doc.setDrawColor(120);
  doc.setLineWidth(0.3);
  doc.rect(ml, y, w, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(empresa?.razaoSocial || "", ml + 3, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const endereco = [
    [empresa?.logradouro, empresa?.numero].filter(Boolean).join(", "),
    empresa?.bairro,
    [empresa?.cidade, empresa?.uf].filter(Boolean).join("/"),
    empresa?.cep,
  ].filter(Boolean).join(" - ");
  if (endereco) doc.text(endereco, ml + 3, y + 11);
  if (empresa?.cnpj) doc.text(`CNPJ: ${empresa.cnpj}`, ml + 3, y + 15.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("RECIBO DE PAGAMENTO DE SALÁRIO", ml + w - 3, y + 7, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const comp = d.competenciaMes
    ? `${MESES[(d.competenciaMes || 1) - 1]}/${d.competenciaAno ?? ""}`
    : "—";
  doc.text(`Competência: ${comp}`, ml + w - 3, y + 12, { align: "right" });
  doc.text(`Tipo: ${TIPOS[d.tipo || ""] || d.tipo || "—"}`, ml + w - 3, y + 16.5, { align: "right" });
  y += 20;

  // Dados do funcionário
  doc.rect(ml, y, w, 14);
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text("FUNCIONÁRIO", ml + 3, y + 4.5);
  doc.text("CPF", ml + w * 0.6, y + 4.5);
  doc.text("CARGO", ml + 3, y + 11);
  doc.setTextColor(0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(d.funcionarioNome || "—", ml + 25, y + 4.5);
  doc.text(d.funcionarioCpf || "—", ml + w * 0.6 + 12, y + 4.5);
  doc.setFont("helvetica", "normal");
  doc.text(d.funcionarioCargo || "—", ml + 20, y + 11);
  y += 14;

  // Tabela de verbas
  const colDesc = ml;
  const colRef = ml + w * 0.52;
  const colProv = ml + w * 0.68;
  const colDesc2 = ml + w * 0.84;
  const headerH = 7;
  doc.setFillColor(240, 240, 245);
  doc.rect(ml, y, w, headerH, "F");
  doc.rect(ml, y, w, headerH);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIÇÃO", colDesc + 3, y + 4.8);
  doc.text("REFERÊNCIA", colRef + 3, y + 4.8);
  doc.text("PROVENTOS", colProv + w * 0.16 - 3, y + 4.8, { align: "right" });
  doc.text("DESCONTOS", colDesc2 + w * 0.16 - 3, y + 4.8, { align: "right" });
  y += headerH;

  const linhas: Array<[string, string, number | null, number | null]> = [
    ["Horas Normais", d.horasTrabalhadas != null ? `${num(d.horasTrabalhadas)} h` : "", d.salarioBase ?? null, null],
    ["Horas Extras", d.horasExtras != null ? `${num(d.horasExtras)} h` : "", d.valorHorasExtras ?? null, null],
  ];
  const outrosProv = Math.max(
    0,
    (Number(d.totalProventos) || 0) - (Number(d.salarioBase) || 0) - (Number(d.valorHorasExtras) || 0)
  );
  if (outrosProv > 0.009) linhas.push(["Outros Proventos", "", outrosProv, null]);
  if ((Number(d.totalDescontos) || 0) > 0) linhas.push(["Descontos (INSS, IRRF e outros)", "", null, d.totalDescontos ?? null]);

  const rowH = 6.5;
  const minRows = 10;
  const totalRows = Math.max(minRows, linhas.length);
  const bodyH = totalRows * rowH;
  doc.rect(ml, y, w, bodyH);
  doc.setFont("helvetica", "normal");
  linhas.forEach((l, i) => {
    const ly = y + i * rowH + 4.5;
    doc.text(l[0], colDesc + 3, ly);
    if (l[1]) doc.text(l[1], colRef + 3, ly);
    if (l[2] != null) doc.text(money(l[2]), colProv + w * 0.16 - 3, ly, { align: "right" });
    if (l[3] != null) doc.text(money(l[3]), colDesc2 + w * 0.16 - 3, ly, { align: "right" });
  });
  // linhas verticais
  [colRef, colProv, colDesc2].forEach((x) => doc.line(x, y - headerH, x, y + bodyH));
  y += bodyH;

  // Totais
  const totH = 10;
  doc.rect(ml, y, w, totH);
  [colProv, colDesc2].forEach((x) => doc.line(x, y, x, y + totH));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TOTAIS", colDesc + 3, y + 6.5);
  doc.text(money(d.totalProventos), colProv + w * 0.16 - 3, y + 6.5, { align: "right" });
  doc.text(money(d.totalDescontos), colDesc2 + w * 0.16 - 3, y + 6.5, { align: "right" });
  y += totH;

  // Líquido
  const liqH = 12;
  doc.rect(ml, y, w, liqH);
  doc.setFillColor(245, 245, 250);
  doc.rect(colProv, y, w * 0.32, liqH, "F");
  doc.rect(colProv, y, w * 0.32, liqH);
  doc.setFontSize(9);
  doc.text("VALOR LÍQUIDO", colProv + 3, y + 7.5);
  doc.setFontSize(11);
  doc.text(`R$ ${money(d.valorLiquido)}`, ml + w - 3, y + 7.5, { align: "right" });
  y += liqH + 14;

  // Assinatura
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "Declaro ter recebido a importância líquida discriminada neste recibo.",
    ml,
    y
  );
  y += 16;
  doc.line(ml, y, ml + w * 0.5, y);
  doc.text("Assinatura do funcionário", ml, y + 4);
  doc.text(`Data: ____/____/________`, ml + w - 3, y + 4, { align: "right" });

  return y + 10;
}

export function gerarPdfHolerite(dados: HoleriteDados | HoleriteDados[], empresa?: EmpresaHolerite) {
  const lista = Array.isArray(dados) ? dados : [dados];
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  lista.forEach((d, i) => {
    if (i > 0) doc.addPage();
    desenharHolerite(doc, d, empresa, 15);
  });
  return doc;
}

export function imprimirHolerite(dados: HoleriteDados | HoleriteDados[], empresa?: EmpresaHolerite) {
  const doc = gerarPdfHolerite(dados, empresa);
  const url = doc.output("bloburl") as unknown as string;
  const win = window.open(url, "_blank");
  if (win) win.onload = () => win.print();
}

export function baixarHolerite(dados: HoleriteDados | HoleriteDados[], empresa?: EmpresaHolerite, nome = "holerite.pdf") {
  gerarPdfHolerite(dados, empresa).save(nome);
}
