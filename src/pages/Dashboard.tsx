import { useMemo } from "react";
import { LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRequisicoes } from "@/contexts/RequisicaoContext";
import { useClientes } from "@/contexts/ClientesContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  Pendente: "hsl(38, 92%, 50%)",
  "Em Análise": "hsl(217, 91%, 50%)",
  Aprovada: "hsl(160, 84%, 39%)",
  Reprovada: "hsl(0, 72%, 51%)",
  "Concluída": "hsl(271, 91%, 65%)",
};

const CHART_COLORS = [
  "hsl(217, 91%, 50%)",
  "hsl(160, 84%, 39%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(271, 91%, 65%)",
  "hsl(200, 80%, 50%)",
  "hsl(30, 80%, 55%)",
  "hsl(340, 75%, 55%)",
];

const Dashboard = () => {
  const { requisicoes } = useRequisicoes();
  const { clientes } = useClientes();

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    requisicoes.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [requisicoes]);

  const clienteData = useMemo(() => {
    const counts: Record<string, number> = {};
    requisicoes.forEach((r) => {
      const nome = r.unidade || "Sem unidade";
      counts[nome] = (counts[nome] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [requisicoes]);

  const cargoData = useMemo(() => {
    const counts: Record<string, number> = {};
    requisicoes.forEach((r) => {
      const nome = r.cargoNome || "Sem cargo";
      counts[nome] = (counts[nome] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [requisicoes]);

  const totalReqs = requisicoes.length;

  return (
    <div className="bg-background">
      <div className="container max-w-full mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-2 text-primary mb-1">
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Visão Geral
            </span>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Resumo das requisições de colaboradores.
          </p>
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
            const count = requisicoes.filter((r) => r.status === status).length;
            return (
              <Card key={status}>
                <CardContent className="pt-4 pb-3 px-4 text-center">
                  <p className="text-2xl font-bold" style={{ color: STATUS_COLORS[status] }}>
                    {count}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{status}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up" style={{ animationDelay: "160ms" }}>
          {/* Status Pie Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Solicitações por Status</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Nenhuma requisição ainda.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "hsl(var(--muted))"} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* By Client Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Solicitações por Cliente/Unidade</CardTitle>
            </CardHeader>
            <CardContent>
              {clienteData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Nenhuma requisição ainda.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={clienteData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Solicitações" radius={[0, 4, 4, 0]}>
                      {clienteData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* By Cargo Bar Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Solicitações por Cargo</CardTitle>
            </CardHeader>
            <CardContent>
              {cargoData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Nenhuma requisição ainda.</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(200, cargoData.length * 36)}>
                  <BarChart data={cargoData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Solicitações" fill="hsl(217, 91%, 50%)" radius={[0, 4, 4, 0]}>
                      {cargoData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
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
