import { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Briefcase, Plus, Trash2, Search, ChevronDown, ChevronUp, Pencil, Check, X, Upload, FileText, ExternalLink } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCargos, type SalarioDataBase, type AnexoCargo, type NrCargo } from "@/contexts/CargosContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const niveis = ["I", "II", "III", "IV", "V"] as const;

const emptyForm = { nome: "", descricao: "", nivel: "", missao: "", responsabilidades: "", perfilCompetencias: "", cbo: "" };

const Cargos = () => {
  const { cargos, addCargo, updateCargo, deleteCargo } = useCargos();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterNivel, setFilterNivel] = useState<string>("todos");
  const [expandedCargoId, setExpandedCargoId] = useState<string | null>(null);

  // Salário form state
  const [novoSalarioValor, setNovoSalarioValor] = useState<Record<string, string>>({});
  const [novoSalarioData, setNovoSalarioData] = useState<Record<string, string>>({});

  // Editing salário
  const [editingSalarioId, setEditingSalarioId] = useState<string | null>(null);
  const [editingSalarioValor, setEditingSalarioValor] = useState("");
  const [editingSalarioData, setEditingSalarioData] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // NRs state
  const [novoNrNumero, setNovoNrNumero] = useState<Record<string, string>>({});
  const [novoNrDescricao, setNovoNrDescricao] = useState<Record<string, string>>({});
  const [editingNrId, setEditingNrId] = useState<string | null>(null);
  const [editingNrNumero, setEditingNrNumero] = useState("");
  const [editingNrDescricao, setEditingNrDescricao] = useState("");

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error("Informe o nome do cargo.");
      return;
    }
    if (editingId) {
      updateCargo(editingId, form);
      toast.success("Cargo atualizado com sucesso!");
    } else {
      addCargo({ ...form, salario: "", dataBaseSalario: "", salarios: [], anexos: [], nrs: [] });
      toast.success("Cargo cadastrado com sucesso!");
    }
    resetForm();
  };

  const handleEdit = (cargo: typeof cargos[0]) => {
    setEditingId(cargo.id);
    setForm({
      nome: cargo.nome,
      descricao: cargo.descricao,
      nivel: cargo.nivel,
      missao: cargo.missao || "",
      responsabilidades: cargo.responsabilidades || "",
      perfilCompetencias: cargo.perfilCompetencias || "",
      cbo: cargo.cbo || "",
    });
  };

  const handleDelete = (id: string) => {
    deleteCargo(id);
    toast.success("Cargo removido.");
    if (editingId === id) resetForm();
  };

  // Salários management
  const addSalario = (cargoId: string) => {
    const valor = (novoSalarioValor[cargoId] || "").trim();
    const dataBase = (novoSalarioData[cargoId] || "").trim();
    if (!valor) { toast.error("Informe o valor do salário."); return; }
    if (!dataBase) { toast.error("Informe a data base."); return; }
    const cargo = cargos.find((c) => c.id === cargoId);
    if (!cargo) return;
    const novo: SalarioDataBase = { id: crypto.randomUUID(), valor, dataBase };
    updateCargo(cargoId, { salarios: [...(cargo.salarios || []), novo] });
    setNovoSalarioValor((prev) => ({ ...prev, [cargoId]: "" }));
    setNovoSalarioData((prev) => ({ ...prev, [cargoId]: "" }));
    toast.success("Salário adicionado!");
  };

  const deleteSalario = (cargoId: string, salarioId: string) => {
    const cargo = cargos.find((c) => c.id === cargoId);
    if (!cargo) return;
    updateCargo(cargoId, { salarios: cargo.salarios.filter((s) => s.id !== salarioId) });
    toast.success("Salário removido.");
  };

  const startEditSalario = (sal: SalarioDataBase) => {
    setEditingSalarioId(sal.id);
    setEditingSalarioValor(sal.valor);
    setEditingSalarioData(sal.dataBase);
  };

  const confirmEditSalario = (cargoId: string, salarioId: string) => {
    if (!editingSalarioValor.trim()) { toast.error("Informe o valor."); return; }
    if (!editingSalarioData.trim()) { toast.error("Informe a data base."); return; }
    const cargo = cargos.find((c) => c.id === cargoId);
    if (!cargo) return;
    updateCargo(cargoId, {
      salarios: cargo.salarios.map((s) =>
        s.id === salarioId ? { ...s, valor: editingSalarioValor.trim(), dataBase: editingSalarioData.trim() } : s
      ),
    });
    setEditingSalarioId(null);
    toast.success("Salário atualizado!");
  };

  const getSalarioAtual = (salarios: SalarioDataBase[]) => {
    if (!salarios || salarios.length === 0) return null;
    return [...salarios].sort((a, b) => (b.dataBase || "").localeCompare(a.dataBase || ""))[0];
  };

  const ACCEPTED_TYPES = ".docx,.doc,.pdf,.xlsx,.xls,.jpg,.jpeg,.png";
  const MAX_ANEXOS = 3;

  const handleUploadAnexo = async (cargoId: string, file: File) => {
    const cargo = cargos.find((c) => c.id === cargoId);
    if (!cargo) return;
    if ((cargo.anexos || []).length >= MAX_ANEXOS) {
      toast.error(`Máximo de ${MAX_ANEXOS} anexos por cargo.`);
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const path = `${cargoId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("cargo-anexos").upload(path, file);
    if (error) {
      toast.error("Erro ao enviar arquivo.");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("cargo-anexos").getPublicUrl(path);
    const anexo: AnexoCargo = { id: crypto.randomUUID(), nome: file.name, url: urlData.publicUrl, tipo: ext };
    updateCargo(cargoId, { anexos: [...(cargo.anexos || []), anexo] });
    toast.success("Arquivo anexado!");
    setUploading(false);
  };

  const handleDeleteAnexo = async (cargoId: string, anexo: AnexoCargo) => {
    const cargo = cargos.find((c) => c.id === cargoId);
    if (!cargo) return;
    // Extract path from URL
    const urlParts = anexo.url.split("/cargo-anexos/");
    if (urlParts[1]) {
      await supabase.storage.from("cargo-anexos").remove([urlParts[1]]);
    }
    updateCargo(cargoId, { anexos: (cargo.anexos || []).filter((a) => a.id !== anexo.id) });
    toast.success("Anexo removido.");
  };

  // NRs management
  const addNr = (cargoId: string) => {
    const numero = (novoNrNumero[cargoId] || "").trim();
    const descricao = (novoNrDescricao[cargoId] || "").trim();
    if (!numero) { toast.error("Informe o número da NR."); return; }
    const cargo = cargos.find((c) => c.id === cargoId);
    if (!cargo) return;
    const nr: NrCargo = { id: crypto.randomUUID(), numero, descricao };
    updateCargo(cargoId, { nrs: [...(cargo.nrs || []), nr] });
    setNovoNrNumero((prev) => ({ ...prev, [cargoId]: "" }));
    setNovoNrDescricao((prev) => ({ ...prev, [cargoId]: "" }));
    toast.success("NR adicionada!");
  };

  const deleteNr = (cargoId: string, nrId: string) => {
    const cargo = cargos.find((c) => c.id === cargoId);
    if (!cargo) return;
    updateCargo(cargoId, { nrs: (cargo.nrs || []).filter((n) => n.id !== nrId) });
    toast.success("NR removida.");
  };

  const startEditNr = (nr: NrCargo) => {
    setEditingNrId(nr.id);
    setEditingNrNumero(nr.numero);
    setEditingNrDescricao(nr.descricao);
  };

  const confirmEditNr = (cargoId: string, nrId: string) => {
    if (!editingNrNumero.trim()) { toast.error("Informe o número da NR."); return; }
    const cargo = cargos.find((c) => c.id === cargoId);
    if (!cargo) return;
    updateCargo(cargoId, {
      nrs: (cargo.nrs || []).map((n) => n.id === nrId ? { ...n, numero: editingNrNumero.trim(), descricao: editingNrDescricao.trim() } : n),
    });
    setEditingNrId(null);
    toast.success("NR atualizada!");
  };

  const filteredCargos = useMemo(() => {
    let result = cargos;
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.nome.toLowerCase().includes(term) ||
          c.descricao.toLowerCase().includes(term) ||
          c.salarios?.some((s) => s.valor.toLowerCase().includes(term))
      );
    }
    if (filterNivel !== "todos") {
      result = result.filter((c) => c.nivel === filterNivel);
    }
    return result;
  }, [cargos, search, filterNivel]);

  return (
    <div className="bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Briefcase className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Cadastro</span>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">Cargos</h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            Cadastre e gerencie os cargos disponíveis no sistema.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="section-card animate-fade-up mb-6"
          style={{ animationDelay: "80ms" }}
        >
          <h2 className="section-title">
            {editingId ? "Editar Cargo" : "Novo Cargo"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="field-label">Nome do Cargo</label>
              <Input placeholder="Ex: Eletricista de Alta" value={form.nome} onChange={(e) => update("nome", e.target.value)} />
            </div>
            <div>
              <label className="field-label">CBO</label>
              <Input placeholder="Ex: 7321-05" value={form.cbo} onChange={(e) => update("cbo", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Nível</label>
              <Select value={form.nivel} onValueChange={(v) => update("nivel", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {niveis.map((n) => (
                    <SelectItem key={n} value={n}>Nível {n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4">
              <label className="field-label">Descrição</label>
              <Textarea placeholder="Breve descrição do cargo" value={form.descricao} onChange={(e) => update("descricao", e.target.value)} rows={2} className="min-h-[40px]" />
            </div>
            <div className="md:col-span-4">
              <label className="field-label">Missão do Cargo</label>
              <Textarea placeholder="Descreva a missão do cargo" value={form.missao} onChange={(e) => update("missao", e.target.value)} rows={3} className="min-h-[60px]" />
            </div>
            <div className="md:col-span-4">
              <label className="field-label">Responsabilidades do Cargo</label>
              <Textarea placeholder="Descreva as responsabilidades do cargo" value={form.responsabilidades} onChange={(e) => update("responsabilidades", e.target.value)} rows={4} className="min-h-[80px]" />
            </div>
            <div className="md:col-span-4">
              <label className="field-label">Perfil de Competências</label>
              <Textarea placeholder="Descreva o perfil de competências esperado" value={form.perfilCompetencias} onChange={(e) => update("perfilCompetencias", e.target.value)} rows={4} className="min-h-[80px]" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            💡 Os salários são gerenciados na listagem abaixo, vinculados à data base.
          </p>
          <div className="flex gap-2 mt-4">
            <Button type="submit" className="gap-2">
              <Plus className="h-4 w-4" />
              {editingId ? "Salvar Alterações" : "Adicionar Cargo"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
            )}
          </div>
        </form>

        <div className="section-card animate-fade-up" style={{ animationDelay: "160ms" }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="section-title mb-0">Cargos Cadastrados</h2>
            <div className="flex items-center gap-2">
              <Select value={filterNivel} onValueChange={setFilterNivel}>
                <SelectTrigger className="h-9 w-[130px] text-xs">
                  <SelectValue placeholder="Nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Níveis</SelectItem>
                  {niveis.map((n) => (
                    <SelectItem key={n} value={n}>Nível {n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-52">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Pesquisar cargos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
              </div>
            </div>
          </div>
          {filteredCargos.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              {cargos.length === 0 ? "Nenhum cargo cadastrado ainda." : "Nenhum resultado encontrado."}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {filteredCargos.map((cargo) => {
                const salarioAtual = getSalarioAtual(cargo.salarios);
                return (
                  <div key={cargo.id} className="py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
                        <p className="text-sm font-medium text-foreground truncate">{cargo.nome}</p>
                        <div>
                          {cargo.nivel && (
                            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              Nível {cargo.nivel}
                            </span>
                          )}
                        </div>
                        <div>
                          {salarioAtual ? (
                            <p className="text-sm text-muted-foreground tabular-nums">R$ {salarioAtual.valor}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">—</p>
                          )}
                        </div>
                        <div>
                          {salarioAtual?.dataBase ? (
                            <p className="text-xs text-muted-foreground">
                              Base: {new Date(salarioAtual.dataBase + "T00:00:00").toLocaleDateString("pt-BR")}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">—</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => setExpandedCargoId(expandedCargoId === cargo.id ? null : cargo.id)}
                          title="Histórico de salários"
                          className="text-xs gap-1"
                        >
                          {expandedCargoId === cargo.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          Salários
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(cargo)} className="text-xs">Editar</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(cargo.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {expandedCargoId === cargo.id && (
                      <>
                        {/* Salários */}
                        <div className="mt-3 ml-4 border-l-2 border-muted pl-4">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Histórico de Salários
                          </h4>
                          <div className="flex gap-2 mb-3">
                            <Input
                              placeholder="Valor (ex: 2.511,98)"
                              value={novoSalarioValor[cargo.id] || ""}
                              onChange={(e) => setNovoSalarioValor((prev) => ({ ...prev, [cargo.id]: e.target.value }))}
                              className="flex-1 h-8 text-sm"
                            />
                            <Input
                              type="date"
                              value={novoSalarioData[cargo.id] || ""}
                              onChange={(e) => setNovoSalarioData((prev) => ({ ...prev, [cargo.id]: e.target.value }))}
                              className="w-40 h-8 text-sm"
                            />
                            <Button type="button" size="sm" onClick={() => addSalario(cargo.id)} className="gap-1 shrink-0 h-8 text-xs">
                              <Plus className="h-3 w-3" /> Adicionar
                            </Button>
                          </div>

                          {(!cargo.salarios || cargo.salarios.length === 0) ? (
                            <p className="text-xs text-muted-foreground text-center py-3">Nenhum salário cadastrado.</p>
                          ) : (
                            <div className="divide-y divide-border rounded border border-border">
                              {[...cargo.salarios].sort((a, b) => (b.dataBase || "").localeCompare(a.dataBase || "")).map((sal) => (
                                <div key={sal.id} className="flex items-center justify-between px-3 py-2">
                                  {editingSalarioId === sal.id ? (
                                    <div className="flex items-center gap-2 flex-1">
                                      <Input
                                        value={editingSalarioValor}
                                        onChange={(e) => setEditingSalarioValor(e.target.value)}
                                        className="h-7 text-sm flex-1"
                                        autoFocus
                                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmEditSalario(cargo.id, sal.id); } if (e.key === "Escape") setEditingSalarioId(null); }}
                                      />
                                      <Input
                                        type="date"
                                        value={editingSalarioData}
                                        onChange={(e) => setEditingSalarioData(e.target.value)}
                                        className="h-7 text-sm w-40"
                                      />
                                      <Button type="button" variant="ghost" size="sm" onClick={() => confirmEditSalario(cargo.id, sal.id)} className="h-7 w-7 p-0 text-emerald-600">
                                        <Check className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditingSalarioId(null)} className="h-7 w-7 p-0">
                                        <X className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium tabular-nums">R$ {sal.valor}</span>
                                        {sal.dataBase && (
                                          <Badge variant="outline" className="text-[10px]">
                                            {new Date(sal.dataBase + "T00:00:00").toLocaleDateString("pt-BR")}
                                          </Badge>
                                        )}
                                        {sal.id === getSalarioAtual(cargo.salarios)?.id && (
                                          <Badge variant="default" className="text-[9px]">Atual</Badge>
                                        )}
                                      </div>
                                      <div className="flex gap-1">
                                        <Button type="button" variant="ghost" size="sm" onClick={() => startEditSalario(sal)} className="h-7" title="Editar">
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => deleteSalario(cargo.id, sal.id)} className="text-destructive hover:text-destructive h-7">
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Anexos */}
                        <div className="mt-4 ml-4 border-l-2 border-muted pl-4">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            {`Anexos (${(cargo.anexos || []).length}/${MAX_ANEXOS})`}
                          </h4>
                          {(cargo.anexos || []).length < MAX_ANEXOS && (
                            <div className="mb-3">
                              <input
                                type="file"
                                accept={ACCEPTED_TYPES}
                                className="hidden"
                                ref={(el) => { if (expandedCargoId === cargo.id) fileInputRef.current = el; }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadAnexo(cargo.id, file);
                                  e.target.value = "";
                                }}
                              />
                              <Button
                                type="button" variant="outline" size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="gap-1 text-xs"
                              >
                                <Upload className="h-3 w-3" />
                                {uploading ? "Enviando..." : "Anexar Documento"}
                              </Button>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                Word, PDF, Excel, JPG ou PNG
                              </p>
                            </div>
                          )}
                          {(!cargo.anexos || cargo.anexos.length === 0) ? (
                            <p className="text-xs text-muted-foreground text-center py-2">Nenhum anexo.</p>
                          ) : (
                            <div className="divide-y divide-border rounded border border-border">
                              {cargo.anexos.map((anexo) => (
                                <div key={anexo.id} className="flex items-center justify-between px-3 py-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span className="text-xs truncate">{anexo.nome}</span>
                                    <Badge variant="outline" className="text-[9px] shrink-0">{anexo.tipo.toUpperCase()}</Badge>
                                  </div>
                                  <div className="flex gap-1 shrink-0">
                                    <Button type="button" variant="ghost" size="sm" asChild className="h-7">
                                      <a href={anexo.url} target="_blank" rel="noopener noreferrer" title="Abrir">
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteAnexo(cargo.id, anexo)} className="text-destructive hover:text-destructive h-7">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cargos;
