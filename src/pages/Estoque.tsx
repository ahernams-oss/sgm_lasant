import { useState, useMemo } from "react";
import { useEstoque, MovimentacaoEstoque, SaldoEstoque } from "@/contexts/EstoqueContext";
import { useMateriaisServicos } from "@/contexts/MateriaisServicosContext";
import { useAuth } from "@/contexts/AuthContext";
import { useClientes } from "@/contexts/ClientesContext";
import { usePedidoCompra } from "@/contexts/PedidoCompraContext";
import { useRequisicaoCompras } from "@/contexts/RequisicaoComprasContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, ArrowDownCircle, ArrowUpCircle, AlertTriangle, ClipboardList, Package, Warehouse, TrendingDown, ChevronsUpDown, Check, Pencil } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export default function EstoquePage() {
  const { movimentacoes, inventarios, registrarMovimentacao, getSaldos, getSaldoPorMaterial, criarInventario, atualizarInventario, fecharInventario } = useEstoque();
  const { materiais } = useMateriaisServicos();
  const { usuarioLogado } = useAuth();
  const { clientes } = useClientes();
  const { pedidos } = usePedidoCompra();
  const { requisicoes } = useRequisicaoCompras();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("saldos");

  // Movimentação dialog
  const [movDialogOpen, setMovDialogOpen] = useState(false);
  const [movTipo, setMovTipo] = useState<"entrada" | "saida">("entrada");
  const [movMaterialId, setMovMaterialId] = useState("");
  const [movMaterialPopoverOpen, setMovMaterialPopoverOpen] = useState(false);
  const [movQuantidade, setMovQuantidade] = useState("");
  const [movLocal, setMovLocal] = useState("");
  const [movDocRef, setMovDocRef] = useState("");
  const [movObs, setMovObs] = useState("");

  // Inventário dialog
  const [invDialogOpen, setInvDialogOpen] = useState(false);
  const [invLocal, setInvLocal] = useState("");
  const [invObs, setInvObs] = useState("");
  const [invItens, setInvItens] = useState<{ materialId: string; materialCodigo: string; materialDescricao: string; saldoSistema: number; quantidadeContada: number; diferenca: number; observacao: string }[]>([]);
  const [editInvId, setEditInvId] = useState<string | null>(null);

  // Estoque mínimo dialog
  const [minDialogOpen, setMinDialogOpen] = useState(false);
  const [minMaterialId, setMinMaterialId] = useState("");
  const [minValue, setMinValue] = useState("");

  const locais = useMemo(() => {
    const locs = new Set<string>();
    clientes.forEach(c => {
      if (c.nome) locs.add(c.nome);
      const locaisArr = (c as any).locais || [];
      locaisArr.forEach((l: any) => { if (l?.nome) locs.add(`${c.nome} - ${l.nome}`); });
    });
    movimentacoes.forEach(m => { if (m.local) locs.add(m.local); });
    return Array.from(locs).sort();
  }, [clientes, movimentacoes]);

  // Locais apenas de clientes (sem fornecedores) para saídas
  const locaisClientes = useMemo(() => {
    const locs = new Set<string>();
    clientes.filter(c => c.tipo !== "Fornecedor").forEach(c => {
      if (c.nome) locs.add(c.nome);
      const locaisArr = (c as any).locais || [];
      locaisArr.forEach((l: any) => { if (l?.nome) locs.add(`${c.nome} - ${l.nome}`); });
    });
    return Array.from(locs).sort();
  }, [clientes]);

  // Centro de custo lookup: pedidoNumero → centroCustoNome
  const centroCustoMap = useMemo(() => {
    const map = new Map<number, string>();
    pedidos.forEach(p => {
      const rc = requisicoes.find(r => r.id === p.requisicaoId);
      if (rc?.centroCustoNome) map.set(p.numero, rc.centroCustoNome);
    });
    return map;
  }, [pedidos, requisicoes]);

  const getCentroCustoFromDocRef = (docRef: string): string => {
    const match = docRef.match(/Pedido\s+(\d+)/i);
    if (match) {
      const num = parseInt(match[1]);
      return centroCustoMap.get(num) || "-";
    }
    return "-";
  };

  // === SALDOS ===
  const saldos = useMemo(() => {
    const all = getSaldos();
    if (!search) return all;
    const s = search.toLowerCase();
    return all.filter(sl => sl.materialCodigo.toLowerCase().includes(s) || sl.materialDescricao.toLowerCase().includes(s) || sl.local.toLowerCase().includes(s));
  }, [getSaldos, search]);

  // Map saldo (material+local) → centro de custo from most recent movement
  const saldoCentroCusto = useMemo(() => {
    const map = new Map<string, string>();
    // Process movements in order so latest wins
    movimentacoes.forEach(m => {
      const cc = getCentroCustoFromDocRef(m.documentoRef);
      if (cc !== "-") {
        map.set(`${m.materialId}|${m.local}`, cc);
      }
    });
    return map;
  }, [movimentacoes, centroCustoMap]);

  // === ALERTAS ===
  const alertas = useMemo(() => {
    return materiais
      .filter(m => {
        const min = (m as any).estoqueMinimo || 0;
        if (min <= 0) return false;
        const saldo = getSaldoPorMaterial(m.id);
        return saldo <= min;
      })
      .map(m => ({
        ...m,
        estoqueMinimo: (m as any).estoqueMinimo || 0,
        saldoAtual: getSaldoPorMaterial(m.id),
      }));
  }, [materiais, getSaldoPorMaterial]);

  // === MOVIMENTAÇÕES ===
  const movFiltered = useMemo(() => {
    if (!search) return [...movimentacoes].reverse();
    const s = search.toLowerCase();
    return [...movimentacoes].reverse().filter(m =>
      m.materialCodigo.toLowerCase().includes(s) || m.materialDescricao.toLowerCase().includes(s) || m.local.toLowerCase().includes(s)
    );
  }, [movimentacoes, search]);

  // KPIs
  const totalItensEstoque = useMemo(() => saldos.reduce((s, i) => s + i.quantidade, 0), [saldos]);
  const totalLocais = useMemo(() => new Set(saldos.map(s => s.local)).size, [saldos]);

  const openMovDialog = (tipo: "entrada" | "saida") => {
    setMovTipo(tipo);
    setMovMaterialId("");
    setMovQuantidade("");
    setMovLocal("");
    setMovDocRef("");
    setMovObs("");
    setMovDialogOpen(true);
  };

  const handleMovSave = async () => {
    if (!movMaterialId || !movQuantidade || !movLocal) {
      toast({ title: "Preencha Material, Quantidade e Local", variant: "destructive" });
      return;
    }
    const mat = materiais.find(m => m.id === movMaterialId);
    if (!mat) return;
    const qty = Number(movQuantidade);
    if (qty <= 0) { toast({ title: "Quantidade deve ser maior que zero", variant: "destructive" }); return; }
    if (movTipo === "saida") {
      const saldo = getSaldoPorMaterial(mat.id);
      if (qty > saldo) { toast({ title: `Saldo insuficiente. Disponível: ${saldo}`, variant: "destructive" }); return; }
    }
    await registrarMovimentacao({
      materialId: mat.id, materialCodigo: mat.codigo, materialDescricao: mat.descricao,
      tipo: movTipo, quantidade: qty, local: movLocal,
      documentoRef: movDocRef, observacao: movObs,
      usuario: usuarioLogado?.nome || "",
      lote: "", validade: "", depositoOrigem: "", depositoDestino: "", fornecedorNome: "",
    });
    toast({ title: `${movTipo === "entrada" ? "Entrada" : "Saída"} registrada com sucesso` });
    setMovDialogOpen(false);
  };

  const openInvDialog = () => {
    setInvLocal("");
    setInvObs("");
    setInvItens([]);
    setEditInvId(null);
    setInvDialogOpen(true);
  };

  const loadInvItens = (local: string) => {
    setInvLocal(local);
    const saldosLocal = getSaldos().filter(s => s.local === local);
    setInvItens(saldosLocal.map(s => ({
      materialId: s.materialId, materialCodigo: s.materialCodigo,
      materialDescricao: s.materialDescricao, saldoSistema: s.quantidade,
      quantidadeContada: s.quantidade, diferenca: 0, observacao: "",
    })));
  };

  const handleEditInventario = (inv: any) => {
    setEditInvId(inv.id);
    setInvLocal(inv.local);
    setInvObs(inv.observacao || "");
    setInvItens(inv.itens.map((it: any) => ({
      materialId: it.materialId, materialCodigo: it.materialCodigo,
      materialDescricao: it.materialDescricao, saldoSistema: it.saldoSistema,
      quantidadeContada: it.quantidadeContada, diferenca: it.quantidadeContada - it.saldoSistema,
      observacao: it.observacao || "",
    })));
    setInvDialogOpen(true);
  };

  const handleInvSave = async () => {
    if (!invLocal) { toast({ title: "Selecione um local", variant: "destructive" }); return; }
    if (editInvId) {
      await atualizarInventario(editInvId, invItens, invObs);
      toast({ title: "Inventário atualizado" });
    } else {
      await criarInventario({ local: invLocal, itens: invItens, usuario: usuarioLogado?.nome || "", observacao: invObs });
      toast({ title: "Inventário criado" });
    }
    setInvDialogOpen(false);
  };

  const handleFecharInventario = async (id: string) => {
    await fecharInventario(id, usuarioLogado?.nome || "");
    toast({ title: "Inventário fechado e ajustes aplicados" });
  };

  const tipoColor = (tipo: string) => {
    if (tipo === "entrada") return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
    if (tipo === "saida") return "bg-red-500/10 text-red-700 border-red-200";
    return "bg-amber-500/10 text-amber-700 border-amber-200";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Controle de Estoque</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openMovDialog("entrada")}>
            <ArrowDownCircle className="mr-2 h-4 w-4 text-emerald-600" />Entrada
          </Button>
          <Button variant="outline" onClick={() => openMovDialog("saida")}>
            <ArrowUpCircle className="mr-2 h-4 w-4 text-red-600" />Saída
          </Button>
          <Button onClick={openInvDialog}>
            <ClipboardList className="mr-2 h-4 w-4" />Inventário
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Itens em Estoque</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{saldos.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Quantidade Total</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalItensEstoque.toLocaleString("pt-BR")}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Locais</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalLocais}</p></CardContent>
        </Card>
        <Card className={alertas.length > 0 ? "border-destructive" : ""}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Alertas Estoque Mínimo</CardTitle></CardHeader>
          <CardContent><p className={`text-2xl font-bold ${alertas.length > 0 ? "text-destructive" : ""}`}>{alertas.length}</p></CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar material, código ou local..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="saldos"><Warehouse className="mr-1 h-4 w-4" />Saldos por Local</TabsTrigger>
          <TabsTrigger value="movimentacoes"><Package className="mr-1 h-4 w-4" />Movimentações</TabsTrigger>
          <TabsTrigger value="alertas">
            <AlertTriangle className="mr-1 h-4 w-4" />Alertas
            {alertas.length > 0 && <Badge variant="destructive" className="ml-1 text-xs">{alertas.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="inventarios"><ClipboardList className="mr-1 h-4 w-4" />Inventários</TabsTrigger>
        </TabsList>

        {/* SALDOS */}
        <TabsContent value="saldos">
          <div className="border rounded-lg">
            <Table>
             <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Material/Serviço</TableHead>
                  <TableHead>Centro de Custo</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saldos.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum saldo registrado</TableCell></TableRow>
                ) : saldos.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono">{s.materialCodigo}</TableCell>
                    <TableCell>{s.materialDescricao}</TableCell>
                    <TableCell>{saldoCentroCusto.get(`${s.materialId}|${s.local}`) || "-"}</TableCell>
                    <TableCell>{s.local}</TableCell>
                    <TableCell className="text-right font-semibold">{s.quantidade.toLocaleString("pt-BR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* MOVIMENTAÇÕES */}
        <TabsContent value="movimentacoes">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Centro de Custo</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movFiltered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhuma movimentação</TableCell></TableRow>
                ) : movFiltered.slice(0, 100).map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs">{m.dataMovimentacao ? new Date(m.dataMovimentacao).toLocaleDateString("pt-BR") : "-"}</TableCell>
                    <TableCell><Badge className={tipoColor(m.tipo)}>{m.tipo === "entrada" ? "Entrada" : m.tipo === "saida" ? "Saída" : "Ajuste"}</Badge></TableCell>
                    <TableCell className="font-mono">{m.materialCodigo}</TableCell>
                    <TableCell>{m.materialDescricao}</TableCell>
                    <TableCell>{getCentroCustoFromDocRef(m.documentoRef)}</TableCell>
                    <TableCell>{m.local}</TableCell>
                    <TableCell className="text-right font-semibold">{m.quantidade.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-xs">{m.documentoRef || "-"}</TableCell>
                    <TableCell className="text-xs">{m.usuario}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ALERTAS */}
        <TabsContent value="alertas">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Estoque Mínimo</TableHead>
                  <TableHead className="text-right">Saldo Atual</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertas.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum alerta – todos os itens estão acima do mínimo</TableCell></TableRow>
                ) : alertas.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono">{a.codigo}</TableCell>
                    <TableCell>{a.descricao}</TableCell>
                    <TableCell className="text-right">{a.estoqueMinimo}</TableCell>
                    <TableCell className="text-right font-semibold">{a.saldoAtual}</TableCell>
                    <TableCell>
                      {a.saldoAtual <= 0
                        ? <Badge variant="destructive">Zerado</Badge>
                        : <Badge className="bg-amber-500/10 text-amber-700 border-amber-200">Baixo</Badge>
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* INVENTÁRIOS */}
        <TabsContent value="inventarios">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventarios.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum inventário registrado</TableCell></TableRow>
                ) : [...inventarios].reverse().map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.dataInventario ? new Date(inv.dataInventario).toLocaleDateString("pt-BR") : "-"}</TableCell>
                    <TableCell>{inv.local}</TableCell>
                    <TableCell>{inv.itens.length}</TableCell>
                    <TableCell>{inv.usuario}</TableCell>
                    <TableCell>
                      <Badge className={inv.status === "Aberto" ? "bg-blue-500/10 text-blue-700 border-blue-200" : "bg-muted text-muted-foreground"}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-1">
                      {inv.status === "Aberto" && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleEditInventario(inv)} title="Editar itens">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleFecharInventario(inv.id)}>
                            Fechar e Ajustar
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Movimentação */}
      <Dialog open={movDialogOpen} onOpenChange={setMovDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movTipo === "entrada" ? <><ArrowDownCircle className="inline mr-2 h-5 w-5 text-emerald-600" />Registrar Entrada</> : <><ArrowUpCircle className="inline mr-2 h-5 w-5 text-red-600" />Registrar Saída</>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Material *</Label>
              <Popover open={movMaterialPopoverOpen} onOpenChange={setMovMaterialPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={movMaterialPopoverOpen} className="w-full justify-between font-normal h-10">
                    {movMaterialId
                      ? (() => { const m = materiais.find(m => m.id === movMaterialId); return m ? `${m.codigo} - ${m.descricao}` : "Selecione..."; })()
                      : "Selecione..."}
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
                              setMovMaterialId(m.id);
                              setMovMaterialPopoverOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", movMaterialId === m.id ? "opacity-100" : "opacity-0")} />
                            {m.codigo} - {m.descricao}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Quantidade *</Label>
              <Input type="number" min="1" value={movQuantidade} onChange={e => setMovQuantidade(e.target.value)} />
            </div>
            <div>
              <Label>Local *</Label>
              <Select value={movLocal} onValueChange={setMovLocal}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {(movTipo === "saida" ? locaisClientes : locais).map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Documento Referência</Label><Input value={movDocRef} onChange={e => setMovDocRef(e.target.value)} placeholder="NF, OS, etc." /></div>
            <div><Label>Observação</Label><Input value={movObs} onChange={e => setMovObs(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={handleMovSave}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Inventário */}
      <Dialog open={invDialogOpen} onOpenChange={setInvDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle><ClipboardList className="inline mr-2 h-5 w-5" />{editInvId ? "Editar Inventário" : "Novo Inventário"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Local *</Label>
              <Select value={invLocal} onValueChange={v => loadInvItens(v)} disabled={!!editInvId}>
                <SelectTrigger><SelectValue placeholder="Selecione o local..." /></SelectTrigger>
                <SelectContent>
                  {locais.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {invItens.length > 0 && (
              <div className="border rounded-lg max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead className="text-right">Sistema</TableHead>
                      <TableHead className="text-right">Contado</TableHead>
                      <TableHead className="text-right">Diferença</TableHead>
                      <TableHead>Obs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invItens.map((it, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">{it.materialCodigo}</TableCell>
                        <TableCell className="text-xs">{it.materialDescricao}</TableCell>
                        <TableCell className="text-right">{it.saldoSistema}</TableCell>
                        <TableCell className="text-right">
                          <Input type="number" className="w-20 text-right"
                            value={it.quantidadeContada}
                            min={0}
                            onFocus={e => e.target.select()}
                            onChange={e => {
                              const val = e.target.value === "" ? 0 : Number(e.target.value);
                              setInvItens(prev => prev.map((p, i) => i === idx ? { ...p, quantidadeContada: val, diferenca: val - p.saldoSistema } : p));
                            }} />
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${it.diferenca < 0 ? "text-destructive" : it.diferenca > 0 ? "text-emerald-600" : ""}`}>
                          {it.diferenca > 0 ? `+${it.diferenca}` : it.diferenca}
                        </TableCell>
                        <TableCell>
                          <Input className="w-24 text-xs" value={it.observacao}
                            onChange={e => setInvItens(prev => prev.map((p, i) => i === idx ? { ...p, observacao: e.target.value } : p))} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div><Label>Observação Geral</Label><Input value={invObs} onChange={e => setInvObs(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={handleInvSave}>{editInvId ? "Salvar Alterações" : "Criar Inventário"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
