import { useState, useMemo, useRef, ReactNode } from "react";
import { useColumnOrder } from "@/hooks/useColumnOrder";
import { SortableHeaderRow, SortableTableHead } from "@/components/SortableTableHead";
import { DoubleConfirmDelete, useDoubleConfirmDelete } from "@/components/DoubleConfirmDelete";
import PaginationControls, { paginate } from "@/components/PaginationControls";
import { CalendarClock, Plus, Trash2, Pencil, Search, Clock, XCircle, Filter, Paperclip, Download, X, FileDown, FileSpreadsheet, AlertTriangle, Printer } from "lucide-react";
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
import { useLancamentos, TipoFalta, TipoAdvertencia, AnexoFalta } from "@/contexts/LancamentosContext";
import { useCargos } from "@/contexts/CargosContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { toast } from "sonner";
import { gerarPdfMapaFuncionarios } from "@/lib/gerarPdfMapa";
import { exportarExcelMapa } from "@/lib/gerarExcelMapa";
import { gerarPdfAdvertencia } from "@/lib/gerarPdfAdvertencia";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePermissao } from "@/hooks/usePermissao";

const TIPO_FALTA_LABELS: Record<TipoFalta, string> = {
  justificada: "Justificada",
  injustificada: "Injustificada",
  atestado: "Atestado Médico",
  suspensao: "Suspensão",
};

const TIPO_ADVERTENCIA_LABELS: Record<TipoAdvertencia, string> = {
  verbal: "Verbal",
  escrita: "Escrita",
};

const PERCENTUAIS_HE = [50, 100];

