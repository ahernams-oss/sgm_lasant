import * as XLSX from "xlsx";
import type { Eventograma } from "@/contexts/EventogramasContext";

const fmtDate = (s?: string) => {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return d && m && y ? `${d}/${m}/${y}` : s;
};

export function gerarExcelEventograma(ev: Eventograma) {
  const wb = XLSX.utils.book_new();

  const cabec = [
    ["EVENTOGRAMA"],
    ["Número", ev.numero],
    ["Cliente", ev.cliente_nome],
    ["Obra", ev.obra],
    ["Descrição", ev.descricao],
    ["Responsável", ev.responsavel],
    ["Contrato", ev.contrato_numero],
    ["Assinatura", fmtDate(ev.data_assinatura)],
    ["Valor total", ev.valor_total],
    ["Status", ev.status],
    [],
  ];

  const head = ["#", "Marco", "Descrição", "Prazo", "Data prevista", "% Contrato", "Valor", "Critério de medição", "Status", "Data realizada", "Observação"];
  const rows = (ev.eventos || []).map((e) => [
    e.ordem, e.marco, e.descricao, e.prazo, fmtDate(e.data_prevista),
    Number(e.percentual) || 0, Number(e.valor) || 0,
    e.criterio_medicao, e.status, fmtDate(e.data_realizada), e.observacao,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...cabec, head, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, "Eventograma");
  XLSX.writeFile(wb, `eventograma-${ev.numero}.xlsx`);
}
