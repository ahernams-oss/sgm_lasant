import { useState, useMemo } from "react";
import { DoubleConfirmDelete, useDoubleConfirmDelete } from "@/components/DoubleConfirmDelete";
import PaginationControls, { paginate } from "@/components/PaginationControls";
import { Shield, Trash2, Pencil, Eye, EyeOff, Search, KeyRound, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useUsuarios } from "@/contexts/UsuariosContext";
import { useCargos } from "@/contexts/CargosContext";
import { useClientes } from "@/contexts/ClientesContext";
import { usePerfisAcesso } from "@/contexts/PerfisAcessoContext";
import { useAuth } from "@/contexts/AuthContext";
import { passwordSchema, isBcryptHash } from "@/lib/passwordPolicy";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const emptyForm = {
  nome: "", cargoId: "", telefone: "+55 ", email: "", senha: "",
  clientesPermitidos: [] as string[], perfilAcessoId: "",
  matricula: "", ramal: "",
  limiteAprovacaoCompras: 0, limiteAprovacaoOS: 0,
};

const Usuarios = () => {
  const { usuarios, addUsuario, updateUsuario, deleteUsuario } = useUsuarios();
  const { cargos } = useCargos();
  const { clientes } = useClientes();
  const { perfis } = usePerfisAcesso();
  const { resetSenha } = useAuth();

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCargo, setFilterCargo] = useState<string>("todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { deleteId, requestDelete, cancelDelete } = useDoubleConfirmDelete();
  const [searchClientes, setSearchClientes] = useState("");
  const [searchFornecedores, setSearchFornecedores] = useState("");
  const [auditoriaOpen, setAuditoriaOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleCliente = (clienteId: string) => {
    setForm((prev) => ({
      ...prev,
      clientesPermitidos: prev.clientesPermitidos.includes(clienteId)
        ? prev.clientesPermitidos.filter((id) => id !== clienteId)
        : [...prev.clientesPermitidos, clienteId],
    }));
  };

  const setMany = (ids: string[], add: boolean) => {
    setForm((prev) => {
      const set = new Set(prev.clientesPermitidos);
      if (add) ids.forEach((id) => set.add(id));
      else ids.forEach((id) => set.delete(id));
      return { ...prev, clientesPermitidos: Array.from(set) };
    });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setShowSenha(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) { toast.error("Informe o nome."); return; }
    if (!form.cargoId) { toast.error("Selecione o cargo."); return; }
    if (!form.email.trim()) { toast.error("Informe o e-mail."); return; }

    const senhaInformada = form.senha.trim().length > 0;
    if (!editingId && !senhaInformada) { toast.error("Informe a senha."); return; }

    // Valida política sempre que o usuário digitar uma senha
    if (senhaInformada) {
      const result = passwordSchema.safeParse(form.senha);
      if (!result.success) {
        toast.error(result.error.errors[0]?.message ?? "Senha inválida.");
        return;
      }
    }

    setSubmitting(true);
    try {
      // Salva o usuário SEM senha (ela será gravada hasheada via Edge Function)
      const dataSemSenha = { ...form, senha: "" };

      if (editingId) {
        // Mantém a senha atual se nada foi informado; usa update sem alterar senha
        const usuarioAtual = usuarios.find((u) => u.id === editingId);
        await updateUsuario(editingId, {
          ...dataSemSenha,
          senha: senhaInformada ? "" : (usuarioAtual?.senha ?? ""),
        });
        if (senhaInformada) {
          const { error } = await supabase.functions.invoke("auth-set-password", {
            body: { userId: editingId, novaSenha: form.senha },
          });
          if (error) throw error;
        }
        toast.success("Usuário atualizado.");
      } else {
        // 1. Cria o usuário sem senha para obter o id
        await addUsuario(dataSemSenha);
        // 2. Localiza o usuário recém-criado pelo email
        const { data: novo } = await supabase
          .from("usuarios")
          .select("id")
          .ilike("email", form.email.trim().toLowerCase())
          .maybeSingle();
        if (novo?.id) {
          const { error } = await supabase.functions.invoke("auth-set-password", {
            body: { userId: novo.id, novaSenha: form.senha },
          });
          if (error) throw error;
        }
        toast.success("Usuário cadastrado.");
      }
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar usuário.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (u: (typeof usuarios)[0]) => {
    setForm({
      nome: u.nome, cargoId: u.cargoId, telefone: u.telefone,
      email: u.email, senha: "", clientesPermitidos: [...u.clientesPermitidos],
      perfilAcessoId: u.perfilAcessoId, matricula: u.matricula, ramal: u.ramal,
      limiteAprovacaoCompras: u.limiteAprovacaoCompras ?? 0,
      limiteAprovacaoOS: u.limiteAprovacaoOS ?? 0,
    });
    setEditingId(u.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteUsuario(id);
    if (editingId === id) resetForm();
    toast.success("Usuário removido.");
  };
  const handleConfirmDelete = () => { if (deleteId) handleDelete(deleteId); };

  const handleForcarReset = async (email: string) => {
    const r = await resetSenha(email);
    if (r.ok) toast.success(r.message);
    else toast.error(r.message);
  };

  const getCargoNome = (cargoId: string) =>
    cargos.find((c) => c.id === cargoId)?.nome ?? "—";

  const getPerfilNome = (perfilId: string) =>
    perfis.find((p) => p.id === perfilId)?.nome ?? "—";

  const getClientesNomes = (ids: string[]) =>
    ids.map((id) => clientes.find((c) => c.id === id)?.nome).filter(Boolean).join(", ") || "Nenhum";

  const filteredUsuarios = useMemo(() => {
    let result = usuarios;
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.nome.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.telefone.toLowerCase().includes(term) ||
          getCargoNome(u.cargoId).toLowerCase().includes(term)
      );
    }
    if (filterCargo !== "todos") {
      result = result.filter((u) => u.cargoId === filterCargo);
    }
    return result;
  }, [usuarios, search, filterCargo, cargos]);

  // Auditoria de senhas
  const auditoria = useMemo(() => {
    const semSenha = usuarios.filter((u) => !u.senha || u.senha.trim() === "");
    const legado = usuarios.filter((u) => u.senha && !isBcryptHash(u.senha));
    const seguros = usuarios.filter((u) => isBcryptHash(u.senha));
    return { semSenha, legado, seguros };
  }, [usuarios]);

  return (
    <div className="bg-background">
      <div className="container max-w-full mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Administração</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground mb-1">Usuários</h1>
              <p className="text-sm text-muted-foreground max-w-lg">
                Gerencie os usuários do sistema e seus acessos por cliente.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setAuditoriaOpen(true)}>
                <Shield className="h-4 w-4 mr-2" /> Auditoria de Acessos
              </Button>
              {!showForm && (
                <Button onClick={() => setShowForm(true)} className="shadow-md">Novo Usuário</Button>
              )}
            </div>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm animate-fade-up">
            <Tabs defaultValue="dados" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="dados">Dados do Usuário</TabsTrigger>
                <TabsTrigger value="acessos">Acessos por Cliente</TabsTrigger>
              </TabsList>

              <TabsContent value="dados">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">Nome *</Label>
                    <Input value={form.nome} onChange={(e) => update("nome", e.target.value)} placeholder="Nome completo" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">Cargo *</Label>
                    <Select value={form.cargoId} onValueChange={(v) => update("cargoId", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
                      <SelectContent>
                        {cargos.map((c) => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">Telefone</Label>
                    <Input
                      value={form.telefone}
                      onChange={(e) => {
                        let v = e.target.value;
                        if (!v.startsWith("+55 ")) v = "+55 " + v.replace(/^\+55\s?/, "");
                        update("telefone", v);
                      }}
                      placeholder="+55 21 99999-9999"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">Matrícula</Label>
                    <Input value={form.matricula} onChange={(e) => update("matricula", e.target.value)} placeholder="Matrícula" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">Ramal</Label>
                    <Input value={form.ramal} onChange={(e) => update("ramal", e.target.value)} placeholder="Ramal" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">E-mail *</Label>
                    <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@empresa.com" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold text-foreground/80">
                      Senha {editingId ? "(deixe vazio para manter)" : "*"}
                    </Label>
                    <div className="relative">
                      <Input
                        type={showSenha ? "text" : "password"}
                        value={form.senha}
                        onChange={(e) => update("senha", e.target.value)}
                        placeholder="••••••••"
                        className="pr-10"
                        autoComplete="new-password"
                      />
                      <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowSenha(!showSenha)} tabIndex={-1}>
                        {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <PasswordStrengthMeter senha={form.senha} />
                    <p className="text-[11px] text-muted-foreground">
                      Mínimo 8 caracteres, com maiúscula, número e caractere especial.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">Perfil de Acesso</Label>
                    <Select value={form.perfilAcessoId || "nenhum"} onValueChange={(v) => update("perfilAcessoId", v === "nenhum" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione o perfil" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nenhum">Nenhum</SelectItem>
                        {perfis.map((p) => (<SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">Limite Aprovação Compras (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.limiteAprovacaoCompras}
                      onChange={(e) => update("limiteAprovacaoCompras", parseFloat(e.target.value.replace(",", ".")) || 0)}
                      placeholder="0,00"
                    />
                    <p className="text-[11px] text-muted-foreground">Valor máximo que o usuário pode aprovar em cotações de compras. 0 = sem permissão.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">Limite Aprovação OS / SS (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.limiteAprovacaoOS}
                      onChange={(e) => update("limiteAprovacaoOS", parseFloat(e.target.value.replace(",", ".")) || 0)}
                      placeholder="0,00"
                    />
                    <p className="text-[11px] text-muted-foreground">Valor máximo que o usuário pode aprovar em Ordens e Solicitações de Serviço. 0 = sem permissão.</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="acessos">
                <p className="text-sm text-muted-foreground mb-4">
                  Selecione os clientes e fornecedores que este usuário poderá acessar. Ele só verá requisições e funcionários dos clientes marcados.
                </p>
                {clientes.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
                    Nenhum cliente ou fornecedor cadastrado.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Clientes */}
                    {(() => {
                      const lista = clientes.filter(c => c.tipo !== "Fornecedor");
                      const term = searchClientes.trim().toLowerCase();
                      const filtrados = term
                        ? lista.filter(c => c.nome.toLowerCase().includes(term) || c.cnpj?.toLowerCase().includes(term))
                        : lista;
                      const filtradosIds = filtrados.map(c => c.id);
                      const marcados = filtradosIds.filter(id => form.clientesPermitidos.includes(id)).length;
                      return (
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-3">
                              <h3 className="text-sm font-semibold text-foreground">Clientes</h3>
                              <span className="text-xs text-muted-foreground">{marcados}/{filtrados.length} selecionados</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="relative w-56">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input value={searchClientes} onChange={(e) => setSearchClientes(e.target.value)} placeholder="Buscar cliente..." className="pl-8 h-8 text-xs" />
                              </div>
                              <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => setMany(filtradosIds, true)}>Selecionar todos</Button>
                              <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => setMany(filtradosIds, false)}>Limpar</Button>
                            </div>
                          </div>
                          {filtrados.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {filtrados.map((c) => {
                                const checked = form.clientesPermitidos.includes(c.id);
                                return (
                                  <label key={c.id} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${checked ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/30"}`}>
                                    <Checkbox checked={checked} onCheckedChange={() => toggleCliente(c.id)} className="mt-0.5" />
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">{c.nome}</p>
                                      {c.cnpj && <p className="text-xs text-muted-foreground">{c.cnpj}</p>}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Fornecedores */}
                    {(() => {
                      const lista = clientes.filter(c => c.tipo === "Fornecedor");
                      const term = searchFornecedores.trim().toLowerCase();
                      const filtrados = term
                        ? lista.filter(c => c.nome.toLowerCase().includes(term) || c.cnpj?.toLowerCase().includes(term))
                        : lista;
                      const filtradosIds = filtrados.map(c => c.id);
                      const marcados = filtradosIds.filter(id => form.clientesPermitidos.includes(id)).length;
                      return (
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-3">
                              <h3 className="text-sm font-semibold text-foreground">Fornecedores</h3>
                              <span className="text-xs text-muted-foreground">{marcados}/{filtrados.length} selecionados</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="relative w-56">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input value={searchFornecedores} onChange={(e) => setSearchFornecedores(e.target.value)} placeholder="Buscar fornecedor..." className="pl-8 h-8 text-xs" />
                              </div>
                              <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => setMany(filtradosIds, true)}>Selecionar todos</Button>
                              <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => setMany(filtradosIds, false)}>Limpar</Button>
                            </div>
                          </div>
                          {filtrados.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhum fornecedor encontrado.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {filtrados.map((c) => {
                                const checked = form.clientesPermitidos.includes(c.id);
                                return (
                                  <label key={c.id} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${checked ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/30"}`}>
                                    <Checkbox checked={checked} onCheckedChange={() => toggleCliente(c.id)} className="mt-0.5" />
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">{c.nome}</p>
                                      {c.cnpj && <p className="text-xs text-muted-foreground">{c.cnpj}</p>}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>Cancelar</Button>
              <Button type="submit" className="shadow-md" disabled={submitting}>
                {submitting ? "Salvando..." : (editingId ? "Salvar Alterações" : "Cadastrar Usuário")}
              </Button>
            </div>
          </form>
        )}

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Usuários Cadastrados</h2>
            <div className="flex items-center gap-2">
              <Select value={filterCargo} onValueChange={setFilterCargo}>
                <SelectTrigger className="h-9 w-[150px] text-xs">
                  <SelectValue placeholder="Cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Cargos</SelectItem>
                  {cargos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-52">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Pesquisar usuários..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9" />
              </div>
            </div>
          </div>
          {filteredUsuarios.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {usuarios.length === 0 ? "Nenhum usuário cadastrado." : "Nenhum resultado encontrado."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Perfil de Acesso</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Clientes com Acesso</TableHead>
                  <TableHead className="w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginate(filteredUsuarios, page, pageSize).paginated.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nome}</TableCell>
                    <TableCell>{getCargoNome(u.cargoId)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${u.perfilAcessoId ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {getPerfilNome(u.perfilAcessoId)}
                      </span>
                    </TableCell>
                    <TableCell>{u.telefone}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{getClientesNomes(u.clientesPermitidos)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(u)} className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => requestDelete(u.id)} className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <PaginationControls currentPage={page} totalItems={filteredUsuarios.length} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </div>
      </div>
      <DoubleConfirmDelete open={!!deleteId} onOpenChange={(open) => !open && cancelDelete()} onConfirm={handleConfirmDelete} />

      {/* Diálogo de Auditoria de Acessos */}
      <Dialog open={auditoriaOpen} onOpenChange={setAuditoriaOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Auditoria de Acessos
            </DialogTitle>
            <DialogDescription>
              Diagnóstico das credenciais armazenadas. Use "Forçar redefinição" para gerar e enviar uma senha temporária por e-mail.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs text-emerald-700 font-semibold uppercase">Senhas seguras</p>
              <p className="text-2xl font-bold text-emerald-700">{auditoria.seguros.length}</p>
            </div>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <p className="text-xs text-yellow-700 font-semibold uppercase">Senhas legadas</p>
              <p className="text-2xl font-bold text-yellow-700">{auditoria.legado.length}</p>
            </div>
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-xs text-destructive font-semibold uppercase">Sem senha</p>
              <p className="text-2xl font-bold text-destructive">{auditoria.semSenha.length}</p>
            </div>
          </div>

          {auditoria.semSenha.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Usuários sem senha cadastrada
              </h3>
              <div className="rounded-lg border border-border divide-y">
                {auditoria.semSenha.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm font-medium">{u.nome}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleForcarReset(u.email)}>
                      <KeyRound className="h-3.5 w-3.5 mr-1.5" /> Forçar redefinição
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {auditoria.legado.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Senhas em formato legado (texto puro)
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                Estas senhas serão automaticamente migradas para hash bcrypt no próximo login do usuário. Para acelerar, force a redefinição.
              </p>
              <div className="rounded-lg border border-border divide-y max-h-[300px] overflow-y-auto">
                {auditoria.legado.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm font-medium">{u.nome}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleForcarReset(u.email)}>
                      <KeyRound className="h-3.5 w-3.5 mr-1.5" /> Forçar redefinição
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {auditoria.semSenha.length === 0 && auditoria.legado.length === 0 && (
            <div className="text-center py-6 text-sm text-muted-foreground">
              ✅ Todos os usuários estão com senhas seguras (hash bcrypt).
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Usuarios;
