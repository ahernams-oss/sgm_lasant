import { useState, useMemo } from "react";
import { useSco, emptyScoForm, tiposSco, TipoSco } from "@/contexts/ScoContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Sco() {
  const { scos, addSco, updateSco, deleteSco } = useSco();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyScoForm);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("todos");

  const filtered = useMemo(() => {
    return scos.filter((s) => {
      const matchSearch =
        s.codSco.toLowerCase().includes(search.toLowerCase()) ||
        s.descricaoSco.toLowerCase().includes(search.toLowerCase());
      const matchTipo = filterTipo === "todos" || s.tipo === filterTipo;
      return matchSearch && matchTipo;
    });
  }, [scos, search, filterTipo]);

  const openNew = () => {
    setForm(emptyScoForm);
    setEditId(null);
    setOpen(true);
  };

  const openEdit = (s: typeof scos[0]) => {
    setForm({ codSco: s.codSco, descricaoSco: s.descricaoSco, unidade: s.unidade, tipo: s.tipo });
    setEditId(s.id);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.codSco.trim() || !form.descricaoSco.trim()) {
      toast({ title: "Preencha código e descrição", variant: "destructive" });
      return;
    }
    if (editId) {
      updateSco(editId, form);
      toast({ title: "Item atualizado com sucesso" });
    } else {
      addSco(form);
      toast({ title: "Item cadastrado com sucesso" });
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteSco(id);
    toast({ title: "Item removido" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">SCO / SINAPI / EMOP</h1>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Novo Item
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {tiposSco.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum item encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono">{s.codSco}</TableCell>
                  <TableCell>{s.descricaoSco}</TableCell>
                  <TableCell>{s.unidade}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      s.tipo === "SCO" ? "bg-primary/10 text-primary" :
                      s.tipo === "SINAPI" ? "bg-accent text-accent-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {s.tipo}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Item" : "Novo Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Código SCO *</Label>
              <Input value={form.codSco} onChange={(e) => setForm({ ...form, codSco: e.target.value })} />
            </div>
            <div>
              <Label>Descrição *</Label>
              <Input value={form.descricaoSco} onChange={(e) => setForm({ ...form, descricaoSco: e.target.value })} />
            </div>
            <div>
              <Label>Unidade</Label>
              <Input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} placeholder="Ex: m², un, kg" />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as TipoSco })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposSco.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>{editId ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
