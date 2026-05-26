import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Check } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import { useFinanceiro, formatBRL } from "@/contexts/FinanceiroContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useFuncionarios } from "@/contexts/FuncionariosContext";
import { useCargos } from "@/contexts/CargosContext";
import { usePedidoCompra } from "@/contexts/PedidoCompraContext";
import { useRequisicaoCompras } from "@/contexts/RequisicaoComprasContext";
import { useOrdensServico } from "@/contexts/OrdensServicoContext";
import { useSolicitacoesServicos } from "@/contexts/SolicitacoesServicosContext";

const COLORS = ["#673ab7", "#9575cd", "#5e35b1", "#b39ddb", "#7e57c2", "#4527a0", "#311b92", "#d1c4e9"];

type ModKey = "os" | "ss" | "pc" | "rc" | "func" | "cp" | "cr";

interface ModDef {
  key: ModKey;
  label: string;
  color: string;
}

const MODULOS: ModDef[] = [
  { key: "os", label: "Ordens de Serviço", color: "#673ab7" },
  { key: "ss", label: "Solicitações de Serviço", color: "#5e35b1" },
  { key: "pc", label: "Pedidos de Compra", color: "#7e57c2" },
  { key: "rc", label: "Requisições de Compras", color: "#9575cd" },
  { key: "func", label: "Funcionários", color: "#4527a0" },
  { key: "cp", label: "Contas a Pagar", color: "#c62828" },
  { key: "cr", label: "Contas a Receber", color: "#2e7d32" },
];

const monthOf = (d?: string | null) => (d ? String(d).slice(0, 7) : "—");

