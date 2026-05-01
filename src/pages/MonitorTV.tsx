import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClientes } from "@/contexts/ClientesContext";
import { useSolicitacoesServicos } from "@/contexts/SolicitacoesServicosContext";
import { useOrdensServico } from "@/contexts/OrdensServicoContext";
import { useRequisicaoCompras } from "@/contexts/RequisicaoComprasContext";
import { usePedidoCompra } from "@/contexts/PedidoCompraContext";
import { useRequisicoes } from "@/contexts/RequisicaoContext";
import { useLicitacoes } from "@/contexts/LicitacoesContext";
import { Settings, Maximize2, Minimize2, ClipboardList, ShoppingCart, Users, Gavel, Clock } from "lucide-react";

const STORAGE_KEY = "monitor-tv-clientes";
const ROTATION_MS = 3 * 60 * 1000; // 3 min
const Q4_TOGGLE_MS = 30 * 1000; // 30 s

const fmtMoney = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// Agrupa um array por chave -> { chave: count }
const countBy = <T,>(arr: T[], key: (i: T) => string) => {
  const map: Record<string, number> = {};
  arr.forEach((i) => {
    const k = key(i) || "—";
    map[k] = (map[k] || 0) + 1;
  });
  return map;
};

const isMesAtual = (iso: string) => {
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  const hoje = new Date();
  return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
};

const STATUS_FINAIS_OS = ["Concluída", "Encerrada", "Cancelada", "Faturada"];
const STATUS_FINAIS_SS = ["Concluída", "Cancelada", "Reprovada"];
const STATUS_FINAIS_RC = ["Concluída", "Cancelada", "Recebida", "Reprovada"];
const STATUS_FINAIS_PED = ["Recebido Total", "Cancelado", "Concluído"];
const STATUS_FINAIS_REQ = ["Concluída", "Reprovada"];

const StatusPill = ({ label, count }: { label: string; count: number }) => (
  <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2">
    <span className="text-sm text-white/80">{label}</span>
    <span className="text-lg font-bold text-white">{count}</span>
  </div>
);

const KpiBox = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="rounded-lg border border-white/10 bg-gradient-to-br from-white/10 to-white/5 px-4 py-3">
    <div className="text-xs uppercase tracking-wide text-white/60">{label}</div>
    <div className="text-2xl font-extrabold text-white">{value}</div>
    {sub && <div className="text-xs text-white/50">{sub}</div>}
  </div>
);

interface QuadrantProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: string;
}
const Quadrant = ({ title, icon, children, badge }: QuadrantProps) => (
  <Card className="flex h-full flex-col overflow-hidden border-white/10 bg-gradient-to-br from-[#1a1330] to-[#0f0a1f] text-white shadow-2xl">
    <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 px-5 py-3">
      <CardTitle className="flex items-center gap-2 text-base font-semibold uppercase tracking-wide text-white/90">
        <span className="rounded-md bg-primary/30 p-1.5 text-primary-foreground">{icon}</span>
        {title}
      </CardTitle>
      {badge && (
        <Badge variant="outline" className="border-primary/40 bg-primary/20 text-white">
          {badge}
        </Badge>
      )}
    </CardHeader>
    <CardContent className="flex-1 overflow-hidden p-4">{children}</CardContent>
  </Card>
);

