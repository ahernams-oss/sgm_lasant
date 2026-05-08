import { useMemo, useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import {
  ClipboardList, Wrench, Filter, X, CalendarIcon, TrendingUp, Trophy, Users,
  CheckCircle2, Clock, AlertTriangle, Sparkles, Building2, BarChart3, Activity,
  FileDown, FileSpreadsheet, DollarSign, Calculator, UserCheck,
} from "lucide-react";
import { useSolicitacoesServicos } from "@/contexts/SolicitacoesServicosContext";
import { useOrdensServico } from "@/contexts/OrdensServicoContext";
import { useOrcamentos } from "@/contexts/OrcamentosContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { downloadPdfDashboardSSOS, downloadExcelDashboardSSOS } from "@/lib/gerarRelatorioDashboardSSOS";

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const KPI_VARIANTS = [
  { ring: "from-blue-500 to-indigo-600", bg: "bg-blue-50", icon: "text-blue-600" },
  { ring: "from-emerald-500 to-teal-600", bg: "bg-emerald-50", icon: "text-emerald-600" },
  { ring: "from-amber-500 to-orange-600", bg: "bg-amber-50", icon: "text-amber-600" },
  { ring: "from-rose-500 to-red-600", bg: "bg-rose-50", icon: "text-rose-600" },
  { ring: "from-purple-500 to-fuchsia-600", bg: "bg-purple-50", icon: "text-purple-600" },
  { ring: "from-cyan-500 to-sky-600", bg: "bg-cyan-50", icon: "text-cyan-600" },
];

const KpiCard = ({ icon: Icon, label, value, subtitle, gradientIdx = 0 }: {
  icon: any; label: string; value: number | string; subtitle?: string; gradientIdx?: number;
}) => {
  const v = KPI_VARIANTS[gradientIdx % KPI_VARIANTS.length];
  return (
    <Card className="group relative overflow-hidden border border-border/60 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", v.ring)} />
      <CardContent className="pt-5 pb-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-xl font-bold text-foreground mt-1.5 truncate">{value}</p>
            {subtitle && <p className="text-[10px] text-muted-foreground/80 mt-0.5">{subtitle}</p>}
          </div>
          <div className={cn("rounded-xl p-2.5 shrink-0 transition-transform group-hover:scale-110", v.bg)}>
            <Icon className={cn("h-4 w-4", v.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function parseDate(s?: string): Date | null {
  if (!s) return null;
  const d = parseISO(s);
  return isValid(d) ? d : null;
}

export default function DashboardSSOS() {
  const { solicitacoes } = useSolicitacoesServicos();
  const { ordens } = useOrdensServico();
  const { orcamentos } = useOrcamentos();
  const { clientes } = useClientes();
  const { empresa } = useEmpresa();

  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [clienteFilter, setClienteFilter] = useState("todos");
  const [statusSSFilter, setStatusSSFilter] = useState("todos");
  const [statusOSFilter, setStatusOSFilter] = useState("todos");
  const [orcPeriodo, setOrcPeriodo] = useState<"dia" | "semana" | "quinzena" | "mes" | "todos">("mes");

  const clearFilters = () => {
    setDateFrom(undefined); setDateTo(undefined);
    setClienteFilter("todos"); setStatusSSFilter("todos"); setStatusOSFilter("todos");
  };

  const hasFilters = dateFrom || dateTo || clienteFilter !== "todos" || statusSSFilter !== "todos" || statusOSFilter !== "todos";

  const inRange = (d: Date | null): boolean => {
    if (!d) return !dateFrom && !dateTo;
    if (dateFrom && d < dateFrom) return false;
    if (dateTo) {
      const end = new Date(dateTo); end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  };

  // === Filtered SS ===
  const ssFiltradas = useMemo(() => {
    return solicitacoes.filter((s) => {
      const d = parseDate(s.dataHoraSolicitacao || s.createdAt);
      if (!inRange(d)) return false;
      if (clienteFilter !== "todos" && s.clienteId !== clienteFilter) return false;
      if (statusSSFilter !== "todos" && s.situacao !== statusSSFilter) return false;
      return true;
    });
  }, [solicitacoes, dateFrom, dateTo, clienteFilter, statusSSFilter]);

  // === Filtered OS ===
  const osFiltradas = useMemo(() => {
    return ordens.filter((o) => {
      const d = parseDate(o.createdAt);
      if (!inRange(d)) return false;
      if (clienteFilter !== "todos" && o.clienteId !== clienteFilter) return false;
      if (statusOSFilter !== "todos" && o.situacao !== statusOSFilter) return false;
      return true;
    });
  }, [ordens, dateFrom, dateTo, clienteFilter, statusOSFilter]);

  // === KPIs SS ===
  const ssTotal = ssFiltradas.length;
  const SS_STATUS_LIST: { label: string; key: string; icon: any; idx: number }[] = [
    { label: "Aguardando", key: "Aguardando aprovação", icon: Clock, idx: 2 },
    { label: "Aprovadas", key: "Aprovada", icon: CheckCircle2, idx: 1 },
    { label: "Reprovadas", key: "Reprovada", icon: X, idx: 3 },
    { label: "Orç. Solicitado", key: "Orçamento Solicitado", icon: Calculator, idx: 5 },
    { label: "Orç. Disponível", key: "Orçamento Disponível", icon: DollarSign, idx: 5 },
    { label: "Em Execução", key: "Em execução", icon: Activity, idx: 0 },
    { label: "Concluídas", key: "Concluída", icon: CheckCircle2, idx: 4 },
    { label: "Canceladas", key: "Cancelada", icon: X, idx: 3 },
  ];
  const ssCountByStatus = (key: string) => ssFiltradas.filter(s => s.situacao === key).length;
  const ssAguardando = ssCountByStatus("Aguardando aprovação");
  const ssAprovadas = ssCountByStatus("Aprovada");
  const ssConcluidas = ssCountByStatus("Concluída");
  const ssCanceladas = ssCountByStatus("Cancelada");

  // === KPIs OS ===
  const osTotal = osFiltradas.length;
  const osAbertas = osFiltradas.filter(o => o.situacao === "Aberta").length;
  const osExecutadas = osFiltradas.filter(o => o.situacao === "Executada" || o.situacao === "Serviço Confirmado").length;
  const osValidadas = osFiltradas.filter(o => o.situacao === "Validada").length;
  const osEmergenciais = osFiltradas.filter(o => (o.prioridade || "").toUpperCase().includes("IMEDIATA")).length;

  // === Charts ===
  const ssStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    ssFiltradas.forEach(s => { counts[s.situacao] = (counts[s.situacao] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [ssFiltradas]);

  const osStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    osFiltradas.forEach(o => { counts[o.situacao] = (counts[o.situacao] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [osFiltradas]);

  const timelineData = useMemo(() => {
    const months: Record<string, { mes: string; ss: number; os: number }> = {};
    ssFiltradas.forEach(s => {
      const d = parseDate(s.dataHoraSolicitacao || s.createdAt);
      if (!d) return;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!months[k]) months[k] = { mes: k, ss: 0, os: 0 };
      months[k].ss += 1;
    });
    osFiltradas.forEach(o => {
      const d = parseDate(o.createdAt);
      if (!d) return;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!months[k]) months[k] = { mes: k, ss: 0, os: 0 };
      months[k].os += 1;
    });
    return Object.values(months).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [ssFiltradas, osFiltradas]);

  // === Ranking de Clientes (SS + OS) ===
  const rankingClientes = useMemo(() => {
    const counts: Record<string, { cliente: string; ss: number; os: number; total: number }> = {};
    ssFiltradas.forEach(s => {
      const k = s.clienteNome || "Sem cliente";
      if (!counts[k]) counts[k] = { cliente: k, ss: 0, os: 0, total: 0 };
      counts[k].ss += 1; counts[k].total += 1;
    });
    osFiltradas.forEach(o => {
      const k = o.clienteNome || "Sem cliente";
      if (!counts[k]) counts[k] = { cliente: k, ss: 0, os: 0, total: 0 };
      counts[k].os += 1; counts[k].total += 1;
    });
    return Object.values(counts).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [ssFiltradas, osFiltradas]);

  // === Ranking de Funcionários (por OS) ===
  // Pontuação por Complexidade da OS: Baixa = 1pt | Média = 3pts | Alta = 5pts
  const pontosOS = (complexidade?: string): { pontos: number; nivel: "Baixa" | "Média" | "Alta" } => {
    const c = (complexidade || "").toLowerCase();
    if (c.startsWith("a")) return { pontos: 5, nivel: "Alta" };
    if (c.startsWith("m") || c.startsWith("mé") || c.startsWith("me")) return { pontos: 3, nivel: "Média" };
    return { pontos: 1, nivel: "Baixa" };
  };

  const rankingFuncionarios = useMemo(() => {
    const map: Record<string, {
      nome: string; cargo: string; total: number; concluidas: number; abertas: number;
      pontos: number; baixa: number; media: number; alta: number;
    }> = {};
    osFiltradas.forEach(o => {
      const profs = o.profissionais || [];
      const { pontos, nivel } = pontosOS((o as any).complexidade);
      profs.forEach((p: any) => {
        const id = p.funcionarioId || p.id || p.nome;
        if (!id) return;
        if (!map[id]) map[id] = { nome: p.nome || "Sem nome", cargo: p.cargo || "-", total: 0, concluidas: 0, abertas: 0, pontos: 0, baixa: 0, media: 0, alta: 0 };
        map[id].total += 1;
        map[id].pontos += pontos;
        if (nivel === "Baixa") map[id].baixa += 1;
        else if (nivel === "Média") map[id].media += 1;
        else map[id].alta += 1;
        if (o.situacao === "Validada" || o.situacao === "Executada" || o.situacao === "Serviço Confirmado") {
          map[id].concluidas += 1;
        } else {
          map[id].abertas += 1;
        }
      });
    });
    return Object.values(map).sort((a, b) => b.pontos - a.pontos || b.concluidas - a.concluidas).slice(0, 10);
  }, [osFiltradas]);

  // === Tipo de OS distribution ===
  const tipoOSData = useMemo(() => {
    const counts: Record<string, number> = {};
    osFiltradas.forEach(o => {
      const t = o.tipoOs?.descricao || "Outros";
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [osFiltradas]);

  // === Orçamentos ===
  const orcStartDate = useMemo(() => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (orcPeriodo === "dia") return d;
    if (orcPeriodo === "semana") { const r = new Date(d); r.setDate(d.getDate() - 7); return r; }
    if (orcPeriodo === "quinzena") { const r = new Date(d); r.setDate(d.getDate() - 15); return r; }
    if (orcPeriodo === "mes") { const r = new Date(d); r.setDate(d.getDate() - 30); return r; }
    return null;
  }, [orcPeriodo]);

  const orcamentosFiltrados = useMemo(() => {
    return orcamentos.filter(o => {
      const d = parseDate(o.dataCriacao || o.createdAt);
      if (!inRange(d)) return false;
      if (orcStartDate && d && d < orcStartDate) return false;
      if (clienteFilter !== "todos" && o.clienteId !== clienteFilter) return false;
      return true;
    });
  }, [orcamentos, dateFrom, dateTo, clienteFilter, orcStartDate]);

  const orcTotalQtd = orcamentosFiltrados.length;
  const orcValorTotal = orcamentosFiltrados.reduce((s, o) => s + (Number(o.valorTotal) || 0), 0);
  const orcTicketMedio = orcTotalQtd > 0 ? orcValorTotal / orcTotalQtd : 0;
  const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const rankingOrcUsuarios = useMemo(() => {
    const map: Record<string, { usuario: string; qtd: number; valor: number }> = {};
    orcamentosFiltrados.forEach(o => {
      const u = o.criadoPor || "Não informado";
      if (!map[u]) map[u] = { usuario: u, qtd: 0, valor: 0 };
      map[u].qtd += 1;
      map[u].valor += Number(o.valorTotal) || 0;
    });
    return Object.values(map);
  }, [orcamentosFiltrados]);

  const rankingOrcUsuariosQtd = useMemo(() =>
    [...rankingOrcUsuarios].sort((a, b) => b.qtd - a.qtd || b.valor - a.valor).slice(0, 10), [rankingOrcUsuarios]);
  const rankingOrcUsuariosValor = useMemo(() =>
    [...rankingOrcUsuarios].sort((a, b) => b.valor - a.valor || b.qtd - a.qtd).slice(0, 10), [rankingOrcUsuarios]);

  const rankingOrcClientes = useMemo(() => {
    const map: Record<string, { cliente: string; qtd: number; valor: number }> = {};
    orcamentosFiltrados.forEach(o => {
      const c = o.clienteNome || "Sem cliente";
      if (!map[c]) map[c] = { cliente: c, qtd: 0, valor: 0 };
      map[c].qtd += 1;
      map[c].valor += Number(o.valorTotal) || 0;
    });
    return Object.values(map).sort((a, b) => b.valor - a.valor || b.qtd - a.qtd).slice(0, 10);
  }, [orcamentosFiltrados]);

  // === Clientes para filtro ===
  const clientesAtivos = useMemo(() => {
    const ids = new Set<string>();
    solicitacoes.forEach(s => s.clienteId && ids.add(s.clienteId));
    ordens.forEach(o => o.clienteId && ids.add(o.clienteId));
    return clientes.filter(c => ids.has(c.id)).sort((a, b) => (a.nomeFantasia || a.nome).localeCompare(b.nomeFantasia || b.nome));
  }, [solicitacoes, ordens, clientes]);

  const ssStatusOptions = useMemo(() => Array.from(new Set(solicitacoes.map(s => s.situacao).filter(Boolean))), [solicitacoes]);
  const osStatusOptions = useMemo(() => Array.from(new Set(ordens.map(o => o.situacao).filter(Boolean))), [ordens]);

  const taxaConversao = ssTotal > 0 ? ((osTotal / ssTotal) * 100) : 0;
  const taxaConclusao = osTotal > 0 ? ((osValidadas / osTotal) * 100) : 0;

  const buildReportData = () => {
    const periodo = dateFrom || dateTo
      ? `Período: ${dateFrom ? format(dateFrom, "dd/MM/yyyy") : "—"} a ${dateTo ? format(dateTo, "dd/MM/yyyy") : "—"}`
      : "Período: Todos";
    const filtros: string[] = [];
    if (clienteFilter !== "todos") {
      const c = clientes.find(c => c.id === clienteFilter);
      filtros.push(`Cliente: ${c?.nomeFantasia || c?.nome || clienteFilter}`);
    }
    if (statusSSFilter !== "todos") filtros.push(`Situação SS: ${statusSSFilter}`);
    if (statusOSFilter !== "todos") filtros.push(`Situação OS: ${statusOSFilter}`);
    return {
      empresa,
      periodoLabel: periodo,
      filtroLabel: filtros.length ? `Filtros: ${filtros.join(" · ")}` : "Filtros: nenhum",
      kpisSS: { total: ssTotal, aguardando: ssAguardando, aprovadas: ssAprovadas, concluidas: ssConcluidas, canceladas: ssCanceladas },
      kpisOS: { total: osTotal, abertas: osAbertas, executadas: osExecutadas, validadas: osValidadas, emergenciais: osEmergenciais, conversao: `${taxaConversao.toFixed(1)}%`, conclusao: `${taxaConclusao.toFixed(1)}%` },
      ssStatus: ssStatusData,
      osStatus: osStatusData,
      tipoOS: tipoOSData,
      rankingClientes,
      rankingFuncionarios: rankingFuncionarios as any,
    };
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary via-primary/90 to-indigo-700 p-6 md:p-8 text-primary-foreground shadow-lg">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Engenharia e Manutenção · Operacional</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Dashboard de Solicitações e Ordens de Serviço
            </h1>
            <p className="text-sm md:text-base text-primary-foreground/85 mt-1.5 max-w-2xl">
              Acompanhamento operacional de SS, OS e produtividade da equipe técnica.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadPdfDashboardSSOS(buildReportData())}
              className="bg-white/15 hover:bg-white/25 text-white border-white/20 backdrop-blur-sm"
            >
              <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadExcelDashboardSSOS(buildReportData())}
              className="bg-white/15 hover:bg-white/25 text-white border-white/20 backdrop-blur-sm"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filtros
            </CardTitle>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                <X className="mr-1 h-3 w-3" /> Limpar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Data (De)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-sm", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} /></PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Data (Até)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-sm", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateTo} onSelect={setDateTo} /></PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Cliente</Label>
              <Select value={clienteFilter} onValueChange={setClienteFilter}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {clientesAtivos.map(c => (<SelectItem key={c.id} value={c.id}>{c.nomeFantasia || c.nome}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Situação SS</Label>
              <Select value={statusSSFilter} onValueChange={setStatusSSFilter}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {ssStatusOptions.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Situação OS</Label>
              <Select value={statusOSFilter} onValueChange={setStatusOSFilter}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {osStatusOptions.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs SS */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" /> Solicitações de Serviço (SS)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard icon={ClipboardList} label="Total SS" value={ssTotal} gradientIdx={0} />
          <KpiCard icon={Clock} label="Aguardando" value={ssAguardando} gradientIdx={2} />
          <KpiCard icon={CheckCircle2} label="Aprovadas" value={ssAprovadas} gradientIdx={1} />
          <KpiCard icon={CheckCircle2} label="Concluídas" value={ssConcluidas} gradientIdx={4} />
          <KpiCard icon={X} label="Canceladas" value={ssCanceladas} gradientIdx={3} />
        </div>
      </div>

      {/* KPIs OS */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" /> Ordens de Serviço (OS)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard icon={Wrench} label="Total OS" value={osTotal} gradientIdx={0} />
          <KpiCard icon={Clock} label="Abertas" value={osAbertas} gradientIdx={2} />
          <KpiCard icon={Activity} label="Executadas" value={osExecutadas} gradientIdx={5} />
          <KpiCard icon={CheckCircle2} label="Validadas" value={osValidadas} gradientIdx={1} />
          <KpiCard icon={AlertTriangle} label="Emergenciais" value={osEmergenciais} gradientIdx={3} />
          <KpiCard icon={TrendingUp} label="Conv. SS→OS" value={`${taxaConversao.toFixed(0)}%`} subtitle={`Conclusão: ${taxaConclusao.toFixed(0)}%`} gradientIdx={4} />
        </div>
      </div>

      {/* Orçamentos — KPIs e Rankings */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" /> Orçamentos
          </h2>
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium text-muted-foreground">Período:</Label>
            <Select value={orcPeriodo} onValueChange={(v: any) => setOrcPeriodo(v)}>
              <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dia">Hoje</SelectItem>
                <SelectItem value="semana">Últimos 7 dias</SelectItem>
                <SelectItem value="quinzena">Últimos 15 dias</SelectItem>
                <SelectItem value="mes">Últimos 30 dias</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <KpiCard icon={Calculator} label="Orçamentos" value={orcTotalQtd} gradientIdx={0} />
          <KpiCard icon={DollarSign} label="Valor Total Orçado" value={fmtBRL(orcValorTotal)} gradientIdx={1} />
          <KpiCard icon={TrendingUp} label="Ticket Médio" value={fmtBRL(orcTicketMedio)} gradientIdx={4} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Ranking por Quantidade */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" /> Top Orçamentistas — Quantidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rankingOrcUsuariosQtd.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Sem orçamentos no período.</p>
              ) : (
                <div className="space-y-2">
                  {rankingOrcUsuariosQtd.map((u, idx) => {
                    const max = rankingOrcUsuariosQtd[0]?.qtd || 1;
                    const pct = (u.qtd / max) * 100;
                    return (
                      <div key={u.usuario} className="space-y-1">
                        <div className="flex items-center justify-between text-xs gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className={cn("shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                              idx === 0 && "bg-amber-100 text-amber-700",
                              idx === 1 && "bg-slate-200 text-slate-700",
                              idx === 2 && "bg-orange-100 text-orange-700",
                              idx > 2 && "bg-muted text-muted-foreground")}>{idx + 1}</span>
                            <span className="font-medium truncate">{u.usuario}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-[10px] h-5">{fmtBRL(u.valor)}</Badge>
                            <span className="font-bold text-foreground w-8 text-right">{u.qtd}</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ranking por Valor */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" /> Top Orçamentistas — Valor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rankingOrcUsuariosValor.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Sem orçamentos no período.</p>
              ) : (
                <div className="space-y-2">
                  {rankingOrcUsuariosValor.map((u, idx) => {
                    const max = rankingOrcUsuariosValor[0]?.valor || 1;
                    const pct = (u.valor / max) * 100;
                    return (
                      <div key={u.usuario} className="space-y-1">
                        <div className="flex items-center justify-between text-xs gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className={cn("shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                              idx === 0 && "bg-amber-100 text-amber-700",
                              idx === 1 && "bg-slate-200 text-slate-700",
                              idx === 2 && "bg-orange-100 text-orange-700",
                              idx > 2 && "bg-muted text-muted-foreground")}>{idx + 1}</span>
                            <span className="font-medium truncate">{u.usuario}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-[10px] h-5">{u.qtd} orç.</Badge>
                            <span className="font-bold text-foreground tabular-nums">{fmtBRL(u.valor)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ranking por Cliente */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Orçamentos por Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rankingOrcClientes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Sem orçamentos no período.</p>
              ) : (
                <div className="space-y-2">
                  {rankingOrcClientes.map((c, idx) => {
                    const max = rankingOrcClientes[0]?.valor || 1;
                    const pct = (c.valor / max) * 100;
                    return (
                      <div key={c.cliente} className="space-y-1">
                        <div className="flex items-center justify-between text-xs gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className={cn("shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                              idx === 0 && "bg-amber-100 text-amber-700",
                              idx === 1 && "bg-slate-200 text-slate-700",
                              idx === 2 && "bg-orange-100 text-orange-700",
                              idx > 2 && "bg-muted text-muted-foreground")}>{idx + 1}</span>
                            <span className="font-medium truncate">{c.cliente}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-[10px] h-5">{c.qtd}</Badge>
                            <span className="font-bold text-foreground tabular-nums">{fmtBRL(c.valor)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-600 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> SS por Situação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ssStatusData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Nenhuma solicitação no período.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={ssStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={95} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`} labelLine>
                    {ssStatusData.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> OS por Situação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {osStatusData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Nenhuma OS no período.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={osStatusData} margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="OS" radius={[4, 4, 0, 0]}>
                    {osStatusData.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Evolução Mensal — SS vs OS
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timelineData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados no período.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorSS" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOS" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="ss" stroke="#3b82f6" fill="url(#colorSS)" name="Solicitações" />
                  <Area type="monotone" dataKey="os" stroke="#10b981" fill="url(#colorOS)" name="Ordens" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de Clientes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Ranking — Clientes (SS + OS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rankingClientes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados.</p>
            ) : (
              <div className="space-y-2">
                {rankingClientes.map((c, idx) => {
                  const max = rankingClientes[0]?.total || 1;
                  const pct = (c.total / max) * 100;
                  return (
                    <div key={c.cliente} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={cn(
                            "shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                            idx === 0 && "bg-amber-100 text-amber-700",
                            idx === 1 && "bg-slate-200 text-slate-700",
                            idx === 2 && "bg-orange-100 text-orange-700",
                            idx > 2 && "bg-muted text-muted-foreground",
                          )}>{idx + 1}</span>
                          <span className="font-medium truncate">{c.cliente}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-[10px] h-5">SS {c.ss}</Badge>
                          <Badge variant="outline" className="text-[10px] h-5">OS {c.os}</Badge>
                          <span className="font-bold text-foreground w-8 text-right">{c.total}</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ranking de Funcionários */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" /> Ranking — Funcionários Mais Produtivos
            </CardTitle>
            <p className="text-[10px] text-muted-foreground mt-1">
              Pontuação por complexidade da OS · Baixa = 1 pt · Média = 3 pts · Alta = 5 pts
            </p>
          </CardHeader>
          <CardContent>
            {rankingFuncionarios.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                Nenhum funcionário vinculado a OS no período.
              </p>
            ) : (
              <div className="space-y-2">
                {rankingFuncionarios.map((f: any, idx) => {
                  const max = rankingFuncionarios[0]?.pontos || 1;
                  const pct = (f.pontos / max) * 100;
                  return (
                    <div key={f.nome + idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={cn(
                            "shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                            idx === 0 && "bg-amber-100 text-amber-700",
                            idx === 1 && "bg-slate-200 text-slate-700",
                            idx === 2 && "bg-orange-100 text-orange-700",
                            idx > 2 && "bg-muted text-muted-foreground",
                          )}>{idx + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{f.nome}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{f.cargo}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="outline" className="text-[10px] h-5 bg-green-50 text-green-700 border-green-200" title="Baixa (1pt)">B {f.baixa}</Badge>
                          <Badge variant="outline" className="text-[10px] h-5 bg-amber-50 text-amber-700 border-amber-200" title="Média (3pts)">M {f.media}</Badge>
                          <Badge variant="outline" className="text-[10px] h-5 bg-rose-50 text-rose-700 border-rose-200" title="Alta (5pts)">A {f.alta}</Badge>
                          <span className="font-bold text-foreground w-12 text-right tabular-nums">{f.pontos} pts</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tipo de OS */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" /> OS por Tipo de Manutenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tipoOSData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={tipoOSData} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="value" name="OS" radius={[0, 4, 4, 0]}>
                    {tipoOSData.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
