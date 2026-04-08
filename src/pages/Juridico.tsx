import { useState, useMemo } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Scale, Plus, Eye, Edit, Trash2, FileText, Calendar, AlertTriangle, DollarSign, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
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
import { toast } from "sonner";
import { useProcessosTrabalhistas, ProcessoTrabalhista, Andamento } from "@/contexts/ProcessosTrabalhistas";
import { useClientes } from "@/contexts/ClientesContext";
import PaginationControls, { paginate } from "@/components/PaginationControls";

const STATUS_OPTIONS = ["Ativo", "Recurso", "Acordo", "Encerrado", "Arquivado"];
const RISCO_OPTIONS = ["Baixo", "Médio", "Alto"];
const FASE_OPTIONS = ["Inicial", "Instrução", "Julgamento", "Recursal", "Execução", "Encerrado"];
const TIPO_ANDAMENTO = ["Audiência", "Petição", "Decisão", "Prazo", "Outros"];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const emptyProcesso: Omit<ProcessoTrabalhista, "id"> = {
  numero_processo: "", vara: "", comarca: "", estado: "", autor_nome: "", autor_cpf: "",
  advogado_autor: "", advogado_empresa: "", data_distribuicao: null, objeto_acao: "",
  valor_causa: 0, provisao_contabil: 0, valor_acordo: 0, valor_condenacao: 0, honorarios: 0,
  risco: "Médio", status: "Ativo", fase_processual: "Inicial", observacoes: "", anexos: [],
  cliente_id: "", cliente_nome: "",
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

  // View/Andamentos
  const [viewProcesso, setViewProcesso] = useState<ProcessoTrabalhista | null>(null);
  const [showAndamentoForm, setShowAndamentoForm] = useState(false);
  const [andForm, setAndForm] = useState<Omit<Andamento, "id">>({ processo_id: "", tipo: "Outros", data_andamento: "", descricao: "", responsavel: "", prazo_limite: null, status_prazo: "Pendente" });

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
    return { ativos, emRecurso, encerrados, totalProvisao, totalValorCausa, riscoAlto, porStatus, porRisco };
  }, [processos]);

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

            {/* Processos com risco alto */}
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
        </Tabs>

        {/* ============ FORM DIALOG ============ */}
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
                  <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
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

        {/* ============ VIEW DIALOG ============ */}
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

        {/* Delete confirmation */}
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
      </div>
    </div>
  );
}
