import { useState, useMemo } from "react";
import { useCotacaoCompras, CotacaoCompras, PropostaFornecedor, ItemCotacaoFornecedor } from "@/contexts/CotacaoComprasContext";
import { useRequisicaoCompras, RequisicaoCompras } from "@/contexts/RequisicaoComprasContext";
import { usePedidoCompra } from "@/contexts/PedidoCompraContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Eye, Trophy, XCircle, BarChart3, Trash2, MoreHorizontal, FilterX } from "lucide-react";
import { format, subDays, isAfter } from "date-fns";

const statusColors: Record<string, string> = {
  "Em Andamento": "bg-yellow-100 text-yellow-800",
  Finalizada: "bg-green-100 text-green-800",
  Cancelada: "bg-red-200 text-red-900",
};

export default function CotacaoComprasPage() {
  const { cotacoes, addCotacao, addProposta, removeProposta, finalizarCotacao, cancelarCotacao } = useCotacaoCompras();
  const { requisicoes, updateStatus } = useRequisicaoCompras();
  const { addPedido } = usePedidoCompra();
  const { clientes } = useClientes();
  const { usuarioLogado } = useAuth();
  const { toast } = useToast();

  const fornecedores = useMemo(() => clientes.filter(c => c.tipo === "Fornecedor"), [clientes]);
  const reqDisponiveisParaCotacao = useMemo(() => requisicoes.filter(r => r.status === "Enviada" || r.status === "Em Cotação"), [requisicoes]);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");

  // Dialog states
  const [novaDialogOpen, setNovaDialogOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState("");
  const [reqSearch, setReqSearch] = useState("");
  const [reqFilterUrgencia, setReqFilterUrgencia] = useState("Todas");

  const reqFiltradas = useMemo(() => {
    let list = reqDisponiveisParaCotacao;
    if (reqFilterUrgencia !== "Todas") list = list.filter(r => r.urgencia === reqFilterUrgencia);
    if (reqSearch) {
      const s = reqSearch.toLowerCase();
      list = list.filter(r =>
        String(r.numero).includes(s) ||
        r.centroCustoNome.toLowerCase().includes(s) ||
        r.solicitante.toLowerCase().includes(s) ||
        r.itens.some(i => i.descricao.toLowerCase().includes(s))
      );
    }
    return list.sort((a, b) => b.numero - a.numero);
  }, [reqDisponiveisParaCotacao, reqSearch, reqFilterUrgencia]);
  const [viewCotacao, setViewCotacao] = useState<CotacaoCompras | null>(null);
  const [propostaDialogOpen, setPropostaDialogOpen] = useState(false);
  const [propostaCotacaoId, setPropostaCotacaoId] = useState("");
  const [finalizarDialogOpen, setFinalizarDialogOpen] = useState(false);
  const [finalizarCotacaoId, setFinalizarCotacaoId] = useState("");
  const [mapaDialogOpen, setMapaDialogOpen] = useState(false);
  const [mapaCotacao, setMapaCotacao] = useState<CotacaoCompras | null>(null);

  // Proposta form
  const [propFornecedorId, setPropFornecedorId] = useState("");
  const [propCondicao, setPropCondicao] = useState("");
  const [propPrazo, setPropPrazo] = useState("");
  const [propValidade, setPropValidade] = useState("");
  const [propObs, setPropObs] = useState("");
  const [propItens, setPropItens] = useState<ItemCotacaoFornecedor[]>([]);

  // Finalizar form
  const [finVencedorId, setFinVencedorId] = useState("");
  const [finJustificativa, setFinJustificativa] = useState("");

  const filtered = useMemo(() => {
    let list = cotacoes;
    if (filterStatus !== "Todos") list = list.filter(c => c.status === filterStatus);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(c => String(c.numero).includes(s) || c.comprador.toLowerCase().includes(s) || String(c.requisicaoNumero).includes(s));
    }
    return list.sort((a, b) => b.numero - a.numero);
  }, [cotacoes, search, filterStatus]);

  const handleCriarCotacao = () => {
    if (!selectedReqId) { toast({ title: "Selecione uma requisição", variant: "destructive" }); return; }
    const req = requisicoes.find(r => r.id === selectedReqId);
    if (!req) return;
    addCotacao({ requisicaoId: req.id, requisicaoNumero: req.numero, comprador: usuarioLogado?.nome || "Comprador" });
    updateStatus(req.id, "Em Cotação", usuarioLogado?.nome || "Comprador", "Cotação iniciada");
    toast({ title: "Cotação criada com sucesso!" });
    setNovaDialogOpen(false);
    setSelectedReqId("");
  };

  const openPropostaDialog = (cotacaoId: string) => {
    const cot = cotacoes.find(c => c.id === cotacaoId);
    if (!cot) return;
    const req = requisicoes.find(r => r.id === cot.requisicaoId);
    if (!req) return;
    setPropItens(req.itens.map(i => ({ itemId: i.id, descricao: i.descricao, quantidade: i.quantidade, unidadeMedida: i.unidadeMedida, precoUnitario: 0, prazoEntrega: "", observacao: "" })));
    setPropFornecedorId(""); setPropCondicao(""); setPropPrazo(""); setPropValidade(""); setPropObs("");
    setPropostaCotacaoId(cotacaoId);
    setPropostaDialogOpen(true);
  };

  const handleAddProposta = () => {
    if (!propFornecedorId) { toast({ title: "Selecione um fornecedor", variant: "destructive" }); return; }
    if (propItens.some(i => i.precoUnitario <= 0)) { toast({ title: "Preencha todos os preços unitários", variant: "destructive" }); return; }
    const forn = fornecedores.find(f => f.id === propFornecedorId);
    addProposta(propostaCotacaoId, {
      fornecedorId: propFornecedorId,
      fornecedorNome: forn?.nome || "",
      condicaoPagamento: propCondicao,
      prazoEntrega: propPrazo,
      validadeProposta: propValidade,
      observacao: propObs,
      itens: propItens,
    });
    toast({ title: "Proposta adicionada!" });
    setPropostaDialogOpen(false);
  };

  const openFinalizarDialog = (cotacaoId: string) => {
    setFinalizarCotacaoId(cotacaoId);
    setFinVencedorId(""); setFinJustificativa("");
    setFinalizarDialogOpen(true);
  };

  const handleFinalizar = () => {
    if (!finVencedorId) { toast({ title: "Selecione o fornecedor vencedor", variant: "destructive" }); return; }
    if (!finJustificativa.trim()) { toast({ title: "Justificativa é obrigatória", variant: "destructive" }); return; }
    const cot = cotacoes.find(c => c.id === finalizarCotacaoId);
    if (!cot) return;
    finalizarCotacao(finalizarCotacaoId, finVencedorId, finJustificativa);

    // Auto-create pedido
    const propVencedora = cot.propostas.find(p => p.fornecedorId === finVencedorId);
    if (propVencedora) {
      const req = requisicoes.find(r => r.id === cot.requisicaoId);
      addPedido({
        cotacaoId: cot.id,
        requisicaoId: cot.requisicaoId,
        requisicaoNumero: cot.requisicaoNumero,
        comprador: usuarioLogado?.nome || "Comprador",
        fornecedorId: propVencedora.fornecedorId,
        fornecedorNome: propVencedora.fornecedorNome,
        itens: propVencedora.itens.map(i => ({ itemId: i.itemId, descricao: i.descricao, quantidade: i.quantidade, unidadeMedida: i.unidadeMedida, precoUnitario: i.precoUnitario, valorTotal: i.precoUnitario * i.quantidade })),
        condicaoPagamento: propVencedora.condicaoPagamento,
        prazoEntrega: propVencedora.prazoEntrega,
        localEntrega: req?.localEntrega || "",
        observacoes: "",
      });
      updateStatus(cot.requisicaoId, "Pedido Emitido", usuarioLogado?.nome || "Comprador", "Pedido gerado automaticamente após cotação");
    }

    toast({ title: "Cotação finalizada e pedido emitido!" });
    setFinalizarDialogOpen(false);
  };

  const openMapa = (cot: CotacaoCompras) => { setMapaCotacao(cot); setMapaDialogOpen(true); };

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Cotações de Compras</h1>
        <Button onClick={() => { setReqSearch(""); setReqFilterUrgencia("Todas"); setSelectedReqId(""); setNovaDialogOpen(true); }} disabled={reqDisponiveisParaCotacao.length === 0}><Plus className="mr-2 h-4 w-4" />Nova Cotação</Button>
      </div>

      <div className="flex gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nº, comprador, requisição..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os Status</SelectItem>
            <SelectItem value="Em Andamento">Em Andamento</SelectItem>
            <SelectItem value="Finalizada">Finalizada</SelectItem>
            <SelectItem value="Cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Cotação</TableHead>
              <TableHead>RC Vinculada</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Comprador</TableHead>
              <TableHead>Propostas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-40">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma cotação encontrada</TableCell></TableRow>
            ) : filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-mono font-bold">COT-{String(c.numero).padStart(4, "0")}</TableCell>
                <TableCell className="font-mono">RC-{String(c.requisicaoNumero).padStart(4, "0")}</TableCell>
                <TableCell>{format(new Date(c.dataCriacao), "dd/MM/yyyy")}</TableCell>
                <TableCell>{c.comprador}</TableCell>
                <TableCell><Badge variant="secondary">{c.propostas.length}</Badge></TableCell>
                <TableCell><Badge className={statusColors[c.status] || ""}>{c.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" title="Detalhes" onClick={() => setViewCotacao(c)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Mapa Comparativo" onClick={() => openMapa(c)} disabled={c.propostas.length === 0}><BarChart3 className="h-4 w-4" /></Button>
                    {c.status === "Em Andamento" && (
                      <>
                        <Button variant="ghost" size="icon" title="Adicionar Proposta" onClick={() => openPropostaDialog(c.id)}><Plus className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Finalizar" onClick={() => openFinalizarDialog(c.id)} disabled={c.propostas.length < 1}><Trophy className="h-4 w-4 text-amber-600" /></Button>
                        <Button variant="ghost" size="icon" title="Cancelar" onClick={() => { cancelarCotacao(c.id); toast({ title: "Cotação cancelada" }); }}><XCircle className="h-4 w-4 text-destructive" /></Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Nova Cotação */}
      <Dialog open={novaDialogOpen} onOpenChange={setNovaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Cotação</DialogTitle>
          <DialogDescription>Selecione a requisição de compras para iniciar a cotação.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nº, centro de custo, solicitante, item..."
                  value={reqSearch}
                  onChange={e => setReqSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={reqFilterUrgencia} onValueChange={setReqFilterUrgencia}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas Urgências</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Requisição de Compras *</Label>
              <Select value={selectedReqId} onValueChange={setSelectedReqId}>
                <SelectTrigger><SelectValue placeholder="Selecione uma RC..." /></SelectTrigger>
                <SelectContent>
                  {reqFiltradas.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      RC-{String(r.numero).padStart(4, "0")} — {r.centroCustoNome} ({r.itens.length} itens) [{r.urgencia}]
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {reqFiltradas.length === 0 && (
                <p className="text-sm text-muted-foreground mt-1">Nenhuma requisição encontrada com os filtros aplicados.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNovaDialogOpen(false); setReqSearch(""); setReqFilterUrgencia("Todas"); }}>Cancelar</Button>
            <Button onClick={handleCriarCotacao}>Criar Cotação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Adicionar Proposta */}
      <Dialog open={propostaDialogOpen} onOpenChange={setPropostaDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Proposta de Fornecedor</DialogTitle>
            <DialogDescription>Preencha os dados da proposta recebida.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fornecedor *</Label>
                <Select value={propFornecedorId} onValueChange={setPropFornecedorId}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{fornecedores.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Condição de Pagamento</Label>
                <Input value={propCondicao} onChange={e => setPropCondicao(e.target.value)} placeholder="Ex: 30/60/90 dias" />
              </div>
              <div>
                <Label>Prazo de Entrega</Label>
                <Input value={propPrazo} onChange={e => setPropPrazo(e.target.value)} placeholder="Ex: 15 dias úteis" />
              </div>
              <div>
                <Label>Validade da Proposta</Label>
                <Input type="date" value={propValidade} onChange={e => setPropValidade(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={propObs} onChange={e => setPropObs(e.target.value)} rows={2} />
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Itens e Preços</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-20">Qtd</TableHead>
                      <TableHead className="w-16">Un</TableHead>
                      <TableHead className="w-32">Preço Unit. *</TableHead>
                      <TableHead className="w-32">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {propItens.map((item, idx) => (
                      <TableRow key={item.itemId}>
                        <TableCell className="text-sm">{item.descricao}</TableCell>
                        <TableCell>{item.quantidade}</TableCell>
                        <TableCell>{item.unidadeMedida}</TableCell>
                        <TableCell>
                          <Input type="number" min="0" step="0.01" value={item.precoUnitario || ""} onChange={e => {
                            const val = Number(e.target.value);
                            setPropItens(prev => prev.map((it, i) => i === idx ? { ...it, precoUnitario: val } : it));
                          }} className="h-8" />
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(item.precoUnitario * item.quantidade)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="text-right mt-2 font-bold text-lg">
                  Total: {formatCurrency(propItens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0))}
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPropostaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddProposta}>Salvar Proposta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Finalizar Cotação */}
      <Dialog open={finalizarDialogOpen} onOpenChange={setFinalizarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Cotação</DialogTitle>
            <DialogDescription>Selecione o fornecedor vencedor e justifique a escolha. Um Pedido de Compra será gerado automaticamente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fornecedor Vencedor *</Label>
              <Select value={finVencedorId} onValueChange={setFinVencedorId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {cotacoes.find(c => c.id === finalizarCotacaoId)?.propostas.map(p => (
                    <SelectItem key={p.fornecedorId} value={p.fornecedorId}>{p.fornecedorNome} — {formatCurrency(p.valorTotal)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Justificativa da Escolha *</Label>
              <Textarea value={finJustificativa} onChange={e => setFinJustificativa(e.target.value)} placeholder="Justifique a escolha do fornecedor..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalizarDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleFinalizar}>Finalizar e Emitir Pedido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes */}
      <Dialog open={!!viewCotacao} onOpenChange={() => setViewCotacao(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>COT-{viewCotacao && String(viewCotacao.numero).padStart(4, "0")}</DialogTitle>
            <DialogDescription>Detalhes da cotação de compras</DialogDescription>
          </DialogHeader>
          {viewCotacao && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">RC Vinculada:</span> RC-{String(viewCotacao.requisicaoNumero).padStart(4, "0")}</div>
                <div><span className="text-muted-foreground">Comprador:</span> {viewCotacao.comprador}</div>
                <div><span className="text-muted-foreground">Data:</span> {format(new Date(viewCotacao.dataCriacao), "dd/MM/yyyy HH:mm")}</div>
                <div><span className="text-muted-foreground">Status:</span> <Badge className={statusColors[viewCotacao.status]}>{viewCotacao.status}</Badge></div>
                {viewCotacao.fornecedorVencedorId && (
                  <>
                    <div><span className="text-muted-foreground">Vencedor:</span> {viewCotacao.propostas.find(p => p.fornecedorId === viewCotacao.fornecedorVencedorId)?.fornecedorNome}</div>
                    <div><span className="text-muted-foreground">Justificativa:</span> {viewCotacao.justificativaEscolha}</div>
                  </>
                )}
              </div>
              <h3 className="font-semibold mt-4">Propostas ({viewCotacao.propostas.length})</h3>
              {viewCotacao.propostas.map(p => (
                <Card key={p.id} className={p.fornecedorId === viewCotacao.fornecedorVencedorId ? "border-green-500 border-2" : ""}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {p.fornecedorNome}
                      {p.fornecedorId === viewCotacao.fornecedorVencedorId && <Badge className="bg-green-100 text-green-800">Vencedor</Badge>}
                      <span className="ml-auto font-bold">{formatCurrency(p.valorTotal)}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-1">
                    <p>Pagamento: {p.condicaoPagamento || "-"} | Prazo: {p.prazoEntrega || "-"} | Validade: {p.validadeProposta ? format(new Date(p.validadeProposta), "dd/MM/yyyy") : "-"}</p>
                    {p.observacao && <p>Obs: {p.observacao}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Mapa Comparativo */}
      <Dialog open={mapaDialogOpen} onOpenChange={setMapaDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mapa Comparativo — COT-{mapaCotacao && String(mapaCotacao.numero).padStart(4, "0")}</DialogTitle>
            <DialogDescription>Comparação de propostas dos fornecedores</DialogDescription>
          </DialogHeader>
          {mapaCotacao && mapaCotacao.propostas.length > 0 && (() => {
            const req = requisicoes.find(r => r.id === mapaCotacao.requisicaoId);
            const itensBase = req?.itens || [];
            const menorTotal = Math.min(...mapaCotacao.propostas.map(p => p.valorTotal));
            return (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Item</TableHead>
                      <TableHead className="w-16">Qtd</TableHead>
                      {mapaCotacao.propostas.map(p => (
                        <TableHead key={p.id} className="min-w-[140px] text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span>{p.fornecedorNome}</span>
                            {p.fornecedorId === mapaCotacao.fornecedorVencedorId && <Badge className="bg-green-100 text-green-800 text-[10px]">Vencedor</Badge>}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itensBase.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">{item.descricao}</TableCell>
                        <TableCell>{item.quantidade} {item.unidadeMedida}</TableCell>
                        {mapaCotacao.propostas.map(p => {
                          const pi = p.itens.find(i => i.itemId === item.id);
                          const unitPrices = mapaCotacao.propostas.map(pr => pr.itens.find(i => i.itemId === item.id)?.precoUnitario || Infinity);
                          const minPrice = Math.min(...unitPrices);
                          const isCheapest = pi && pi.precoUnitario === minPrice;
                          return (
                            <TableCell key={p.id} className={`text-center ${isCheapest ? "bg-green-50 font-bold text-green-700" : ""}`}>
                              {pi ? (
                                <div>
                                  <div className="text-xs text-muted-foreground">Unit: {formatCurrency(pi.precoUnitario)}</div>
                                  <div>{formatCurrency(pi.precoUnitario * pi.quantidade)}</div>
                                </div>
                              ) : "-"}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2">
                      <TableCell colSpan={2}>TOTAL</TableCell>
                      {mapaCotacao.propostas.map(p => (
                        <TableCell key={p.id} className={`text-center ${p.valorTotal === menorTotal ? "bg-green-50 text-green-700" : ""}`}>
                          {formatCurrency(p.valorTotal)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={2} className="text-muted-foreground">Condição Pgto</TableCell>
                      {mapaCotacao.propostas.map(p => <TableCell key={p.id} className="text-center text-sm">{p.condicaoPagamento || "-"}</TableCell>)}
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={2} className="text-muted-foreground">Prazo Entrega</TableCell>
                      {mapaCotacao.propostas.map(p => <TableCell key={p.id} className="text-center text-sm">{p.prazoEntrega || "-"}</TableCell>)}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
