import { useState, useMemo, useRef, useEffect } from "react";
import { useRdos, Rdo, RdoEfetivoItem, RdoEquipamentoItem, RdoAtividadeItem } from "@/contexts/RdosContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRdoAssinaturas } from "@/contexts/RdoAssinaturasContext";
import { useResponsaveisTecnicos } from "@/contexts/ResponsaveisTecnicosContext";
import { useObras, Obra as ObraType } from "@/contexts/ObrasContext";
import { usePermissao } from "@/hooks/usePermissao";
import { AssinaturaEletronicaOficial } from "@/components/AssinaturaEletronicaOficial";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Edit, Trash2, FileDown, Upload, X, Eraser, FileText, Image as ImageIcon, Building2, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DoubleConfirmDelete } from "@/components/DoubleConfirmDelete";
import PaginationControls from "@/components/PaginationControls";
import { gerarPdfRdo } from "@/lib/gerarPdfRdo";
import { toast } from "sonner";

const CLIMAS = ["Ensolarado", "Nublado", "Chuvoso", "Parcialmente Nublado", "Tempestade", "Não Aplicável"];
const CONDICOES = ["Praticável", "Impraticável", "Parcialmente Praticável"];
const STATUS_LIST = ["Aberto", "Concluído"];

const statusColor = (s: string) => {
  switch (s) {
    case "Concluído": return "bg-green-100 text-green-800 border-green-300";
    case "Aberto": return "bg-yellow-100 text-yellow-800 border-yellow-300";
    default: return "bg-muted text-muted-foreground";
  }
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = (): Partial<Rdo> => ({
  data_rdo: today(),
  cliente_id: "",
  cliente_nome: "",
  obra: "",
  responsavel: "",
  clima_manha: "Ensolarado",
  clima_tarde: "Ensolarado",
  clima_noite: "Ensolarado",
  condicao_manha: "Praticável",
  condicao_tarde: "Praticável",
  condicao_noite: "Praticável",
  efetivo: [],
  equipamentos: [],
  atividades: [],
  avanco_fisico_geral: 0,
  ocorrencias: "",
  observacoes: "",
  anexos: [],
  assinatura_responsavel: "",
  assinatura_responsavel_nome: "",
  assinatura_fiscalizacao: "",
  assinatura_fiscalizacao_nome: "",
  status: "Aberto",
});

// Componente Canvas para assinatura digital
function SignaturePad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = value;
    }
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, [value]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const t = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    return { x: (t.clientX - rect.left) * (canvas.width / rect.width), y: (t.clientY - rect.top) * (canvas.height / rect.height) };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    drawingRef.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const end = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    onChange(canvasRef.current!.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={500}
        height={140}
        className="border rounded-md w-full bg-white touch-none cursor-crosshair"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <Button type="button" variant="outline" size="sm" onClick={clear}>
        <Eraser className="h-3 w-3 mr-1" /> Limpar Assinatura
      </Button>
    </div>
  );
}