const MapaFuncionarios = () => {
  const { funcionarios } = useFuncionarios();
  const { lancamentos, addLancamento, updateLancamento, deleteLancamento } = useLancamentos();
  const { cargos } = useCargos();
  const { clientes } = useClientes();
  const { empresa } = useEmpresa();
  const { tem } = usePermissao();
  const podeVisualizar = tem("mapa_funcionarios.visualizar") || tem("funcionarios.gerenciar_lancamentos");
  const podeGerenciar = tem("funcionarios.gerenciar_lancamentos");
  const podePdf = tem("mapa_funcionarios.exportar_pdf");
  const podeExcel = tem("mapa_funcionarios.exportar_excel");

  const [activeTab, setActiveTab] = useState<"faltas" | "horas_extras" | "advertencias">("faltas");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [funcionarioId, setFuncionarioId] = useState("");
  const [data, setData] = useState("");
  const [tipoFalta, setTipoFalta] = useState<TipoFalta>("injustificada");
  const [diasFalta, setDiasFalta] = useState("1");
  const [horasExtras, setHorasExtras] = useState("");
  const [percentual, setPercentual] = useState("50");
  const [observacao, setObservacao] = useState("");
  const [anexos, setAnexos] = useState<AnexoFalta[]>([]);
  const [tipoAdvertencia, setTipoAdvertencia] = useState<TipoAdvertencia>("verbal");
  const [motivo, setMotivo] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { deleteId, requestDelete, cancelDelete } = useDoubleConfirmDelete();

  // Filters
  const [search, setSearch] = useState("");
  const [pageLanc, setPageLanc] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const colDefsByTab: Record<string, Record<string, { label: string; className?: string }>> = {
    faltas: {
      data: { label: "Data" }, funcionario: { label: "Funcionário" }, cargo: { label: "Cargo" }, cliente: { label: "Cliente" },
      tipo: { label: "Tipo" }, dias: { label: "Dias" }, anexos: { label: "Anexos" }, observacao: { label: "Observação" },
    },
    horas_extras: {
      data: { label: "Data" }, funcionario: { label: "Funcionário" }, cargo: { label: "Cargo" }, cliente: { label: "Cliente" },
      horas: { label: "Horas" }, percentual: { label: "Percentual" }, observacao: { label: "Observação" },
    },
    advertencias: {
      data: { label: "Data" }, funcionario: { label: "Funcionário" }, cargo: { label: "Cargo" }, cliente: { label: "Cliente" },
      tipo: { label: "Tipo" }, motivo: { label: "Motivo" }, anexos: { label: "Anexos" }, observacao: { label: "Observação" },
    },
  };
  const defaultsByTab: Record<string, string[]> = {
    faltas: ["data", "funcionario", "cargo", "cliente", "tipo", "dias", "anexos", "observacao"],
    horas_extras: ["data", "funcionario", "cargo", "cliente", "horas", "percentual", "observacao"],
    advertencias: ["data", "funcionario", "cargo", "cliente", "tipo", "motivo", "anexos", "observacao"],
  };
  const colFaltas = useColumnOrder("mapa_funcionarios.faltas", defaultsByTab.faltas);
  const colHoras = useColumnOrder("mapa_funcionarios.horas_extras", defaultsByTab.horas_extras);
  const colAdvert = useColumnOrder("mapa_funcionarios.advertencias", defaultsByTab.advertencias);
  const colHook = activeTab === "faltas" ? colFaltas : activeTab === "horas_extras" ? colHoras : colAdvert;
  const colOrder = colHook.order;
  const setColOrder = colHook.setOrder;
  const colDefs = colDefsByTab[activeTab];
  const [filterFuncionario, setFilterFuncionario] = useState("todos");
  const [filterCliente, setFilterCliente] = useState("todos");
  const [filterMes, setFilterMes] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const resetForm = () => {
    setFuncionarioId("");
    setData("");
    setTipoFalta("injustificada");
    setDiasFalta("1");
    setHorasExtras("");
    setPercentual("50");
    setObservacao("");
    setAnexos([]);
    setTipoAdvertencia("verbal");
    setMotivo("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeGerenciar) { toast.error("Você não possui permissão para esta ação."); return; }
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
    } else if (activeTab === "horas_extras") {
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
    } else if (activeTab === "advertencias") {
      if (!motivo.trim()) { toast.error("Informe o motivo da advertência."); return; }
      const payload = {
        funcionarioId, tipo: "advertencia" as const, data,
        tipoAdvertencia, motivo, anexos, observacao,
      };
      if (editingId) {
        updateLancamento(editingId, payload);
        toast.success("Advertência atualizada.");
      } else {
        addLancamento(payload);
        toast.success("Advertência registrada.");
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
    } else if (l.tipo === "hora_extra") {
      setActiveTab("horas_extras");
      setHorasExtras(String(l.horasExtras || ""));
      setPercentual(String(l.percentual || 50));
    } else if (l.tipo === "advertencia") {
      setActiveTab("advertencias");
      setTipoAdvertencia(l.tipoAdvertencia || "verbal");
      setMotivo(l.motivo || "");
      setAnexos(l.anexos || []);
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
    if (!podeGerenciar) { toast.error("Você não possui permissão para esta ação."); return; }
    deleteLancamento(id);
    if (editingId === id) resetForm();
    toast.success("Lançamento removido.");
  };
  const handleConfirmDelete = () => { if (deleteId) handleDelete(deleteId); };

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
    const tipo = activeTab === "faltas" ? "falta" : activeTab === "horas_extras" ? "hora_extra" : "advertencia";
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
    const advertencias = mesLancamentos.filter((l) => l.tipo === "advertencia");
    return {
      totalFaltas: faltas.reduce((sum, l) => sum + (l.diasFalta || 1), 0),
      totalFaltasJustificadas: faltas.filter((l) => l.tipoFalta === "justificada" || l.tipoFalta === "atestado").reduce((sum, l) => sum + (l.diasFalta || 1), 0),
      totalFaltasInjustificadas: faltas.filter((l) => l.tipoFalta === "injustificada").reduce((sum, l) => sum + (l.diasFalta || 1), 0),
      totalHorasExtras: horas.reduce((sum, l) => sum + (l.horasExtras || 0), 0),
      funcionariosComFalta: new Set(faltas.map((l) => l.funcionarioId)).size,
      funcionariosComHE: new Set(horas.map((l) => l.funcionarioId)).size,
      totalAdvertencias: advertencias.length,
      funcionariosComAdvertencia: new Set(advertencias.map((l) => l.funcionarioId)).size,
    };
  }, [lancamentos, filterMes]);

  const funcionariosAtivos = funcionarios.filter((f) => !f.status || f.status === "Ativo");

  const handlePrintAdvertencia = (l: any) => {
    if (!podePdf) { toast.error("Você não possui permissão para exportar PDF."); return; }
    const func = funcionarios.find((f) => f.id === l.funcionarioId);
    const cargoNome = func?.cargoId ? cargos.find((c) => c.id === func.cargoId)?.nome || "—" : "—";
    gerarPdfAdvertencia({
      funcionarioNome: func?.nome || "—",
      funcionarioCpf: func?.cpf || "—",
      cargoNome,
      dataAdvertencia: l.data,
      motivo: l.motivo || "",
      observacoes: l.observacao || "",
      empresaRazaoSocial: empresa.razaoSocial || "EMPRESA",
    });
    toast.success("PDF de advertência gerado com sucesso.");
  };

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
                Lançamento e controle de faltas, horas extras e advertências.
              </p>
            </div>
            {!showForm && (
              <div className="flex gap-2">
                {podePdf && <Button
                  variant="outline"
                  onClick={() => gerarPdfMapaFuncionarios({
                    lancamentos: filteredLancamentos,
                    funcionarios,
                    cargos,
                    clientes,
                    filterMes,
                    filterCliente,
                    filterFuncionario,
                  })}
                  className="shadow-sm gap-1.5"
                >
                  <FileDown className="h-4 w-4" /> PDF
                </Button>}
                {podeExcel && <Button
                  variant="outline"
                  onClick={() => exportarExcelMapa({
                    lancamentos: filteredLancamentos,
                    funcionarios,
                    cargos,
                    clientes,
                    filterMes,
                  })}
                  className="shadow-sm gap-1.5"
                >
                  <FileSpreadsheet className="h-4 w-4" /> Excel
                </Button>}
                {podeGerenciar && <Button onClick={() => setShowForm(true)} className="shadow-md">
                  <Plus className="h-4 w-4 mr-1" /> Novo Lançamento
                </Button>}
              </div>
            )}
          </div>
        </div>

        {/* Resumo cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 animate-fade-up" style={{ animationDelay: "50ms" }}>
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
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Advertências (mês)</p>
            <p className="text-2xl font-bold text-orange-600">{resumoMes.totalAdvertencias}</p>
            <p className="text-xs text-muted-foreground">{resumoMes.funcionariosComAdvertencia} funcionário(s)</p>
          </div>
        </div>

        {/* Formulário */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm animate-fade-up">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "faltas" | "horas_extras" | "advertencias")} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="faltas" className="gap-1.5">
                  <XCircle className="h-3.5 w-3.5" /> Falta
                </TabsTrigger>
                <TabsTrigger value="horas_extras" className="gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Hora Extra
                </TabsTrigger>
                <TabsTrigger value="advertencias" className="gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Advertência
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

                <TabsContent value="advertencias" className="mt-0 p-0">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground/80">Tipo de Advertência</Label>
                        <Select value={tipoAdvertencia} onValueChange={(v) => setTipoAdvertencia(v as TipoAdvertencia)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(TIPO_ADVERTENCIA_LABELS).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Motivo *</Label>
                      <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} placeholder="Descreva o motivo da advertência..." />
                    </div>
                    {/* Anexos */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-foreground/80">Documentos</Label>
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
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "faltas" | "horas_extras" | "advertencias")}>
                  <TabsList className="h-9">
                    <TabsTrigger value="faltas" className="text-xs gap-1">
                      <XCircle className="h-3 w-3" /> Faltas
                    </TabsTrigger>
                    <TabsTrigger value="horas_extras" className="text-xs gap-1">
                      <Clock className="h-3 w-3" /> Horas Extras
                    </TabsTrigger>
                    <TabsTrigger value="advertencias" className="text-xs gap-1">
                      <AlertTriangle className="h-3 w-3" /> Advertências
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <span className="text-sm font-semibold text-foreground">({filteredLancamentos.length})</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Input type="month" value={filterMes} onChange={(e) => { setFilterMes(e.target.value); setPageLanc(1); }} className="h-9 w-[160px] text-xs" />
                <Select value={filterCliente} onValueChange={v => { setFilterCliente(v); setPageLanc(1); }}>
                  <SelectTrigger className="h-9 w-[160px] text-xs"><SelectValue placeholder="Cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Clientes</SelectItem>
                    {clientes.filter((c) => c.tipo === "Cliente").map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterFuncionario} onValueChange={v => { setFilterFuncionario(v); setPageLanc(1); }}>
                  <SelectTrigger className="h-9 w-[180px] text-xs"><SelectValue placeholder="Funcionário" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Funcionários</SelectItem>
                    {funcionarios.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Pesquisar..." value={search} onChange={(e) => { setSearch(e.target.value); setPageLanc(1); }} className="pl-9 h-9" />
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
              <SortableHeaderRow order={colOrder} onReorder={setColOrder}>
              <Table>
                <TableHeader>
                  <TableRow>
                    {colOrder.map(key => {
                      const cd = colDefs[key];
                      return cd ? <SortableTableHead key={key} id={key} className={cd.className}>{cd.label}</SortableTableHead> : null;
                    })}
                    <TableHead className="w-24 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginate(filteredLancamentos, pageLanc, pageSize).paginated.map((l, idx) => {
                    const cellMap: Record<string, { node: ReactNode; className?: string }> = {
                      data: { node: formatData(l.data), className: "font-medium" },
                      funcionario: { node: getFuncionarioNome(l.funcionarioId) },
                      cargo: { node: getCargoNome(l.funcionarioId) },
                      cliente: { node: getClienteNome(l.funcionarioId) },
                      observacao: { node: l.observacao || "—", className: "max-w-[200px] truncate text-muted-foreground text-xs" },
                    };
                    if (l.tipo === "falta") {
                      cellMap.tipo = { node: (
                        <Badge variant={l.tipoFalta === "injustificada" ? "destructive" : "secondary"} className="text-xs">
                          {TIPO_FALTA_LABELS[l.tipoFalta || "injustificada"]}
                        </Badge>
                      ) };
                      cellMap.dias = { node: l.diasFalta || 1 };
                      cellMap.anexos = { node: l.anexos && l.anexos.length > 0 ? (
                        <div className="flex items-center gap-1">
                          {l.anexos.map((a, i) => (
                            <button key={i} onClick={() => handleDownloadAnexo(a)} className="text-primary hover:underline text-xs flex items-center gap-0.5" title={a.nome}>
                              <Paperclip className="h-3 w-3" />
                            </button>
                          ))}
                          <span className="text-xs text-muted-foreground">({l.anexos.length})</span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span> };
                    } else if (l.tipo === "hora_extra") {
                      cellMap.horas = { node: `${l.horasExtras}h`, className: "font-medium" };
                      cellMap.percentual = { node: <Badge className="bg-primary/10 text-primary text-xs">{l.percentual}%</Badge> };
                    } else {
                      cellMap.tipo = { node: (
                        <Badge variant={l.tipoAdvertencia === "escrita" ? "destructive" : "secondary"} className="text-xs">
                          {TIPO_ADVERTENCIA_LABELS[l.tipoAdvertencia || "verbal"]}
                        </Badge>
                      ) };
                      cellMap.motivo = { node: l.motivo || "—", className: "max-w-[200px] truncate text-xs" };
                      cellMap.anexos = { node: l.anexos && l.anexos.length > 0 ? (
                        <div className="flex items-center gap-1">
                          {l.anexos.map((a, i) => (
                            <button key={i} onClick={() => handleDownloadAnexo(a)} className="text-primary hover:underline text-xs flex items-center gap-0.5" title={a.nome}>
                              <Paperclip className="h-3 w-3" />
                            </button>
                          ))}
                          <span className="text-xs text-muted-foreground">({l.anexos.length})</span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span> };
                    }
                    return (
                    <TableRow key={l.id} className={idx % 2 === 1 ? "bg-gray-200/60 hover:bg-gray-200/80" : "bg-white hover:bg-gray-100/60"}>
                      {colOrder.map(key => {
                        const c = cellMap[key];
                        return <TableCell key={key} className={c?.className}>{c?.node}</TableCell>;
                      })}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {l.tipo === "advertencia" && podePdf && (
                            <Button size="icon" variant="ghost" onClick={() => handlePrintAdvertencia(l)} className="h-8 w-8" title="Imprimir Advertência">
                              <Printer className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {podeGerenciar && <Button size="icon" variant="ghost" onClick={() => handleEdit(l)} className="h-8 w-8">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>}
                          {podeGerenciar && <Button size="icon" variant="ghost" onClick={() => requestDelete(l.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </SortableHeaderRow>
            </div>
          )}
        </div>
        <PaginationControls currentPage={pageLanc} totalItems={filteredLancamentos.length} onPageChange={setPageLanc} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setPageLanc(1); }} />
      </div>
      <DoubleConfirmDelete open={!!deleteId} onOpenChange={(open) => !open && cancelDelete()} onConfirm={handleConfirmDelete} />
    </div>
  );
};

export default MapaFuncionarios;
