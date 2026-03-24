import { useState, useMemo } from "react";
import { usePedidoCompra, PedidoCompra, StatusPedido } from "@/contexts/PedidoCompraContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<StatusPedido, string> = {
  Emitido: "bg-blue-100 text-blue-800",
  Confirmado: "bg-indigo-100 text-indigo-800",
  "Em Entrega": "bg-purple-100 text-purple-800",
  "Entregue Parcial": "bg-amber-100 text-amber-800",
  Entregue: "bg-green-100 text-green-800",
  Cancelado: "bg-red-200 text-red-900",
};

const statusFlow: StatusPedido[] = ["Emitido", "Confirmado", "Em Entrega", "Entregue Parcial", "Entregue"];

function getNextStatuses(current: StatusPedido): StatusPedido[] {
  if (current === "Cancelado" || current === "Entregue") return [];
  const idx = statusFlow.indexOf(current);
  if (idx < 0) return [];
  const next = statusFlow.slice(idx + 1);
  return [...next, "Cancelado"];
}

export default function PedidoCompraPage() {
  const { pedidos, updateStatus, cancelarPedido } = usePedidoCompra();
  const { usuarioLogado } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [viewPedido, setViewPedido] = useState<PedidoCompra | null>(null);
  const [historicoPedido, setHistoricoPedido] = useState<PedidoCompra | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusPedidoId, setStatusPedidoId] = useState("");
  const [newStatus, setNewStatus] = useState<StatusPedido | "">("");
  const [statusObs, setStatusObs] = useState("");

  const filtered = useMemo(() => {
    let list = pedidos;
    if (filterStatus !== "Todos") list = list.filter(p => p.status === filterStatus);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p => String(p.numero).includes(s) || p.fornecedorNome.toLowerCase().includes(s) || p.comprador.toLowerCase().includes(s) || String(p.requisicaoNumero).includes(s));
    }
    return list.sort((a, b) => b.numero - a.numero);
  }, [pedidos, search, filterStatus]);

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const openStatusDialog = (pedido: PedidoCompra) => {
    setStatusPedidoId(pedido.id);
    setNewStatus("");
    setStatusObs("");
    setStatusDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (!newStatus) { toast({ title: "Selecione um status", variant: "destructive" }); return; }
    if (newStatus === "Cancelado") {
      if (!statusObs.trim()) { toast({ title: "Motivo é obrigatório para cancelamento", variant: "destructive" }); return; }
      cancelarPedido(statusPedidoId, usuarioLogado?.nome || "Usuário", statusObs);
    } else {
      updateStatus(statusPedidoId, newStatus, usuarioLogado?.nome || "Usuário", statusObs);
    }
    toast({ title: `Status atualizado para: ${newStatus}` });
    setStatusDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Pedidos de Compra</h1>
      </div>

      <div className="flex gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nº, fornecedor, comprador..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
              <TableHead>Nº Pedido</TableHead>
              <TableHead>RC</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-36">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum pedido encontrado</TableCell></TableRow>
            ) : filtered.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-mono font-bold">PC-{String(p.numero).padStart(4, "0")}</TableCell>
                <TableCell className="font-mono">RC-{String(p.requisicaoNumero).padStart(4, "0")}</TableCell>
                <TableCell>{format(new Date(p.dataCriacao), "dd/MM/yyyy")}</TableCell>
                <TableCell>{p.fornecedorNome}</TableCell>
                <TableCell className="font-medium">{formatCurrency(p.valorTotal)}</TableCell>
                <TableCell>{p.prazoEntrega || "-"}</TableCell>
                <TableCell><Badge className={statusColors[p.status]}>{p.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" title="Detalhes" onClick={() => setViewPedido(p)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Histórico" onClick={() => setHistoricoPedido(p)}><Clock className="h-4 w-4" /></Button>
                    {getNextStatuses(p.status).length > 0 && (
                      <Button variant="ghost" size="icon" title="Atualizar Status" onClick={() => openStatusDialog(p)}><ArrowRight className="h-4 w-4" /></Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Detalhes */}
      <Dialog open={!!viewPedido} onOpenChange={() => setViewPedido(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>PC-{viewPedido && String(viewPedido.numero).padStart(4, "0")}</DialogTitle>
            <DialogDescription>Detalhes do pedido de compra</DialogDescription>
          </DialogHeader>
          {viewPedido && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">RC Vinculada:</span> RC-{String(viewPedido.requisicaoNumero).padStart(4, "0")}</div>
                <div><span className="text-muted-foreground">Fornecedor:</span> {viewPedido.fornecedorNome}</div>
                <div><span className="text-muted-foreground">Comprador:</span> {viewPedido.comprador}</div>
                <div><span className="text-muted-foreground">Data:</span> {format(new Date(viewPedido.dataCriacao), "dd/MM/yyyy HH:mm")}</div>
                <div><span className="text-muted-foreground">Pagamento:</span> {viewPedido.condicaoPagamento || "-"}</div>
                <div><span className="text-muted-foreground">Prazo:</span> {viewPedido.prazoEntrega || "-"}</div>
                <div><span className="text-muted-foreground">Local Entrega:</span> {viewPedido.localEntrega || "-"}</div>
                <div><span className="text-muted-foreground">Status:</span> <Badge className={statusColors[viewPedido.status]}>{viewPedido.status}</Badge></div>
              </div>

              <h3 className="font-semibold mt-4">Itens</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-20">Qtd</TableHead>
                    <TableHead className="w-16">Un</TableHead>
                    <TableHead className="w-28">Preço Unit.</TableHead>
                    <TableHead className="w-28">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewPedido.itens.map(i => (
                    <TableRow key={i.itemId}>
                      <TableCell>{i.descricao}</TableCell>
                      <TableCell>{i.quantidade}</TableCell>
                      <TableCell>{i.unidadeMedida}</TableCell>
                      <TableCell>{formatCurrency(i.precoUnitario)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(i.valorTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-right font-bold text-lg">Total: {formatCurrency(viewPedido.valorTotal)}</div>

              {viewPedido.observacoes && <div><span className="text-muted-foreground text-sm">Observações:</span><p className="text-sm">{viewPedido.observacoes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Histórico */}
      <Dialog open={!!historicoPedido} onOpenChange={() => setHistoricoPedido(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Histórico — PC-{historicoPedido && String(historicoPedido.numero).padStart(4, "0")}</DialogTitle>
            <DialogDescription>Linha do tempo do pedido</DialogDescription>
          </DialogHeader>
          {historicoPedido && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {historicoPedido.historicoStatus.map((h, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[h.status] || ""} variant="secondary">{h.status}</Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(h.dataHora), "dd/MM/yyyy HH:mm")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{h.usuario}</p>
                    {h.observacao && <p className="text-sm mt-0.5">{h.observacao}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Atualizar Status */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Status do Pedido</DialogTitle>
            <DialogDescription>Selecione o novo status e adicione observações se necessário.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Novo Status *</Label>
              <Select value={newStatus} onValueChange={v => setNewStatus(v as StatusPedido)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {getNextStatuses(pedidos.find(p => p.id === statusPedidoId)?.status || "Emitido").map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observação {newStatus === "Cancelado" ? "*" : ""}</Label>
              <Textarea value={statusObs} onChange={e => setStatusObs(e.target.value)} placeholder="Observações sobre a mudança de status..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateStatus}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
