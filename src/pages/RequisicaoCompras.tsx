import { useState, useMemo, useRef } from "react";
import PaginationControls, { paginate } from "@/components/PaginationControls";
import { useRequisicaoCompras, RequisicaoCompras, StatusRequisicaoCompras, GrauUrgencia, ItemRequisicaoCompras, AnexoRequisicaoCompras } from "@/contexts/RequisicaoComprasContext";
import { useMateriaisServicos } from "@/contexts/MateriaisServicosContext";
import { useFabricantes } from "@/contexts/FabricantesContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Search, Eye, FileText, Clock, Paperclip, X, ChevronsUpDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useColumnOrder } from "@/hooks/useColumnOrder";
import { SortableHeaderRow, SortableTableHead } from "@/components/SortableTableHead";
import type { ReactNode } from "react";

const statusColors: Record<StatusRequisicaoCompras, string> = {
  Rascunho: "bg-muted text-muted-foreground",
  Enviada: "bg-blue-100 text-blue-800",
  "Em Cotação": "bg-yellow-100 text-yellow-800",
  "Aguardando Aprovação": "bg-orange-100 text-orange-800",
  Aprovada: "bg-green-100 text-green-800",
  Reprovada: "bg-red-100 text-red-800",
  "Pedido Emitido": "bg-indigo-100 text-indigo-800",
  "Em Entrega": "bg-purple-100 text-purple-800",
  "Recebida Parcial": "bg-amber-100 text-amber-800",
  Recebida: "bg-emerald-100 text-emerald-800",
  Concluída: "bg-green-200 text-green-900",
  Cancelada: "bg-red-200 text-red-900",
};

const URGENCIAS: GrauUrgencia[] = ["Baixa", "Normal", "Alta", "Urgente"];

