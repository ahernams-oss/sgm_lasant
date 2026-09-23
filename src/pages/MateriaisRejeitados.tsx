import { useState, useMemo } from "react";
import { loadPersistedFilters, usePersistFilters } from "@/lib/persistedFilters";
import PaginationControls, { paginate } from "@/components/PaginationControls";
import { matchNumero } from "@/lib/matchNumero";
import { usePedidoCompra } from "@/contexts/PedidoCompraContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Ban, FileText, FileSpreadsheet } from "lucide-react";
import { gerarPdfFinanceiro, gerarExcelFinanceiro, FinReport } from "@/lib/gerarRelatoriosFinanceiros";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dt = (iso?: string) => {
  if (!iso) return "-";
  try { return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); } catch { return "-"; }
};

const statusColors: Record<string, string> = {
  "Recebimento Rejeitado": "bg-red-100 text-red-800",
  "Rejeição Parcial": "bg-orange-100 text-orange-800",
};

interface LinhaRejeicao {
  key: string;
  pedidoId: string;
  pedidoNumero: number;
  fornecedorNome: string;
  requisicaoNumero: number;
  statusPedido: string;
  descricao: string;
  quantidade: number;
  unidadeMedida: string;
  precoUnitario: number;
  valor: number;
  motivo: string;
  usuario: string;
  dataHora: string;
}

