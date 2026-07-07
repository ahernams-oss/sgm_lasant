import { useState, useMemo, useCallback, useRef, useEffect, type ReactNode } from "react"; // OS page
import { loadPersistedFilters, usePersistFilters } from "@/lib/persistedFilters";
import { useColumnOrder } from "@/hooks/useColumnOrder";
import { SortableHeaderRow, SortableTableHead } from "@/components/SortableTableHead";
import { updateRow, fetchAll } from "@/lib/supabaseHelper";
import { SolicitacaoServico } from "@/contexts/SolicitacoesServicosContext";
import { useOrcamentos } from "@/contexts/OrcamentosContext";
import { supabase } from "@/integrations/supabase/client";
import { formatNumeroAno } from "@/lib/formatNumero";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useOrdensServico, OrdemServico, MaterialOS, ProfissionalOS, AnexoOS, FotoOS, ObservacaoOS, ObservacaoFiscalizacao, TIPOS_OS, TipoOS } from "@/contexts/OrdensServicoContext";
import { useCategoriasServicos } from "@/contexts/CategoriasServicosContext";
import { useServicos } from "@/contexts/ServicosContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissao } from "@/hooks/usePermissao";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DoubleConfirmDelete, useDoubleConfirmDelete } from "@/components/DoubleConfirmDelete";
import PaginationControls, { paginate } from "@/components/PaginationControls";
import { toast } from "sonner";
import {
  Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, ChevronDown, ChevronUp,
  ClipboardList, Clock, CheckCircle2, XCircle, AlertTriangle, Wrench, Play, ShieldCheck, ShieldX, RotateCcw, BadgeCheck, Ban, History, Printer, FileSignature
} from "lucide-react";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { gerarPdfOrdemServico, gerarPdfOrdemServicoLote } from "@/lib/gerarPdfOrdemServico";
import WorkflowTimeline from "@/components/WorkflowTimeline";
import WorkflowHistorico from "@/components/WorkflowHistorico";
import RelatorioFechamentoOSDialog from "@/components/RelatorioFechamentoOSDialog";
import { AssinaturaEletronicaOs } from "@/components/AssinaturaEletronicaOs";
import { AvaliacaoOs } from "@/components/AvaliacaoOs";
import { useOsAssinaturas } from "@/contexts/OsAssinaturasContext";
import { BarChart3, Camera, ImagePlus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const OS_WORKFLOW_STEPS = [
  { label: "Aberta" },
  { label: "Executada" },
  { label: "Serviço Confirmado" },
  { label: "Validada" },
];

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
  "Serviço Confirmado": "#7dd3fc",
  "Validada": "#2a8819",
  "Serviço Não Aprovado pela Fiscalização": "#8b4513",
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

const DEFAULT_PAGE_SIZE = 7;

function FotosUploader({ disabled, onUploaded, currentCount }: { disabled: boolean; onUploaded: (url: string) => void; currentCount: number }) {
  const isMobile = useIsMobile();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são permitidas.");
      e.target.value = "";
      return;
    }
    if (currentCount >= 5) {
      toast.error("Máximo de 5 fotos permitidas.");
      e.target.value = "";
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `os-fotos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("evidencias-anexos").upload(path, file);
      if (error) {
        console.error(error);
        toast.error("Erro ao enviar imagem.");
        return;
      }
      const { data: urlData } = supabase.storage.from("evidencias-anexos").getPublicUrl(path);
      onUploaded(urlData.publicUrl);
      toast.success("Foto anexada com sucesso!");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>Imagem (JPG, PNG, WEBP - máx. 5)</Label>
      <div className="flex flex-wrap gap-2">
        {isMobile && (
          <Button type="button" variant="outline" disabled={disabled || busy} onClick={() => cameraRef.current?.click()}>
            <Camera className="h-4 w-4 mr-2" />
            Câmera
          </Button>
        )}
        <Button type="button" variant="outline" disabled={disabled || busy} onClick={() => galleryRef.current?.click()}>
          <ImagePlus className="h-4 w-4 mr-2" />
          {isMobile ? "Galeria" : "Escolher arquivo"}
        </Button>
        {busy && <span className="text-sm text-muted-foreground self-center">Enviando...</span>}
      </div>
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}


export default function OrdensServicoPage() {
  const { ordens, addOrdem, updateOrdem, deleteOrdem } = useOrdensServico();
  const { assinaturas: assinaturasOs = [] } = useOsAssinaturas();
  const { clientes } = useClientes();
  const { empresa } = useEmpresa();
  const { usuarioLogado } = useAuth();
  const { tem } = usePermissao();
  const podeExcluirOS = tem("ordem_servico.excluir");
  const podeEditarOS = tem("ordem_servico.editar");
  const podeWorkflowOS = tem("ordem_servico.gerenciar_historico");
  const podeImprimirOS = tem("ordem_servico.exportar_pdf");
  const podeExecutarLote = tem("ordem_servico.gerenciar_historico");
  const podeStAbertaOS = tem("ordem_servico.status.aberta");
  const podeStEmExecOS = tem("ordem_servico.status.em_execucao");
  const podeStConcluidaOS = tem("ordem_servico.status.concluida");
  const podeStCanceladaOS = tem("ordem_servico.status.cancelada");
  const podeStValidadaOS = tem("ordem_servico.status.validada");
  const podeStConfirmadaOS = tem("ordem_servico.status.confirmada");
  const podeStReprovadaOS = tem("ordem_servico.status.reprovada");
  const podeStatusOS = (sit: string) => {
    if (sit === "Aberta") return podeStAbertaOS;
    if (sit === "Cancelada") return podeStCanceladaOS;
    if (sit === "Validada") return podeStValidadaOS;
    if (sit === "Serviço Confirmado") return podeStConfirmadaOS;
    if (sit === "Serviço Não Aprovado pela Fiscalização") return podeStReprovadaOS;
    if (sit === "Concluída") return podeStConcluidaOS;
    return podeStEmExecOS;
  };

  const buildOSHistorico = (situacao: string, existing: any[] = []) => [
    ...existing,
    { situacao, data: new Date().toISOString(), usuario: usuarioLogado?.nome || "Sistema" },
  ];
  const { categorias: categoriasServicos } = useCategoriasServicos();
  const { servicos: servicosCadastrados } = useServicos();
  const { scos } = useSco();
  const { items: i0Items } = useI0();
  const { funcionarios } = useFuncionarios();
  const { movimentacoes, registrarMovimentacao } = useEstoque();
  const { pedidos } = usePedidoCompra();
  const { requisicoes } = useRequisicaoCompras();
  const { cargos } = useCargos();
  const navigate = useNavigate();

  const clientesFiltrados = clientes.filter(c => c.tipo === "Cliente");

  const [formOpen, setFormOpen] = useState(false);
  const [relatorioOpen, setRelatorioOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewOS, setViewOS] = useState<OrdemServico | null>(null);
  const [viewSSTarget, setViewSSTarget] = useState<SolicitacaoServico | null>(null);
  const { orcamentos: orcamentosAll } = useOrcamentos();
  const _osSavedFilters = loadPersistedFilters<{ busca: string; filtroSituacao: string; filtroPrioridade: string; filtroDataInicio: string; filtroDataFim: string; }>("ordens_servico_filters_v1");
  const [busca, setBusca] = useState(_osSavedFilters?.busca ?? "");
  const [filtroSituacao, setFiltroSituacao] = useState(_osSavedFilters?.filtroSituacao ?? "Todas");
  const [filtroCliente, setFiltroCliente] = useState(() => localStorage.getItem("os_filtroCliente") || "Todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState(_osSavedFilters?.filtroPrioridade ?? "Todas");
  const [filtroDataInicio, setFiltroDataInicio] = useState(_osSavedFilters?.filtroDataInicio ?? "");
  const [filtroDataFim, setFiltroDataFim] = useState(_osSavedFilters?.filtroDataFim ?? "");
  const _osDatasStatus = loadPersistedFilters<{ confIni: string; confFim: string; valIni: string; valFim: string }>("ordens_servico_datas_status_v1");
  const [filtroConfirmadoIni, setFiltroConfirmadoIni] = useState(_osDatasStatus?.confIni ?? "");
  const [filtroConfirmadoFim, setFiltroConfirmadoFim] = useState(_osDatasStatus?.confFim ?? "");
  const [filtroValidadaIni, setFiltroValidadaIni] = useState(_osDatasStatus?.valIni ?? "");
  const [filtroValidadaFim, setFiltroValidadaFim] = useState(_osDatasStatus?.valFim ?? "");
  usePersistFilters("ordens_servico_filters_v1", { busca, filtroSituacao, filtroPrioridade, filtroDataInicio, filtroDataFim });
  usePersistFilters("ordens_servico_datas_status_v1", { confIni: filtroConfirmadoIni, confFim: filtroConfirmadoFim, valIni: filtroValidadaIni, valFim: filtroValidadaFim });
  const _osTipoData = loadPersistedFilters<{ tipo: "inicio" | "confirmado" | "validada" }>("ordens_servico_tipo_data_v1");
  const [tipoDataFiltro, setTipoDataFiltro] = useState<"inicio" | "confirmado" | "validada">(_osTipoData?.tipo ?? "inicio");
  usePersistFilters("ordens_servico_tipo_data_v1", { tipo: tipoDataFiltro });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const numero = searchParams.get("numero");
    if (numero) {
      setBusca(numero);
      setFiltroSituacao("Todas");
      setFiltroCliente("Todos");
      setFiltroPrioridade("Todas");
      setFiltroDataInicio("");
      setFiltroDataFim("");
      setPage(1);
      const next = new URLSearchParams(searchParams);
      next.delete("numero");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Form fields
  const [clienteId, setClienteId] = useState("");
  const [nCliente, setNCliente] = useState("");
  const [situacao, setSituacao] = useState("Aberta");
  const [tipoOs, setTipoOs] = useState<TipoOS>(TIPOS_OS[0]);
  const [dataInicio, setDataInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [dataTermino, setDataTermino] = useState("");
  const [horaTermino, setHoraTermino] = useState("");
  const [prioridade, setPrioridade] = useState("C: NORMAL");
  const [complexidade, setComplexidade] = useState<"Baixa" | "Média" | "Alta">("Baixa");
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

  // "Não Aprovar" justification dialog state
  const [naoAprovarOS, setNaoAprovarOS] = useState<OrdemServico | null>(null);
  const [naoAprovarJustificativa, setNaoAprovarJustificativa] = useState("");
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


  // Recalculate financial values for an OS based on current client contract
  const recalcFinanceiro = (os: OrdemServico) => {
    const cliente = clientes.find(c => c.id === os.clienteId);
    const contratos = (cliente as any)?.contratos || [];
    const contrato = contratos[0];
    const bdi = contrato?.bdi ? Number(String(contrato.bdi).replace(",", ".")) : 0;
    const safeBdi = isNaN(bdi) ? 0 : bdi;

    const recalcMateriais = (mats: MaterialOS[]) =>
      mats.map(m => {
        const vt = (Number(m.valorUnitario) || 0) * (Number(m.quantidade) || 0);
        return { ...m, valorTotal: isNaN(vt) ? 0 : vt };
      });

    const matSCO = recalcMateriais(os.materiais || []);
    const matEstoque = recalcMateriais(os.materiaisEstoque || []);

    return {
      bdi: safeBdi,
      materiais: matSCO,
      materiais_estoque: matEstoque,
    };
  };

  // Workflow action handler
   const handleWorkflowAction = async (os: OrdemServico, novaSituacao: string) => {
    if (!podeWorkflowOS || !podeStatusOS(novaSituacao)) {
      toast.error(`Você não possui permissão para alterar a OS para "${novaSituacao}".`);
      return;
    }
    // If rejecting, open justification dialog instead
    if (novaSituacao === "Serviço Não Aprovado pela Fiscalização") {
      setNaoAprovarOS(os);
      setNaoAprovarJustificativa("");
      return;
    }
    const financeiro = recalcFinanceiro(os);
    await updateOrdem(os.id, {
      situacao: novaSituacao,
      historico: buildOSHistorico(novaSituacao, os.historico || []),
      ...financeiro,
    });
    // Ao confirmar o serviço, dar saída automática no estoque e concluir SS vinculada
    if (novaSituacao === "Serviço Confirmado") {
      // Saída automática dos materiais de estoque utilizados na OS
      if (Array.isArray(os.materiaisEstoque) && os.materiaisEstoque.length > 0) {
        for (const mat of os.materiaisEstoque) {
          if ((Number(mat.quantidade) || 0) > 0) {
            await registrarMovimentacao({
              materialId: mat.id,
              materialCodigo: mat.codigo,
              materialDescricao: mat.descricao,
              tipo: "saida",
              quantidade: Number(mat.quantidade) || 0,
              local: os.clienteNome || "",
              documentoRef: `OS ${formatNumeroAno(os.numero, os.createdAt)}`,
              observacao: `Saída automática - Ordem de Serviço nº ${formatNumeroAno(os.numero, os.createdAt)}`,
              usuario: usuarioLogado?.nome || "Sistema",
              lote: "",
              validade: "",
              depositoOrigem: "",
              depositoDestino: "",
              fornecedorNome: "",
              valorUnitario: Number(mat.valorUnitario) || 0,
            });
          }
        }
      }
      // Concluir a Solicitação vinculada
      if (os.solicitacaoId) {
        const { data: ssData } = await (supabase as any).from("solicitacoes_servicos").select("historico").eq("id", os.solicitacaoId).single();
        const histAtual = Array.isArray(ssData?.historico) ? ssData.historico : [];
        const novoHist = [...histAtual, { situacao: "Concluída", data: new Date().toISOString(), usuario: usuarioLogado?.nome || "Sistema" }];
        await updateRow("solicitacoes_servicos", os.solicitacaoId, {
          situacao: "Concluída",
          historico: novoHist,
        });
      }
    }
    toast.success(`OS ${formatNumeroAno(os.numero, os.createdAt)} alterada para "${novaSituacao}"`);
  };

  const handleConfirmNaoAprovar = async () => {
    if (!podeWorkflowOS || !podeStEmExecOS) {
      toast.error("Você não possui permissão para esta ação.");
      return;
    }
    if (!naoAprovarOS) return;
    if (!naoAprovarJustificativa.trim()) {
      toast.error("A justificativa é obrigatória.");
      return;
    }
    const novaObsFisc: ObservacaoFiscalizacao = {
      id: crypto.randomUUID(),
      titulo: "Serviço Não Aprovado",
      descricao: naoAprovarJustificativa.trim(),
      usuario: usuarioLogado?.nome || "Sistema",
      data: new Date().toISOString().split("T")[0],
    };
    const obsExistentes: ObservacaoFiscalizacao[] = Array.isArray(naoAprovarOS.observacoesFiscalizacao)
      ? naoAprovarOS.observacoesFiscalizacao : [];
    const financeiro = recalcFinanceiro(naoAprovarOS);
    await updateOrdem(naoAprovarOS.id, {
      situacao: "Serviço Não Aprovado pela Fiscalização",
      historico: buildOSHistorico("Serviço Não Aprovado pela Fiscalização", naoAprovarOS.historico || []),
      observacoes_fiscalizacao: [...obsExistentes, novaObsFisc],
      ...financeiro,
    });
    toast.success(`OS ${formatNumeroAno(naoAprovarOS.numero, naoAprovarOS.createdAt)} alterada para "Serviço Não Aprovado pela Fiscalização"`);
    setNaoAprovarOS(null);
    setNaoAprovarJustificativa("");
  };

  const handleCancelOS = async () => {
    if (!podeWorkflowOS || !podeStCanceladaOS) {
      toast.error("Você não possui permissão para cancelar OS.");
      cancelCancelAction();
      return;
    }
    if (cancelId) {
      const os = ordens.find(o => o.id === cancelId);
      const financeiro = os ? recalcFinanceiro(os) : {};
      await updateOrdem(cancelId, {
        situacao: "Cancelada",
        historico: buildOSHistorico("Cancelada", os?.historico || []),
        ...financeiro,
      });
      toast.success("Ordem de Serviço cancelada!");
      cancelCancelAction();
    }
  };

  // Get available workflow actions based on current situação
  const getWorkflowActions = (os: OrdemServico) => {
    let acts: any[] = [];
    switch (os.situacao) {
      case "Aberta":
        acts = [
          { label: "Executar", icon: Play, target: "Executada", action: () => handleWorkflowAction(os, "Executada") },
          { label: "Cancelar OS", icon: Ban, target: "Cancelada", action: () => requestCancel(os.id), destructive: true },
        ]; break;
      case "Executada":
        acts = [
          { label: "Serviço Confirmado", icon: ShieldCheck, target: "Serviço Confirmado", action: () => handleWorkflowAction(os, "Serviço Confirmado") },
          { label: "Serviço Não Aprovado pela Fiscalização", icon: ShieldX, target: "Serviço Não Aprovado pela Fiscalização", action: () => handleWorkflowAction(os, "Serviço Não Aprovado pela Fiscalização") },
        ]; break;
      case "Serviço Confirmado":
        acts = [{ label: "Validar OS", icon: BadgeCheck, target: "Validada", action: () => handleWorkflowAction(os, "Validada") }]; break;
      case "Serviço Não Aprovado pela Fiscalização":
        acts = [{ label: "Serviço Re-executado", icon: RotateCcw, target: "Serviço Re-executado", action: () => handleWorkflowAction(os, "Serviço Re-executado") }]; break;
      case "Serviço Re-executado":
        acts = [
          { label: "Serviço Confirmado", icon: ShieldCheck, target: "Serviço Confirmado", action: () => handleWorkflowAction(os, "Serviço Confirmado") },
          { label: "Serviço Não Aprovado pela Fiscalização", icon: ShieldX, target: "Serviço Não Aprovado pela Fiscalização", action: () => handleWorkflowAction(os, "Serviço Não Aprovado pela Fiscalização") },
        ]; break;
      default: acts = [];
    }
    return acts.filter(a => podeStatusOS(a.target));
  };

  const clienteSelecionado = clientesFiltrados.find(c => c.id === clienteId);
  const locais = clienteSelecionado?.locais || [];
  const localSelecionado = (locais as any[]).find((l: any) => l.id === localId);
  const pavimentos = localSelecionado?.pavimentos || [];
  const pavimentoSelecionado = (pavimentos as any[]).find((p: any) => p.id === pavimentoId);
  const setores = pavimentoSelecionado?.setores || [];

  // BDI from client's contract
  const parseBdi = (val: any): number => {
    if (!val) return 0;
    const n = Number(String(val).replace(",", "."));
    return isNaN(n) ? 0 : n;
  };
  const bdiPercentual = useMemo(() => {
    const contratos = clienteSelecionado?.contratos || [];
    const contrato = contratos[0];
    return parseBdi(contrato?.bdi);
  }, [clienteSelecionado]);

  // Helper: calc total with BDI
  const calcTotalComBDI = (matSCO: any[], matEstoque: any[], bdi: number) => {
    const totalItens = matSCO.reduce((s: number, m: any) => s + (Number(m.valorTotal) || 0), 0)
      + matEstoque.reduce((s: number, m: any) => s + (Number(m.valorTotal) || 0), 0);
    const safeBdi = isNaN(bdi) ? 0 : bdi;
    return totalItens * (1 + safeBdi / 100);
  };

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
    setClienteId(""); setNCliente(""); setSituacao("Aberta"); setTipoOs(TIPOS_OS[0]);
    setDataInicio(""); setHoraInicio(""); setDataTermino(""); setHoraTermino("");
    setPrioridade("C: NORMAL"); setComplexidade("Baixa"); setSolicitante(""); setMatricula("");
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
    if (!podeEditarOS) {
      toast.error("Você não possui permissão para editar Ordens de Serviço.");
      return;
    }
    setEditingId(os.id);
    setClienteId(os.clienteId); setNCliente(os.nCliente); setSituacao(os.situacao); setTipoOs(os.tipoOs);
    setDataInicio(os.dataInicio); setHoraInicio(os.horaInicio);
    setDataTermino(os.dataTermino); setHoraTermino(os.horaTermino);
    setPrioridade(os.prioridade); setComplexidade((os as any).complexidade || "Baixa"); setSolicitante(os.solicitante);
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
      complexidade,
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
      bdi: bdiPercentual,
      tipo_os: tipoOs,
    };

    if (editingId) {
      await updateOrdem(editingId, row);
      toast.success("Ordem de Serviço atualizada!");
    } else {
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
    if (!podeExcluirOS) {
      toast.error("Você não possui permissão para excluir Ordens de Serviço.");
      cancelDelete();
      return;
    }
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
        formatNumeroAno(o.numero, o.createdAt).toLowerCase().includes(q) ||
        o.clienteNome.toLowerCase().includes(q) ||
        o.nCliente.toLowerCase().includes(q) ||
        o.descricaoServicos.toLowerCase().includes(q) ||
        o.solicitante.toLowerCase().includes(q) ||
        o.localDescricao.toLowerCase().includes(q) ||
        o.setorDescricao.toLowerCase().includes(q) ||
        o.categoria.toLowerCase().includes(q);
      const matchSituacao = filtroSituacao === "Todas" || o.situacao === filtroSituacao;
      const matchCliente = filtroCliente === "Todos" || o.clienteId === filtroCliente;
      const matchPrioridade = filtroPrioridade === "Todas" || o.prioridade === filtroPrioridade;
      const matchDataInicio = !filtroDataInicio || o.dataInicio >= filtroDataInicio;
      const matchDataFim = !filtroDataFim || o.dataInicio <= filtroDataFim;
      const dataStatus = (situacao: string): string | null => {
        const hist = (o.historico || []).filter((h: any) => h?.situacao === situacao);
        if (hist.length === 0) return null;
        const last = hist[hist.length - 1];
        const d = last?.data ? String(last.data).slice(0, 10) : null;
        return d;
      };
      const dtConf = (filtroConfirmadoIni || filtroConfirmadoFim) ? dataStatus("Serviço Confirmado") : "ok";
      const matchConfIni = !filtroConfirmadoIni || (dtConf && dtConf !== "ok" && dtConf >= filtroConfirmadoIni);
      const matchConfFim = !filtroConfirmadoFim || (dtConf && dtConf !== "ok" && dtConf <= filtroConfirmadoFim);
      const dtVal = (filtroValidadaIni || filtroValidadaFim) ? dataStatus("Validada") : "ok";
      const matchValIni = !filtroValidadaIni || (dtVal && dtVal !== "ok" && dtVal >= filtroValidadaIni);
      const matchValFim = !filtroValidadaFim || (dtVal && dtVal !== "ok" && dtVal <= filtroValidadaFim);
      return matchBusca && matchSituacao && matchCliente && matchPrioridade && matchDataInicio && matchDataFim
        && matchConfIni && matchConfFim && matchValIni && matchValFim;
    });
  }, [ordens, busca, filtroSituacao, filtroCliente, filtroPrioridade, filtroDataInicio, filtroDataFim, filtroConfirmadoIni, filtroConfirmadoFim, filtroValidadaIni, filtroValidadaFim]);

  const limparFiltros = () => {
    setBusca(""); setFiltroSituacao("Todas"); setFiltroCliente("Todos"); localStorage.setItem("os_filtroCliente", "Todos");
    setFiltroPrioridade("Todas"); setFiltroDataInicio(""); setFiltroDataFim("");
    setFiltroConfirmadoIni(""); setFiltroConfirmadoFim(""); setFiltroValidadaIni(""); setFiltroValidadaFim("");
    setPage(1);
  };

  const temFiltrosAtivos = busca || filtroSituacao !== "Todas" || filtroCliente !== "Todos" || filtroPrioridade !== "Todas" || filtroDataInicio || filtroDataFim || filtroConfirmadoIni || filtroConfirmadoFim || filtroValidadaIni || filtroValidadaFim;

  const totalValorFiltrado = useMemo(() => {
    return ordensFiltradas.reduce((acc, os) => {
      const bdi = os.bdi || 0;
      return acc + calcTotalComBDI(os.materiais || [], os.materiaisEstoque || [], bdi);
    }, 0);
  }, [ordensFiltradas]);

  // Saldo VTM (Mensal / Anual) para o cliente selecionado
  const parseBRLNum = (s?: string) => {
    if (!s) return 0;
    const cleaned = String(s).replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  };
  const vtmInfo = useMemo(() => {
    if (filtroCliente === "Todos") return null;
    const cli = clientes.find(c => c.id === filtroCliente);
    if (!cli) return null;
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    // contrato vigente
    const contratoVigente = (cli.contratos || []).find(ct => {
      if (!ct.dataInicio) return false;
      const di = new Date(ct.dataInicio + "T00:00:00");
      const df = ct.dataFim ? new Date(ct.dataFim + "T23:59:59") : null;
      return di <= hoje && (!df || df >= hoje);
    }) || (cli.contratos || [])[0];
    if (!contratoVigente) return null;
    const vtmMensal = parseBRLNum(contratoVigente.valorBase);
    const vtmAnual = parseBRLNum(contratoVigente.valorBase2);
    if (vtmMensal <= 0 && vtmAnual <= 0) return null;

    const osCliente = ordens.filter(o => o.clienteId === filtroCliente);
    const gastoMes = osCliente.reduce((acc, os) => {
      const ref = os.createdAt ? new Date(os.createdAt) : null;
      if (!ref || ref.getFullYear() !== ano || ref.getMonth() !== mes) return acc;
      if (os.situacao !== "Validada") return acc;
      return acc + calcTotalComBDI(os.materiais || [], os.materiaisEstoque || [], os.bdi || 0);
    }, 0);
    const gastoAno = osCliente.reduce((acc, os) => {
      const ref = os.createdAt ? new Date(os.createdAt) : null;
      if (!ref || ref.getFullYear() !== ano) return acc;
      if (os.situacao !== "Validada") return acc;
      return acc + calcTotalComBDI(os.materiais || [], os.materiaisEstoque || [], os.bdi || 0);
    }, 0);
    return {
      vtmMensal, gastoMes, saldoMes: vtmMensal - gastoMes,
      vtmAnual, gastoAno, saldoAno: vtmAnual - gastoAno,
      clienteNome: cli.nome,
    };
  }, [filtroCliente, clientes, ordens]);

  const { paginated: ordensPage, totalPages, safePage } = paginate(ordensFiltradas, page, pageSize);

  const colDefs: Record<string, { label: string; className?: string }> = {
    numero: { label: "Nº OS", className: "w-[110px] whitespace-nowrap" },
    cliente: { label: "Cliente" },
    descricao: { label: "Descrição" },
    setor: { label: "Setor" },
    prioridade: { label: "Prioridade" },
    situacao: { label: "Situação" },
    dataAbertura: { label: "Data Abertura" },
    dataInicio: { label: "Data Início" },
    valor: { label: "Valor (c/ BDI)", className: "text-right" },
  };
  const { order: colOrder, setOrder: setColOrder } = useColumnOrder(
    "ordens_servico.lista",
    ["numero", "cliente", "descricao", "setor", "prioridade", "situacao", "dataAbertura", "dataInicio", "valor"]
  );

  const abertasNaPagina = ordensPage.filter(o => o.situacao === "Aberta");
  const allAbertasSelected = abertasNaPagina.length > 0 && abertasNaPagina.every(o => selectedIds.has(o.id));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allAbertasSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        abertasNaPagina.forEach(o => next.delete(o.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        abertasNaPagina.forEach(o => next.add(o.id));
        return next;
      });
    }
  };

  const handleBatchExecutar = async () => {
    if (!podeExecutarLote) {
      toast.error("Você não possui permissão para executar OS em lote.");
      return;
    }
    const ids = Array.from(selectedIds);
    const abertasSelecionadas = ordens.filter(o => ids.includes(o.id) && o.situacao === "Aberta");
    if (abertasSelecionadas.length === 0) {
      toast.error("Nenhuma OS com situação 'Aberta' selecionada.");
      return;
    }
    for (const os of abertasSelecionadas) {
      const financeiro = recalcFinanceiro(os);
      await updateOrdem(os.id, {
        situacao: "Executada",
        historico: buildOSHistorico("Executada", os.historico || []),
        ...financeiro,
      });
    }
    toast.success(`${abertasSelecionadas.length} OS(s) alterada(s) para "Executada"`);
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2 mx-[20px] my-[5px]">
          <Wrench className="h-6 w-6" /> Ordem de Serviço
        </h1>
        <div className="flex items-center gap-2 mx-[24px] my-[2px]">
          <Button variant="outline" onClick={() => setRelatorioOpen(true)}>
            <BarChart3 className="mr-2 h-4 w-4" /> Relatórios
          </Button>
          {/* Botão "Nova OS" oculto temporariamente para todos os usuários */}
          {false && (
            <Button onClick={() => { resetForm(); setFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Nova OS
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
       <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Nº, cliente, descrição, local, setor..." value={busca} onChange={e => { setBusca(e.target.value); setPage(1); }} className="pl-8" />
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
            <div className="w-[180px]">
              <Label>Tipo de Data</Label>
              <Select value={tipoDataFiltro} onValueChange={(v: any) => {
                setTipoDataFiltro(v);
                setFiltroDataInicio(""); setFiltroDataFim("");
                setFiltroConfirmadoIni(""); setFiltroConfirmadoFim("");
                setFiltroValidadaIni(""); setFiltroValidadaFim("");
                setPage(1);
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inicio">Data Início</SelectItem>
                  <SelectItem value="confirmado">Serv. Confirmado</SelectItem>
                  <SelectItem value="validada">Validação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[150px]">
              <Label>De</Label>
              <Input type="date"
                value={tipoDataFiltro === "inicio" ? filtroDataInicio : tipoDataFiltro === "confirmado" ? filtroConfirmadoIni : filtroValidadaIni}
                onChange={e => {
                  const v = e.target.value;
                  if (tipoDataFiltro === "inicio") setFiltroDataInicio(v);
                  else if (tipoDataFiltro === "confirmado") setFiltroConfirmadoIni(v);
                  else setFiltroValidadaIni(v);
                  setPage(1);
                }} />
            </div>
            <div className="w-[150px]">
              <Label>Até</Label>
              <Input type="date"
                value={tipoDataFiltro === "inicio" ? filtroDataFim : tipoDataFiltro === "confirmado" ? filtroConfirmadoFim : filtroValidadaFim}
                onChange={e => {
                  const v = e.target.value;
                  if (tipoDataFiltro === "inicio") setFiltroDataFim(v);
                  else if (tipoDataFiltro === "confirmado") setFiltroConfirmadoFim(v);
                  else setFiltroValidadaFim(v);
                  setPage(1);
                }} />
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

      {/* Batch action bar */}
      {selectedIds.size > 0 && (
        <Card>
          <CardContent className="py-3 flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium">{selectedIds.size} OS(s) selecionada(s)</span>
            {podeExecutarLote && (
              <Button size="sm" onClick={handleBatchExecutar}>
                <Play className="mr-2 h-4 w-4" /> Executar em Lote
              </Button>
            )}
            {podeImprimirOS && (
              <Button size="sm" variant="outline" onClick={async () => {
                const lista = ordens
                  .filter(o => selectedIds.has(o.id))
                  .map(o => ({
                    os: o,
                    empresa,
                    cliente: clientes.find(c => c.id === o.clienteId),
                    assinaturas: assinaturasOs.filter(a => a.os_id === o.id),
                  }));
                if (lista.length === 0) return;
                await gerarPdfOrdemServicoLote(lista);
                toast.success(`${lista.length} OS(s) impressas`);
              }}>
                <Printer className="mr-2 h-4 w-4" /> Imprimir em Lote
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              Limpar seleção
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <SortableHeaderRow order={colOrder} onReorder={setColOrder}>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={allAbertasSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Selecionar todas abertas"
                  />
                </TableHead>
                {colOrder.map((key) => {
                  const c = colDefs[key];
                  if (!c) return null;
                  return (
                    <SortableTableHead key={key} id={key} className={c.className}>
                      {c.label}
                    </SortableTableHead>
                  );
                })}
                <TableHead className="w-[50px]"></TableHead>
              </SortableHeaderRow>
            </TableHeader>
            <TableBody>
              {ordensPage.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                    Nenhuma Ordem de Serviço encontrada.
                  </TableCell>
                </TableRow>
              ) : ordensPage.map((os, idx) => {
                const ass = assinaturasOs.filter(a => a.os_id === os.id);
                const tooltip = ass.map(a => `${a.papel === "solicitante" ? "Solicitante" : a.papel === "fiscal" ? "Fiscal 1" : a.papel === "fiscal_2" ? "Fiscal 2" : "Fiscal 3"}: ${a.signatario_nome}`).join(" | ");
                const totalBDI = calcTotalComBDI(os.materiais || [], os.materiaisEstoque || [], os.bdi || 0);
                const cellMap: Record<string, { node: ReactNode; className?: string }> = {
                  numero: {
                    node: (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <span className="font-bold">{formatNumeroAno(os.numero, os.createdAt)}</span>
                          {ass.length > 0 && (
                            <span className="flex items-center gap-0.5 text-primary" title={`Assinada eletronicamente — ${tooltip}`}>
                              {ass.map((a) => (
                                <FileSignature key={a.id} className="h-3.5 w-3.5" />
                              ))}
                            </span>
                          )}
                        </div>
                        {os.solicitacaoNumero ? (
                          <a
                            href={`/engenharia/solicitacao-servicos?numero=${os.solicitacaoNumero}`}
                            className="text-[10px] text-primary hover:underline font-medium whitespace-nowrap"
                            title="Ver Solicitação de Serviço vinculada"
                            onClick={(e) => e.stopPropagation()}
                          >
                            SS {formatNumeroAno(os.solicitacaoNumero, os.createdAt)}
                          </a>
                        ) : null}
                      </div>
                    ),
                    className: "align-top",
                  },
                  cliente: { node: os.clienteNome },
                  descricao: { node: os.descricaoServicos, className: "max-w-[250px] truncate" },
                  setor: { node: os.setorDescricao || "—", className: "text-sm" },
                  prioridade: { node: prioridadeBadge(os.prioridade) },
                  situacao: { node: situacaoBadge(os.situacao) },
                  dataAbertura: {
                    node: os.createdAt ? new Date(os.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-",
                    className: "text-sm",
                  },
                  dataInicio: { node: os.dataInicio ? os.dataInicio.split("-").reverse().join("/") : "-" },
                  valor: {
                    node: totalBDI > 0 ? totalBDI.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-",
                    className: "text-right font-medium",
                  },
                };
                return (
                  <TableRow
                    key={os.id}
                    className={
                      selectedIds.has(os.id)
                        ? "bg-accent"
                        : idx % 2 === 1
                          ? "bg-gray-200/60 hover:bg-gray-200/80"
                          : "bg-white hover:bg-gray-100/60"
                    }
                  >
                    <TableCell>
                      {os.situacao === "Aberta" ? (
                        <Checkbox
                          checked={selectedIds.has(os.id)}
                          onCheckedChange={() => toggleSelect(os.id)}
                          aria-label={`Selecionar OS ${os.numero}`}
                        />
                      ) : null}
                    </TableCell>
                    {colOrder.map((key) => {
                      const c = cellMap[key];
                      return (
                        <TableCell key={key} className={c?.className}>
                          {c?.node}
                        </TableCell>
                      );
                    })}
                    <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewOS(os)}>
                          <Eye className="mr-2 h-4 w-4" /> Visualizar
                        </DropdownMenuItem>
                        {podeImprimirOS && (
                          <DropdownMenuItem onClick={async () => {
                            await gerarPdfOrdemServico({
                              os,
                              empresa,
                              cliente: clientes.find(c => c.id === os.clienteId),
                              assinaturas: assinaturasOs.filter(a => a.os_id === os.id),
                            });
                          }}>
                            <Printer className="mr-2 h-4 w-4" /> Imprimir OS
                          </DropdownMenuItem>
                        )}
                        {podeEditarOS && !["Validada", "Cancelada"].includes(os.situacao) && (
                          <DropdownMenuItem onClick={() => handleEdit(os)}>
                            <Pencil className="mr-2 h-4 w-4" /> Preencher OS
                          </DropdownMenuItem>
                        )}
                        {/* Workflow actions */}
                        {podeWorkflowOS && getWorkflowActions(os).length > 0 && <DropdownMenuSeparator />}
                        {podeWorkflowOS && getWorkflowActions(os).map((action, idx) => (
                          <DropdownMenuItem
                            key={idx}
                            onClick={action.action}
                            className={action.destructive ? "text-destructive" : ""}
                          >
                            <action.icon className="mr-2 h-4 w-4" /> {action.label}
                          </DropdownMenuItem>
                        ))}
                        {podeExcluirOS && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => requestDelete(os.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="px-4 pb-4">
              <PaginationControls currentPage={safePage} totalItems={ordensFiltradas.length} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}/>
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

      {vtmInfo && (
        <Card className="border-primary/30">
          <CardContent className="py-4 px-6 space-y-4">
            <div className="text-sm font-semibold text-muted-foreground">
              Saldo VTM — {vtmInfo.clienteNome}
            </div>
            {(() => {
              const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
              const rows = [
                { label: "Saldo VTM Mensal", vtm: vtmInfo.vtmMensal, gasto: vtmInfo.gastoMes, saldo: vtmInfo.saldoMes, hint: "Mês corrente • OS Validadas" },
                { label: "Saldo VTM Anual", vtm: vtmInfo.vtmAnual, gasto: vtmInfo.gastoAno, saldo: vtmInfo.saldoAno, hint: "Ano corrente • OS Validadas" },
              ];
              return rows.map((r, i) => {
                const pct = r.vtm > 0 ? Math.min(100, Math.max(0, (r.gasto / r.vtm) * 100)) : 0;
                const negativo = r.saldo < 0;
                const barColor = negativo ? "bg-destructive" : pct >= 80 ? "bg-orange-500" : "bg-primary";
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{r.label}</span>
                      <span className={negativo ? "text-destructive font-semibold" : "font-semibold text-primary"}>
                        {fmt(r.saldo)}
                      </span>
                    </div>
                    <div className="h-3 w-full rounded bg-muted overflow-hidden">
                      <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{r.hint}</span>
                      <span>Consumido {fmt(r.gasto)} de {fmt(r.vtm)} ({pct.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              });
            })()}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div>
                <Label>Tipo OS *</Label>
                <Select value={String(tipoOs.cod)} onValueChange={v => {
                  const found = TIPOS_OS.find(t => String(t.cod) === v);
                  if (found) setTipoOs(found);
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_OS.map(t => <SelectItem key={t.cod} value={String(t.cod)}>{t.descricao}</SelectItem>)}
                  </SelectContent>
                </Select>
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
                <Label>Complexidade</Label>
                <Select value={complexidade} onValueChange={(v) => setComplexidade(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
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

            {/* Resumo de Valores com BDI */}
            {clienteId && (
              <div className="bg-muted/30 border rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Valor dos Itens (SCO + Estoque)</p>
                    <p className="font-bold text-base">
                      {(materiais.reduce((s, m) => s + (m.valorTotal || 0), 0) + materiaisEstoque.reduce((s, m) => s + (m.valorTotal || 0), 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">BDI (Contrato)</p>
                    <p className="font-bold text-base">{bdiPercentual}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valor BDI</p>
                    <p className="font-bold text-base">
                      {((materiais.reduce((s, m) => s + (m.valorTotal || 0), 0) + materiaisEstoque.reduce((s, m) => s + (m.valorTotal || 0), 0)) * (bdiPercentual / 100)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valor Total (Itens + BDI)</p>
                    <p className="font-bold text-base text-primary">
                      {calcTotalComBDI(materiais, materiaisEstoque, bdiPercentual).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* === ABAS === */}
            <div className="border-t pt-4">
              <Tabs defaultValue="sco" className="w-full">
                <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/40 p-1">
                  <TabsTrigger value="sco" className="flex items-center gap-1.5 text-xs"><ClipboardList className="h-3.5 w-3.5" /> SCO</TabsTrigger>
                  <TabsTrigger value="estoque" className="flex items-center gap-1.5 text-xs"><ClipboardList className="h-3.5 w-3.5" /> Estoque</TabsTrigger>
                  <TabsTrigger value="profissionais" className="flex items-center gap-1.5 text-xs"><Wrench className="h-3.5 w-3.5" /> Profissionais</TabsTrigger>
                  <TabsTrigger value="anexos" className="flex items-center gap-1.5 text-xs"><ClipboardList className="h-3.5 w-3.5" /> Anexos ({anexos.length}/5)</TabsTrigger>
                  <TabsTrigger value="fotos" className="flex items-center gap-1.5 text-xs"><Eye className="h-3.5 w-3.5" /> Fotos ({fotos.length}/5)</TabsTrigger>
                  <TabsTrigger value="observacoes" className="flex items-center gap-1.5 text-xs"><ClipboardList className="h-3.5 w-3.5" /> Observações</TabsTrigger>
                  <TabsTrigger value="fiscalizacao" className="flex items-center gap-1.5 text-xs"><AlertTriangle className="h-3.5 w-3.5" /> Fiscalização</TabsTrigger>
                </TabsList>

                {/* 1. Materiais e Serviços - SCO */}
                <TabsContent value="sco" className="space-y-3 p-3">
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
                              <TableCell className="w-[180px]">
                                <Input type="number" className="h-8 text-xs w-[160px]" max={9999999} value={m.quantidade} onChange={e => {
                                  const val = e.target.value.slice(0, 7);
                                  const qty = Number(val);
                                  const updated = [...materiais]; updated[idx] = { ...m, quantidade: qty, valorTotal: m.valorUnitario * qty }; setMateriais(updated);
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
                </TabsContent>

                {/* 2. Materiais do Estoque */}
                <TabsContent value="estoque" className="space-y-3 p-3">
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
                            <TableCell className="text-xs w-[180px]">
                              <Input type="number" className="h-8 text-xs text-center w-[160px]" min={1} max={9999999} value={m.quantidade} onChange={e => {
                                const val = e.target.value.slice(0, 7);
                                const qtd = Number(val) || 1;
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
                </TabsContent>

                {/* 3. Profissionais */}
                <TabsContent value="profissionais" className="space-y-3 p-3">
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
                </TabsContent>

                {/* 4. Anexos */}
                <TabsContent value="anexos" className="space-y-3 p-3">
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
                </TabsContent>

                {/* 5. Fotos */}
                <TabsContent value="fotos" className="space-y-3 p-3">
                  {fotos.length < 5 && (
                    <FotosUploader
                      disabled={fotos.length >= 5}
                      onUploaded={(url) => setFotos(prev => [...prev, { id: crypto.randomUUID(), url }])}
                      currentCount={fotos.length}
                    />
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
                </TabsContent>

                {/* 6. Observações */}
                <TabsContent value="observacoes" className="space-y-3 p-3">
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
                </TabsContent>

                {/* 7. Observações (Fiscalização) */}
                <TabsContent value="fiscalizacao" className="space-y-3 p-3">
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
                          </div>
                          <p className="text-xs">{o.descricao}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
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
              Ordem de Serviço Nº {viewOS ? formatNumeroAno(viewOS.numero, viewOS.createdAt) : ""}
            </DialogTitle>
          </DialogHeader>
          {viewOS && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Nº OS</p>
                  <p className="font-bold text-lg">{formatNumeroAno(viewOS.numero, viewOS.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nº SS</p>
                  {viewOS.solicitacaoNumero ? (
                    <button
                      type="button"
                      className="font-medium text-primary underline hover:text-primary/80 cursor-pointer"
                      onClick={async () => {
                        if (viewOS.solicitacaoId) {
                          try {
                            const data = await fetchAll("solicitacoes_servicos", "numero");
                            const rowToSS = (r: any): SolicitacaoServico => ({
                              id: r.id, numero: r.numero ?? 0, tipo: r.tipo ?? "Predial",
                              clienteId: r.cliente_id ?? "", clienteNome: r.cliente_nome ?? "",
                              localId: r.local_id ?? "", localDescricao: r.local_descricao ?? "",
                              pavimentoId: r.pavimento_id ?? "", pavimentoDescricao: r.pavimento_descricao ?? "",
                              setorId: r.setor_id ?? "", setorDescricao: r.setor_descricao ?? "",
                              equipamentoId: r.equipamento_id ?? "", equipamentoNome: r.equipamento_nome ?? "",
                              descricaoServicos: r.descricao_servicos ?? "", situacao: r.situacao ?? "Aguardando aprovação",
                              prioridade: r.prioridade ?? "", observacoes: r.observacoes ?? "",
                              visitado: r.visitado ?? false, imagens: Array.isArray(r.imagens) ? r.imagens : [],
                              createdAt: r.created_at ?? "", dataHoraSolicitacao: r.data_hora_solicitacao ?? "",
                              solicitanteId: r.solicitante_id ?? "", solicitanteNome: r.solicitante_nome ?? "",
                              historico: Array.isArray(r.historico) ? r.historico : [],
                            });
                            const found = data.find((r: any) => r.id === viewOS.solicitacaoId);
                            if (found) setViewSSTarget(rowToSS(found));
                          } catch { /* ignore */ }
                        }
                      }}
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
                <div>
                  <p className="text-xs text-muted-foreground">Tipo OS</p>
                  <p className="font-medium">{viewOS.tipoOs?.descricao || "-"} ({viewOS.tipoOs?.sigla || "-"})</p>
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

              {/* Resumo de Valores */}
              {(() => {
                const totalItens = (viewOS.materiais || []).reduce((s: number, m: any) => s + (Number(m.valorTotal) || 0), 0)
                  + (viewOS.materiaisEstoque || []).reduce((s: number, m: any) => s + (Number(m.valorTotal) || 0), 0);
                const bdi = (() => { const n = Number(String(viewOS.bdi || 0).replace(",", ".")); return isNaN(n) ? 0 : n; })();
                const valorBDI = totalItens * (bdi / 100);
                const valorTotal = totalItens + valorBDI;
                return totalItens > 0 ? (
                  <div className="bg-muted/30 border rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Valor dos Itens</p>
                        <p className="font-bold">{totalItens.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">BDI</p>
                        <p className="font-bold">{bdi}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Valor BDI</p>
                        <p className="font-bold">{valorBDI.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Valor Total</p>
                        <p className="font-bold text-primary">{valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              <div>
                <p className="text-xs text-muted-foreground font-semibold">Aprovador:</p>
                <p>{viewOS.operadorNome || "-"}</p>
              </div>

              {/* Workflow Timeline */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <History className="h-4 w-4" /> Workflow
                </h4>
                <WorkflowTimeline
                  steps={viewOS.situacao === "Cancelada"
                    ? [...OS_WORKFLOW_STEPS, { label: "Cancelada" }]
                    : (viewOS.situacao === "Serviço Não Aprovado pela Fiscalização" || viewOS.situacao === "Serviço Re-executado")
                      ? [{ label: "Aberta" }, { label: "Executada" }, { label: "Serviço Não Aprovado pela Fiscalização" }, { label: "Serviço Re-executado" }, { label: "Serviço Confirmado" }, { label: "Validada" }]
                      : OS_WORKFLOW_STEPS
                  }
                  currentStep={viewOS.situacao}
                  historico={viewOS.historico}
                />
              </div>

              {/* Assinaturas Eletrônicas (apenas após Validada) */}
              {viewOS.situacao === "Validada" && (
                <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <FileSignature className="h-4 w-4" /> Assinaturas Eletrônicas (até 4)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <AssinaturaEletronicaOs
                      os={viewOS}
                      papel="fiscal"
                      assinaturaExistente={assinaturasOs.find(a => a.os_id === viewOS.id && a.papel === "fiscal")}
                    />
                    <AssinaturaEletronicaOs
                      os={viewOS}
                      papel="fiscal_2"
                      assinaturaExistente={assinaturasOs.find(a => a.os_id === viewOS.id && a.papel === "fiscal_2")}
                    />
                    <AssinaturaEletronicaOs
                      os={viewOS}
                      papel="fiscal_3"
                      assinaturaExistente={assinaturasOs.find(a => a.os_id === viewOS.id && a.papel === "fiscal_3")}
                    />
                    <AssinaturaEletronicaOs
                      os={viewOS}
                      papel="solicitante"
                      assinaturaExistente={assinaturasOs.find(a => a.os_id === viewOS.id && a.papel === "solicitante")}
                    />
                  </div>
                </div>
              )}

              {/* Avaliação do Cliente (apenas após Validada) */}
              {viewOS.situacao === "Validada" && (
                <AvaliacaoOs os={viewOS} />
              )}

              {/* Histórico de Alterações */}
              {viewOS.historico && viewOS.historico.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Histórico de Alterações
                  </h4>
                  <WorkflowHistorico historico={viewOS.historico} situacaoCores={SITUACAO_CORES} />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Double Confirm Delete */}
      <DoubleConfirmDelete open={!!deleteId} onOpenChange={o => !o && cancelDelete()} onConfirm={handleDelete} />

      {/* Double Confirm Cancel OS */}
      <DoubleConfirmDelete open={!!cancelId} onOpenChange={o => !o && cancelCancelAction()} onConfirm={handleCancelOS} />

      {/* Dialog: Justificativa para Não Aprovar */}
      <Dialog open={!!naoAprovarOS} onOpenChange={o => { if (!o) { setNaoAprovarOS(null); setNaoAprovarJustificativa(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldX className="h-5 w-5 text-destructive" />
              Serviço Não Aprovado pela Fiscalização
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              OS nº {naoAprovarOS ? formatNumeroAno(naoAprovarOS.numero, naoAprovarOS.createdAt) : ""} — Informe o motivo da não aprovação. Esta justificativa será registrada na aba Fiscalização da OS.
            </p>
            <div>
              <Label>Justificativa *</Label>
              <Textarea
                value={naoAprovarJustificativa}
                onChange={e => setNaoAprovarJustificativa(e.target.value)}
                placeholder="Descreva o motivo da não aprovação..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNaoAprovarOS(null); setNaoAprovarJustificativa(""); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmNaoAprovar}>Confirmar Não Aprovação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* SS Viewer Dialog */}
      <Dialog open={!!viewSSTarget} onOpenChange={(o) => { if (!o) setViewSSTarget(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Solicitação de Serviço nº {viewSSTarget ? formatNumeroAno(viewSSTarget.numero, viewSSTarget.createdAt) : ""}
            </DialogTitle>
          </DialogHeader>
          {viewSSTarget && (() => {
            const orc = orcamentosAll.find((o: any) => o.solicitacaoId === viewSSTarget.id);
            const SS_WORKFLOW_STEPS = [
              { label: "Aguardando aprovação" },
              { label: "Aprovada" },
              { label: "Em execução" },
              { label: "Concluída" },
            ];
            return (
              <div className="space-y-6 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Data/Hora</Label>
                    <p className="text-sm font-medium">
                      {viewSSTarget.dataHoraSolicitacao ? new Date(viewSSTarget.dataHoraSolicitacao).toLocaleString("pt-BR") : "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Solicitante</Label>
                    <p className="text-sm font-medium">{viewSSTarget.solicitanteNome || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <p className="text-sm font-medium">{viewSSTarget.tipo}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Situação</Label>
                    <Badge variant="outline" className="mt-1">{viewSSTarget.situacao}</Badge>
                  </div>
                  {viewSSTarget.prioridade && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Prioridade</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-block w-3 h-3 rounded-full ${
                          viewSSTarget.prioridade === "Emergencial" ? "bg-destructive" :
                          viewSSTarget.prioridade === "Urgente" ? "bg-yellow-500" : "bg-green-500"
                        }`} />
                        <span className="text-sm font-medium">{viewSSTarget.prioridade}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Localização</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Cliente</Label>
                      <p className="text-sm font-medium">{viewSSTarget.clienteNome || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Local</Label>
                      <p className="text-sm font-medium">{viewSSTarget.localDescricao || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Pavimento</Label>
                      <p className="text-sm font-medium">{viewSSTarget.pavimentoDescricao || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Setor</Label>
                      <p className="text-sm font-medium">{viewSSTarget.setorDescricao || "-"}</p>
                    </div>
                    {viewSSTarget.tipo === "Equipamentos" && (
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Equipamento</Label>
                        <p className="text-sm font-medium">{viewSSTarget.equipamentoNome || "-"}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Descrição dos Serviços</h4>
                  <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-md p-3">{viewSSTarget.descricaoServicos || "-"}</p>
                </div>

                {viewSSTarget.imagens && viewSSTarget.imagens.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Imagens</h4>
                    <div className="flex gap-3 flex-wrap">
                      {viewSSTarget.imagens.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={`Imagem ${i + 1}`} className="w-32 h-32 object-cover rounded-md border hover:opacity-80 transition" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {orc && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Orçamento nº {(orc as any).numero}</h4>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <Badge variant="outline" className="mt-1">{(orc as any).status}</Badge>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Valor Total</Label>
                        <p className="text-sm font-bold">{(orc as any).valorTotal?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border rounded-lg p-4 bg-muted/20">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <History className="h-4 w-4" /> Workflow
                  </h4>
                  <WorkflowTimeline
                    steps={viewSSTarget.situacao === "Cancelada"
                      ? [...SS_WORKFLOW_STEPS, { label: "Cancelada" }]
                      : (viewSSTarget.situacao === "Orçamento Solicitado" || viewSSTarget.situacao === "Orçamento Disponível")
                        ? [{ label: "Aguardando aprovação" }, { label: "Orçamento Solicitado" }, { label: "Orçamento Disponível" }, { label: "Aprovada" }, { label: "Em execução" }, { label: "Concluída" }]
                        : SS_WORKFLOW_STEPS
                    }
                    currentStep={viewSSTarget.situacao}
                    historico={viewSSTarget.historico}
                  />
                </div>

                {viewSSTarget.historico && viewSSTarget.historico.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Histórico de Alterações
                    </h4>
                    <WorkflowHistorico historico={viewSSTarget.historico} />
                  </div>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewSSTarget(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <RelatorioFechamentoOSDialog
        open={relatorioOpen}
        onOpenChange={setRelatorioOpen}
        ordens={ordens}
        clientes={clientesFiltrados.map(c => ({ id: c.id, nome: c.nome }))}
      />
    </div>
  );
}
