import { useState, useMemo } from "react";
import { comprimirArquivo, lerArquivoBase64 } from "@/lib/compressFile";
import { loadPersistedFilters, usePersistFilters } from "@/lib/persistedFilters";
import PaginationControls, { paginate } from "@/components/PaginationControls";
import { matchNumero } from "@/lib/matchNumero";
import { usePedidoCompra, PedidoCompra } from "@/contexts/PedidoCompraContext";
import { useRecebimento, Recebimento, ItemRecebimento, AnexoNF } from "@/contexts/RecebimentoContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRequisicaoCompras } from "@/contexts/RequisicaoComprasContext";
import { useClientes } from "@/contexts/ClientesContext";
import { notificarCompras, formatarPrioridade, formatarDataHora, formatarData, formatarPedido } from "@/lib/notificacoesCompras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Search, PackageCheck, Eye, ClipboardList, MoreHorizontal, History, Paperclip, FileText, X, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { gerarPdfFinanceiro, gerarExcelFinanceiro, FinReport } from "@/lib/gerarRelatoriosFinanceiros";
import { useColumnOrder } from "@/hooks/useColumnOrder";
import { SortableHeaderRow, SortableTableHead } from "@/components/SortableTableHead";
import type { ReactNode } from "react";
import { usePermissao } from "@/hooks/usePermissao";
import { verificarSenhaUsuario } from "@/lib/verifySenha";
import { supabase } from "@/integrations/supabase/client";
import { Ban } from "lucide-react";

const statusColors: Record<string, string> = {
  Emitido: "bg-blue-100 text-blue-800",
  Comprado: "bg-indigo-100 text-indigo-800",
  "Em Entrega": "bg-purple-100 text-purple-800",
  "Entregue Parcial": "bg-amber-100 text-amber-800",
  Entregue: "bg-green-100 text-green-800",
  "Recebimento Rejeitado": "bg-red-100 text-red-800",
  "Rejeição Parcial": "bg-orange-100 text-orange-800",
  Cancelado: "bg-red-200 text-red-900",
};

