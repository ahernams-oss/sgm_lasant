import { useState, useMemo } from "react";
import { useMateriaisServicos, MaterialServico } from "@/contexts/MateriaisServicosContext";
import { useCategoriasCompras } from "@/contexts/CategoriasComprasContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Upload, FileText, FileSpreadsheet, ChevronLeft, ChevronRight } from "lucide-react";
import { gerarPdfMateriaisServicos, gerarExcelMateriaisServicos } from "@/lib/gerarRelatorioMateriaisServicos";
import * as XLSX from "xlsx";

const UNIDADES = ["UN", "M", "M²", "M³", "KG", "L", "CX", "PCT", "SC", "GL", "HR", "VB", "JG", "PR", "RL", "TB", "FD", "BD", "CJ", "DZ"];

export default function MateriaisServicosPage() {
  const { materiais, addMaterial, updateMaterial, deleteMaterial } = useMateriaisServicos();
  const { classes, getDescricaoCompleta } = useCategoriasCompras();
  
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ descricao: "", tipo: "Material" as "Material" | "Serviço", unidadeMedida: "UN", categoriaId: "", estoqueMinimo: 0 });
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("Todos");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const filtered = useMemo(() => {
    let list = materiais;
    if (filterTipo !== "Todos") list = list.filter(m => m.tipo === filterTipo);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(m => m.codigo.toLowerCase().includes(s) || m.descricao.toLowerCase().includes(s));
    }
    return list;
  }, [materiais, search, filterTipo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  // Reset page when filters change
  const resetPage = () => setPage(1);

  const openNew = () => { setForm({ descricao: "", tipo: "Material", unidadeMedida: "UN", categoriaId: "", estoqueMinimo: 0 }); setEditingId(null); setDialogOpen(true); };
  const openEdit = (m: MaterialServico) => { setForm({ descricao: m.descricao, tipo: m.tipo, unidadeMedida: m.unidadeMedida, categoriaId: m.categoriaId, estoqueMinimo: m.estoqueMinimo }); setEditingId(m.id); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.descricao.trim()) { toast({ title: "Descrição é obrigatória", variant: "destructive" }); return; }
    if (editingId) {
      updateMaterial(editingId, { ...form, fabricanteId: "" });
      toast({ title: "Material/Serviço atualizado" });
    } else {
      addMaterial({ ...form, fabricanteId: "", estoqueMinimo: form.estoqueMinimo });
      toast({ title: "Material/Serviço criado" });
    }
    setDialogOpen(false);
  };

  const handleImport = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const reader = new FileReader();
    if (ext === "csv" || ext === "txt") {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter(l => l.trim());
        let count = 0;
        for (const line of lines) {
          const cols = line.split(/[;\t,]/).map(c => c.trim());
          if (cols[0]?.toLowerCase().includes("cod")) continue;
          if (cols.length >= 2) {
            addMaterial({ descricao: cols[1] || cols[0] || "", tipo: (cols[2] === "Serviço" ? "Serviço" : "Material"), unidadeMedida: cols[3] || "UN", categoriaId: cols[4] || "", fabricanteId: "", estoqueMinimo: 0 });
            count++;
          }
        }
        toast({ title: `${count} itens importados` });
      };
      reader.readAsText(file);
    } else {
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        let count = 0;
        for (const row of rows) {
          if (String(row[0] || "").toLowerCase().includes("cod")) continue;
          if (row.length >= 2) {
            addMaterial({ descricao: String(row[1] || row[0] || ""), tipo: (String(row[2] || "") === "Serviço" ? "Serviço" : "Material"), unidadeMedida: String(row[3] || "UN"), categoriaId: String(row[4] || ""), fabricanteId: "", estoqueMinimo: 0 });
            count++;
          }
        }
        toast({ title: `${count} itens importados` });
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const catNome = (id: string) => id ? getDescricaoCompleta(id) || "-" : "-";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Materiais e Serviços</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => gerarPdfMateriaisServicos({ materiais: filtered, getCatNome: catNome })}><FileText className="mr-2 h-4 w-4" />PDF</Button>
          <Button variant="outline" onClick={() => gerarExcelMateriaisServicos({ materiais: filtered, getCatNome: catNome })}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel</Button>
          <Button variant="outline" onClick={() => document.getElementById("import-mat")?.click()}><Upload className="mr-2 h-4 w-4" />Importar</Button>
          <input id="import-mat" type="file" accept=".xlsx,.xls,.csv,.txt" className="hidden" onChange={e => { if (e.target.files?.[0]) handleImport(e.target.files[0]); e.target.value = ""; }} />
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Novo</Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => { setSearch(e.target.value); resetPage(); }} className="pl-9" />
        </div>
        <Select value={filterTipo} onValueChange={v => { setFilterTipo(v); resetPage(); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="Material">Material</SelectItem>
            <SelectItem value="Serviço">Serviço</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum item cadastrado</TableCell></TableRow>
            ) : paginated.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-mono">{m.codigo}</TableCell>
                <TableCell>{m.descricao}</TableCell>
                <TableCell>{m.tipo}</TableCell>
                <TableCell>{m.unidadeMedida}</TableCell>
                <TableCell>{catNome(m.categoriaId)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { deleteMaterial(m.id); toast({ title: "Excluído" }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Mostrando {(safeCurrentPage - 1) * PAGE_SIZE + 1}–{Math.min(safeCurrentPage * PAGE_SIZE, filtered.length)} de {filtered.length} itens
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={safeCurrentPage <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />Anterior
            </Button>
            <span className="text-sm font-medium">Página {safeCurrentPage} de {totalPages}</span>
            <Button variant="outline" size="sm" disabled={safeCurrentPage >= totalPages} onClick={() => setPage(p => p + 1)}>
              Próxima<ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Editar" : "Novo"} Material/Serviço</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Descrição *</Label><Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descrição obrigatória" /></div>
            <div><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Material">Material</SelectItem><SelectItem value="Serviço">Serviço</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Unidade de Medida</Label>
              <Select value={form.unidadeMedida} onValueChange={v => setForm(f => ({ ...f, unidadeMedida: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Categoria</Label>
              <Select value={form.categoriaId} onValueChange={v => setForm(f => ({ ...f, categoriaId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{getDescricaoCompleta(c.id)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Estoque Mínimo</Label><Input type="number" min="0" value={form.estoqueMinimo} onChange={e => setForm(f => ({ ...f, estoqueMinimo: Number(e.target.value) }))} placeholder="0" /></div>
          </div>
          <DialogFooter><Button onClick={handleSave}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
