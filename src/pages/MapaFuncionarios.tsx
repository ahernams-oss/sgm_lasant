import { useState, useMemo, useRef } from "react";
import { CalendarClock, Plus, Trash2, Pencil, Search, Clock, XCircle, Filter, Paperclip, Download, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useFuncionarios } from "@/contexts/FuncionariosContext";
import { useLancamentos, TipoFalta, AnexoFalta } from "@/contexts/LancamentosContext";
import { useCargos } from "@/contexts/CargosContext";
import { useClientes } from "@/contexts/ClientesContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TIPO_FALTA_LABELS: Record<TipoFalta, string> = {
  justificada: "Justificada",
  injustificada: "Injustificada",
  atestado: "Atestado Médico",
  suspensao: "Suspensão",
};

const PERCENTUAIS_HE = [50, 60, 70, 80, 100];

const MapaFuncionarios = () => {
  const { funcionarios } = useFuncionarios();
  const { lancamentos, addLancamento, updateLancamento, deleteLancamento } = useLancamentos();
  const { cargos } = useCargos();
  const { clientes } = useClientes();

  const [activeTab, setActiveTab] = useState<"faltas" | "horas_extras">("faltas");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [funcionarioId, setFuncionarioId] = useState("");
  const [funcionarioIds, setFuncionarioIds] = useState<string[]>([]);
  const [data, setData] = useState("");
  const [tipoFalta, setTipoFalta] = useState<TipoFalta>("injustificada");
  const [diasFalta, setDiasFalta] = useState("1");
  const [horasExtras, setHorasExtras] = useState("");
  const [percentual, setPercentual] = useState("50");
  const [observacao, setObservacao] = useState("");
  const [anexos, setAnexos] = useState<AnexoFalta[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterFuncionario, setFilterFuncionario] = useState("todos");
  const [filterCliente, setFilterCliente] = useState("todos");
  const [filterMes, setFilterMes] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const resetForm = () => {
    setFuncionarioId("");
    setFuncionarioIds([]);
    setData("");
    setTipoFalta("injustificada");
    setDiasFalta("1");
    setHorasExtras("");
    setPercentual("50");
    setObservacao("");
    setAnexos([]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!funcionarioId) { toast.error("Selecione o funcionário."); return; }
    if (!data) { toast.error("Informe a data."); return; }

    if (activeTab === "faltas") {
      const payload = {
        funcionarioId, tipo: "falta" as const, data,
        tipoFalta, diasFalta: Number(diasFalta) || 1, anexos, observacao,
      };
      if (editingId) {
        updateLancamento(editingId, payload);
        toast.success("Falta atualizada.");
      } else {
        addLancamento(payload);
        toast.success("Falta registrada.");
      }
    } else {
      if (!horasExtras || Number(horasExtras) <= 0) { toast.error("Informe as horas extras."); return; }
      const payload = {
        funcionarioId, tipo: "hora_extra" as const, data,
        horasExtras: Number(horasExtras), percentual: Number(percentual), observacao,
      };
      if (editingId) {
        updateLancamento(editingId, payload);
        toast.success("Hora extra atualizada.");
      } else {
        addLancamento(payload);
        toast.success("Hora extra registrada.");
      }
    }
    resetForm();
  };

  const handleEdit = (l: typeof lancamentos[0]) => {
    setFuncionarioId(l.funcionarioId);
    setData(l.data);
    setObservacao(l.observacao);
    if (l.tipo === "falta") {
      setActiveTab("faltas");
      setTipoFalta(l.tipoFalta || "injustificada");
      setDiasFalta(String(l.diasFalta || 1));
      setAnexos(l.anexos || []);
    } else {
      setActiveTab("horas_extras");
      setHorasExtras(String(l.horasExtras || ""));
      setPercentual(String(l.percentual || 50));
    }
    setEditingId(l.id);
    setShowForm(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`Arquivo "${file.name}" excede 2MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAnexos((prev) => [...prev, { nome: file.name, tipo: file.type, base64: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownloadAnexo = (anexo: AnexoFalta) => {
    const link = document.createElement("a");
    link.href = anexo.base64;
    link.download = anexo.nome;
    link.click();
  };

  const handleRemoveAnexo = (index: number) => {
    setAnexos((prev) => prev.filter((_, i) => i !== index));
  };


  const handleDelete = (id: string) => {
    deleteLancamento(id);
    if (editingId === id) resetForm();
    toast.success("Lançamento removido.");
  };

  const getFuncionarioNome = (id: string) =>
    funcionarios.find((f) => f.id === id)?.nome ?? "—";

  const getCargoNome = (funcId: string) => {
    const func = funcionarios.find((f) => f.id === funcId);
    if (!func) return "—";
    return cargos.find((c) => c.id === func.cargoId)?.nome ?? "—";
  };

  const getClienteNome = (funcId: string) => {
    const func = funcionarios.find((f) => f.id === funcId);
    if (!func?.clienteId) return "—";
    return clientes.find((c) => c.id === func.clienteId)?.nome ?? "—";
  };

  const filteredLancamentos = useMemo(() => {
    const tipo = activeTab === "faltas" ? "falta" : "hora_extra";
    let result = lancamentos.filter((l) => l.tipo === tipo);

    if (filterMes) {
      result = result.filter((l) => l.data.startsWith(filterMes));
    }
    if (filterCliente !== "todos") {
      const funcIds = new Set(funcionarios.filter((f) => f.clienteId === filterCliente).map((f) => f.id));
      result = result.filter((l) => funcIds.has(l.funcionarioId));
    }
    if (filterFuncionario !== "todos") {
      result = result.filter((l) => l.funcionarioId === filterFuncionario);
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter((l) =>
        getFuncionarioNome(l.funcionarioId).toLowerCase().includes(term) ||
        l.observacao?.toLowerCase().includes(term)
      );
    }
    return result.sort((a, b) => b.data.localeCompare(a.data));
  }, [lancamentos, activeTab, filterMes, filterCliente, filterFuncionario, search, funcionarios]);

  // Resumo do mês
  const resumoMes = useMemo(() => {
    const mesLancamentos = lancamentos.filter((l) => l.data.startsWith(filterMes));
    const faltas = mesLancamentos.filter((l) => l.tipo === "falta");
    const horas = mesLancamentos.filter((l) => l.tipo === "hora_extra");
    return {
      totalFaltas: faltas.reduce((sum, l) => sum + (l.diasFalta || 1), 0),
      totalFaltasJustificadas: faltas.filter((l) => l.tipoFalta === "justificada" || l.tipoFalta === "atestado").reduce((sum, l) => sum + (l.diasFalta || 1), 0),
      totalFaltasInjustificadas: faltas.filter((l) => l.tipoFalta === "injustificada").reduce((sum, l) => sum + (l.diasFalta || 1), 0),
      totalHorasExtras: horas.reduce((sum, l) => sum + (l.horasExtras || 0), 0),
      funcionariosComFalta: new Set(faltas.map((l) => l.funcionarioId)).size,
      funcionariosComHE: new Set(horas.map((l) => l.funcionarioId)).size,
    };
  }, [lancamentos, filterMes]);

  const funcionariosAtivos = funcionarios.filter((f) => !f.status || f.status === "Ativo");

  const formatData = (d: string) => {
    try { return format(new Date(d + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR }); }
    catch { return d; }
  };

  return (
    <div className="bg-background">
      <div className="container max-w-full mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-2 text-primary mb-1">
            <CalendarClock className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Gestão de Pessoas</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground mb-1">Mapa de Funcionários</h1>
              <p className="text-sm text-muted-foreground max-w-lg">
                Lançamento e controle de faltas e horas extras.
              </p>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} className="shadow-md">
                <Plus className="h-4 w-4 mr-1" /> Novo Lançamento
              </Button>
            )}
          </div>
        </div>

        {/* Resumo cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-fade-up" style={{ animationDelay: "50ms" }}>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Total Faltas (mês)</p>
            <p className="text-2xl font-bold text-foreground">{resumoMes.totalFaltas}</p>
            <p className="text-xs text-muted-foreground">{resumoMes.funcionariosComFalta} funcionário(s)</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Faltas Injustificadas</p>
            <p className="text-2xl font-bold text-destructive">{resumoMes.totalFaltasInjustificadas}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Faltas Justificadas</p>
            <p className="text-2xl font-bold text-foreground">{resumoMes.totalFaltasJustificadas}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Horas Extras (mês)</p>
            <p className="text-2xl font-bold text-primary">{resumoMes.totalHorasExtras.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground">{resumoMes.funcionariosComHE} funcionário(s)</p>
          </div>
        </div>

        {/* Formulário */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm animate-fade-up">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "faltas" | "horas_extras")} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="faltas" className="gap-1.5">
                  <XCircle className="h-3.5 w-3.5" /> Falta
                </TabsTrigger>
                <TabsTrigger value="horas_extras" className="gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Hora Extra
                </TabsTrigger>
              </TabsList>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">Funcionário *</Label>
                  <Select value={funcionarioId} onValueChange={setFuncionarioId}>
                    <SelectTrigger><SelectValue placeholder="Selecione o funcionário" /></SelectTrigger>
                    <SelectContent>
                      {funcionariosAtivos.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.nome} — {cargos.find((c) => c.id === f.cargoId)?.nome || ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">Data *</Label>
                  <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
                </div>

                <TabsContent value="faltas" className="mt-0 p-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Tipo de Falta</Label>
                      <Select value={tipoFalta} onValueChange={(v) => setTipoFalta(v as TipoFalta)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(TIPO_FALTA_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Dias</Label>
                      <Input type="number" min="1" value={diasFalta} onChange={(e) => setDiasFalta(e.target.value)} />
                    </div>
                  </div>
                  {/* Anexos */}
                  <div className="mt-4 space-y-2">
                    <Label className="text-xs font-semibold text-foreground/80">Documentos Comprobatórios</Label>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
                        <Paperclip className="h-3.5 w-3.5" /> Anexar Arquivo
                      </Button>
                      <span className="text-xs text-muted-foreground">PDF, DOC, JPG, PNG (máx. 2MB)</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>
                    {anexos.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {anexos.map((a, i) => (
                          <div key={i} className="flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-xs">
                            <Paperclip className="h-3 w-3 text-muted-foreground" />
                            <button type="button" onClick={() => handleDownloadAnexo(a)} className="text-primary hover:underline truncate max-w-[150px]">
                              {a.nome}
                            </button>
                            <button type="button" onClick={() => handleRemoveAnexo(i)} className="text-muted-foreground hover:text-destructive ml-1">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="horas_extras" className="mt-0 p-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Horas *</Label>
                      <Input type="number" min="0.5" step="0.5" value={horasExtras} onChange={(e) => setHorasExtras(e.target.value)} placeholder="Ex: 2.5" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Percentual (%)</Label>
                      <Select value={percentual} onValueChange={setPercentual}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PERCENTUAIS_HE.map((p) => (
                            <SelectItem key={p} value={String(p)}>{p}%</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </div>

              <div className="space-y-1.5 mb-4">
                <Label className="text-xs font-semibold text-foreground/80">Observação</Label>
                <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2} placeholder="Motivo ou detalhes..." />
              </div>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button type="submit" className="shadow-md">{editingId ? "Salvar Alterações" : "Registrar"}</Button>
            </div>
          </form>
        )}

        {/* Tabela de lançamentos */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "faltas" | "horas_extras")}>
                  <TabsList className="h-9">
                    <TabsTrigger value="faltas" className="text-xs gap-1">
                      <XCircle className="h-3 w-3" /> Faltas
                    </TabsTrigger>
                    <TabsTrigger value="horas_extras" className="text-xs gap-1">
                      <Clock className="h-3 w-3" /> Horas Extras
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <span className="text-sm font-semibold text-foreground">({filteredLancamentos.length})</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Input type="month" value={filterMes} onChange={(e) => setFilterMes(e.target.value)} className="h-9 w-[160px] text-xs" />
                <Select value={filterCliente} onValueChange={setFilterCliente}>
                  <SelectTrigger className="h-9 w-[160px] text-xs"><SelectValue placeholder="Cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Clientes</SelectItem>
                    {clientes.filter((c) => c.tipo === "Cliente").map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterFuncionario} onValueChange={setFilterFuncionario}>
                  <SelectTrigger className="h-9 w-[180px] text-xs"><SelectValue placeholder="Funcionário" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Funcionários</SelectItem>
                    {funcionarios.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
                </div>
              </div>
            </div>
          </div>

          {filteredLancamentos.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Nenhum lançamento encontrado para o período selecionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Cliente</TableHead>
                    {activeTab === "faltas" ? (
                      <>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Dias</TableHead>
                        <TableHead>Anexos</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead>Horas</TableHead>
                        <TableHead>Percentual</TableHead>
                      </>
                    )}
                    <TableHead>Observação</TableHead>
                    <TableHead className="w-24 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLancamentos.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{formatData(l.data)}</TableCell>
                      <TableCell>{getFuncionarioNome(l.funcionarioId)}</TableCell>
                      <TableCell>{getCargoNome(l.funcionarioId)}</TableCell>
                      <TableCell>{getClienteNome(l.funcionarioId)}</TableCell>
                      {l.tipo === "falta" ? (
                        <>
                          <TableCell>
                            <Badge variant={l.tipoFalta === "injustificada" ? "destructive" : "secondary"} className="text-xs">
                              {TIPO_FALTA_LABELS[l.tipoFalta || "injustificada"]}
                            </Badge>
                          </TableCell>
                          <TableCell>{l.diasFalta || 1}</TableCell>
                          <TableCell>
                            {l.anexos && l.anexos.length > 0 ? (
                              <div className="flex items-center gap-1">
                                {l.anexos.map((a, i) => (
                                  <button key={i} onClick={() => handleDownloadAnexo(a)} className="text-primary hover:underline text-xs flex items-center gap-0.5" title={a.nome}>
                                    <Paperclip className="h-3 w-3" />
                                  </button>
                                ))}
                                <span className="text-xs text-muted-foreground">({l.anexos.length})</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-medium">{l.horasExtras}h</TableCell>
                          <TableCell>
                            <Badge className="bg-primary/10 text-primary text-xs">{l.percentual}%</Badge>
                          </TableCell>
                        </>
                      )}
                      <TableCell className="max-w-[200px] truncate text-muted-foreground text-xs">{l.observacao || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(l)} className="h-8 w-8">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(l.id)} className="h-8 w-8 text-destructive hover:text-destructive">
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
        </div>
      </div>
    </div>
  );
};

export default MapaFuncionarios;
