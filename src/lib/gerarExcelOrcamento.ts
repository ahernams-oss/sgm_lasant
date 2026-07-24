import ExcelJS from "exceljs";
import { Orcamento } from "@/contexts/OrcamentosContext";

const SEM_FAMILIA = "SEM FAMÍLIA";

// Cores extraídas do modelo enviado pelo cliente
const COR_FAMILIA = "FFDAE3F3";      // Azul claro
const COR_SUBTOTAL = "FFE2EFDA";     // Verde claro
const COR_TOTAL = "FF002060";        // Azul marinho
const COR_HEADER = "FF1E3A6B";       // Cabeçalho tabela (dark blue)

type Linha = {
  familia: string; codigo: string; descricao: string; unidade: string;
  quantidade: number; valorUnitario: number; valorTotal: number;
};

function coletar(orc: Orcamento): Map<string, Linha[]> {
  const linhas: Linha[] = [
    ...orc.itensSco.map<Linha>(i => ({
      familia: (i.familia || SEM_FAMILIA).trim().toUpperCase() || SEM_FAMILIA,
      codigo: i.codSco, descricao: i.descricao, unidade: i.unidade,
      quantidade: i.quantidade, valorUnitario: i.valorUnitario, valorTotal: i.valorTotal,
    })),
    ...orc.itensMateriais.map<Linha>(i => ({
      familia: (i.familia || SEM_FAMILIA).trim().toUpperCase() || SEM_FAMILIA,
      codigo: i.codigo, descricao: i.descricao, unidade: i.unidade,
      quantidade: i.quantidade, valorUnitario: i.valorUnitario, valorTotal: i.valorTotal,
    })),
  ];
  const map = new Map<string, Linha[]>();
  for (const l of linhas) {
    if (!map.has(l.familia)) map.set(l.familia, []);
    map.get(l.familia)!.push(l);
  }
  return map;
}

const fill = (color: string) => ({ type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: color } });
const thinBorder = {
  top: { style: "thin" as const, color: { argb: "FFB4B4B4" } },
  left: { style: "thin" as const, color: { argb: "FFB4B4B4" } },
  bottom: { style: "thin" as const, color: { argb: "FFB4B4B4" } },
  right: { style: "thin" as const, color: { argb: "FFB4B4B4" } },
};

export async function gerarExcelOrcamento(orc: Orcamento) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Orçamento");

  ws.columns = [
    { width: 18 }, { width: 60 }, { width: 10 },
    { width: 12 }, { width: 16 }, { width: 16 },
  ];

  // Título
  ws.mergeCells("A1:F1");
  const title = ws.getCell("A1");
  title.value = "ORÇAMENTO DE SERVIÇO";
  title.font = { bold: true, size: 16, color: { argb: "FF1E3A6B" } };
  title.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 24;

  // Info do orçamento
  const info: Array<[string, any, string, any]> = [
    ["Orçamento Nº", orc.numero, "SS Nº", orc.solicitacaoNumero],
    ["Cliente", orc.clienteNome, "Status", orc.status],
    ["Categoria", orc.categoria || "-", "Data", orc.createdAt ? new Date(orc.createdAt).toLocaleDateString("pt-BR") : ""],
  ];
  info.forEach((row, idx) => {
    const r = 3 + idx;
    ws.getCell(`A${r}`).value = row[0];
    ws.getCell(`A${r}`).font = { bold: true };
    ws.getCell(`B${r}`).value = row[1];
    ws.getCell(`D${r}`).value = row[2];
    ws.getCell(`D${r}`).font = { bold: true };
    ws.getCell(`E${r}`).value = row[3];
  });

  // Cabeçalho da tabela
  const headerRow = 7;
  const headers = ["Código", "Descrição", "Unid", "Quant", "Pr. Unit.", "Pr. Total"];
  headers.forEach((h, i) => {
    const cell = ws.getCell(headerRow, i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = fill(COR_HEADER);
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = thinBorder;
  });

  const money = 'R$ #,##0.00;[Red]-R$ #,##0.00';
  const grupos = coletar(orc);
  let cursor = headerRow + 1;

  for (const [familia, itens] of Array.from(grupos.entries()).sort(([a], [b]) => a.localeCompare(b, "pt-BR"))) {
    // Linha da Família
    ws.mergeCells(cursor, 1, cursor, 6);
    const famCell = ws.getCell(cursor, 1);
    famCell.value = familia;
    famCell.font = { bold: true, color: { argb: "FF1E3A6B" } };
    famCell.fill = fill(COR_FAMILIA);
    famCell.alignment = { horizontal: "left", vertical: "middle" };
    for (let c = 1; c <= 6; c++) ws.getCell(cursor, c).border = thinBorder;
    cursor++;

    let sub = 0;
    for (const it of itens) {
      sub += it.valorTotal;
      const row = [it.codigo, it.descricao, it.unidade, it.quantidade, it.valorUnitario, it.valorTotal];
      row.forEach((v, i) => {
        const cell = ws.getCell(cursor, i + 1);
        cell.value = v;
        cell.border = thinBorder;
        if (i >= 3) cell.alignment = { horizontal: "right" };
        if (i === 2) cell.alignment = { horizontal: "center" };
        if (i === 4 || i === 5) cell.numFmt = money;
      });
      cursor++;
    }

    // Subtotal
    ws.mergeCells(cursor, 1, cursor, 5);
    const subLabel = ws.getCell(cursor, 1);
    subLabel.value = `Subtotal ${familia}:`;
    subLabel.font = { bold: true };
    subLabel.alignment = { horizontal: "right", vertical: "middle" };
    subLabel.fill = fill(COR_SUBTOTAL);
    const subVal = ws.getCell(cursor, 6);
    subVal.value = sub;
    subVal.numFmt = money;
    subVal.font = { bold: true };
    subVal.fill = fill(COR_SUBTOTAL);
    for (let c = 1; c <= 6; c++) ws.getCell(cursor, c).border = thinBorder;
    cursor++;
  }

  // Total geral
  cursor++;
  ws.mergeCells(cursor, 1, cursor, 5);
  const totLabel = ws.getCell(cursor, 1);
  totLabel.value = "TOTAL GERAL:";
  totLabel.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
  totLabel.alignment = { horizontal: "right", vertical: "middle" };
  totLabel.fill = fill(COR_TOTAL);
  const totVal = ws.getCell(cursor, 6);
  totVal.value = orc.valorTotal;
  totVal.numFmt = money;
  totVal.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
  totVal.fill = fill(COR_TOTAL);
  for (let c = 1; c <= 6; c++) ws.getCell(cursor, c).border = thinBorder;
  ws.getRow(cursor).height = 20;
  cursor += 2;

  if (orc.observacoes) {
    ws.getCell(cursor, 1).value = "Observações:";
    ws.getCell(cursor, 1).font = { bold: true };
    ws.mergeCells(cursor, 2, cursor, 6);
    ws.getCell(cursor, 2).value = orc.observacoes;
    ws.getCell(cursor, 2).alignment = { wrapText: true, vertical: "top" };
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Orcamento_${orc.numero}_SS${orc.solicitacaoNumero}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
