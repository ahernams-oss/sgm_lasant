import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useOrdensServico, OrdemServico, MaterialOS, ProfissionalOS, AnexoOS, FotoOS, ObservacaoOS, ObservacaoFiscalizacao } from "@/contexts/OrdensServicoContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSco } from "@/contexts/ScoContext";
import { useI0 } from "@/contexts/I0Context";
import { useFuncionarios } from "@/contexts/FuncionariosContext";
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

const ITEMS_PER_PAGE = 10;

export default function OrdensServicoPage() {
  const { ordens, addOrdem, updateOrdem, deleteOrdem } = useOrdensServico();
  const { clientes } = useClientes();
  const { usuarioLogado } = useAuth();
  const { scos } = useSco();
  const { items: i0Items } = useI0();
  const { funcionarios } = useFuncionarios();
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

  // Tab data state
  const [materiais, setMateriais] = useState<MaterialOS[]>([]);
  const [materiaisEstoque, setMateriaisEstoque] = useState<MaterialOS[]>([]);
  const [profissionais, setProfissionais] = useState<ProfissionalOS[]>([]);
  const [anexos, setAnexos] = useState<AnexoOS[]>([]);
  const [fotos, setFotos] = useState<FotoOS[]>([]);
  const [observacoes, setObservacoes] = useState<ObservacaoOS[]>([]);
  const [observacoesFiscalizacao, setObservacoesFiscalizacao] = useState<ObservacaoFiscalizacao[]>([]);

  const { deleteId, requestDelete, cancelDelete } = useDoubleConfirmDelete();
  const { deleteId: cancelId, requestDelete: requestCancel, cancelDelete: cancelCancelAction } = useDoubleConfirmDelete();
  // SCO search state
  const [scoBusca, setScoBusca] = useState("");
  const [scoQtd, setScoQtd] = useState(1);
  const [scoResultPage, setScoResultPage] = useState(1);

  const scosFiltered = useMemo(() => {
    if (!scoBusca.trim()) return [];
    const q = scoBusca.toLowerCase();
    return scos.filter(s => s.codSco.toLowerCase().includes(q) || s.descricaoSco.toLowerCase().includes(q));
  }, [scos, scoBusca]);



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

  const getI0Valor = (codSco: string) => {
    const contratos = clienteSelecionado?.contratos || [];
    const contrato = contratos[0];
    if (!contrato?.mesSco || !contrato?.anoSco) return 0;
    const mes = Number(contrato.mesSco);
    const ano = Number(contrato.anoSco);
    const item = i0Items.find(i => i.codSco === codSco && i.mes === mes && i.ano === ano);
    return item?.valor ?? 0;
  };

  const handleAddScoMaterial = (scoItem: typeof scos[0]) => {
    const valorUnitario = getI0Valor(scoItem.codSco);
    const newItem: MaterialOS = {
      id: crypto.randomUUID(), codigo: scoItem.codSco, descricao: scoItem.descricaoSco,
      unidade: scoItem.unidade, valorUnitario, quantidade: scoQtd, valorTotal: valorUnitario * scoQtd,
    };
    setMateriais([...materiais, newItem]);
    setScoBusca("");
    setScoQtd(1);
    setScoResultPage(1);
  };

  const resetForm = () => {
    setClienteId(""); setNCliente(""); setSituacao("Aberta");
    setDataInicio(""); setHoraInicio(""); setDataTermino(""); setHoraTermino("");
    setPrioridade("C: PROGRAMADA"); setSolicitante(""); setMatricula("");
    setRamal(""); setTelefone(""); setLocalId(""); setPavimentoId("");
    setSetorId(""); setCategoria(""); setServico("");
    setDescricaoServicos(""); setRessalvaAprovacao(""); setDescricaoConclusao("");
    setMateriais([]); setMateriaisEstoque([]); setProfissionais([]);
    setAnexos([]); setFotos([]); setObservacoes([]); setObservacoesFiscalizacao([]);
    setScoBusca(""); setScoQtd(1); setScoResultPage(1);
    setEditingId(null);
  };

  const [editLocalDesc, setEditLocalDesc] = useState("");
  const [editPavDesc, setEditPavDesc] = useState("");
  const [editSetorDesc, setEditSetorDesc] = useState("");

  const handleEdit = (os: OrdemServico) => {
    setEditingId(os.id);
    setClienteId(os.clienteId); setNCliente(os.nCliente); setSituacao(os.situacao);
    setDataInicio(os.dataInicio); setHoraInicio(os.horaInicio);
    setDataTermino(os.dataTermino); setHoraTermino(os.horaTermino);
    setPrioridade(os.prioridade); setSolicitante(os.solicitante);
    setMatricula(os.matricula); setRamal(os.ramal); setTelefone(os.telefone);
    setLocalId(os.localId); setPavimentoId(os.pavimentoId); setSetorId(os.setorId);
    setEditLocalDesc(os.localDescricao); setEditPavDesc(os.pavimentoDescricao); setEditSetorDesc(os.setorDescricao);
    setCategoria(os.categoria); setServico(os.servico);
    setDescricaoServicos(os.descricaoServicos); setRessalvaAprovacao(os.ressalvaAprovacao);
    setDescricaoConclusao(os.descricaoConclusao);
    setMateriais(os.materiais); setMateriaisEstoque(os.materiaisEstoque);
    setProfissionais(os.profissionais); setAnexos(os.anexos); setFotos(os.fotos);
    setObservacoes(os.observacoes); setObservacoesFiscalizacao(os.observacoesFiscalizacao);
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
      materiais,
      materiais_estoque: materiaisEstoque,
      profissionais,
      anexos,
      fotos,
      observacoes,
      observacoes_fiscalizacao: observacoesFiscalizacao,
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
      const q = busca.toLowerCase();
      const matchBusca = !busca ||
        o.numero.toString().includes(busca) ||
        o.clienteNome.toLowerCase().includes(q) ||
        o.nCliente.toLowerCase().includes(q) ||
        o.descricaoServicos.toLowerCase().includes(q) ||
        o.solicitante.toLowerCase().includes(q) ||
        o.localDescricao.toLowerCase().includes(q) ||
        o.categoria.toLowerCase().includes(q);
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
                <Input placeholder="Nº, cliente, descrição, local..." value={busca} onChange={e => { setBusca(e.target.value); setPage(1); }} className="pl-8" />
              </div>
            </div>
            <div className="w-[180px]">
              <Label>Situação</Label>
              <Select value={filtroSituacao} onValueChange={v => { setFiltroSituacao(v); setPage(1); }}>
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
                <Input value={nCliente} onChange={e => setNCliente(e.target.value)} placeholder="Nº do cliente" />
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
                  <Input value={editLocalDesc || ""} disabled className="bg-muted cursor-not-allowed" />
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
                  <Input value={editPavDesc || ""} disabled className="bg-muted cursor-not-allowed" />
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
                  <Input value={editSetorDesc || ""} disabled className="bg-muted cursor-not-allowed" />
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

            {/* === ABAS COLAPSÁVEIS === */}
            <div className="space-y-2 border-t pt-4">

              {/* 1. Materiais e Serviços - SCO */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors font-semibold text-sm">
                  <ClipboardList className="h-4 w-4" /> Materiais e Serviços - SCO
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-3 space-y-3">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label>Código</Label>
                      <div className="relative">
                        <Input
                          placeholder="Código"
                          value={scoBusca}
                          onChange={e => { setScoBusca(e.target.value); setScoResultPage(1); }}
                        />
                        <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="w-[120px]">
                      <Label>Qtd</Label>
                      <Input type="number" min={1} value={scoQtd} onChange={e => setScoQtd(Number(e.target.value) || 1)} placeholder="Qtd" />
                    </div>
                  </div>
                  {scosFiltered.length > 0 && (
                    <div className="border rounded-md max-h-[250px] overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Un.</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginate(scosFiltered, scoResultPage, 10).paginated.map(s => (
                            <TableRow key={s.id}>
                              <TableCell className="text-xs font-mono">{s.codSco}</TableCell>
                              <TableCell className="text-xs">{s.descricaoSco}</TableCell>
                              <TableCell className="text-xs">{s.unidade}</TableCell>
                              <TableCell className="text-xs">{s.tipo}</TableCell>
                              <TableCell>
                                <Button size="sm" onClick={() => handleAddScoMaterial(s)}>Adicionar</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {scosFiltered.length > 10 && (
                        <div className="p-2">
                          <PaginationControls currentPage={scoResultPage} totalItems={scosFiltered.length} onPageChange={setScoResultPage} pageSize={10} />
                        </div>
                      )}
                    </div>
                  )}
                  {materiais.length > 0 && (
                    <>
                      <p className="text-xs text-muted-foreground font-semibold mt-2">Itens adicionados</p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Un.</TableHead>
                            <TableHead className="w-[100px]">Vl. Unit.</TableHead>
                            <TableHead className="w-[80px]">Qtd.</TableHead>
                            <TableHead className="w-[100px]">Vl. Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {materiais.map((m, idx) => (
                            <TableRow key={m.id}>
                              <TableCell className="text-xs">{m.codigo}</TableCell>
                              <TableCell className="text-xs">{m.descricao}</TableCell>
                              <TableCell className="text-xs">{m.unidade}</TableCell>
                              <TableCell>
                                <Input type="number" className="h-8 text-xs" value={m.valorUnitario} onChange={e => {
                                  const updated = [...materiais]; updated[idx] = { ...m, valorUnitario: Number(e.target.value), valorTotal: Number(e.target.value) * m.quantidade }; setMateriais(updated);
                                }} />
                              </TableCell>
                              <TableCell>
                                <Input type="number" className="h-8 text-xs" value={m.quantidade} onChange={e => {
                                  const updated = [...materiais]; updated[idx] = { ...m, quantidade: Number(e.target.value), valorTotal: m.valorUnitario * Number(e.target.value) }; setMateriais(updated);
                                }} />
                              </TableCell>
                              <TableCell className="text-xs font-medium">R$ {m.valorTotal.toFixed(2)}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMateriais(materiais.filter(x => x.id !== m.id))}><Trash2 className="h-3 w-3" /></Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* 2. Materiais do Estoque */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors font-semibold text-sm">
                  <ClipboardList className="h-4 w-4" /> Materiais do Estoque
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-3 space-y-3">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label>Código</Label>
                      <Input id="est-codigo" placeholder="Código" />
                    </div>
                    <div className="flex-[2]">
                      <Label>Descrição</Label>
                      <Input id="est-descricao" placeholder="Descrição do material" />
                    </div>
                    <div className="w-[80px]">
                      <Label>Un.</Label>
                      <Input id="est-unidade" placeholder="Un." />
                    </div>
                    <div className="w-[80px]">
                      <Label>Qtd.</Label>
                      <Input id="est-qtd" type="number" defaultValue={1} />
                    </div>
                    <Button size="sm" onClick={() => {
                      const codigo = (document.getElementById("est-codigo") as HTMLInputElement)?.value || "";
                      const descricao = (document.getElementById("est-descricao") as HTMLInputElement)?.value || "";
                      const unidade = (document.getElementById("est-unidade") as HTMLInputElement)?.value || "";
                      const quantidade = Number((document.getElementById("est-qtd") as HTMLInputElement)?.value) || 1;
                      if (!descricao.trim()) { toast.error("Preencha a descrição."); return; }
                      setMateriaisEstoque([...materiaisEstoque, { id: crypto.randomUUID(), codigo, descricao, unidade, valorUnitario: 0, quantidade, valorTotal: 0 }]);
                      (document.getElementById("est-codigo") as HTMLInputElement).value = "";
                      (document.getElementById("est-descricao") as HTMLInputElement).value = "";
                      (document.getElementById("est-unidade") as HTMLInputElement).value = "";
                      (document.getElementById("est-qtd") as HTMLInputElement).value = "1";
                    }}><Plus className="h-4 w-4" /></Button>
                  </div>
                  {materiaisEstoque.length > 0 && (
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Código</TableHead><TableHead>Descrição</TableHead><TableHead>Un.</TableHead><TableHead>Qtd.</TableHead><TableHead className="w-[50px]"></TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {materiaisEstoque.map(m => (
                          <TableRow key={m.id}>
                            <TableCell className="text-xs">{m.codigo}</TableCell>
                            <TableCell className="text-xs">{m.descricao}</TableCell>
                            <TableCell className="text-xs">{m.unidade}</TableCell>
                            <TableCell className="text-xs">{m.quantidade}</TableCell>
                            <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMateriaisEstoque(materiaisEstoque.filter(x => x.id !== m.id))}><Trash2 className="h-3 w-3" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* 3. Profissionais */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors font-semibold text-sm">
                  <Wrench className="h-4 w-4" /> Profissionais
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-3 space-y-3">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label>Funcionário</Label>
                      <Select onValueChange={v => {
                        const func = funcionarios.find(f => f.id === v);
                        if (func && !profissionais.find(p => p.funcionarioId === v)) {
                          setProfissionais([...profissionais, { id: crypto.randomUUID(), funcionarioId: func.id, nome: func.nome, cargo: "" }]);
                        }
                      }}>
                        <SelectTrigger><SelectValue placeholder="Selecionar profissional..." /></SelectTrigger>
                        <SelectContent>
                          {funcionarios.filter(f => f.status !== "Inativo").map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {profissionais.length > 0 && (
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Nome</TableHead><TableHead>Cargo</TableHead><TableHead className="w-[50px]"></TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {profissionais.map((p, idx) => (
                          <TableRow key={p.id}>
                            <TableCell className="text-xs">{p.nome}</TableCell>
                            <TableCell>
                              <Input className="h-8 text-xs" value={p.cargo} onChange={e => {
                                const updated = [...profissionais]; updated[idx] = { ...p, cargo: e.target.value }; setProfissionais(updated);
                              }} placeholder="Cargo/Função" />
                            </TableCell>
                            <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setProfissionais(profissionais.filter(x => x.id !== p.id))}><Trash2 className="h-3 w-3" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* 4. Anexos */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors font-semibold text-sm">
                  <ClipboardList className="h-4 w-4" /> Anexos
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-3 space-y-3">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label>Título</Label>
                      <Input id="anexo-titulo" placeholder="Título do anexo" />
                    </div>
                    <div className="flex-1">
                      <Label>URL</Label>
                      <Input id="anexo-url" placeholder="Link do arquivo" />
                    </div>
                    <Button size="sm" onClick={() => {
                      const titulo = (document.getElementById("anexo-titulo") as HTMLInputElement)?.value || "";
                      const url = (document.getElementById("anexo-url") as HTMLInputElement)?.value || "";
                      if (!titulo.trim() || !url.trim()) { toast.error("Preencha título e URL."); return; }
                      setAnexos([...anexos, { id: crypto.randomUUID(), titulo, url }]);
                      (document.getElementById("anexo-titulo") as HTMLInputElement).value = "";
                      (document.getElementById("anexo-url") as HTMLInputElement).value = "";
                    }}><Plus className="h-4 w-4" /></Button>
                  </div>
                  {anexos.length > 0 && (
                    <div className="space-y-2">
                      {anexos.map(a => (
                        <div key={a.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                          <span className="flex-1 truncate">{a.titulo}</span>
                          <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">Abrir</a>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAnexos(anexos.filter(x => x.id !== a.id))}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* 5. Fotos */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors font-semibold text-sm">
                  <Eye className="h-4 w-4" /> Fotos
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-3 space-y-3">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label>URL da Foto</Label>
                      <Input id="foto-url" placeholder="Link da imagem" />
                    </div>
                    <Button size="sm" onClick={() => {
                      const url = (document.getElementById("foto-url") as HTMLInputElement)?.value || "";
                      if (!url.trim()) { toast.error("Preencha a URL."); return; }
                      setFotos([...fotos, { id: crypto.randomUUID(), url }]);
                      (document.getElementById("foto-url") as HTMLInputElement).value = "";
                    }}><Plus className="h-4 w-4" /></Button>
                  </div>
                  {fotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {fotos.map(f => (
                        <div key={f.id} className="relative group">
                          <img src={f.url} alt="Foto" className="w-full h-24 object-cover rounded" />
                          <Button variant="destructive" size="icon" className="h-6 w-6 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setFotos(fotos.filter(x => x.id !== f.id))}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* 6. Observações */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors font-semibold text-sm">
                  <ClipboardList className="h-4 w-4" /> Observações
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-3 space-y-3">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label>Observação</Label>
                      <Textarea id="obs-desc" rows={2} placeholder="Digite a observação..." />
                    </div>
                    <Button size="sm" onClick={() => {
                      const descricao = (document.getElementById("obs-desc") as HTMLTextAreaElement)?.value || "";
                      if (!descricao.trim()) { toast.error("Preencha a observação."); return; }
                      setObservacoes([...observacoes, { id: crypto.randomUUID(), descricao, usuario: usuarioLogado?.nome || "", data: new Date().toISOString().split("T")[0] }]);
                      (document.getElementById("obs-desc") as HTMLTextAreaElement).value = "";
                    }}><Plus className="h-4 w-4" /></Button>
                  </div>
                  {observacoes.length > 0 && (
                    <div className="space-y-2">
                      {observacoes.map(o => (
                        <div key={o.id} className="p-2 bg-muted/30 rounded text-sm space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-xs">{o.usuario} - {o.data.split("-").reverse().join("/")}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setObservacoes(observacoes.filter(x => x.id !== o.id))}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                          <p className="text-xs">{o.descricao}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* 7. Observações (Fiscalização) */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors font-semibold text-sm">
                  <AlertTriangle className="h-4 w-4" /> Observações (Fiscalização)
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-3 space-y-3">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label>Título</Label>
                        <Input id="obs-fisc-titulo" placeholder="Título" />
                      </div>
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label>Descrição</Label>
                        <Textarea id="obs-fisc-desc" rows={2} placeholder="Descrição da observação..." />
                      </div>
                      <Button size="sm" onClick={() => {
                        const titulo = (document.getElementById("obs-fisc-titulo") as HTMLInputElement)?.value || "";
                        const descricao = (document.getElementById("obs-fisc-desc") as HTMLTextAreaElement)?.value || "";
                        if (!descricao.trim()) { toast.error("Preencha a descrição."); return; }
                        setObservacoesFiscalizacao([...observacoesFiscalizacao, {
                          id: crypto.randomUUID(), titulo, descricao, usuario: usuarioLogado?.nome || "", data: new Date().toISOString().split("T")[0]
                        }]);
                        (document.getElementById("obs-fisc-titulo") as HTMLInputElement).value = "";
                        (document.getElementById("obs-fisc-desc") as HTMLTextAreaElement).value = "";
                      }}><Plus className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  {observacoesFiscalizacao.length > 0 && (
                    <div className="space-y-2">
                      {observacoesFiscalizacao.map(o => (
                        <div key={o.id} className="p-2 bg-muted/30 rounded text-sm space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-xs">{o.titulo && `${o.titulo} — `}{o.usuario} - {o.data.split("-").reverse().join("/")}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setObservacoesFiscalizacao(observacoesFiscalizacao.filter(x => x.id !== o.id))}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                          <p className="text-xs">{o.descricao}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

            </div>
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
