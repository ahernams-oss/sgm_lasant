import * as XLSX from "xlsx";
import { Lancamento, TipoFalta, TipoAdvertencia } from "@/contexts/LancamentosContext";
import { Funcionario } from "@/contexts/FuncionariosContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TIPO_FALTA_LABELS: Record<TipoFalta, string> = {
  justificada: "Justificada",
  injustificada: "Injustificada",
  atestado: "Atestado Médico",
  suspensao: "Suspensão",
};

const TIPO_ADVERTENCIA_LABELS: Record<TipoAdvertencia, string> = {
  verbal: "Verbal",
  escrita: "Escrita",
};

interface ExcelMapaParams {
  lancamentos: Lancamento[];
  funcionarios: Funcionario[];
  cargos: { id: string; nome: string }[];
  clientes: { id: string; nome: string }[];
  filterMes: string;
}

const formatData = (d: string) => {
  try { return format(new Date(d + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR }); }
  catch { return d; }
};

export function exportarExcelMapa(params: ExcelMapaParams) {
  const { lancamentos, funcionarios, cargos, clientes, filterMes } = params;

  const getFuncNome = (id: string) => funcionarios.find((f) => f.id === id)?.nome ?? "—";
  const getCargoNome = (funcId: string) => {
    const func = funcionarios.find((f) => f.id === funcId);
    return func ? (cargos.find((c) => c.id === func.cargoId)?.nome ?? "—") : "—";
  };
  const getClienteNome = (funcId: string) => {
    const func = funcionarios.find((f) => f.id === funcId);
    return func?.clienteId ? (clientes.find((c) => c.id === func.clienteId)?.nome ?? "—") : "—";
  };

  const wb = XLSX.utils.book_new();

  // Faltas sheet
  const faltas = lancamentos.filter((l) => l.tipo === "falta").sort((a, b) => a.data.localeCompare(b.data));
  const faltasData = faltas.map((l) => ({
    "Data": formatData(l.data),
    "Funcionário": getFuncNome(l.funcionarioId),
    "Cargo": getCargoNome(l.funcionarioId),
    "Cliente": getClienteNome(l.funcionarioId),
    "Tipo": TIPO_FALTA_LABELS[l.tipoFalta || "injustificada"],
    "Dias": l.diasFalta || 1,
    "Observação": l.observacao || "",
  }));
  const wsFaltas = XLSX.utils.json_to_sheet(faltasData.length > 0 ? faltasData : [{ "Data": "", "Funcionário": "", "Cargo": "", "Cliente": "", "Tipo": "", "Dias": "", "Observação": "" }]);
  wsFaltas["!cols"] = [{ wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 8 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsFaltas, "Faltas");

  // Horas extras sheet
  const horas = lancamentos.filter((l) => l.tipo === "hora_extra").sort((a, b) => a.data.localeCompare(b.data));
  const horasData = horas.map((l) => ({
    "Data": formatData(l.data),
    "Funcionário": getFuncNome(l.funcionarioId),
    "Cargo": getCargoNome(l.funcionarioId),
    "Cliente": getClienteNome(l.funcionarioId),
    "Horas": l.horasExtras || 0,
    "Percentual (%)": l.percentual || 50,
    "Observação": l.observacao || "",
  }));
  const wsHoras = XLSX.utils.json_to_sheet(horasData.length > 0 ? horasData : [{ "Data": "", "Funcionário": "", "Cargo": "", "Cliente": "", "Horas": "", "Percentual (%)": "", "Observação": "" }]);
  wsHoras["!cols"] = [{ wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 14 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsHoras, "Horas Extras");

  const mesLabel = filterMes.replace("-", "_");
  XLSX.writeFile(wb, `Mapa_Funcionarios_${mesLabel}.xlsx`);
}
