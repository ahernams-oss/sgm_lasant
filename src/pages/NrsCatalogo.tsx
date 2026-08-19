import { useState, useMemo } from "react";
import { ShieldCheck, Plus, Search, Trash2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { DoubleConfirmDelete, useDoubleConfirmDelete } from "@/components/DoubleConfirmDelete";
import PaginationControls, { paginate } from "@/components/PaginationControls";
import { useNrsCatalogo, NrCatalogo } from "@/contexts/NrsCatalogoContext";
import { usePermissao } from "@/hooks/usePermissao";

const emptyForm = { codigo: "", descricao: "", dataValidade: "" };

const formatData = (d: string) => (d ? d.split("-").reverse().join("/") : "—");

export default function NrsCatalogoPage() {
  const { nrs, addNr, updateNr, deleteNr } = useNrsCatalogo();
  const { tem } = usePermissao();
  const podeCriar = tem("cargos.criar");
  const podeEditar = tem("cargos.editar");
  const podeExcluir = tem("cargos.excluir");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { deleteId, requestDelete, cancelDelete } = useDoubleConfirmDelete();

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const reset = () => { setForm(emptyForm); setEditingId(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId ? !podeEditar : !podeCriar) { toast.error("Você não possui permissão para esta ação."); return; }
    if (!form.codigo.trim()) { toast.error("Informe o código/nome da NR."); return; }
    if (!form.descricao.trim()) { toast.error("Informe a descrição da NR."); return; }
    const payload = {
      codigo: form.codigo.trim(),
      descricao: form.descricao.trim(),
      dataValidade: form.dataValidade,
    };
    if (editingId) {
      await updateNr(editingId, payload);
      toast.success("NR atualizada!");
    } else {
      await addNr(payload);
      toast.success("NR cadastrada!");
    }
    reset();
  };

  const startEdit = (nr: NrCatalogo) => {
    setEditingId(nr.id);
    setForm({ codigo: nr.codigo, descricao: nr.descricao, dataValidade: nr.dataValidade });
  };

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return nrs;
    return nrs.filter((n) =>
      n.codigo.toLowerCase().includes(s) || n.descricao.toLowerCase().includes(s)
    );
  }, [nrs, search]);

  const { paginated } = paginate(filtered, page, pageSize);

  return (
    <div className="bg-background">
      <div className="container max-w-full mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-primary mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Cadastro</span>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">Cadastro de NRs</h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            Cadastre as Normas Regulamentadoras com código/nome, descrição e data de validade.
          </p>
        </div>

        <div className="section-card mb-6">
          <h2 className="section-title">{editingId ? "Editar NR" : "Nova NR"}</h2>
          <form onSubmit={submit} className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label className="field-label">Cod/Nome NR *</label>
              <Input value={form.codigo} onChange={(e) => update("codigo", e.target.value)} placeholder="Ex: NR-06" />
            </div>
            <div className="md:col-span-2">
              <label className="field-label">Data de Validade</label>
              <Input type="date" value={form.dataValidade} onChange={(e) => update("dataValidade", e.target.value)} />
            </div>
            <div className="md:col-span-6">
              <label className="field-label">Descrição da NR *</label>
              <Textarea rows={2} value={form.descricao} onChange={(e) => update("descricao", e.target.value)} placeholder="Ex: Equipamentos de Proteção Individual" />
            </div>
            <div className="md:col-span-6 flex gap-2">
              <Button type="submit" className="gap-2">
                <Plus className="h-4 w-4" />
                {editingId ? "Salvar Alterações" : "Adicionar NR"}
              </Button>
              {editingId && <Button type="button" variant="outline" onClick={reset}>Cancelar</Button>}
            </div>
          </form>
        </div>

        <div className="section-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="section-title mb-0">NRs Cadastradas ({filtered.length})</h2>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Pesquisar..." className="pl-9 h-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>

          {paginated.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">Nenhuma NR cadastrada.</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Cod/Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-36 text-center">Validade</TableHead>
                    <TableHead className="w-24 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((nr, idx) => (
                    <TableRow key={nr.id} className={idx % 2 === 1 ? "bg-gray-200/60" : "bg-white"}>
                      <TableCell className="font-medium">{nr.codigo}</TableCell>
                      <TableCell>{nr.descricao}</TableCell>
                      <TableCell className="text-center text-sm">{formatData(nr.dataValidade)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(nr)} title="Editar">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => requestDelete(nr.id)} className="text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <PaginationControls currentPage={page} totalItems={filtered.length} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </div>
      </div>

      <DoubleConfirmDelete
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) cancelDelete(); }}
        onConfirm={async () => {
          if (!podeExcluir) { toast.error("Você não possui permissão para esta ação."); cancelDelete(); return; }
          if (deleteId) { await deleteNr(deleteId); toast.success("NR removida."); }
          cancelDelete();
        }}
      />
    </div>
  );
}
