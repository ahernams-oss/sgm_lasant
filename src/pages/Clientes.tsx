import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Users, Plus, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useClientes } from "@/contexts/ClientesContext";

const emptyForm = { nome: "", cnpj: "", contato: "", telefone: "", email: "", endereco: "" };

const Clientes = () => {
  const { clientes, addCliente, updateCliente, deleteCliente } = useClientes();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error("Informe o nome do cliente.");
      return;
    }
    if (editingId) {
      updateCliente(editingId, form);
      toast.success("Cliente atualizado com sucesso!");
    } else {
      addCliente(form);
      toast.success("Cliente cadastrado com sucesso!");
    }
    resetForm();
  };

  const handleEdit = (cliente: typeof clientes[0]) => {
    setEditingId(cliente.id);
    setForm({
      nome: cliente.nome,
      cnpj: cliente.cnpj,
      contato: cliente.contato,
      telefone: cliente.telefone,
      email: cliente.email,
      endereco: cliente.endereco,
    });
  };

  const handleDelete = (id: string) => {
    deleteCliente(id);
    toast.success("Cliente removido.");
    if (editingId === id) resetForm();
  };

  const filteredClientes = useMemo(() => {
    if (!search.trim()) return clientes;
    const term = search.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(term) ||
        c.cnpj.toLowerCase().includes(term) ||
        c.contato.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.telefone.toLowerCase().includes(term)
    );
  }, [clientes, search]);

  return (
    <div className="bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Cadastro</span>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">Clientes</h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            Cadastre e gerencie os clientes do sistema.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="section-card animate-fade-up mb-6"
          style={{ animationDelay: "80ms" }}
        >
          <h2 className="section-title">
            {editingId ? "Editar Cliente" : "Novo Cliente"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="field-label">Razão Social / Nome</label>
              <Input placeholder="Ex: Construtora ABC Ltda" value={form.nome} onChange={(e) => update("nome", e.target.value)} />
            </div>
            <div>
              <label className="field-label">CNPJ / CPF</label>
              <Input placeholder="Ex: 12.345.678/0001-90" value={form.cnpj} onChange={(e) => update("cnpj", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Pessoa de Contato</label>
              <Input placeholder="Ex: Maria Silva" value={form.contato} onChange={(e) => update("contato", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Telefone</label>
              <Input placeholder="Ex: (11) 99999-0000" value={form.telefone} onChange={(e) => update("telefone", e.target.value)} />
            </div>
            <div>
              <label className="field-label">E-mail</label>
              <Input type="email" placeholder="Ex: contato@empresa.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="field-label">Endereço</label>
              <Input placeholder="Ex: Rua das Flores, 123 - São Paulo/SP" value={form.endereco} onChange={(e) => update("endereco", e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit" className="gap-2">
              <Plus className="h-4 w-4" />
              {editingId ? "Salvar Alterações" : "Adicionar Cliente"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
            )}
          </div>
        </form>

        <div className="section-card animate-fade-up" style={{ animationDelay: "160ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Clientes Cadastrados</h2>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar clientes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
          {filteredClientes.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              {clientes.length === 0 ? "Nenhum cliente cadastrado ainda." : "Nenhum resultado encontrado."}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {filteredClientes.map((cliente) => (
                <div key={cliente.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="min-w-0 flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
                    <p className="text-sm font-medium text-foreground truncate">{cliente.nome}</p>
                    <p className="text-sm text-muted-foreground truncate tabular-nums">{cliente.cnpj || "—"}</p>
                    <p className="text-sm text-muted-foreground truncate">{cliente.contato || "—"}</p>
                    <p className="text-sm text-muted-foreground truncate">{cliente.telefone || "—"}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(cliente)} className="text-xs">Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(cliente.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Clientes;
