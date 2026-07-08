import { useState, useMemo } from "react";
import { loadPersistedFilters, usePersistFilters } from "@/lib/persistedFilters";
import { useSolicitacoesServicos, SolicitacaoServico, HistoricoEntry } from "@/contexts/SolicitacoesServicosContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useOrdensServico } from "@/contexts/OrdensServicoContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLimiteAprovacao } from "@/hooks/useLimiteAprovacao";
import { usePermissao } from "@/hooks/usePermissao";
import PaginationControls, { paginate } from "@/components/PaginationControls";
import { formatNumeroAno } from "@/lib/formatNumero";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, Search, ClipboardCheck } from "lucide-react";

const PRIORIDADES = [
  { value: "Normal", color: "bg-green-500" },
  { value: "Urgente", color: "bg-yellow-500" },
  { value: "Emergencial", color: "bg-red-500" },
];

export default function AprovarLoteSS() {
  const { solicitacoes, updateSolicitacao } = useSolicitacoesServicos();
  const { clientes } = useClientes();
  const { addOrdem } = useOrdensServico();
  const { usuarioLogado } = useAuth();
  const { podeAprovar } = useLimiteAprovacao();
  const { tem } = usePermissao();
  const podeAprovarLote = tem("solicitacao_servicos.aprovar_lote");
  const { toast } = useToast();

  const _saved = loadPersistedFilters<{ search: string; filterCliente: string; }>("aprovar_lote_ss_filters_v1");
  const [search, setSearch] = useState(_saved?.search ?? "");
  const [filterCliente, setFilterCliente] = useState(_saved?.filterCliente ?? "all");
  usePersistFilters("aprovar_lote_ss_filters_v1", { search, filterCliente });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [selectedPrioridade, setSelectedPrioridade] = useState("");
  const [approvalRessalva, setApprovalRessalva] = useState("");
  const [approving, setApproving] = useState(false);

  const buildHistoricoEntry = (situacao: string, existingHistorico: HistoricoEntry[] = []): HistoricoEntry[] => [
    ...existingHistorico,
    { situacao, data: new Date().toISOString(), usuario: usuarioLogado?.nome || "Sistema" },
  ];

  const aguardando = useMemo(() =>
    solicitacoes.filter(s => s.situacao === "Aguardando aprovação"),
    [solicitacoes]
  );

  const filtered = useMemo(() => {
    let result = aguardando;
    if (filterCliente !== "all") {
      result = result.filter(s => s.clienteId === filterCliente);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        String(s.numero).includes(q) ||
        formatNumeroAno(s.numero, s.createdAt).toLowerCase().includes(q) ||
        s.clienteNome?.toLowerCase().includes(q) ||
        s.descricaoServicos?.toLowerCase().includes(q) ||
        s.localDescricao?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [aguardando, search, filterCliente]);

  const { paginated } = paginate(filtered, page, pageSize);

  const allPageIds = paginated.map(s => s.id);
  const allPageSelected = allPageIds.length > 0 && allPageIds.every(id => selectedIds.has(id));

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allPageSelected) {
        allPageIds.forEach(id => next.delete(id));
      } else {
        allPageIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filtered.map(s => s.id)));
  };

  const clientesUnicos = useMemo(() => {
    const map = new Map<string, string>();
    aguardando.forEach(s => { if (s.clienteId && s.clienteNome) map.set(s.clienteId, s.clienteNome); });
    return Array.from(map.entries());
  }, [aguardando]);

  const handleBatchApprove = async () => {
    if (!podeAprovarLote) {
      toast({ title: "Você não possui permissão para esta ação.", variant: "destructive" });
      return;
    }
    if (!selectedPrioridade) {
      toast({ title: "Selecione o nível de prioridade", variant: "destructive" });
      return;
    }
    // Valida limite de aprovação OS (lote sem orçamento = valor 0; basta limite > 0)
    if (!podeAprovar(0, "os")) return;
    const ressalva = approvalRessalva.trim();
    setApproving(true);
    try {
      const toApprove = solicitacoes.filter(s => selectedIds.has(s.id) && s.situacao === "Aguardando aprovação");
      const prioridadeOS =
        selectedPrioridade === "Emergencial" ? "A: IMEDIATA" :
        selectedPrioridade === "Urgente" ? "B: URGENTE" : "C: NORMAL";

      for (const ss of toApprove) {
        await updateSolicitacao(ss.id, {
          situacao: "Aprovada",
          prioridade: selectedPrioridade,
          ressalva_aprovacao: ressalva,
          historico: buildHistoricoEntry("Aprovada", ss.historico || []),
        });
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
          ressalva_aprovacao: ressalva,
          situacao: "Aberta",
          historico: buildHistoricoEntry("Aberta"),
          operador_id: usuarioLogado?.id || "",
          operador_nome: usuarioLogado?.nome || "",
        });
      }
      toast({ title: `${toApprove.length} solicitação(ões) aprovada(s) e OS criada(s)` });
      setSelectedIds(new Set());
      setApprovalOpen(false);
      setSelectedPrioridade("");
      setApprovalRessalva("");
    } catch {
      toast({ title: "Erro ao aprovar em lote", variant: "destructive" });
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <ClipboardCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Aprovar em Lote</h1>
            <p className="text-sm text-muted-foreground">
              Solicitações de Serviço aguardando aprovação
            </p>
          </div>
        </div>
        <Badge variant="secondary">{filtered.length} aguardando</Badge>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[220px]">
          <Label className="text-xs">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nº, cliente, descrição..."
              className="pl-9"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
        <div className="w-[220px]">
          <Label className="text-xs">Cliente</Label>
          <Select value={filterCliente} onValueChange={v => { setFilterCliente(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Clientes</SelectItem>
              {clientesUnicos.map(([id, nome]) => (
                <SelectItem key={id} value={id}>{nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Batch bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-accent rounded-lg border border-border">
          <span className="text-sm font-medium">{selectedIds.size} solicitação(ões) selecionada(s)</span>
          {podeAprovarLote && (
            <Button size="sm" onClick={() => { setSelectedPrioridade(""); setApprovalRessalva(""); setApprovalOpen(true); }}>
              <CheckCircle2 className="mr-2 h-4 w-4" />Aprovar selecionadas
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={selectAll}>
            Selecionar todas ({filtered.length})
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Limpar seleção</Button>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">
                <Checkbox
                  checked={allPageSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Selecionar todos da página"
                />
              </TableHead>
              <TableHead className="w-16">Nº</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Descrição do Serviço</TableHead>
              <TableHead className="w-36">Data/Hora</TableHead>
              <TableHead className="w-28 text-center">Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  <ClipboardCheck className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  Nenhuma solicitação aguardando aprovação
                </TableCell>
              </TableRow>
            ) : paginated.map((s, idx) => (
              <TableRow key={s.id} className={selectedIds.has(s.id) ? "bg-accent/50" : (idx % 2 === 1 ? "bg-gray-200/60 hover:bg-gray-200/80" : "bg-white hover:bg-gray-100/60")}>
                <TableCell className="text-center">
                  <Checkbox
                    checked={selectedIds.has(s.id)}
                    onCheckedChange={() => toggleSelect(s.id)}
                    aria-label={`Selecionar SS ${s.numero}`}
                  />
                </TableCell>
                <TableCell className="font-mono font-bold">{formatNumeroAno(s.numero, s.createdAt)}</TableCell>
                <TableCell>{s.clienteNome || "—"}</TableCell>
                <TableCell className="text-sm">
                  {[s.localDescricao, s.pavimentoDescricao, s.setorDescricao].filter(Boolean).join(" › ") || "—"}
                </TableCell>
                <TableCell className="text-sm max-w-[300px] truncate">{s.descricaoServicos || "—"}</TableCell>
                <TableCell className="text-sm">{s.dataHoraSolicitacao || (s.createdAt ? new Date(s.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—")}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{s.tipo || "—"}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        currentPage={page}
        totalItems={filtered.length}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />

      {/* Approval Dialog */}
      <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aprovar {selectedIds.size} Solicitação(ões) em Lote</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label className="font-bold">Selecione o nível de prioridade para todas:</Label>
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
            <div className="space-y-2">
              <Label htmlFor="ressalva-aprovacao-lote">Ressalva de aprovação</Label>
              <Textarea
                id="ressalva-aprovacao-lote"
                rows={3}
                value={approvalRessalva}
                onChange={e => setApprovalRessalva(e.target.value)}
                placeholder="Informe observações ou ressalvas sobre a aprovação em lote (opcional)"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Todas as solicitações selecionadas serão aprovadas com a mesma prioridade e uma Ordem de Serviço será criada para cada uma.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalOpen(false)}>Cancelar</Button>
            <Button onClick={handleBatchApprove} disabled={!selectedPrioridade || approving}>
              {approving ? "Aprovando..." : "Confirmar Aprovação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
