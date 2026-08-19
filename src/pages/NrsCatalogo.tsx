import { useState, useMemo } from "react";
import { ShieldCheck, Plus, Search, Trash2, Pencil, Paperclip, X, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { DoubleConfirmDelete, useDoubleConfirmDelete } from "@/components/DoubleConfirmDelete";
import PaginationControls, { paginate } from "@/components/PaginationControls";
import { useNrsCatalogo, NrCatalogo, NrRevisao } from "@/contexts/NrsCatalogoContext";
import { usePermissao } from "@/hooks/usePermissao";

const emptyForm = { codigo: "", descricao: "", validadeDias: "", anexoUrl: "", anexoNome: "", observacao: "", dataPublicacao: "", dataVigencia: "" };
const emptyRev = { revisao: "", dataPublicacao: "", dataVigencia: "", observacao: "" };
const fmtData = (d?: string | null) => (d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—");



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
  const [uploading, setUploading] = useState(false);
  const [revisoes, setRevisoes] = useState<NrRevisao[]>([]);
  const [novaRev, setNovaRev] = useState(emptyRev);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Arquivo maior que 10MB."); return; }
    setUploading(true);
    try {
      const path = `nrs/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from("documentos").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("documentos").getPublicUrl(path);
      setForm((p) => ({ ...p, anexoUrl: data.publicUrl, anexoNome: file.name }));
      toast.success("Anexo enviado!");
    } catch (e: any) {
      toast.error("Erro ao enviar anexo: " + (e?.message ?? ""));
    } finally {
      setUploading(false);
    }
  };

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const reset = () => { setForm(emptyForm); setEditingId(null); setRevisoes([]); setNovaRev(emptyRev); };

  const addRevisao = () => {
    if (!novaRev.revisao.trim()) { toast.error("Informe a revisão."); return; }
    setRevisoes((p) => [...p, { ...novaRev, revisao: novaRev.revisao.trim() }]);
    setNovaRev(emptyRev);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId ? !podeEditar : !podeCriar) { toast.error("Você não possui permissão para esta ação."); return; }
    if (!form.codigo.trim()) { toast.error("Informe o código/nome da NR."); return; }
    if (!form.descricao.trim()) { toast.error("Informe a descrição da NR."); return; }
    const payload = {
      codigo: form.codigo.trim(),
      descricao: form.descricao.trim(),
      validadeDias: form.validadeDias ? Number(form.validadeDias) : null,
      anexoUrl: form.anexoUrl || null,
      anexoNome: form.anexoNome || null,
      observacao: form.observacao || null,
      dataPublicacao: form.dataPublicacao || null,
      dataVigencia: form.dataVigencia || null,
      revisoes,
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
    setForm({ codigo: nr.codigo, descricao: nr.descricao, validadeDias: nr.validadeDias != null ? String(nr.validadeDias) : "", anexoUrl: nr.anexoUrl ?? "", anexoNome: nr.anexoNome ?? "", observacao: nr.observacao ?? "", dataPublicacao: nr.dataPublicacao ?? "", dataVigencia: nr.dataVigencia ?? "" });
    setRevisoes(nr.revisoes ?? []);
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
            Cadastre as Normas Regulamentadoras com código/nome, descrição e validade em dias.
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
              <label className="field-label">Validade (dias)</label>
              <Input type="number" min={0} value={form.validadeDias} onChange={(e) => update("validadeDias", e.target.value)} placeholder="Ex: 365" />
            </div>
            <div className="md:col-span-2">
              <label className="field-label">Anexo (documento ou imagem)</label>
              {form.anexoUrl ? (
                <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-border bg-muted/40">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <a href={form.anexoUrl} target="_blank" rel="noreferrer" className="text-sm truncate text-primary hover:underline flex-1">
                    {form.anexoNome || "Ver anexo"}
                  </a>
                  <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setForm((p) => ({ ...p, anexoUrl: "", anexoNome: "" }))}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Input type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" disabled={uploading} onChange={(e) => handleUpload(e.target.files?.[0])} />
              )}
            </div>
            <div className="md:col-span-3">
              <label className="field-label">Data de Publicação</label>
              <Input type="date" value={form.dataPublicacao} onChange={(e) => update("dataPublicacao", e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <label className="field-label">Data de Vigência</label>
              <Input type="date" value={form.dataVigencia} onChange={(e) => update("dataVigencia", e.target.value)} />
            </div>
            <div className="md:col-span-6">
              <label className="field-label">Observação</label>
              <Textarea rows={2} value={form.observacao} onChange={(e) => update("observacao", e.target.value)} placeholder="Observações sobre a NR" />
            </div>
            <div className="md:col-span-6 rounded-lg border border-border p-3">
              <p className="text-sm font-semibold text-primary mb-2">Revisões da NR</p>
              {revisoes.length > 0 && (
                <div className="rounded-md border border-border mb-3 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32">Revisão</TableHead>
                        <TableHead className="w-36">Publicação</TableHead>
                        <TableHead className="w-36">Vigência</TableHead>
                        <TableHead>Observação</TableHead>
                        <TableHead className="w-16 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revisoes.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{r.revisao}</TableCell>
                          <TableCell>{fmtData(r.dataPublicacao)}</TableCell>
                          <TableCell>{fmtData(r.dataVigencia)}</TableCell>
                          <TableCell className="text-sm">{r.observacao || "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button type="button" size="icon" variant="ghost" className="text-destructive h-7 w-7" onClick={() => setRevisoes((p) => p.filter((_, idx) => idx !== i))}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                <div className="md:col-span-2">
                  <label className="field-label">Revisão</label>
                  <Input value={novaRev.revisao} onChange={(e) => setNovaRev((p) => ({ ...p, revisao: e.target.value }))} placeholder="Ex: 2022" />
                </div>
                <div className="md:col-span-2">
                  <label className="field-label">Publicação</label>
                  <Input type="date" value={novaRev.dataPublicacao} onChange={(e) => setNovaRev((p) => ({ ...p, dataPublicacao: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="field-label">Vigência</label>
                  <Input type="date" value={novaRev.dataVigencia} onChange={(e) => setNovaRev((p) => ({ ...p, dataVigencia: e.target.value }))} />
                </div>
                <div className="md:col-span-4">
                  <label className="field-label">Observação</label>
                  <Input value={novaRev.observacao} onChange={(e) => setNovaRev((p) => ({ ...p, observacao: e.target.value }))} placeholder="Opcional" />
                </div>
                <div className="md:col-span-2">
                  <Button type="button" variant="outline" className="w-full gap-2" onClick={addRevisao}>
                    <Plus className="h-4 w-4" /> Revisão
                  </Button>
                </div>
              </div>
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
                    <TableHead className="w-36 text-center">Validade (dias)</TableHead>
                    <TableHead className="w-32 text-center">Publicação</TableHead>
                    <TableHead className="w-32 text-center">Vigência</TableHead>
                    <TableHead className="w-24 text-center">Revisões</TableHead>
                    <TableHead className="w-24 text-center">Anexo</TableHead>
                    <TableHead className="w-24 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((nr, idx) => (
                    <TableRow key={nr.id} className={idx % 2 === 1 ? "bg-gray-200/60" : "bg-white"}>
                      <TableCell className="font-medium">{nr.codigo}</TableCell>
                      <TableCell>{nr.descricao}</TableCell>
                      <TableCell className="text-center text-sm">{nr.validadeDias != null ? `${nr.validadeDias} dias` : "—"}</TableCell>
                      <TableCell className="text-center text-sm">{fmtData(nr.dataPublicacao)}</TableCell>
                      <TableCell className="text-center text-sm">{fmtData(nr.dataVigencia)}</TableCell>
                      <TableCell className="text-center text-sm">{nr.revisoes?.length || 0}</TableCell>
                      <TableCell className="text-center">
                        {nr.anexoUrl ? (
                          <a href={nr.anexoUrl} target="_blank" rel="noreferrer" title={nr.anexoNome ?? "Anexo"} className="inline-flex text-primary hover:underline">
                            <Paperclip className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
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
