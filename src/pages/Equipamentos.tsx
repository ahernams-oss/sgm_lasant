import { useState, useMemo } from "react";
import { DoubleConfirmDelete, useDoubleConfirmDelete } from "@/components/DoubleConfirmDelete";
import PaginationControls, { paginate } from "@/components/PaginationControls";
import { toast } from "sonner";
import { Monitor, Trash2, Search, Plus, ChevronDown, ChevronUp, Pencil, Upload, Image, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEquipamentos, type Equipamento } from "@/contexts/EquipamentosContext";
import { useClientes } from "@/contexts/ClientesContext";
import { supabase } from "@/integrations/supabase/client";

const SITUACOES = ["Ativo", "Inativo", "Em Manutenção", "Desativado"];
const NIVEIS_RISCO = ["Baixo", "Médio", "Alto", "Crítico"];
const NIVEIS_MANUTENCAO = ["Preventiva", "Corretiva", "Preditiva"];

const emptyForm = {
  clienteId: "", clienteNome: "", localId: "", localDescricao: "",
  pavimentoId: "", pavimentoDescricao: "", setorId: "", setorDescricao: "",
  situacao: "Ativo", tag: "", equipamento: "", serie: "", grupo: "", subgrupo: "",
  modelo: "", valor: 0, fabricante: "", dataAquisicao: "", nivelRisco: "",
  nivelManutencao: "", expectativaVida: "", dataGarantia: "", tensao: "",
  corrente: "", potencia: "", capacidadeBtu: "", contrato: "", planoManutencao: "",
  numeroAnvisa: "", fotoUrl: "", manualUrl: "",
  requerCalibracao: false, dataCalibracao: "", validadeCalibracao: "",
  frequenciaCalibracaoMeses: 12, certificadoCalibracaoUrl: "",
  laboratorioCalibracao: "", numeroCertificadoCalibracao: "",
  observacoesCalibracao: "", responsavelCalibracao: "",
  telefoneResponsavelCalibracao: "", emailResponsavelCalibracao: "",
};

