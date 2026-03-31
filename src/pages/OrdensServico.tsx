import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useOrdensServico, OrdemServico } from "@/contexts/OrdensServicoContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DoubleConfirmDelete, useDoubleConfirmDelete } from "@/components/DoubleConfirmDelete";
import PaginationControls, { paginate } from "@/components/PaginationControls";
import { toast } from "sonner";
import {
  Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, ChevronDown, ChevronUp,
  ClipboardList, Clock, CheckCircle2, XCircle, AlertTriangle, Wrench, Play, ShieldCheck, ShieldX, RotateCcw, BadgeCheck, Ban
} from "lucide-react";

const SITUACOES_WORKFLOW = [
  "Aberta",
  "Executada",
  "Serviço Confirmado",
  "Validada",
  "Serviço Não Aprovado pela Fiscalização",
  "Serviço Re-executado",
  "OS com Orçamento",
  "Cancelada",
];

const SITUACAO_CORES: Record<string, string> = {
  "Aberta": "#e7b73b",
  "Executada": "#26379e",
  "Serviço Confirmado": "#ff0000",
  "Validada": "#2a8819",
  "Serviço Não Aprovado pela Fiscalização": "#400040",
  "Serviço Re-executado": "#6acfff",
  "OS com Orçamento": "#6b7280",
  "Cancelada": "#dc2626",
};

const situacaoBadge = (s: string) => {
  const cor = SITUACAO_CORES[s];
  if (cor) {
    return <Badge style={{ backgroundColor: cor, color: "#fff" }}>{s}</Badge>;
  }
  return <Badge>{s}</Badge>;
};

const PRIORIDADES = ["A: IMEDIATA", "B: (24 a 72H)", "C: PROGRAMADA"];

const prioridadeBadge = (p: string) => {
  if (p.startsWith("A")) return <Badge className="bg-destructive text-destructive-foreground">{p}</Badge>;
  if (p.startsWith("B")) return <Badge style={{ backgroundColor: "#e7b73b", color: "#fff" }}>{p}</Badge>;
  return <Badge className="bg-green-600 text-white">{p}</Badge>;
};

const ITEMS_PER_PAGE = 15;

