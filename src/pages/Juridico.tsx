import { useState, useMemo, useEffect, useCallback } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Scale, Plus, Eye, Edit, Trash2, FileText, Calendar, AlertTriangle, DollarSign, BarChart3, Users, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useProcessosTrabalhistas, ProcessoTrabalhista, Andamento } from "@/contexts/ProcessosTrabalhistas";
import { useClientes } from "@/contexts/ClientesContext";
import { supabase } from "@/integrations/supabase/client";
import PaginationControls, { paginate } from "@/components/PaginationControls";

const STATUS_OPTIONS = ["Ativo", "Recurso", "Acordo", "Encerrado", "Arquivado"];
const RISCO_OPTIONS = ["Baixo", "Médio", "Alto"];
const FASE_OPTIONS = ["Inicial", "Instrução", "Julgamento", "Recursal", "Execução", "Encerrado"];
const TIPO_ANDAMENTO = ["Audiência", "Petição", "Decisão", "Prazo", "Outros"];
const TIPO_AUDIENCIA = ["Audiência Inicial", "Audiência de Instrução", "Audiência de Julgamento", "Audiência de Conciliação", "Audiência UNA", "Outros"];
const TIPO_CONTATO = ["Advogado", "Contador"];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Audiencia {
  id: string;
  processo_id: string;
  processo_numero: string;
  data_audiencia: string;
  hora: string;
  tipo: string;
  local: string;
  vara: string;
  observacoes: string;
  status: string;
  notificado_5d: boolean;
  notificado_2d: boolean;
}

interface ContatoNotificacao {
  id: string;
  nome: string;
  tipo: string;
  telefone_whatsapp: string;
  email: string;
  oab: string;
  crc: string;
  ativo: boolean;
  observacoes: string;
}

const emptyProcesso: Omit<ProcessoTrabalhista, "id"> = {
  numero_processo: "", vara: "", comarca: "", estado: "", autor_nome: "", autor_cpf: "",
  advogado_autor: "", advogado_empresa: "", data_distribuicao: null, objeto_acao: "",
  valor_causa: 0, provisao_contabil: 0, valor_acordo: 0, valor_condenacao: 0, honorarios: 0,
  risco: "Médio", status: "Ativo", fase_processual: "Inicial", observacoes: "", anexos: [],
  cliente_id: "", cliente_nome: "",
};

const emptyAudiencia: Omit<Audiencia, "id"> = {
  processo_id: "", processo_numero: "", data_audiencia: "", hora: "", tipo: "Audiência Inicial",
  local: "", vara: "", observacoes: "", status: "Agendada", notificado_5d: false, notificado_2d: false,
};

const emptyContato: Omit<ContatoNotificacao, "id"> = {
  nome: "", tipo: "Advogado", telefone_whatsapp: "", email: "", oab: "", crc: "", ativo: true, observacoes: "",
};