export default function Equipamentos() {
  const { equipamentos, addEquipamento, updateEquipamento, deleteEquipamento } = useEquipamentos();
  const { clientes } = useClientes();
  const clientesList = useMemo(() => clientes.filter(c => c.tipo === "Cliente"), [clientes]);

  const [formOpen, setFormOpen] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCliente, setFilterCliente] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewEquip, setViewEquip] = useState<Equipamento | null>(null);
  const { deleteId, requestDelete, cancelDelete } = useDoubleConfirmDelete();
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingManual, setUploadingManual] = useState(false);

  const selectedCliente = useMemo(() => clientesList.find(c => c.id === form.clienteId), [clientesList, form.clienteId]);
  const locais = useMemo(() => selectedCliente?.locais || [], [selectedCliente]);
  const selectedLocal = useMemo(() => locais.find(l => l.id === form.localId), [locais, form.localId]);
  const pavimentos = useMemo(() => selectedLocal?.pavimentos || [], [selectedLocal]);
  const selectedPavimento = useMemo(() => pavimentos.find(p => p.id === form.pavimentoId), [pavimentos, form.pavimentoId]);
  const setores = useMemo(() => selectedPavimento?.setores || [], [selectedPavimento]);

  const setField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const handleClienteChange = (id: string) => {
    const c = clientesList.find(cl => cl.id === id);
    setForm(prev => ({ ...prev, clienteId: id, clienteNome: c?.nome || "", localId: "", localDescricao: "", pavimentoId: "", pavimentoDescricao: "", setorId: "", setorDescricao: "" }));
  };

  const handleLocalChange = (id: string) => {
    const l = locais.find(loc => loc.id === id);
    setForm(prev => ({ ...prev, localId: id, localDescricao: l?.descricao || "", pavimentoId: "", pavimentoDescricao: "", setorId: "", setorDescricao: "" }));
  };

  const handlePavimentoChange = (id: string) => {
    const p = pavimentos.find(pav => pav.id === id);
    setForm(prev => ({ ...prev, pavimentoId: id, pavimentoDescricao: p?.descricao || "", setorId: "", setorDescricao: "" }));
  };

  const handleSetorChange = (id: string) => {
    const s = setores.find(set => set.id === id);
    setForm(prev => ({ ...prev, setorId: id, setorDescricao: s?.descricao || "" }));
  };

  const handleUpload = async (file: File, type: "foto" | "manual") => {
    const setter = type === "foto" ? setUploadingFoto : setUploadingManual;
    setter(true);
    const ext = file.name.split(".").pop();
    const path = `equipamentos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("evidencias-anexos").upload(path, file);
    if (error) { toast.error("Erro no upload."); setter(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("evidencias-anexos").getPublicUrl(path);
    setField(type === "foto" ? "fotoUrl" : "manualUrl", publicUrl);
    setter(false);
    toast.success(`${type === "foto" ? "Foto" : "Manual"} enviado!`);
  };

  const handleSubmit = () => {
    if (!form.equipamento.trim()) { toast.error("Informe o nome do equipamento."); return; }
    if (!form.clienteId) { toast.error("Selecione um cliente."); return; }
    const { ...data } = form;
    if (editingId) {
      updateEquipamento(editingId, data);
      toast.success("Equipamento atualizado!");
    } else {
      addEquipamento(data as Omit<Equipamento, "id">);
      toast.success("Equipamento cadastrado!");
    }
    resetForm();
  };

  const resetForm = () => { setEditingId(null); setForm(emptyForm); };

  const handleEdit = (eq: Equipamento) => {
    setEditingId(eq.id);
    const { id, ...rest } = eq;
    setForm(rest);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteEquipamento(id);
    toast.success("Equipamento removido.");
    if (editingId === id) resetForm();
  };

  const filtered = useMemo(() => {
    let list = equipamentos;
    if (filterCliente) list = list.filter(e => e.clienteId === filterCliente);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(e =>
        e.equipamento.toLowerCase().includes(s) ||
        e.tag.toLowerCase().includes(s) ||
        e.serie.toLowerCase().includes(s) ||
        e.setorDescricao.toLowerCase().includes(s) ||
        e.clienteNome.toLowerCase().includes(s)
      );
    }
    return list;
  }, [equipamentos, search, filterCliente]);

  const { paginated: paginatedItems, totalPages } = paginate(filtered, page, pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Monitor className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Inventário de Equipamentos</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{equipamentos.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{equipamentos.filter(e => e.situacao === "Ativo").length}</p><p className="text-xs text-muted-foreground">Ativos</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-secondary-foreground">{equipamentos.filter(e => e.situacao === "Em Manutenção").length}</p><p className="text-xs text-muted-foreground">Em Manutenção</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{equipamentos.filter(e => e.situacao === "Inativo" || e.situacao === "Desativado").length}</p><p className="text-xs text-muted-foreground">Inativos</p></CardContent></Card>
      </div>

      {/* Form */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setFormOpen(!formOpen)}>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" />
            {editingId ? "Editar Equipamento" : "Novo Equipamento"}
            {formOpen ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />}
          </CardTitle>
        </CardHeader>
        {formOpen && (
          <CardContent className="space-y-4">
            {/* Vinculação */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Situação</Label>
                <Select value={form.situacao} onValueChange={v => setField("situacao", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SITUACOES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cliente *</Label>
                <Select value={form.clienteId} onValueChange={handleClienteChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                  <SelectContent>{clientesList.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Local</Label>
                <Select value={form.localId} onValueChange={handleLocalChange} disabled={!form.clienteId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o local" /></SelectTrigger>
                  <SelectContent>{locais.map(l => <SelectItem key={l.id} value={l.id}>{l.descricao}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pavimento</Label>
                <Select value={form.pavimentoId} onValueChange={handlePavimentoChange} disabled={!form.localId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o pavimento" /></SelectTrigger>
                  <SelectContent>{pavimentos.map(p => <SelectItem key={p.id} value={p.id}>{p.descricao}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Setor</Label>
                <Select value={form.setorId} onValueChange={handleSetorChange} disabled={!form.pavimentoId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                  <SelectContent>{setores.map(s => <SelectItem key={s.id} value={s.id}>{s.descricao}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Dados do equipamento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>TAG</Label><Input value={form.tag} onChange={e => setField("tag", e.target.value)} /></div>
              <div><Label>Equipamento *</Label><Input value={form.equipamento} onChange={e => setField("equipamento", e.target.value)} /></div>
              <div><Label>Série</Label><Input value={form.serie} onChange={e => setField("serie", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>Grupo</Label><Input value={form.grupo} onChange={e => setField("grupo", e.target.value)} /></div>
              <div><Label>Subgrupo</Label><Input value={form.subgrupo} onChange={e => setField("subgrupo", e.target.value)} /></div>
              <div><Label>Modelo</Label><Input value={form.modelo} onChange={e => setField("modelo", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>Valor (R$)</Label><Input type="number" value={form.valor || ""} onChange={e => setField("valor", Number(e.target.value))} /></div>
              <div><Label>Fabricante</Label><Input value={form.fabricante} onChange={e => setField("fabricante", e.target.value)} /></div>
              <div><Label>Data de Aquisição</Label><Input type="date" value={form.dataAquisicao} onChange={e => setField("dataAquisicao", e.target.value)} /></div>
            </div>

            {/* Manutenção */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Nível de Risco</Label>
                <Select value={form.nivelRisco} onValueChange={v => setField("nivelRisco", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{NIVEIS_RISCO.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nível de Manutenção</Label>
                <Select value={form.nivelManutencao} onValueChange={v => setField("nivelManutencao", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{NIVEIS_MANUTENCAO.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Expectativa de Vida</Label><Input value={form.expectativaVida} onChange={e => setField("expectativaVida", e.target.value)} placeholder="Ex: 10 anos" /></div>
              <div><Label>Data de Garantia</Label><Input type="date" value={form.dataGarantia} onChange={e => setField("dataGarantia", e.target.value)} /></div>
            </div>

            {/* Elétrica */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div><Label>Tensão (V)</Label><Input value={form.tensao} onChange={e => setField("tensao", e.target.value)} /></div>
              <div><Label>Corrente (A)</Label><Input value={form.corrente} onChange={e => setField("corrente", e.target.value)} /></div>
              <div><Label>Potência (W)</Label><Input value={form.potencia} onChange={e => setField("potencia", e.target.value)} /></div>
              <div><Label>Capacidade (BTU)</Label><Input value={form.capacidadeBtu} onChange={e => setField("capacidadeBtu", e.target.value)} /></div>
            </div>

            {/* Outros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>Contrato</Label><Input value={form.contrato} onChange={e => setField("contrato", e.target.value)} /></div>
              <div><Label>Plano de Manutenção</Label><Input value={form.planoManutencao} onChange={e => setField("planoManutencao", e.target.value)} /></div>
              <div><Label>Nº Anvisa</Label><Input value={form.numeroAnvisa} onChange={e => setField("numeroAnvisa", e.target.value)} /></div>
            </div>

            {/* Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Foto</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={uploadingFoto} onClick={() => document.getElementById("foto-upload")?.click()}>
                    <Image className="h-4 w-4 mr-1" />{uploadingFoto ? "Enviando..." : "Upload Foto"}
                  </Button>
                  <input id="foto-upload" type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], "foto")} />
                  {form.fotoUrl && <a href={form.fotoUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">Ver foto</a>}
                </div>
              </div>
              <div>
                <Label>Manual</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={uploadingManual} onClick={() => document.getElementById("manual-upload")?.click()}>
                    <FileText className="h-4 w-4 mr-1" />{uploadingManual ? "Enviando..." : "Upload Manual"}
                  </Button>
                  <input id="manual-upload" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], "manual")} />
                  {form.manualUrl && <a href={form.manualUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">Ver manual</a>}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit}>{editingId ? "Atualizar" : "Cadastrar"}</Button>
              {editingId && <Button variant="outline" onClick={resetForm}>Cancelar</Button>}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar equipamento, TAG, série, setor..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>
            <Select value={filterCliente} onValueChange={v => { setFilterCliente(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filtrar por cliente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clientesList.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TAG</TableHead>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Fabricante</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum equipamento encontrado.</TableCell></TableRow>
                ) : paginatedItems.map(eq => (
                  <TableRow key={eq.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewEquip(eq)}>
                    <TableCell className="font-mono text-xs">{eq.tag || "-"}</TableCell>
                    <TableCell className="font-medium">{eq.equipamento}</TableCell>
                    <TableCell className="text-sm">{eq.clienteNome}</TableCell>
                    <TableCell className="text-sm">{eq.setorDescricao || eq.localDescricao || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={eq.situacao === "Ativo" ? "default" : eq.situacao === "Em Manutenção" ? "secondary" : "destructive"}>
                        {eq.situacao}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{eq.fabricante || "-"}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(eq)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => requestDelete(eq.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationControls currentPage={page} totalItems={filtered.length} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!viewEquip} onOpenChange={() => setViewEquip(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalhes do Equipamento</DialogTitle></DialogHeader>
          {viewEquip && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-semibold">Situação:</span> {viewEquip.situacao}</div>
              <div><span className="font-semibold">Cliente:</span> {viewEquip.clienteNome}</div>
              <div><span className="font-semibold">Local:</span> {viewEquip.localDescricao || "-"}</div>
              <div><span className="font-semibold">Pavimento:</span> {viewEquip.pavimentoDescricao || "-"}</div>
              <div><span className="font-semibold">Setor:</span> {viewEquip.setorDescricao || "-"}</div>
              <div><span className="font-semibold">TAG:</span> {viewEquip.tag || "-"}</div>
              <div><span className="font-semibold">Equipamento:</span> {viewEquip.equipamento}</div>
              <div><span className="font-semibold">Série:</span> {viewEquip.serie || "-"}</div>
              <div><span className="font-semibold">Grupo:</span> {viewEquip.grupo || "-"}</div>
              <div><span className="font-semibold">Subgrupo:</span> {viewEquip.subgrupo || "-"}</div>
              <div><span className="font-semibold">Modelo:</span> {viewEquip.modelo || "-"}</div>
              <div><span className="font-semibold">Valor:</span> {viewEquip.valor ? `R$ ${viewEquip.valor.toLocaleString("pt-BR")}` : "-"}</div>
              <div><span className="font-semibold">Fabricante:</span> {viewEquip.fabricante || "-"}</div>
              <div><span className="font-semibold">Data Aquisição:</span> {viewEquip.dataAquisicao || "-"}</div>
              <div><span className="font-semibold">Nível de Risco:</span> {viewEquip.nivelRisco || "-"}</div>
              <div><span className="font-semibold">Nível Manutenção:</span> {viewEquip.nivelManutencao || "-"}</div>
              <div><span className="font-semibold">Expectativa Vida:</span> {viewEquip.expectativaVida || "-"}</div>
              <div><span className="font-semibold">Data Garantia:</span> {viewEquip.dataGarantia || "-"}</div>
              <div><span className="font-semibold">Tensão:</span> {viewEquip.tensao || "-"}</div>
              <div><span className="font-semibold">Corrente:</span> {viewEquip.corrente || "-"}</div>
              <div><span className="font-semibold">Potência:</span> {viewEquip.potencia || "-"}</div>
              <div><span className="font-semibold">Capacidade BTU:</span> {viewEquip.capacidadeBtu || "-"}</div>
              <div><span className="font-semibold">Contrato:</span> {viewEquip.contrato || "-"}</div>
              <div><span className="font-semibold">Plano Manutenção:</span> {viewEquip.planoManutencao || "-"}</div>
              <div><span className="font-semibold">Nº Anvisa:</span> {viewEquip.numeroAnvisa || "-"}</div>
              {viewEquip.fotoUrl && <div className="col-span-2"><span className="font-semibold">Foto:</span> <a href={viewEquip.fotoUrl} target="_blank" rel="noreferrer" className="text-primary underline ml-1">Ver foto</a></div>}
              {viewEquip.manualUrl && <div className="col-span-2"><span className="font-semibold">Manual:</span> <a href={viewEquip.manualUrl} target="_blank" rel="noreferrer" className="text-primary underline ml-1">Ver manual</a></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DoubleConfirmDelete open={!!deleteId} onOpenChange={(open) => { if (!open) cancelDelete(); }} onConfirm={() => { if (deleteId) handleDelete(deleteId); }} />
    </div>
  );
}