export default function OrdensServicoPage() {
  const { ordens, addOrdem, updateOrdem, deleteOrdem } = useOrdensServico();
  const { clientes } = useClientes();
  const { usuarioLogado } = useAuth();
  const navigate = useNavigate();

  const clientesFiltrados = clientes.filter(c => c.tipo === "Cliente");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewOS, setViewOS] = useState<OrdemServico | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState("Todas");
  const [page, setPage] = useState(1);

  // Form fields
  const [clienteId, setClienteId] = useState("");
  const [nCliente, setNCliente] = useState("");
  const [situacao, setSituacao] = useState("Aberta");
  const [dataInicio, setDataInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [dataTermino, setDataTermino] = useState("");
  const [horaTermino, setHoraTermino] = useState("");
  const [prioridade, setPrioridade] = useState("C: PROGRAMADA");
  const [solicitante, setSolicitante] = useState("");
  const [matricula, setMatricula] = useState("");
  const [ramal, setRamal] = useState("");
  const [telefone, setTelefone] = useState("");
  const [localId, setLocalId] = useState("");
  const [pavimentoId, setPavimentoId] = useState("");
  const [setorId, setSetorId] = useState("");
  const [categoria, setCategoria] = useState("");
  const [servico, setServico] = useState("");
  const [descricaoServicos, setDescricaoServicos] = useState("");
  const [ressalvaAprovacao, setRessalvaAprovacao] = useState("");
  const [descricaoConclusao, setDescricaoConclusao] = useState("");

  const { deleteId, requestDelete, cancelDelete } = useDoubleConfirmDelete();
  const { deleteId: cancelId, requestDelete: requestCancel, cancelDelete: cancelCancelAction } = useDoubleConfirmDelete();

  // Workflow action handler
  const handleWorkflowAction = async (os: OrdemServico, novaSituacao: string) => {
    await updateOrdem(os.id, { situacao: novaSituacao });
    toast.success(`OS ${os.numero} alterada para "${novaSituacao}"`);
  };

  const handleCancelOS = async () => {
    if (cancelId) {
      await updateOrdem(cancelId, { situacao: "Cancelada" });
      toast.success("Ordem de Serviço cancelada!");
      cancelCancelAction();
    }
  };

  // Get available workflow actions based on current situação
  const getWorkflowActions = (os: OrdemServico) => {
    switch (os.situacao) {
      case "Aberta":
        return [
          { label: "Executar", icon: Play, action: () => handleWorkflowAction(os, "Executada") },
          { label: "Cancelar OS", icon: Ban, action: () => requestCancel(os.id), destructive: true },
        ];
      case "Executada":
        return [
          { label: "Serviço Confirmado", icon: ShieldCheck, action: () => handleWorkflowAction(os, "Serviço Confirmado") },
          { label: "Serviço Não Aprovado pela Fiscalização", icon: ShieldX, action: () => handleWorkflowAction(os, "Serviço Não Aprovado pela Fiscalização") },
        ];
      case "Serviço Confirmado":
        return [
          { label: "Validar OS", icon: BadgeCheck, action: () => handleWorkflowAction(os, "Validada") },
        ];
      case "Serviço Não Aprovado pela Fiscalização":
        return [
          { label: "Serviço Re-executado", icon: RotateCcw, action: () => handleWorkflowAction(os, "Serviço Re-executado") },
        ];
      case "Serviço Re-executado":
        return [
          { label: "Serviço Confirmado", icon: ShieldCheck, action: () => handleWorkflowAction(os, "Serviço Confirmado") },
          { label: "Serviço Não Aprovado pela Fiscalização", icon: ShieldX, action: () => handleWorkflowAction(os, "Serviço Não Aprovado pela Fiscalização") },
        ];
      case "Validada":
      case "Cancelada":
      default:
        return [];
    }
  };

  const clienteSelecionado = clientesFiltrados.find(c => c.id === clienteId);
  const locais = clienteSelecionado?.locais || [];
  const localSelecionado = (locais as any[]).find((l: any) => l.id === localId);
  const pavimentos = localSelecionado?.pavimentos || [];
  const pavimentoSelecionado = (pavimentos as any[]).find((p: any) => p.id === pavimentoId);
  const setores = pavimentoSelecionado?.setores || [];

  const resetForm = () => {
    setClienteId(""); setNCliente(""); setSituacao("Aberta");
    setDataInicio(""); setHoraInicio(""); setDataTermino(""); setHoraTermino("");
    setPrioridade("C: PROGRAMADA"); setSolicitante(""); setMatricula("");
    setRamal(""); setTelefone(""); setLocalId(""); setPavimentoId("");
    setSetorId(""); setCategoria(""); setServico("");
    setDescricaoServicos(""); setRessalvaAprovacao(""); setDescricaoConclusao("");
    setEditingId(null);
  };

  const handleEdit = (os: OrdemServico) => {
    setEditingId(os.id);
    setClienteId(os.clienteId); setNCliente(os.nCliente); setSituacao(os.situacao);
    setDataInicio(os.dataInicio); setHoraInicio(os.horaInicio);
    setDataTermino(os.dataTermino); setHoraTermino(os.horaTermino);
    setPrioridade(os.prioridade); setSolicitante(os.solicitante);
    setMatricula(os.matricula); setRamal(os.ramal); setTelefone(os.telefone);
    setLocalId(os.localId); setPavimentoId(os.pavimentoId); setSetorId(os.setorId);
    setCategoria(os.categoria); setServico(os.servico);
    setDescricaoServicos(os.descricaoServicos); setRessalvaAprovacao(os.ressalvaAprovacao);
    setDescricaoConclusao(os.descricaoConclusao);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!clienteId) { toast.error("Selecione um cliente."); return; }
    if (!descricaoServicos.trim()) { toast.error("Preencha a descrição dos serviços."); return; }

    const cliente = clientesFiltrados.find(c => c.id === clienteId);
    const local = (locais as any[]).find((l: any) => l.id === localId);
    const pav = (pavimentos as any[]).find((p: any) => p.id === pavimentoId);
    const set = (setores as any[]).find((s: any) => s.id === setorId);

    const row: any = {
      n_cliente: nCliente,
      cliente_id: clienteId,
      cliente_nome: cliente?.nome || "",
      data_inicio: dataInicio,
      hora_inicio: horaInicio,
      data_termino: dataTermino,
      hora_termino: horaTermino,
      prioridade,
      solicitante,
      matricula,
      ramal,
      telefone,
      local_id: localId,
      local_descricao: local?.descricao || "",
      pavimento_id: pavimentoId,
      pavimento_descricao: pav?.descricao || "",
      setor_id: setorId,
      setor_descricao: set?.descricao || "",
      categoria,
      servico,
      descricao_servicos: descricaoServicos,
      ressalva_aprovacao: ressalvaAprovacao,
      descricao_conclusao: descricaoConclusao,
    };

    if (editingId) {
      await updateOrdem(editingId, row);
      toast.success("Ordem de Serviço atualizada!");
    } else {
      const nextNumero = ordens.length > 0 ? Math.max(...ordens.map(o => o.numero)) + 1 : 1;
      row.numero = nextNumero;
      row.situacao = "Aberta";
      row.operador_id = usuarioLogado?.id || "";
      row.operador_nome = usuarioLogado?.nome || "";
      await addOrdem(row);
      toast.success("Ordem de Serviço criada!");
    }
    resetForm();
    setFormOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteOrdem(deleteId);
      toast.success("Ordem de Serviço excluída!");
      cancelDelete();
    }
  };

  const ordensFiltradas = useMemo(() => {
    return ordens.filter(o => {
      const matchBusca = !busca ||
        o.numero.toString().includes(busca) ||
        o.clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
        o.descricaoServicos.toLowerCase().includes(busca.toLowerCase()) ||
        o.solicitante.toLowerCase().includes(busca.toLowerCase());
      const matchSituacao = filtroSituacao === "Todas" || o.situacao === filtroSituacao;
      return matchBusca && matchSituacao;
    });
  }, [ordens, busca, filtroSituacao]);

  const { paginated: ordensPage, totalPages, safePage } = paginate(ordensFiltradas, page, ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2 mx-[20px] my-[5px]">
          <Wrench className="h-6 w-6" /> Ordem de Serviço
        </h1>
        <Button onClick={() => { resetForm(); setFormOpen(true); }} className="mx-[24px] my-[2px]">
          <Plus className="mr-2 h-4 w-4" /> Nova OS
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Nº, cliente, descrição..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-8" />
              </div>
            </div>
            <div className="w-[180px]">
              <Label>Situação</Label>
              <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas</SelectItem>
                  {SITUACOES_WORKFLOW.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Nº OS</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordensPage.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma Ordem de Serviço encontrada.
                  </TableCell>
                </TableRow>
              ) : ordensPage.map(os => (
                <TableRow key={os.id}>
                  <TableCell className="font-bold">{os.numero}</TableCell>
                  <TableCell>{os.clienteNome}</TableCell>
                  <TableCell className="max-w-[250px] truncate">{os.descricaoServicos}</TableCell>
                  <TableCell>{prioridadeBadge(os.prioridade)}</TableCell>
                  <TableCell>{situacaoBadge(os.situacao)}</TableCell>
                  <TableCell>{os.dataInicio ? os.dataInicio.split("-").reverse().join("/") : "-"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewOS(os)}>
                          <Eye className="mr-2 h-4 w-4" /> Visualizar
                        </DropdownMenuItem>
                        {!["Validada", "Cancelada"].includes(os.situacao) && (
                          <DropdownMenuItem onClick={() => handleEdit(os)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                        )}
                        {/* Workflow actions */}
                        {getWorkflowActions(os).length > 0 && <DropdownMenuSeparator />}
                        {getWorkflowActions(os).map((action, idx) => (
                          <DropdownMenuItem
                            key={idx}
                            onClick={action.action}
                            className={action.destructive ? "text-destructive" : ""}
                          >
                            <action.icon className="mr-2 h-4 w-4" /> {action.label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => requestDelete(os.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="p-4">
              <PaginationControls currentPage={safePage} totalItems={ordensFiltradas.length} onPageChange={setPage} pageSize={ITEMS_PER_PAGE} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={o => { if (!o) { resetForm(); } setFormOpen(o); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Identificação */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Nº Cliente</Label>
                <Input value={nCliente} onChange={e => setNCliente(e.target.value)} placeholder="Nº do cliente" disabled={!!editingId} className={editingId ? "bg-muted cursor-not-allowed" : ""} />
              </div>
              <div className="md:col-span-2">
                <Label>Cliente *</Label>
                {editingId ? (
                  <Input value={clientesFiltrados.find(c => c.id === clienteId)?.nome || ""} disabled className="bg-muted cursor-not-allowed" />
                ) : (
                  <Select value={clienteId} onValueChange={v => { setClienteId(v); setLocalId(""); setPavimentoId(""); setSetorId(""); }}>
                    <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                    <SelectContent>
                      {clientesFiltrados.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Localização cascata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Local</Label>
                {editingId ? (
                  <Input value={(locais as any[]).find((l: any) => l.id === localId)?.descricao || localId || ""} disabled className="bg-muted cursor-not-allowed" />
                ) : (
                  <Select value={localId} onValueChange={v => { setLocalId(v); setPavimentoId(""); setSetorId(""); }}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {(locais as any[]).map((l: any) => <SelectItem key={l.id} value={l.id}>{l.descricao}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label>Pavimento</Label>
                {editingId ? (
                  <Input value={(pavimentos as any[]).find((p: any) => p.id === pavimentoId)?.descricao || pavimentoId || ""} disabled className="bg-muted cursor-not-allowed" />
                ) : (
                  <Select value={pavimentoId} onValueChange={v => { setPavimentoId(v); setSetorId(""); }}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {(pavimentos as any[]).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.descricao}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label>Setor</Label>
                {editingId ? (
                  <Input value={(setores as any[]).find((s: any) => s.id === setorId)?.descricao || setorId || ""} disabled className="bg-muted cursor-not-allowed" />
                ) : (
                  <Select value={setorId} onValueChange={setSetorId}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {(setores as any[]).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.descricao}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Datas e prioridade */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Data de Início</Label>
                <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
              </div>
              <div>
                <Label>Hora de Início</Label>
                <Input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} />
              </div>
              <div>
                <Label>Data de Término</Label>
                <Input type="date" value={dataTermino} onChange={e => setDataTermino(e.target.value)} />
              </div>
              <div>
                <Label>Hora de Término</Label>
                <Input type="time" value={horaTermino} onChange={e => setHoraTermino(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Prioridade</Label>
                <Select value={prioridade} onValueChange={setPrioridade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORIDADES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Situação</Label>
                <Input value={situacao} disabled className="bg-muted cursor-not-allowed" />
              </div>
            </div>

            {/* Solicitante */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Solicitante</Label>
                <Input value={solicitante} onChange={e => setSolicitante(e.target.value)} />
              </div>
              <div>
                <Label>Matrícula</Label>
                <Input value={matricula} onChange={e => setMatricula(e.target.value)} />
              </div>
              <div>
                <Label>Ramal</Label>
                <Input value={ramal} onChange={e => setRamal(e.target.value)} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={telefone} onChange={e => setTelefone(e.target.value)} />
              </div>
            </div>

            {/* Categoria e Serviço */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Input value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Ex: Elétrica, Hidráulica..." />
              </div>
              <div>
                <Label>Serviço</Label>
                <Input value={servico} onChange={e => setServico(e.target.value)} placeholder="Tipo de serviço" />
              </div>
            </div>

            {/* Descrições */}
            <div>
              <Label>Descrição dos Serviços *</Label>
              <Textarea rows={4} value={descricaoServicos} onChange={e => setDescricaoServicos(e.target.value)} placeholder="Descreva os serviços a serem realizados" />
            </div>
            <div>
              <Label>Ressalva da Aprovação</Label>
              <Textarea rows={3} value={ressalvaAprovacao} onChange={e => setRessalvaAprovacao(e.target.value)} placeholder="Ressalvas para aprovação" />
            </div>
            {(editingId && situacao === "Concluída") && (
              <div>
                <Label>Descrição da Conclusão</Label>
                <Textarea rows={3} value={descricaoConclusao} onChange={e => setDescricaoConclusao(e.target.value)} placeholder="Descreva a conclusão dos serviços" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setFormOpen(false); }}>Cancelar</Button>
            <Button onClick={handleSubmit}>{editingId ? "Salvar Alterações" : "Criar Ordem de Serviço"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewOS} onOpenChange={o => { if (!o) setViewOS(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Ordem de Serviço Nº {viewOS?.numero}
            </DialogTitle>
          </DialogHeader>
          {viewOS && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Nº OS</p>
                  <p className="font-bold text-lg">{viewOS.numero}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nº SS</p>
                  {viewOS.solicitacaoNumero ? (
                    <button
                      type="button"
                      className="font-medium text-primary underline hover:text-primary/80 cursor-pointer"
                      onClick={() => { setViewOS(null); navigate("/engenharia/solicitacao-servicos"); }}
                    >
                      SS {viewOS.solicitacaoNumero}
                    </button>
                  ) : (
                    <p className="font-medium">-</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Situação</p>
                  {situacaoBadge(viewOS.situacao)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prioridade</p>
                  {prioridadeBadge(viewOS.prioridade)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium">{viewOS.clienteNome}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nº Cliente</p>
                  <p className="font-medium">{viewOS.nCliente || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Local</p>
                  <p className="font-medium">{viewOS.localDescricao || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pavimento</p>
                  <p className="font-medium">{viewOS.pavimentoDescricao || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Setor</p>
                  <p className="font-medium">{viewOS.setorDescricao || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Solicitante</p>
                  <p>{viewOS.solicitante || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Matrícula</p>
                  <p>{viewOS.matricula || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ramal</p>
                  <p>{viewOS.ramal || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p>{viewOS.telefone || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 rounded p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Data Início</p>
                  <p>{viewOS.dataInicio ? viewOS.dataInicio.split("-").reverse().join("/") : "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hora Início</p>
                  <p>{viewOS.horaInicio || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data Término</p>
                  <p>{viewOS.dataTermino ? viewOS.dataTermino.split("-").reverse().join("/") : "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hora Término</p>
                  <p>{viewOS.horaTermino || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Categoria</p>
                  <p>{viewOS.categoria || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Serviço</p>
                  <p>{viewOS.servico || "-"}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Descrição dos Serviços</p>
                <p className="whitespace-pre-wrap bg-muted/50 rounded p-3 text-sm">{viewOS.descricaoServicos || "-"}</p>
              </div>

              {viewOS.ressalvaAprovacao && (
                <div>
                  <p className="text-xs text-muted-foreground">Ressalva da Aprovação</p>
                  <p className="whitespace-pre-wrap bg-muted/50 rounded p-3 text-sm">{viewOS.ressalvaAprovacao}</p>
                </div>
              )}

              {viewOS.descricaoConclusao && (
                <div>
                  <p className="text-xs text-muted-foreground">Descrição da Conclusão</p>
                  <p className="whitespace-pre-wrap bg-muted/50 rounded p-3 text-sm">{viewOS.descricaoConclusao}</p>
                </div>
              )}

              {/* Materiais */}
              {viewOS.materiais.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">Materiais e Serviços</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cód.</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Un.</TableHead>
                        <TableHead>Vl. Unit.</TableHead>
                        <TableHead>Qtd.</TableHead>
                        <TableHead>Vl. Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewOS.materiais.map((m: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{m.codigo}</TableCell>
                          <TableCell>{m.descricao}</TableCell>
                          <TableCell>{m.unidade}</TableCell>
                          <TableCell>R$ {Number(m.valorUnitario).toFixed(2)}</TableCell>
                          <TableCell>{m.quantidade}</TableCell>
                          <TableCell>R$ {Number(m.valorTotal).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground font-semibold">Aprovador:</p>
                <p>{viewOS.operadorNome || "-"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Double Confirm Delete */}
      <DoubleConfirmDelete open={!!deleteId} onOpenChange={o => !o && cancelDelete()} onConfirm={handleDelete} />

      {/* Double Confirm Cancel OS */}
      <DoubleConfirmDelete open={!!cancelId} onOpenChange={o => !o && cancelCancelAction()} onConfirm={handleCancelOS} />
    </div>
  );
}
