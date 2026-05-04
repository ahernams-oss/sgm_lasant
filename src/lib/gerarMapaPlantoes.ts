import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Funcionario } from "@/contexts/FuncionariosContext";

export type TipoJornada =
  | "Diarista"
  | "Plantão Diurno - PAR"
  | "Plantão Diurno - ÍMPAR"
  | "Plantão Noturno - PAR"
  | "Plantão Noturno - ÍMPAR";

export const SIGLAS: Record<TipoJornada, string> = {
  "Diarista": "D",
  "Plantão Diurno - PAR": "DP",
  "Plantão Diurno - ÍMPAR": "DI",
  "Plantão Noturno - PAR": "NP",
  "Plantão Noturno - ÍMPAR": "NI",
};

export function trabalhaNoDia(jornada: string, dia: number, dataRef: Date): boolean {
  const j = (jornada || "") as TipoJornada;
  if (j === "Diarista") {
    const d = new Date(dataRef.getFullYear(), dataRef.getMonth(), dia).getDay();
    return d >= 1 && d <= 5; // Seg-Sex
  }
  const par = dia % 2 === 0;
  if (j === "Plantão Diurno - PAR" || j === "Plantão Noturno - PAR") return par;
  if (j === "Plantão Diurno - ÍMPAR" || j === "Plantão Noturno - ÍMPAR") return !par;
  return false;
}

function diasDoMes(ano: number, mes: number) {
  return new Date(ano, mes + 1, 0).getDate();
}

interface Params {
  funcionarios: Funcionario[];
  cargos: { id: string; nome: string }[];
  clientes: { id: string; nome: string }[];
  ano: number;
  mes: number; // 0-11
}

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const SIGLAS_DOW = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function gerarMapaPlantoesPdf({ funcionarios, cargos, clientes, ano, mes }: Params) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Mapa de Plantões - ${MESES[mes]}/${ano}`, pageWidth / 2, 12, { align: "center" });

  const dias = diasDoMes(ano, mes);
  const dataRef = new Date(ano, mes, 1);
  const diasArr = Array.from({ length: dias }, (_, i) => i + 1);
  const dowArr = diasArr.map((d) => new Date(ano, mes, d).getDay());
  const head = [
    ["Funcionário", "Cargo", "Cliente", "Jornada", ...diasArr.map((d) => `${SIGLAS_DOW[dowArr[d - 1]]}\n${d}`)],
  ];

  const body = funcionarios.map((f) => {
    const cargo = cargos.find((c) => c.id === f.cargoId)?.nome || "—";
    const cliente = clientes.find((c) => c.id === f.clienteId)?.nome || "—";
    const sigla = SIGLAS[(f.jornadaTrabalho as TipoJornada)] || "";
    const linhaDias = Array.from({ length: dias }, (_, i) =>
      trabalhaNoDia(f.jornadaTrabalho, i + 1, dataRef) ? sigla : ""
    );
    return [f.nome, cargo, cliente, f.jornadaTrabalho || "—", ...linhaDias];
  });

  autoTable(doc, {
    startY: 18,
    head,
    body,
    styles: { fontSize: 6, cellPadding: 1, halign: "center" },
    headStyles: { fillColor: [103, 58, 183], textColor: 255, fontSize: 6 },
    columnStyles: {
      0: { halign: "left", cellWidth: 35 },
      1: { halign: "left", cellWidth: 25 },
      2: { halign: "left", cellWidth: 25 },
      3: { halign: "left", cellWidth: 28 },
    },
  });

  doc.setFontSize(8);
  const finalY = (doc as any).lastAutoTable.finalY + 6;
  doc.text("Legenda: D=Diarista | DP=Plantão Diurno PAR | DI=Plantão Diurno ÍMPAR | NP=Plantão Noturno PAR | NI=Plantão Noturno ÍMPAR", 10, finalY);

  doc.save(`mapa-plantoes-${ano}-${String(mes + 1).padStart(2, "0")}.pdf`);
}

export function gerarMapaPlantoesExcel({ funcionarios, cargos, clientes, ano, mes }: Params) {
  const dias = diasDoMes(ano, mes);
  const dataRef = new Date(ano, mes, 1);
  const header = ["Funcionário", "Cargo", "Cliente", "Jornada", ...Array.from({ length: dias }, (_, i) => String(i + 1))];

  const rows = funcionarios.map((f) => {
    const cargo = cargos.find((c) => c.id === f.cargoId)?.nome || "";
    const cliente = clientes.find((c) => c.id === f.clienteId)?.nome || "";
    const sigla = SIGLAS[(f.jornadaTrabalho as TipoJornada)] || "";
    const linhaDias = Array.from({ length: dias }, (_, i) =>
      trabalhaNoDia(f.jornadaTrabalho, i + 1, dataRef) ? sigla : ""
    );
    return [f.nome, cargo, cliente, f.jornadaTrabalho || "", ...linhaDias];
  });

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws["!cols"] = [{ wch: 28 }, { wch: 20 }, { wch: 20 }, { wch: 22 }, ...Array.from({ length: dias }, () => ({ wch: 4 }))];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${MESES[mes]} ${ano}`);
  XLSX.writeFile(wb, `mapa-plantoes-${ano}-${String(mes + 1).padStart(2, "0")}.xlsx`);
}
