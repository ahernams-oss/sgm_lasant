import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LayoutDashboard, CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRequisicoes } from "@/contexts/RequisicaoContext";
import { useClientes } from "@/contexts/ClientesContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, Area, AreaChart,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  Pendente: "hsl(38, 92%, 50%)",
  "Em Análise": "hsl(217, 91%, 50%)",
  Aprovada: "hsl(160, 84%, 39%)",
  Reprovada: "hsl(0, 72%, 51%)",
  "Concluída": "hsl(271, 91%, 65%)",
};

const CHART_COLORS = [
  "hsl(217, 91%, 50%)", "hsl(160, 84%, 39%)", "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)", "hsl(271, 91%, 65%)", "hsl(200, 80%, 50%)",
  "hsl(30, 80%, 55%)", "hsl(340, 75%, 55%)",
];

function parseDataCriacao(dateStr: string): Date | null {
  // dd/mm/yyyy
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  return new Date(y, m - 1, d);
}

const Dashboard = () => {
  const { requisicoes } = useRequisicoes();
  const { clientes } = useClientes();
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const filteredReqs = useMemo(() => {
    if (!dateFrom && !dateTo) return requisicoes;
    return requisicoes.filter((r) => {
      const d = parseDataCriacao(r.dataCriacao);
      if (!d) return true;
      if (dateFrom && d < dateFrom) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      return true;
    });
  }, [requisicoes, dateFrom, dateTo]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredReqs.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredReqs]);

  const clienteData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredReqs.forEach((r) => { counts[r.unidade || "Sem unidade"] = (counts[r.unidade || "Sem unidade"] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredReqs]);

  const cargoData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredReqs.forEach((r) => { counts[r.cargoNome || "Sem cargo"] = (counts[r.cargoNome || "Sem cargo"] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredReqs]);

  const timelineData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredReqs.forEach((r) => {
      // dataCriacao is dd/mm/yyyy — group by mm/yyyy
      const parts = r.dataCriacao.split("/");
      if (parts.length === 3) {
        const key = `${parts[1]}/${parts[2]}`; // mm/yyyy
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort(([a], [b]) => {
        const [ma, ya] = a.split("/").map(Number);
        const [mb, yb] = b.split("/").map(Number);
        return ya !== yb ? ya - yb : ma - mb;
      })
      .map(([period, total]) => ({ period, total }));
  }, [filteredReqs]);

  const totalReqs = filteredReqs.length;
  const hasFilter = dateFrom || dateTo;

  return (
    <div className="bg-background">
      <div className="container max-w-full mx-auto px-4 py-8">
        <div className="mb-6 animate-fade-up">
          <div className="flex items-center gap-2 text-primary mb-1">
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Visão Geral</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground mb-1">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Resumo das requisições de colaboradores.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-9 gap-2 text-xs", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Data início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ptBR} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">até</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-9 gap-2 text-xs", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy") : "Data fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={ptBR} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              {hasFilter && (
                <Button variant="ghost" size="sm" className="h-9 text-xs gap-1" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
                  <X className="h-3.5 w-3.5" /> Limpar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8 animate-fade-up" style={{ animationDelay: "80ms" }}>
          <Card>
            <CardContent className="pt-4 pb-3 px-4 text-center">
              <p className="text-2xl font-bold text-foreground">{totalReqs}</p>
              <p className="text-xs text-muted-foreground mt-1">Total</p>
            </CardContent>
          </Card>
          {["Pendente", "Em Análise", "Aprovada", "Reprovada", "Concluída"].map((status) => {
            const count = filteredReqs.filter((r) => r.status === status).length;
            return (
              <Card key={status}>
                <CardContent className="pt-4 pb-3 px-4 text-center">
                  <p className="text-2xl font-bold" style={{ color: STATUS_COLORS[status] }}>{count}</p>
                  <p className="text-xs text-muted-foreground mt-1">{status}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up" style={{ animationDelay: "160ms" }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Solicitações por Status</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Nenhuma requisição no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`} labelLine>
                      {statusData.map((entry) => (<Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "hsl(var(--muted))"} />))}
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
              <CardTitle className="text-sm font-semibold">Solicitações por Cliente/Unidade</CardTitle>
            </CardHeader>
            <CardContent>
              {clienteData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Nenhuma requisição no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={clienteData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Solicitações" radius={[0, 4, 4, 0]}>
                      {clienteData.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Solicitações por Cargo</CardTitle>
            </CardHeader>
            <CardContent>
              {cargoData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Nenhuma requisição no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(200, cargoData.length * 36)}>
                  <BarChart data={cargoData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Solicitações" fill="hsl(217, 91%, 50%)" radius={[0, 4, 4, 0]}>
                      {cargoData.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Timeline Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Evolução Temporal das Requisições</CardTitle>
            </CardHeader>
            <CardContent>
              {timelineData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Nenhuma requisição no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={timelineData} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="total" name="Requisições" stroke="hsl(217, 91%, 50%)" fill="url(#colorTotal)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