const MonitorTV = () => {
  const { clientes } = useClientes();
  const { solicitacoes } = useSolicitacoesServicos();
  const { ordens } = useOrdensServico();
  const { requisicoes: rcs } = useRequisicaoCompras();
  const { pedidos } = usePedidoCompra();
  const { requisicoes: rps } = useRequisicoes();
  const { licitacoes } = useLicitacoes();

  // ====== Seleção de clientes para rotação ======
  const [clientesSelecionados, setClientesSelecionados] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* noop */ }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clientesSelecionados));
  }, [clientesSelecionados]);

  // Default: se nada selecionado, usa todos
  const clientesAtivos = useMemo(() => {
    const ativos = clientes.filter((c) => clientesSelecionados.length === 0 || clientesSelecionados.includes(c.id));
    return ativos.length > 0 ? ativos : clientes;
  }, [clientes, clientesSelecionados]);

  // ====== Rotação sincronizada (Q1, Q2, Q3) ======
  const [idxCliente, setIdxCliente] = useState(0);
  const [tickRestante, setTickRestante] = useState(ROTATION_MS / 1000);

  useEffect(() => {
    if (clientesAtivos.length === 0) return;
    setIdxCliente((i) => i % clientesAtivos.length);
  }, [clientesAtivos.length]);

  useEffect(() => {
    if (clientesAtivos.length <= 1) return;
    const i = setInterval(() => setIdxCliente((v) => (v + 1) % clientesAtivos.length), ROTATION_MS);
    return () => clearInterval(i);
  }, [clientesAtivos.length]);

  // Contagem regressiva visual
  useEffect(() => {
    setTickRestante(ROTATION_MS / 1000);
    const i = setInterval(() => setTickRestante((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(i);
  }, [idxCliente]);

  const clienteAtual = clientesAtivos[idxCliente];

  // ====== Q4 alternância ======
  const [q4View, setQ4View] = useState<"sessoes" | "kpis">("sessoes");
  useEffect(() => {
    const i = setInterval(() => setQ4View((v) => (v === "sessoes" ? "kpis" : "sessoes")), Q4_TOGGLE_MS);
    return () => clearInterval(i);
  }, []);

  // ====== Helpers de filtro temporal: "tudo em aberto + mês fechado" ======
  // Inclui registros NÃO finalizados (independente da data) + finalizados do mês atual
  const filtraEmAbertoMaisMes = <T extends { situacao?: string; status?: string; createdAt?: string; created_at?: string; dataCriacao?: string }>(
    arr: T[],
    statusFinais: string[],
  ) => {
    return arr.filter((it) => {
      const st = (it.situacao || it.status || "") as string;
      const finalizado = statusFinais.some((f) => st.toLowerCase().includes(f.toLowerCase()));
      if (!finalizado) return true;
      const dt = (it as any).createdAt || (it as any).created_at || (it as any).dataCriacao;
      return isMesAtual(dt);
    });
  };

  // ====== Q1: SS + OS por cliente ======
  const ssCliente = useMemo(() => {
    if (!clienteAtual) return [];
    return filtraEmAbertoMaisMes(
      solicitacoes.filter((s) => s.clienteId === clienteAtual.id),
      STATUS_FINAIS_SS,
    );
  }, [solicitacoes, clienteAtual]);

  const osCliente = useMemo(() => {
    if (!clienteAtual) return [];
    return filtraEmAbertoMaisMes(
      ordens.filter((o) => o.clienteId === clienteAtual.id),
      STATUS_FINAIS_OS,
    );
  }, [ordens, clienteAtual]);

  const valorOsCliente = useMemo(() => {
    return osCliente.reduce((sum, o) => {
      const subtotal =
        (o.materiais || []).reduce((s, m) => s + (Number(m.valorTotal) || 0), 0) +
        (o.materiaisEstoque || []).reduce((s, m) => s + (Number(m.valorTotal) || 0), 0);
      const bdi = Number(o.bdi) || 0;
      return sum + subtotal * (1 + bdi / 100);
    }, 0);
  }, [osCliente]);

  const ssStatus = useMemo(() => countBy(ssCliente, (s: any) => s.situacao), [ssCliente]);
  const osStatus = useMemo(() => countBy(osCliente, (o: any) => o.situacao), [osCliente]);

  // ====== Q2: Compras por cliente (via centroCustoNome) + consolidado ======
  const rcsCliente = useMemo(() => {
    if (!clienteAtual) return [];
    return filtraEmAbertoMaisMes(
      rcs.filter((r) => (r.centroCustoNome || "").toLowerCase().includes(clienteAtual.nome.toLowerCase())),
      STATUS_FINAIS_RC,
    );
  }, [rcs, clienteAtual]);

  const rcsConsolidado = useMemo(() => filtraEmAbertoMaisMes(rcs, STATUS_FINAIS_RC), [rcs]);
  const pedidosConsolidado = useMemo(() => filtraEmAbertoMaisMes(pedidos, STATUS_FINAIS_PED), [pedidos]);

  const rcsStatus = useMemo(() => countBy(rcsCliente, (r: any) => r.status), [rcsCliente]);
  const pedidosStatus = useMemo(() => countBy(pedidosConsolidado, (p: any) => p.status), [pedidosConsolidado]);
  const valorPedidosConsolidado = useMemo(
    () => pedidosConsolidado.reduce((s, p) => s + (Number(p.valorTotal) || 0), 0),
    [pedidosConsolidado],
  );

  // ====== Q3: Requisições de Pessoal por cliente (via unidade) + consolidado ======
  const rpsCliente = useMemo(() => {
    if (!clienteAtual) return [];
    return rps.filter(
      (r) =>
        !STATUS_FINAIS_REQ.includes(r.status) &&
        (r.unidade || "").toLowerCase().includes(clienteAtual.nome.toLowerCase()),
    );
  }, [rps, clienteAtual]);

  const rpsConsolidado = useMemo(() => rps.filter((r) => !STATUS_FINAIS_REQ.includes(r.status)), [rps]);
  const rpsStatus = useMemo(() => countBy(rpsCliente, (r: any) => r.status), [rpsCliente]);
  const rpsConsolStatus = useMemo(() => countBy(rpsConsolidado, (r: any) => r.status), [rpsConsolidado]);

  // ====== Q4: Licitações ======
  const proxSessoes = useMemo(() => {
    const hoje = new Date();
    const lim = new Date();
    lim.setDate(lim.getDate() + 30);
    return licitacoes
      .filter((l) => {
        if (!l.dataSessao) return false;
        const d = new Date(l.dataSessao);
        return d >= hoje && d <= lim;
      })
      .sort((a, b) => new Date(a.dataSessao).getTime() - new Date(b.dataSessao).getTime())
      .slice(0, 8);
  }, [licitacoes]);

  const licStatus = useMemo(() => countBy(licitacoes, (l: any) => l.status), [licitacoes]);
  const valorEstimadoTotal = useMemo(
    () => licitacoes.filter((l) => !["Perdida", "Cancelada"].includes(l.status))
      .reduce((s, l) => s + (Number(l.valorEstimado) || 0), 0),
    [licitacoes],
  );
  const taxaExito = useMemo(() => {
    const julgadas = licitacoes.filter((l) => ["Vencida", "Perdida"].includes(l.status)).length;
    const ganhas = licitacoes.filter((l) => l.status === "Vencida").length;
    return julgadas > 0 ? Math.round((ganhas / julgadas) * 100) : 0;
  }, [licitacoes]);
  const topOportunidades = useMemo(
    () =>
      licitacoes
        .filter((l) => ["Novo", "Em Análise", "Participando"].includes(l.status))
        .sort((a, b) => (b.valorEstimado || 0) - (a.valorEstimado || 0))
        .slice(0, 6),
    [licitacoes],
  );

  // ====== Fullscreen ======
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFs, setIsFs] = useState(false);
  const toggleFs = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFs(true);
    } else {
      await document.exitFullscreen();
      setIsFs(false);
    }
  };
  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full bg-gradient-to-br from-[#0a0618] via-[#0f0a1f] to-[#1a1030] p-4 text-white"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold tracking-tight">
            Painel de Indicadores <span className="text-primary">Lasant</span>
          </div>
          {clienteAtual && (
            <Badge className="bg-primary/30 text-base text-white">
              Cliente: {clienteAtual.nome}
            </Badge>
          )}
          {clientesAtivos.length > 1 && (
            <span className="flex items-center gap-1 text-xs text-white/60">
              <Clock className="h-3 w-3" />
              próximo em {Math.floor(tickRestante / 60)}:
              {String(tickRestante % 60).padStart(2, "0")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70">
            {now.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" })}
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                <Settings className="mr-1 h-4 w-4" /> Clientes
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="mb-2 text-sm font-semibold">Clientes a exibir no painel</div>
              <div className="mb-2 flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setClientesSelecionados([])}>
                  Todos
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setClientesSelecionados(clientes.map((c) => c.id))}>
                  Marcar todos
                </Button>
              </div>
              <ScrollArea className="h-72">
                <div className="space-y-1.5 pr-2">
                  {clientes.map((c) => {
                    const checked = clientesSelecionados.includes(c.id);
                    return (
                      <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded p-1 hover:bg-muted">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => {
                            setClientesSelecionados((prev) =>
                              v ? [...prev, c.id] : prev.filter((id) => id !== c.id),
                            );
                          }}
                        />
                        <span className="text-sm">{c.nome}</span>
                      </label>
                    );
                  })}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFs}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            {isFs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Grid 2x2 */}
      <div className="grid h-[calc(100vh-90px)] grid-cols-2 grid-rows-2 gap-4">
        {/* Q1 - SS + OS */}
        <Quadrant
          title="Solicitações & Ordens de Serviço"
          icon={<ClipboardList className="h-4 w-4" />}
          badge={clienteAtual ? clienteAtual.nome : "—"}
        >
          <div className="grid h-full grid-cols-2 gap-4">
            <div className="flex flex-col">
              <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/70">
                Solicitações de Serviço ({ssCliente.length})
              </div>
              <div className="flex-1 space-y-2 overflow-auto">
                {Object.keys(ssStatus).length === 0 ? (
                  <p className="text-sm text-white/40">Sem registros.</p>
                ) : (
                  Object.entries(ssStatus)
                    .sort((a, b) => b[1] - a[1])
                    .map(([k, v]) => <StatusPill key={k} label={k} count={v} />)
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="mb-2 flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-white/70">
                <span>Ordens de Serviço ({osCliente.length})</span>
                <span className="text-primary">{fmtMoney(valorOsCliente)}</span>
              </div>
              <div className="flex-1 space-y-2 overflow-auto">
                {Object.keys(osStatus).length === 0 ? (
                  <p className="text-sm text-white/40">Sem registros.</p>
                ) : (
                  Object.entries(osStatus)
                    .sort((a, b) => b[1] - a[1])
                    .map(([k, v]) => <StatusPill key={k} label={k} count={v} />)
                )}
              </div>
            </div>
          </div>
        </Quadrant>

        {/* Q2 - Compras */}
        <Quadrant
          title="Compras (RCS & Pedidos)"
          icon={<ShoppingCart className="h-4 w-4" />}
          badge={`${clienteAtual?.nome ?? "—"} + Consolidado`}
        >
          <div className="grid h-full grid-cols-2 gap-4">
            <div className="flex flex-col">
              <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/70">
                RCS deste cliente ({rcsCliente.length})
              </div>
              <div className="flex-1 space-y-2 overflow-auto">
                {Object.keys(rcsStatus).length === 0 ? (
                  <p className="text-sm text-white/40">Sem registros.</p>
                ) : (
                  Object.entries(rcsStatus)
                    .sort((a, b) => b[1] - a[1])
                    .map(([k, v]) => <StatusPill key={k} label={k} count={v} />)
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/70">Consolidado Geral</div>
              <div className="grid grid-cols-2 gap-2">
                <KpiBox label="RCS em aberto" value={rcsConsolidado.length} />
                <KpiBox label="Pedidos" value={pedidosConsolidado.length} sub={fmtMoney(valorPedidosConsolidado)} />
              </div>
              <div className="mt-2 flex-1 space-y-1.5 overflow-auto">
                <div className="text-xs uppercase tracking-wide text-white/50">Pedidos por status</div>
                {Object.entries(pedidosStatus)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, v]) => (
                    <StatusPill key={k} label={k} count={v} />
                  ))}
              </div>
            </div>
          </div>
        </Quadrant>

        {/* Q3 - Requisições de Pessoal */}
        <Quadrant
          title="Requisições de Pessoal"
          icon={<Users className="h-4 w-4" />}
          badge={`${clienteAtual?.nome ?? "—"} + Consolidado`}
        >
          <div className="grid h-full grid-cols-2 gap-4">
            <div className="flex flex-col">
              <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/70">
                Por unidade/cliente ({rpsCliente.length})
              </div>
              <div className="flex-1 space-y-2 overflow-auto">
                {Object.keys(rpsStatus).length === 0 ? (
                  <p className="text-sm text-white/40">Sem registros.</p>
                ) : (
                  Object.entries(rpsStatus)
                    .sort((a, b) => b[1] - a[1])
                    .map(([k, v]) => <StatusPill key={k} label={k} count={v} />)
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/70">
                Consolidado ({rpsConsolidado.length})
              </div>
              <div className="flex-1 space-y-2 overflow-auto">
                {Object.entries(rpsConsolStatus)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, v]) => (
                    <StatusPill key={k} label={k} count={v} />
                  ))}
              </div>
            </div>
          </div>
        </Quadrant>

        {/* Q4 - Licitações */}
        <Quadrant
          title="Licitações"
          icon={<Gavel className="h-4 w-4" />}
          badge={q4View === "sessoes" ? "Próximas Sessões" : "KPIs & Ranking"}
        >
          {q4View === "sessoes" ? (
            <div className="flex h-full flex-col">
              <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/70">
                Sessões nos próximos 30 dias
              </div>
              <div className="flex-1 space-y-1.5 overflow-auto">
                {proxSessoes.length === 0 ? (
                  <p className="text-sm text-white/40">Nenhuma sessão agendada.</p>
                ) : (
                  proxSessoes.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-white">
                          {l.numeroEdital || l.numeroProcesso || "—"} · {l.orgaoLicitante}
                        </div>
                        <div className="truncate text-xs text-white/60">{l.objetoResumido}</div>
                      </div>
                      <div className="ml-3 text-right">
                        <div className="text-sm font-bold text-primary">
                          {new Date(l.dataSessao).toLocaleDateString("pt-BR")}
                        </div>
                        <div className="text-xs text-white/60">{fmtMoney(l.valorEstimado || 0)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 border-t border-white/10 pt-2">
                {Object.entries(licStatus)
                  .slice(0, 6)
                  .map(([k, v]) => (
                    <div key={k} className="rounded-md bg-white/5 px-2 py-1 text-center">
                      <div className="text-[10px] uppercase text-white/50">{k}</div>
                      <div className="text-base font-bold text-white">{v}</div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="mb-3 grid grid-cols-3 gap-2">
                <KpiBox label="Total" value={licitacoes.length} />
                <KpiBox label="Valor estimado" value={fmtMoney(valorEstimadoTotal)} />
                <KpiBox label="Taxa de êxito" value={`${taxaExito}%`} />
              </div>
              <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/70">
                Maiores oportunidades em aberto
              </div>
              <div className="flex-1 space-y-1.5 overflow-auto">
                {topOportunidades.length === 0 ? (
                  <p className="text-sm text-white/40">Sem oportunidades em aberto.</p>
                ) : (
                  topOportunidades.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{l.orgaoLicitante}</div>
                        <div className="truncate text-xs text-white/60">{l.objetoResumido}</div>
                      </div>
                      <div className="ml-2 text-right">
                        <div className="text-sm font-bold text-primary">{fmtMoney(l.valorEstimado || 0)}</div>
                        <div className="text-[10px] text-white/50">{l.status}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </Quadrant>
      </div>
    </div>
  );
};

export default MonitorTV;
