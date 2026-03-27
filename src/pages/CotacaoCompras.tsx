import { useState, useMemo, useEffect, useCallback } from "react";
import { useCotacaoCompras, CotacaoCompras, PropostaFornecedor, ItemCotacaoFornecedor, ItemVencedor } from "@/contexts/CotacaoComprasContext";
import { useRequisicaoCompras, RequisicaoCompras } from "@/contexts/RequisicaoComprasContext";
import { usePedidoCompra } from "@/contexts/PedidoCompraContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { supabase } from "@/integrations/supabase/client";
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
import { Plus, Search, Eye, Trophy, XCircle, BarChart3, Trash2, MoreHorizontal, FilterX, Send, Copy, Link2, RefreshCw, CheckCircle2, Lock, ShieldCheck, Pencil, Mail, FileDown, FileText } from "lucide-react";
import { downloadPdfCotacao } from "@/lib/gerarPdfCotacao";
import { downloadPdfPedidoCotacaoTodos } from "@/lib/gerarPdfPedidoCotacao";
import { Switch } from "@/components/ui/switch";
import { format, subDays, isAfter } from "date-fns";

const statusColors: Record<string, string> = {
  "Em Andamento": "bg-yellow-100 text-yellow-800",
  "Aguardando Aprovação": "bg-blue-100 text-blue-800",
  Finalizada: "bg-green-100 text-green-800",
  Cancelada: "bg-red-200 text-red-900",
};

