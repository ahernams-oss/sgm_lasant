import { addHeader, addFooter } from "@/lib/gerarRelatorioEstoque";
import type { Cargo } from "@/contexts/CargosContext";

const getJsPDF = async () => (await import("jspdf")).jsPDF;
const getAutoTable = async () => (await import("jspdf-autotable")).default;
const getXLSX = async () => await import("xlsx");

const head = { fillColor: [30, 58, 107] as [number, number, number], textColor: 255, fontStyle: "bold" as const };

export async function gerarPdfCargosEpisNrs(cargos: Cargo[], filtros?: string) {
  const doc = new (await getJsPDF())({ compress: true, orientation: "landscape" });
  const autoTable = await getAutoTable();
  await addHeader(doc, {
    title: "Relatório de Cargos — EPIs e NRs Necessárias",
    subtitle: `Total: ${cargos.length} cargo(s)`,
    filters: filtros,
  });

  autoTable(doc, {
    startY: 44,
    head: [["Cargo", "CBO", "Nível", "EPIs necessários (qtd · CA)", "NRs necessárias"]],
    body: cargos.map((c) => [
      c.nome,
      c.cbo || "—",
      c.nivel || "—",
      (c.episPadrao || []).map((e) => `• ${e.descricao} (${e.quantidade || 1}${e.ca ? ` · CA ${e.ca}` : ""})`).join("\n") || "—",
      (c.nrs || []).map((n) => `• ${n.numero}${n.descricao ? ` – ${n.descricao}` : ""}`).join("\n") || "—",
    ]),
    styles: { fontSize: 8, cellPadding: 2.5, valign: "top" },
    headStyles: head,
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: "bold" },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 16, halign: "center" },
      3: { cellWidth: "auto" },
      4: { cellWidth: 90 },
    },
    margin: { bottom: 16 },
  });

  addFooter(doc);
  doc.save("relatorio-cargos-epis-nrs.pdf");
}

export async function gerarExcelCargosEpisNrs(cargos: Cargo[]) {
  const XLSX = await getXLSX();
  const wb = XLSX.utils.book_new();
  const data = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  const header = [["LASANT — SGM"], ["Relatório de Cargos — EPIs e NRs Necessárias"], [`Emitido em: ${data} · Total: ${cargos.length} cargo(s)`], []];

  const resumo = XLSX.utils.aoa_to_sheet([
    ...header,
    ["Cargo", "CBO", "Nível", "Qtd EPIs", "EPIs necessários", "Qtd NRs", "NRs necessárias"],
    ...cargos.map((c) => [
      c.nome, c.cbo || "", c.nivel || "",
      c.episPadrao?.length || 0,
      (c.episPadrao || []).map((e) => `${e.descricao}${e.ca ? ` (CA ${e.ca})` : ""}`).join("; "),
      c.nrs?.length || 0,
      (c.nrs || []).map((n) => `${n.numero}${n.descricao ? ` - ${n.descricao}` : ""}`).join("; "),
    ]),
  ]);
  resumo["!cols"] = [{ wch: 35 }, { wch: 10 }, { wch: 8 }, { wch: 9 }, { wch: 60 }, { wch: 9 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, resumo, "Cargos");

  const epis = XLSX.utils.aoa_to_sheet([
    ...header,
    ["Cargo", "CBO", "EPI", "CA", "Quantidade"],
    ...cargos.flatMap((c) => (c.episPadrao || []).map((e) => [c.nome, c.cbo || "", e.descricao, e.ca || "", e.quantidade || 1])),
  ]);
  epis["!cols"] = [{ wch: 35 }, { wch: 10 }, { wch: 50 }, { wch: 12 }, { wch: 11 }];
  XLSX.utils.book_append_sheet(wb, epis, "EPIs por Cargo");

  const nrs = XLSX.utils.aoa_to_sheet([
    ...header,
    ["Cargo", "CBO", "NR", "Descrição"],
    ...cargos.flatMap((c) => (c.nrs || []).map((n) => [c.nome, c.cbo || "", n.numero, n.descricao || ""])),
  ]);
  nrs["!cols"] = [{ wch: 35 }, { wch: 10 }, { wch: 14 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, nrs, "NRs por Cargo");

  XLSX.writeFile(wb, "relatorio-cargos-epis-nrs.xlsx", { compression: true });
}
