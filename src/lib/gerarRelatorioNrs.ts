import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { addHeader, addFooter } from "@/lib/gerarRelatorioEstoque";
import type { NrCatalogo } from "@/contexts/NrsCatalogoContext";

const fmt = (d?: string | null) => (d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—");

export async function gerarPdfNrs(nrs: NrCatalogo[], filtros?: string) {
  const doc = new jsPDF({ orientation: "landscape" });

  await addHeader(doc, {
    title: "Relatório de Normas Regulamentadoras (NRs)",
    subtitle: `Total: ${nrs.length} NRs cadastradas`,
    filters: filtros,
  });

  autoTable(doc, {
    startY: 44,
    head: [["Cod/Nome", "Descrição", "Validade (dias)", "Publicação", "Vigência", "Revisões", "Observação"]],
    body: nrs.map((n) => [
      n.codigo,
      n.descricao || "",
      n.validadeDias != null ? String(n.validadeDias) : "—",
      fmt(n.dataPublicacao),
      fmt(n.dataVigencia),
      String(n.revisoes?.length || 0),
      n.observacao || "",
    ]),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 58, 107], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: "bold" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 26, halign: "center" },
      3: { cellWidth: 26, halign: "center" },
      4: { cellWidth: 26, halign: "center" },
      5: { cellWidth: 20, halign: "center" },
      6: { cellWidth: 60 },
    },
  });

  const comRev = nrs.filter((n) => (n.revisoes?.length || 0) > 0);
  if (comRev.length) {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [["NR", "Revisão", "Publicação", "Vigência", "Observação", "Anexos"]],
      body: comRev.flatMap((n) =>
        (n.revisoes || []).map((r) => [
          n.codigo,
          r.revisao,
          fmt(r.dataPublicacao),
          fmt(r.dataVigencia),
          r.observacao || "",
          String(r.anexos?.length || 0),
        ]),
      ),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 58, 107], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
  }

  addFooter(doc);
  doc.save("relatorio-nrs.pdf");
}

export function gerarExcelNrs(nrs: NrCatalogo[]) {
  const wb = XLSX.utils.book_new();

  const ws = XLSX.utils.json_to_sheet(
    nrs.map((n) => ({
      "Cod/Nome": n.codigo,
      "Descrição": n.descricao || "",
      "Validade (dias)": n.validadeDias ?? "",
      "Data de Publicação": fmt(n.dataPublicacao),
      "Data de Vigência": fmt(n.dataVigencia),
      "Revisões": n.revisoes?.length || 0,
      "Observação": n.observacao || "",
      "Anexo": n.anexoNome || "",
    })),
  );
  ws["!cols"] = [{ wch: 14 }, { wch: 45 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 40 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, ws, "NRs");

  const revRows = nrs.flatMap((n) =>
    (n.revisoes || []).map((r) => ({
      "Cod/Nome NR": n.codigo,
      "Revisão": r.revisao,
      "Publicação": fmt(r.dataPublicacao),
      "Vigência": fmt(r.dataVigencia),
      "Observação": r.observacao || "",
      "Anexos": (r.anexos || []).map((a) => a.nome).join(", "),
    })),
  );
  if (revRows.length) {
    const wsRev = XLSX.utils.json_to_sheet(revRows);
    wsRev["!cols"] = [{ wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 40 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsRev, "Revisões");
  }

  XLSX.writeFile(wb, "relatorio-nrs.xlsx");
}
