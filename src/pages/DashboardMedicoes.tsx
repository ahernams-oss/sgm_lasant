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
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { FileText, Ruler, TrendingUp, DollarSign, Clock, CheckCircle, Download } from "lucide-react";
import { downloadPdfMedicoes } from "@/lib/gerarPdfMedicoes";
import { downloadExcelMedicoes } from "@/lib/gerarExcelMedicoes";

const STATUS_COLORS: Record<string, string> = {
  "Em Andamento": "hsl(210, 70%, 55%)",
  "Concluída": "hsl(145, 60%, 45%)",
  "Paralisada": "hsl(0, 70%, 55%)",
  "Cancelada": "hsl(0, 0%, 55%)",
};

const PIE_COLORS = ["#3b82f6", "#10b981", "#ef4444", "#9ca3af", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtPct = (v: number) => `${v.toFixed(1)}%`;

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

  if (loading) return <div className="p-8 text-muted-foreground">Carregando...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Dashboard — Medição de Serviços e Obras</h1>
        <div className="flex gap-2 flex-wrap">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os períodos</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {allStatuses.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => downloadPdfMedicoes(filtered)}>
            <FileText className="mr-1 h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadExcelMedicoes(filtered)}>
            <Download className="mr-1 h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Ruler className="mx-auto h-6 w-6 text-primary mb-1" />
            <p className="text-2xl font-bold">{totalMedicoes}</p>
            <p className="text-xs text-muted-foreground">Total Medições</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="mx-auto h-6 w-6 text-primary mb-1" />
            <p className="text-lg font-bold">{fmt(valorContratado)}</p>
            <p className="text-xs text-muted-foreground">Valor Contratado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="mx-auto h-6 w-6 text-primary mb-1" />
            <p className="text-lg font-bold">{fmt(valorMedido)}</p>
            <p className="text-xs text-muted-foreground">Valor Medido</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="mx-auto h-6 w-6 text-primary mb-1" />
            <p className="text-2xl font-bold">{fmtPct(percentualMedio)}</p>
            <p className="text-xs text-muted-foreground">% Médio Executado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="mx-auto h-6 w-6 text-yellow-500 mb-1" />
            <p className="text-2xl font-bold">{emAndamento}</p>
            <p className="text-xs text-muted-foreground">Em Andamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="mx-auto h-6 w-6 text-green-600 mb-1" />
            <p className="text-2xl font-bold">{concluidas}</p>
            <p className="text-xs text-muted-foreground">Concluídas</p>
          </CardContent>
        </Card>
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
            <CardHeader><CardTitle className="text-base">Medições por Status</CardTitle></CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, value }) => `${name}: ${value}`}>
                    {statusCounts.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
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
            <CardHeader><CardTitle className="text-base">Valores por Cliente / Obra</CardTitle></CardHeader>
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
            <CardHeader><CardTitle className="text-base">Evolução Mensal</CardTitle></CardHeader>
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
            <CardHeader><CardTitle className="text-base">Medições por Fornecedor</CardTitle></CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byFornecedor}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Qtd. Medições" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Lista de Medições</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Cliente / Obra</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Contrato</TableHead>
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
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
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