export default function MateriaisRejeitadosPage() {
  const { pedidos } = usePedidoCompra();

  const saved = loadPersistedFilters<{ search: string; filterStatus: string; ini: string; fim: string }>("mat_rejeitados_filters_v1");
  const [search, setSearch] = useState(saved?.search ?? "");
  const [filterStatus, setFilterStatus] = useState(saved?.filterStatus ?? "Todos");
  const [ini, setIni] = useState(saved?.ini ?? "");
  const [fim, setFim] = useState(saved?.fim ?? "");
  usePersistFilters("mat_rejeitados_filters_v1", { search, filterStatus, ini, fim });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const linhas = useMemo<LinhaRejeicao[]>(() => {
    const out: LinhaRejeicao[] = [];
    for (const p of pedidos) {
      for (const [idx, r] of (p.itensRejeitados ?? []).entries()) {
        out.push({
          key: `${p.id}-${r.itemId}-${idx}`,
          pedidoId: p.id,
          pedidoNumero: p.numero,
          fornecedorNome: p.fornecedorNome,
          requisicaoNumero: p.requisicaoNumero,
          statusPedido: p.status,
          descricao: r.descricao,
          quantidade: r.quantidade,
          unidadeMedida: r.unidadeMedida,
          precoUnitario: r.precoUnitario,
          valor: r.valor,
          motivo: r.motivo,
          usuario: r.usuario,
          dataHora: r.dataHora,
        });
      }
    }
    return out.sort((a, b) => (b.dataHora || "").localeCompare(a.dataHora || ""));
  }, [pedidos]);

  const filtradas = useMemo(() => {
    const dIni = ini ? new Date(`${ini}T00:00:00`) : null;
    const dFim = fim ? new Date(`${fim}T23:59:59`) : null;
    const s = search.trim().toLowerCase();
    return linhas.filter(l => {
      if (filterStatus !== "Todos" && l.statusPedido !== filterStatus) return false;
      if (dIni || dFim) {
        const d = l.dataHora ? new Date(l.dataHora) : null;
        if (!d) return false;
        if (dIni && d < dIni) return false;
        if (dFim && d > dFim) return false;
      }
      if (!s) return true;
      return (
        l.descricao.toLowerCase().includes(s) ||
        l.fornecedorNome.toLowerCase().includes(s) ||
        l.motivo.toLowerCase().includes(s) ||
        l.usuario.toLowerCase().includes(s) ||
        matchNumero(l.pedidoNumero, s) ||
        matchNumero(l.requisicaoNumero, s)
      );
    });
  }, [linhas, search, filterStatus, ini, fim]);

  const totalValor = filtradas.reduce((sum, l) => sum + (l.valor || 0), 0);
  const pedidosAfetados = new Set(filtradas.map(l => l.pedidoId)).size;

  const { pageItems, totalPages } = paginate(filtradas, page, pageSize);

  const buildReport = (): FinReport => ({
    titulo: "Materiais Rejeitados",
    subtitulo: "SGM Lasant — Departamento de Compras",
    filtros: [
      search ? `Busca: ${search}` : "",
      `Status: ${filterStatus}`,
      ini || fim ? `Período: ${ini || "..."} a ${fim || "..."}` : "",
    ].filter(Boolean) as string[],
    colunas: ["Ordem de Compra", "RC", "Fornecedor", "Item", "Qtd", "Valor rejeitado", "Motivo", "Rejeitado por", "Data", "Status"],
    linhas: filtradas.map(l => [
      `OC-${String(l.pedidoNumero).padStart(4, "0")}`,
      `RC-${String(l.requisicaoNumero).padStart(4, "0")}`,
      l.fornecedorNome,
      l.descricao,
      `${l.quantidade} ${l.unidadeMedida}`,
      brl(l.valor),
      l.motivo,
      l.usuario,
      dt(l.dataHora),
      l.statusPedido,
    ]),
    totais: [
      { label: "Itens rejeitados", valor: String(filtradas.length) },
      { label: "Ordens de compra afetadas", valor: String(pedidosAfetados) },
      { label: "Valor rejeitado", valor: brl(totalValor) },
    ],
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Ban className="h-6 w-6 text-destructive" />Mat. Rejeitados</h1>
          <p className="text-sm text-muted-foreground">Materiais rejeitados no recebimento, vinculados à Ordem de Compra — informação para o Departamento de Compras.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={filtradas.length === 0} onClick={() => gerarPdfFinanceiro(buildReport(), "landscape")}>
            <FileText className="h-4 w-4 mr-1" />PDF
          </Button>
          <Button variant="outline" disabled={filtradas.length === 0} onClick={() => gerarExcelFinanceiro(buildReport())}>
            <FileSpreadsheet className="h-4 w-4 mr-1" />Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Itens Rejeitados</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{filtradas.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Ordens de Compra Afetadas</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{pedidosAfetados}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Valor Rejeitado</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-destructive">{brl(totalValor)}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Buscar por OC, RC, fornecedor, item, motivo..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Rejeição Parcial">Rejeição Parcial</SelectItem>
                  <SelectItem value="Recebimento Rejeitado">Recebimento Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">De</Label>
              <Input type="date" className="w-40" value={ini} onChange={(e) => { setIni(e.target.value); setPage(1); }} />
            </div>
            <div>
              <Label className="text-xs">até</Label>
              <Input type="date" className="w-40" value={fim} onChange={(e) => { setFim(e.target.value); setPage(1); }} />
            </div>
            {(ini || fim) && <Button variant="ghost" onClick={() => { setIni(""); setFim(""); }}>Limpar datas</Button>}
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem de Compra</TableHead>
                  <TableHead>RC</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-right">Valor rejeitado</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Rejeitado por</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status do Pedido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Nenhum material rejeitado encontrado.</TableCell></TableRow>
                )}
                {pageItems.map(l => (
                  <TableRow key={l.key}>
                    <TableCell className="font-medium">OC-{String(l.pedidoNumero).padStart(4, "0")}</TableCell>
                    <TableCell>RC-{String(l.requisicaoNumero).padStart(4, "0")}</TableCell>
                    <TableCell>{l.fornecedorNome}</TableCell>
                    <TableCell className="text-sm">{l.descricao}</TableCell>
                    <TableCell className="text-center text-sm">{l.quantidade} {l.unidadeMedida}</TableCell>
                    <TableCell className="text-right font-medium text-destructive">{brl(l.valor)}</TableCell>
                    <TableCell className="text-sm max-w-[280px] whitespace-pre-wrap">{l.motivo}</TableCell>
                    <TableCell className="text-sm">{l.usuario}</TableCell>
                    <TableCell className="text-sm">{dt(l.dataHora)}</TableCell>
                    <TableCell><Badge className={statusColors[l.statusPedido] ?? ""} variant="secondary">{l.statusPedido}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <PaginationControls page={page} totalPages={totalPages} pageSize={pageSize} total={filtradas.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </CardContent>
      </Card>
    </div>
  );
}
