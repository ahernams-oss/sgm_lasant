import { useMemo, useState } from "react";
import { useMedicoes, MedicaoServico } from "@/contexts/MedicoesContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart,
} from "recharts";
import { FileText, Ruler, TrendingUp, DollarSign, Clock, CheckCircle, Download, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { downloadPdfMedicoes } from "@/lib/gerarPdfMedicoes";
import { downloadExcelMedicoes } from "@/lib/gerarExcelMedicoes";

const STATUS_COLORS: Record<string, string> = {
  "Em Andamento": "hsl(210, 80%, 52%)",
  "Concluída": "hsl(152, 60%, 40%)",
  "Paralisada": "hsl(0, 70%, 55%)",
  "Cancelada": "hsl(0, 0%, 55%)",
};

const PIE_COLORS = ["#673ab7", "#2196f3", "#00c853", "#ff9800", "#e91e63", "#00bcd4", "#8bc34a", "#ff5722"];

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtPct = (v: number) => `${v.toFixed(1)}%`;

const fmtCompact = (v: number) => {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
  return fmt(v);
};

// Berry-style KPI card
function KpiCard({ icon: Icon, title, value, subtitle, gradient, iconBg }: {
  icon: React.ElementType;
  title: string;
  value: string;
  subtitle?: string;
  gradient: string;
  iconBg: string;
}) {
  return (
    <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${iconBg}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
      <div className={`h-1 w-full ${gradient}`} />
    </Card>
  );
}

export default function DashboardMedicoes() {
  const { medicoes, loading } = useMedicoes();
  const [periodo, setPeriodo] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");

  const filtered = useMemo(() => {
    let list = medicoes;
    if (periodo !== "todos") {
      const days = Number(periodo);
      const cutoff = new Date(Date.now() - days * 86400000);
      list = list.filter((m) => m.created_at && new Date(m.created_at) >= cutoff);
    }
    if (statusFilter !== "todos") {
      list = list.filter((m) => m.status === statusFilter);
    }
    return list;
  }, [medicoes, periodo, statusFilter]);

  // KPIs
  const totalMedicoes = filtered.length;
  const valorContratado = filtered.reduce((s, m) => s + (m.valor_total_contratado || 0), 0);
  const valorMedido = filtered.reduce((s, m) => s + (m.valor_total_medido || 0), 0);
  const percentualMedio = totalMedicoes > 0
    ? filtered.reduce((s, m) => s + (m.percentual_medido || 0), 0) / totalMedicoes
    : 0;
  const emAndamento = filtered.filter((m) => m.status === "Em Andamento").length;
  const concluidas = filtered.filter((m) => m.status === "Concluída").length;

  // Status chart
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((m) => {
      counts[m.status] = (counts[m.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // By client chart
  const byClient = useMemo(() => {
    const counts: Record<string, { contratado: number; medido: number }> = {};
    filtered.forEach((m) => {
      const key = m.cliente_nome || "Sem cliente";
      if (!counts[key]) counts[key] = { contratado: 0, medido: 0 };
      counts[key].contratado += m.valor_total_contratado || 0;
      counts[key].medido += m.valor_total_medido || 0;
    });
    return Object.entries(counts)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.contratado - a.contratado)
      .slice(0, 10);
  }, [filtered]);

  // Progress by month
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
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v }));
  }, [filtered]);

  // By fornecedor
  const byFornecedor = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((m) => {
      const key = (m as any).fornecedor_nome || "Sem fornecedor";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filtered]);

  const allStatuses = useMemo(() => {
    const s = new Set<string>();
    medicoes.forEach((m) => s.add(m.status));
    return Array.from(s);
  }, [medicoes]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard — Medição de Serviços e Obras</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe seus indicadores de engenharia</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-40 bg-card border-border/60"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os períodos</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-card border-border/60"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {allStatuses.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="bg-card" onClick={() => downloadPdfMedicoes(filtered)}>
            <FileText className="mr-1.5 h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" className="bg-card" onClick={() => downloadExcelMedicoes(filtered)}>
            <Download className="mr-1.5 h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          icon={Ruler}
          title="Total Medições"
          value={String(totalMedicoes)}
          gradient="bg-gradient-to-r from-[hsl(262,68%,56%)] to-[hsl(262,68%,70%)]"
          iconBg="bg-[hsl(262,68%,56%)]"
        />
        <KpiCard
          icon={DollarSign}
          title="Valor Contratado"
          value={fmtCompact(valorContratado)}
          gradient="bg-gradient-to-r from-[hsl(210,80%,52%)] to-[hsl(210,80%,66%)]"
          iconBg="bg-[hsl(210,80%,52%)]"
        />
        <KpiCard
          icon={TrendingUp}
          title="Valor Medido"
          value={fmtCompact(valorMedido)}
          gradient="bg-gradient-to-r from-[hsl(152,60%,40%)] to-[hsl(152,60%,55%)]"
          iconBg="bg-[hsl(152,60%,40%)]"
        />
        <KpiCard
          icon={TrendingUp}
          title="% Médio Executado"
          value={fmtPct(percentualMedio)}
          gradient="bg-gradient-to-r from-[hsl(25,95%,53%)] to-[hsl(25,95%,67%)]"
          iconBg="bg-[hsl(25,95%,53%)]"
        />
        <KpiCard
          icon={Clock}
          title="Em Andamento"
          value={String(emAndamento)}
          gradient="bg-gradient-to-r from-[hsl(210,80%,52%)] to-[hsl(262,68%,56%)]"
          iconBg="bg-[hsl(210,80%,52%)]"
        />
        <KpiCard
          icon={CheckCircle}
          title="Concluídas"
          value={String(concluidas)}
          gradient="bg-gradient-to-r from-[hsl(152,60%,40%)] to-[hsl(152,60%,55%)]"
          iconBg="bg-[hsl(152,60%,40%)]"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Pie */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Medições por Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusCounts}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={60}
                  paddingAngle={3}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusCounts.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Evolution - Area Chart */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={byMonth}>
                <defs>
                  <linearGradient id="gradContratado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#673ab7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#673ab7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradMedido" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2196f3" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2196f3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 22%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                <YAxis tickFormatter={(v) => fmtCompact(v)} tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                <Legend />
                <Area type="monotone" dataKey="contratado" name="Contratado" stroke="#673ab7" strokeWidth={2.5} fill="url(#gradContratado)" />
                <Area type="monotone" dataKey="medido" name="Medido" stroke="#2196f3" strokeWidth={2.5} fill="url(#gradMedido)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By Client */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Valores por Cliente / Obra</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byClient} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 22%, 90%)" />
                <XAxis type="number" tickFormatter={(v) => fmtCompact(v)} tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                <Legend />
                <Bar dataKey="contratado" name="Contratado" fill="#673ab7" radius={[0, 6, 6, 0]} />
                <Bar dataKey="medido" name="Medido" fill="#2196f3" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By Fornecedor */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Medições por Fornecedor</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byFornecedor} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 22%, 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                <YAxis stroke="hsl(220, 10%, 46%)" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                <Bar dataKey="value" name="Qtd. Medições" fill="#00c853" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">Lista de Medições</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Nº</TableHead>
                  <TableHead className="font-semibold">Cliente / Obra</TableHead>
                  <TableHead className="font-semibold">Fornecedor</TableHead>
                  <TableHead className="font-semibold">Contrato</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Contratado</TableHead>
                  <TableHead className="text-right font-semibold">Medido</TableHead>
                  <TableHead className="text-right font-semibold">% Exec.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{m.numero}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{m.cliente_nome}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{(m as any).fornecedor_nome || "—"}</TableCell>
                    <TableCell>{m.contrato || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        className="text-xs font-medium border-0"
                        style={{
                          background: STATUS_COLORS[m.status] ? `${STATUS_COLORS[m.status]}20` : "hsl(0,0%,90%)",
                          color: STATUS_COLORS[m.status] || "hsl(0,0%,40%)",
                        }}
                      >
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{fmt(m.valor_total_contratado || 0)}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(m.valor_total_medido || 0)}</TableCell>
                    <TableCell className="text-right font-medium">{fmtPct(m.percentual_medido || 0)}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
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