export default function CotacaoComprasPage() {
  const { cotacoes, addCotacao, addProposta, updateProposta, removeProposta, submeterAprovacao, aprovarCotacao, finalizarCotacao, cancelarCotacao } = useCotacaoCompras();
  const { requisicoes, updateStatus } = useRequisicaoCompras();
  const { addPedido } = usePedidoCompra();
  const { clientes } = useClientes();
  const { usuarioLogado } = useAuth();
  const { empresa } = useEmpresa();
  const { toast } = useToast();

  const fornecedores = useMemo(() => clientes.filter(c => c.tipo === "Fornecedor"), [clientes]);
  const reqDisponiveisParaCotacao = useMemo(() => requisicoes.filter(r => r.status === "Enviada" || r.status === "Em Cotação"), [requisicoes]);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterPeriodo, setFilterPeriodo] = useState("Todos");
  const [filterComprador, setFilterComprador] = useState("Todos");

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
  const [editingPropostaId, setEditingPropostaId] = useState<string | null>(null);
  const [finalizarDialogOpen, setFinalizarDialogOpen] = useState(false);
  const [finalizarCotacaoId, setFinalizarCotacaoId] = useState("");
  const [aprovarDialogOpen, setAprovarDialogOpen] = useState(false);
  const [aprovarCotacaoId, setAprovarCotacaoId] = useState("");
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
  const [finItensVencedores, setFinItensVencedores] = useState<Record<string, string>>({});
  const [finModoItemizado, setFinModoItemizado] = useState(false);

  // Enviar para fornecedor
  const [enviarDialogOpen, setEnviarDialogOpen] = useState(false);
  const [enviarCotacaoId, setEnviarCotacaoId] = useState("");
  const [enviarFornecedorId, setEnviarFornecedorId] = useState("");
  const [enviarEmail, setEnviarEmail] = useState("");
  const [enviarLoading, setEnviarLoading] = useState(false);
  const [linkGerado, setLinkGerado] = useState("");
  const [linksGeradosTodos, setLinksGeradosTodos] = useState<Array<{ fornecedorNome: string; link: string; erro?: string }>>([]);
  const [enviarTodosLoading, setEnviarTodosLoading] = useState(false);
  const [enviarEmailLoading, setEnviarEmailLoading] = useState(false);
  const [enviarEmailTodosLoading, setEnviarEmailTodosLoading] = useState(false);

  const compradores = useMemo(() => {
    const set = new Set(cotacoes.map(c => c.comprador));
    return Array.from(set).sort();
  }, [cotacoes]);

  const hasActiveFilters = filterStatus !== "Todos" || filterPeriodo !== "Todos" || filterComprador !== "Todos" || search !== "";

  const clearFilters = () => { setSearch(""); setFilterStatus("Todos"); setFilterPeriodo("Todos"); setFilterComprador("Todos"); };

  const filtered = useMemo(() => {
    let list = cotacoes;
    if (filterStatus !== "Todos") list = list.filter(c => c.status === filterStatus);
    if (filterComprador !== "Todos") list = list.filter(c => c.comprador === filterComprador);
    if (filterPeriodo !== "Todos") {
      const dias = Number(filterPeriodo);
      const dataLimite = subDays(new Date(), dias);
      list = list.filter(c => isAfter(new Date(c.dataCriacao), dataLimite));
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(c => String(c.numero).includes(s) || c.comprador.toLowerCase().includes(s) || String(c.requisicaoNumero).includes(s));
    }
    return list.sort((a, b) => b.numero - a.numero);
  }, [cotacoes, search, filterStatus, filterPeriodo, filterComprador]);

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
    setEditingPropostaId(null);
    setPropostaCotacaoId(cotacaoId);
    setPropostaDialogOpen(true);
  };

  const openEditPropostaDialog = (cotacaoId: string, proposta: PropostaFornecedor) => {
    setPropFornecedorId(proposta.fornecedorId);
    setPropCondicao(proposta.condicaoPagamento);
    setPropPrazo(proposta.prazoEntrega);
    setPropValidade(proposta.validadeProposta);
    setPropObs(proposta.observacao);
    setPropItens(proposta.itens.map(i => ({ ...i })));
    setEditingPropostaId(proposta.id);
    setPropostaCotacaoId(cotacaoId);
    setPropostaDialogOpen(true);
  };

  const handleAddProposta = () => {
    if (!propFornecedorId) { toast({ title: "Selecione um fornecedor", variant: "destructive" }); return; }
    if (propItens.some(i => i.precoUnitario <= 0)) { toast({ title: "Preencha todos os preços unitários", variant: "destructive" }); return; }
    const forn = fornecedores.find(f => f.id === propFornecedorId);
    const propostaData = {
      fornecedorId: propFornecedorId,
      fornecedorNome: forn?.nome || "",
      condicaoPagamento: propCondicao,
      prazoEntrega: propPrazo,
      validadeProposta: propValidade,
      observacao: propObs,
      itens: propItens,
    };
    if (editingPropostaId) {
      updateProposta(propostaCotacaoId, editingPropostaId, propostaData);
      toast({ title: "Proposta atualizada!" });
    } else {
      addProposta(propostaCotacaoId, propostaData);
      toast({ title: "Proposta adicionada!" });
    }
    setPropostaDialogOpen(false);
  };

  const openFinalizarDialog = (cotacaoId: string) => {
    setFinalizarCotacaoId(cotacaoId);
    setFinalizarDialogOpen(true);
  };

  const handleFinalizar = () => {
    const cot = cotacoes.find(c => c.id === finalizarCotacaoId);
    if (!cot) return;
    if (cot.propostas.length < 1) {
      toast({ title: "É necessário ao menos 1 proposta para finalizar", variant: "destructive" });
      return;
    }
    submeterAprovacao(finalizarCotacaoId);
    updateStatus(cot.requisicaoId, "Em Cotação", usuarioLogado?.nome || "Comprador", "Cotação submetida para aprovação");
    toast({ title: "Cotação finalizada e enviada para aprovação!" });
    setFinalizarDialogOpen(false);
  };

  // === Aprovar Cotação ===
  const openAprovarDialog = (cotacaoId: string) => {
    setAprovarCotacaoId(cotacaoId);
    setFinVencedorId(""); setFinJustificativa("");
    setFinItensVencedores({});
    setFinModoItemizado(false);
    setAprovarDialogOpen(true);
  };

  const handleAprovar = () => {
    const cot = cotacoes.find(c => c.id === aprovarCotacaoId);
    if (!cot) return;
    const req = requisicoes.find(r => r.id === cot.requisicaoId);
    if (!req) return;

    if (finModoItemizado) {
      const allAssigned = req.itens.every(i => finItensVencedores[i.id]);
      if (!allAssigned) { toast({ title: "Selecione um fornecedor para cada item", variant: "destructive" }); return; }

      const itensVencedores: ItemVencedor[] = req.itens.map(i => {
        const fornId = finItensVencedores[i.id];
        const prop = cot.propostas.find(p => p.fornecedorId === fornId);
        return { itemId: i.id, fornecedorId: fornId, fornecedorNome: prop?.fornecedorNome || "" };
      });

      const fornecedorIds = [...new Set(itensVencedores.map(iv => iv.fornecedorId))];
      const principalFornecedorId = fornecedorIds[0];

      aprovarCotacao(aprovarCotacaoId, principalFornecedorId, finJustificativa, itensVencedores);

      for (const fornId of fornecedorIds) {
        const prop = cot.propostas.find(p => p.fornecedorId === fornId);
        if (!prop) continue;
        const itemIds = itensVencedores.filter(iv => iv.fornecedorId === fornId).map(iv => iv.itemId);
        const itensPedido = prop.itens
          .filter(i => itemIds.includes(i.itemId))
          .map(i => ({ itemId: i.itemId, descricao: i.descricao, quantidade: i.quantidade, unidadeMedida: i.unidadeMedida, precoUnitario: i.precoUnitario, valorTotal: i.precoUnitario * i.quantidade }));

        addPedido({
          cotacaoId: cot.id,
          requisicaoId: cot.requisicaoId,
          requisicaoNumero: cot.requisicaoNumero,
          comprador: usuarioLogado?.nome || "Comprador",
          fornecedorId: prop.fornecedorId,
          fornecedorNome: prop.fornecedorNome,
          itens: itensPedido,
          condicaoPagamento: prop.condicaoPagamento,
          prazoEntrega: prop.prazoEntrega,
          localEntrega: req.localEntrega || "",
          observacoes: "",
        });
      }

      updateStatus(cot.requisicaoId, "Pedido Emitido", usuarioLogado?.nome || "Aprovador",
        fornecedorIds.length > 1
          ? `${fornecedorIds.length} pedidos gerados (aprovação por item)`
          : "Pedido gerado após aprovação"
      );

      toast({ title: `Cotação aprovada! ${fornecedorIds.length} pedido(s) emitido(s).` });
    } else {
      if (!finVencedorId) { toast({ title: "Selecione o fornecedor vencedor", variant: "destructive" }); return; }
      aprovarCotacao(aprovarCotacaoId, finVencedorId, finJustificativa);

      const propVencedora = cot.propostas.find(p => p.fornecedorId === finVencedorId);
      if (propVencedora) {
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
          localEntrega: req.localEntrega || "",
          observacoes: "",
        });
        updateStatus(cot.requisicaoId, "Pedido Emitido", usuarioLogado?.nome || "Aprovador", "Pedido gerado após aprovação");
      }
      toast({ title: "Cotação aprovada e pedido emitido!" });
    }

    setAprovarDialogOpen(false);
  };

  const openMapa = (cot: CotacaoCompras) => { setMapaCotacao(cot); setMapaDialogOpen(true); };

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // === Enviar link para fornecedor ===
  const openEnviarDialog = (cotacaoId: string) => {
    setEnviarCotacaoId(cotacaoId);
    setEnviarFornecedorId("");
    setEnviarEmail("");
    setLinkGerado("");
    setLinksGeradosTodos([]);
    setEnviarDialogOpen(true);
  };

  const handleSelectFornecedorEnviar = (fornId: string) => {
    setEnviarFornecedorId(fornId);
    const forn = fornecedores.find(f => f.id === fornId);
    setEnviarEmail(forn?.emailCompras || forn?.email || "");
    setLinkGerado("");
  };

  const handleGerarLink = async () => {
    if (!enviarFornecedorId) { toast({ title: "Selecione um fornecedor", variant: "destructive" }); return; }
    setEnviarLoading(true);
    try {
      const cot = cotacoes.find(c => c.id === enviarCotacaoId);
      const req = requisicoes.find(r => r.id === cot?.requisicaoId);
      const forn = fornecedores.find(f => f.id === enviarFornecedorId);
      if (!cot || !req || !forn) throw new Error("Dados não encontrados");

      const itensConvite = req.itens.map(i => ({
        itemId: i.id,
        descricao: i.descricao,
        quantidade: i.quantidade,
        unidadeMedida: i.unidadeMedida,
      }));

      const { data, error } = await supabase.from("cotacao_convites").insert({
        cotacao_id: cot.id,
        cotacao_numero: cot.numero,
        fornecedor_id: forn.id,
        fornecedor_nome: forn.nome,
        fornecedor_email: enviarEmail,
        comprador: usuarioLogado?.nome || "Comprador",
        itens: itensConvite,
      }).select("token").single();

      if (error) throw error;

      const link = `${window.location.origin}/cotacao/proposta/${data.token}`;
      setLinkGerado(link);
      toast({ title: "Link gerado com sucesso!" });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro ao gerar link", description: e.message, variant: "destructive" });
    } finally {
      setEnviarLoading(false);
    }
  };

  const handleCopyLink = (link?: string) => {
    navigator.clipboard.writeText(link || linkGerado);
    toast({ title: "Link copiado!" });
  };

  const handleGerarLinkTodos = async () => {
    setEnviarTodosLoading(true);
    setLinksGeradosTodos([]);
    try {
      const cot = cotacoes.find(c => c.id === enviarCotacaoId);
      const req = requisicoes.find(r => r.id === cot?.requisicaoId);
      if (!cot || !req) throw new Error("Dados não encontrados");

      const itensConvite = req.itens.map(i => ({
        itemId: i.id,
        descricao: i.descricao,
        quantidade: i.quantidade,
        unidadeMedida: i.unidadeMedida,
      }));

      // Check existing convites to avoid duplicates
      const { data: existingConvites } = await supabase
        .from("cotacao_convites")
        .select("fornecedor_id")
        .eq("cotacao_id", cot.id);
      const existingIds = new Set((existingConvites || []).map(c => c.fornecedor_id));

      const results: Array<{ fornecedorNome: string; link: string; erro?: string }> = [];

      for (const forn of fornecedores) {
        if (existingIds.has(forn.id)) {
          results.push({ fornecedorNome: forn.nome, link: "", erro: "Convite já enviado anteriormente" });
          continue;
        }
        try {
          const { data, error } = await supabase.from("cotacao_convites").insert({
            cotacao_id: cot.id,
            cotacao_numero: cot.numero,
            fornecedor_id: forn.id,
            fornecedor_nome: forn.nome,
            fornecedor_email: forn.emailCompras || forn.email || "",
            comprador: usuarioLogado?.nome || "Comprador",
            itens: itensConvite,
          }).select("token").single();

          if (error) throw error;
          const link = `${window.location.origin}/cotacao/proposta/${data.token}`;
          results.push({ fornecedorNome: forn.nome, link });
        } catch (e: any) {
          results.push({ fornecedorNome: forn.nome, link: "", erro: e.message });
        }
      }

      setLinksGeradosTodos(results);
      const successCount = results.filter(r => r.link).length;
      toast({ title: `Links gerados para ${successCount} de ${fornecedores.length} fornecedores` });
    } catch (e: any) {
      toast({ title: "Erro ao gerar links", description: e.message, variant: "destructive" });
    } finally {
      setEnviarTodosLoading(false);
    }
  };

  const handleCopyAllLinks = () => {
    const text = linksGeradosTodos
      .filter(r => r.link)
      .map(r => `${r.fornecedorNome}: ${r.link}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Todos os links copiados!" });
  };


  const handleEnviarEmailIndividual = async () => {
    if (!linkGerado || !enviarEmail) {
      toast({ title: "Gere o link e informe o e-mail antes de enviar", variant: "destructive" });
      return;
    }
    setEnviarEmailLoading(true);
    try {
      const cot = cotacoes.find(c => c.id === enviarCotacaoId);
      const forn = fornecedores.find(f => f.id === enviarFornecedorId);
      if (!cot || !forn) throw new Error("Dados não encontrados");

      const nomeEmpresa = empresa.nomeFantasia || empresa.razaoSocial || "SGM";
      const comprador = cot.comprador || usuarioLogado?.nome || "Departamento de Compras";

      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "cotacao-confirmation",
          recipientEmail: enviarEmail,
          idempotencyKey: `cotacao-${cot.id}-${enviarFornecedorId}`,
          templateData: {
            fornecedorNome: forn.nome,
            cotacaoNumero: cot.numero,
            comprador,
            link: linkGerado,
            nomeEmpresa,
          },
        },
      });

      if (error) throw error;
      toast({ title: "E-mail enviado com sucesso!" });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro ao enviar e-mail", description: e.message, variant: "destructive" });
    } finally {
      setEnviarEmailLoading(false);
    }
  };

  const handleEnviarEmailTodos = async () => {
    const comLink = linksGeradosTodos.filter(r => r.link);
    if (comLink.length === 0) {
      toast({ title: "Nenhum link disponível para enviar", variant: "destructive" });
      return;
    }
    setEnviarEmailTodosLoading(true);
    try {
      const cot = cotacoes.find(c => c.id === enviarCotacaoId);
      if (!cot) throw new Error("Cotação não encontrada");

      const nomeEmpresa = empresa.nomeFantasia || empresa.razaoSocial || "SGM";
      const comprador = cot.comprador || usuarioLogado?.nome || "Departamento de Compras";
      let enviados = 0;
      let erros = 0;

      for (const item of comLink) {
        const forn = fornecedores.find(f => f.nome === item.fornecedorNome);
        const emailForn = forn?.emailCompras || forn?.email || "";
        if (!emailForn) { erros++; continue; }

        try {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "cotacao-confirmation",
              recipientEmail: emailForn,
              idempotencyKey: `cotacao-${cot.id}-${forn?.id || item.fornecedorNome}`,
              templateData: {
                fornecedorNome: item.fornecedorNome,
                cotacaoNumero: cot.numero,
                comprador,
                link: item.link,
                nomeEmpresa,
              },
            },
          });
          enviados++;
        } catch {
          erros++;
        }
      }

      toast({ title: `E-mails enviados: ${enviados} de ${comLink.length}${erros > 0 ? ` (${erros} erro(s))` : ""}` });
    } catch (e: any) {
      toast({ title: "Erro ao enviar e-mails", description: e.message, variant: "destructive" });
    } finally {
      setEnviarEmailTodosLoading(false);
    }
  };

  // === Sincronizar propostas externas ===
  const syncPropostasExternas = useCallback(async () => {
    try {
      const cotacaoIds = cotacoes.filter(c => c.status === "Em Andamento").map(c => c.id);
      if (cotacaoIds.length === 0) return;

      const { data: convites } = await supabase
        .from("cotacao_convites")
        .select("*, cotacao_propostas_externas(*)")
        .in("cotacao_id", cotacaoIds)
        .eq("status", "respondido");

      if (!convites || convites.length === 0) return;

      for (const convite of convites) {
        const propostas = (convite as any).cotacao_propostas_externas;
        if (!propostas || propostas.length === 0) continue;

        const cot = cotacoes.find(c => c.id === convite.cotacao_id);
        if (!cot) continue;

        for (const propExt of propostas) {
          // Check if already imported (by fornecedor)
          const alreadyExists = cot.propostas.some(p => p.fornecedorId === convite.fornecedor_id);
          if (alreadyExists) continue;

          addProposta(convite.cotacao_id, {
            fornecedorId: convite.fornecedor_id,
            fornecedorNome: convite.fornecedor_nome,
            condicaoPagamento: propExt.condicao_pagamento || "",
            prazoEntrega: propExt.prazo_entrega || "",
            validadeProposta: propExt.validade_proposta || "",
            observacao: propExt.observacao || "",
            itens: (propExt.itens as any[]).map((i: any) => ({
              itemId: i.itemId,
              descricao: i.descricao,
              quantidade: i.quantidade,
              unidadeMedida: i.unidadeMedida,
              precoUnitario: i.precoUnitario,
              prazoEntrega: "",
              observacao: "",
            })),
          });

          toast({ title: `Proposta recebida de ${convite.fornecedor_nome}!` });
        }
      }
    } catch (e) {
      console.error("Erro ao sincronizar propostas:", e);
    }
  }, [cotacoes, addProposta, toast]);

  // Sync on mount and periodically
  useEffect(() => {
    syncPropostasExternas();
    const interval = setInterval(syncPropostasExternas, 30000); // every 30s
    return () => clearInterval(interval);
  }, [syncPropostasExternas]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Cotações de Compras</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={syncPropostasExternas} title="Sincronizar propostas externas">
            <RefreshCw className="mr-2 h-4 w-4" />Sincronizar
          </Button>
          <Button onClick={() => { setReqSearch(""); setReqFilterUrgencia("Todas"); setSelectedReqId(""); setNovaDialogOpen(true); }} disabled={reqDisponiveisParaCotacao.length === 0}><Plus className="mr-2 h-4 w-4" />Nova Cotação</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar nº cotação, RC, comprador..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os Status</SelectItem>
            <SelectItem value="Em Andamento">Em Andamento</SelectItem>
            <SelectItem value="Aguardando Aprovação">Aguardando Aprovação</SelectItem>
            <SelectItem value="Finalizada">Finalizada</SelectItem>
            <SelectItem value="Cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todo Período</SelectItem>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
        {compradores.length > 1 && (
          <Select value={filterComprador} onValueChange={setFilterComprador}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos Compradores</SelectItem>
              {compradores.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <FilterX className="mr-1 h-4 w-4" />Limpar
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} cotação{filtered.length !== 1 ? "ões" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
          {hasActiveFilters && ` (de ${cotacoes.length} total)`}
        </p>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Cotação</TableHead>
              <TableHead>Centro de Custo</TableHead>
              <TableHead>RC Vinculada</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Comprador</TableHead>
              <TableHead>Propostas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16 text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhuma cotação encontrada</TableCell></TableRow>
            ) : filtered.map(c => {
              const rcVinculada = requisicoes.find(r => r.id === c.requisicaoId);
              return (
              <TableRow key={c.id}>
                <TableCell className="font-mono font-bold">COT-{String(c.numero).padStart(4, "0")}</TableCell>
                <TableCell className="text-sm">{rcVinculada?.centroCustoNome || "-"}</TableCell>
                <TableCell>{format(new Date(c.dataCriacao), "dd/MM/yyyy")}</TableCell>
                <TableCell>{c.comprador}</TableCell>
                <TableCell><Badge variant="secondary">{c.propostas.length}</Badge></TableCell>
                <TableCell><Badge className={statusColors[c.status] || ""}>{c.status}</Badge></TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewCotacao(c)}>
                        <Eye className="mr-2 h-4 w-4" />Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openMapa(c)} disabled={c.propostas.length === 0}>
                        <BarChart3 className="mr-2 h-4 w-4" />Mapa Comparativo
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const req = requisicoes.find(r => r.id === c.requisicaoId) || null;
                        downloadPdfCotacao({ cotacao: c, requisicao: req, empresa });
                        toast({ title: "PDF gerado com sucesso" });
                      }}>
                        <FileDown className="mr-2 h-4 w-4" />Exportar PDF Cotação
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={async () => {
                        const req = requisicoes.find(r => r.id === c.requisicaoId) || null;
                        const fornsComProposta = c.propostas.map(p => ({
                          id: p.fornecedorId,
                          nome: p.fornecedorNome,
                          cnpj: fornecedores.find(f => f.id === p.fornecedorId)?.cnpj || "",
                          email: fornecedores.find(f => f.id === p.fornecedorId)?.email || "",
                        }));
                        const fornsUnicos = fornsComProposta.filter((f, i, arr) => arr.findIndex(a => a.id === f.id) === i);
                        if (fornsUnicos.length === 0) {
                          toast({ title: "Nenhum fornecedor", description: "Adicione propostas ou envie para fornecedores antes de gerar os PDFs.", variant: "destructive" });
                          return;
                        }
                        await downloadPdfPedidoCotacaoTodos(c, req, empresa, fornsUnicos);
                        toast({ title: `${fornsUnicos.length} PDF(s) de pedido de cotação gerado(s)` });
                      }}>
                        <FileText className="mr-2 h-4 w-4" />Pedido de Cotação por Fornecedor
                      </DropdownMenuItem>
                      {(c.status === "Em Andamento" || c.status === "Aguardando Aprovação") && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEnviarDialog(c.id)}>
                            <Send className="mr-2 h-4 w-4" />Enviar para Fornecedor
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPropostaDialog(c.id)}>
                            <Plus className="mr-2 h-4 w-4" />Adicionar Proposta Manual
                          </DropdownMenuItem>
                          {c.status === "Em Andamento" && (
                            <DropdownMenuItem onClick={() => openFinalizarDialog(c.id)} disabled={c.propostas.length < 1}>
                              <Lock className="mr-2 h-4 w-4" />Finalizar Cotação
                            </DropdownMenuItem>
                          )}
                          {c.status === "Aguardando Aprovação" && (
                            <DropdownMenuItem onClick={() => openAprovarDialog(c.id)}>
                              <ShieldCheck className="mr-2 h-4 w-4" />Aprovar Cotação
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => { cancelarCotacao(c.id); toast({ title: "Cotação cancelada" }); }}>
                            <XCircle className="mr-2 h-4 w-4" />Cancelar
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
            <DialogTitle>{editingPropostaId ? "Editar Proposta de Fornecedor" : "Adicionar Proposta de Fornecedor"}</DialogTitle>
            <DialogDescription>Preencha os dados da proposta recebida.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fornecedor *</Label>
                {editingPropostaId ? (
                  <Input value={fornecedores.find(f => f.id === propFornecedorId)?.nome || ""} disabled />
                ) : (
                  <Select value={propFornecedorId} onValueChange={setPropFornecedorId}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{(() => {
                      const cotAtual = cotacoes.find(c => c.id === propostaCotacaoId);
                      const idsJaComProposta = cotAtual?.propostas.map(p => p.fornecedorId) || [];
                      const disponiveis = fornecedores.filter(f => !idsJaComProposta.includes(f.id));
                      return disponiveis.length > 0
                        ? disponiveis.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)
                        : <div className="px-2 py-4 text-sm text-muted-foreground text-center">Todos os fornecedores já possuem proposta</div>;
                    })()}</SelectContent>
                  </Select>
                )}
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
            <Button onClick={handleAddProposta}>{editingPropostaId ? "Atualizar Proposta" : "Salvar Proposta"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Finalizar Cotação (travar valores) */}
      <Dialog open={finalizarDialogOpen} onOpenChange={setFinalizarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Cotação</DialogTitle>
            <DialogDescription>
              Ao finalizar, os valores das propostas serão travados e a cotação será enviada para aprovação do usuário autorizador.
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const cot = cotacoes.find(c => c.id === finalizarCotacaoId);
            if (!cot) return null;
            return (
              <div className="space-y-3">
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Cotação:</span> COT-{String(cot.numero).padStart(4, "0")}</p>
                  <p><span className="text-muted-foreground">Propostas recebidas:</span> {cot.propostas.length}</p>
                </div>
                <div className="rounded-lg border p-3 bg-muted/30">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    Os valores das propostas serão travados
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nenhuma proposta poderá ser adicionada ou removida após a finalização. O aprovador poderá autorizar por pedido completo ou por item individual.
                  </p>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalizarDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleFinalizar}>
              <Lock className="mr-2 h-4 w-4" />Finalizar e Enviar para Aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Aprovar Cotação */}
      <Dialog open={aprovarDialogOpen} onOpenChange={setAprovarDialogOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aprovar Cotação</DialogTitle>
            <DialogDescription>
              {finModoItemizado
                ? "Selecione o fornecedor vencedor para cada item usando os checkboxes. Pedidos separados serão gerados por fornecedor."
                : "Selecione o fornecedor vencedor e justifique a escolha. Um Pedido de Compra será gerado automaticamente."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Aprovar por item</Label>
                <p className="text-xs text-muted-foreground">
                  Permite escolher fornecedores diferentes para cada item
                </p>
              </div>
              <Switch
                checked={finModoItemizado}
                onCheckedChange={(checked) => {
                  setFinModoItemizado(checked);
                  if (checked) setFinVencedorId("");
                  else setFinItensVencedores({});
                }}
              />
            </div>

            {!finModoItemizado && (
              <div>
                <Label>Fornecedor Vencedor *</Label>
                <Select value={finVencedorId} onValueChange={setFinVencedorId}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {cotacoes.find(c => c.id === aprovarCotacaoId)?.propostas.map(p => (
                      <SelectItem key={p.fornecedorId} value={p.fornecedorId}>{p.fornecedorNome} — {formatCurrency(p.valorTotal)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {finModoItemizado && (() => {
              const cot = cotacoes.find(c => c.id === aprovarCotacaoId);
              const req = cot ? requisicoes.find(r => r.id === cot.requisicaoId) : null;
              if (!cot || !req) return null;
              const propostas = cot.propostas;

              const handleToggleItem = (itemId: string, fornId: string) => {
                setFinItensVencedores(prev => {
                  if (prev[itemId] === fornId) {
                    const next = { ...prev };
                    delete next[itemId];
                    return next;
                  }
                  return { ...prev, [itemId]: fornId };
                });
              };

              const handleToggleTodos = (fornId: string) => {
                const allSelected = req.itens.every(item => finItensVencedores[item.id] === fornId);
                if (allSelected) {
                  setFinItensVencedores({});
                } else {
                  const next: Record<string, string> = {};
                  req.itens.forEach(item => { next[item.id] = fornId; });
                  setFinItensVencedores(next);
                }
              };

              const handleSelecionarMelhorPreco = () => {
                const next: Record<string, string> = {};
                req.itens.forEach(item => {
                  let bestFornId = "";
                  let bestPrice = Infinity;
                  propostas.forEach(p => {
                    const pi = p.itens.find(i => i.itemId === item.id);
                    if (pi && pi.precoUnitario > 0 && pi.precoUnitario < bestPrice) {
                      bestPrice = pi.precoUnitario;
                      bestFornId = p.fornecedorId;
                    }
                  });
                  if (bestFornId) next[item.id] = bestFornId;
                });
                setFinItensVencedores(next);
              };

              return (
                <div className="space-y-2">
                  <Button variant="outline" size="sm" onClick={handleSelecionarMelhorPreco}>
                    <Trophy className="mr-2 h-4 w-4" />Selecionar Melhor Preço por Item
                  </Button>
                  <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Material / Serviço</TableHead>
                        <TableHead className="w-16">Un.</TableHead>
                        <TableHead className="w-20">Qtd.</TableHead>
                        {propostas.map(p => {
                          const allSelected = req.itens.every(item => finItensVencedores[item.id] === p.fornecedorId);
                          return (
                            <TableHead key={p.fornecedorId} className="min-w-[180px] text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-semibold text-xs">{p.fornecedorNome}</span>
                                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground">
                                  <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={() => handleToggleTodos(p.fornecedorId)}
                                    className="rounded border-input"
                                  />
                                  Todos
                                </label>
                              </div>
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {req.itens.map(item => {
                        const unitPrices = propostas.map(p => {
                          const pi = p.itens.find(i => i.itemId === item.id);
                          return pi ? pi.precoUnitario : Infinity;
                        });
                        const minPrice = Math.min(...unitPrices.filter(v => v > 0 && v !== Infinity));

                        return (
                          <TableRow key={item.id}>
                            <TableCell className="text-sm font-medium">{item.descricao}</TableCell>
                            <TableCell className="text-sm">{item.unidadeMedida}</TableCell>
                            <TableCell className="text-sm">{item.quantidade}</TableCell>
                            {propostas.map(p => {
                              const pi = p.itens.find(i => i.itemId === item.id);
                              const isSelected = finItensVencedores[item.id] === p.fornecedorId;
                              const isCheapest = pi && pi.precoUnitario === minPrice && pi.precoUnitario > 0;

                              return (
                                <TableCell key={p.fornecedorId} className={`text-center ${isSelected ? "bg-primary/10" : ""}`}>
                                  {pi && pi.precoUnitario > 0 ? (
                                    <label className="flex items-center justify-center gap-1.5 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggleItem(item.id, p.fornecedorId)}
                                        className="rounded border-input"
                                      />
                                      <span className={`text-xs ${isCheapest ? "font-bold" : ""}`} style={isCheapest ? { color: "#4169E1" } : undefined}>
                                        {formatCurrency(pi.precoUnitario)} | {formatCurrency(pi.precoUnitario * pi.quantidade)}
                                      </span>
                                    </label>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                      <TableRow className="font-bold border-t-2">
                        <TableCell colSpan={3}>TOTAL</TableCell>
                        {propostas.map(p => (
                          <TableCell key={p.fornecedorId} className="text-center text-sm">
                            {formatCurrency(p.valorTotal)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} className="text-muted-foreground text-sm">Condição Pgto</TableCell>
                        {propostas.map(p => (
                          <TableCell key={p.fornecedorId} className="text-center text-xs">{p.condicaoPagamento || "-"}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} className="text-muted-foreground text-sm">Prazo Entrega</TableCell>
                        {propostas.map(p => (
                          <TableCell key={p.fornecedorId} className="text-center text-xs">{p.prazoEntrega || "-"}</TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
              );
            })()}

            {/* Summary */}
            {finModoItemizado && Object.keys(finItensVencedores).length > 0 && (() => {
              const cot = cotacoes.find(c => c.id === aprovarCotacaoId);
              if (!cot) return null;
              const groups: Record<string, { nome: string; total: number; count: number }> = {};
              for (const [itemId, fornId] of Object.entries(finItensVencedores)) {
                const prop = cot.propostas.find(p => p.fornecedorId === fornId);
                const pi = prop?.itens.find(i => i.itemId === itemId);
                if (!prop || !pi) continue;
                if (!groups[fornId]) groups[fornId] = { nome: prop.fornecedorNome, total: 0, count: 0 };
                groups[fornId].total += pi.precoUnitario * pi.quantidade;
                groups[fornId].count++;
              }
              return (
                <div className="space-y-1 rounded-lg border p-3 bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Resumo da aprovação:</p>
                  {Object.entries(groups).map(([id, g]) => (
                    <div key={id} className="flex justify-between text-sm">
                      <span>{g.nome} <span className="text-muted-foreground">({g.count} {g.count === 1 ? "item" : "itens"})</span></span>
                      <span className="font-medium">{formatCurrency(g.total)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
                    <span>Total Geral</span>
                    <span>{formatCurrency(Object.values(groups).reduce((s, g) => s + g.total, 0))}</span>
                  </div>
                </div>
              );
            })()}

            <div>
              <Label>Justificativa da Aprovação</Label>
              <Textarea value={finJustificativa} onChange={e => setFinJustificativa(e.target.value)} placeholder="Justifique a aprovação e escolha do(s) fornecedor(es)..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAprovarDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAprovar}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              {finModoItemizado ? "Aprovar e Emitir Pedidos" : "Aprovar e Emitir Pedido"}
            </Button>
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
              {viewCotacao.propostas.map(p => {
                const isEditable = viewCotacao.status === "Em Andamento" || viewCotacao.status === "Aguardando Aprovação";
                return (
                <Card key={p.id} className={p.fornecedorId === viewCotacao.fornecedorVencedorId ? "border-green-500 border-2" : ""}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {p.fornecedorNome}
                      {p.fornecedorId === viewCotacao.fornecedorVencedorId && <Badge className="bg-green-100 text-green-800">Vencedor</Badge>}
                      <span className="ml-auto font-bold">{formatCurrency(p.valorTotal)}</span>
                      {isEditable && (
                        <div className="flex gap-1 ml-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setViewCotacao(null); openEditPropostaDialog(viewCotacao.id, p); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { removeProposta(viewCotacao.id, p.id); toast({ title: "Proposta removida" }); setViewCotacao({ ...viewCotacao, propostas: viewCotacao.propostas.filter(pr => pr.id !== p.id) }); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-1">
                    <p>Pagamento: {p.condicaoPagamento || "-"} | Prazo: {p.prazoEntrega || "-"} | Validade: {p.validadeProposta ? format(new Date(p.validadeProposta), "dd/MM/yyyy") : "-"}</p>
                    {p.observacao && <p>Obs: {p.observacao}</p>}
                  </CardContent>
                </Card>
                );
              })}
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

      {/* Dialog Enviar para Fornecedor */}
      <Dialog open={enviarDialogOpen} onOpenChange={v => { setEnviarDialogOpen(v); if (!v) { setLinkGerado(""); setLinksGeradosTodos([]); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enviar Cotação para Fornecedores</DialogTitle>
            <DialogDescription>Gere o link para um fornecedor específico ou para todos de uma vez.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Enviar para todos */}
            {linksGeradosTodos.length === 0 && !linkGerado && (
              <div className="border border-dashed rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Enviar para todos os fornecedores</p>
                    <p className="text-xs text-muted-foreground">{fornecedores.length} fornecedores cadastrados</p>
                  </div>
                  <Button onClick={handleGerarLinkTodos} disabled={enviarTodosLoading || fornecedores.length === 0}>
                    <Send className="mr-2 h-4 w-4" />
                    {enviarTodosLoading ? "Gerando..." : "Gerar Links para Todos"}
                  </Button>
                </div>
              </div>
            )}

            {/* Resultados envio em massa */}
            {linksGeradosTodos.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm font-medium">Links gerados ({linksGeradosTodos.filter(r => r.link).length}/{linksGeradosTodos.length})</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyAllLinks}>
                      <Copy className="mr-2 h-3.5 w-3.5" />
                      Copiar Todos
                    </Button>
                    <Button size="sm" onClick={handleEnviarEmailTodos} disabled={enviarEmailTodosLoading || linksGeradosTodos.filter(r => r.link).length === 0}>
                      <Mail className="mr-2 h-3.5 w-3.5" />
                      {enviarEmailTodosLoading ? "Enviando..." : "Enviar por E-mail"}
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                  {linksGeradosTodos.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{r.fornecedorNome}</p>
                        {r.erro && <p className="text-xs text-amber-600">{r.erro}</p>}
                      </div>
                      {r.link ? (
                        <Button variant="ghost" size="sm" onClick={() => handleCopyLink(r.link)} title="Copiar link">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Separador */}
            {linksGeradosTodos.length === 0 && !linkGerado && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">ou enviar individualmente</span></div>
              </div>
            )}

            {/* Envio individual */}
            {linksGeradosTodos.length === 0 && (
              <>
                <div>
                  <Label>Fornecedor *</Label>
                  <Select value={enviarFornecedorId} onValueChange={handleSelectFornecedorEnviar}>
                    <SelectTrigger><SelectValue placeholder="Selecione um fornecedor..." /></SelectTrigger>
                    <SelectContent>
                      {fornecedores.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>E-mail do Fornecedor</Label>
                  <Input
                    type="email"
                    value={enviarEmail}
                    onChange={e => setEnviarEmail(e.target.value)}
                    placeholder="email@fornecedor.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Preenchido automaticamente do cadastro. Ajuste se necessário.</p>
                </div>

                {!linkGerado && (
                  <Button onClick={handleGerarLink} disabled={enviarLoading || !enviarFornecedorId} className="w-full">
                    <Link2 className="mr-2 h-4 w-4" />
                    {enviarLoading ? "Gerando..." : "Gerar Link do Formulário"}
                  </Button>
                )}

                {linkGerado && (
                  <div className="space-y-3">
                    <div className="bg-muted p-3 rounded-lg">
                      <Label className="text-xs text-muted-foreground">Link gerado:</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input value={linkGerado} readOnly className="text-xs font-mono" />
                        <Button variant="outline" size="icon" onClick={() => handleCopyLink()} title="Copiar link">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      O fornecedor pode acessar este link para preencher seus preços. 
                      Quando ele enviar a proposta, ela aparecerá automaticamente aqui.
                    </p>
                    {enviarEmail && (
                      <Button onClick={handleEnviarEmailIndividual} disabled={enviarEmailLoading} className="w-full">
                        <Mail className="mr-2 h-4 w-4" />
                        {enviarEmailLoading ? "Enviando..." : `Enviar Link por E-mail para ${enviarEmail}`}
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEnviarDialogOpen(false); setLinkGerado(""); setLinksGeradosTodos([]); }}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
