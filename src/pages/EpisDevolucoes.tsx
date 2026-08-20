import { useMemo, useState } from "react";
import { HardHat, Search, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useFuncionarios, EpiItem } from "@/contexts/FuncionariosContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useCargos } from "@/contexts/CargosContext";
import {
  useEpisDevolucoes,
  MOTIVOS_DEVOLUCAO,
  CONDICOES_EPI,
  DESTINOS_EPI,
} from "@/contexts/EpisDevolucoesContext";
import { useAuth } from "@/contexts/AuthContext";
import DoubleConfirmDelete from "@/components/DoubleConfirmDelete";
import PaginationControls, { paginate } from "@/components/PaginationControls";
import { toast } from "sonner";

const fmt = (d: string) => (d ? d.slice(0, 10).split("-").reverse().join("/") : "—");

export default function EpisDevolucoes() {
  const { funcionarios } = useFuncionarios();
  const { clientes } = useClientes();
  const { cargos } = useCargos();
  const { devolucoes, addDevolucao, deleteDevolucao } = useEpisDevolucoes();
  const auth = useAuth() as any;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filtroMotivo, setFiltroMotivo] = useState("todos");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [funcionarioId, setFuncionarioId] = useState("");
  const [epiItemId, setEpiItemId] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [dataDevolucao, setDataDevolucao] = useState(new Date().toISOString().slice(0, 10));
  const [motivo, setMotivo] = useState("Desgaste");
  const [condicao, setCondicao] = useState("Desgastado");
  const [destino, setDestino] = useState("Descarte");
  const [observacao, setObservacao] = useState("");

  const funcSel = funcionarios.find((f) => f.id === funcionarioId);
  const episFunc = ((funcSel?.epis as EpiItem[] | null) || []);

  const nomeFunc = (id: string) => funcionarios.find((f) => f.id === id)?.nome || "—";
  const clienteFunc = (id: string) => {
    const f = funcionarios.find((x) => x.id === id);
    return clientes.find((c) => c.id === f?.clienteId)?.nome || "—";
  };
  const cargoFunc = (id: string) => {
    const f = funcionarios.find((x) => x.id === id);
    return cargos.find((c: any) => c.id === f?.cargoId)?.nome || "—";
  };

  const limparForm = () => {
    setFuncionarioId(""); setEpiItemId(""); setQuantidade("1");
    setDataDevolucao(new Date().toISOString().slice(0, 10));
    setMotivo("Desgaste"); setCondicao("Desgastado"); setDestino("Descarte"); setObservacao("");
  };

  const salvar = async () => {
    if (!funcionarioId) { toast.error("Selecione o funcionário."); return; }
    const epi = episFunc.find((e) => e.id === epiItemId);
    if (!epi) { toast.error("Selecione o EPI a devolver."); return; }
    const qtd = Number(String(quantidade).replace(",", ".")) || 1;
    if (qtd <= 0) { toast.error("Quantidade inválida."); return; }

    await addDevolucao({
      funcionarioId,
      epiItemId: epi.id,
      codigo: "",
      descricao: epi.descricao,
      ca: epi.ca || "",
      quantidade: qtd,
      dataEntrega: epi.dataEntrega || "",
      dataDevolucao,
      motivo,
      condicao,
      destino,
      observacao,
      anexoPath: "",
      registradoPor: auth?.usuario?.nome || auth?.user?.nome || "",
    });
    toast.success("Devolução registrada no prontuário.");
    limparForm();
    setOpen(false);
  };

  const filtered = useMemo(() => {
    let r = devolucoes;
    if (filtroMotivo !== "todos") r = r.filter((d) => d.motivo === filtroMotivo);
    if (de) r = r.filter((d) => d.dataDevolucao >= de);
    if (ate) r = r.filter((d) => d.dataDevolucao <= ate);
    if (search.trim()) {
      const s = search.toLowerCase();
      r = r.filter(
        (d) =>
          nomeFunc(d.funcionarioId).toLowerCase().includes(s) ||
          d.descricao.toLowerCase().includes(s) ||
          (d.ca || "").toLowerCase().includes(s)
      );
    }
    return [...r].sort((a, b) => (b.dataDevolucao || "").localeCompare(a.dataDevolucao || ""));
  }, [devolucoes, search, filtroMotivo, de, ate, funcionarios]);

  const { paginated, safePage } = paginate(filtered, page, pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <HardHat className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Devolução de EPIs</h1>
            <p className="text-sm text-muted-foreground">Recolhimento de EPIs desgastados, danificados ou substituídos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{filtered.length} registro(s)</Badge>
          <Button size="sm" onClick={() => { limparForm(); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Nova devolução
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar funcionário, EPI ou CA..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={filtroMotivo} onValueChange={(v) => { setFiltroMotivo(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Motivo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os motivos</SelectItem>
            {MOTIVOS_DEVOLUCAO.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Devolução de</label>
          <Input type="date" className="w-[160px]" value={de} onChange={(e) => { setDe(e.target.value); setPage(1); }} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Devolução até</label>
          <Input type="date" className="w-[160px]" value={ate} onChange={(e) => { setAte(e.target.value); setPage(1); }} />
        </div>
        <Button variant="outline" size="sm" onClick={() => { setSearch(""); setFiltroMotivo("todos"); setDe(""); setAte(""); setPage(1); }}>
          Limpar filtros
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Funcionário</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>EPI</TableHead>
              <TableHead className="w-28 text-center">CA</TableHead>
              <TableHead className="w-16 text-center">Qtd</TableHead>
              <TableHead className="w-28 text-center">Entrega</TableHead>
              <TableHead className="w-28 text-center">Devolução</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Condição</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead className="w-14" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{nomeFunc(d.funcionarioId)}</TableCell>
                <TableCell>{clienteFunc(d.funcionarioId)}</TableCell>
                <TableCell>{cargoFunc(d.funcionarioId)}</TableCell>
                <TableCell>{d.descricao}</TableCell>
                <TableCell className="text-center">{d.ca || "—"}</TableCell>
                <TableCell className="text-center">{d.quantidade}</TableCell>
                <TableCell className="text-center">{fmt(d.dataEntrega)}</TableCell>
                <TableCell className="text-center">{fmt(d.dataDevolucao)}</TableCell>
                <TableCell><Badge variant="secondary">{d.motivo}</Badge></TableCell>
                <TableCell>{d.condicao || "—"}</TableCell>
                <TableCell>{d.destino || "—"}</TableCell>
                <TableCell>
                  <DoubleConfirmDelete
                    itemName={`devolução de ${d.descricao}`}
                    onConfirm={() => deleteDevolucao(d.id)}
                    trigger={
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-muted-foreground py-8">Nenhuma devolução registrada.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        currentPage={safePage}
        totalItems={filtered.length}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Registrar devolução de EPI</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>Funcionário</Label>
              <Select value={funcionarioId} onValueChange={(v) => { setFuncionarioId(v); setEpiItemId(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione o funcionário" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {[...funcionarios].sort((a, b) => a.nome.localeCompare(b.nome)).map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>EPI entregue</Label>
              <Select value={epiItemId} onValueChange={setEpiItemId} disabled={!funcionarioId}>
                <SelectTrigger><SelectValue placeholder={funcionarioId ? "Selecione o EPI" : "Escolha o funcionário primeiro"} /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {episFunc.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.descricao}{e.ca ? ` — CA ${e.ca}` : ""}{e.dataEntrega ? ` (entregue em ${fmt(e.dataEntrega)})` : ""}
                    </SelectItem>
                  ))}
                  {funcionarioId && episFunc.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum EPI cadastrado para este funcionário.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Quantidade</Label>
              <Input value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Data da devolução</Label>
              <Input type="date" value={dataDevolucao} onChange={(e) => setDataDevolucao(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Motivo</Label>
              <Select value={motivo} onValueChange={setMotivo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MOTIVOS_DEVOLUCAO.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Condição do item</Label>
              <Select value={condicao} onValueChange={setCondicao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONDICOES_EPI.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Destino</Label>
              <Select value={destino} onValueChange={setDestino}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DESTINOS_EPI.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Observação</Label>
              <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Registrar devolução</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
