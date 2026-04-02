import { useState, useMemo, useRef } from "react";
import { useSolicitacoesServicos, SolicitacaoServico } from "@/contexts/SolicitacoesServicosContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useEquipamentos } from "@/contexts/EquipamentosContext";
import { useAuth } from "@/contexts/AuthContext";
import { useOrdensServico } from "@/contexts/OrdensServicoContext";
import { useOrcamentos } from "@/contexts/OrcamentosContext";
import { DoubleConfirmDelete, useDoubleConfirmDelete } from "@/components/DoubleConfirmDelete";
import PaginationControls, { paginate } from "@/components/PaginationControls";
import OrcamentoDialog from "@/components/OrcamentoDialog";
import { gerarPdfOrcamento } from "@/lib/gerarPdfOrcamento";
import { gerarExcelOrcamento } from "@/lib/gerarExcelOrcamento";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, ChevronDown, ChevronUp, AlertTriangle, Pencil, Trash2, MoreHorizontal, ImagePlus, X, Building2, Wrench, CheckCircle2, XCircle, FileText, ClipboardList, Download, Eye } from "lucide-react";

const SITUACOES = ["Aguardando aprovação", "Orçamento Solicitado", "Orçamento Disponível", "Aprovada", "Em execução", "Concluída", "Cancelada"];

const PRIORIDADES = [
  { value: "Normal", color: "bg-green-500" },
  { value: "Urgente", color: "bg-yellow-500" },
  { value: "Emergencial", color: "bg-red-500" },
];

const emptyForm = {
  tipo: "" as "" | "Predial" | "Equipamentos",
  cliente_id: "", local_id: "", pavimento_id: "", setor_id: "",
  equipamento_id: "", descricao_servicos: "", situacao: "Aguardando aprovação",
};

