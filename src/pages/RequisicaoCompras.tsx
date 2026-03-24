import { useState, useMemo, useRef } from "react";
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
import { Plus, Trash2, Search, Eye, FileText, Clock, Paperclip, X } from "lucide-react";
import { format } from "date-fns";

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
  const { clientes } = useClientes();
  const { usuarioLogado } = useAuth();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewReq, setViewReq] = useState<RequisicaoCompras | null>(null);
  const [historicoReq, setHistoricoReq] = useState<RequisicaoCompras | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("Todos");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [itemDescricao, setItemDescricao] = useState("");
  const [itemEspec, setItemEspec] = useState("");
  const [itemObs, setItemObs] = useState("");
  const [itemQtd, setItemQtd] = useState("");
  const [itemUnidade, setItemUnidade] = useState("UN");

  const clientesLista = useMemo(() => clientes.filter(c => c.tipo === "Cliente"), [clientes]);

  const filtered = useMemo(() => {
    let list = requisicoes;
    if (filterStatus !== "Todos") list = list.filter(r => r.status === filterStatus);
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
  }, [requisicoes, search, filterStatus]);

  const resetForm = () => {
    setCentroCusto(""); setLocalEntrega(""); setJustificativa(""); setUrgencia("Normal"); setPrazoDesejado("");
    setItens([]); setAnexos([]);
    resetItemForm();
  };

  const resetItemForm = () => {
    setItemMaterialId(""); setItemDescricao(""); setItemEspec(""); setItemObs(""); setItemQtd(""); setItemUnidade("UN");
  };

  const addItem = () => {
    if (!itemDescricao.trim()) { toast({ title: "Descrição do item é obrigatória", variant: "destructive" }); return; }
    if (!itemQtd || Number(itemQtd) <= 0) { toast({ title: "Quantidade deve ser maior que zero", variant: "destructive" }); return; }
    setItens(prev => [...prev, {
      id: crypto.randomUUID(), materialId: itemMaterialId, descricao: itemDescricao,
      especificacaoTecnica: itemEspec, observacao: itemObs, quantidade: Number(itemQtd), unidadeMedida: itemUnidade,
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
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Requisições de Compras</h1>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />Nova Requisição</Button>
      </div>

      <div className="flex gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nº, solicitante, item..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os Status</SelectItem>
            {Object.keys(statusColors).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Centro de Custo</TableHead>
              <TableHead>Urgência</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhuma requisição encontrada</TableCell></TableRow>
            ) : filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-mono font-bold">RC-{String(r.numero).padStart(4, "0")}</TableCell>
                <TableCell>{format(new Date(r.dataCriacao), "dd/MM/yyyy HH:mm")}</TableCell>
                <TableCell>{r.solicitante}</TableCell>
                <TableCell>{r.centroCustoNome}</TableCell>
                <TableCell>
                  <Badge variant={r.urgencia === "Urgente" ? "destructive" : r.urgencia === "Alta" ? "default" : "secondary"}>
                    {r.urgencia}
                  </Badge>
                </TableCell>
                <TableCell>{r.itens.length}</TableCell>
                <TableCell><Badge className={statusColors[r.status]}>{r.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" title="Detalhes" onClick={() => setViewReq(r)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Histórico" onClick={() => setHistoricoReq(r)}><Clock className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
                  <Select value={centroCusto} onValueChange={setCentroCusto}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{clientesLista.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Local de Entrega</Label>
                  <Input value={localEntrega} onChange={e => setLocalEntrega(e.target.value)} placeholder="Endereço ou local de entrega" />
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
                      <Select value={itemMaterialId} onValueChange={handleMaterialSelect}>
                        <SelectTrigger><SelectValue placeholder="Selecionar (opcional)..." /></SelectTrigger>
                        <SelectContent>{materiais.map(m => <SelectItem key={m.id} value={m.id}>{m.codigo ? `${m.codigo} - ` : ""}{m.descricao}</SelectItem>)}</SelectContent>
                      </Select>
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
                  <div>
                    <Label>Observação</Label>
                    <Input value={itemObs} onChange={e => setItemObs(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
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
                    <div className="flex items-end">
                      <Button onClick={addItem} className="w-full"><Plus className="mr-2 h-4 w-4" />Adicionar</Button>
                    </div>
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
            <DialogTitle>RC-{viewReq && String(viewReq.numero).padStart(4, "0")}</DialogTitle>
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
                  <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Especificação</TableHead><TableHead>Obs</TableHead><TableHead>Qtd</TableHead><TableHead>Un</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {viewReq.itens.map(i => (
                      <TableRow key={i.id}>
                        <TableCell>{i.descricao}</TableCell>
                        <TableCell className="text-xs">{i.especificacaoTecnica || "-"}</TableCell>
                        <TableCell className="text-xs">{i.observacao || "-"}</TableCell>
                        <TableCell>{i.quantidade}</TableCell>
                        <TableCell>{i.unidadeMedida}</TableCell>
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
            <DialogTitle>Histórico - RC-{historicoReq && String(historicoReq.numero).padStart(4, "0")}</DialogTitle>
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