export default function JuridicoPage() {
  const { processos, andamentos, loading, addProcesso, updateProcesso, deleteProcesso, addAndamento, deleteAndamento, loadAndamentos } = useProcessosTrabalhistas();
  const { clientes } = useClientes();

  const [tab, setTab] = useState("dashboard");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProcesso);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterRisco, setFilterRisco] = useState("Todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [viewProcesso, setViewProcesso] = useState<ProcessoTrabalhista | null>(null);
  const [showAndamentoForm, setShowAndamentoForm] = useState(false);
  const [andForm, setAndForm] = useState<Omit<Andamento, "id">>({ processo_id: "", tipo: "Outros", data_andamento: "", descricao: "", responsavel: "", prazo_limite: null, status_prazo: "Pendente" });

  // Audiências
  const [audiencias, setAudiencias] = useState<Audiencia[]>([]);
  const [showAudForm, setShowAudForm] = useState(false);
  const [audEditId, setAudEditId] = useState<string | null>(null);
  const [audForm, setAudForm] = useState(emptyAudiencia);
  const [audDeleteId, setAudDeleteId] = useState<string | null>(null);

  // Contatos
  const [contatos, setContatos] = useState<ContatoNotificacao[]>([]);
  const [showContatoForm, setShowContatoForm] = useState(false);
  const [contatoEditId, setContatoEditId] = useState<string | null>(null);
  const [contatoForm, setContatoForm] = useState(emptyContato);
  const [contatoDeleteId, setContatoDeleteId] = useState<string | null>(null);

  const loadAudiencias = useCallback(async () => {
    const { data, error } = await (supabase as any).from("juridico_audiencias").select("*").order("data_audiencia", { ascending: true });
    if (error) { console.error(error); return; }
    setAudiencias((data || []).map((r: any) => ({
      id: r.id, processo_id: r.processo_id ?? "", processo_numero: r.processo_numero ?? "",
      data_audiencia: r.data_audiencia ?? "", hora: r.hora ?? "", tipo: r.tipo ?? "",
      local: r.local ?? "", vara: r.vara ?? "", observacoes: r.observacoes ?? "",
      status: r.status ?? "Agendada", notificado_5d: r.notificado_5d ?? false, notificado_2d: r.notificado_2d ?? false,
    })));
  }, []);

  const loadContatos = useCallback(async () => {
    const { data, error } = await (supabase as any).from("juridico_contatos_notificacao").select("*").order("nome", { ascending: true });
    if (error) { console.error(error); return; }
    setContatos((data || []).map((r: any) => ({
      id: r.id, nome: r.nome ?? "", tipo: r.tipo ?? "Advogado",
      telefone_whatsapp: r.telefone_whatsapp ?? "", email: r.email ?? "",
      oab: r.oab ?? "", crc: r.crc ?? "", ativo: r.ativo ?? true, observacoes: r.observacoes ?? "",
    })));
  }, []);

  useEffect(() => { loadAudiencias(); loadContatos(); }, [loadAudiencias, loadContatos]);

  // Dashboard stats
  const stats = useMemo(() => {
    const ativos = processos.filter(p => p.status === "Ativo").length;
    const emRecurso = processos.filter(p => p.status === "Recurso").length;
    const encerrados = processos.filter(p => ["Encerrado", "Arquivado", "Acordo"].includes(p.status)).length;
    const totalProvisao = processos.reduce((s, p) => s + p.provisao_contabil, 0);
    const totalValorCausa = processos.reduce((s, p) => s + p.valor_causa, 0);
    const riscoAlto = processos.filter(p => p.risco === "Alto" && p.status === "Ativo").length;
    const porStatus = STATUS_OPTIONS.map(st => ({ status: st, count: processos.filter(p => p.status === st).length }));
    const porRisco = RISCO_OPTIONS.map(r => ({ risco: r, count: processos.filter(p => p.risco === r && p.status === "Ativo").length }));
    const proximasAudiencias = audiencias.filter(a => a.status === "Agendada" && new Date(a.data_audiencia + "T23:59:59") >= new Date()).slice(0, 5);
    return { ativos, emRecurso, encerrados, totalProvisao, totalValorCausa, riscoAlto, porStatus, porRisco, proximasAudiencias };
  }, [processos, audiencias]);

  const filtered = useMemo(() => {
    return processos.filter(p => {
      const matchSearch = !search || p.numero_processo.toLowerCase().includes(search.toLowerCase()) || p.autor_nome.toLowerCase().includes(search.toLowerCase()) || p.objeto_acao.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "Todos" || p.status === filterStatus;
      const matchRisco = filterRisco === "Todos" || p.risco === filterRisco;
      return matchSearch && matchStatus && matchRisco;
    });
  }, [processos, search, filterStatus, filterRisco]);

  const { paginated: paged, totalPages } = paginate(filtered, page, pageSize);

  const openNew = () => { setForm(emptyProcesso); setEditId(null); setShowForm(true); };
  const openEdit = (p: ProcessoTrabalhista) => { setForm({ ...p }); setEditId(p.id); setShowForm(true); };
  const openView = async (p: ProcessoTrabalhista) => { setViewProcesso(p); await loadAndamentos(p.id); };

  const handleSave = async () => {
    if (!form.numero_processo.trim() || !form.autor_nome.trim()) { toast.error("Número do processo e nome do autor são obrigatórios"); return; }
    if (editId) { await updateProcesso(editId, form); toast.success("Processo atualizado"); }
    else { await addProcesso(form); toast.success("Processo cadastrado"); }
    setShowForm(false);
  };

  const handleAddAndamento = async () => {
    if (!andForm.descricao.trim()) { toast.error("Descrição obrigatória"); return; }
    await addAndamento({ ...andForm, processo_id: viewProcesso!.id });
    setShowAndamentoForm(false);
    setAndForm({ processo_id: "", tipo: "Outros", data_andamento: "", descricao: "", responsavel: "", prazo_limite: null, status_prazo: "Pendente" });
    toast.success("Andamento adicionado");
  };

  // Audiências CRUD
  const handleSaveAudiencia = async () => {
    if (!audForm.processo_id || !audForm.data_audiencia) { toast.error("Processo e data são obrigatórios"); return; }
    const proc = processos.find(p => p.id === audForm.processo_id);
    const payload = { ...audForm, processo_numero: proc?.numero_processo || "" };
    if (audEditId) {
      await (supabase as any).from("juridico_audiencias").update(payload).eq("id", audEditId);
      toast.success("Audiência atualizada");
    } else {
      await (supabase as any).from("juridico_audiencias").insert(payload);
      toast.success("Audiência agendada");
    }
    setShowAudForm(false);
    setAudEditId(null);
    setAudForm(emptyAudiencia);
    await loadAudiencias();
  };

  const handleDeleteAudiencia = async () => {
    if (!audDeleteId) return;
    await (supabase as any).from("juridico_audiencias").delete().eq("id", audDeleteId);
    toast.success("Audiência removida");
    setAudDeleteId(null);
    await loadAudiencias();
  };

  // Contatos CRUD
  const handleSaveContato = async () => {
    if (!contatoForm.nome.trim() || !contatoForm.telefone_whatsapp.trim()) { toast.error("Nome e WhatsApp são obrigatórios"); return; }
    if (contatoEditId) {
      await (supabase as any).from("juridico_contatos_notificacao").update(contatoForm).eq("id", contatoEditId);
      toast.success("Contato atualizado");
    } else {
      await (supabase as any).from("juridico_contatos_notificacao").insert(contatoForm);
      toast.success("Contato cadastrado");
    }
    setShowContatoForm(false);
    setContatoEditId(null);
    setContatoForm(emptyContato);
    await loadContatos();
  };

  const handleDeleteContato = async () => {
    if (!contatoDeleteId) return;
    await (supabase as any).from("juridico_contatos_notificacao").delete().eq("id", contatoDeleteId);
    toast.success("Contato removido");
    setContatoDeleteId(null);
    await loadContatos();
  };

  const riscoBadge = (r: string) => {
    const cls = r === "Alto" ? "bg-destructive text-destructive-foreground" : r === "Médio" ? "bg-yellow-500 text-white" : "bg-green-600 text-white";
    return <Badge className={cls}>{r}</Badge>;
  };
  const statusBadge = (s: string) => {
    const cls = s === "Ativo" ? "bg-primary" : s === "Recurso" ? "bg-yellow-600 text-white" : s === "Acordo" ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground";
    return <Badge className={cls}>{s}</Badge>;
  };

  return (
    <div className="bg-background">
      <div className="container max-w-full mx-auto px-4 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Scale className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Jurídico</span>
            </div>
            <h1 className="text-xl font-bold text-foreground mb-1">Contencioso Trabalhista</h1>
            <p className="text-sm text-muted-foreground">Acompanhamento de processos trabalhistas da empresa</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="dashboard"><BarChart3 className="h-4 w-4 mr-1" /> Dashboard</TabsTrigger>
            <TabsTrigger value="processos"><FileText className="h-4 w-4 mr-1" /> Processos</TabsTrigger>
            <TabsTrigger value="audiencias"><Calendar className="h-4 w-4 mr-1" /> Audiências</TabsTrigger>
            <TabsTrigger value="contatos"><Users className="h-4 w-4 mr-1" /> Contatos</TabsTrigger>
          </TabsList>

          {/* ============ DASHBOARD ============ */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Processos</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{processos.length}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Ativos</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-primary">{stats.ativos}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Em Recurso</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-yellow-600">{stats.emRecurso}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Encerrados</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-muted-foreground">{stats.encerrados}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-destructive" /> Risco Alto</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-destructive">{stats.riscoAlto}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Provisão Total</CardTitle></CardHeader><CardContent><p className="text-lg font-bold">{fmt(stats.totalProvisao)}</p></CardContent></Card>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Por Status</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.porStatus.map(s => (
                      <div key={s.status} className="flex justify-between items-center">
                        <span className="text-sm">{s.status}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${processos.length ? (s.count / processos.length) * 100 : 0}%` }} />
                          </div>
                          <span className="text-sm font-medium w-6 text-right">{s.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Ativos por Risco</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.porRisco.map(r => (
                      <div key={r.risco} className="flex justify-between items-center">
                        <span className="text-sm">{riscoBadge(r.risco)}</span>
                        <span className="text-2xl font-bold">{r.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Próximas audiências */}
            {stats.proximasAudiencias.length > 0 && (
              <Card className="mt-4 border-primary/30">
                <CardHeader><CardTitle className="text-sm flex items-center gap-1"><Calendar className="h-4 w-4 text-primary" /> Próximas Audiências</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.proximasAudiencias.map(a => (
                      <div key={a.id} className="flex justify-between items-center p-2 rounded bg-primary/5">
                        <div>
                          <span className="font-medium text-sm">{a.processo_numero}</span>
                          <span className="text-xs text-muted-foreground ml-2">{a.tipo}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">{new Date(a.data_audiencia + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                          {a.hora && <span className="text-xs text-muted-foreground ml-1">{a.hora}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {stats.riscoAlto > 0 && (
              <Card className="mt-4 border-destructive/30">
                <CardHeader><CardTitle className="text-sm text-destructive flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Processos com Risco Alto</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {processos.filter(p => p.risco === "Alto" && p.status === "Ativo").map(p => (
                      <div key={p.id} className="flex justify-between items-center p-2 rounded bg-destructive/5">
                        <div>
                          <span className="font-medium text-sm">{p.numero_processo}</span>
                          <span className="text-xs text-muted-foreground ml-2">{p.autor_nome}</span>
                        </div>
                        <span className="text-sm font-medium">{fmt(p.valor_causa)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============ PROCESSOS ============ */}
          <TabsContent value="processos">
            <div className="flex flex-wrap gap-3 items-end mb-4">
              <Input placeholder="Buscar por nº, autor ou objeto..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-64" />
              <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1); }}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos Status</SelectItem>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterRisco} onValueChange={v => { setFilterRisco(v); setPage(1); }}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos Riscos</SelectItem>
                  {RISCO_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex-1" />
              <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Processo</Button>
            </div>

            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Processo</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Vara/Comarca</TableHead>
                    <TableHead>Distribuição</TableHead>
                    <TableHead>Valor Causa</TableHead>
                    <TableHead>Provisão</TableHead>
                    <TableHead>Risco</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fase</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.length === 0 && (
                    <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Nenhum processo encontrado</TableCell></TableRow>
                  )}
                  {paged.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.numero_processo}</TableCell>
                      <TableCell>{p.autor_nome}</TableCell>
                      <TableCell>{p.vara}{p.comarca ? ` - ${p.comarca}` : ""}</TableCell>
                      <TableCell>{p.data_distribuicao || "-"}</TableCell>
                      <TableCell>{fmt(p.valor_causa)}</TableCell>
                      <TableCell>{fmt(p.provisao_contabil)}</TableCell>
                      <TableCell>{riscoBadge(p.risco)}</TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell><span className="text-xs">{p.fase_processual}</span></TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => openView(p)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && <div className="mt-4"><PaginationControls currentPage={page} totalItems={filtered.length} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} /></div>}
          </TabsContent>

          {/* ============ AUDIÊNCIAS ============ */}
          <TabsContent value="audiencias">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Agenda de Audiências</h2>
              <Button onClick={() => { setAudForm(emptyAudiencia); setAudEditId(null); setShowAudForm(true); }} className="gap-2"><Plus className="h-4 w-4" /> Nova Audiência</Button>
            </div>

            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Processo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Vara</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notificações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audiencias.length === 0 && (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhuma audiência agendada</TableCell></TableRow>
                  )}
                  {audiencias.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.processo_numero}</TableCell>
                      <TableCell>{a.data_audiencia ? new Date(a.data_audiencia + "T12:00:00").toLocaleDateString("pt-BR") : "-"}</TableCell>
                      <TableCell>{a.hora || "-"}</TableCell>
                      <TableCell><Badge variant="outline">{a.tipo}</Badge></TableCell>
                      <TableCell>{a.local || "-"}</TableCell>
                      <TableCell>{a.vara || "-"}</TableCell>
                      <TableCell>
                        <Badge className={a.status === "Agendada" ? "bg-primary" : a.status === "Realizada" ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}>
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {a.notificado_5d && <Badge variant="outline" className="text-xs">5d ✓</Badge>}
                          {a.notificado_2d && <Badge variant="outline" className="text-xs">2d ✓</Badge>}
                          {!a.notificado_5d && !a.notificado_2d && <span className="text-xs text-muted-foreground">Pendente</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => { setAudForm({ ...a }); setAudEditId(a.id); setShowAudForm(true); }}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setAudDeleteId(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ============ CONTATOS ============ */}
          <TabsContent value="contatos">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold">Contatos para Notificação</h2>
                <p className="text-sm text-muted-foreground">Advogados e contadores que receberão avisos de audiências via WhatsApp</p>
              </div>
              <Button onClick={() => { setContatoForm(emptyContato); setContatoEditId(null); setShowContatoForm(true); }} className="gap-2"><Plus className="h-4 w-4" /> Novo Contato</Button>
            </div>

            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>OAB/CRC</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contatos.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum contato cadastrado</TableCell></TableRow>
                  )}
                  {contatos.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell><Badge variant="outline">{c.tipo}</Badge></TableCell>
                      <TableCell><span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.telefone_whatsapp}</span></TableCell>
                      <TableCell>{c.email || "-"}</TableCell>
                      <TableCell>{c.tipo === "Advogado" ? c.oab || "-" : c.crc || "-"}</TableCell>
                      <TableCell>
                        <Badge className={c.ativo ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}>{c.ativo ? "Sim" : "Não"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => { setContatoForm({ ...c }); setContatoEditId(c.id); setShowContatoForm(true); }}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setContatoDeleteId(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* ============ FORM PROCESSO ============ */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? "Editar Processo" : "Novo Processo Trabalhista"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nº Processo *</Label><Input value={form.numero_processo} onChange={e => setForm({ ...form, numero_processo: e.target.value })} placeholder="0000000-00.0000.0.00.0000" /></div>
              <div><Label>Autor / Reclamante *</Label><Input value={form.autor_nome} onChange={e => setForm({ ...form, autor_nome: e.target.value })} /></div>
              <div><Label>CPF do Autor</Label><Input value={form.autor_cpf} onChange={e => setForm({ ...form, autor_cpf: e.target.value })} /></div>
              <div><Label>Vara</Label><Input value={form.vara} onChange={e => setForm({ ...form, vara: e.target.value })} /></div>
              <div><Label>Comarca</Label><Input value={form.comarca} onChange={e => setForm({ ...form, comarca: e.target.value })} /></div>
              <div><Label>Estado</Label><Input value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} /></div>
              <div><Label>Data Distribuição</Label><Input type="date" value={form.data_distribuicao || ""} onChange={e => setForm({ ...form, data_distribuicao: e.target.value || null })} /></div>
              <div>
                <Label>Centro de Custo (Cliente)</Label>
                <Select value={form.cliente_id} onValueChange={v => { const c = clientes.find(x => x.id === v); setForm({ ...form, cliente_id: v, cliente_nome: c?.nome || "" }); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clientes.filter(c => c.tipo === "Cliente").map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Advogado do Autor</Label><Input value={form.advogado_autor} onChange={e => setForm({ ...form, advogado_autor: e.target.value })} /></div>
              <div><Label>Advogado da Empresa</Label><Input value={form.advogado_empresa} onChange={e => setForm({ ...form, advogado_empresa: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Objeto da Ação</Label><Textarea value={form.objeto_acao} onChange={e => setForm({ ...form, objeto_acao: e.target.value })} rows={2} /></div>
              <div><Label>Valor da Causa</Label><Input type="number" step="0.01" value={form.valor_causa} onChange={e => setForm({ ...form, valor_causa: Number(e.target.value) })} /></div>
              <div><Label>Provisão Contábil</Label><Input type="number" step="0.01" value={form.provisao_contabil} onChange={e => setForm({ ...form, provisao_contabil: Number(e.target.value) })} /></div>
              <div><Label>Valor Acordo</Label><Input type="number" step="0.01" value={form.valor_acordo} onChange={e => setForm({ ...form, valor_acordo: Number(e.target.value) })} /></div>
              <div><Label>Valor Condenação</Label><Input type="number" step="0.01" value={form.valor_condenacao} onChange={e => setForm({ ...form, valor_condenacao: Number(e.target.value) })} /></div>
              <div><Label>Honorários</Label><Input type="number" step="0.01" value={form.honorarios} onChange={e => setForm({ ...form, honorarios: Number(e.target.value) })} /></div>
              <div>
                <Label>Risco</Label>
                <Select value={form.risco} onValueChange={v => setForm({ ...form, risco: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RISCO_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fase Processual</Label>
                <Select value={form.fase_processual} onValueChange={v => setForm({ ...form, fase_processual: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FASE_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={2} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{editId ? "Salvar" : "Cadastrar"}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ============ FORM AUDIÊNCIA ============ */}
        <Dialog open={showAudForm} onOpenChange={v => { if (!v) { setShowAudForm(false); setAudEditId(null); } }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{audEditId ? "Editar Audiência" : "Nova Audiência"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Processo *</Label>
                <Select value={audForm.processo_id} onValueChange={v => {
                  const proc = processos.find(p => p.id === v);
                  setAudForm({ ...audForm, processo_id: v, processo_numero: proc?.numero_processo || "", vara: proc?.vara || audForm.vara });
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecione o processo" /></SelectTrigger>
                  <SelectContent>
                    {processos.filter(p => p.status === "Ativo" || p.status === "Recurso").map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.numero_processo} - {p.autor_nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Data *</Label><Input type="date" value={audForm.data_audiencia} onChange={e => setAudForm({ ...audForm, data_audiencia: e.target.value })} /></div>
              <div><Label>Hora</Label><Input type="time" value={audForm.hora} onChange={e => setAudForm({ ...audForm, hora: e.target.value })} /></div>
              <div>
                <Label>Tipo</Label>
                <Select value={audForm.tipo} onValueChange={v => setAudForm({ ...audForm, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPO_AUDIENCIA.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={audForm.status} onValueChange={v => setAudForm({ ...audForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Agendada">Agendada</SelectItem>
                    <SelectItem value="Realizada">Realizada</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                    <SelectItem value="Adiada">Adiada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Local</Label><Input value={audForm.local} onChange={e => setAudForm({ ...audForm, local: e.target.value })} /></div>
              <div><Label>Vara</Label><Input value={audForm.vara} onChange={e => setAudForm({ ...audForm, vara: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Observações</Label><Textarea value={audForm.observacoes} onChange={e => setAudForm({ ...audForm, observacoes: e.target.value })} rows={2} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setShowAudForm(false); setAudEditId(null); }}>Cancelar</Button>
              <Button onClick={handleSaveAudiencia}>{audEditId ? "Salvar" : "Agendar"}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ============ FORM CONTATO ============ */}
        <Dialog open={showContatoForm} onOpenChange={v => { if (!v) { setShowContatoForm(false); setContatoEditId(null); } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{contatoEditId ? "Editar Contato" : "Novo Contato"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><Label>Nome *</Label><Input value={contatoForm.nome} onChange={e => setContatoForm({ ...contatoForm, nome: e.target.value })} /></div>
              <div>
                <Label>Tipo</Label>
                <Select value={contatoForm.tipo} onValueChange={v => setContatoForm({ ...contatoForm, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPO_CONTATO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>WhatsApp *</Label><Input value={contatoForm.telefone_whatsapp} onChange={e => setContatoForm({ ...contatoForm, telefone_whatsapp: e.target.value })} placeholder="+55 11 99999-9999" /></div>
              <div><Label>E-mail</Label><Input type="email" value={contatoForm.email} onChange={e => setContatoForm({ ...contatoForm, email: e.target.value })} /></div>
              {contatoForm.tipo === "Advogado" && (
                <div><Label>OAB</Label><Input value={contatoForm.oab} onChange={e => setContatoForm({ ...contatoForm, oab: e.target.value })} placeholder="UF 000000" /></div>
              )}
              {contatoForm.tipo === "Contador" && (
                <div><Label>CRC</Label><Input value={contatoForm.crc} onChange={e => setContatoForm({ ...contatoForm, crc: e.target.value })} /></div>
              )}
              <div className="flex items-center gap-2">
                <Switch checked={contatoForm.ativo} onCheckedChange={v => setContatoForm({ ...contatoForm, ativo: v })} />
                <Label>Ativo (receber notificações)</Label>
              </div>
              <div className="md:col-span-2"><Label>Observações</Label><Textarea value={contatoForm.observacoes} onChange={e => setContatoForm({ ...contatoForm, observacoes: e.target.value })} rows={2} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setShowContatoForm(false); setContatoEditId(null); }}>Cancelar</Button>
              <Button onClick={handleSaveContato}>{contatoEditId ? "Salvar" : "Cadastrar"}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ============ VIEW PROCESSO ============ */}
        <Dialog open={!!viewProcesso} onOpenChange={() => setViewProcesso(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {viewProcesso && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" /> Processo {viewProcesso.numero_processo}
                    <span className="ml-2">{statusBadge(viewProcesso.status)}</span>
                    <span>{riscoBadge(viewProcesso.risco)}</span>
                  </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Autor:</span> <strong>{viewProcesso.autor_nome}</strong></div>
                  <div><span className="text-muted-foreground">CPF:</span> {viewProcesso.autor_cpf || "-"}</div>
                  <div><span className="text-muted-foreground">Vara:</span> {viewProcesso.vara || "-"}</div>
                  <div><span className="text-muted-foreground">Comarca:</span> {viewProcesso.comarca || "-"}</div>
                  <div><span className="text-muted-foreground">Estado:</span> {viewProcesso.estado || "-"}</div>
                  <div><span className="text-muted-foreground">Distribuição:</span> {viewProcesso.data_distribuicao || "-"}</div>
                  <div><span className="text-muted-foreground">Adv. Autor:</span> {viewProcesso.advogado_autor || "-"}</div>
                  <div><span className="text-muted-foreground">Adv. Empresa:</span> {viewProcesso.advogado_empresa || "-"}</div>
                  <div><span className="text-muted-foreground">Fase:</span> {viewProcesso.fase_processual}</div>
                  <div><span className="text-muted-foreground">Centro de Custo:</span> {viewProcesso.cliente_nome || "-"}</div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
                  <Card className="p-3"><p className="text-xs text-muted-foreground">Valor Causa</p><p className="font-bold">{fmt(viewProcesso.valor_causa)}</p></Card>
                  <Card className="p-3"><p className="text-xs text-muted-foreground">Provisão</p><p className="font-bold">{fmt(viewProcesso.provisao_contabil)}</p></Card>
                  <Card className="p-3"><p className="text-xs text-muted-foreground">Acordo</p><p className="font-bold">{fmt(viewProcesso.valor_acordo)}</p></Card>
                  <Card className="p-3"><p className="text-xs text-muted-foreground">Condenação</p><p className="font-bold">{fmt(viewProcesso.valor_condenacao)}</p></Card>
                  <Card className="p-3"><p className="text-xs text-muted-foreground">Honorários</p><p className="font-bold">{fmt(viewProcesso.honorarios)}</p></Card>
                </div>

                {viewProcesso.objeto_acao && (
                  <div className="mt-3"><p className="text-xs text-muted-foreground mb-1">Objeto da Ação</p><p className="text-sm bg-muted p-2 rounded">{viewProcesso.objeto_acao}</p></div>
                )}
                {viewProcesso.observacoes && (
                  <div className="mt-2"><p className="text-xs text-muted-foreground mb-1">Observações</p><p className="text-sm bg-muted p-2 rounded">{viewProcesso.observacoes}</p></div>
                )}

                {/* Andamentos */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm flex items-center gap-1"><Calendar className="h-4 w-4" /> Andamentos</h3>
                    <Button size="sm" onClick={() => setShowAndamentoForm(true)} className="gap-1"><Plus className="h-3 w-3" /> Adicionar</Button>
                  </div>

                  {showAndamentoForm && (
                    <Card className="p-3 mb-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Tipo</Label>
                          <Select value={andForm.tipo} onValueChange={v => setAndForm({ ...andForm, tipo: v })}>
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>{TIPO_ANDAMENTO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div><Label className="text-xs">Data</Label><Input type="date" className="h-8" value={andForm.data_andamento || ""} onChange={e => setAndForm({ ...andForm, data_andamento: e.target.value })} /></div>
                        <div><Label className="text-xs">Responsável</Label><Input className="h-8" value={andForm.responsavel} onChange={e => setAndForm({ ...andForm, responsavel: e.target.value })} /></div>
                        <div><Label className="text-xs">Prazo Limite</Label><Input type="date" className="h-8" value={andForm.prazo_limite || ""} onChange={e => setAndForm({ ...andForm, prazo_limite: e.target.value || null })} /></div>
                        <div>
                          <Label className="text-xs">Status Prazo</Label>
                          <Select value={andForm.status_prazo} onValueChange={v => setAndForm({ ...andForm, status_prazo: v })}>
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pendente">Pendente</SelectItem>
                              <SelectItem value="Cumprido">Cumprido</SelectItem>
                              <SelectItem value="Vencido">Vencido</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-full"><Label className="text-xs">Descrição *</Label><Textarea value={andForm.descricao} onChange={e => setAndForm({ ...andForm, descricao: e.target.value })} rows={2} /></div>
                      </div>
                      <div className="flex gap-2 mt-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setShowAndamentoForm(false)}>Cancelar</Button>
                        <Button size="sm" onClick={handleAddAndamento}>Salvar</Button>
                      </div>
                    </Card>
                  )}

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {andamentos.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum andamento registrado</p>}
                    {andamentos.map(a => (
                      <div key={a.id} className="flex items-start gap-3 p-2 rounded border text-sm">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">{a.tipo}</Badge>
                            <span className="text-xs text-muted-foreground">{a.data_andamento || ""}</span>
                            {a.prazo_limite && (
                              <span className={`text-xs ${a.status_prazo === "Vencido" ? "text-destructive font-medium" : a.status_prazo === "Cumprido" ? "text-green-600" : "text-yellow-600"}`}>
                                Prazo: {a.prazo_limite} ({a.status_prazo})
                              </span>
                            )}
                          </div>
                          <p>{a.descricao}</p>
                          {a.responsavel && <p className="text-xs text-muted-foreground mt-1">Responsável: {a.responsavel}</p>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { deleteAndamento(a.id); toast.success("Andamento removido"); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete processo */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir processo?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita. O processo e todos os seus andamentos serão removidos permanentemente.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => { if (deleteId) { deleteProcesso(deleteId); toast.success("Processo removido"); setDeleteId(null); } }}>Excluir</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete audiência */}
        <AlertDialog open={!!audDeleteId} onOpenChange={() => setAudDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir audiência?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setAudDeleteId(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeleteAudiencia}>Excluir</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete contato */}
        <AlertDialog open={!!contatoDeleteId} onOpenChange={() => setContatoDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
              <AlertDialogDescription>Este contato não receberá mais notificações de audiências.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setContatoDeleteId(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeleteContato}>Excluir</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
