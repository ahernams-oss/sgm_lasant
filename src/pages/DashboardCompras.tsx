import { useMemo, useState } from "react";
import { useRequisicaoCompras, RequisicaoCompras, StatusRequisicaoCompras } from "@/contexts/RequisicaoComprasContext";
import { useMateriaisServicos } from "@/contexts/MateriaisServicosContext";
import { useCategoriasCompras } from "@/contexts/CategoriasComprasContext";
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
import { FileText, ShoppingCart, Clock, AlertTriangle, CheckCircle, XCircle, Package, TrendingUp } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const STATUS_COLORS: Record<string, string> = {
  "Enviada": "hsl(210, 70%, 55%)",
  "Em Cotação": "hsl(40, 85%, 55%)",
  "Aguardando Aprovação": "hsl(30, 80%, 55%)",
  "Aprovada": "hsl(145, 60%, 45%)",
  "Reprovada": "hsl(0, 70%, 55%)",
  "Pedido Emitido": "hsl(260, 60%, 55%)",
  "Em Entrega": "hsl(190, 70%, 50%)",
  "Recebida Parcial": "hsl(50, 70%, 50%)",
  "Recebida": "hsl(145, 50%, 40%)",
  "Concluída": "hsl(160, 60%, 35%)",
  "Cancelada": "hsl(0, 0%, 55%)",
  "Rascunho": "hsl(0, 0%, 70%)",
};

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1", "#14b8a6", "#9ca3af"];

function diffHours(a: string, b: string) {
  return (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60);
}

function formatHours(h: number) {
  if (h < 24) return `${h.toFixed(1)}h`;
  const d = Math.floor(h / 24);
  const rem = h % 24;
  return `${d}d ${rem.toFixed(0)}h`;
}