export default function RequisicaoComprasPage() {
  const { requisicoes, addRequisicao, cancelarRequisicao } = useRequisicaoCompras();
  const { materiais } = useMateriaisServicos();
  const { fabricantes } = useFabricantes();
  const { clientes } = useClientes();
  const { usuarioLogado } = useAuth();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewReq, setViewReq] = useState<RequisicaoCompras | null>(null);
  const [historicoReq, setHistoricoReq] = useState<RequisicaoCompras | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("Todos");
  const [filterCentroCusto, setFilterCentroCusto] = useState<string>("Todos");
  const [filterUrgencia, setFilterUrgencia] = useState<string>("Todas");
  const [filterSolicitante, setFilterSolicitante] = useState<string>("Todos");
  const [filterDataIni, setFilterDataIni] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");
  const [pageReq, setPageReq] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colDefs: Record<string, { label: string; className?: string }> = {
    numero: { label: "Nº", className: "text-center" },
    data: { label: "Data", className: "text-center" },
    solicitante: { label: "Solicitante" },
    centroCusto: { label: "Centro de Custo" },
    urgencia: { label: "Urgência", className: "text-center" },
    itens: { label: "Itens", className: "text-center" },
    status: { label: "Status", className: "text-center" },
  };
  const { order: colOrder, setOrder: setColOrder } = useColumnOrder(
    "compras.requisicoes",
    ["numero", "data", "solicitante", "centroCusto", "urgencia", "itens", "status"]
  );

  // Form state
  const [centroCusto, setCentroCusto] = useState("");
  const [localEntrega, setLocalEntrega] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [urgencia, setUrgencia] = useState<GrauUrgencia>("Normal");
  const [prazoDesejado, setPrazoDesejado] = useState("");
  const [itens, setItens] = useState<ItemRequisicaoCompras[]>([]);
  const [anexos, setAnexos] = useState<AnexoRequisicaoCompras[]>([]);

  // Item form
  const [itemMaterialId, setItemMaterialId] = useState("");
  const [materialPopoverOpen, setMaterialPopoverOpen] = useState(false);
  const [itemDescricao, setItemDescricao] = useState("");
  const [itemEspec, setItemEspec] = useState("");
  const [itemObs, setItemObs] = useState("");
  const [itemQtd, setItemQtd] = useState("");
  const [itemUnidade, setItemUnidade] = useState("UN");
  const [itemFabricanteId, setItemFabricanteId] = useState("");
  const [itemAnexo, setItemAnexo] = useState<{ nome: string; tipo: string; base64: string } | null>(null);
  const itemAnexoInputRef = useRef<HTMLInputElement>(null);

  const clientesLista = useMemo(() => clientes.filter(c => c.tipo === "Cliente"), [clientes]);

  const locaisEntregaDoCliente = useMemo(() => {
    if (!centroCusto) return [];
    const cliente = clientesLista.find(c => c.id === centroCusto);
    return cliente?.locaisEntrega || [];
  }, [centroCusto, clientesLista]);

  const filtered = useMemo(() => {
    let list = requisicoes;
    if (filterStatus !== "Todos") list = list.filter(r => r.status === filterStatus);
    if (filterCentroCusto !== "Todos") list = list.filter(r => r.centroCusto === filterCentroCusto);
    if (filterUrgencia !== "Todas") list = list.filter(r => r.urgencia === filterUrgencia);
    if (filterSolicitante !== "Todos") list = list.filter(r => r.solicitante === filterSolicitante);
    if (filterDataIni) list = list.filter(r => r.dataCriacao >= filterDataIni);
    if (filterDataFim) list = list.filter(r => r.dataCriacao <= filterDataFim + "T23:59:59");
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(r =>
        String(r.numero).includes(s) ||
        r.centroCustoNome.toLowerCase().includes(s) ||
        r.solicitante.toLowerCase().includes(s) ||
        r.itens.some(i => i.descricao.toLowerCase().includes(s))
      );
    }
    return list.sort((a, b) => b.numero - a.numero);
  }, [requisicoes, search, filterStatus, filterCentroCusto, filterUrgencia, filterSolicitante, filterDataIni, filterDataFim]);

  const solicitantesUnicos = useMemo(() =>
    Array.from(new Set(requisicoes.map(r => r.solicitante).filter(Boolean))).sort(),
    [requisicoes]
  );
  const centrosUnicos = useMemo(() => {
    const map = new Map<string, string>();
    requisicoes.forEach(r => { if (r.centroCusto) map.set(r.centroCusto, r.centroCustoNome); });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [requisicoes]);

  const limparFiltros = () => {
    setSearch(""); setFilterStatus("Todos"); setFilterCentroCusto("Todos");
    setFilterUrgencia("Todas"); setFilterSolicitante("Todos");
    setFilterDataIni(""); setFilterDataFim("");
  };

  const resetForm = () => {
    setCentroCusto(""); setLocalEntrega(""); setJustificativa(""); setUrgencia("Normal"); setPrazoDesejado("");
    setItens([]); setAnexos([]);
    resetItemForm();
  };

  const resetItemForm = () => {
    setItemMaterialId(""); setItemDescricao(""); setItemEspec(""); setItemObs(""); setItemQtd(""); setItemUnidade("UN"); setItemFabricanteId("");
    setItemAnexo(null);
    if (itemAnexoInputRef.current) itemAnexoInputRef.current.value = "";
  };

  const handleItemAnexoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast({ title: `${file.name} excede 2MB`, variant: "destructive" }); e.target.value = ""; return; }
    const reader = new FileReader();
    reader.onload = (ev) => setItemAnexo({ nome: file.name, tipo: file.type, base64: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const addItem = () => {
    if (!itemDescricao.trim()) { toast({ title: "Descrição do item é obrigatória", variant: "destructive" }); return; }
    if (!itemQtd || Number(itemQtd) <= 0) { toast({ title: "Quantidade deve ser maior que zero", variant: "destructive" }); return; }
    setItens(prev => [...prev, {
      id: crypto.randomUUID(), materialId: itemMaterialId, descricao: itemDescricao,
      especificacaoTecnica: itemEspec, observacao: itemObs, quantidade: Number(itemQtd), unidadeMedida: itemUnidade,
      anexo: itemAnexo,
    }]);
    resetItemForm();
  };

  const removeItem = (id: string) => setItens(prev => prev.filter(i => i.id !== id));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.size > 2 * 1024 * 1024) { toast({ title: `${file.name} excede 2MB`, variant: "destructive" }); continue; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAnexos(prev => [...prev, { id: crypto.randomUUID(), nome: file.name, tipo: file.type, base64: ev.target?.result as string }]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleSubmit = () => {
    if (!centroCusto) { toast({ title: "Centro de custo é obrigatório", variant: "destructive" }); return; }
    if (!justificativa.trim()) { toast({ title: "Justificativa é obrigatória", variant: "destructive" }); return; }
    if (itens.length === 0) { toast({ title: "Adicione pelo menos um item", variant: "destructive" }); return; }

    const cliente = clientesLista.find(c => c.id === centroCusto);
    addRequisicao({
      solicitante: usuarioLogado?.nome || "Usuário",
      centroCusto,
      centroCustoNome: cliente?.nome || "",
      localEntrega,
      justificativa,
      urgencia,
      prazoDesejado,
      itens,
      anexos,
    });
    toast({ title: "Requisição de compra criada com sucesso!" });
    setDialogOpen(false);
    resetForm();
  };

  const handleMaterialSelect = (materialId: string) => {
    setItemMaterialId(materialId);
    const mat = materiais.find(m => m.id === materialId);
    if (mat) {
      setItemDescricao(mat.descricao);
      setItemUnidade(mat.unidadeMedida);
      if (mat.fabricanteId) setItemFabricanteId(mat.fabricanteId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground mx-[7px]">Requisições de Compras e Serviços</h1>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />Nova Requisição</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 items-end">
        <div className="relative sm:col-span-2 md:col-span-3 lg:col-span-2 xl:col-span-2 min-w-0">
          <Label className="text-xs">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Nº, solicitante, item..." value={search} onChange={e => { setSearch(e.target.value); setPageReq(1); }} className="pl-9" />
          </div>
        </div>
        <div className="min-w-0">
          <Label className="text-xs">Centro de Custo</Label>
          <Select value={filterCentroCusto} onValueChange={v => { setFilterCentroCusto(v); setPageReq(1); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              {centrosUnicos.map(([id, nome]) => <SelectItem key={id} value={id}>{nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0">
          <Label className="text-xs">Status</Label>
          <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPageReq(1); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Status</SelectItem>
              {Object.keys(statusColors).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0">
          <Label className="text-xs">Urgência</Label>
          <Select value={filterUrgencia} onValueChange={v => { setFilterUrgencia(v); setPageReq(1); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              {URGENCIAS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0">
          <Label className="text-xs">Solicitante</Label>
          <Select value={filterSolicitante} onValueChange={v => { setFilterSolicitante(v); setPageReq(1); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              {solicitantesUnicos.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0">
          <Label className="text-xs">Data inicial</Label>
          <Input type="date" value={filterDataIni} onChange={e => { setFilterDataIni(e.target.value); setPageReq(1); }} />
        </div>
        <div className="min-w-0">
          <Label className="text-xs">Data final</Label>
          <Input type="date" value={filterDataFim} onChange={e => { setFilterDataFim(e.target.value); setPageReq(1); }} />
        </div>
        <Button variant="outline" onClick={limparFiltros} className="w-full sm:w-auto">
          <X className="mr-2 h-4 w-4" />Limpar
        </Button>
      </div>

      <div className="border rounded-lg">
        <SortableHeaderRow order={colOrder} onReorder={setColOrder}>
        <Table>
          <TableHeader>
            <TableRow>
              {colOrder.map(key => {
                const cd = colDefs[key];
                return cd ? <SortableTableHead key={key} id={key} className={cd.className}>{cd.label}</SortableTableHead> : null;
              })}
              <TableHead className="w-28">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={colOrder.length + 1} className="text-center text-muted-foreground py-8">Nenhuma requisição encontrada</TableCell></TableRow>
            ) : filtered.map(r => {
              const cellMap: Record<string, ReactNode> = {
                numero: <span className="font-mono font-bold">RCS-{String(r.numero).padStart(4, "0")}</span>,
                data: format(new Date(r.dataCriacao), "dd/MM/yyyy HH:mm"),
                solicitante: r.solicitante,
                centroCusto: r.centroCustoNome,
                urgencia: <Badge variant={r.urgencia === "Urgente" ? "destructive" : r.urgencia === "Alta" ? "default" : "secondary"}>{r.urgencia}</Badge>,
                itens: r.itens.length,
                status: <Badge className={statusColors[r.status]}>{r.status}</Badge>,
              };
              return (
              <TableRow key={r.id}>
                {colOrder.map(key => <TableCell key={key} className={colDefs[key]?.className}>{cellMap[key]}</TableCell>)}
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" title="Detalhes" onClick={() => setViewReq(r)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Histórico" onClick={() => setHistoricoReq(r)}><Clock className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </SortableHeaderRow>
      </div>

      {/* Dialog Nova Requisição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Requisição de Compras</DialogTitle>
            <DialogDescription>Preencha os campos obrigatórios para criar uma nova solicitação.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
              <TabsTrigger value="itens">Itens ({itens.length})</TabsTrigger>
              <TabsTrigger value="anexos">Anexos ({anexos.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Centro de Custo (Cliente) *</Label>
                  <Select value={centroCusto} onValueChange={v => { setCentroCusto(v); setLocalEntrega(""); }}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{clientesLista.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Local de Entrega</Label>
                  {locaisEntregaDoCliente.length > 0 ? (
                    <Select value={localEntrega} onValueChange={setLocalEntrega}>
                      <SelectTrigger><SelectValue placeholder="Selecione o local de entrega..." /></SelectTrigger>
                      <SelectContent>
                        {locaisEntregaDoCliente.map(l => (
                          <SelectItem key={l.id} value={l.local}>
                            {l.local}{l.logradouro ? ` — ${l.logradouro}, ${l.numero}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={localEntrega} onChange={e => setLocalEntrega(e.target.value)} placeholder="Endereço ou local de entrega" />
                  )}
                </div>
                <div>
                  <Label>Grau de Urgência</Label>
                  <Select value={urgencia} onValueChange={v => setUrgencia(v as GrauUrgencia)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{URGENCIAS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prazo Desejado</Label>
                  <Input type="date" value={prazoDesejado} onChange={e => setPrazoDesejado(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Justificativa da Necessidade *</Label>
                <Textarea value={justificativa} onChange={e => setJustificativa(e.target.value)} placeholder="Descreva a justificativa para esta solicitação..." rows={3} />
              </div>
            </TabsContent>

            <TabsContent value="itens" className="space-y-4 mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Adicionar Item</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Material/Serviço cadastrado</Label>
                      <Popover open={materialPopoverOpen} onOpenChange={setMaterialPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" aria-expanded={materialPopoverOpen} className="w-full justify-between font-normal h-10">
                            {itemMaterialId
                              ? (() => { const m = materiais.find(m => m.id === itemMaterialId); return m ? `${m.codigo ? m.codigo + " - " : ""}${m.descricao}` : "Selecionar..."; })()
                              : "Selecionar (opcional)..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar material/serviço..." />
                            <CommandList>
                              <CommandEmpty>Nenhum material encontrado.</CommandEmpty>
                              <CommandGroup>
                                {materiais.map(m => (
                                  <CommandItem
                                    key={m.id}
                                    value={`${m.codigo} ${m.descricao}`}
                                    onSelect={() => {
                                      handleMaterialSelect(m.id);
                                      setMaterialPopoverOpen(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", itemMaterialId === m.id ? "opacity-100" : "opacity-0")} />
                                    {m.codigo ? `${m.codigo} - ` : ""}{m.descricao}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label>Descrição do Item *</Label>
                      <Input value={itemDescricao} onChange={e => setItemDescricao(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Especificação Técnica</Label>
                    <Textarea value={itemEspec} onChange={e => setItemEspec(e.target.value)} rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Observação</Label>
                      <Input value={itemObs} onChange={e => setItemObs(e.target.value)} />
                    </div>
                    <div>
                      <Label>Fabricante</Label>
                      <Select value={itemFabricanteId} onValueChange={setItemFabricanteId}>
                        <SelectTrigger><SelectValue placeholder="Selecionar (opcional)..." /></SelectTrigger>
                        <SelectContent>{fabricantes.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Quantidade *</Label>
                      <Input type="number" min="0" step="0.01" value={itemQtd} onChange={e => setItemQtd(e.target.value)} />
                    </div>
                    <div>
                      <Label>Unidade</Label>
                      <Select value={itemUnidade} onValueChange={setItemUnidade}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{["UN","M","M²","M³","KG","L","CX","PCT","SC","GL","HR","VB","JG","PR","RL","TB","FD","BD","CJ","DZ"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                    <div>
                      <Label>Anexo do Item</Label>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" onClick={() => itemAnexoInputRef.current?.click()} className="shrink-0">
                          <Paperclip className="mr-2 h-4 w-4" />{itemAnexo ? "Trocar arquivo" : "Anexar arquivo"}
                        </Button>
                        <input ref={itemAnexoInputRef} type="file" className="hidden" onChange={handleItemAnexoChange} />
                        {itemAnexo && (
                          <div className="flex items-center gap-1 text-sm border rounded px-2 py-1 flex-1 min-w-0">
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">{itemAnexo.nome}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => { setItemAnexo(null); if (itemAnexoInputRef.current) itemAnexoInputRef.current.value = ""; }}><X className="h-3 w-3" /></Button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Máx. 2MB por arquivo (opcional)</p>
                    </div>
                    <Button onClick={addItem}><Plus className="mr-2 h-4 w-4" />Adicionar</Button>
                  </div>
                </CardContent>
              </Card>

              {itens.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Especificação</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Un</TableHead>
                      <TableHead>Anexo</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.descricao}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{item.especificacaoTecnica || "-"}</TableCell>
                        <TableCell>{item.quantidade}</TableCell>
                        <TableCell>{item.unidadeMedida}</TableCell>
                        <TableCell className="text-xs">
                          {item.anexo ? (
                            <a href={item.anexo.base64} download={item.anexo.nome} className="text-primary hover:underline inline-flex items-center gap-1">
                              <FileText className="h-3 w-3" />{item.anexo.nome}
                            </a>
                          ) : "-"}
                        </TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="anexos" className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Paperclip className="mr-2 h-4 w-4" />Anexar Arquivo</Button>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
              </div>
              {anexos.length > 0 && (
                <div className="space-y-2">
                  {anexos.map(a => (
                    <div key={a.id} className="flex items-center gap-2 border rounded-lg px-3 py-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-sm">{a.nome}</span>
                      <Button variant="ghost" size="icon" onClick={() => setAnexos(prev => prev.filter(x => x.id !== a.id))}><X className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>Enviar Requisição</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes */}
      <Dialog open={!!viewReq} onOpenChange={() => setViewReq(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>RCS-{viewReq && String(viewReq.numero).padStart(4, "0")}</DialogTitle>
            <DialogDescription>Detalhes da requisição de compras</DialogDescription>
          </DialogHeader>
          {viewReq && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium text-muted-foreground">Solicitante:</span> {viewReq.solicitante}</div>
                <div><span className="font-medium text-muted-foreground">Data:</span> {format(new Date(viewReq.dataCriacao), "dd/MM/yyyy HH:mm")}</div>
                <div><span className="font-medium text-muted-foreground">Centro de Custo:</span> {viewReq.centroCustoNome}</div>
                <div><span className="font-medium text-muted-foreground">Local Entrega:</span> {viewReq.localEntrega || "-"}</div>
                <div><span className="font-medium text-muted-foreground">Urgência:</span> <Badge variant={viewReq.urgencia === "Urgente" ? "destructive" : "secondary"}>{viewReq.urgencia}</Badge></div>
                <div><span className="font-medium text-muted-foreground">Prazo:</span> {viewReq.prazoDesejado ? format(new Date(viewReq.prazoDesejado), "dd/MM/yyyy") : "-"}</div>
                <div className="col-span-2"><span className="font-medium text-muted-foreground">Status:</span> <Badge className={statusColors[viewReq.status]}>{viewReq.status}</Badge></div>
              </div>
              <div><span className="font-medium text-muted-foreground text-sm">Justificativa:</span><p className="text-sm mt-1">{viewReq.justificativa}</p></div>
              <div>
                <span className="font-medium text-muted-foreground text-sm">Itens ({viewReq.itens.length})</span>
                <Table>
                  <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Especificação</TableHead><TableHead>Obs</TableHead><TableHead>Qtd</TableHead><TableHead>Un</TableHead><TableHead>Anexo</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {viewReq.itens.map(i => (
                      <TableRow key={i.id}>
                        <TableCell>{i.descricao}</TableCell>
                        <TableCell className="text-xs">{i.especificacaoTecnica || "-"}</TableCell>
                        <TableCell className="text-xs">{i.observacao || "-"}</TableCell>
                        <TableCell>{i.quantidade}</TableCell>
                        <TableCell>{i.unidadeMedida}</TableCell>
                        <TableCell className="text-xs">
                          {i.anexo ? (
                            <a href={i.anexo.base64} download={i.anexo.nome} className="text-primary hover:underline inline-flex items-center gap-1">
                              <FileText className="h-3 w-3" />{i.anexo.nome}
                            </a>
                          ) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {viewReq.anexos.length > 0 && (
                <div>
                  <span className="font-medium text-muted-foreground text-sm">Anexos ({viewReq.anexos.length})</span>
                  <div className="space-y-1 mt-1">
                    {viewReq.anexos.map(a => (
                      <div key={a.id} className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <a href={a.base64} download={a.nome} className="text-primary hover:underline">{a.nome}</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Histórico */}
      <Dialog open={!!historicoReq} onOpenChange={() => setHistoricoReq(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Histórico - RCS-{historicoReq && String(historicoReq.numero).padStart(4, "0")}</DialogTitle>
            <DialogDescription>Linha do tempo de alterações de status</DialogDescription>
          </DialogHeader>
          {historicoReq && (
            <div className="space-y-3">
              {historicoReq.historicoStatus.map((h, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <Badge className={statusColors[h.status]}>{h.status}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(h.dataHora), "dd/MM/yyyy HH:mm")} — {h.usuario}</p>
                    {h.observacao && <p className="text-xs mt-0.5">{h.observacao}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
