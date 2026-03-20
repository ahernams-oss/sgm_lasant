import { useState } from "react";
import { UserCheck, Trash2, Pencil, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFuncionarios } from "@/contexts/FuncionariosContext";
import { useCargos } from "@/contexts/CargosContext";
import { useClientes } from "@/contexts/ClientesContext";
import { toast } from "sonner";

const emptyForm = {
  nome: "",
  cargoId: "",
  telefone: "+55 ",
  email: "",
  senha: "",
  clientesPermitidos: [] as string[],
};

const Funcionarios = () => {
  const { funcionarios, addFuncionario, updateFuncionario, deleteFuncionario } =
    useFuncionarios();
  const { cargos } = useCargos();
  const { clientes } = useClientes();

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSenha, setShowSenha] = useState(false);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleCliente = (clienteId: string) => {
    setForm((prev) => ({
      ...prev,
      clientesPermitidos: prev.clientesPermitidos.includes(clienteId)
        ? prev.clientesPermitidos.filter((id) => id !== clienteId)
        : [...prev.clientesPermitidos, clienteId],
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setShowSenha(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error("Informe o nome do funcionário.");
      return;
    }
    if (!form.cargoId) {
      toast.error("Selecione o cargo.");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Informe o e-mail.");
      return;
    }
    if (!editingId && !form.senha.trim()) {
      toast.error("Informe a senha.");
      return;
    }

    if (editingId) {
      updateFuncionario(editingId, form);
      toast.success("Funcionário atualizado.");
    } else {
      addFuncionario(form);
      toast.success("Funcionário cadastrado.");
    }
    resetForm();
  };

  const handleEdit = (f: (typeof funcionarios)[0]) => {
    setForm({
      nome: f.nome,
      cargoId: f.cargoId,
      telefone: f.telefone,
      email: f.email,
      senha: "",
      clientesPermitidos: [...f.clientesPermitidos],
    });
    setEditingId(f.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteFuncionario(id);
    if (editingId === id) resetForm();
    toast.success("Funcionário removido.");
  };

  const getCargoNome = (cargoId: string) =>
    cargos.find((c) => c.id === cargoId)?.nome ?? "—";

  const getClientesNomes = (ids: string[]) =>
    ids
      .map((id) => clientes.find((c) => c.id === id)?.nome)
      .filter(Boolean)
      .join(", ") || "Nenhum";

  return (
    <div className="bg-background">
      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-2 text-primary mb-1">
            <UserCheck className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Cadastro
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground mb-1">
                Funcionários
              </h1>
              <p className="text-sm text-muted-foreground max-w-lg">
                Gerencie os usuários do sistema e seus acessos por cliente.
              </p>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} className="shadow-md">
                Novo Funcionário
              </Button>
            )}
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm animate-fade-up"
          >
            <Tabs defaultValue="dados" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="dados">Dados do Funcionário</TabsTrigger>
                <TabsTrigger value="acessos">Acessos por Cliente</TabsTrigger>
              </TabsList>

              {/* Tab: Dados */}
              <TabsContent value="dados">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">
                      Nome *
                    </Label>
                    <Input
                      value={form.nome}
                      onChange={(e) => update("nome", e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">
                      Cargo *
                    </Label>
                    <Select
                      value={form.cargoId}
                      onValueChange={(v) => update("cargoId", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        {cargos.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">
                      Telefone
                    </Label>
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
                    <Label className="text-xs font-semibold text-foreground/80">
                      E-mail *
                    </Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="email@empresa.com"
                    />
                  </div>

                  <div className="space-y-1.5">
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
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowSenha(!showSenha)}
                        tabIndex={-1}
                      >
                        {showSenha ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Acessos */}
              <TabsContent value="acessos">
                <p className="text-sm text-muted-foreground mb-4">
                  Selecione os clientes que este funcionário poderá acessar no
                  sistema. Ele só verá requisições e funcionários dos clientes
                  marcados.
                </p>

                {clientes.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
                    Nenhum cliente cadastrado. Cadastre clientes primeiro.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {clientes.map((c) => {
                      const checked = form.clientesPermitidos.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                            checked
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border hover:border-muted-foreground/30"
                          }`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleCliente(c.id)}
                            className="mt-0.5"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {c.nome}
                            </p>
                            {c.cnpj && (
                              <p className="text-xs text-muted-foreground">
                                {c.cnpj}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" className="shadow-md">
                {editingId ? "Salvar Alterações" : "Cadastrar Funcionário"}
              </Button>
            </div>
          </form>
        )}

        {/* List */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground">
              Funcionários Cadastrados
            </h2>
          </div>

          {funcionarios.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Nenhum funcionário cadastrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Clientes com Acesso</TableHead>
                  <TableHead className="w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funcionarios.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.nome}</TableCell>
                    <TableCell>{getCargoNome(f.cargoId)}</TableCell>
                    <TableCell>{f.telefone}</TableCell>
                    <TableCell>{f.email}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {getClientesNomes(f.clientesPermitidos)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(f)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(f.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Funcionarios;