function groupCount<T>(arr: T[], get: (x: T) => string): { name: string; value: number }[] {
  const m: Record<string, number> = {};
  arr.forEach((r) => {
    const k = get(r) || "—";
    m[k] = (m[k] || 0) + 1;
  });
  return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function groupSum<T>(arr: T[], getKey: (x: T) => string, getVal: (x: T) => number) {
  const m: Record<string, number> = {};
  arr.forEach((r) => {
    const k = getKey(r) || "—";
    m[k] = (m[k] || 0) + (getVal(r) || 0);
  });
  return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function KPI({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="h-[280px]">{children}</CardContent>
    </Card>
  );
}

export default function DashboardMultisistemico() {
  const fin = useFinanceiro();
  const { clientes } = useClientes();
  const { funcionarios } = useFuncionarios();
  const { cargos } = useCargos();
  const { pedidos } = usePedidoCompra();
  const { requisicoes } = useRequisicaoCompras();
  const { ordens } = useOrdensServico();
  const { solicitacoes } = useSolicitacoesServicos();

  const cargoNome = (id: string) => cargos.find((c) => c.id === id)?.nome || "—";
  const clienteNome = (id?: string | null) => clientes.find((c) => c.id === id)?.nome || "—";

  const hoje = new Date().toISOString().slice(0, 10);
  const inicioAno = `${new Date().getFullYear()}-01-01`;
  const [dataIni, setDataIni] = useState(inicioAno);
  const [dataFim, setDataFim] = useState(hoje);

  const [ativos, setAtivos] = useState<ModKey[]>(["os", "ss", "pc", "func", "cp", "cr"]);
  const toggle = (k: ModKey) =>
    setAtivos((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));
  const todos = () => setAtivos(MODULOS.map((m) => m.key));
  const nenhum = () => setAtivos([]);

  const filtrarPorData = <T,>(arr: T[], getDate: (r: T) => string | null | undefined) =>
    arr.filter((r) => {
      const d = getDate(r);
      if (!d) return true;
      const s = String(d).slice(0, 10);
      return s >= dataIni && s <= dataFim;
    });

  // Datasets filtrados
  const fOrdens = useMemo(() => filtrarPorData(ordens, (r: any) => r.createdAt), [ordens, dataIni, dataFim]);
  const fSol = useMemo(() => filtrarPorData(solicitacoes, (r: any) => r.createdAt), [solicitacoes, dataIni, dataFim]);
  const fPed = useMemo(() => filtrarPorData(pedidos, (r: any) => r.dataCriacao), [pedidos, dataIni, dataFim]);
  const fReq = useMemo(() => filtrarPorData(requisicoes, (r: any) => r.dataCriacao), [requisicoes, dataIni, dataFim]);
  const fFunc = useMemo(() => filtrarPorData(funcionarios, (r: any) => r.dataAdmissao), [funcionarios, dataIni, dataFim]);
  const fCp = useMemo(() => filtrarPorData(fin.contasPagar, (r: any) => r.data_vencimento), [fin.contasPagar, dataIni, dataFim]);
  const fCr = useMemo(() => filtrarPorData(fin.contasReceber, (r: any) => r.data_vencimento), [fin.contasReceber, dataIni, dataFim]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-serif font-semibold">Dashboard Multisistêmico</h1>
          <p className="text-sm text-muted-foreground">
            Visão consolidada de todos os módulos. Selecione os que deseja visualizar.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Configuração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Período Início</Label>
              <Input type="date" value={dataIni} onChange={(e) => setDataIni(e.target.value)} />
            </div>
            <div>
              <Label>Período Fim</Label>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={todos}>Selecionar todos</Button>
              <Button type="button" variant="outline" size="sm" onClick={nenhum}>Limpar</Button>
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Módulos exibidos</Label>
            <div className="flex flex-wrap gap-2">
              {MODULOS.map((m) => {
                const on = ativos.includes(m.key);
                return (
                  <Badge
                    key={m.key}
                    onClick={() => toggle(m.key)}
                    variant={on ? "default" : "outline"}
                    className="cursor-pointer gap-1 px-3 py-1.5 text-xs select-none"
                  >
                    {on && <Check className="h-3 w-3" />} {m.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {ativos.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12">
          Selecione um ou mais módulos para visualizar.
        </p>
      )}

      {/* OS */}
      {ativos.includes("os") && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Ordens de Serviço</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI label="Total OS" value={fOrdens.length} />
            <KPI label="Em Execução" value={fOrdens.filter((o: any) => o.situacao === "Em Execução").length} />
            <KPI label="Concluídas" value={fOrdens.filter((o: any) => o.situacao === "Concluída").length} />
            <KPI label="Canceladas" value={fOrdens.filter((o: any) => o.situacao === "Cancelada").length} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ChartCard title="OS por Situação">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={groupCount(fOrdens, (r: any) => r.situacao)} dataKey="value" nameKey="name" outerRadius={90} label>
                    {groupCount(fOrdens, (r: any) => r.situacao).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="OS por Cliente (Top 10)">
              <ResponsiveContainer>
                <BarChart data={groupCount(fOrdens, (r: any) => r.clienteNome).slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#673ab7" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </section>
      )}

      {/* SS */}
      {ativos.includes("ss") && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Solicitações de Serviço</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI label="Total SS" value={fSol.length} />
            <KPI label="Aprovadas" value={fSol.filter((s: any) => s.situacao === "Aprovada").length} />
            <KPI label="Pendentes" value={fSol.filter((s: any) => s.situacao === "Pendente").length} />
            <KPI label="Rejeitadas" value={fSol.filter((s: any) => s.situacao === "Rejeitada").length} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ChartCard title="SS por Situação">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={groupCount(fSol, (r: any) => r.situacao)} dataKey="value" nameKey="name" outerRadius={90} label>
                    {groupCount(fSol, (r: any) => r.situacao).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="SS por Mês">
              <ResponsiveContainer>
                <BarChart data={groupCount(fSol, (r: any) => monthOf(r.createdAt))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#5e35b1" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </section>
      )}

      {/* PC */}
      {ativos.includes("pc") && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Pedidos de Compra</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI label="Total Pedidos" value={fPed.length} />
            <KPI label="Valor Total" value={formatBRL(fPed.reduce((s, p: any) => s + Number(p.valorTotal || 0), 0))} />
            <KPI label="Aprovados" value={fPed.filter((p: any) => p.status === "Aprovado").length} />
            <KPI label="Pendentes" value={fPed.filter((p: any) => p.status === "Pendente").length} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ChartCard title="Valor por Fornecedor (Top 10)">
              <ResponsiveContainer>
                <BarChart data={groupSum(fPed, (r: any) => r.fornecedorNome, (r: any) => Number(r.valorTotal || 0)).slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                  <Bar dataKey="value" fill="#7e57c2" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Pedidos por Status">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={groupCount(fPed, (r: any) => r.status)} dataKey="value" nameKey="name" outerRadius={90} label>
                    {groupCount(fPed, (r: any) => r.status).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </section>
      )}

      {/* RC */}
      {ativos.includes("rc") && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Requisições de Compras</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI label="Total RC" value={fReq.length} />
            <KPI label="Em Cotação" value={fReq.filter((r: any) => r.status === "Em Cotação").length} />
            <KPI label="Aprovadas" value={fReq.filter((r: any) => r.status === "Aprovada").length} />
            <KPI label="Concluídas" value={fReq.filter((r: any) => r.status === "Concluída").length} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ChartCard title="RC por Status">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={groupCount(fReq, (r: any) => r.status)} dataKey="value" nameKey="name" outerRadius={90} label>
                    {groupCount(fReq, (r: any) => r.status).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="RC por Centro de Custo (Top 10)">
              <ResponsiveContainer>
                <BarChart data={groupCount(fReq, (r: any) => r.centroCustoNome).slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#9575cd" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </section>
      )}

      {/* Funcionários */}
      {ativos.includes("func") && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Funcionários</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI label="Total" value={funcionarios.length} />
            <KPI label="Ativos" value={funcionarios.filter((f: any) => f.status === "Ativo").length} />
            <KPI label="Inativos" value={funcionarios.filter((f: any) => f.status !== "Ativo").length} />
            <KPI label="Admissões no Período" value={fFunc.length} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ChartCard title="Funcionários por Cliente (Top 10)">
              <ResponsiveContainer>
                <BarChart data={groupCount(funcionarios, (f: any) => clienteNome(f.clienteId)).slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4527a0" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Funcionários por Cargo (Top 10)">
              <ResponsiveContainer>
                <BarChart data={groupCount(funcionarios, (f: any) => cargoNome(f.cargoId)).slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#311b92" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </section>
      )}

      {/* Contas a Pagar */}
      {ativos.includes("cp") && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Contas a Pagar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI label="Total Lançado" value={formatBRL(fCp.reduce((s, c: any) => s + Number(c.valor_total || 0), 0))} />
            <KPI label="Total Pago" value={formatBRL(fCp.reduce((s, c: any) => s + Number(c.valor_pago || 0), 0))} />
            <KPI label="Em Aberto" value={fCp.filter((c: any) => c.status !== "Pago").length} />
            <KPI label="Quitadas" value={fCp.filter((c: any) => c.status === "Pago").length} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ChartCard title="Pagar por Status">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={groupCount(fCp, (r: any) => r.status)} dataKey="value" nameKey="name" outerRadius={90} label>
                    {groupCount(fCp, (r: any) => r.status).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Valor por Mês (Vencimento)">
              <ResponsiveContainer>
                <BarChart data={groupSum(fCp, (r: any) => monthOf(r.data_vencimento), (r: any) => Number(r.valor_total || 0))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                  <Bar dataKey="value" fill="#c62828" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </section>
      )}

      {/* Contas a Receber */}
      {ativos.includes("cr") && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Contas a Receber</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI label="Total Lançado" value={formatBRL(fCr.reduce((s, c: any) => s + Number(c.valor_total || 0), 0))} />
            <KPI label="Total Recebido" value={formatBRL(fCr.reduce((s, c: any) => s + Number(c.valor_recebido || 0), 0))} />
            <KPI label="Em Aberto" value={fCr.filter((c: any) => c.status !== "Recebido").length} />
            <KPI label="Recebidas" value={fCr.filter((c: any) => c.status === "Recebido").length} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ChartCard title="Receber por Status">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={groupCount(fCr, (r: any) => r.status)} dataKey="value" nameKey="name" outerRadius={90} label>
                    {groupCount(fCr, (r: any) => r.status).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Valor por Mês (Vencimento)">
              <ResponsiveContainer>
                <BarChart data={groupSum(fCr, (r: any) => monthOf(r.data_vencimento), (r: any) => Number(r.valor_total || 0))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                  <Bar dataKey="value" fill="#2e7d32" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </section>
      )}
    </div>
  );
}