export default function RecebimentoComprasPage() {
  const { pedidos, updateStatus: updatePedidoStatus } = usePedidoCompra();
  const { recebimentos, registrarRecebimento, getRecebimentosByPedido, getTotalRecebidoPorItem } = useRecebimento();
  const { usuarioLogado } = useAuth();
  const { requisicoes } = useRequisicaoCompras();
  const { clientes } = useClientes();
  const { tem } = usePermissao();
  const podeRegistrar = tem("recebimento.registrar");
  const { toast } = useToast();

  const _recSavedFilters = loadPersistedFilters<{ search: string; filterStatus: string; }>("recebimento_compras_filters_v1");
  const [search, setSearch] = useState(_recSavedFilters?.search ?? "");
  const [filterStatus, setFilterStatus] = useState(_recSavedFilters?.filterStatus ?? "Pendentes");
  usePersistFilters("recebimento_compras_filters_v1", { search, filterStatus });
  const [pageRec, setPageRec] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const colDefs: Record<string, { label: string; className?: string }> = {
    numero: { label: "Nº Pedido", className: "text-center" },
    rc: { label: "RC", className: "text-center" },
    fornecedor: { label: "Fornecedor" },
    localEntrega: { label: "Local Entrega" },
    valor: { label: "Valor", className: "text-center" },
    status: { label: "Status", className: "text-center" },
    progresso: { label: "Progresso", className: "text-center" },
  };
  const { order: colOrder, setOrder: setColOrder } = useColumnOrder(
    "compras.recebimento",
    ["numero", "rc", "fornecedor", "localEntrega", "valor", "status", "progresso"]
  );

  // Recebimento dialog
  const [recDialogOpen, setRecDialogOpen] = useState(false);
  const [recPedido, setRecPedido] = useState<PedidoCompra | null>(null);
  const [recItens, setRecItens] = useState<ItemRecebimento[]>([]);
  const [recNotaFiscal, setRecNotaFiscal] = useState("");
  const [recObservacao, setRecObservacao] = useState("");
  const [recAnexos, setRecAnexos] = useState<AnexoNF[]>([]);

  // View dialog
  const [viewPedido, setViewPedido] = useState<PedidoCompra | null>(null);
  const [rejPedido, setRejPedido] = useState<PedidoCompra | null>(null);
  const [rejJust, setRejJust] = useState("");
  const [rejSenha, setRejSenha] = useState("");
  const [rejLoading, setRejLoading] = useState(false);

  const [rejQtd, setRejQtd] = useState<Record<string, string>>({});
  const [rejExpandido, setRejExpandido] = useState(false);
  const qtdJaRejeitada = (p: PedidoCompra, itemId: string) =>
    (p.itensRejeitados ?? []).filter(r => r.itemId === itemId).reduce((a, r) => a + r.quantidade, 0);
  const qtdRejeitavel = (p: PedidoCompra, itemId: string, qtd: number) => Math.max(0, qtd - qtdJaRejeitada(p, itemId));
  const abrirRejeicao = (p: PedidoCompra) => { setRejPedido(p); setRejJust(""); setRejSenha(""); setRejQtd({}); };
  const valorRejeicao = rejPedido
    ? rejPedido.itens.reduce((a, i) => a + (Number((rejQtd[i.itemId] || "0").replace(",", ".")) || 0) * i.precoUnitario, 0)
    : 0;

  const confirmarRejeicao = async () => {
    if (!rejPedido) return;
    const itens = rejPedido.itens
      .map(i => ({ i, q: Number((rejQtd[i.itemId] || "0").replace(",", ".")) || 0 }))
      .filter(x => x.q > 0);
    if (itens.length === 0) { toast({ title: "Informe a quantidade rejeitada de pelo menos um item.", variant: "destructive" }); return; }
    const excedido = itens.find(x => x.q > qtdRejeitavel(rejPedido, x.i.itemId, x.i.quantidade) + 1e-9);
    if (excedido) { toast({ title: `Quantidade maior que a disponível: ${excedido.i.descricao}`, variant: "destructive" }); return; }
    if (rejJust.trim().length < 10) { toast({ title: "Informe a justificativa (mínimo 10 caracteres).", variant: "destructive" }); return; }
    if (!rejSenha) { toast({ title: "Confirme sua senha.", variant: "destructive" }); return; }
    if (!usuarioLogado?.email) { toast({ title: "Usuário não identificado.", variant: "destructive" }); return; }
    setRejLoading(true);
    try {
      const ok = await verificarSenhaUsuario(usuarioLogado.email, rejSenha);
      if (!ok) { toast({ title: "Senha incorreta.", variant: "destructive" }); return; }
      const nome = usuarioLogado.nome || usuarioLogado.email;
      const agora = new Date();
      const quando = format(agora, "dd/MM/yyyy, HH:mm");
      const oc = `OC-${String(rejPedido.numero).padStart(4, "0")}`;
      const novos = itens.map(({ i, q }) => ({
        itemId: i.itemId, descricao: i.descricao, quantidade: q, unidadeMedida: i.unidadeMedida,
        precoUnitario: i.precoUnitario, valor: +(q * i.precoUnitario).toFixed(2),
        motivo: rejJust.trim(), usuario: nome, dataHora: agora.toISOString(),
      }));
      const valorRej = +novos.reduce((a, n) => a + n.valor, 0).toFixed(2);
      const total = rejPedido.itens.every(i => qtdRejeitavel(rejPedido, i.itemId, i.quantidade) - (novos.find(n => n.itemId === i.itemId)?.quantidade || 0) <= 1e-9);
      const resumo = novos.map(n => `${n.descricao}: ${n.quantidade} ${n.unidadeMedida}`).join("; ");
      await updatePedidoStatus(
        rejPedido.id,
        total ? "Recebimento Rejeitado" : "Rejeição Parcial",
        nome,
        `${total ? "Recebimento rejeitado" : "Rejeição parcial"} (R$ ${valorRej.toFixed(2).replace(".", ",")}) — ${resumo}. Motivo: ${rejJust.trim()}`,
        novos,
      );

      const obs = `NÃO PAGAR — ${total ? "Recebimento" : "Itens"} do pedido ${oc} rejeitado(s) por ${nome} em ${quando}. Itens: ${resumo}. Motivo: ${rejJust.trim()}`;
      const { data: contas } = await supabase.from("fin_contas_pagar").select("*").eq("pedido_compra_id", rejPedido.id);
      const abertas = (contas || []).filter((c: any) => c.status !== "paga" && c.status !== "cancelada" && c.status !== "bloqueada");
      const saldo = (c: any) => Math.max(0, Number(c.valor_total) - Number(c.valor_pago || 0));
      const totalAberto = abertas.reduce((a: number, c: any) => a + saldo(c), 0);
      let bloqueado = 0;
      if (total || valorRej >= totalAberto - 0.01) {
        for (const c of abertas) {
          await supabase.from("fin_contas_pagar").update({ status: "bloqueada", observacao: obs }).eq("id", c.id);
        }
        bloqueado = totalAberto;
      } else if (totalAberto > 0) {
        // Separa o valor rejeitado em contas bloqueadas, proporcionalmente ao saldo de cada parcela
        let restante = valorRej;
        for (let k = 0; k < abertas.length; k++) {
          const c: any = abertas[k];
          const parte = k === abertas.length - 1 ? restante : +(valorRej * saldo(c) / totalAberto).toFixed(2);
          restante = +(restante - parte).toFixed(2);
          if (parte <= 0) continue;
          await supabase.from("fin_contas_pagar").update({ valor_total: +(Number(c.valor_total) - parte).toFixed(2) }).eq("id", c.id);
          const { id, created_at, updated_at, ...rest } = c;
          await supabase.from("fin_contas_pagar").insert({
            ...rest, valor_total: parte, valor_pago: 0, data_pagamento: null, status: "bloqueada",
            descricao: `[REJEITADO] ${c.descricao || oc}`, observacao: obs, origem: "rejeicao_recebimento",
          });
          bloqueado += parte;
        }
      }
      const faltou = +(valorRej - bloqueado).toFixed(2);
      toast({
        title: total ? "Recebimento rejeitado" : "Rejeição parcial registrada",
        description: `R$ ${bloqueado.toFixed(2).replace(".", ",")} bloqueado(s) no Financeiro.${faltou > 0.01 ? ` Atenção: R$ ${faltou.toFixed(2).replace(".", ",")} já estava pago — avise o Financeiro.` : ""}`,
      });
      setRejPedido(null);
    } catch (e: any) {
      toast({ title: "Erro ao rejeitar", description: e?.message, variant: "destructive" });
    } finally {
      setRejLoading(false);
    }
  };

  // Histórico dialog
  const [histPedidoId, setHistPedidoId] = useState<string | null>(null);

  const pedidoTemItensPendentes = (p: PedidoCompra) => {
    return p.itens.some(pi => {
      const recebido = getTotalRecebidoPorItem(p.id, pi.itemId);
      return recebido < pi.quantidade;
    });
  };

  const pedidosRecebimento = useMemo(() => {
    // Pedidos que podem receber: status ativo OU "Entregue" com itens ainda pendentes
    return pedidos.filter(p =>
      ["Comprado", "Em Entrega", "Entregue Parcial", "Rejeição Parcial"].includes(p.status) ||
      (p.status === "Entregue" && pedidoTemItensPendentes(p))
    );
  }, [pedidos, recebimentos]);

  const filtered = useMemo(() => {
    let list = filterStatus === "Pendentes"
      ? pedidos.filter(p => ["Comprado", "Em Entrega", "Entregue Parcial", "Rejeição Parcial"].includes(p.status) || (p.status === "Entregue" && pedidoTemItensPendentes(p)))
      : filterStatus === "Recebidos"
        ? pedidos.filter(p => p.status === "Entregue" && !pedidoTemItensPendentes(p))
        : pedidos.filter(p => p.status !== "Cancelado");

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p =>
        matchNumero(p.numero, s) ||
        p.fornecedorNome.toLowerCase().includes(s) ||
        matchNumero(p.requisicaoNumero, s) ||
        p.localEntrega?.toLowerCase().includes(s)
      );
    }

    return list.sort((a, b) => b.numero - a.numero);
  }, [pedidos, search, filterStatus]);

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const abrirAnexo = async (a: AnexoNF) => {
    try {
      const blob = await (await fetch(a.dados)).blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      toast({ title: "Não foi possível abrir o anexo", variant: "destructive" });
    }
  };

  const openRecebimentoDialog = (pedido: PedidoCompra) => {
    setRecPedido(pedido);
    setRecItens(
      pedido.itens.map(i => {
        const jaRecebido = getTotalRecebidoPorItem(pedido.id, i.itemId);
        const restante = Math.max(0, i.quantidade - jaRecebido);
        return {
          itemId: i.itemId,
          descricao: i.descricao,
          quantidadePedida: i.quantidade,
          quantidadeRecebida: restante,
          unidadeMedida: i.unidadeMedida,
          observacao: "",
        };
      })
    );
    setRecNotaFiscal("");
    setRecObservacao("");
    setRecAnexos([]);
    setRecDialogOpen(true);
  };

  const handleRegistrarRecebimento = () => {
    if (!podeRegistrar) { toast({ title: "Você não possui permissão para esta ação.", variant: "destructive" }); return; }
    if (!recPedido) return;
    const temRecebimento = recItens.some(i => i.quantidadeRecebida > 0);
    if (!temRecebimento) {
      toast({ title: "Informe a quantidade recebida de pelo menos um item", variant: "destructive" });
      return;
    }

    // Validate quantities
    for (const item of recItens) {
      const jaRecebido = getTotalRecebidoPorItem(recPedido.id, item.itemId);
      if (item.quantidadeRecebida + jaRecebido > item.quantidadePedida) {
        toast({ title: `Quantidade excede o pedido para: ${item.descricao}`, variant: "destructive" });
        return;
      }
    }

    registrarRecebimento({
      pedidoId: recPedido.id,
      pedidoNumero: recPedido.numero,
      requisicaoId: recPedido.requisicaoId,
      requisicaoNumero: recPedido.requisicaoNumero,
      fornecedorNome: recPedido.fornecedorNome,
      localEntrega: recPedido.localEntrega,
      usuario: usuarioLogado?.nome || "Almoxarife",
      itens: recItens.filter(i => i.quantidadeRecebida > 0),
      observacaoGeral: recObservacao,
      notaFiscal: recNotaFiscal,
      anexosNF: recAnexos,
    });

    // Notifica cliente via WhatsApp
    try {
      const req = requisicoes.find(r => r.id === recPedido.requisicaoId);
      const cli = req ? clientes.find(c => c.id === req.centroCusto) : undefined;
      if (req && cli?.grupoWhatsapp) {
        const totalPedido = recPedido.itens.reduce((s, i) => s + i.quantidade, 0);
        const totalRecebidoAcum = recPedido.itens.reduce(
          (s, i) => s + getTotalRecebidoPorItem(recPedido.id, i.itemId), 0
        );
        const totalAtual = recItens.reduce((s, i) => s + i.quantidadeRecebida, 0);
        const ehTotal = (totalRecebidoAcum + totalAtual) >= totalPedido;
        const label = ehTotal ? "RECEBIDO" : "RECEBIDO PARCIAL";
        notificarCompras({
          jid: cli.grupoWhatsapp,
          clienteNome: cli.nome,
          pedido: formatarPedido(req.numero, req.dataCriacao),
          statusLabel: label,
          dataSolicitacao: formatarDataHora(req.dataCriacao),
          dataExtraLabel: "Data do recebimento",
          dataExtraValor: formatarDataHora(new Date().toISOString()),
          solicitante: req.solicitante,
          prioridade: formatarPrioridade(req.urgencia),
          obs: recObservacao || (recNotaFiscal ? `NF: ${recNotaFiscal}` : req.justificativa),
        });
      }
    } catch (e) { console.error("[Recebimento] WhatsApp falhou:", e); }

    toast({ title: "Recebimento registrado com sucesso!" });
    setRecDialogOpen(false);
  };

  const recebimentosDoPedido = histPedidoId ? getRecebimentosByPedido(histPedidoId) : [];

  // ===== Relatórios =====
  const buildRelRecebimentos = (): FinReport => ({
    titulo: "Recebimentos Realizados",
    subtitulo: "SGM Lasant — Recebimento de Materiais",
    filtros: `Busca: ${search || "-"} | Status: ${filterStatus}`,
    colunas: ["Data", "Pedido", "RC", "Fornecedor", "Local Entrega", "NF", "Tipo", "Itens", "Recebido por"],
    linhas: recebimentos
      .slice()
      .sort((a, b) => new Date(b.dataRecebimento).getTime() - new Date(a.dataRecebimento).getTime())
      .map(r => [
        format(new Date(r.dataRecebimento), "dd/MM/yyyy HH:mm"),
        `OC-${String(r.pedidoNumero).padStart(4, "0")}`,
        `RCS-${String(r.requisicaoNumero).padStart(4, "0")}`,
        r.fornecedorNome,
        r.localEntrega || "-",
        r.notaFiscal || "-",
        r.tipo,
        r.itens.reduce((s, i) => s + i.quantidadeRecebida, 0),
        r.usuario,
      ]),
    totais: [
      { label: "Total de recebimentos", valor: String(recebimentos.length) },
      { label: "Itens recebidos", valor: String(recebimentos.reduce((s, r) => s + r.itens.reduce((x, i) => x + i.quantidadeRecebida, 0), 0)) },
    ],
  });

  const buildRelPendencias = (): FinReport => {
    const pendentes = pedidos.filter(p => ["Comprado", "Em Entrega", "Entregue Parcial", "Rejeição Parcial"].includes(p.status) || (p.status === "Entregue" && pedidoTemItensPendentes(p)));
    return {
      titulo: "Pedidos Pendentes de Recebimento",
      subtitulo: "SGM Lasant — Recebimento de Materiais",
      colunas: ["Pedido", "RC", "Fornecedor", "Local Entrega", "Status", "Itens Pendentes", "Valor"],
      linhas: pendentes.sort((a, b) => b.numero - a.numero).map(p => {
        const itensPend = p.itens.filter(i => getTotalRecebidoPorItem(p.id, i.itemId) < i.quantidade).length;
        return [
          `OC-${String(p.numero).padStart(4, "0")}`,
          `RCS-${String(p.requisicaoNumero).padStart(4, "0")}`,
          p.fornecedorNome,
          p.localEntrega || "-",
          p.status,
          `${itensPend}/${p.itens.length}`,
          formatCurrency(p.valorTotal),
        ];
      }),
      totais: [
        { label: "Pedidos pendentes", valor: String(pendentes.length) },
        { label: "Valor total", valor: formatCurrency(pendentes.reduce((s, p) => s + (p.valorTotal || 0), 0)) },
      ],
    };
  };

  const buildRelFornecedor = (): FinReport => {
    const map = new Map<string, { recebimentos: number; itens: number; pedidos: Set<string> }>();
    recebimentos.forEach(r => {
      const k = r.fornecedorNome || "Sem fornecedor";
      const cur = map.get(k) || { recebimentos: 0, itens: 0, pedidos: new Set<string>() };
      cur.recebimentos += 1;
      cur.itens += r.itens.reduce((s, i) => s + i.quantidadeRecebida, 0);
      cur.pedidos.add(r.pedidoId);
      map.set(k, cur);
    });
    const rows = Array.from(map.entries()).sort((a, b) => b[1].itens - a[1].itens);
    return {
      titulo: "Recebimentos por Fornecedor",
      subtitulo: "SGM Lasant — Recebimento de Materiais",
      colunas: ["Fornecedor", "Pedidos", "Recebimentos", "Itens Recebidos"],
      linhas: rows.map(([f, v]) => [f, v.pedidos.size, v.recebimentos, v.itens]),
      totais: [
        { label: "Fornecedores", valor: String(rows.length) },
        { label: "Itens recebidos", valor: String(rows.reduce((s, [, v]) => s + v.itens, 0)) },
      ],
    };
  };

  const exportarRelatorio = async (tipo: "recebimentos" | "pendencias" | "fornecedor", formato: "pdf" | "excel") => {
    const rel = tipo === "recebimentos" ? buildRelRecebimentos() : tipo === "pendencias" ? buildRelPendencias() : buildRelFornecedor();
    if (rel.linhas.length === 0) { toast({ title: "Sem dados para exportar", variant: "destructive" }); return; }
    if (formato === "pdf") await gerarPdfFinanceiro(rel, rel.colunas.length > 6 ? "landscape" : "portrait");
    else await gerarExcelFinanceiro(rel);
  };

  // Stats
  const totalPendentes = pedidos.filter(p => ["Comprado", "Em Entrega", "Entregue Parcial", "Rejeição Parcial"].includes(p.status)).length;
  const totalRecebidosHoje = recebimentos.filter(r => {
    const hoje = new Date().toDateString();
    return new Date(r.dataRecebimento).toDateString() === hoje;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Recebimento de Materiais</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPendentes}</div>
            <p className="text-xs text-muted-foreground">aguardando recebimento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recebimentos Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecebidosHoje}</div>
            <p className="text-xs text-muted-foreground">registros no dia</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Recebimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recebimentos.length}</div>
            <p className="text-xs text-muted-foreground">registros totais</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nº pedido, fornecedor, RC, local..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Pendentes">Pendentes de Recebimento</SelectItem>
            <SelectItem value="Recebidos">Já Recebidos</SelectItem>
            <SelectItem value="Todos">Todos</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline"><Download className="mr-2 h-4 w-4" />Relatórios</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => exportarRelatorio("recebimentos", "pdf")}>Recebimentos Realizados (PDF)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportarRelatorio("recebimentos", "excel")}>Recebimentos Realizados (Excel)</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => exportarRelatorio("pendencias", "pdf")}>Pedidos Pendentes (PDF)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportarRelatorio("pendencias", "excel")}>Pedidos Pendentes (Excel)</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => exportarRelatorio("fornecedor", "pdf")}>Recebimentos por Fornecedor (PDF)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportarRelatorio("fornecedor", "excel")}>Recebimentos por Fornecedor (Excel)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} pedido{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Table */}
      <div className="border rounded-lg">
        <SortableHeaderRow order={colOrder} onReorder={setColOrder}>
        <Table>
          <TableHeader>
            <TableRow>
              {colOrder.map(key => {
                const cd = colDefs[key];
                return cd ? <SortableTableHead key={key} id={key} className={cd.className}>{cd.label}</SortableTableHead> : null;
              })}
              <TableHead className="w-16 text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={colOrder.length + 1} className="text-center text-muted-foreground py-8">Nenhum pedido encontrado</TableCell></TableRow>
            ) : paginate(filtered, pageRec, pageSize).paginated.map((p, idx) => {
              const recsPedido = getRecebimentosByPedido(p.id);
              const totalItens = p.itens.length;
              const itensCompletos = p.itens.filter(i => {
                const recebido = getTotalRecebidoPorItem(p.id, i.itemId);
                return recebido >= i.quantidade;
              }).length;
              const cellMap: Record<string, ReactNode> = {
                numero: <span className="font-mono font-bold">OC-{String(p.numero).padStart(4, "0")}</span>,
                rc: <span className="font-mono">RCS-{String(p.requisicaoNumero).padStart(4, "0")}</span>,
                fornecedor: p.fornecedorNome,
                localEntrega: <span className="text-sm">{p.localEntrega || "-"}</span>,
                valor: <span className="font-medium">{formatCurrency(p.valorTotal)}</span>,
                status: <Badge className={statusColors[p.status] || ""}>{p.status}</Badge>,
                progresso: (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${totalItens > 0 ? (itensCompletos / totalItens) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{itensCompletos}/{totalItens}</span>
                  </div>
                ),
              };
              return (
                <TableRow key={p.id} className={idx % 2 === 1 ? "bg-gray-200/60 hover:bg-gray-200/80" : "bg-white hover:bg-gray-100/60"}>
                  {colOrder.map(key => <TableCell key={key} className={colDefs[key]?.className}>{cellMap[key]}</TableCell>)}
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewPedido(p)}>
                          <Eye className="mr-2 h-4 w-4" />Detalhes do Pedido
                        </DropdownMenuItem>
                        {recsPedido.length > 0 && (
                          <DropdownMenuItem onClick={() => setHistPedidoId(p.id)}>
                            <History className="mr-2 h-4 w-4" />Histórico de Recebimentos
                          </DropdownMenuItem>
                        )}
                        {podeRegistrar && (["Comprado", "Em Entrega", "Entregue Parcial", "Rejeição Parcial"].includes(p.status) || (p.status === "Entregue" && pedidoTemItensPendentes(p))) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openRecebimentoDialog(p)}>
                              <PackageCheck className="mr-2 h-4 w-4" />Registrar Recebimento
                            </DropdownMenuItem>
                          </>
                        )}
                        {podeRegistrar && ["Comprado", "Em Entrega", "Entregue Parcial", "Entregue", "Rejeição Parcial"].includes(p.status) && (
                          <DropdownMenuItem className="text-destructive" onClick={() => abrirRejeicao(p)}>
                            <Ban className="mr-2 h-4 w-4" />Rejeitar Itens / Recebimento
                          </DropdownMenuItem>
                        )}
                        {p.status === "Entregue" && pedidoTemItensPendentes(p) && (
                          <DropdownMenuItem onClick={() => {
                            updatePedidoStatus(p.id, "Entregue Parcial", usuarioLogado?.nome || "Sistema", "Status corrigido - itens pendentes de recebimento");
                            toast({ title: "Status corrigido para 'Entregue Parcial'" });
                          }}>
                            <ClipboardList className="mr-2 h-4 w-4" />Corrigir Status (Entregue Parcial)
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </SortableHeaderRow>
      </div>
      <PaginationControls currentPage={pageRec} totalItems={filtered.length} onPageChange={setPageRec} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setPageRec(1); }} />

      {/* Dialog Registrar Recebimento */}
      <Dialog open={recDialogOpen} onOpenChange={setRecDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Recebimento — OC-{recPedido && String(recPedido.numero).padStart(4, "0")}</DialogTitle>
            <DialogDescription>
              Fornecedor: {recPedido?.fornecedorNome} | Local: {recPedido?.localEntrega || "-"}
            </DialogDescription>
          </DialogHeader>
          {recPedido && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nota Fiscal</Label>
                  <Input value={recNotaFiscal} onChange={e => setRecNotaFiscal(e.target.value)} placeholder="Nº da nota fiscal..." />
                </div>
                <div>
                  <Label>Recebido por</Label>
                  <Input value={usuarioLogado?.nome || "Almoxarife"} readOnly className="bg-muted" />
                </div>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="w-16">Un.</TableHead>
                        <TableHead className="w-24 text-right">Pedido</TableHead>
                        <TableHead className="w-24 text-right">Já Recebido</TableHead>
                        <TableHead className="w-24 text-right">Restante</TableHead>
                        <TableHead className="w-32">Recebendo</TableHead>
                        <TableHead className="min-w-[200px]">Obs. Item</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recItens.map((item, idx) => {
                        const jaRecebido = getTotalRecebidoPorItem(recPedido.id, item.itemId);
                        const restante = Math.max(0, item.quantidadePedida - jaRecebido);
                        const isCompleto = jaRecebido >= item.quantidadePedida;

                        return (
                          <TableRow key={item.itemId} className={isCompleto ? "opacity-50" : ""}>
                            <TableCell className="text-sm font-medium">{item.descricao}</TableCell>
                            <TableCell className="text-sm">{item.unidadeMedida}</TableCell>
                            <TableCell className="text-right text-sm">{item.quantidadePedida}</TableCell>
                            <TableCell className="text-right text-sm">{jaRecebido}</TableCell>
                            <TableCell className="text-right text-sm font-medium">{restante}</TableCell>
                            <TableCell>
                              {isCompleto ? (
                                <Badge variant="secondary" className="text-xs">Completo</Badge>
                              ) : (
                                <Input
                                  type="number"
                                  min="0"
                                  max={restante}
                                  value={item.quantidadeRecebida || ""}
                                  onChange={e => {
                                    const val = Math.min(Number(e.target.value), restante);
                                    setRecItens(prev => prev.map((it, i) => i === idx ? { ...it, quantidadeRecebida: val } : it));
                                  }}
                                  className="h-8 w-20"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {!isCompleto && (
                                <Textarea
                                  value={item.observacao}
                                  onChange={e => setRecItens(prev => prev.map((it, i) => i === idx ? { ...it, observacao: e.target.value } : it))}
                                  placeholder="Divergência..."
                                  className="text-xs min-h-[32px] resize-y"
                                  rows={1}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Anexo NF */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Paperclip className="h-4 w-4" />Anexar Nota Fiscal (PDF, Imagem)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    multiple
                    className="flex-1"
                    onChange={e => {
                      const files = e.target.files;
                      if (!files) return;
                      Array.from(files).forEach(async file => {
                        const comp = await comprimirArquivo(file);
                        if (comp.size > 2 * 1024 * 1024) {
                          toast({ title: `Arquivo "${file.name}" excede 2MB`, variant: "destructive" });
                          return;
                        }
                        const dados = await lerArquivoBase64(comp);
                        setRecAnexos(prev => [...prev, { nome: comp.name, tipo: comp.type, dados }]);
                      });
                      e.target.value = "";
                    }}
                  />
                </div>
                {recAnexos.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {recAnexos.map((a, i) => (
                      <Badge key={i} variant="secondary" className="flex items-center gap-1 py-1 px-2">
                        <FileText className="h-3 w-3" />
                        <span className="text-xs max-w-[150px] truncate">{a.nome}</span>
                        <button onClick={() => setRecAnexos(prev => prev.filter((_, j) => j !== i))} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Observação Geral</Label>
                <Textarea value={recObservacao} onChange={e => setRecObservacao(e.target.value)} placeholder="Observações sobre o recebimento..." rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleRegistrarRecebimento}>
              <PackageCheck className="mr-2 h-4 w-4" />Confirmar Recebimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes do Pedido */}
      <Dialog open={!!viewPedido} onOpenChange={() => setViewPedido(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>OC-{viewPedido && String(viewPedido.numero).padStart(4, "0")}</DialogTitle>
            <DialogDescription>Detalhes do ordem de compra</DialogDescription>
          </DialogHeader>
          {viewPedido && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">RC:</span> RCS-{String(viewPedido.requisicaoNumero).padStart(4, "0")}</div>
                <div><span className="text-muted-foreground">Fornecedor:</span> {viewPedido.fornecedorNome}</div>
                <div><span className="text-muted-foreground">Comprador:</span> {viewPedido.comprador}</div>
                <div><span className="text-muted-foreground">Data:</span> {format(new Date(viewPedido.dataCriacao), "dd/MM/yyyy")}</div>
                <div><span className="text-muted-foreground">Pagamento:</span> {viewPedido.condicaoPagamento || "-"}</div>
                <div><span className="text-muted-foreground">Prazo:</span> {viewPedido.prazoEntrega || "-"}</div>
                <div><span className="text-muted-foreground">Local:</span> {viewPedido.localEntrega || "-"}</div>
                <div><span className="text-muted-foreground">Status:</span> <Badge className={statusColors[viewPedido.status]}>{viewPedido.status}</Badge></div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-20">Qtd</TableHead>
                    <TableHead className="w-16">Un</TableHead>
                    <TableHead className="w-28">Preço Unit.</TableHead>
                    <TableHead className="w-28">Total</TableHead>
                    <TableHead className="w-24">Recebido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewPedido.itens.map(i => {
                    const recebido = getTotalRecebidoPorItem(viewPedido.id, i.itemId);
                    return (
                      <TableRow key={i.itemId}>
                        <TableCell>{i.descricao}</TableCell>
                        <TableCell>{i.quantidade}</TableCell>
                        <TableCell>{i.unidadeMedida}</TableCell>
                        <TableCell>{formatCurrency(i.precoUnitario)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(i.valorTotal)}</TableCell>
                        <TableCell>
                          <span className={recebido >= i.quantidade ? "text-green-600 font-medium" : recebido > 0 ? "text-amber-600" : "text-muted-foreground"}>
                            {recebido}/{i.quantidade}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="text-right font-bold text-lg">Total: {formatCurrency(viewPedido.valorTotal)}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Histórico de Recebimentos */}
      <Dialog open={!!histPedidoId} onOpenChange={() => setHistPedidoId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Recebimentos</DialogTitle>
            <DialogDescription>
              OC-{histPedidoId && String(pedidos.find(p => p.id === histPedidoId)?.numero || 0).padStart(4, "0")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {recebimentosDoPedido.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum recebimento registrado.</p>
            ) : recebimentosDoPedido.map(r => (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Badge variant={r.tipo === "Total" ? "default" : "secondary"}>{r.tipo}</Badge>
                      {r.notaFiscal && <span className="text-muted-foreground font-normal">NF: {r.notaFiscal}</span>}
                    </span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {format(new Date(r.dataRecebimento), "dd/MM/yyyy HH:mm")} — {r.usuario}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="w-24 text-right">Recebido</TableHead>
                        <TableHead>Obs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {r.itens.map(i => (
                        <TableRow key={i.itemId}>
                          <TableCell className="text-xs">{i.descricao}</TableCell>
                          <TableCell className="text-right text-xs">{i.quantidadeRecebida} {i.unidadeMedida}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{i.observacao || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {r.observacaoGeral && <p className="text-xs text-muted-foreground mt-2">Obs: {r.observacaoGeral}</p>}
                  <div className="mt-3 border-t pt-2">
                    <p className="text-xs font-medium mb-1">Documentos da NF {r.notaFiscal || "(sem número)"}</p>
                    {r.anexosNF && r.anexosNF.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {r.anexosNF.map((a, i) => (
                          <div key={i} className="flex items-center gap-3 text-xs">
                            <FileText className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[260px]" title={a.nome}>{a.nome}</span>
                            <button type="button" onClick={() => abrirAnexo(a)} className="text-primary hover:underline">Visualizar</button>
                            <a href={a.dados} download={a.nome} className="inline-flex items-center gap-1 text-primary hover:underline">
                              <Download className="h-3 w-3" />Baixar
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-xs text-muted-foreground">Nenhum documento anexado.</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!rejPedido} onOpenChange={(v) => { if (!v && !rejLoading) setRejPedido(null); }}>
        <DialogContent className={rejExpandido ? "max-w-[95vw] w-[95vw] max-h-[92vh] overflow-y-auto" : "max-h-[90vh] overflow-y-auto"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Ban className="h-5 w-5" />Rejeitar Recebimento
              <Button type="button" size="sm" variant="ghost" className="ml-auto mr-6 h-7 px-2 text-muted-foreground"
                onClick={() => setRejExpandido(v => !v)}>
                {rejExpandido ? "Reduzir tela" : "Expandir tela"}
              </Button>
            </DialogTitle>
            <DialogDescription>
              Pedido OC-{String(rejPedido?.numero ?? 0).padStart(4, "0")} — {rejPedido?.fornecedorNome}. Informe a quantidade rejeitada de cada item. O valor rejeitado será bloqueado no Financeiro (não pagar); o restante segue normalmente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className={`${rejExpandido ? "max-h-[55vh]" : "max-h-64"} overflow-auto rounded-md border`}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Pedido</TableHead>
                    <TableHead className="text-center">Já rejeitado</TableHead>
                    <TableHead className="text-center w-[21rem]">Rejeitar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rejPedido?.itens.map(i => {
                    const disp = qtdRejeitavel(rejPedido, i.itemId, i.quantidade);
                    return (
                      <TableRow key={i.itemId}>
                        <TableCell className="text-sm">{i.descricao}</TableCell>
                        <TableCell className="text-center text-sm">{i.quantidade} {i.unidadeMedida}</TableCell>
                        <TableCell className="text-center text-sm">{qtdJaRejeitada(rejPedido, i.itemId)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Input className="h-8 min-w-[15rem]" inputMode="decimal" disabled={disp <= 0} value={rejQtd[i.itemId] ?? ""} placeholder="0"
                              onChange={(e) => setRejQtd(q => ({ ...q, [i.itemId]: e.target.value.replace(",", ".") }))} />
                            <Button type="button" size="sm" variant="outline" className="h-8 px-2" disabled={disp <= 0}
                              onClick={() => setRejQtd(q => ({ ...q, [i.itemId]: String(disp) }))}>Tudo</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <p className="text-sm">Valor rejeitado: <strong>{valorRejeicao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></p>
            <div>
              <Label>Justificativa *</Label>
              <Textarea rows={3} value={rejJust} onChange={(e) => setRejJust(e.target.value)} placeholder="Ex.: Material avariado, divergente da NF, fora da especificação..." />
            </div>
            <div>
              <Label>Confirme sua senha *</Label>
              <Input type="password" autoComplete="new-password" value={rejSenha} onChange={(e) => setRejSenha(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") confirmarRejeicao(); }} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={rejLoading} onClick={() => setRejPedido(null)}>Cancelar</Button>
            <Button variant="destructive" disabled={rejLoading} onClick={confirmarRejeicao}>{rejLoading ? "Verificando..." : "Rejeitar recebimento"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
