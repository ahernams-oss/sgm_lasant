import { useState, useMemo } from "react";
import { KeyRound, Trash2, Pencil, Search, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { usePerfisAcesso, MODULOS_SISTEMA, ALL_MODULE_KEYS, Permissoes } from "@/contexts/PerfisAcessoContext";
import { toast } from "sonner";

const emptyForm = { nome: "", descricao: "", permissoes: {} as Permissoes };

const PerfisAcesso = () => {
  const { perfis, addPerfil, updatePerfil, deletePerfil } = usePerfisAcesso();

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const togglePermissao = (key: string) => {
    setForm(prev => ({
      ...prev,
      permissoes: { ...prev.permissoes, [key]: !prev.permissoes[key] },
    }));
  };

  const toggleGrupo = (keys: string[], allChecked: boolean) => {
    setForm(prev => {
      const updated = { ...prev.permissoes };
      keys.forEach(k => { updated[k] = !allChecked; });
      return { ...prev, permissoes: updated };
    });
  };

  const toggleAll = () => {
    const allChecked = ALL_MODULE_KEYS.every(k => form.permissoes[k]);
    setForm(prev => {
      const updated = { ...prev.permissoes };
      ALL_MODULE_KEYS.forEach(k => { updated[k] = !allChecked; });
      return { ...prev, permissoes: updated };
    });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) { toast.error("Informe o nome do perfil."); return; }

    if (editingId) {
      await updatePerfil(editingId, form);
      toast.success("Perfil atualizado.");
    } else {
      await addPerfil(form);
      toast.success("Perfil cadastrado.");
    }
    resetForm();
  };

  const handleEdit = (p: typeof perfis[0]) => {
    setForm({ nome: p.nome, descricao: p.descricao, permissoes: { ...p.permissoes } });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDuplicate = (p: typeof perfis[0]) => {
    setForm({ nome: `${p.nome} (cópia)`, descricao: p.descricao, permissoes: { ...p.permissoes } });
    setEditingId(null);
    setShowForm(true);
    toast.info("Perfil duplicado. Edite e salve.");
  };

  const handleDelete = async (id: string) => {
    await deletePerfil(id);
    if (editingId === id) resetForm();
    toast.success("Perfil removido.");
  };

  const countPermissoes = (perms: Permissoes) =>
    ALL_MODULE_KEYS.filter(k => perms[k]).length;

  const filteredPerfis = useMemo(() => {
    if (!search.trim()) return perfis;
    const term = search.toLowerCase();
    return perfis.filter(p =>
      p.nome.toLowerCase().includes(term) || p.descricao.toLowerCase().includes(term)
    );
  }, [perfis, search]);

  const allChecked = ALL_MODULE_KEYS.every(k => form.permissoes[k]);

  return (
    <div className="bg-background">
      <div className="container max-w-full mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-2 text-primary mb-1">
            <KeyRound className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Administração</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground mb-1">Perfis de Acesso</h1>
              <p className="text-sm text-muted-foreground max-w-lg">
                Configure perfis com permissões personalizadas e vincule-os aos usuários.
              </p>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} className="shadow-md">Novo Perfil</Button>
            )}
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm animate-fade-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">Nome do Perfil *</Label>
                <Input
                  value={form.nome}
                  onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Administrador, Comprador, Operacional"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">Descrição</Label>
                <Input
                  value={form.descricao}
                  onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descrição opcional do perfil"
                />
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Permissões de Módulos</h3>
              <div className="flex items-center gap-2">
                <Switch checked={allChecked} onCheckedChange={toggleAll} />
                <span className="text-xs text-muted-foreground">
                  {allChecked ? "Desmarcar todos" : "Marcar todos"}
                </span>
              </div>
            </div>

            <div className="space-y-5">
              {MODULOS_SISTEMA.map(grupo => {
                const keys = grupo.modulos.map(m => m.key);
                const allGrupoChecked = keys.every(k => form.permissoes[k]);
                return (
                  <div key={grupo.grupo} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-foreground">{grupo.grupo}</h4>
                      <button
                        type="button"
                        onClick={() => toggleGrupo(keys, allGrupoChecked)}
                        className="text-xs text-primary hover:underline"
                      >
                        {allGrupoChecked ? "Desmarcar grupo" : "Marcar grupo"}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {grupo.modulos.map(mod => {
                        const checked = !!form.permissoes[mod.key];
                        return (
                          <label
                            key={mod.key}
                            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                              checked
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border hover:border-muted-foreground/30"
                            }`}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => togglePermissao(mod.key)}
                            />
                            <span className="text-sm font-medium text-foreground">{mod.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button type="submit" className="shadow-md">
                {editingId ? "Salvar Alterações" : "Cadastrar Perfil"}
              </Button>
            </div>
          </form>
        )}

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Perfis Cadastrados</h2>
            <div className="relative w-52">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Pesquisar perfis..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>
          {filteredPerfis.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {perfis.length === 0 ? "Nenhum perfil cadastrado." : "Nenhum resultado encontrado."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Permissões</TableHead>
                  <TableHead className="w-28 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPerfis.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{p.descricao || "—"}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {countPermissoes(p.permissoes)}/{ALL_MODULE_KEYS.length}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleDuplicate(p)} className="h-8 w-8" title="Duplicar">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(p)} className="h-8 w-8">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerfisAcesso;
