import { useEffect, useMemo, useState } from "react";
import { usePmoc } from "@/contexts/PmocContext";
import { useEquipamentos } from "@/contexts/EquipamentosContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissao } from "@/hooks/usePermissao";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Wrench, CheckCircle2, ArrowLeft, CalendarClock, X,
  Clock, ShieldCheck, XCircle,
} from "lucide-react";

const PERIODICIDADE_ORDEM = ["Diária", "Semanal", "Quinzenal", "Mensal", "Bimestral", "Trimestral", "Semestral", "Anual"];

function addPeriodicidade(date: Date, periodicidade: string): Date {
  const d = new Date(date);
  switch ((periodicidade || "").trim()) {
    case "Diária": d.setDate(d.getDate() + 1); break;
    case "Semanal": d.setDate(d.getDate() + 7); break;
    case "Quinzenal": d.setDate(d.getDate() + 15); break;
    case "Mensal": d.setMonth(d.getMonth() + 1); break;
    case "Bimestral": d.setMonth(d.getMonth() + 2); break;
    case "Trimestral": d.setMonth(d.getMonth() + 3); break;
    case "Semestral": d.setMonth(d.getMonth() + 6); break;
    case "Anual": d.setFullYear(d.getFullYear() + 1); break;
    default: d.setMonth(d.getMonth() + 1);
  }
  return d;
}

function fmtDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const ALL = "__all__";

interface Execucao {
  id: string;
  atividade_id: string;
  plano_id: string | null;
  equipamento_id: string | null;
  equipamento_nome: string | null;
  atividade_descricao: string | null;
  periodicidade: string | null;
  data_execucao: string;
  proxima_execucao: string | null;
  status: string;
  registrado_por: string | null;
  confirmado_por: string | null;
  data_confirmacao: string | null;
  observacoes: string | null;
  created_at: string;
}

