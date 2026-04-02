import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useOrdensServico, OrdemServico, MaterialOS, ProfissionalOS, AnexoOS, FotoOS, ObservacaoOS, ObservacaoFiscalizacao } from "@/contexts/OrdensServicoContext";
import { useCategoriasServicos } from "@/contexts/CategoriasServicosContext";
import { useServicos } from "@/contexts/ServicosContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSco } from "@/contexts/ScoContext";
import { useI0 } from "@/contexts/I0Context";
import { useFuncionarios } from "@/contexts/FuncionariosContext";
import { useCargos } from "@/contexts/CargosContext";
import { useEstoque } from "@/contexts/EstoqueContext";
import { usePedidoCompra } from "@/contexts/PedidoCompraContext";
import { useRequisicaoCompras } from "@/contexts/RequisicaoComprasContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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

const PRIORIDADES = ["A: IMEDIATA", "B: URGENTE", "C: NORMAL"];

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
  const { categorias: categoriasServicos } = useCategoriasServicos();
  const { servicos: servicosCadastrados } = useServicos();
  const { scos } = useSco();
  const { items: i0Items } = useI0();
  const { funcionarios } = useFuncionarios();
  const { movimentacoes } = useEstoque();
  const { pedidos } = usePedidoCompra();
  const { requisicoes } = useRequisicaoCompras();
  const { cargos } = useCargos();
  const navigate = useNavigate();

  const clientesFiltrados = clientes.filter(c => c.tipo === "Cliente");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewOS, setViewOS] = useState<OrdemServico | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState("Todas");
  const [filtroCliente, setFiltroCliente] = useState(() => localStorage.getItem("os_filtroCliente") || "Todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState("Todas");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [page, setPage] = useState(1);

  // Form fields
  const [clienteId, setClienteId] = useState("");
  const [nCliente, setNCliente] = useState("");
  const [situacao, setSituacao] = useState("Aberta");
  const [dataInicio, setDataInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [dataTermino, setDataTermino] = useState("");
  const [horaTermino, setHoraTermino] = useState("");
  const [prioridade, setPrioridade] = useState("C: NORMAL");
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

  // Estoque search state
  const [estoqueBusca, setEstoqueBusca] = useState("");
  const [estoqueQtd, setEstoqueQtd] = useState(1);
  const [estoquePopoverOpen, setEstoquePopoverOpen] = useState(false);

  // Map pedido número → centro de custo nome (same logic as Estoque page)
  const centroCustoMap = useMemo(() => {
    const map = new Map<number, string>();
    pedidos.forEach(p => {
      const rc = requisicoes.find(r => r.id === p.requisicaoId);
      if (rc?.centroCustoNome) map.set(p.numero, rc.centroCustoNome);
    });
    return map;
  }, [pedidos, requisicoes]);

  const getCentroCustoFromDocRef = useCallback((docRef: string): string => {
    const match = docRef.match(/Pedido\s+(\d+)/i);
    if (match) {
      const num = parseInt(match[1]);
      return centroCustoMap.get(num) || "";
    }
    return "";
  }, [centroCustoMap]);

  const saldosCliente = useMemo(() => {
    if (!clienteId) return [];

    const cliente = clientesFiltrados.find(c => c.id === clienteId);
    const centrosCustoPermitidos = new Set(
      [cliente?.nome, cliente?.nomeFantasia].filter((value): value is string => Boolean(value?.trim()))
    );

    if (centrosCustoPermitidos.size === 0) return [];

    const movimentacoesCentroCusto = movimentacoes.filter(m =>
      centrosCustoPermitidos.has(getCentroCustoFromDocRef(m.documentoRef))
    );

    const buildLotesFIFO = (movs: typeof movimentacoes) => {
      const lotes: { quantidade: number; valorUnitario: number }[] = [];
      let saidasPendentes = 0;

      const ordenadas = [...movs].sort((a, b) =>
        (a.dataMovimentacao || "").localeCompare(b.dataMovimentacao || "")
      );

      for (const mov of ordenadas) {
        if (mov.tipo === "entrada" || mov.tipo === "ajuste") {
          if (mov.quantidade > 0) {
            lotes.push({
              quantidade: mov.quantidade,
              valorUnitario: mov.valorUnitario || 0,
            });
          } else if (mov.quantidade < 0) {
            saidasPendentes += Math.abs(mov.quantidade);
          }
        } else if (mov.tipo === "saida") {
          saidasPendentes += mov.quantidade;
        }
      }

      for (const lote of lotes) {
        if (saidasPendentes <= 0) break;
        const consumir = Math.min(saidasPendentes, lote.quantidade);
        lote.quantidade -= consumir;
        saidasPendentes -= consumir;
      }

      return lotes.filter(lote => lote.quantidade > 0);
    };

    const saldoMap = new Map<string, { materialId: string; materialCodigo: string; materialDescricao: string; quantidade: number; local: string }>();

    movimentacoesCentroCusto.forEach(m => {
      const key = `${m.materialId}__${m.local}`;
      if (!saldoMap.has(key)) {
        saldoMap.set(key, {
          materialId: m.materialId,
          materialCodigo: m.materialCodigo,
          materialDescricao: m.materialDescricao,
          quantidade: 0,
          local: m.local,
        });
      }

      const saldo = saldoMap.get(key)!;
      if (m.tipo === "entrada") saldo.quantidade += m.quantidade;
      else if (m.tipo === "saida") saldo.quantidade -= m.quantidade;
      else saldo.quantidade += m.quantidade;
    });

    return Array.from(saldoMap.values())
      .filter(s => s.quantidade > 0)
      .map(s => {
        const movsDoSaldo = movimentacoesCentroCusto.filter(m => m.materialId === s.materialId && m.local === s.local);
        const lotes = buildLotesFIFO(movsDoSaldo);
        const valorTotal = lotes.reduce((sum, lote) => sum + lote.quantidade * lote.valorUnitario, 0);
        const valorUnitarioFIFO = s.quantidade > 0 ? valorTotal / s.quantidade : 0;
        return { ...s, valorUnitarioFIFO, valorTotal };
      });
  }, [movimentacoes, getCentroCustoFromDocRef, clienteId, clientesFiltrados]);

  const saldosFiltrados = useMemo(() => {
    if (!estoqueBusca.trim()) return saldosCliente;
    const q = estoqueBusca.toLowerCase();
    return saldosCliente.filter(s =>
      s.materialCodigo.toLowerCase().includes(q) || s.materialDescricao.toLowerCase().includes(q)
    );
  }, [saldosCliente, estoqueBusca]);

  const autoSaveMateriaisEstoque = async (updated: MaterialOS[]) => {
    if (editingId) {
      await updateOrdem(editingId, { materiais_estoque: updated });
    }
  };

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

  const autoSaveMateriais = async (updatedMateriais: MaterialOS[]) => {
    if (editingId) {
      await updateOrdem(editingId, { materiais: updatedMateriais });
    }
  };

  const handleAddScoMaterial = (scoItem: typeof scos[0]) => {
    const valorUnitario = getI0Valor(scoItem.codSco);
    const newItem: MaterialOS = {
      id: crypto.randomUUID(), codigo: scoItem.codSco, descricao: scoItem.descricaoSco,
      unidade: scoItem.unidade, valorUnitario, quantidade: scoQtd, valorTotal: valorUnitario * scoQtd,
    };
    const updated = [...materiais, newItem];
    setMateriais(updated);
    autoSaveMateriais(updated);
    setScoBusca("");
    setScoQtd(1);
    setScoResultPage(1);
    toast.success("Item adicionado e salvo automaticamente");
  };

  const resetForm = () => {
    setClienteId(""); setNCliente(""); setSituacao("Aberta");
    setDataInicio(""); setHoraInicio(""); setDataTermino(""); setHoraTermino("");
    setPrioridade("C: NORMAL"); setSolicitante(""); setMatricula("");
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
      const matchCliente = filtroCliente === "Todos" || o.clienteId === filtroCliente;
      const matchPrioridade = filtroPrioridade === "Todas" || o.prioridade === filtroPrioridade;
      const matchDataInicio = !filtroDataInicio || o.dataInicio >= filtroDataInicio;
      const matchDataFim = !filtroDataFim || o.dataInicio <= filtroDataFim;
      return matchBusca && matchSituacao && matchCliente && matchPrioridade && matchDataInicio && matchDataFim;
    });
  }, [ordens, busca, filtroSituacao, filtroCliente, filtroPrioridade, filtroDataInicio, filtroDataFim]);

  const limparFiltros = () => {
    setBusca(""); setFiltroSituacao("Todas"); setFiltroCliente("Todos"); localStorage.setItem("os_filtroCliente", "Todos");
    setFiltroPrioridade("Todas"); setFiltroDataInicio(""); setFiltroDataFim("");
    setPage(1);
  };

  const temFiltrosAtivos = busca || filtroSituacao !== "Todas" || filtroCliente !== "Todos" || filtroPrioridade !== "Todas" || filtroDataInicio || filtroDataFim;

  const totalValorFiltrado = useMemo(() => {
    return ordensFiltradas.reduce((acc, os) => {
      const totalMat = (os.materiais || []).reduce((s: number, m: any) => s + (Number(m.valorTotal) || 0), 0);
      const totalEst = (os.materiaisEstoque || []).reduce((s: number, m: any) => s + (Number(m.valorTotal) || 0), 0);
      return acc + totalMat + totalEst;
    }, 0);
  }, [ordensFiltradas]);

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
            <div className="w-[200px]">
              <Label>Cliente</Label>
              <Select value={filtroCliente} onValueChange={v => { setFiltroCliente(v); localStorage.setItem("os_filtroCliente", v); setPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  {clientesFiltrados.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <Label>Prioridade</Label>
              <Select value={filtroPrioridade} onValueChange={v => { setFiltroPrioridade(v); setPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas</SelectItem>
                  {PRIORIDADES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
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
            <div className="w-[150px]">
              <Label>Data Início</Label>
              <Input type="date" value={filtroDataInicio} onChange={e => { setFiltroDataInicio(e.target.value); setPage(1); }} />
            </div>
            <div className="w-[150px]">
              <Label>Data Fim</Label>
              <Input type="date" value={filtroDataFim} onChange={e => { setFiltroDataFim(e.target.value); setPage(1); }} />
            </div>
            {temFiltrosAtivos && (
              <Button variant="ghost" size="sm" onClick={limparFiltros} className="text-muted-foreground">
                <XCircle className="mr-1 h-4 w-4" /> Limpar
              </Button>
            )}
          </div>
          {temFiltrosAtivos && (
            <p className="text-xs text-muted-foreground mt-2">{ordensFiltradas.length} resultado(s) encontrado(s)</p>
          )}
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
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordensPage.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
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
                  <TableCell className="text-right font-medium">
                    {(() => {
                      const totalMat = (os.materiais || []).reduce((s: number, m: any) => s + (Number(m.valorTotal) || 0), 0);
                      const totalEst = (os.materiaisEstoque || []).reduce((s: number, m: any) => s + (Number(m.valorTotal) || 0), 0);
                      const total = totalMat + totalEst;
                      return total > 0 ? total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-";
                    })()}
                  </TableCell>
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
                            <Pencil className="mr-2 h-4 w-4" /> Preencher OS
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

      {temFiltrosAtivos && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4 px-6">
            <div className="flex items-center gap-3">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Total de {ordensFiltradas.length} OS filtrada(s)
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Valor Total</p>
              <p className="text-xl font-bold text-primary">
                {totalValorFiltrado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={o => { if (!o) { resetForm(); } setFormOpen(o); }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Preencher Ordem de Serviço" : "Nova Ordem de Serviço"}</DialogTitle>
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
                <Select value={categoria} onValueChange={v => { setCategoria(v); setServico(""); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione a categoria..." /></SelectTrigger>
                  <SelectContent>
                    {categoriasServicos.map(c => (
                      <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Serviço</Label>
                <Select value={servico} onValueChange={setServico}>
                  <SelectTrigger><SelectValue placeholder="Selecione o serviço..." /></SelectTrigger>
                  <SelectContent>
                    {servicosCadastrados
                      .filter(s => {
                        if (!categoria) return true;
                        const cat = categoriasServicos.find(c => c.nome === categoria);
                        return cat ? s.categoriaId === cat.id : true;
                      })
                      .map(s => (
                        <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
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
                    <div className="w-[180px]">
                      <Label>Qtd.</Label>
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => setScoQtd(Math.max(1, scoQtd - 1))}>-</Button>
                        <Input type="number" min={1} value={scoQtd} onChange={e => setScoQtd(Math.max(1, Number(e.target.value) || 1))} className="text-center text-base font-medium" />
                        <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => setScoQtd(scoQtd + 1)}>+</Button>
                      </div>
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
                                <Input type="number" className="h-8 text-xs bg-muted cursor-not-allowed" value={m.valorUnitario} disabled />
                              </TableCell>
                              <TableCell>
                                <Input type="number" className="h-8 text-xs" value={m.quantidade} onChange={e => {
                                  const updated = [...materiais]; updated[idx] = { ...m, quantidade: Number(e.target.value), valorTotal: m.valorUnitario * Number(e.target.value) }; setMateriais(updated);
                                }} onBlur={() => autoSaveMateriais(materiais)} />
                              </TableCell>
                              <TableCell className="text-xs font-medium">R$ {m.valorTotal.toFixed(2)}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { const updated = materiais.filter(x => x.id !== m.id); setMateriais(updated); autoSaveMateriais(updated); }}><Trash2 className="h-3 w-3" /></Button>
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
                  {!clienteId ? (
                    <p className="text-sm text-muted-foreground">Selecione um cliente para visualizar o estoque disponível.</p>
                  ) : saldosCliente.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum material em estoque para este cliente.</p>
                  ) : (
                    <div className="flex gap-2 items-end">
                      <div className="flex-[3]">
                        <Label>Buscar Material no Estoque</Label>
                        <Popover open={estoquePopoverOpen} onOpenChange={setEstoquePopoverOpen} modal={false}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-start font-normal h-10 text-sm">
                              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                              Buscar por código ou descrição...
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[500px] p-0" align="start" onOpenAutoFocus={e => e.preventDefault()}>
                            <Command shouldFilter={false}>
                              <CommandInput placeholder="Digite código ou descrição..." value={estoqueBusca} onValueChange={setEstoqueBusca} />
                              <CommandList>
                                <CommandEmpty>Nenhum material encontrado.</CommandEmpty>
                                <CommandGroup>
                                  {saldosFiltrados
                                    .filter(s => !materiaisEstoque.some(m =>
                                      m.id === `estoque:${s.materialId}__${s.local}` ||
                                      (
                                        m.codigo === s.materialCodigo &&
                                        m.descricao === s.materialDescricao &&
                                        Number(m.valorUnitario || 0) === Number(s.valorUnitarioFIFO || 0)
                                      )
                                    ))
                                    .slice(0, 50).map(s => (
                                    <CommandItem
                                      key={s.materialId + '__' + s.local}
                                      value={`${s.materialCodigo} ${s.materialDescricao} ${s.local}`.trim()}
                                      onSelect={() => {
                                        const newItem: MaterialOS = {
                                          id: `estoque:${s.materialId}__${s.local}`,
                                          codigo: s.materialCodigo,
                                          descricao: s.materialDescricao,
                                          unidade: "",
                                          valorUnitario: s.valorUnitarioFIFO || 0,
                                          quantidade: estoqueQtd,
                                          valorTotal: (s.valorUnitarioFIFO || 0) * estoqueQtd,
                                        };
                                        const updated = [...materiaisEstoque, newItem];
                                        setMateriaisEstoque(updated);
                                        autoSaveMateriaisEstoque(updated);
                                        toast.success("Material adicionado e salvo.");
                                        setEstoquePopoverOpen(true);
                                        setEstoqueQtd(1);
                                        requestAnimationFrame(() => setEstoqueBusca(""));
                                      }}
                                    >
                                      <div className="flex justify-between w-full items-center">
                                        <span className="text-xs"><strong>{s.materialCodigo}</strong> — {s.materialDescricao}</span>
                                        <div className="flex gap-2 ml-2">
                                          {s.valorUnitarioFIFO > 0 && (
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground">
                                              {s.valorUnitarioFIFO.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                            </span>
                                          )}
                                          <span className="inline-flex items-center rounded-full border-transparent bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                                            Saldo: {s.quantidade}
                                          </span>
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="w-[80px]">
                        <Label>Qtd.</Label>
                        <Input type="number" min={1} value={estoqueQtd} onChange={e => setEstoqueQtd(Number(e.target.value) || 1)} />
                      </div>
                    </div>
                  )}
                  {materiaisEstoque.length > 0 && (
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Código</TableHead><TableHead>Descrição</TableHead><TableHead className="text-center">Qtd.</TableHead><TableHead className="text-right">Vlr. Unit.</TableHead><TableHead className="text-right">Vlr. Total</TableHead><TableHead className="w-[50px]"></TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {materiaisEstoque.map((m, idx) => (
                          <TableRow key={m.id}>
                            <TableCell className="text-xs">{m.codigo}</TableCell>
                            <TableCell className="text-xs">{m.descricao}</TableCell>
                            <TableCell className="text-xs w-[100px]">
                              <Input type="number" className="h-8 text-xs text-center" min={1} value={m.quantidade} onChange={e => {
                                const qtd = Number(e.target.value) || 1;
                                const updated = [...materiaisEstoque];
                                updated[idx] = { ...m, quantidade: qtd, valorTotal: m.valorUnitario * qtd };
                                setMateriaisEstoque(updated);
                              }} onBlur={() => autoSaveMateriaisEstoque(materiaisEstoque)} />
                            </TableCell>
                            <TableCell className="text-xs text-right">{m.valorUnitario.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                            <TableCell className="text-xs text-right font-semibold">{(m.valorUnitario * m.quantidade).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                            <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                              const updated = materiaisEstoque.filter(x => x.id !== m.id);
                              setMateriaisEstoque(updated);
                              autoSaveMateriaisEstoque(updated);
                            }}><Trash2 className="h-3 w-3" /></Button></TableCell>
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
                          const cargoNome = cargos.find(c => c.id === func.cargoId)?.nome || "";
                          setProfissionais([...profissionais, { id: crypto.randomUUID(), funcionarioId: func.id, nome: func.nome, cargo: cargoNome }]);
                        }
                      }}>
                        <SelectTrigger><SelectValue placeholder="Selecionar profissional..." /></SelectTrigger>
                        <SelectContent>
                          {funcionarios.filter(f => f.status !== "Inativo" && f.clienteId === clienteId).map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
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
                            <TableCell className="text-xs">{p.cargo}</TableCell>
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
                  <ClipboardList className="h-4 w-4" /> Anexos ({anexos.length}/5)
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-3 space-y-3">
                  {anexos.length < 5 && (
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label>Arquivo (Word, Excel, PDF, DWG, PPT - máx. 5)</Label>
                        <Input
                          type="file"
                          accept=".doc,.docx,.xls,.xlsx,.pdf,.dwg,.ppt,.pptx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const allowedExts = ["doc", "docx", "xls", "xlsx", "pdf", "dwg", "ppt", "pptx"];
                            const ext = file.name.split(".").pop()?.toLowerCase() || "";
                            if (!allowedExts.includes(ext)) {
                              toast.error("Formato não permitido. Use: Word, Excel, PDF, DWG ou PPT.");
                              e.target.value = "";
                              return;
                            }
                            if (anexos.length >= 5) {
                              toast.error("Máximo de 5 anexos permitidos.");
                              e.target.value = "";
                              return;
                            }
                            const path = `os-anexos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                            const { error } = await supabase.storage.from("evidencias-anexos").upload(path, file);
                            if (error) {
                              console.error(error);
                              toast.error("Erro ao enviar arquivo.");
                              e.target.value = "";
                              return;
                            }
                            const { data: urlData } = supabase.storage.from("evidencias-anexos").getPublicUrl(path);
                            setAnexos([...anexos, { id: crypto.randomUUID(), titulo: file.name, url: urlData.publicUrl }]);
                            e.target.value = "";
                            toast.success("Arquivo anexado com sucesso!");
                          }}
                        />
                      </div>
                    </div>
                  )}
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
                  <Eye className="h-4 w-4" /> Fotos ({fotos.length}/5)
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-3 space-y-3">
                  {fotos.length < 5 && (
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label>Imagem (JPG, PNG, WEBP - máx. 5)</Label>
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (!file.type.startsWith("image/")) {
                              toast.error("Apenas imagens são permitidas.");
                              e.target.value = "";
                              return;
                            }
                            if (fotos.length >= 5) {
                              toast.error("Máximo de 5 fotos permitidas.");
                              e.target.value = "";
                              return;
                            }
                            const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
                            const path = `os-fotos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                            const { error } = await supabase.storage.from("evidencias-anexos").upload(path, file);
                            if (error) {
                              console.error(error);
                              toast.error("Erro ao enviar imagem.");
                              e.target.value = "";
                              return;
                            }
                            const { data: urlData } = supabase.storage.from("evidencias-anexos").getPublicUrl(path);
                            setFotos([...fotos, { id: crypto.randomUUID(), url: urlData.publicUrl }]);
                            e.target.value = "";
                            toast.success("Foto anexada com sucesso!");
                          }}
                        />
                      </div>
                    </div>
                  )}
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
