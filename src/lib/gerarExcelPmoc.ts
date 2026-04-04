import * as XLSX from "xlsx";
import type { PmocPlano, PmocAtividade, PmocOrdemServico, PmocInconformidade } from "@/contexts/PmocContext";

interface PmocExcelData {
  planos: PmocPlano[];
  atividades: PmocAtividade[];
  ordensServico: PmocOrdemServico[];
  inconformidades: PmocInconformidade[];
  filtroCliente?: string;
  tipo: "geral" | "cliente" | "conformidade";
}

function autoWidth(ws: XLSX.WorkSheet) {
  const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][];
  const cols: { wch: number }[] = [];
  data.forEach(row => {
    row.forEach((cell, i) => {
      const len = cell ? String(cell).length : 10;
      if (!cols[i] || cols[i].wch < len) cols[i] = { wch: Math.min(len + 2, 40) };
    });
  });
  ws["!cols"] = cols;
}

export function gerarExcelPmocGeral(data: PmocExcelData) {
  const wb = XLSX.utils.book_new();

  // Planos
  const planosRows = data.planos.map(p => ({
    "Título": p.titulo, "Cliente": p.clienteNome, "Unidade": p.unidade,
    "Contrato": p.contrato, "Vigência Início": p.vigenciaInicio,
    "Vigência Fim": p.vigenciaFim, "Revisão": p.revisao,
    "Status": p.status, "Resp. Técnico": p.responsavelTecnicoNome,
  }));
  const wsPlanos = XLSX.utils.json_to_sheet(planosRows);
  autoWidth(wsPlanos);
  XLSX.utils.book_append_sheet(wb, wsPlanos, "Planos");

  // Atividades
  const atividadesRows = data.atividades.map(a => ({
    "Descrição": a.descricao, "Equipamento": a.equipamentoNome, "Tipo": a.tipo,
    "Periodicidade": a.periodicidade, "Prioridade": a.prioridade,
    "Última Execução": a.ultimaExecucao, "Próxima Execução": a.proximaExecucao,
  }));
  const wsAtiv = XLSX.utils.json_to_sheet(atividadesRows);
  autoWidth(wsAtiv);
  XLSX.utils.book_append_sheet(wb, wsAtiv, "Atividades");

  // Ordens de Serviço
  const osRows = data.ordensServico.map(o => ({
    "Nº": o.numero, "Equipamento": o.equipamentoNome, "Descrição": o.descricao,
    "Tipo": o.tipo, "Prioridade": o.prioridade, "Status": o.status,
    "Abertura": o.dataAbertura, "Prazo": o.dataPrazo, "Conclusão": o.dataConclusao,
    "Técnico": o.tecnicoResponsavel,
  }));
  const wsOS = XLSX.utils.json_to_sheet(osRows);
  autoWidth(wsOS);
  XLSX.utils.book_append_sheet(wb, wsOS, "Ordens de Serviço");

  // Inconformidades
  if (data.inconformidades.length > 0) {
    const incRows = data.inconformidades.map(i => ({
      "Nº": i.numero, "Equipamento": i.equipamentoNome, "Descrição": i.descricao,
      "Gravidade": i.gravidade, "Responsável": i.responsavel,
      "Status": i.status, "Prazo": i.prazo, "Causa Provável": i.causaProvavel,
    }));
    const wsInc = XLSX.utils.json_to_sheet(incRows);
    autoWidth(wsInc);
    XLSX.utils.book_append_sheet(wb, wsInc, "Inconformidades");
  }

  // Resumo
  const exec = data.atividades.filter(a => a.ultimaExecucao).length;
  const pct = data.atividades.length > 0 ? Math.round((exec / data.atividades.length) * 100) : 0;
  const resumoRows = [
    { "Indicador": "Total de Planos", "Valor": data.planos.length },
    { "Indicador": "Planos Ativos", "Valor": data.planos.filter(p => p.status === "Ativo").length },
    { "Indicador": "Total de Atividades", "Valor": data.atividades.length },
    { "Indicador": "Atividades Executadas", "Valor": exec },
    { "Indicador": "% Execução", "Valor": `${pct}%` },
    { "Indicador": "Ordens de Serviço", "Valor": data.ordensServico.length },
    { "Indicador": "Inconformidades", "Valor": data.inconformidades.length },
  ];
  const wsResumo = XLSX.utils.json_to_sheet(resumoRows);
  autoWidth(wsResumo);
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

  return wb;
}

export function gerarExcelPmocCliente(data: PmocExcelData) {
  const planosFilt = data.filtroCliente
    ? data.planos.filter(p => p.clienteNome === data.filtroCliente) : data.planos;
  const ids = new Set(planosFilt.map(p => p.id));
  return gerarExcelPmocGeral({
    ...data,
    planos: planosFilt,
    atividades: data.atividades.filter(a => ids.has(a.planoId)),
    ordensServico: data.ordensServico.filter(o => ids.has(o.planoId)),
    inconformidades: data.inconformidades.filter(i => ids.has(i.planoId)),
  });
}

export function gerarExcelPmocConformidade(data: PmocExcelData) {
  const wb = XLSX.utils.book_new();

  const confRows = data.planos.map(p => {
    const ativs = data.atividades.filter(a => a.planoId === p.id);
    const ex = ativs.filter(a => a.ultimaExecucao).length;
    return {
      "Plano": p.titulo, "Cliente": p.clienteNome,
      "Atividades": ativs.length, "Executadas": ex,
      "% Conformidade": ativs.length > 0 ? `${Math.round((ex / ativs.length) * 100)}%` : "0%",
    };
  });
  const wsConf = XLSX.utils.json_to_sheet(confRows);
  autoWidth(wsConf);
  XLSX.utils.book_append_sheet(wb, wsConf, "Conformidade");

  if (data.inconformidades.length > 0) {
    const incRows = data.inconformidades.map(i => ({
      "Nº": i.numero, "Equipamento": i.equipamentoNome, "Descrição": i.descricao,
      "Gravidade": i.gravidade, "Responsável": i.responsavel,
      "Status": i.status, "Prazo": i.prazo,
    }));
    const wsInc = XLSX.utils.json_to_sheet(incRows);
    autoWidth(wsInc);
    XLSX.utils.book_append_sheet(wb, wsInc, "Inconformidades");
  }

  return wb;
}

export function downloadExcelPmoc(data: PmocExcelData) {
  let wb: XLSX.WorkBook;
  let nome: string;
  const ts = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
  if (data.tipo === "cliente") {
    wb = gerarExcelPmocCliente(data);
    nome = `PMOC_Cliente_${(data.filtroCliente || "todos").replace(/\s+/g, "_")}_${ts}.xlsx`;
  } else if (data.tipo === "conformidade") {
    wb = gerarExcelPmocConformidade(data);
    nome = `PMOC_Conformidade_${ts}.xlsx`;
  } else {
    wb = gerarExcelPmocGeral(data);
    nome = `PMOC_Relatorio_Geral_${ts}.xlsx`;
  }
  XLSX.writeFile(wb, nome);
}
