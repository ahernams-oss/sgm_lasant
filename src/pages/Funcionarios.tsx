import React, { useState, useMemo } from "react";
import { UserCheck, Trash2, Pencil, Search, Plus, ChevronDown, ChevronUp, Bus, Paperclip, Users, FileDown, HardHat, Stethoscope, TrendingUp, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useFuncionarios, emptyFuncionarioForm, PassagemDiaria, Dependente, AnexoDependente, EpiItem, NrFuncionario, tiposTransporte, grausParentesco } from "@/contexts/FuncionariosContext";
import { useCargos } from "@/contexts/CargosContext";
import { useClientes } from "@/contexts/ClientesContext";
import { toast } from "sonner";
import { gerarPdfFuncionario } from "@/lib/gerarPdfFuncionario";
import { gerarPdfEpi } from "@/lib/gerarPdfEpi";
import { ExamesPeriodicosTab } from "@/components/ExamesPeriodicosTab";
import { PromocoesTab } from "@/components/PromocoesTab";
import { NRsFuncionarioTab } from "@/components/NRsFuncionarioTab";

const UF_OPTIONS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const STATUS_OPTIONS = ["Ativo", "Inativo", "Afastado", "Férias"] as const;
const SEXO_OPTIONS = ["Masculino", "Feminino", "Outro"];
const ESTADO_CIVIL_OPTIONS = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável"];
const TIPO_CONTRATO_OPTIONS = ["CLT", "PJ", "Temporário", "Estágio", "Jovem Aprendiz"];
const TIPO_CONTA_OPTIONS = ["Corrente", "Poupança", "Salário"];
const CATEGORIA_CNH_OPTIONS = ["A", "B", "AB", "C", "D", "E", "ACC"];

