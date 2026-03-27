import * as XLSX from "xlsx";
import { MedicaoServico } from "@/contexts/MedicoesContext";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function downloadExcelHistoricoMedicao(med: MedicaoServico) {
  const wb = XLSX.utils.book_new();

  // Resumo
  const resumo: any[][] = [
    [`Medição #${med.numero} — ${med.descricao || ""}`],
    [`Gerado em: ${new Date().toLocaleString("pt-BR")}`],
    [],
    ["Campo", "Valor"],
    ["Cliente / Obra", med.cliente_nome || ""],
    ["Fornecedor", (med as any).fornecedor_nome || ""],
    ["Contrato", med.contrato || ""],
    ["Status", med.status],
    ["Valor Contratado", med.valor_total_contratado || 0],
    ["Valor Medido", med.valor_total_medido || 0],
    ["% Executado", (med.percentual_medido || 0) / 100],
    ["Data Pagamento", (med as any).data_pagamento || ""],
    ["Observações", med.observacoes || ""],
  ];
  const wsResumo = XLSX.utils.aoa_to_sheet(resumo);
  wsResumo["!cols"] = [{ wch: 20 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

  // Itens
  const itensData: any[][] = [
    ["Item", "Unidade", "Qtd Contratada", "Valor Unitário", "Valor Total"],
    ...(med.itens || []).map((item) => [
      item.descricao,
      item.unidade,
      item.quantidade_contratada,
      item.valor_unitario,
      item.valor_total_contratado,
    ]),
  ];
  const wsItens = XLSX.utils.aoa_to_sheet(itensData);
  wsItens["!cols"] = [{ wch: 35 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsItens, "Itens");

  // Histórico
  const histData: any[][] = [
    ["#", "Data", "Tipo", "Valor", "%", "Status", "Observação"],
    ...(med.medicoes || []).map((l) => [
      l.numero,
      l.data,
      l.tipo === "percentual" ? "Percentual" : "Valor",
      l.valor_total,
      (l.percentual_total || 0) / 100,
      l.status,
      l.observacao || "",
    ]),
  ];
  const wsHist = XLSX.utils.aoa_to_sheet(histData);
  wsHist["!cols"] = [{ wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 12 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsHist, "Histórico");

  XLSX.writeFile(wb, `Medicao_${med.numero}_Historico.xlsx`);
}
