import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFuncionarios } from "@/contexts/FuncionariosContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GraduationCap, Plus, MoreHorizontal, Loader2, Check, ChevronsUpDown, CheckCircle2, Clock, PlayCircle, FileSpreadsheet, FileDown } from "lucide-react";
import { toast } from "sonner";
import { DoubleConfirmDelete } from "@/components/DoubleConfirmDelete";
import { exportarTreinamentosCsv, exportarTreinamentosPdf, type TreinamentoExportRow } from "@/lib/exportTreinamentos";

interface Treinamento {
  id: string;
  cpf: string;
  tipo: string;
  titulo: string;
  status: string;
  nota: number | null;
  concluido_em: string | null;
  created_at: string;
}

const TIPOS = [
  { v: "integracao", l: "Integração" },
  { v: "seguranca", l: "Segurança do Trabalho" },
  { v: "tecnico", l: "Técnico" },
  { v: "reciclagem", l: "Reciclagem" },
  { v: "outros", l: "Outros" },
];

const STATUS = [
  { v: "pendente", l: "Pendente" },
  { v: "em_andamento", l: "Em andamento" },
  { v: "concluido", l: "Concluído" },
];

const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");

const statusBadge = (s: string) => {
  if (s === "concluido") return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><CheckCircle2 className="w-3 h-3 mr-1" />Concluído</Badge>;
  if (s === "em_andamento") return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><PlayCircle className="w-3 h-3 mr-1" />Em andamento</Badge>;
  return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
};

interface FormState {
  id?: string;
  cpf: string;
  tipo: string;
  titulo: string;
  status: string;
  nota: string;
  concluido_em: string;
}

const emptyForm: FormState = { cpf: "", tipo: "integracao", titulo: "", status: "pendente", nota: "", concluido_em: "" };

