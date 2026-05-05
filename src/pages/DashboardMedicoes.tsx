import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useMedicoes, MedicaoServico } from "@/contexts/MedicoesContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { Progress } from "@/components/ui/progress";
import { FileText, Ruler, TrendingUp, DollarSign, Clock, CheckCircle, Download, CalendarIcon, Filter, X, LayoutDashboard, AlertTriangle, Sparkles, Wallet, Activity } from "lucide-react";
import { downloadPdfMedicoes } from "@/lib/gerarPdfMedicoes";
import { downloadExcelMedicoes } from "@/lib/gerarExcelMedicoes";

const STATUS_COLORS: Record<string, string> = {
  "Em Andamento": "hsl(210, 70%, 55%)",
  "Concluída": "hsl(145, 60%, 45%)",
  "Paralisada": "hsl(0, 70%, 55%)",
  "Cancelada": "hsl(0, 0%, 55%)",
};

const PIE_COLORS = ["#3b82f6", "#10b981", "#ef4444", "#9ca3af", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

const GRADIENT_STYLES = [
  { bg: "from-blue-500/10 to-blue-600/5", icon: "text-blue-600", border: "border-blue-200/50" },
  { bg: "from-amber-500/10 to-amber-600/5", icon: "text-amber-600", border: "border-amber-200/50" },
  { bg: "from-emerald-500/10 to-emerald-600/5", icon: "text-emerald-600", border: "border-emerald-200/50" },
  { bg: "from-red-500/10 to-red-600/5", icon: "text-red-600", border: "border-red-200/50" },
  { bg: "from-purple-500/10 to-purple-600/5", icon: "text-purple-600", border: "border-purple-200/50" },
  { bg: "from-cyan-500/10 to-cyan-600/5", icon: "text-cyan-600", border: "border-cyan-200/50" },
];

const GradientKpiCard = ({
  icon: Icon, label, value, gradientIdx = 0, subtitle,
}: {
  icon: any; label: string; value: number | string; gradientIdx?: number; subtitle?: string;
}) => {
  const style = GRADIENT_STYLES[gradientIdx % GRADIENT_STYLES.length];
  return (
    <Card className={cn("overflow-hidden border", style.border)}>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-bold text-foreground">{value}</p>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
            {subtitle && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{subtitle}</p>}
          </div>
          <div className={cn("rounded-xl p-2.5 bg-gradient-to-br", style.bg)}>
            <Icon className={cn("h-4 w-4", style.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtPct = (v: number) => `${v.toFixed(1)}%`;

export interface ReportFilters {
  lancamentoStart?: Date;
  lancamentoEnd?: Date;
  pagamentoStart?: Date;
  pagamentoEnd?: Date;
  clienteId: string;
  fornecedorNome: string;
  status: string;
}

function buildFilterLabel(filters: ReportFilters, clientes: { id: string; nome: string }[]): string {
  const parts: string[] = [];
  if (filters.lancamentoStart || filters.lancamentoEnd) {
    const s = filters.lancamentoStart ? format(filters.lancamentoStart, "dd/MM/yyyy") : "...";
    const e = filters.lancamentoEnd ? format(filters.lancamentoEnd, "dd/MM/yyyy") : "...";
    parts.push(`Lançamento: ${s} a ${e}`);
  }
  if (filters.pagamentoStart || filters.pagamentoEnd) {
    const s = filters.pagamentoStart ? format(filters.pagamentoStart, "dd/MM/yyyy") : "...";
    const e = filters.pagamentoEnd ? format(filters.pagamentoEnd, "dd/MM/yyyy") : "...";
    parts.push(`Pagamento: ${s} a ${e}`);
  }
  if (filters.clienteId && filters.clienteId !== "todos") {
    const c = clientes.find((x) => x.id === filters.clienteId);
    parts.push(`Cliente: ${c?.nome || filters.clienteId}`);
  }
  if (filters.fornecedorNome && filters.fornecedorNome !== "todos") {
    parts.push(`Fornecedor: ${filters.fornecedorNome}`);
  }
  if (filters.status && filters.status !== "todos") {
    parts.push(`Status: ${filters.status}`);
  }
  return parts.length > 0 ? parts.join(" | ") : "Sem filtros aplicados";
}

export default function DashboardMedicoes() {
  const { medicoes, loading } = useMedicoes();
  const { clientes } = useClientes();
  const { empresa } = useEmpresa();

  const [lancStart, setLancStart] = useState<Date | undefined>();
  const [lancEnd, setLancEnd] = useState<Date | undefined>();
  const [pagStart, setPagStart] = useState<Date | undefined>();
  const [pagEnd, setPagEnd] = useState<Date | undefined>();
  const [clienteFilter, setClienteFilter] = useState("todos");
  const [fornecedorFilter, setFornecedorFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");

  const clearFilters = () => {
    setLancStart(undefined); setLancEnd(undefined);
    setPagStart(undefined); setPagEnd(undefined);
    setClienteFilter("todos"); setFornecedorFilter("todos"); setStatusFilter("todos");
  };

  const hasFilters = lancStart || lancEnd || pagStart || pagEnd || clienteFilter !== "todos" || fornecedorFilter !== "todos" || statusFilter !== "todos";

  const allStatuses = useMemo(() => {
    const s = new Set<string>();
    medicoes.forEach((m) => s.add(m.status));
    return Array.from(s);
  }, [medicoes]);

  const allFornecedores = useMemo(() => {
    const s = new Set<string>();
    medicoes.forEach((m) => { const fn = (m as any).fornecedor_nome; if (fn) s.add(fn); });
    return Array.from(s).sort();
  }, [medicoes]);

  const allClientes = useMemo(() => {
    const ids = new Set<string>();
    medicoes.forEach((m) => { if (m.cliente_id) ids.add(m.cliente_id); });
    return clientes.filter((c) => ids.has(c.id));
  }, [medicoes, clientes]);

  const filtered = useMemo(() => {
    let list = medicoes;
    if (lancStart) { const s = new Date(lancStart); s.setHours(0, 0, 0, 0); list = list.filter((m) => m.created_at && new Date(m.created_at) >= s); }
    if (lancEnd) { const e = new Date(lancEnd); e.setHours(23, 59, 59, 999); list = list.filter((m) => m.created_at && new Date(m.created_at) <= e); }
    if (pagStart) {
      const s = format(pagStart, "yyyy-MM-dd");
      list = list.filter((m) => {
        const dp = (m as any).data_pagamento;
        if (dp && dp >= s) return true;
        return (m.medicoes || []).some((lanc: any) => lanc.data_pagamento && lanc.data_pagamento >= s);
      });
    }
    if (pagEnd) {
      const e = format(pagEnd, "yyyy-MM-dd");
      list = list.filter((m) => {
        const dp = (m as any).data_pagamento;
        if (dp && dp <= e) return true;
        return (m.medicoes || []).some((lanc: any) => lanc.data_pagamento && lanc.data_pagamento <= e);
      });
    }
    if (clienteFilter !== "todos") list = list.filter((m) => m.cliente_id === clienteFilter);
    if (fornecedorFilter !== "todos") list = list.filter((m) => (m as any).fornecedor_nome === fornecedorFilter);
    if (statusFilter !== "todos") list = list.filter((m) => m.status === statusFilter);
    return list;
  }, [medicoes, lancStart, lancEnd, pagStart, pagEnd, clienteFilter, fornecedorFilter, statusFilter]);

  // KPIs
  const totalMedicoes = filtered.length;
  const valorContratado = filtered.reduce((s, m) => s + (m.valor_total_contratado || 0), 0);
  const valorMedido = filtered.reduce((s, m) => s + (m.valor_total_medido || 0), 0);
  const saldoAberto = valorContratado - valorMedido;
  const percentualMedio = totalMedicoes > 0
    ? filtered.reduce((s, m) => s + (m.percentual_medido || 0), 0) / totalMedicoes : 0;
  const emAndamento = filtered.filter((m) => m.status === "Em Andamento").length;
  const concluidas = filtered.filter((m) => m.status === "Concluída").length;
  const paralisadas = filtered.filter((m) => m.status === "Paralisada").length;

  // Charts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((m) => { counts[m.status] = (counts[m.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const byClient = useMemo(() => {
    const counts: Record<string, { contratado: number; medido: number }> = {};
    filtered.forEach((m) => {
      const key = m.cliente_nome || "Sem cliente";
      if (!counts[key]) counts[key] = { contratado: 0, medido: 0 };
      counts[key].contratado += m.valor_total_contratado || 0;
      counts[key].medido += m.valor_total_medido || 0;
    });
    return Object.entries(counts).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.contratado - a.contratado).slice(0, 10);
  }, [filtered]);

  const byMonth = useMemo(() => {
    const months: Record<string, { contratado: number; medido: number; count: number }> = {};
    filtered.forEach((m) => {
      if (!m.created_at) return;
      const d = new Date(m.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!months[key]) months[key] = { contratado: 0, medido: 0, count: 0 };
      months[key].contratado += m.valor_total_contratado || 0;
      months[key].medido += m.valor_total_medido || 0;
      months[key].count += 1;
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v }));
  }, [filtered]);

  const byFornecedor = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((m) => {
      const key = (m as any).fornecedor_nome || "Sem fornecedor";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [filtered]);

  const currentFilters: ReportFilters = {
    lancamentoStart: lancStart, lancamentoEnd: lancEnd,
    pagamentoStart: pagStart, pagamentoEnd: pagEnd,
    clienteId: clienteFilter, fornecedorNome: fornecedorFilter, status: statusFilter,
  };
  const filterLabel = buildFilterLabel(currentFilters, clientes);

  if (loading) return <div className="p-8 text-muted-foreground">Carregando...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Engenharia</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Dashboard — Medição de Serviços e Obras</h1>
          <p className="text-sm text-muted-foreground">Acompanhamento financeiro e operacional das medições.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5" onClick={() => downloadPdfMedicoes(filtered, filterLabel)}>
            <FileText className="mr-1 h-3.5 w-3.5" /> Relatório PDF
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5" onClick={() => downloadExcelMedicoes(filtered, filterLabel)}>
            <Download className="mr-1 h-3.5 w-3.5" /> Relatório Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filtros do Relatório
            </CardTitle>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                <X className="mr-1 h-3 w-3" /> Limpar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Data Lançamento (De)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-sm", !lancStart && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {lancStart ? format(lancStart, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={lancStart} onSelect={setLancStart} /></PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Data Lançamento (Até)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-sm", !lancEnd && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {lancEnd ? format(lancEnd, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={lancEnd} onSelect={setLancEnd} /></PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Data Pagamento (De)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-sm", !pagStart && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {pagStart ? format(pagStart, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={pagStart} onSelect={setPagStart} /></PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Data Pagamento (Até)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-sm", !pagEnd && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {pagEnd ? format(pagEnd, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={pagEnd} onSelect={setPagEnd} /></PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Cliente / Centro de Custo</Label>
              <Select value={clienteFilter} onValueChange={setClienteFilter}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {allClientes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Fornecedor</Label>
              <Select value={fornecedorFilter} onValueChange={setFornecedorFilter}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {allFornecedores.map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {allStatuses.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Badge variant="secondary" className="h-9 px-4 flex items-center text-sm">
                {filtered.length} medição(ões)
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <GradientKpiCard icon={Ruler} label="Total Medições" value={totalMedicoes} gradientIdx={0} />
        <GradientKpiCard icon={DollarSign} label="Valor Contratado" value={fmt(valorContratado)} gradientIdx={0} />
        <GradientKpiCard icon={TrendingUp} label="Valor Medido" value={fmt(valorMedido)} gradientIdx={2} />
        <GradientKpiCard icon={DollarSign} label="Saldo Aberto" value={fmt(saldoAberto)} gradientIdx={1} subtitle="Contratado − Medido" />
        <GradientKpiCard icon={TrendingUp} label="% Médio Exec." value={fmtPct(percentualMedio)} gradientIdx={4} />
        <GradientKpiCard icon={Clock} label="Em Andamento" value={emAndamento} gradientIdx={0} />
        <GradientKpiCard icon={CheckCircle} label="Concluídas" value={concluidas} gradientIdx={2} />
        <GradientKpiCard icon={AlertTriangle} label="Paralisadas" value={paralisadas} gradientIdx={3} />
      </div>

      {/* Charts */}
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Por Status</TabsTrigger>
          <TabsTrigger value="clientes">Por Cliente</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução Mensal</TabsTrigger>
          <TabsTrigger value="fornecedores">Por Fornecedor</TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <Card>
            <CardHeader><CardTitle className="text-sm">Medições por Status</CardTitle></CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={120} label={({ name, value }) => `${name}: ${value}`}>
                    {statusCounts.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clientes">
          <Card>
            <CardHeader><CardTitle className="text-sm">Valores por Cliente / Obra</CardTitle></CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byClient} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => fmt(v)} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="contratado" name="Contratado" fill="#3b82f6" />
                  <Bar dataKey="medido" name="Medido" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evolucao">
          <Card>
            <CardHeader><CardTitle className="text-sm">Evolução Mensal</CardTitle></CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={byMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="contratado" name="Contratado" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="medido" name="Medido" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fornecedores">
          <Card>
            <CardHeader><CardTitle className="text-sm">Medições por Fornecedor</CardTitle></CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byFornecedor}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Qtd. Medições" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Lista de Medições</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Cliente / Obra</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Data Pgto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Contratado</TableHead>
                  <TableHead className="text-right">Medido</TableHead>
                  <TableHead className="text-right">% Exec.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.numero}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{m.cliente_nome}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{(m as any).fornecedor_nome || "—"}</TableCell>
                    <TableCell>{m.contrato || "—"}</TableCell>
                    <TableCell>{(m as any).data_pagamento || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" style={{ background: STATUS_COLORS[m.status] || "#666", color: "#fff" }}>
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{fmt(m.valor_total_contratado || 0)}</TableCell>
                    <TableCell className="text-right">{fmt(m.valor_total_medido || 0)}</TableCell>
                    <TableCell className="text-right">{fmtPct(m.percentual_medido || 0)}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Nenhuma medição encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
