import * as XLSX from "xlsx";
import { Orcamento } from "@/contexts/OrcamentosContext";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function gerarExcelOrcamento(orc: Orcamento) {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ["ORÇAMENTO DE SERVIÇO"],
    [],
    ["Orçamento Nº", orc.numero],
    ["SS Nº", orc.solicitacaoNumero],
    ["Cliente", orc.clienteNome],
    ["Status", orc.status],
    ["Data", orc.createdAt ? new Date(orc.createdAt).toLocaleDateString("pt-BR") : ""],
    ["Aprovado por", orc.aprovadoPor || "-"],
    ["Data Aprovação", orc.dataAprovacao ? new Date(orc.dataAprovacao).toLocaleDateString("pt-BR") : "-"],
    [],
    ["VALOR TOTAL", fmt(orc.valorTotal)],
    [],
    ["Observações", orc.observacoes || "-"],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary["!cols"] = [{ wch: 20 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");

  // SCO sheet
  if (orc.itensSco.length > 0) {
    const scoData = [
      ["Código", "Descrição", "Unidade", "Quantidade", "Valor Unitário", "Valor Total"],
      ...orc.itensSco.map(i => [i.codSco, i.descricao, i.unidade, i.quantidade, i.valorUnitario, i.valorTotal]),
      [],
      ["", "", "", "", "Subtotal SCO:", orc.itensSco.reduce((s, i) => s + i.valorTotal, 0)],
    ];
    const wsSco = XLSX.utils.aoa_to_sheet(scoData);
    wsSco["!cols"] = [{ wch: 12 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsSco, "Itens SCO");
  }

  // Materials sheet
  if (orc.itensMateriais.length > 0) {
    const matData = [
      ["Código", "Descrição", "Unidade", "Quantidade", "Valor Unitário", "Valor Total"],
      ...orc.itensMateriais.map(i => [i.codigo, i.descricao, i.unidade, i.quantidade, i.valorUnitario, i.valorTotal]),
      [],
      ["", "", "", "", "Subtotal Materiais:", orc.itensMateriais.reduce((s, i) => s + i.valorTotal, 0)],
    ];
    const wsMat = XLSX.utils.aoa_to_sheet(matData);
    wsMat["!cols"] = [{ wch: 12 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsMat, "Materiais");
  }

  XLSX.writeFile(wb, `Orcamento_${orc.numero}_SS${orc.solicitacaoNumero}.xlsx`);
}