const Field = ({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold text-foreground/80">{label}{required && " *"}</Label>
    {children}
  </div>
);

const PassagemTab = ({ passagens, onChange }: { passagens: PassagemDiaria[]; onChange: (p: PassagemDiaria[]) => void }) => {
  const [novaPassagem, setNovaPassagem] = useState({ tipoTransporte: "" as string, itinerario: "", valorPassagem: "", quantidade: 1 });

  const addPassagem = () => {
    if (!novaPassagem.tipoTransporte || !novaPassagem.itinerario || !novaPassagem.valorPassagem) return;
    const valor = parseFloat(novaPassagem.valorPassagem.replace(",", ".")) || 0;
    const total = valor * novaPassagem.quantidade;
    const nova: PassagemDiaria = {
      id: crypto.randomUUID(),
      tipoTransporte: novaPassagem.tipoTransporte as any,
      itinerario: novaPassagem.itinerario,
      valorPassagem: novaPassagem.valorPassagem,
      quantidade: novaPassagem.quantidade,
      total,
    };
    onChange([...passagens, nova]);
    setNovaPassagem({ tipoTransporte: "", itinerario: "", valorPassagem: "", quantidade: 1 });
  };

  const removePassagem = (id: string) => onChange(passagens.filter((p) => p.id !== id));

  const totalGeral = passagens.reduce((acc, p) => acc + p.total, 0);

  // Agrupar por tipo de transporte
  const porTipo = passagens.reduce<Record<string, { passagens: PassagemDiaria[]; total: number }>>((acc, p) => {
    const key = p.tipoTransporte || "Outros";
    if (!acc[key]) acc[key] = { passagens: [], total: 0 };
    acc[key].passagens.push(p);
    acc[key].total += p.total;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <Field label="Tipo de Transporte">
          <Select value={novaPassagem.tipoTransporte} onValueChange={(v) => setNovaPassagem((p) => ({ ...p, tipoTransporte: v }))}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {tiposTransporte.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Itinerário">
          <Input value={novaPassagem.itinerario} onChange={(e) => setNovaPassagem((p) => ({ ...p, itinerario: e.target.value }))} placeholder="Ex: Casa → Trabalho" />
        </Field>
        <Field label="Valor da Passagem (R$)">
          <Input value={novaPassagem.valorPassagem} onChange={(e) => setNovaPassagem((p) => ({ ...p, valorPassagem: e.target.value }))} placeholder="Ex: 4,50" />
        </Field>
        <Field label="Quantidade">
          <Input type="number" min={1} value={novaPassagem.quantidade} onChange={(e) => setNovaPassagem((p) => ({ ...p, quantidade: parseInt(e.target.value) || 1 }))} />
        </Field>
        <Button type="button" onClick={addPassagem} className="shadow-md">
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </div>

      {passagens.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo Transporte</TableHead>
                <TableHead>Itinerário</TableHead>
                <TableHead>Valor Unit.</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(porTipo)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([tipo, grupo]) => (
                  <React.Fragment key={tipo}>
                    {grupo.passagens.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.tipoTransporte}</TableCell>
                        <TableCell>{p.itinerario}</TableCell>
                        <TableCell>R$ {parseFloat(p.valorPassagem.replace(",", ".")).toFixed(2).replace(".", ",")}</TableCell>
                        <TableCell>{p.quantidade}</TableCell>
                        <TableCell className="font-medium">R$ {p.total.toFixed(2).replace(".", ",")}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" type="button" onClick={() => removePassagem(p.id)} className="h-7 w-7 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={4} className="text-xs font-semibold text-right">Subtotal ({tipo}):</TableCell>
                      <TableCell className="font-bold text-sm">R$ {grupo.total.toFixed(2).replace(".", ",")}</TableCell>
                      <TableCell />
                    </TableRow>
                  </React.Fragment>
                ))}
              <TableRow className="bg-primary/5">
                <TableCell colSpan={4} className="text-sm font-bold text-right">Total Geral:</TableCell>
                <TableCell className="font-bold text-base text-primary">R$ {totalGeral.toFixed(2).replace(".", ",")}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

const DependentesTab = ({ dependentes, onChange }: { dependentes: Dependente[]; onChange: (d: Dependente[]) => void }) => {
  const [novo, setNovo] = useState({ nome: "", cpf: "", dataNascimento: "", grauParentesco: "" });

  const addDependente = () => {
    if (!novo.nome.trim() || !novo.grauParentesco) { toast.error("Informe nome e grau de parentesco."); return; }
    onChange([...dependentes, { id: crypto.randomUUID(), ...novo, anexos: [] }]);
    setNovo({ nome: "", cpf: "", dataNascimento: "", grauParentesco: "" });
  };

  const removeDependente = (id: string) => onChange(dependentes.filter((d) => d.id !== id));

  const handleAnexo = (depId: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 5MB)."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const anexo: AnexoDependente = { id: crypto.randomUUID(), nome: file.name, base64: reader.result as string, tipo: file.type };
      onChange(dependentes.map((d) => d.id === depId ? { ...d, anexos: [...d.anexos, anexo] } : d));
    };
    reader.readAsDataURL(file);
  };

  const removeAnexo = (depId: string, anexoId: string) =>
    onChange(dependentes.map((d) => d.id === depId ? { ...d, anexos: d.anexos.filter((a) => a.id !== anexoId) } : d));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <Field label="Nome do Dependente">
          <Input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Nome completo" />
        </Field>
        <Field label="CPF">
          <Input value={novo.cpf} onChange={(e) => setNovo({ ...novo, cpf: e.target.value })} placeholder="000.000.000-00" />
        </Field>
        <Field label="Data de Nascimento">
          <Input type="date" value={novo.dataNascimento} onChange={(e) => setNovo({ ...novo, dataNascimento: e.target.value })} />
        </Field>
        <Field label="Grau de Parentesco">
          <Select value={novo.grauParentesco} onValueChange={(v) => setNovo({ ...novo, grauParentesco: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {grausParentesco.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Button type="button" onClick={addDependente} size="sm" className="h-10">
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </div>

      {dependentes.length > 0 && (
        <div className="space-y-3">
          {dependentes.map((dep) => (
            <div key={dep.id} className="border border-border rounded-lg p-4 bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="font-semibold text-foreground">{dep.nome}</span>
                  {dep.cpf && <span className="text-muted-foreground">CPF: {dep.cpf}</span>}
                  {dep.dataNascimento && <span className="text-muted-foreground">Nasc: {dep.dataNascimento.split("-").reverse().join("/")}</span>}
                  <Badge variant="secondary">{dep.grauParentesco}</Badge>
                </div>
                <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeDependente(dep.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="cursor-pointer inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <Paperclip className="h-3.5 w-3.5" />
                  Anexar documento
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => { if (e.target.files?.[0]) handleAnexo(dep.id, e.target.files[0]); e.target.value = ""; }} />
                </label>
                {dep.anexos.map((a) => (
                  <div key={a.id} className="flex items-center gap-1 bg-background border border-border rounded px-2 py-1 text-xs">
                    <a href={a.base64} download={a.nome} className="text-primary hover:underline truncate max-w-[150px]">{a.nome}</a>
                    <button type="button" onClick={() => removeAnexo(dep.id, a.id)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const EpiTab = ({ epis, onChange }: { epis: EpiItem[]; onChange: (e: EpiItem[]) => void }) => {
  const [novo, setNovo] = useState({ quantidade: 1, descricao: "", ca: "", dataEntrega: "" });

  const addEpi = () => {
    if (!novo.descricao.trim()) { toast.error("Informe a descrição do EPI."); return; }
    onChange([...epis, { id: crypto.randomUUID(), ...novo }]);
    setNovo({ quantidade: 1, descricao: "", ca: "", dataEntrega: "" });
  };

  const removeEpi = (id: string) => onChange(epis.filter((e) => e.id !== id));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <Field label="Quantidade">
          <Input type="number" min={1} value={novo.quantidade} onChange={(e) => setNovo({ ...novo, quantidade: parseInt(e.target.value) || 1 })} />
        </Field>
        <Field label="E.P.I" required>
          <Input value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} placeholder="Descrição do EPI" />
        </Field>
        <Field label="CA">
          <Input value={novo.ca} onChange={(e) => setNovo({ ...novo, ca: e.target.value })} placeholder="Nº do CA" />
        </Field>
        <Field label="Data de Entrega">
          <Input type="date" value={novo.dataEntrega} onChange={(e) => setNovo({ ...novo, dataEntrega: e.target.value })} />
        </Field>
        <Button type="button" onClick={addEpi} size="sm" className="h-10">
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </div>

      {epis.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Quant.</TableHead>
                <TableHead>E.P.I</TableHead>
                <TableHead className="w-24">CA</TableHead>
                <TableHead className="w-32">Data Entrega</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {epis.map((epi) => (
                <TableRow key={epi.id}>
                  <TableCell className="text-center">{String(epi.quantidade).padStart(2, "0")}</TableCell>
                  <TableCell>{epi.descricao}</TableCell>
                  <TableCell className="text-center">{epi.ca || "—"}</TableCell>
                  <TableCell className="text-center">{epi.dataEntrega ? epi.dataEntrega.split("-").reverse().join("/") : "—"}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" type="button" onClick={() => removeEpi(epi.id)} className="h-7 w-7 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

const Funcionarios = () => {
  const { funcionarios, addFuncionario, updateFuncionario, deleteFuncionario } = useFuncionarios();
  const { cargos } = useCargos();
  const { clientes } = useClientes();

  const [form, setForm] = useState(emptyFuncionarioForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterCliente, setFilterCliente] = useState<string>("todos");

  const update = (field: string, value: string | boolean | PassagemDiaria[] | Dependente[] | EpiItem[] | NrFuncionario[]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const resetForm = () => {
    setForm(emptyFuncionarioForm);
    setEditingId(null);
    setShowForm(false);
  };

  const buscarCep = async () => {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          uf: data.uf || prev.uf,
        }));
      }
    } catch { /* ignore */ }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) { toast.error("Informe o nome."); return; }
    if (!form.cpf.trim()) { toast.error("Informe o CPF."); return; }
    if (!form.cargoId) { toast.error("Selecione o cargo."); return; }

    if (editingId) {
      updateFuncionario(editingId, form);
      toast.success("Funcionário atualizado.");
    } else {
      addFuncionario(form);
      toast.success("Funcionário cadastrado.");
    }
    resetForm();
  };

  const handleEdit = (f: typeof funcionarios[0]) => {
    const { id, ...rest } = f;
    setForm({ ...emptyFuncionarioForm, ...rest });
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteFuncionario(id);
    if (editingId === id) resetForm();
    toast.success("Funcionário removido.");
  };

  const getCargoNome = (cargoId: string) =>
    cargos.find((c) => c.id === cargoId)?.nome ?? "—";

  const getClienteNome = (clienteId: string) =>
    clientes.find((c) => c.id === clienteId)?.nome ?? "—";

  const filteredFuncionarios = useMemo(() => {
    let result = funcionarios;
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.nome.toLowerCase().includes(term) ||
          f.cpf.includes(term) ||
          f.email.toLowerCase().includes(term) ||
          getCargoNome(f.cargoId).toLowerCase().includes(term)
      );
    }
    if (filterStatus !== "todos") result = result.filter((f) => f.status === filterStatus);
    if (filterCliente !== "todos") result = result.filter((f) => f.clienteId === filterCliente);
    return result;
  }, [funcionarios, search, filterStatus, filterCliente, cargos, clientes]);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Ativo: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      Inativo: "bg-muted text-muted-foreground",
      Afastado: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      Férias: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    };
    return <Badge className={`${map[status] || ""} text-xs font-medium`}>{status}</Badge>;
  };


  return (
    <div className="bg-background">
      <div className="container max-w-full mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-2 text-primary mb-1">
            <UserCheck className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Cadastro</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground mb-1">Funcionários</h1>
              <p className="text-sm text-muted-foreground max-w-lg">
                Gerencie o cadastro completo de funcionários da empresa.
              </p>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} className="shadow-md">
                <Plus className="h-4 w-4 mr-1" /> Novo Funcionário
              </Button>
            )}
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm animate-fade-up">
            <Tabs defaultValue="pessoal" className="w-full">
              <TabsList className="mb-6 flex-wrap h-auto gap-1">
                <TabsTrigger value="pessoal">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="endereco">Endereço</TabsTrigger>
                <TabsTrigger value="profissional">Dados Profissionais</TabsTrigger>
                <TabsTrigger value="bancario">Dados Bancários</TabsTrigger>
                <TabsTrigger value="documentos">Documentos</TabsTrigger>
                <TabsTrigger value="uniforme">Uniforme</TabsTrigger>
                <TabsTrigger value="passagem">Passagem</TabsTrigger>
                <TabsTrigger value="dependentes">Dependentes</TabsTrigger>
                <TabsTrigger value="epis">EPIs</TabsTrigger>
                <TabsTrigger value="nrs">NRs</TabsTrigger>
                <TabsTrigger value="exames">Exames Periódicos</TabsTrigger>
                <TabsTrigger value="promocoes">Promoções</TabsTrigger>
                <TabsTrigger value="observacoes">Observações</TabsTrigger>
              </TabsList>

              {/* DADOS PESSOAIS */}
              <TabsContent value="pessoal">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field label="Nome Completo" required>
                    <Input value={form.nome} onChange={(e) => update("nome", e.target.value)} placeholder="Nome completo" />
                  </Field>
                  <Field label="CPF" required>
                    <Input value={form.cpf} onChange={(e) => update("cpf", e.target.value)} placeholder="000.000.000-00" />
                  </Field>
                  <Field label="RG">
                    <Input value={form.rg} onChange={(e) => update("rg", e.target.value)} placeholder="RG" />
                  </Field>
                  <Field label="Órgão Emissor">
                    <Input value={form.orgaoEmissor} onChange={(e) => update("orgaoEmissor", e.target.value)} placeholder="SSP/RJ" />
                  </Field>
                  <Field label="Data de Nascimento">
                    <Input type="date" value={form.dataNascimento} onChange={(e) => update("dataNascimento", e.target.value)} />
                  </Field>
                  <Field label="Sexo">
                    <Select value={form.sexo} onValueChange={(v) => update("sexo", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {SEXO_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Estado Civil">
                    <Select value={form.estadoCivil} onValueChange={(v) => update("estadoCivil", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {ESTADO_CIVIL_OPTIONS.map((ec) => <SelectItem key={ec} value={ec}>{ec}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Nacionalidade">
                    <Input value={form.nacionalidade} onChange={(e) => update("nacionalidade", e.target.value)} />
                  </Field>
                  <Field label="Naturalidade">
                    <Input value={form.naturalidade} onChange={(e) => update("naturalidade", e.target.value)} placeholder="Cidade/UF" />
                  </Field>
                  <Field label="Nome da Mãe">
                    <Input value={form.nomeMae} onChange={(e) => update("nomeMae", e.target.value)} />
                  </Field>
                  <Field label="Nome do Pai">
                    <Input value={form.nomePai} onChange={(e) => update("nomePai", e.target.value)} />
                  </Field>
                  <Field label="Telefone">
                    <Input
                      value={form.telefone}
                      onChange={(e) => {
                        let v = e.target.value;
                        if (!v.startsWith("+55 ")) v = "+55 " + v.replace(/^\+55\s?/, "");
                        update("telefone", v);
                      }}
                      placeholder="+55 21 99999-9999"
                    />
                  </Field>
                  <Field label="E-mail">
                    <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@exemplo.com" />
                  </Field>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">PCD</Label>
                    <div className="flex items-center gap-3 h-10">
                      <Checkbox checked={form.pcd} onCheckedChange={(v) => update("pcd", !!v)} />
                      <span className="text-sm text-foreground">Pessoa com deficiência</span>
                    </div>
                  </div>
                  {form.pcd && (
                    <Field label="Tipo de Deficiência">
                      <Input value={form.tipoPcd} onChange={(e) => update("tipoPcd", e.target.value)} placeholder="Tipo" />
                    </Field>
                  )}
                </div>
              </TabsContent>

              {/* ENDEREÇO */}
              <TabsContent value="endereco">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field label="CEP">
                    <Input value={form.cep} onChange={(e) => update("cep", e.target.value)} onBlur={buscarCep} placeholder="00000-000" />
                  </Field>
                  <Field label="Logradouro">
                    <Input value={form.logradouro} onChange={(e) => update("logradouro", e.target.value)} />
                  </Field>
                  <Field label="Número">
                    <Input value={form.numero} onChange={(e) => update("numero", e.target.value)} />
                  </Field>
                  <Field label="Complemento">
                    <Input value={form.complemento} onChange={(e) => update("complemento", e.target.value)} />
                  </Field>
                  <Field label="Bairro">
                    <Input value={form.bairro} onChange={(e) => update("bairro", e.target.value)} />
                  </Field>
                  <Field label="Cidade">
                    <Input value={form.cidade} onChange={(e) => update("cidade", e.target.value)} />
                  </Field>
                  <Field label="UF">
                    <Select value={form.uf} onValueChange={(v) => update("uf", v)}>
                      <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>
                        {UF_OPTIONS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </TabsContent>

              {/* DADOS PROFISSIONAIS */}
              <TabsContent value="profissional">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field label="Cargo" required>
                    <Select value={form.cargoId} onValueChange={(v) => {
                      update("cargoId", v);
                      const cargo = cargos.find((c) => c.id === v);
                      if (cargo) {
                        const salarioAtual = cargo.salarios?.length
                          ? [...cargo.salarios].sort((a, b) => (b.dataBase || "").localeCompare(a.dataBase || ""))[0].valor
                          : cargo.salario || "";
                        if (salarioAtual) update("salario", salarioAtual);
                      }
                    }}>
                      <SelectTrigger><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
                      <SelectContent>
                        {cargos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Cliente / Unidade">
                    <Select value={form.clienteId} onValueChange={(v) => update("clienteId", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {clientes.filter((c) => c.tipo === "Cliente").map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Tipo de Contrato">
                    <Select value={form.tipoContrato} onValueChange={(v) => update("tipoContrato", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIPO_CONTRATO_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Data de Admissão">
                    <Input type="date" value={form.dataAdmissao} onChange={(e) => {
                      const val = e.target.value;
                      update("dataAdmissao", val);
                      if (val && !form.experienciaInicio) {
                        update("experienciaInicio", val);
                        const d = new Date(val);
                        d.setDate(d.getDate() + 45);
                        update("experienciaPrimeiraEtapa", d.toISOString().split("T")[0]);
                        const d2 = new Date(val);
                        d2.setDate(d2.getDate() + 90);
                        update("experienciaFim", d2.toISOString().split("T")[0]);
                      }
                    }} />
                  </Field>
                  <Field label="Data de Demissão">
                    <Input type="date" value={form.dataDemissao} onChange={(e) => update("dataDemissao", e.target.value)} />
                  </Field>
                  <Field label="Salário">
                    <Input value={form.salario} onChange={(e) => update("salario", e.target.value)} placeholder="R$ 0,00" />
                  </Field>
                  <Field label="Jornada de Trabalho">
                    <Input value={form.jornadaTrabalho} onChange={(e) => update("jornadaTrabalho", e.target.value)} placeholder="44h semanais" />
                  </Field>
                  <Field label="CTPS">
                    <Input value={form.ctps} onChange={(e) => update("ctps", e.target.value)} />
                  </Field>
                  <Field label="Série CTPS">
                    <Input value={form.serieCtps} onChange={(e) => update("serieCtps", e.target.value)} />
                  </Field>
                  <Field label="PIS/PASEP">
                    <Input value={form.pis} onChange={(e) => update("pis", e.target.value)} />
                  </Field>
                  <Field label="Status">
                    <Select value={form.status} onValueChange={(v) => update("status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                {/* PERÍODO DE EXPERIÊNCIA */}
                {form.tipoContrato === "CLT" && (
                  <div className="mt-6 p-4 border border-border rounded-lg bg-muted/20">
                    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" /> Período de Experiência (45+45 dias)
                    </h3>
                    {(() => {
                      const hoje = new Date();
                      const fim1 = form.experienciaPrimeiraEtapa ? new Date(form.experienciaPrimeiraEtapa) : null;
                      const fimFinal = form.experienciaFim ? new Date(form.experienciaFim) : null;
                      let statusExp = "";
                      let statusClass = "";
                      if (fimFinal && hoje > fimFinal) {
                        statusExp = "Experiência concluída";
                        statusClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
                      } else if (fim1 && hoje > fim1 && form.experienciaRenovado) {
                        const dias = fimFinal ? Math.ceil((fimFinal.getTime() - hoje.getTime()) / 86400000) : 0;
                        statusExp = `2ª etapa – ${dias} dias restantes`;
                        statusClass = dias <= 10 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
                      } else if (fim1 && hoje <= fim1) {
                        const dias = Math.ceil((fim1.getTime() - hoje.getTime()) / 86400000);
                        statusExp = `1ª etapa – ${dias} dias restantes`;
                        statusClass = dias <= 10 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400";
                      } else if (fim1 && hoje > fim1 && !form.experienciaRenovado) {
                        statusExp = "Aguardando renovação";
                        statusClass = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
                      }
                      return (
                        <>
                          {statusExp && (
                            <Badge className={`${statusClass} text-xs font-medium mb-4`}>{statusExp}</Badge>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Field label="Início da Experiência">
                              <Input type="date" value={form.experienciaInicio} onChange={(e) => {
                                const val = e.target.value;
                                update("experienciaInicio", val);
                                if (val) {
                                  const d = new Date(val);
                                  d.setDate(d.getDate() + 45);
                                  update("experienciaPrimeiraEtapa", d.toISOString().split("T")[0]);
                                  const d2 = new Date(val);
                                  d2.setDate(d2.getDate() + 90);
                                  update("experienciaFim", d2.toISOString().split("T")[0]);
                                }
                              }} />
                            </Field>
                            <Field label="Fim 1ª Etapa (45 dias)">
                              <Input type="date" value={form.experienciaPrimeiraEtapa} onChange={(e) => update("experienciaPrimeiraEtapa", e.target.value)} />
                            </Field>
                            <Field label="Fim 2ª Etapa (90 dias)">
                              <Input type="date" value={form.experienciaFim} onChange={(e) => update("experienciaFim", e.target.value)} />
                            </Field>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-foreground/80">Renovação</Label>
                              <div className="flex items-center gap-3 h-10">
                                <Checkbox checked={form.experienciaRenovado} onCheckedChange={(v) => update("experienciaRenovado", !!v)} />
                                <span className="text-sm text-foreground">Renovado por +45 dias</span>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </TabsContent>

              {/* DADOS BANCÁRIOS */}
              <TabsContent value="bancario">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field label="Banco">
                    <Input value={form.banco} onChange={(e) => update("banco", e.target.value)} placeholder="Nome do banco" />
                  </Field>
                  <Field label="Agência">
                    <Input value={form.agencia} onChange={(e) => update("agencia", e.target.value)} />
                  </Field>
                  <Field label="Conta">
                    <Input value={form.conta} onChange={(e) => update("conta", e.target.value)} />
                  </Field>
                  <Field label="Tipo de Conta">
                    <Select value={form.tipoConta} onValueChange={(v) => update("tipoConta", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIPO_CONTA_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Chave PIX">
                    <Input value={form.chavePix} onChange={(e) => update("chavePix", e.target.value)} placeholder="CPF, e-mail, telefone ou aleatória" />
                  </Field>
                </div>
              </TabsContent>

              {/* DOCUMENTOS */}
              <TabsContent value="documentos">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field label="Título de Eleitor">
                    <Input value={form.tituloEleitor} onChange={(e) => update("tituloEleitor", e.target.value)} />
                  </Field>
                  <Field label="Zona Eleitoral">
                    <Input value={form.zonaEleitoral} onChange={(e) => update("zonaEleitoral", e.target.value)} />
                  </Field>
                  <Field label="Seção Eleitoral">
                    <Input value={form.secaoEleitoral} onChange={(e) => update("secaoEleitoral", e.target.value)} />
                  </Field>
                  <Field label="CNH">
                    <Input value={form.cnh} onChange={(e) => update("cnh", e.target.value)} />
                  </Field>
                  <Field label="Categoria CNH">
                    <Select value={form.categoriaCnh} onValueChange={(v) => update("categoriaCnh", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIA_CNH_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Validade CNH">
                    <Input type="date" value={form.validadeCnh} onChange={(e) => update("validadeCnh", e.target.value)} />
                  </Field>
                  <Field label="Certificado de Reservista">
                    <Input value={form.certificadoReservista} onChange={(e) => update("certificadoReservista", e.target.value)} />
                  </Field>
                </div>
              </TabsContent>

              {/* UNIFORME */}
              <TabsContent value="uniforme">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field label="Tamanho da Camisa">
                    <Input value={form.tamanhoCamisa} onChange={(e) => update("tamanhoCamisa", e.target.value)} placeholder="Ex: P, M, G, GG" />
                  </Field>
                  <Field label="Tamanho da Calça">
                    <Input value={form.tamanhoCalca} onChange={(e) => update("tamanhoCalca", e.target.value)} placeholder="Ex: 38, 40, 42" />
                  </Field>
                  <Field label="Tamanho do Calçado">
                    <Input value={form.tamanhoCalcado} onChange={(e) => update("tamanhoCalcado", e.target.value)} placeholder="Ex: 39, 40, 41" />
                  </Field>
                  <Field label="Peso (kg)">
                    <Input value={form.peso} onChange={(e) => update("peso", e.target.value)} placeholder="Ex: 75" />
                  </Field>
                  <Field label="Altura (cm)">
                    <Input value={form.altura} onChange={(e) => update("altura", e.target.value)} placeholder="Ex: 175" />
                  </Field>
                </div>
              </TabsContent>

              {/* PASSAGEM */}
              <TabsContent value="passagem">
                <PassagemTab passagens={form.passagens || []} onChange={(p) => update("passagens", p as any)} />
              </TabsContent>

              {/* DEPENDENTES */}
              <TabsContent value="dependentes">
                <DependentesTab dependentes={form.dependentes || []} onChange={(d) => update("dependentes", d as any)} />
              </TabsContent>

              {/* EPIs */}
              <TabsContent value="epis">
                <EpiTab epis={form.epis || []} onChange={(e) => update("epis", e as any)} />
              </TabsContent>

              {/* NRs */}
              <TabsContent value="nrs">
                <NRsFuncionarioTab
                  nrs={form.nrs || []}
                  onChange={(nrs) => update("nrs", nrs)}
                />
              </TabsContent>

              {/* EXAMES PERIÓDICOS */}
              <TabsContent value="exames">
                <ExamesPeriodicosTab
                  funcionarioId={editingId || ""}
                  funcionarioNome={form.nome}
                  funcionarioTelefone={form.telefone}
                  funcionarioEmail={form.email}
                />
              </TabsContent>

              {/* PROMOÇÕES */}
              <TabsContent value="promocoes">
                <PromocoesTab
                  funcionarioId={editingId || ""}
                  cargoAtualId={form.cargoId}
                  salarioAtual={form.salario}
                  clienteAtualId={form.clienteId}
                  onPromover={(dados) => {
                    update("cargoId", dados.cargoId);
                    update("salario", dados.salario);
                    update("clienteId", dados.clienteId);
                  }}
                />
              </TabsContent>

              {/* OBSERVAÇÕES */}
              <TabsContent value="observacoes">
                <Field label="Observações">
                  <Textarea value={form.observacoes} onChange={(e) => update("observacoes", e.target.value)} rows={5} placeholder="Anotações gerais sobre o funcionário..." />
                </Field>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button type="submit" className="shadow-md">{editingId ? "Salvar Alterações" : "Cadastrar Funcionário"}</Button>
            </div>
          </form>
        )}

        {/* TABELA */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Funcionários Cadastrados ({filteredFuncionarios.length})</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9 w-[130px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterCliente} onValueChange={setFilterCliente}>
                <SelectTrigger className="h-9 w-[150px] text-xs"><SelectValue placeholder="Cliente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Clientes</SelectItem>
                  {clientes.filter((c) => c.tipo === "Cliente").map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-52">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
              </div>
            </div>
          </div>
          {filteredFuncionarios.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {funcionarios.length === 0 ? "Nenhum funcionário cadastrado." : "Nenhum resultado encontrado."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Experiência</TableHead>
                    <TableHead className="w-24 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFuncionarios.map((f) => {
                    const expBadge = (() => {
                      if (!f.experienciaFim) return null;
                      const hoje = new Date();
                      const fim = new Date(f.experienciaFim);
                      const fim1 = f.experienciaPrimeiraEtapa ? new Date(f.experienciaPrimeiraEtapa) : null;
                      if (hoje > fim) return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">Concluída</Badge>;
                      const dias = Math.ceil((fim.getTime() - hoje.getTime()) / 86400000);
                      if (fim1 && hoje > fim1 && f.experienciaRenovado) {
                        return <Badge className={`${dias <= 10 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"} text-[10px]`}>2ª etapa – {dias}d</Badge>;
                      }
                      if (fim1 && hoje <= fim1) {
                        const d1 = Math.ceil((fim1.getTime() - hoje.getTime()) / 86400000);
                        return <Badge className={`${d1 <= 10 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"} text-[10px]`}>1ª etapa – {d1}d</Badge>;
                      }
                      if (fim1 && hoje > fim1 && !f.experienciaRenovado) {
                        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]">Aguard. renovação</Badge>;
                      }
                      return null;
                    })();
                    return (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.nome}</TableCell>
                      <TableCell>{f.cpf || "—"}</TableCell>
                      <TableCell>{getCargoNome(f.cargoId)}</TableCell>
                      <TableCell>{f.clienteId ? getClienteNome(f.clienteId) : "—"}</TableCell>
                      <TableCell>{f.telefone}</TableCell>
                      <TableCell>{statusBadge(f.status || "Ativo")}</TableCell>
                      <TableCell>{expBadge || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => gerarPdfFuncionario(f, { cargoNome: getCargoNome(f.cargoId), clienteNome: f.clienteId ? getClienteNome(f.clienteId) : "" })} className="h-8 w-8" title="Baixar PDF Ficha">
                            <FileDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => gerarPdfEpi(f, { cargoNome: getCargoNome(f.cargoId), clienteNome: f.clienteId ? getClienteNome(f.clienteId) : "" })} className="h-8 w-8" title="Baixar PDF EPI">
                            <HardHat className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(f)} className="h-8 w-8">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(f.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Funcionarios;