export default function Treinamentos() {
  const { funcionarios } = useFuncionarios();
  const [list, setList] = useState<Treinamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [comboOpen, setComboOpen] = useState(false);
  const [excluirId, setExcluirId] = useState<string | null>(null);

  const nomePorCpf = useMemo(() => {
    const m = new Map<string, string>();
    funcionarios.forEach((f) => m.set(onlyDigits(f.cpf), f.nome));
    return m;
  }, [funcionarios]);

  const carregar = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("portal_treinamentos")
      .select("id, cpf, tipo, titulo, status, nota, concluido_em, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setList((data as Treinamento[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return list.filter((t) => {
      const nome = nomePorCpf.get(onlyDigits(t.cpf)) ?? "";
      const okBusca = !q || t.titulo.toLowerCase().includes(q) || nome.toLowerCase().includes(q) || onlyDigits(t.cpf).includes(onlyDigits(q));
      const okStatus = filtroStatus === "todos" || t.status === filtroStatus;
      const okTipo = filtroTipo === "todos" || t.tipo === filtroTipo;
      return okBusca && okStatus && okTipo;
    });
  }, [list, busca, filtroStatus, filtroTipo, nomePorCpf]);

  const kpis = useMemo(() => ({
    total: list.length,
    pendentes: list.filter((t) => t.status === "pendente").length,
    andamento: list.filter((t) => t.status === "em_andamento").length,
    concluidos: list.filter((t) => t.status === "concluido").length,
  }), [list]);

  const abrirNovo = () => { setForm(emptyForm); setOpen(true); };
  const abrirEdicao = (t: Treinamento) => {
    setForm({
      id: t.id,
      cpf: t.cpf,
      tipo: t.tipo,
      titulo: t.titulo,
      status: t.status,
      nota: t.nota != null ? String(t.nota) : "",
      concluido_em: t.concluido_em ? t.concluido_em.slice(0, 10) : "",
    });
    setOpen(true);
  };

  const salvar = async () => {
    if (!onlyDigits(form.cpf)) return toast.error("Selecione o funcionário.");
    if (!form.titulo.trim()) return toast.error("Informe o título do treinamento.");
    setSaving(true);
    const payload = {
      cpf: onlyDigits(form.cpf),
      tipo: form.tipo,
      titulo: form.titulo.trim(),
      status: form.status,
      nota: form.nota ? Number(form.nota.replace(",", ".")) : null,
      concluido_em: form.status === "concluido"
        ? (form.concluido_em ? new Date(`${form.concluido_em}T12:00:00`).toISOString() : new Date().toISOString())
        : null,
    };
    const { error } = form.id
      ? await supabase.from("portal_treinamentos").update(payload).eq("id", form.id)
      : await supabase.from("portal_treinamentos").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(form.id ? "Treinamento atualizado." : "Treinamento cadastrado.");
    setOpen(false);
    carregar();
  };

  const excluir = async (id: string) => {
    const { error } = await supabase.from("portal_treinamentos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Treinamento excluído.");
    carregar();
  };

  const marcarConcluido = async (t: Treinamento) => {
    const { error } = await supabase
      .from("portal_treinamentos")
      .update({ status: "concluido", concluido_em: new Date().toISOString() })
      .eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success("Treinamento concluído.");
    carregar();
  };

  const funcionarioSelecionado = funcionarios.find((f) => onlyDigits(f.cpf) === onlyDigits(form.cpf));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <GraduationCap className="w-6 h-6" /> Treinamentos
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie os treinamentos exibidos no Portal do Funcionário.</p>
        </div>
        <Button onClick={abrirNovo}><Plus className="w-4 h-4 mr-2" />Novo treinamento</Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { l: "Total", v: kpis.total },
          { l: "Pendentes", v: kpis.pendentes },
          { l: "Em andamento", v: kpis.andamento },
          { l: "Concluídos", v: kpis.concluidos },
        ].map((k) => (
          <Card key={k.l}>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-medium">{k.l}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{k.v}</div></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="grid gap-3 md:grid-cols-4">
            <Input placeholder="Buscar por funcionário, CPF ou título..." value={busca} onChange={(e) => setBusca(e.target.value)} className="md:col-span-2" />
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {STATUS.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {TIPOS.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : filtrados.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Nenhum treinamento encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead>Conclusão</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{nomePorCpf.get(onlyDigits(t.cpf)) ?? "—"}</TableCell>
                    <TableCell>{t.cpf}</TableCell>
                    <TableCell>{t.titulo}</TableCell>
                    <TableCell>{TIPOS.find((x) => x.v === t.tipo)?.l ?? t.tipo}</TableCell>
                    <TableCell>{statusBadge(t.status)}</TableCell>
                    <TableCell>{t.nota ?? "—"}</TableCell>
                    <TableCell>{fmt(t.concluido_em)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => abrirEdicao(t)}>Editar</DropdownMenuItem>
                          {t.status !== "concluido" && (
                            <DropdownMenuItem onClick={() => marcarConcluido(t)}>Marcar como concluído</DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={() => setExcluirId(t.id)}>
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DoubleConfirmDelete
        open={!!excluirId}
        onOpenChange={(v) => !v && setExcluirId(null)}
        onConfirm={() => { if (excluirId) excluir(excluirId); setExcluirId(null); }}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Editar treinamento" : "Novo treinamento"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Funcionário</Label>
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    {funcionarioSelecionado ? `${funcionarioSelecionado.nome} — ${funcionarioSelecionado.cpf}` : "Selecione o funcionário"}
                    <ChevronsUpDown className="w-4 h-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar funcionário..." />
                    <CommandList>
                      <CommandEmpty>Nenhum funcionário encontrado.</CommandEmpty>
                      <CommandGroup>
                        {funcionarios.map((f) => (
                          <CommandItem
                            key={f.id}
                            value={`${f.nome} ${f.cpf}`}
                            onSelect={() => { setForm((p) => ({ ...p, cpf: onlyDigits(f.cpf) })); setComboOpen(false); }}
                          >
                            <Check className={`w-4 h-4 mr-2 ${onlyDigits(f.cpf) === onlyDigits(form.cpf) ? "opacity-100" : "opacity-0"}`} />
                            {f.nome} — {f.cpf}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Título</Label>
              <Textarea rows={2} value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} placeholder="Ex.: NR-35 Trabalho em Altura" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm((p) => ({ ...p, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nota</Label>
                <Input value={form.nota} onChange={(e) => setForm((p) => ({ ...p, nota: e.target.value }))} placeholder="0 a 100" />
              </div>
              <div className="space-y-2">
                <Label>Data de conclusão</Label>
                <Input type="date" value={form.concluido_em} disabled={form.status !== "concluido"} onChange={(e) => setForm((p) => ({ ...p, concluido_em: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
