import * as XLSX from "xlsx";
import { Orcamento } from "@/contexts/OrcamentosContext";

const SEM_FAMILIA = "SEM FAMÍLIA";

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

export function gerarExcelOrcamento(orc: Orcamento) {
  const wb = XLSX.utils.book_new();

  // Cabeçalho geral
  const dados: any[][] = [
    ["ORÇAMENTO DE SERVIÇO"],
    [],
    ["Orçamento Nº", orc.numero, "", "SS Nº", orc.solicitacaoNumero],
    ["Cliente", orc.clienteNome, "", "Status", orc.status],
    ["Categoria", orc.categoria || "-", "", "Data", orc.createdAt ? new Date(orc.createdAt).toLocaleDateString("pt-BR") : ""],
    [],
    ["Código", "Descrição", "Unid", "Quant", "Pr. Unit.", "Pr. Total"],
  ];

  const grupos = coletar(orc);
  const merges: any[] = [];
  const familiaRows: number[] = [];
  const subtotalRows: number[] = [];

  for (const [familia, itens] of Array.from(grupos.entries()).sort(([a], [b]) => a.localeCompare(b, "pt-BR"))) {
    dados.push([familia, "", "", "", "", ""]);
    const rowIdx = dados.length - 1;
    familiaRows.push(rowIdx);
    merges.push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 5 } });

    let sub = 0;
    for (const it of itens) {
      sub += it.valorTotal;
      dados.push([it.codigo, it.descricao, it.unidade, it.quantidade, it.valorUnitario, it.valorTotal]);
    }
    dados.push(["", "", "", "", `Subtotal ${familia}:`, sub]);
    subtotalRows.push(dados.length - 1);
  }
  dados.push([]);
  dados.push(["", "", "", "", "TOTAL GERAL:", orc.valorTotal]);
  const totalRow = dados.length - 1;

  if (orc.observacoes) {
    dados.push([]);
    dados.push(["Observações:", orc.observacoes]);
  }

  const ws = XLSX.utils.aoa_to_sheet(dados);
  ws["!cols"] = [{ wch: 16 }, { wch: 60 }, { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 14 }];
  ws["!merges"] = merges;

  // Formatar valores moeda
  const money = "R$ #,##0.00";
  for (let r = 7; r <= totalRow; r++) {
    const eu = ws[XLSX.utils.encode_cell({ r, c: 4 })];
    const et = ws[XLSX.utils.encode_cell({ r, c: 5 })];
    if (eu && typeof eu.v === "number") eu.z = money;
    if (et && typeof et.v === "number") et.z = money;
  }

  XLSX.utils.book_append_sheet(wb, ws, "Orçamento");
  XLSX.writeFile(wb, `Orcamento_${orc.numero}_SS${orc.solicitacaoNumero}.xlsx`);
}