export default function DashboardCompras() {
  const { requisicoes } = useRequisicaoCompras();
  const { materiais } = useMateriaisServicos();
  const { getDescricaoCompleta } = useCategoriasCompras();
  const [periodo, setPeriodo] = useState("todos");

  const filtered = useMemo(() => {
    if (periodo === "todos") return requisicoes;
    const now = new Date();
    const days = periodo === "7" ? 7 : periodo === "30" ? 30 : periodo === "90" ? 90 : 365;
    const cutoff = new Date(now.getTime() - days * 86400000);
    return requisicoes.filter(r => new Date(r.dataCriacao) >= cutoff);
  }, [requisicoes, periodo]);

  // KPIs
  const totalReqs = filtered.length;
  const abertas = filtered.filter(r => !["Concluída", "Cancelada", "Reprovada"].includes(r.status)).length;
  const concluidas = filtered.filter(r => r.status === "Concluída").length;
  const reprovadas = filtered.filter(r => r.status === "Reprovada").length;
  const canceladas = filtered.filter(r => r.status === "Cancelada").length;
  const totalItens = filtered.reduce((s, r) => s + r.itens.length, 0);

  // Status distribution
  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => { map[r.status] = (map[r.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // Urgency distribution
  const urgenciaData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => { map[r.urgencia] = (map[r.urgencia] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // By cost center
  const centroCustoData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => {
      const nome = r.centroCustoNome || "Não informado";
      map[nome] = (map[nome] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  // By category (from items)
  const categoriaData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => {
      r.itens.forEach(item => {
        const mat = materiais.find(m => m.id === item.materialId);
        const catName = mat?.categoriaId ? (getDescricaoCompleta(mat.categoriaId) || "Sem categoria") : "Sem categoria";
        map[catName] = (map[catName] || 0) + item.quantidade;
      });
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [filtered, materiais, getDescricaoCompleta]);

  // Timeline (monthly)
  const timelineData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => {
      const d = new Date(r.dataCriacao);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort().map(([name, total]) => ({ name, total }));
  }, [filtered]);

  // Time metrics
  const timeMetrics = useMemo(() => {
    const approvalTimes: number[] = [];
    const completionTimes: number[] = [];

    filtered.forEach(r => {
      const hist = r.historicoStatus;
      const envio = hist.find(h => h.status === "Enviada");
      const aprovacao = hist.find(h => h.status === "Aprovada");
      const conclusao = hist.find(h => h.status === "Concluída");

      if (envio && aprovacao) approvalTimes.push(diffHours(envio.dataHora, aprovacao.dataHora));
      if (envio && conclusao) completionTimes.push(diffHours(envio.dataHora, conclusao.dataHora));
    });

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    return {
      avgApproval: avg(approvalTimes),
      avgCompletion: avg(completionTimes),
      approvalCount: approvalTimes.length,
      completionCount: completionTimes.length,
    };
  }, [filtered]);

  // Solicitante ranking
  const solicitanteData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => { map[r.solicitante || "Não informado"] = (map[r.solicitante || "Não informado"] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [filtered]);

  // Reprovadas list
  const reprovadaList = useMemo(() => filtered.filter(r => r.status === "Reprovada"), [filtered]);

  // Pedidos pendentes
  const pendentesEntrega = useMemo(() => filtered.filter(r => ["Pedido Emitido", "Em Entrega"].includes(r.status)), [filtered]);

  // PDF Export
  const exportPdf = () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();

    doc.setFillColor(30, 58, 107);
    doc.rect(0, 0, pw, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Dashboard - Compras e Suprimentos", 14, 14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`, pw - 14, 14, { align: "right" });
    doc.text(`Período: ${periodo === "todos" ? "Todos" : `Últimos ${periodo} dias`}`, pw - 14, 20, { align: "right" });

    doc.setTextColor(30, 30, 30);
    let y = 38;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo Geral", 14, y); y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Total de Requisições: ${totalReqs}  |  Abertas: ${abertas}  |  Concluídas: ${concluidas}  |  Reprovadas: ${reprovadas}  |  Canceladas: ${canceladas}`, 14, y); y += 5;
    doc.text(`Total de Itens: ${totalItens}  |  Materiais cadastrados: ${materiais.length}`, 14, y); y += 5;
    doc.text(`Tempo Médio Aprovação: ${timeMetrics.approvalCount > 0 ? formatHours(timeMetrics.avgApproval) : "N/A"}  |  Tempo Médio Conclusão: ${timeMetrics.completionCount > 0 ? formatHours(timeMetrics.avgCompletion) : "N/A"}`, 14, y); y += 10;

    // Status table
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Distribuição por Status", 14, y); y += 2;
    autoTable(doc, {
      startY: y,
      head: [["Status", "Quantidade"]],
      body: statusData.map(s => [s.name, String(s.value)]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 107] },
      margin: { left: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Centro de custo
    if (centroCustoData.length > 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Requisições por Centro de Custo", 14, y); y += 2;
      autoTable(doc, {
        startY: y,
        head: [["Centro de Custo", "Quantidade"]],
        body: centroCustoData.map(c => [c.name, String(c.value)]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 107] },
        margin: { left: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // Reprovadas
    if (reprovadaList.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Processos Reprovados", 14, y); y += 2;
      autoTable(doc, {
        startY: y,
        head: [["Nº", "Data", "Solicitante", "Centro de Custo", "Motivo"]],
        body: reprovadaList.map(r => {
          const motivo = r.historicoStatus.find(h => h.status === "Reprovada")?.observacao || "-";
          return [String(r.numero), new Date(r.dataCriacao).toLocaleDateString("pt-BR"), r.solicitante, r.centroCustoNome, motivo];
        }),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [180, 30, 30] },
        margin: { left: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // Pendentes de entrega
    if (pendentesEntrega.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Pedidos Pendentes de Entrega", 14, y); y += 2;
      autoTable(doc, {
        startY: y,
        head: [["Nº", "Data", "Status", "Solicitante", "Itens"]],
        body: pendentesEntrega.map(r => [
          String(r.numero),
          new Date(r.dataCriacao).toLocaleDateString("pt-BR"),
          r.status,
          r.solicitante,
          String(r.itens.length),
        ]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [30, 100, 60] },
        margin: { left: 14 },
      });
    }

    doc.save("dashboard_compras.pdf");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard de Compras</h1>
        <div className="flex gap-3 items-center">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os períodos</SelectItem>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportPdf}><FileText className="mr-2 h-4 w-4" />Relatório PDF</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <ShoppingCart className="h-5 w-5 text-primary mb-1" />
            <span className="text-2xl font-bold text-foreground">{totalReqs}</span>
            <span className="text-xs text-muted-foreground">Total</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <Clock className="h-5 w-5 text-yellow-500 mb-1" />
            <span className="text-2xl font-bold text-foreground">{abertas}</span>
            <span className="text-xs text-muted-foreground">Em Andamento</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mb-1" />
            <span className="text-2xl font-bold text-foreground">{concluidas}</span>
            <span className="text-xs text-muted-foreground">Concluídas</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <XCircle className="h-5 w-5 text-destructive mb-1" />
            <span className="text-2xl font-bold text-foreground">{reprovadas}</span>
            <span className="text-xs text-muted-foreground">Reprovadas</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <Package className="h-5 w-5 text-blue-500 mb-1" />
            <span className="text-2xl font-bold text-foreground">{totalItens}</span>
            <span className="text-xs text-muted-foreground">Itens</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <TrendingUp className="h-5 w-5 text-purple-500 mb-1" />
            <span className="text-2xl font-bold text-foreground">
              {timeMetrics.approvalCount > 0 ? formatHours(timeMetrics.avgApproval) : "N/A"}
            </span>
            <span className="text-xs text-muted-foreground">Tempo Médio Aprovação</span>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Processos por Status</CardTitle></CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Distribuição por Urgência</CardTitle></CardHeader>
          <CardContent>
            {urgenciaData.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={urgenciaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Requisições" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Requisições por Centro de Custo</CardTitle></CardHeader>
          <CardContent>
            {centroCustoData.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={centroCustoData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="value" name="Requisições" fill="hsl(210, 70%, 55%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Evolução Mensal de Solicitações</CardTitle></CardHeader>
          <CardContent>
            {timelineData.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" name="Solicitações" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Categories & Solicitante */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Top Categorias (por qtd. itens)</CardTitle></CardHeader>
          <CardContent>
            {categoriaData.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={categoriaData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {categoriaData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Top Solicitantes</CardTitle></CardHeader>
          <CardContent>
            {solicitanteData.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={solicitanteData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="value" name="Requisições" fill="hsl(260, 60%, 55%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs with tables */}
      <Tabs defaultValue="pendentes">
        <TabsList>
          <TabsTrigger value="pendentes">Pendentes de Entrega ({pendentesEntrega.length})</TabsTrigger>
          <TabsTrigger value="reprovadas">Reprovadas ({reprovadaList.length})</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria Recente</TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Centro de Custo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Urgência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendentesEntrega.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Nenhum pedido pendente</TableCell></TableRow>
                  ) : pendentesEntrega.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-bold">{r.numero}</TableCell>
                      <TableCell>{new Date(r.dataCriacao).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{r.solicitante}</TableCell>
                      <TableCell>{r.centroCustoNome}</TableCell>
                      <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                      <TableCell>{r.itens.length}</TableCell>
                      <TableCell><Badge variant={r.urgencia === "Urgente" ? "destructive" : "secondary"}>{r.urgencia}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reprovadas">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Centro de Custo</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reprovadaList.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nenhum processo reprovado</TableCell></TableRow>
                  ) : reprovadaList.map(r => {
                    const motivo = r.historicoStatus.find(h => h.status === "Reprovada")?.observacao || "-";
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono font-bold">{r.numero}</TableCell>
                        <TableCell>{new Date(r.dataCriacao).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{r.solicitante}</TableCell>
                        <TableCell>{r.centroCustoNome}</TableCell>
                        <TableCell className="text-destructive">{motivo}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auditoria">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Requisição</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação (Status)</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const allEvents = filtered.flatMap(r =>
                      r.historicoStatus.map(h => ({ ...h, reqNumero: r.numero }))
                    ).sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()).slice(0, 50);

                    if (allEvents.length === 0) {
                      return <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Sem registros</TableCell></TableRow>;
                    }
                    return allEvents.map((ev, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{new Date(ev.dataHora).toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="font-mono font-bold">{ev.reqNumero}</TableCell>
                        <TableCell>{ev.usuario}</TableCell>
                        <TableCell><Badge variant="outline">{ev.status}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{ev.observacao || "-"}</TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Future modules notice */}
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground">
          <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
          <p className="text-sm font-medium">Métricas adicionais serão ativadas conforme os módulos forem implementados:</p>
          <p className="text-xs mt-1">Tempo médio de entrega por fornecedor • Volume comprado por fornecedor • Economia por cotação • Divergências no recebimento • Ranking de fornecedores • Entregas parciais • Não conformidades</p>
        </CardContent>
      </Card>
    </div>
  );
}
