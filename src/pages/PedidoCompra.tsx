import { useState, useMemo } from "react";
import PaginationControls, { paginate } from "@/components/PaginationControls";
import { usePedidoCompra, PedidoCompra, StatusPedido } from "@/contexts/PedidoCompraContext";
import { useRequisicaoCompras } from "@/contexts/RequisicaoComprasContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Clock, ArrowRight, CheckSquare, FileDown, Mail, MessageCircle, Send } from "lucide-react";
import { format } from "date-fns";
import { downloadPdfOrdemCompra, uploadPdfOrdemCompra } from "@/lib/gerarPdfOrdemCompra";
import { enviarWhatsApp, enviarWhatsAppComDocumento } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";

const statusColors: Record<StatusPedido, string> = {
  Emitido: "bg-blue-100 text-blue-800",
  Comprado: "bg-indigo-100 text-indigo-800",
  "Em Entrega": "bg-purple-100 text-purple-800",
  "Entregue Parcial": "bg-amber-100 text-amber-800",
  Entregue: "bg-green-100 text-green-800",
  Cancelado: "bg-red-200 text-red-900",
};

const statusFlow: StatusPedido[] = ["Emitido", "Comprado", "Em Entrega", "Entregue Parcial", "Entregue"];

function getNextStatuses(current: StatusPedido): StatusPedido[] {
  if (current === "Cancelado" || current === "Entregue") return [];
  const idx = statusFlow.indexOf(current);
  if (idx < 0) return [];
  return statusFlow.slice(idx + 1).filter(s => s !== "Entregue Parcial");
}

