import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCotacaoCompras } from "@/contexts/CotacaoComprasContext";
import { useRequisicaoCompras, ItemRequisicaoCompras } from "@/contexts/RequisicaoComprasContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Search, ChevronDown, ChevronRight, Layers, TrendingUp, Combine } from "lucide-react";
import { usePermissao } from "@/hooks/usePermissao";

interface OrigemItem {
  cotacaoId: string;
  cotacaoNumero: number;
  requisicaoId: string;
  requisicaoNumero: number;
  solicitante: string;
  centroCustoNome: string;
  itemId: string;
  quantidade: number;
  unidadeMedida: string;
  descricao: string;
  especificacaoTecnica: string;
}

interface GrupoItem {
  materialId: string;
  descricao: string;
  unidadeMedida: string;
  quantidadeTotal: number;
  origens: OrigemItem[];
}

export default function InteligenciaComprasPage() {
  const { cotacoes, addCotacao } = useCotacaoCompras();
  const { requisicoes, addRequisicao, updateStatus } = useRequisicaoCompras();
  const { usuarioLogado } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { tem } = usePermissao();
  const podeAglutinar = tem("inteligencia_compras.aglutinar");

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Apenas cotações abertas (Em Andamento / Aguardando Aprovação)
  const grupos = useMemo<GrupoItem[]>(() => {
    const cotsAbertas = cotacoes.filter(c => c.status === "Em Andamento" || c.status === "Aguardando Aprovação");
    const map = new Map<string, GrupoItem>();

    for (const cot of cotsAbertas) {
      const req = requisicoes.find(r => r.id === cot.requisicaoId);
      if (!req) continue;
      for (const item of req.itens) {
        if (!item.materialId) continue; // critério: apenas itens de catálogo
        const key = item.materialId;
        const origem: OrigemItem = {
          cotacaoId: cot.id,
          cotacaoNumero: cot.numero,
          requisicaoId: req.id,
          requisicaoNumero: req.numero,
          solicitante: req.solicitante,
          centroCustoNome: req.centroCustoNome,
          itemId: item.id,
          quantidade: item.quantidade,
          unidadeMedida: item.unidadeMedida,
          descricao: item.descricao,
          especificacaoTecnica: item.especificacaoTecnica,
        };
        const existing = map.get(key);
        if (existing) {
          existing.quantidadeTotal += item.quantidade;
          existing.origens.push(origem);
        } else {
          map.set(key, {
            materialId: item.materialId,
            descricao: item.descricao,
            unidadeMedida: item.unidadeMedida,
            quantidadeTotal: item.quantidade,
            origens: [origem],
          });
        }
      }
    }

    // só interessam grupos com 2+ origens (potencial de aglutinação)
    return Array.from(map.values())
      .filter(g => g.origens.length >= 2)
      .sort((a, b) => b.quantidadeTotal - a.quantidadeTotal);
  }, [cotacoes, requisicoes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return grupos;
    return grupos.filter(g => g.descricao.toLowerCase().includes(q) || g.materialId.toLowerCase().includes(q));
  }, [grupos, search]);

  const selectedGroups = filtered.filter(g => selected[g.materialId]);
  const totalItensConsolidados = selectedGroups.length;
  const totalQuantidade = selectedGroups.reduce((sum, g) => sum + g.quantidadeTotal, 0);
  const totalRCs = new Set(selectedGroups.flatMap(g => g.origens.map(o => o.requisicaoId))).size;

  const toggleSelectAll = (val: boolean) => {
    const novo: Record<string, boolean> = {};
    if (val) filtered.forEach(g => { novo[g.materialId] = true; });
    setSelected(novo);
  };

  const handleConsolidar = async () => {
    if (selectedGroups.length === 0) {
      toast({ title: "Selecione ao menos 1 item para consolidar", variant: "destructive" });
      return;
    }

    // Cria uma RC consolidada agrupando os itens
    const rcsOrigem = [...new Set(selectedGroups.flatMap(g => g.origens.map(o => o.requisicaoNumero)))].sort((a, b) => a - b);
    const itensConsolidados: ItemRequisicaoCompras[] = selectedGroups.map(g => ({
      id: crypto.randomUUID(),
      materialId: g.materialId,
      descricao: g.descricao,
      especificacaoTecnica: g.origens[0]?.especificacaoTecnica || "",
      observacao: `Consolidado de ${g.origens.length} requisições: RC ${g.origens.map(o => o.requisicaoNumero).join(", ")}`,
      quantidade: g.quantidadeTotal,
      unidadeMedida: g.unidadeMedida,
    }));

    const justificativa = `Cotação consolidada gerada via Inteligência de Compras. Origem: RC ${rcsOrigem.join(", ")}. Objetivo: aumentar poder de barganha unificando volumes.`;

    await addRequisicao({
      solicitante: usuarioLogado?.nome || "Inteligência de Compras",
      centroCusto: "CONSOLIDADO",
      centroCustoNome: "Consolidado (Múltiplos CCs)",
      localEntrega: "",
      justificativa,
      urgencia: "Normal",
      prazoDesejado: "",
      itens: itensConsolidados,
      anexos: [],
    });

    // Anota nas RCs originais (apenas registro no histórico)
    for (const grupo of selectedGroups) {
      const reqsUnicos = [...new Set(grupo.origens.map(o => o.requisicaoId))];
      for (const reqId of reqsUnicos) {
        const r = requisicoes.find(x => x.id === reqId);
        if (!r) continue;
        await updateStatus(reqId, r.status, usuarioLogado?.nome || "Inteligência",
          `Item "${grupo.descricao}" incluído em cotação consolidada (Inteligência de Compras)`);
      }
    }

    toast({ title: `Requisição consolidada criada com ${itensConsolidados.length} item(ns) de ${rcsOrigem.length} RC(s).` });
    setConfirmOpen(false);
    setSelected({});
    navigate("/compras/requisicoes");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Inteligência de Compras</h1>
          <p className="text-sm text-muted-foreground">
            Aglutina itens iguais de cotações em andamento para aumentar poder de barganha pela escala.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Itens com potencial</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{grupos.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Selecionados</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalItensConsolidados}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Volume consolidado</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalQuantidade.toLocaleString("pt-BR")}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">RCs envolvidas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalRCs}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> Itens aglutináveis</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Button onClick={() => setConfirmOpen(true)} disabled={selectedGroups.length === 0}>
              <Combine className="h-4 w-4 mr-2" /> Gerar Cotação Consolidada
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum item duplicado encontrado em cotações abertas no momento.</p>
              <p className="text-xs mt-1">A intelligência considera apenas itens vinculados ao catálogo de materiais.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filtered.length > 0 && filtered.every(g => selected[g.materialId])}
                      onCheckedChange={(v) => toggleSelectAll(!!v)}
                    />
                  </TableHead>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Origens</TableHead>
                  <TableHead className="text-right">Qtd. Total</TableHead>
                  <TableHead>UN</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((g) => (
                  <Collapsible key={g.materialId} open={!!expanded[g.materialId]} onOpenChange={(v) => setExpanded(p => ({ ...p, [g.materialId]: v }))} asChild>
                    <>
                      <TableRow>
                        <TableCell>
                          <Checkbox
                            checked={!!selected[g.materialId]}
                            onCheckedChange={(v) => setSelected(p => ({ ...p, [g.materialId]: !!v }))}
                          />
                        </TableCell>
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              {expanded[g.materialId] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="font-medium">{g.descricao}</TableCell>
                        <TableCell className="text-center"><Badge variant="secondary">{g.origens.length}</Badge></TableCell>
                        <TableCell className="text-right font-semibold">{g.quantidadeTotal.toLocaleString("pt-BR")}</TableCell>
                        <TableCell>{g.unidadeMedida}</TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/30 p-0">
                            <div className="p-4">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Cotação</TableHead>
                                    <TableHead>RC</TableHead>
                                    <TableHead>Solicitante</TableHead>
                                    <TableHead>Centro de Custo</TableHead>
                                    <TableHead className="text-right">Qtd.</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {g.origens.map((o, i) => (
                                    <TableRow key={i}>
                                      <TableCell>COT-{String(o.cotacaoNumero).padStart(4, "0")}</TableCell>
                                      <TableCell>RC-{String(o.requisicaoNumero).padStart(4, "0")}</TableCell>
                                      <TableCell>{o.solicitante}</TableCell>
                                      <TableCell>{o.centroCustoNome}</TableCell>
                                      <TableCell className="text-right">{o.quantidade.toLocaleString("pt-BR")} {o.unidadeMedida}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Cotação Consolidada</DialogTitle>
            <DialogDescription>
              Será criada uma <strong>nova Requisição de Compras consolidada</strong> contendo {totalItensConsolidados} item(ns), totalizando {totalQuantidade.toLocaleString("pt-BR")} unidades, agrupadas de {totalRCs} RC(s).
              <br /><br />
              As RCs originais permanecerão ativas — registramos no histórico delas a inclusão na consolidação para rastreabilidade. Você poderá cancelar as cotações originais após a nova ser concluída.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={handleConsolidar}>Confirmar e Consolidar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