export default function RdoPage() {
  const { rdos, loading, addRdo, updateRdo, deleteRdo, uploadAnexo } = useRdos();
  const { clientes } = useClientes();
  const { empresa } = useEmpresa();
  const { usuarioLogado } = useAuth();
  const { porRdo } = useRdoAssinaturas();
  const { responsaveis = [] } = useResponsaveisTecnicos();
  const { obras, add: addObra, update: updateObra, remove: removeObra, porCliente: obrasPorCliente } = useObras();
  const { tem } = usePermissao();
  const podeExcluir = tem("rdo.excluir");

  // Gerenciar Obras
  const [obrasDialogOpen, setObrasDialogOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<ObraType | null>(null);
  const [obraForm, setObraForm] = useState<Partial<ObraType>>({ cliente_id: "", cliente_nome: "", nome: "", status: "Em Andamento" });

  const [search, setSearch] = useState("");
  const [filterCliente, setFilterCliente] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Rdo | null>(null);
  const [form, setForm] = useState<Partial<Rdo>>(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const assinaturasDoRdo = useMemo(() => editing ? porRdo(editing.id) : [], [editing, porRdo]);

  const clientesAtivos = useMemo(() => clientes.filter((c) => c.tipo === "Cliente"), [clientes]);

  const filtered = useMemo(() => {
    return rdos.filter((r) => {
      const matchSearch = !search ||
        r.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
        r.obra?.toLowerCase().includes(search.toLowerCase()) ||
        r.responsavel?.toLowerCase().includes(search.toLowerCase()) ||
        String(r.numero).includes(search);
      const matchCliente = filterCliente === "Todos" || r.cliente_id === filterCliente;
      const matchStatus = filterStatus === "Todos" || r.status === filterStatus;
      return matchSearch && matchCliente && matchStatus;
    });
  }, [rdos, search, filterCliente, filterStatus]);

  useEffect(() => { setPage(1); }, [search, filterCliente, filterStatus, pageSize]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm(), responsavel: usuarioLogado?.nome || "" });
    setDialogOpen(true);
  };
  const openEdit = (r: Rdo) => {
    setEditing(r);
    setForm({ ...r });
    setDialogOpen(true);
  };

  const onClienteChange = (id: string) => {
    const c = clientes.find((x) => x.id === id);
    setForm((f) => ({ ...f, cliente_id: id, cliente_nome: c?.nome || "", obra: "" }));
  };

  const obrasDoCliente = useMemo(() => obrasPorCliente(form.cliente_id || ""), [obras, form.cliente_id, obrasPorCliente]);

  // Listas dinâmicas
  const addEfetivo = () => setForm((f) => ({ ...f, efetivo: [...(f.efetivo || []), { funcao: "", quantidade: 0, horas: 0 }] }));
  const updEfetivo = (i: number, k: keyof RdoEfetivoItem, v: any) =>
    setForm((f) => ({ ...f, efetivo: (f.efetivo || []).map((x, idx) => idx === i ? { ...x, [k]: k === "funcao" ? v : Number(v) || 0 } : x) }));
  const delEfetivo = (i: number) => setForm((f) => ({ ...f, efetivo: (f.efetivo || []).filter((_, idx) => idx !== i) }));

  const addEquip = () => setForm((f) => ({ ...f, equipamentos: [...(f.equipamentos || []), { descricao: "", quantidade: 0, horas: 0 }] }));
  const updEquip = (i: number, k: keyof RdoEquipamentoItem, v: any) =>
    setForm((f) => ({ ...f, equipamentos: (f.equipamentos || []).map((x, idx) => idx === i ? { ...x, [k]: k === "descricao" ? v : Number(v) || 0 } : x) }));
  const delEquip = (i: number) => setForm((f) => ({ ...f, equipamentos: (f.equipamentos || []).filter((_, idx) => idx !== i) }));

  const addAtiv = () => setForm((f) => ({ ...f, atividades: [...(f.atividades || []), { descricao: "", percentual_avanco: 0, observacao: "" }] }));
  const updAtiv = (i: number, k: keyof RdoAtividadeItem, v: any) =>
    setForm((f) => ({ ...f, atividades: (f.atividades || []).map((x, idx) => idx === i ? { ...x, [k]: k === "percentual_avanco" ? Number(v) || 0 : v } : x) }));
  const delAtiv = (i: number) => setForm((f) => ({ ...f, atividades: (f.atividades || []).filter((_, idx) => idx !== i) }));

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const current = form.anexos || [];
    const arr = Array.from(files);
    if (current.length + arr.length > 30) {
      toast.error("Limite de 30 imagens por RDO.");
      return;
    }
    for (const f of arr) {
      if (f.type.startsWith("image/") && f.size > 5 * 1024 * 1024) {
        toast.error(`A imagem "${f.name}" excede 5MB.`);
        return;
      }
    }
    setUploading(true);
    const tempId = editing?.id || "novo";
    const newAnexos = [...current];
    for (const file of arr) {
      const url = await uploadAnexo(file, tempId);
      if (url) newAnexos.push({ nome: file.name, url, tipo: file.type, descricao: "" });
    }
    setForm((f) => ({ ...f, anexos: newAnexos }));
    setUploading(false);
  };
  const removeAnexo = (i: number) => setForm((f) => ({ ...f, anexos: (f.anexos || []).filter((_, idx) => idx !== i) }));
  const updateAnexoDescricao = (i: number, descricao: string) =>
    setForm((f) => ({ ...f, anexos: (f.anexos || []).map((a, idx) => idx === i ? { ...a, descricao } : a) }));

  const onSave = async () => {
    if (!form.cliente_id) { toast.error("Selecione um cliente."); return; }
    if (!form.obra) { toast.error("Informe a obra."); return; }
    if (!form.data_rdo) { toast.error("Informe a data do RDO."); return; }
    const payload = { ...form };
    if (editing) {
      await updateRdo(editing.id, payload);
    } else {
      await addRdo(payload);
    }
    setDialogOpen(false);
    setForm(emptyForm());
    setEditing(null);
  };

  const onExportPdf = async (r: Rdo, incluirImagens = false) => {
    const cliente = clientes.find((c) => c.id === r.cliente_id);
    const assinaturas = porRdo(r.id);
    await gerarPdfRdo({ rdo: r, empresa, cliente, assinaturas, incluirImagens });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold">RDO - Registro Diário de Obras</h1>
          <p className="text-sm text-muted-foreground">Controle diário das atividades, efetivo e ocorrências de obra.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> Novo RDO
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={filterCliente} onValueChange={setFilterCliente}>
              <SelectTrigger><SelectValue placeholder="Cliente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os clientes</SelectItem>
                {clientesAtivos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os status</SelectItem>
                {STATUS_LIST.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Obra</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-center">Avanço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-6">Carregando...</TableCell></TableRow>
              ) : paged.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">Nenhum RDO encontrado</TableCell></TableRow>
              ) : paged.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.numero}</TableCell>
                  <TableCell>{r.data_rdo ? new Date(r.data_rdo + "T00:00:00").toLocaleDateString("pt-BR") : "-"}</TableCell>
                  <TableCell>{r.cliente_nome}</TableCell>
                  <TableCell>{r.obra}</TableCell>
                  <TableCell>{r.responsavel}</TableCell>
                  <TableCell className="text-center">{(Number(r.avanco_fisico_geral) || 0).toFixed(1)}%</TableCell>
                  <TableCell><Badge variant="outline" className={statusColor(r.status)}>{r.status}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" title="Exportar PDF">
                          <FileDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onExportPdf(r, false)}>
                          <FileText className="h-4 w-4 mr-2" /> PDF sem imagens
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExportPdf(r, true)}>
                          <ImageIcon className="h-4 w-4 mr-2" /> PDF com imagens
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(r)} title="Editar">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(r.id)} title="Excluir">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls
            currentPage={page}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      {/* Dialog Form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Editar RDO Nº ${editing.numero}` : "Novo RDO"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="geral" className="w-full">
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="clima">Clima</TabsTrigger>
              <TabsTrigger value="efetivo">Efetivo</TabsTrigger>
              <TabsTrigger value="atividades">Atividades</TabsTrigger>
              <TabsTrigger value="anexos">Anexos</TabsTrigger>
              <TabsTrigger value="assinaturas">Assinaturas</TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data do RDO *</Label>
                  <Input type="date" value={form.data_rdo || ""} onChange={(e) => setForm({ ...form, data_rdo: e.target.value })} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_LIST.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cliente *</Label>
                  <Select value={form.cliente_id} onValueChange={onClienteChange}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {clientesAtivos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Obra *</Label>
                  <Input value={form.obra || ""} onChange={(e) => setForm({ ...form, obra: e.target.value })} />
                </div>
                <div>
                  <Label>Responsável Técnico</Label>
                  <Select
                    value={(form as any).responsavel_tecnico_id || ""}
                    onValueChange={(id) => {
                      const r = responsaveis.find(x => x.id === id);
                      setForm({
                        ...form,
                        ...( { responsavel_tecnico_id: id } as any),
                        responsavel: r ? `${r.nome} - ${r.titulo} - CREA ${r.crea}` : "",
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={responsaveis.length === 0 ? "Cadastre um Responsável Técnico" : "Selecione o responsável"} />
                    </SelectTrigger>
                    <SelectContent>
                      {responsaveis.map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.nome} — {r.titulo} (CREA {r.crea})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Avanço Físico Geral (%)</Label>
                  <Input
                    type="number" step="0.01" min={0} max={100}
                    value={form.avanco_fisico_geral ?? 0}
                    onChange={(e) => setForm({ ...form, avanco_fisico_geral: Number(e.target.value.replace(",", ".")) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label>Ocorrências do Dia</Label>
                <Textarea rows={3} value={form.ocorrencias || ""} onChange={(e) => setForm({ ...form, ocorrencias: e.target.value })} />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea rows={3} value={form.observacoes || ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </div>
            </TabsContent>

            <TabsContent value="clima" className="space-y-3 mt-4">
              {(["manha", "tarde", "noite"] as const).map((turno) => (
                <Card key={turno}>
                  <CardHeader className="pb-2"><CardTitle className="text-base capitalize">{turno === "manha" ? "Manhã" : turno}</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Clima</Label>
                      <Select
                        value={(form as any)[`clima_${turno}`]}
                        onValueChange={(v) => setForm({ ...form, [`clima_${turno}`]: v } as any)}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{CLIMAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Condição de Trabalho</Label>
                      <Select
                        value={(form as any)[`condicao_${turno}`]}
                        onValueChange={(v) => setForm({ ...form, [`condicao_${turno}`]: v } as any)}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{CONDICOES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="efetivo" className="space-y-4 mt-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Mão de Obra</h3>
                  <Button size="sm" onClick={addEfetivo}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Função</TableHead><TableHead>Quantidade</TableHead><TableHead>Horas</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(form.efetivo || []).map((e, i) => (
                      <TableRow key={i}>
                        <TableCell><Input value={e.funcao} onChange={(ev) => updEfetivo(i, "funcao", ev.target.value)} /></TableCell>
                        <TableCell><Input type="number" min={0} value={e.quantidade} onChange={(ev) => updEfetivo(i, "quantidade", ev.target.value)} /></TableCell>
                        <TableCell><Input type="number" min={0} step="0.5" value={e.horas} onChange={(ev) => updEfetivo(i, "horas", ev.target.value)} /></TableCell>
                        <TableCell><Button size="icon" variant="ghost" onClick={() => delEfetivo(i)}><X className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                    {(form.efetivo || []).length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum item</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Equipamentos</h3>
                  <Button size="sm" onClick={addEquip}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Quantidade</TableHead><TableHead>Horas</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(form.equipamentos || []).map((e, i) => (
                      <TableRow key={i}>
                        <TableCell><Input value={e.descricao} onChange={(ev) => updEquip(i, "descricao", ev.target.value)} /></TableCell>
                        <TableCell><Input type="number" min={0} value={e.quantidade} onChange={(ev) => updEquip(i, "quantidade", ev.target.value)} /></TableCell>
                        <TableCell><Input type="number" min={0} step="0.5" value={e.horas} onChange={(ev) => updEquip(i, "horas", ev.target.value)} /></TableCell>
                        <TableCell><Button size="icon" variant="ghost" onClick={() => delEquip(i)}><X className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                    {(form.equipamentos || []).length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum item</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="atividades" className="space-y-2 mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Atividades Executadas e Avanço Físico</h3>
                <Button size="sm" onClick={addAtiv}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead className="w-32">% Avanço</TableHead><TableHead>Observação</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {(form.atividades || []).map((a, i) => (
                    <TableRow key={i}>
                      <TableCell><Input value={a.descricao} onChange={(ev) => updAtiv(i, "descricao", ev.target.value)} /></TableCell>
                      <TableCell><Input type="number" min={0} max={100} step="0.1" value={a.percentual_avanco} onChange={(ev) => updAtiv(i, "percentual_avanco", ev.target.value)} /></TableCell>
                      <TableCell><Input value={a.observacao} onChange={(ev) => updAtiv(i, "observacao", ev.target.value)} /></TableCell>
                      <TableCell><Button size="icon" variant="ghost" onClick={() => delAtiv(i)}><X className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                  {(form.atividades || []).length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhuma atividade</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="anexos" className="space-y-3 mt-4">
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-[260px]">
                  <Label>Adicionar Fotos / Documentos</Label>
                  <Input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    disabled={uploading || (form.anexos || []).length >= 30}
                    onChange={(e) => { handleUpload(e.target.files); e.target.value = ""; }}
                  />
                  {uploading && <p className="text-xs text-muted-foreground mt-1">Enviando...</p>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(form.anexos || []).length}/30 anexos · máx. 5MB por imagem
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(form.anexos || []).map((a, i) => (
                  <div key={i} className="border rounded-md p-2 relative space-y-2">
                    {a.tipo?.startsWith("image/") ? (
                      <img src={a.url} alt={a.nome} className="w-full h-32 object-cover rounded" />
                    ) : (
                      <div className="h-32 flex items-center justify-center bg-muted rounded text-xs text-center px-2">{a.nome}</div>
                    )}
                    <p className="text-xs truncate">{a.nome}</p>
                    <Input
                      placeholder="Descrição da imagem"
                      value={a.descricao || ""}
                      onChange={(e) => updateAnexoDescricao(i, e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Button size="icon" variant="ghost" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeAnexo(i)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="assinaturas" className="space-y-4 mt-4">
              <div className="bg-muted/30 border rounded p-3 text-xs text-muted-foreground">
                As assinaturas são <strong>eletrônicas oficiais</strong>, com validade jurídica conforme Lei nº 14.063, de 23 de Setembro de 2020.
                Cada assinatura registra automaticamente o signatário autenticado, data/hora, IP, hash do documento e gera um código verificador único, consultável publicamente.
              </div>
              <AssinaturaEletronicaOficial
                rdo={editing ? { ...editing, ...form } : form as any}
                papel="responsavel"
                assinaturaExistente={editing ? assinaturasDoRdo.find(a => a.papel === "responsavel") : undefined}
              />
              <AssinaturaEletronicaOficial
                rdo={editing ? { ...editing, ...form } : form as any}
                papel="fiscalizacao"
                assinaturaExistente={editing ? assinaturasDoRdo.find(a => a.papel === "fiscalizacao") : undefined}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={onSave}>{editing ? "Atualizar" : "Salvar"} RDO</Button>
          </div>
        </DialogContent>
      </Dialog>

      <DoubleConfirmDelete
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={async () => {
          if (!podeExcluir) {
            toast.error("Você não possui permissão para excluir RDOs.");
            setDeleteId(null);
            return;
          }
          if (deleteId) { await deleteRdo(deleteId); setDeleteId(null); }
        }}
      />
    </div>
  );
}