export default function PmocGerenciarOperacao() {
  const { atividades, planos, updateAtividade } = usePmoc();
  const { equipamentos } = useEquipamentos();
  const { usuarioLogado } = useAuth();
  const { tem } = usePermissao();
  const podeConfirmar = tem("pmoc.confirmar_execucao");
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filtroCliente, setFiltroCliente] = useState(ALL);
  const [filtroSetor, setFiltroSetor] = useState(ALL);
  const [filtroPeriodicidade, setFiltroPeriodicidade] = useState(ALL);
  const [selectedEquipId, setSelectedEquipId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [execucoes, setExecucoes] = useState<Execucao[]>([]);
  const [pendSelecionadas, setPendSelecionadas] = useState<Set<string>>(new Set());

  const carregarExecucoes = async () => {
    const { data, error } = await supabase
      .from("pmoc_atividades_execucoes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar execuções", description: error.message, variant: "destructive" });
      return;
    }
    setExecucoes((data || []) as Execucao[]);
  };
  useEffect(() => { carregarExecucoes(); }, []);

  const pendentes = useMemo(() => execucoes.filter((e) => e.status === "Pendente"), [execucoes]);
  const pendentesPorAtividade = useMemo(() => {
    const map = new Map<string, Execucao>();
    pendentes.forEach((p) => { if (!map.has(p.atividade_id)) map.set(p.atividade_id, p); });
    return map;
  }, [pendentes]);

  const equipamentosComPlano = useMemo(() => {
    const map = new Map<string, {
      id: string; nome: string; clienteNome: string; setorDescricao: string;
      periodicidades: Set<string>; atividades: typeof atividades;
    }>();
    atividades.forEach((a) => {
      if (!a.equipamentoId) return;
      const equip = equipamentos.find((e) => e.id === a.equipamentoId);
      const nome = equip
        ? `${equip.tag || ""} ${equip.equipamento || ""}`.trim() || a.equipamentoNome || "Equipamento"
        : a.equipamentoNome || "Equipamento";
      if (!map.has(a.equipamentoId)) {
        map.set(a.equipamentoId, {
          id: a.equipamentoId, nome,
          clienteNome: equip?.clienteNome || "",
          setorDescricao: equip?.setorDescricao || "",
          periodicidades: new Set<string>(),
          atividades: [],
        });
      }
      const entry = map.get(a.equipamentoId)!;
      entry.atividades.push(a);
      if (a.periodicidade) entry.periodicidades.add(a.periodicidade);
    });
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [atividades, equipamentos]);

  const clientesDisponiveis = useMemo(
    () => [...new Set(equipamentosComPlano.map((e) => e.clienteNome).filter(Boolean))].sort(),
    [equipamentosComPlano]
  );
  const setoresDisponiveis = useMemo(
    () => [...new Set(equipamentosComPlano.map((e) => e.setorDescricao).filter(Boolean))].sort(),
    [equipamentosComPlano]
  );

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return equipamentosComPlano.filter((e) => {
      if (s && !e.nome.toLowerCase().includes(s) &&
          !e.clienteNome.toLowerCase().includes(s) &&
          !e.setorDescricao.toLowerCase().includes(s)) return false;
      if (filtroCliente !== ALL && e.clienteNome !== filtroCliente) return false;
      if (filtroSetor !== ALL && e.setorDescricao !== filtroSetor) return false;
      if (filtroPeriodicidade !== ALL && !e.periodicidades.has(filtroPeriodicidade)) return false;
      return true;
    });
  }, [equipamentosComPlano, search, filtroCliente, filtroSetor, filtroPeriodicidade]);

  const limparFiltros = () => {
    setSearch(""); setFiltroCliente(ALL); setFiltroSetor(ALL); setFiltroPeriodicidade(ALL);
  };

  const selected = selectedEquipId ? equipamentosComPlano.find((e) => e.id === selectedEquipId) : null;
  const atividadesOrdenadas = useMemo(() => {
    if (!selected) return [];
    return [...selected.atividades].sort((a, b) => {
      const ia = PERIODICIDADE_ORDEM.indexOf(a.periodicidade);
      const ib = PERIODICIDADE_ORDEM.indexOf(b.periodicidade);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [selected]);

  const handleRegistrar = async (atividade: any) => {
    setBusy(true);
    try {
      const agora = new Date();
      const proxima = addPeriodicidade(agora, atividade.periodicidade);
      const equip = equipamentos.find((e) => e.id === atividade.equipamentoId);
      const equipNome = equip
        ? `${equip.tag || ""} ${equip.equipamento || ""}`.trim() || atividade.equipamentoNome
        : atividade.equipamentoNome;
      const { error } = await supabase.from("pmoc_atividades_execucoes").insert({
        atividade_id: atividade.id,
        plano_id: atividade.planoId || null,
        equipamento_id: atividade.equipamentoId || null,
        equipamento_nome: equipNome,
        atividade_descricao: atividade.descricao,
        periodicidade: atividade.periodicidade,
        data_execucao: agora.toISOString(),
        proxima_execucao: proxima.toISOString(),
        status: "Pendente",
        registrado_por: usuarioLogado?.nome || "",
      });
      if (error) throw error;
      toast({
        title: "Registro enviado",
        description: "A manutenção foi registrada e aguarda confirmação para ser concluída.",
      });
      await carregarExecucoes();
    } catch (e: any) {
      toast({ title: "Erro ao registrar", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const confirmarExecucoes = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!podeConfirmar) {
      toast({ title: "Sem permissão", description: "Você não pode confirmar execuções.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const agoraIso = new Date().toISOString();
      const alvo = execucoes.filter((e) => ids.includes(e.id) && e.status === "Pendente");
      // 1) Marca execuções como Confirmada
      const { error: errUp } = await supabase
        .from("pmoc_atividades_execucoes")
        .update({
          status: "Confirmada",
          confirmado_por: usuarioLogado?.nome || "",
          data_confirmacao: agoraIso,
        })
        .in("id", ids);
      if (errUp) throw errUp;
      // 2) Atualiza atividades (última/próxima) — só após confirmação
      await Promise.all(alvo.map((e) =>
        updateAtividade(e.atividade_id, {
          ultima_execucao: e.data_execucao,
          proxima_execucao: e.proxima_execucao,
        })
      ));
      toast({ title: "Manutenção concluída", description: `${alvo.length} execução(ões) confirmada(s).` });
      setPendSelecionadas(new Set());
      await carregarExecucoes();
    } catch (e: any) {
      toast({ title: "Erro ao confirmar", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const rejeitarExecucao = async (id: string) => {
    if (!podeConfirmar) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("pmoc_atividades_execucoes")
        .update({
          status: "Rejeitada",
          confirmado_por: usuarioLogado?.nome || "",
          data_confirmacao: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Registro rejeitado" });
      await carregarExecucoes();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const togglePend = (id: string) => {
    setPendSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleTodos = () => {
    if (pendSelecionadas.size === pendentes.length) setPendSelecionadas(new Set());
    else setPendSelecionadas(new Set(pendentes.map((p) => p.id)));
  };

  // ===================== DETALHE DO EQUIPAMENTO =====================
  if (selected) {
    const plano = planos.find((p) => p.id === selected.atividades[0]?.planoId);
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setSelectedEquipId(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <h1 className="text-2xl font-serif font-semibold">{selected.nome}</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" /> Manutenções do Equipamento
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {selected.clienteNome && <>Cliente: {selected.clienteNome} · </>}
              {selected.setorDescricao && <>Setor: {selected.setorDescricao}</>}
              {plano && <> · Plano: {plano.titulo}</>}
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Atividade</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Periodicidade</TableHead>
                  <TableHead>Última Execução</TableHead>
                  <TableHead>Próxima Execução</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atividadesOrdenadas.map((a) => {
                  const pend = pendentesPorAtividade.get(a.id);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.descricao || "—"}</TableCell>
                      <TableCell>{a.tipo}</TableCell>
                      <TableCell><Badge variant="secondary">{a.periodicidade}</Badge></TableCell>
                      <TableCell>{fmtDateTime(a.ultimaExecucao)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CalendarClock className="h-4 w-4 text-muted-foreground" />
                          {fmtDateTime(a.proximaExecucao)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {pend ? (
                          <Badge variant="outline" className="border-amber-500 text-amber-700">
                            <Clock className="h-3 w-3 mr-1" /> Aguardando confirmação
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-500 text-emerald-700">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleRegistrar(a)}
                          disabled={busy || !!pend}
                          title={pend ? "Já existe um registro pendente para esta atividade" : ""}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          {pend ? "Pendente" : "Registrar Manutenção"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {atividadesOrdenadas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                      Nenhuma atividade cadastrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  const algumFiltro = search || filtroCliente !== ALL || filtroSetor !== ALL || filtroPeriodicidade !== ALL;

  // ===================== LISTA + ABAS =====================
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-serif font-semibold">Gerenciar Operação</h1>

      <Tabs defaultValue="equipamentos">
        <TabsList>
          <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
          <TabsTrigger value="pendentes">
            Confirmações Pendentes
            {pendentes.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendentes.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        {/* ============== EQUIPAMENTOS ============== */}
        <TabsContent value="equipamentos">
          <Card>
            <CardHeader>
              <CardTitle>Equipamentos com Plano PMOC</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr_200px_200px_200px_auto]">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar equipamento, cliente ou setor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={filtroCliente} onValueChange={setFiltroCliente}>
                  <SelectTrigger><SelectValue placeholder="Cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos os clientes</SelectItem>
                    {clientesDisponiveis.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filtroSetor} onValueChange={setFiltroSetor}>
                  <SelectTrigger><SelectValue placeholder="Setor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos os setores</SelectItem>
                    {setoresDisponiveis.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filtroPeriodicidade} onValueChange={setFiltroPeriodicidade}>
                  <SelectTrigger><SelectValue placeholder="Periodicidade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todas periodicidades</SelectItem>
                    {PERIODICIDADE_ORDEM.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                {algumFiltro && (
                  <Button variant="ghost" onClick={limparFiltros}>
                    <X className="h-4 w-4 mr-1" /> Limpar
                  </Button>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead className="text-center">Atividades</TableHead>
                    <TableHead className="text-center">Pendentes</TableHead>
                    <TableHead>Próxima Manutenção</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => {
                    const proximas = e.atividades.map((a) => a.proximaExecucao).filter(Boolean).sort();
                    const proxima = proximas[0] || "";
                    const pendCount = e.atividades.filter((a) => pendentesPorAtividade.has(a.id)).length;
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.nome}</TableCell>
                        <TableCell>{e.clienteNome || "—"}</TableCell>
                        <TableCell>{e.setorDescricao || "—"}</TableCell>
                        <TableCell className="text-center">{e.atividades.length}</TableCell>
                        <TableCell className="text-center">
                          {pendCount > 0 ? (
                            <Badge variant="outline" className="border-amber-500 text-amber-700">{pendCount}</Badge>
                          ) : "—"}
                        </TableCell>
                        <TableCell>{fmtDateTime(proxima)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => setSelectedEquipId(e.id)}>
                            <Wrench className="h-4 w-4 mr-1" /> Operar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                        Nenhum equipamento com plano PMOC encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============== PENDENTES ============== */}
        <TabsContent value="pendentes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" /> Aguardando Confirmação
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Apenas usuários com permissão "Confirmar execução de manutenção" podem concluir.
                </p>
              </div>
              {podeConfirmar && pendSelecionadas.size > 0 && (
                <Button
                  onClick={() => confirmarExecucoes(Array.from(pendSelecionadas))}
                  disabled={busy}
                >
                  <ShieldCheck className="h-4 w-4 mr-1" />
                  Confirmar selecionadas ({pendSelecionadas.size})
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {podeConfirmar && (
                      <TableHead className="w-10">
                        <Checkbox
                          checked={pendentes.length > 0 && pendSelecionadas.size === pendentes.length}
                          onCheckedChange={toggleTodos}
                        />
                      </TableHead>
                    )}
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Atividade</TableHead>
                    <TableHead>Periodicidade</TableHead>
                    <TableHead>Executada em</TableHead>
                    <TableHead>Próxima</TableHead>
                    <TableHead>Registrado por</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendentes.map((p) => (
                    <TableRow key={p.id}>
                      {podeConfirmar && (
                        <TableCell>
                          <Checkbox
                            checked={pendSelecionadas.has(p.id)}
                            onCheckedChange={() => togglePend(p.id)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{p.equipamento_nome || "—"}</TableCell>
                      <TableCell>{p.atividade_descricao || "—"}</TableCell>
                      <TableCell><Badge variant="secondary">{p.periodicidade}</Badge></TableCell>
                      <TableCell>{fmtDateTime(p.data_execucao)}</TableCell>
                      <TableCell>{fmtDateTime(p.proxima_execucao || "")}</TableCell>
                      <TableCell>{p.registrado_por || "—"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {podeConfirmar ? (
                          <>
                            <Button size="sm" onClick={() => confirmarExecucoes([p.id])} disabled={busy}>
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Confirmar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => rejeitarExecucao(p.id)} disabled={busy}>
                              <XCircle className="h-4 w-4 mr-1" /> Rejeitar
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem permissão</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {pendentes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={podeConfirmar ? 8 : 7} className="text-center text-muted-foreground py-6">
                        Nenhum registro pendente.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============== HISTÓRICO ============== */}
        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Execuções</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Atividade</TableHead>
                    <TableHead>Executada em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registrado por</TableHead>
                    <TableHead>Confirmado por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {execucoes.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.equipamento_nome || "—"}</TableCell>
                      <TableCell>{p.atividade_descricao || "—"}</TableCell>
                      <TableCell>{fmtDateTime(p.data_execucao)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          p.status === "Confirmada" ? "default"
                            : p.status === "Rejeitada" ? "destructive" : "outline"
                        }>{p.status}</Badge>
                      </TableCell>
                      <TableCell>{p.registrado_por || "—"}</TableCell>
                      <TableCell>{p.confirmado_por || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {execucoes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        Nenhum registro.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
