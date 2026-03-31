import { useState, useMemo } from "react";
import { useSolicitacoesServicos } from "@/contexts/SolicitacoesServicosContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useEquipamentos } from "@/contexts/EquipamentosContext";
import { DoubleConfirmDelete, useDoubleConfirmDelete } from "@/components/DoubleConfirmDelete";
import PaginationControls, { paginate } from "@/components/PaginationControls";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, ChevronDown, ChevronUp, AlertTriangle, Pencil, Trash2, MoreHorizontal } from "lucide-react";

const SITUACOES = ["Aguardando aprovação", "Aprovada", "Em execução", "Concluída", "Cancelada"];

const emptyForm = {
  cliente_id: "", local_id: "", pavimento_id: "", setor_id: "",
  equipamento_id: "", descricao_servicos: "", situacao: "Aguardando aprovação",
};

export default function SolicitacaoServicosPage() {
  const { solicitacoes, addSolicitacao, updateSolicitacao, deleteSolicitacao } = useSolicitacoesServicos();
  const { clientes } = useClientes();
  const { equipamentos } = useEquipamentos();
  const { toast } = useToast();
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { deleteId, requestDelete, cancelDelete } = useDoubleConfirmDelete();

  const soClientes = useMemo(() => clientes.filter(c => c.tipo === "Cliente"), [clientes]);

  // Cascading data
  const selectedCliente = useMemo(() => soClientes.find(c => c.id === form.cliente_id), [soClientes, form.cliente_id]);
  const locais = useMemo(() => selectedCliente?.locais || [], [selectedCliente]);
  const selectedLocal = useMemo(() => locais.find((l: any) => l.id === form.local_id), [locais, form.local_id]);
  const pavimentos = useMemo(() => (selectedLocal as any)?.pavimentos || [], [selectedLocal]);
  const selectedPavimento = useMemo(() => pavimentos.find((p: any) => p.id === form.pavimento_id), [pavimentos, form.pavimento_id]);
  const setores = useMemo(() => (selectedPavimento as any)?.setores || [], [selectedPavimento]);

  // Filter equipamentos by selected cliente
  const equipamentosFiltrados = useMemo(() => {
    if (!form.cliente_id) return [];
    return equipamentos.filter((e: any) => e.clienteId === form.cliente_id || e.cliente_id === form.cliente_id);
  }, [equipamentos, form.cliente_id]);

  const handleSave = async () => {
    if (!form.cliente_id) { toast({ title: "Selecione um cliente", variant: "destructive" }); return; }
    if (!form.descricao_servicos.trim()) { toast({ title: "Descrição dos serviços obrigatória", variant: "destructive" }); return; }

    const cliente = soClientes.find(c => c.id === form.cliente_id);
    const local = locais.find((l: any) => l.id === form.local_id);
    const pav = pavimentos.find((p: any) => p.id === form.pavimento_id);
    const setor = setores.find((s: any) => s.id === form.setor_id);
    const equip = equipamentosFiltrados.find((e: any) => e.id === form.equipamento_id);

    const payload = {
      cliente_id: form.cliente_id,
      cliente_nome: cliente?.nome || "",
      local_id: form.local_id,
      local_descricao: (local as any)?.descricao || "",
      pavimento_id: form.pavimento_id,
      pavimento_descricao: (pav as any)?.descricao || "",
      setor_id: form.setor_id,
      setor_descricao: (setor as any)?.descricao || "",
      equipamento_id: form.equipamento_id,
      equipamento_nome: (equip as any)?.equipamento || (equip as any)?.tag || "",
      descricao_servicos: form.descricao_servicos,
      situacao: form.situacao,
    };

    if (editingId) {
      await updateSolicitacao(editingId, payload);
      toast({ title: "Solicitação atualizada" });
    } else {
      await addSolicitacao(payload);
      toast({ title: "Solicitação cadastrada" });
    }
    setForm({ ...emptyForm });
    setEditingId(null);
    setFormOpen(false);
  };

  const handleEdit = (s: any) => {
    setForm({
      cliente_id: s.clienteId,
      local_id: s.localId,
      pavimento_id: s.pavimentoId,
      setor_id: s.setorId,
      equipamento_id: s.equipamentoId,
      descricao_servicos: s.descricaoServicos,
      situacao: s.situacao,
    });
    setEditingId(s.id);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteSolicitacao(deleteId);
      toast({ title: "Solicitação excluída" });
      cancelDelete();
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return solicitacoes;
    const q = search.toLowerCase();
    return solicitacoes.filter(s =>
      s.clienteNome.toLowerCase().includes(q) ||
      s.descricaoServicos.toLowerCase().includes(q) ||
      s.situacao.toLowerCase().includes(q) ||
      String(s.numero).includes(q)
    );
  }, [solicitacoes, search]);

  const { paginated, totalPages } = paginate(filtered, page);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Solicitação de Serviços</h1>

      {/* Form */}
      <Collapsible open={formOpen} onOpenChange={setFormOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-primary" />
                {editingId ? "Editar Solicitação de Serviço" : "Cadastro Solicitação de Serviço"}
              </CardTitle>
              {formOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Cliente */}
                <div className="md:col-span-3">
                  <Label className="font-bold">Cliente</Label>
                  <Select value={form.cliente_id} onValueChange={v => setForm(f => ({ ...f, cliente_id: v, local_id: "", pavimento_id: "", setor_id: "", equipamento_id: "" }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{soClientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {/* Situação */}
                <div>
                  <Label className="font-bold">Situação</Label>
                  <Select value={form.situacao} onValueChange={v => setForm(f => ({ ...f, situacao: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SITUACOES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {/* Local */}
              <div>
                <Label className="font-bold">Local</Label>
                <Select value={form.local_id} onValueChange={v => setForm(f => ({ ...f, local_id: v, pavimento_id: "", setor_id: "" }))} disabled={!form.cliente_id}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{locais.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.descricao}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pavimento */}
                <div>
                  <Label className="font-bold">Pavimento</Label>
                  <Select value={form.pavimento_id} onValueChange={v => setForm(f => ({ ...f, pavimento_id: v, setor_id: "" }))} disabled={!form.local_id}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{pavimentos.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.descricao}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {/* Setor */}
                <div>
                  <Label className="font-bold">Setor</Label>
                  <Select value={form.setor_id} onValueChange={v => setForm(f => ({ ...f, setor_id: v }))} disabled={!form.pavimento_id}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{setores.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.descricao}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {/* Equipamento */}
              <div className="md:w-1/2">
                <Label className="font-bold">Equipamento</Label>
                <Select value={form.equipamento_id} onValueChange={v => setForm(f => ({ ...f, equipamento_id: v }))} disabled={!form.cliente_id}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{equipamentosFiltrados.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.tag ? `${e.tag} - ${e.equipamento}` : e.equipamento}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {/* Descrição dos Serviços */}
              <div>
                <Label className="font-bold">Descrição dos Serviços</Label>
                <Textarea
                  placeholder="Descrição dos Serviços"
                  value={form.descricao_servicos}
                  onChange={e => setForm(f => ({ ...f, descricao_servicos: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave}>
                  <Plus className="mr-2 h-4 w-4" />
                  {editingId ? "Atualizar" : "+ Adicionar"}
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Search */}
      <div className="flex justify-between items-center">
        <Input
          placeholder="Buscar solicitação..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Equipamento</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-16">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma solicitação cadastrada
                </TableCell>
              </TableRow>
            ) : paginated.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.numero}</TableCell>
                <TableCell>{s.clienteNome || "-"}</TableCell>
                <TableCell>{s.localDescricao || "-"}</TableCell>
                <TableCell>{s.equipamentoNome || "-"}</TableCell>
                <TableCell className="max-w-[200px] truncate">{s.descricaoServicos || "-"}</TableCell>
                <TableCell>
                  <Badge variant={
                    s.situacao === "Concluída" ? "default" :
                    s.situacao === "Cancelada" ? "destructive" :
                    s.situacao === "Em execução" ? "secondary" : "outline"
                  }>{s.situacao}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(s)}>
                        <Pencil className="mr-2 h-4 w-4" />Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => requestDelete(s.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationControls currentPage={page} totalItems={filtered.length} onPageChange={setPage} />
      <DoubleConfirmDelete open={!!deleteId} onOpenChange={o => !o && cancelDelete()} onConfirm={handleDelete} />
    </div>
  );
}