export default function PedidoCompraPage() {
  const { pedidos, updateStatus, cancelarPedido } = usePedidoCompra();
  const { requisicoes } = useRequisicaoCompras();
  const { clientes } = useClientes();
  const { empresa } = useEmpresa();
  const { usuarioLogado } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [pagePed, setPagePed] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewPedido, setViewPedido] = useState<PedidoCompra | null>(null);
  const [historicoPedido, setHistoricoPedido] = useState<PedidoCompra | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusPedidoIds, setStatusPedidoIds] = useState<string[]>([]);
  const [newStatus, setNewStatus] = useState<StatusPedido | "">("");
  const [statusObs, setStatusObs] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Send dialog state
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendPedido, setSendPedido] = useState<PedidoCompra | null>(null);
  const [sendMethod, setSendMethod] = useState<"email" | "whatsapp" | "">("");
  const [sendEmail, setSendEmail] = useState("");
  const [sendPhone, setSendPhone] = useState("");
  const [sending, setSending] = useState(false);

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

  const getFornecedor = (fornecedorId: string) => clientes.find(c => c.id === fornecedorId) || null;

  const handleDownloadPdf = async (pedido: PedidoCompra) => {
    await downloadPdfOrdemCompra({
      pedido,
      empresa: empresa.id ? empresa : null,
      fornecedor: getFornecedor(pedido.fornecedorId),
      autorizadoPor: usuarioLogado?.nome || "Usuário",
    });
    toast({ title: "PDF da Ordem de Compra baixado com sucesso" });
  };

  const openSendDialog = (pedido: PedidoCompra) => {
    const fornecedor = getFornecedor(pedido.fornecedorId);
    setSendPedido(pedido);
    setSendEmail(fornecedor?.email || fornecedor?.emailCompras || "");
    setSendPhone(fornecedor?.telefoneCelular || fornecedor?.telefonesWhatsapp || "");
    setSendMethod("");
    setSendDialogOpen(true);
  };

  const handleSend = async () => {
    if (!sendPedido) return;
    setSending(true);

    const pdfData = {
      pedido: sendPedido,
      empresa: empresa.id ? empresa : null,
      fornecedor: getFornecedor(sendPedido.fornecedorId),
      autorizadoPor: usuarioLogado?.nome || "Usuário",
    };

    try {
      // Upload PDF to storage and get public URL
      const pdfUrl = await uploadPdfOrdemCompra(pdfData);
      const pcNum = `PC-${String(sendPedido.numero).padStart(4, "0")}`;

      if (sendMethod === "email") {
        if (!sendEmail.trim()) {
          toast({ title: "Informe o e-mail do fornecedor", variant: "destructive" });
          setSending(false);
          return;
        }
        const nomeEmpresa = empresa.nomeFantasia || empresa.razaoSocial || "SGM";

        const { error } = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "ordem-compra-confirmation",
            recipientEmail: sendEmail,
            idempotencyKey: `ordem-compra-${sendPedido.id}-${Date.now()}`,
            templateData: {
              fornecedorNome: sendPedido.fornecedorNome,
              pedidoNumero: sendPedido.numero,
              valorTotal: formatCurrency(sendPedido.valorTotal),
              condicaoPagamento: sendPedido.condicaoPagamento || "A vista",
              prazoEntrega: sendPedido.prazoEntrega || "A combinar",
              comprador: usuarioLogado?.nome || "Departamento de Compras",
              nomeEmpresa,
              pdfUrl,
            },
          },
        });

        if (error) throw new Error(error.message);
        toast({ title: `Ordem de compra enviada por e-mail para ${sendEmail}` });
      } else if (sendMethod === "whatsapp") {
        if (!sendPhone.trim()) {
          toast({ title: "Informe o telefone do fornecedor", variant: "destructive" });
          setSending(false);
          return;
        }

        const mensagem = `*Ordem de Compra ${pcNum}*\n\n` +
          `Fornecedor: ${sendPedido.fornecedorNome}\n` +
          `Valor Total: ${formatCurrency(sendPedido.valorTotal)}\n` +
          `Prazo de Entrega: ${sendPedido.prazoEntrega || "A combinar"}\n` +
          `Condição de Pagamento: ${sendPedido.condicaoPagamento || "A vista"}`;

        const result = await enviarWhatsAppComDocumento({
          telefone: sendPhone,
          mensagem,
          documentUrl: pdfUrl,
          documentFilename: `Ordem_Compra_${pcNum}.pdf`,
        });
        if (!result.success) throw new Error(result.error || "Erro ao enviar WhatsApp");
        toast({ title: `Ordem de compra enviada via WhatsApp para ${sendPhone}` });
      }
      setSendDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast({ title: `Erro ao enviar: ${msg}`, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const openStatusDialog = (pedidoOrIds: PedidoCompra | string[]) => {
    const ids = Array.isArray(pedidoOrIds) ? pedidoOrIds : [pedidoOrIds.id];
    setStatusPedidoIds(ids);
    setNewStatus("");
    setStatusObs("");
    setStatusDialogOpen(true);
  };

  const commonNextStatuses = useMemo(() => {
    if (statusPedidoIds.length === 0) return [];
    const sets = statusPedidoIds.map(id => {
      const p = pedidos.find(x => x.id === id);
      return p ? getNextStatuses(p.status) : [];
    });
    const first = new Set(sets[0] || []);
    for (let i = 1; i < sets.length; i++) {
      const s = new Set(sets[i]);
      first.forEach(v => { if (!s.has(v)) first.delete(v); });
    }
    return Array.from(first);
  }, [statusPedidoIds, pedidos]);

  const handleUpdateStatus = () => {
    if (!newStatus) { toast({ title: "Selecione um status", variant: "destructive" }); return; }
    if (newStatus === "Cancelado") {
      if (!statusObs.trim()) { toast({ title: "Motivo é obrigatório para cancelamento", variant: "destructive" }); return; }
      statusPedidoIds.forEach(id => cancelarPedido(id, usuarioLogado?.nome || "Usuário", statusObs));
    } else {
      statusPedidoIds.forEach(id => updateStatus(id, newStatus, usuarioLogado?.nome || "Usuário", statusObs));
    }
    toast({ title: `Status atualizado para: ${newStatus} (${statusPedidoIds.length} pedido${statusPedidoIds.length > 1 ? "s" : ""})` });
    setStatusDialogOpen(false);
    setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectableFiltered = filtered.filter(p => getNextStatuses(p.status).length > 0);
  const allSelectableSelected = selectableFiltered.length > 0 && selectableFiltered.every(p => selectedIds.includes(p.id));
  const toggleSelectAll = () => {
    if (allSelectableSelected) setSelectedIds([]);
    else setSelectedIds(selectableFiltered.map(p => p.id));
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

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
          <CheckSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{selectedIds.length} pedido{selectedIds.length > 1 ? "s" : ""} selecionado{selectedIds.length > 1 ? "s" : ""}</span>
          <Button size="sm" onClick={() => openStatusDialog(selectedIds)}>
            <ArrowRight className="h-4 w-4 mr-1" /> Atualizar Status em Lote
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Limpar Seleção</Button>
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelectableSelected && selectableFiltered.length > 0} onCheckedChange={toggleSelectAll} />
              </TableHead>
              <TableHead>Nº Pedido</TableHead>
              <TableHead>Centro de Custo</TableHead>
              <TableHead>RC</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-48">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Nenhum pedido encontrado</TableCell></TableRow>
            ) : paginate(filtered, pagePed, pageSize).paginated.map(p => {
              const rcVinculada = requisicoes.find(r => r.id === p.requisicaoId);
              const canUpdate = getNextStatuses(p.status).length > 0;
              return (
                <TableRow key={p.id} className={selectedIds.includes(p.id) ? "bg-primary/5" : ""}>
                  <TableCell>
                    {canUpdate ? (
                      <Checkbox checked={selectedIds.includes(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                    ) : <div className="w-4" />}
                  </TableCell>
                  <TableCell className="font-mono font-bold">PC-{String(p.numero).padStart(4, "0")}</TableCell>
                  <TableCell className="text-sm">{rcVinculada?.centroCustoNome || "-"}</TableCell>
                  <TableCell className="font-mono">RCS-{String(p.requisicaoNumero).padStart(4, "0")}</TableCell>
                  <TableCell>{format(new Date(p.dataCriacao), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{p.fornecedorNome}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(p.valorTotal)}</TableCell>
                  <TableCell>{p.prazoEntrega || "-"}</TableCell>
                  <TableCell><Badge className={statusColors[p.status]}>{p.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Detalhes" onClick={() => setViewPedido(p)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="Histórico" onClick={() => setHistoricoPedido(p)}><Clock className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="Baixar PDF" onClick={() => handleDownloadPdf(p)}><FileDown className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="Enviar ao Fornecedor" onClick={() => openSendDialog(p)}><Send className="h-4 w-4" /></Button>
                      {canUpdate && (
                        <Button variant="ghost" size="icon" title="Atualizar Status" onClick={() => openStatusDialog(p)}><ArrowRight className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <PaginationControls currentPage={pagePed} totalItems={filtered.length} onPageChange={setPagePed} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setPagePed(1); }} />

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
                <div><span className="text-muted-foreground">RCS Vinculada:</span> RCS-{String(viewPedido.requisicaoNumero).padStart(4, "0")}</div>
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

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => handleDownloadPdf(viewPedido)} variant="outline">
                  <FileDown className="h-4 w-4 mr-2" /> Baixar PDF
                </Button>
                <Button onClick={() => { setViewPedido(null); openSendDialog(viewPedido); }}>
                  <Send className="h-4 w-4 mr-2" /> Enviar ao Fornecedor
                </Button>
              </div>
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
            <DialogTitle>Atualizar Status {statusPedidoIds.length > 1 ? `(${statusPedidoIds.length} pedidos)` : "do Pedido"}</DialogTitle>
            <DialogDescription>Selecione o novo status e adicione observações se necessário.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Novo Status *</Label>
              <Select value={newStatus} onValueChange={v => setNewStatus(v as StatusPedido)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {commonNextStatuses.map(s => (
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

      {/* Dialog Enviar Ordem de Compra */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Ordem de Compra</DialogTitle>
            <DialogDescription>
              {sendPedido && `PC-${String(sendPedido.numero).padStart(4, "0")} — ${sendPedido.fornecedorNome}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Método de Envio *</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Button
                  variant={sendMethod === "email" ? "default" : "outline"}
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setSendMethod("email")}
                >
                  <Mail className="h-6 w-6" />
                  <span>E-mail</span>
                </Button>
                <Button
                  variant={sendMethod === "whatsapp" ? "default" : "outline"}
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setSendMethod("whatsapp")}
                >
                  <MessageCircle className="h-6 w-6" />
                  <span>WhatsApp</span>
                </Button>
              </div>
            </div>

            {sendMethod === "email" && (
              <div>
                <Label>E-mail do Fornecedor *</Label>
                <Input
                  type="email"
                  value={sendEmail}
                  onChange={e => setSendEmail(e.target.value)}
                  placeholder="fornecedor@email.com"
                />
              </div>
            )}

            {sendMethod === "whatsapp" && (
              <div>
                <Label>Telefone WhatsApp do Fornecedor *</Label>
                <Input
                  value={sendPhone}
                  onChange={e => setSendPhone(e.target.value)}
                  placeholder="+55 21 99999-9999"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  O PDF será baixado automaticamente para você anexar na conversa.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSend} disabled={!sendMethod || sending}>
              {sending ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