export default function SolicitacaoServicosPage() {
  const { solicitacoes, addSolicitacao, updateSolicitacao, deleteSolicitacao } = useSolicitacoesServicos();
  const { clientes } = useClientes();
  const { equipamentos } = useEquipamentos();
  const { toast } = useToast();
  const { usuarioLogado } = useAuth();
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterCliente, setFilterCliente] = useState("all");
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterSituacao, setFilterSituacao] = useState("all");
  const [imagens, setImagens] = useState<{ file?: File; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { deleteId, requestDelete, cancelDelete } = useDoubleConfirmDelete();
  const { deleteId: cancelId, requestDelete: requestCancel, cancelDelete: abortCancel } = useDoubleConfirmDelete();
  const { orcamentos } = useOrcamentos();

  // Orcamento dialog state
  const [orcamentoDialogOpen, setOrcamentoDialogOpen] = useState(false);
  const [orcamentoTarget, setOrcamentoTarget] = useState<{ id: string; numero: number; clienteId: string; clienteNome: string } | null>(null);

  // Approval dialog state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalTargetId, setApprovalTargetId] = useState<string | null>(null);
  const [selectedPrioridade, setSelectedPrioridade] = useState<string>("");
  const [prioridadeOnly, setPrioridadeOnly] = useState(false);
  const [viewTarget, setViewTarget] = useState<SolicitacaoServico | null>(null);

  const soClientes = useMemo(() => clientes.filter(c => c.tipo === "Cliente"), [clientes]);

  const selectedCliente = useMemo(() => soClientes.find(c => c.id === form.cliente_id), [soClientes, form.cliente_id]);
  const locais = useMemo(() => selectedCliente?.locais || [], [selectedCliente]);
  const selectedLocal = useMemo(() => locais.find((l: any) => l.id === form.local_id), [locais, form.local_id]);
  const pavimentos = useMemo(() => (selectedLocal as any)?.pavimentos || [], [selectedLocal]);
  const selectedPavimento = useMemo(() => pavimentos.find((p: any) => p.id === form.pavimento_id), [pavimentos, form.pavimento_id]);
  const setores = useMemo(() => (selectedPavimento as any)?.setores || [], [selectedPavimento]);

  const equipamentosFiltrados = useMemo(() => {
    if (!form.cliente_id) return [];
    return equipamentos.filter((e: any) => e.clienteId === form.cliente_id || e.cliente_id === form.cliente_id);
  }, [equipamentos, form.cliente_id]);

  const handleSelectTipo = (tipo: "Predial" | "Equipamentos") => {
    setForm({ ...emptyForm, tipo });
    setImagens([]);
    setEditingId(null);
    setFormOpen(true);
  };

  const handleAddImagem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 3 - imagens.length;
    if (remaining <= 0) { toast({ title: "Máximo de 3 imagens", variant: "destructive" }); return; }
    const newImgs = Array.from(files).slice(0, remaining).map(file => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setImagens(prev => [...prev, ...newImgs]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImagem = (idx: number) => {
    setImagens(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadImagens = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const img of imagens) {
      if (img.file) {
        const ext = img.file.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("solicitacoes-imagens").upload(path, img.file);
        if (error) { console.error(error); continue; }
        const { data } = supabase.storage.from("solicitacoes-imagens").getPublicUrl(path);
        urls.push(data.publicUrl);
      } else {
        urls.push(img.url);
      }
    }
    return urls;
  };

  const handleSave = async () => {
    if (!form.cliente_id) { toast({ title: "Selecione um cliente", variant: "destructive" }); return; }
    if (!form.descricao_servicos.trim()) { toast({ title: "Descrição dos serviços obrigatória", variant: "destructive" }); return; }
    if (form.tipo === "Equipamentos" && !form.equipamento_id) { toast({ title: "Selecione um equipamento", variant: "destructive" }); return; }

    setUploading(true);
    const imagensUrls = await uploadImagens();

    const cliente = soClientes.find(c => c.id === form.cliente_id);
    const local = locais.find((l: any) => l.id === form.local_id);
    const pav = pavimentos.find((p: any) => p.id === form.pavimento_id);
    const setor = setores.find((s: any) => s.id === form.setor_id);
    const equip = equipamentosFiltrados.find((e: any) => e.id === form.equipamento_id);

    const payload: any = {
      tipo: form.tipo,
      cliente_id: form.cliente_id,
      cliente_nome: cliente?.nome || "",
      local_id: form.local_id,
      local_descricao: (local as any)?.descricao || "",
      pavimento_id: form.pavimento_id,
      pavimento_descricao: (pav as any)?.descricao || "",
      setor_id: form.setor_id,
      setor_descricao: (setor as any)?.descricao || "",
      equipamento_id: form.tipo === "Equipamentos" ? form.equipamento_id : "",
      equipamento_nome: form.tipo === "Equipamentos" ? ((equip as any)?.equipamento || (equip as any)?.tag || "") : "",
      descricao_servicos: form.descricao_servicos,
      situacao: form.situacao,
      imagens: imagensUrls,
    };

    if (!editingId) {
      payload.data_hora_solicitacao = new Date().toISOString();
      payload.solicitante_id = usuarioLogado?.id || "";
      payload.solicitante_nome = usuarioLogado?.nome || "";
    }

    if (editingId) {
      await updateSolicitacao(editingId, payload);
      toast({ title: "Solicitação atualizada" });
    } else {
      await addSolicitacao(payload);
      toast({ title: "Solicitação cadastrada" });
    }
    setForm({ ...emptyForm });
    setImagens([]);
    setEditingId(null);
    setFormOpen(false);
    setUploading(false);
  };

  const handleEdit = (s: any) => {
    setForm({
      tipo: s.tipo || "Predial",
      cliente_id: s.clienteId,
      local_id: s.localId,
      pavimento_id: s.pavimentoId,
      setor_id: s.setorId,
      equipamento_id: s.equipamentoId,
      descricao_servicos: s.descricaoServicos,
      situacao: s.situacao,
    });
    setImagens((s.imagens || []).map((url: string) => ({ url })));
    setEditingId(s.id);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteSolicitacao(deleteId);
      toast({ title: "Solicitação excluída" });
      cancelDelete();
    }
  };

  const handleOpenApproval = (id: string, onlyPriority = false) => {
    setApprovalTargetId(id);
    setSelectedPrioridade("");
    setPrioridadeOnly(onlyPriority);
    setApprovalDialogOpen(true);
  };

  const { addOrdem } = useOrdensServico();

  const handleConfirmApproval = async () => {
    if (!approvalTargetId || !selectedPrioridade) {
      toast({ title: "Selecione o nível de prioridade", variant: "destructive" });
      return;
    }
    if (prioridadeOnly) {
      await updateSolicitacao(approvalTargetId, { prioridade: selectedPrioridade });
      toast({ title: `Prioridade alterada para ${selectedPrioridade}` });
    } else {
      await updateSolicitacao(approvalTargetId, { situacao: "Aprovada", prioridade: selectedPrioridade });

      // Auto-create OS linked to this SS
      const ss = solicitacoes.find(s => s.id === approvalTargetId);
      if (ss) {
        const prioridadeOS =
          selectedPrioridade === "Emergencial" ? "A: IMEDIATA" :
          selectedPrioridade === "Urgente" ? "B: (24 a 72H)" : "C: PROGRAMADA";

        await addOrdem({
          solicitacao_id: ss.id,
          solicitacao_numero: ss.numero,
          cliente_id: ss.clienteId,
          cliente_nome: ss.clienteNome,
          local_id: ss.localId,
          local_descricao: ss.localDescricao,
          pavimento_id: ss.pavimentoId,
          pavimento_descricao: ss.pavimentoDescricao,
          setor_id: ss.setorId,
          setor_descricao: ss.setorDescricao,
          descricao_servicos: ss.descricaoServicos,
          solicitante: ss.solicitanteNome,
          matricula: usuarioLogado?.matricula || "",
          ramal: usuarioLogado?.ramal || "",
          telefone: usuarioLogado?.telefone || "",
          prioridade: prioridadeOS,
          situacao: "Aberta",
          operador_id: usuarioLogado?.id || "",
          operador_nome: usuarioLogado?.nome || "",
        });
      }

      toast({ title: `Solicitação aprovada e Ordem de Serviço criada` });
    }
    setApprovalDialogOpen(false);
    setApprovalTargetId(null);
    setSelectedPrioridade("");
    setPrioridadeOnly(false);
  };

  const handleCancelar = async () => {
    if (cancelId) {
      await updateSolicitacao(cancelId, { situacao: "Cancelada" });
      toast({ title: "Solicitação cancelada" });
      abortCancel();
    }
  };

  const handleSolicitarOrcamento = async (s: any) => {
    await updateSolicitacao(s.id, { situacao: "Orçamento Solicitado" });
    toast({ title: "Orçamento solicitado", description: `SS nº ${s.numero} — Orçamento Solicitado` });
  };

  const handleOrcarSolicitacao = (s: any) => {
    setOrcamentoTarget({ id: s.id, numero: s.numero, clienteId: s.clienteId, clienteNome: s.clienteNome });
    setOrcamentoDialogOpen(true);
  };

  const handleOrcamentoSent = async () => {
    if (!orcamentoTarget) return;
    await updateSolicitacao(orcamentoTarget.id, { situacao: "Orçamento Disponível" });
    toast({ title: "Orçamento enviado", description: `SS nº ${orcamentoTarget.numero} — Orçamento Disponível` });
  };

  const existingOrcamentoForTarget = useMemo(() => {
    if (!orcamentoTarget) return null;
    return orcamentos.find(o => o.solicitacaoId === orcamentoTarget.id) || null;
  }, [orcamentos, orcamentoTarget]);

  const handleOrcamentoApproved = async (orcamento: any) => {
    // When budget is approved, create OS linked to it
    const ss = solicitacoes.find(s => s.id === orcamento.solicitacaoId);
    if (!ss) return;

    await updateSolicitacao(ss.id, { situacao: "Aprovada", prioridade: ss.prioridade || "Normal" });

    const prioridadeOS =
      ss.prioridade === "Emergencial" ? "A: IMEDIATA" :
      ss.prioridade === "Urgente" ? "B: (24 a 72H)" : "C: PROGRAMADA";

    // Map SCO items from budget to OS materiais format
    const materiaisSco = (orcamento.itensSco || []).map((item: any) => ({
      id: crypto.randomUUID(),
      codigo: item.codSco || item.codigo || "",
      descricao: item.descricao || "",
      unidade: item.unidade || "",
      valorUnitario: Number(item.valorUnitario) || 0,
      quantidade: Number(item.quantidade) || 0,
      valorTotal: Number(item.valorTotal) || 0,
    }));

    // Map material items from budget to OS materiaisEstoque format
    const materiaisEstoque = (orcamento.itensMateriais || []).map((item: any) => ({
      id: crypto.randomUUID(),
      codigo: item.codigo || "",
      descricao: item.descricao || "",
      unidade: item.unidade || "",
      valorUnitario: Number(item.valorUnitario) || 0,
      quantidade: Number(item.quantidade) || 0,
      valorTotal: Number(item.valorTotal) || 0,
    }));

    // Copy attachments from budget
    const anexos = orcamento.anexos || [];

    await addOrdem({
      solicitacao_id: ss.id,
      solicitacao_numero: ss.numero,
      cliente_id: ss.clienteId,
      cliente_nome: ss.clienteNome,
      local_id: ss.localId,
      local_descricao: ss.localDescricao,
      pavimento_id: ss.pavimentoId,
      pavimento_descricao: ss.pavimentoDescricao,
      setor_id: ss.setorId,
      setor_descricao: ss.setorDescricao,
      descricao_servicos: ss.descricaoServicos,
      solicitante: ss.solicitanteNome,
      matricula: usuarioLogado?.matricula || "",
      ramal: usuarioLogado?.ramal || "",
      telefone: usuarioLogado?.telefone || "",
      prioridade: prioridadeOS,
      situacao: "Aberta",
      operador_id: usuarioLogado?.id || "",
      operador_nome: usuarioLogado?.nome || "",
      materiais: materiaisSco,
      materiais_estoque: materiaisEstoque,
      anexos: anexos,
    });

    toast({ title: "Orçamento aprovado e Ordem de Serviço criada!" });
  };

  const handleDownloadOrcamento = (s: any, tipo: "pdf" | "excel") => {
    const orc = orcamentos.find(o => o.solicitacaoId === s.id);
    if (!orc) {
      toast({ title: "Orçamento não encontrado", variant: "destructive" });
      return;
    }
    if (tipo === "pdf") {
      gerarPdfOrcamento(orc);
    } else {
      gerarExcelOrcamento(orc);
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    const p = PRIORIDADES.find(x => x.value === prioridade);
    return p?.color || "";
  };

  const filtered = useMemo(() => {
    let result = solicitacoes;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.clienteNome.toLowerCase().includes(q) ||
        s.descricaoServicos.toLowerCase().includes(q) ||
        s.situacao.toLowerCase().includes(q) ||
        s.tipo.toLowerCase().includes(q) ||
        String(s.numero).includes(q)
      );
    }
    if (filterCliente !== "all") result = result.filter(s => s.clienteId === filterCliente);
    if (filterTipo !== "all") result = result.filter(s => s.tipo === filterTipo);
    if (filterSituacao !== "all") result = result.filter(s => s.situacao === filterSituacao);
    return result;
  }, [solicitacoes, search, filterCliente, filterTipo, filterSituacao]);

  const clientesUnicos = useMemo(() => {
    const map = new Map<string, string>();
    solicitacoes.forEach(s => { if (s.clienteId && s.clienteNome) map.set(s.clienteId, s.clienteNome); });
    return Array.from(map.entries());
  }, [solicitacoes]);

  const { paginated, totalPages } = paginate(filtered, page);

  const showForm = formOpen && form.tipo !== "";

  return (
    <div className="space-y-6 pt-[15px] pl-0 pr-[10px]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Solicitação de Serviços</h1>
        {!formOpen && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Solicitar Serviço
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSelectTipo("Predial")}>
                <Building2 className="mr-2 h-4 w-4" />
                Predial
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSelectTipo("Equipamentos")}>
                <Wrench className="mr-2 h-4 w-4" />
                Equipamentos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Collapsible open={formOpen} onOpenChange={o => { if (!o) { setFormOpen(false); setForm({ ...emptyForm }); setImagens([]); setEditingId(null); } }}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  {editingId ? "Editar Solicitação" : `Nova Solicitação — ${form.tipo}`}
                </CardTitle>
                {formOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <Label className="font-bold">Cliente</Label>
                    <Select value={form.cliente_id} onValueChange={v => setForm(f => ({ ...f, cliente_id: v, local_id: "", pavimento_id: "", setor_id: "", equipamento_id: "" }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{soClientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-bold">Situação</Label>
                    <Select value={form.situacao} onValueChange={v => setForm(f => ({ ...f, situacao: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SITUACOES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="font-bold">Local</Label>
                  <Select value={form.local_id} onValueChange={v => setForm(f => ({ ...f, local_id: v, pavimento_id: "", setor_id: "" }))} disabled={!form.cliente_id}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{locais.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.descricao}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bold">Pavimento</Label>
                    <Select value={form.pavimento_id} onValueChange={v => setForm(f => ({ ...f, pavimento_id: v, setor_id: "" }))} disabled={!form.local_id}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>{pavimentos.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.descricao}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-bold">Setor</Label>
                    <Select value={form.setor_id} onValueChange={v => setForm(f => ({ ...f, setor_id: v }))} disabled={!form.pavimento_id}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>{setores.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.descricao}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Equipamento — only for "Equipamentos" type */}
                {form.tipo === "Equipamentos" && (
                  <div className="md:w-1/2">
                    <Label className="font-bold">Equipamento</Label>
                    <Select value={form.equipamento_id} onValueChange={v => setForm(f => ({ ...f, equipamento_id: v }))} disabled={!form.cliente_id}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>{equipamentosFiltrados.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.tag ? `${e.tag} - ${e.equipamento}` : e.equipamento}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label className="font-bold">Descrição dos Serviços</Label>
                  <Textarea
                    placeholder="Descrição dos Serviços"
                    value={form.descricao_servicos}
                    onChange={e => setForm(f => ({ ...f, descricao_servicos: e.target.value }))}
                    rows={4}
                  />
                </div>

                {/* Imagens — até 3 */}
                <div>
                  <Label className="font-bold">Imagens (máx. 3)</Label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {imagens.map((img, idx) => (
                      <div key={idx} className="relative group w-28 h-28 rounded-md border border-border overflow-hidden">
                        <img src={img.url} alt={`Imagem ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImagem(idx)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {imagens.length < 3 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-28 h-28 rounded-md border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        <ImagePlus className="h-6 w-6" />
                        <span className="text-xs">Adicionar</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleAddImagem}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setFormOpen(false); setForm({ ...emptyForm }); setImagens([]); setEditingId(null); }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={uploading}>
                    <Plus className="mr-2 h-4 w-4" />
                    {uploading ? "Salvando..." : editingId ? "Atualizar" : "Adicionar"}
                  </Button>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <Input
          placeholder="Buscar solicitação..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
        <Select value={filterCliente} onValueChange={v => { setFilterCliente(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Clientes</SelectItem>
            {clientesUnicos.map(([id, nome]) => <SelectItem key={id} value={id}>{nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTipo} onValueChange={v => { setFilterTipo(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="Predial">Predial</SelectItem>
            <SelectItem value="Equipamentos">Equipamentos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSituacao} onValueChange={v => { setFilterSituacao(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Situação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Situações</SelectItem>
            {SITUACOES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Equipamento</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-16">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  Nenhuma solicitação cadastrada
                </TableCell>
              </TableRow>
            ) : paginated.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {s.prioridade && (
                      <span className={`inline-block w-3 h-3 rounded-full ${getPrioridadeColor(s.prioridade)}`} title={s.prioridade} />
                    )}
                    {s.numero}
                  </div>
                </TableCell>
                <TableCell className="text-xs whitespace-nowrap">
                  {s.dataHoraSolicitacao ? new Date(s.dataHoraSolicitacao).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "-"}
                </TableCell>
                <TableCell className="text-xs">{s.solicitanteNome || "-"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{s.tipo}</Badge>
                </TableCell>
                <TableCell>{s.clienteNome || "-"}</TableCell>
                <TableCell>{s.localDescricao || "-"}</TableCell>
                <TableCell>{s.tipo === "Equipamentos" ? (s.equipamentoNome || "-") : "-"}</TableCell>
                <TableCell className="max-w-[200px] truncate">{s.descricaoServicos || "-"}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      s.situacao === "Concluída" ? "default" :
                      s.situacao === "Cancelada" ? "destructive" :
                      s.situacao === "Em execução" ? "secondary" : "outline"
                    }
                    className={
                      s.situacao === "Aprovada" ? "bg-green-600 text-white border-green-600 hover:bg-green-700" :
                      s.situacao === "Aguardando aprovação" ? "bg-yellow-500 border-yellow-500 hover:bg-yellow-600 text-primary" :
                      s.situacao === "Orçamento Solicitado" ? "bg-blue-500 border-blue-500 hover:bg-blue-600 text-white" :
                      s.situacao === "Orçamento Disponível" ? "bg-indigo-500 border-indigo-500 hover:bg-indigo-600 text-white" : ""
                    }
                  >{s.situacao}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewTarget(s)}>
                        <Eye className="mr-2 h-4 w-4" />Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {!["Aprovada", "Em execução", "Concluída", "Orçamento Solicitado", "Orçamento Disponível"].includes(s.situacao) && (
                        <DropdownMenuItem onClick={() => handleOpenApproval(s.id)}>
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />Aprovar
                        </DropdownMenuItem>
                      )}
                      {["Aprovada", "Em execução"].includes(s.situacao) && (
                        <DropdownMenuItem onClick={() => handleOpenApproval(s.id, true)}>
                          <Pencil className="mr-2 h-4 w-4" />Alterar Prioridade
                        </DropdownMenuItem>
                      )}
                      {s.situacao === "Aguardando aprovação" && (
                        <DropdownMenuItem onClick={() => handleSolicitarOrcamento(s)}>
                          <FileText className="mr-2 h-4 w-4" />Solicitar Orçamento
                        </DropdownMenuItem>
                      )}
                      {s.situacao === "Orçamento Solicitado" && (
                        <DropdownMenuItem onClick={() => handleOrcarSolicitacao(s)}>
                          <ClipboardList className="mr-2 h-4 w-4 text-blue-600" />Orçar Solicitação
                        </DropdownMenuItem>
                      )}
                      {s.situacao === "Orçamento Disponível" && (
                        <DropdownMenuItem onClick={() => handleOrcarSolicitacao(s)}>
                          <FileText className="mr-2 h-4 w-4 text-indigo-600" />Ver Orçamento
                        </DropdownMenuItem>
                      )}
                      {["Aprovada", "Em execução", "Concluída"].includes(s.situacao) && orcamentos.some(o => o.solicitacaoId === s.id) && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDownloadOrcamento(s, "pdf")}>
                            <Download className="mr-2 h-4 w-4" />Orçamento PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadOrcamento(s, "excel")}>
                            <Download className="mr-2 h-4 w-4" />Orçamento Excel
                          </DropdownMenuItem>
                        </>
                      )}
                      {!["Aprovada", "Em execução", "Concluída", "Orçamento Solicitado", "Orçamento Disponível"].includes(s.situacao) && (
                        <DropdownMenuItem onClick={() => handleEdit(s)}>
                          <Pencil className="mr-2 h-4 w-4" />Editar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {!["Aprovada", "Em execução", "Concluída", "Orçamento Solicitado", "Orçamento Disponível"].includes(s.situacao) && (
                        <DropdownMenuItem onClick={() => requestCancel(s.id)}>
                          <XCircle className="mr-2 h-4 w-4 text-destructive" />Cancelar Solicitação
                        </DropdownMenuItem>
                      )}
                      {!["Aprovada", "Em execução", "Concluída", "Orçamento Solicitado", "Orçamento Disponível"].includes(s.situacao) && (
                        <DropdownMenuItem onClick={() => requestDelete(s.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />Excluir
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationControls currentPage={page} totalItems={filtered.length} onPageChange={setPage} />
      <DoubleConfirmDelete open={!!deleteId} onOpenChange={o => !o && cancelDelete()} onConfirm={handleDelete} />
      <DoubleConfirmDelete open={!!cancelId} onOpenChange={o => !o && abortCancel()} onConfirm={handleCancelar} />

      {/* Orcamento Dialog */}
      <OrcamentoDialog
        open={orcamentoDialogOpen}
        onOpenChange={(o) => { setOrcamentoDialogOpen(o); if (!o) setOrcamentoTarget(null); }}
        solicitacao={orcamentoTarget}
        existingOrcamento={existingOrcamentoForTarget}
        onApproved={handleOrcamentoApproved}
        onSent={handleOrcamentoSent}
      />

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{prioridadeOnly ? "Alterar Prioridade" : "Aprovar Solicitação"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label className="font-bold">Selecione o nível de prioridade:</Label>
            <div className="flex flex-col gap-3">
              {PRIORIDADES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setSelectedPrioridade(p.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                    selectedPrioridade === p.value
                      ? "border-primary bg-accent"
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <span className={`inline-block w-4 h-4 rounded-full ${p.color}`} />
                  <span className="font-medium">{p.value}</span>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmApproval} disabled={!selectedPrioridade}>{prioridadeOnly ? "Confirmar Alteração" : "Confirmar Aprovação"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
