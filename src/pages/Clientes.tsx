import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Users, Trash2, Search, MessageCircle } from "lucide-react";
import { enviarWhatsApp } from "@/lib/whatsapp";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useClientes, type Cliente } from "@/contexts/ClientesContext";
import ClienteForm, { emptyForm, type FormData } from "@/components/ClienteForm";

const Clientes = () => {
  const { clientes, addCliente, updateCliente, deleteCliente } = useClientes();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<FormData | undefined>(undefined);
  const [search, setSearch] = useState("");

  const handleSubmit = (data: FormData, id: string | null) => {
    if (!data.nome.trim()) {
      toast.error("Informe o nome do cliente.");
      return;
    }
    const fullData = {
      ...data,
      informacoesFinanceiras: id ? (clientes.find(c => c.id === id)?.informacoesFinanceiras || []) : [],
      locais: id ? (clientes.find(c => c.id === id)?.locais || []) : [],
      locaisEntrega: id ? (clientes.find(c => c.id === id)?.locaisEntrega || []) : [],
    };
    if (id) {
      updateCliente(id, fullData);
      toast.success("Cliente atualizado com sucesso!");
    } else {
      addCliente(fullData);
      toast.success("Cliente cadastrado com sucesso!");
    }
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setEditingData(undefined);
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingId(cliente.id);
    const { id, informacoesFinanceiras, locais, locaisEntrega, ...rest } = cliente;
    setEditingData(rest as FormData);
  };

  const handleDelete = (id: string) => {
    deleteCliente(id);
    toast.success("Cliente removido.");
    if (editingId === id) resetForm();
  };

  const handleEnviarWhatsApp = async (cliente: Cliente) => {
    if (!cliente.telefones || cliente.telefones.length === 0) {
      toast.error("Cliente sem telefone cadastrado.");
      return;
    }
    const mensagem = `Olá ${cliente.contato || cliente.nome}! Aqui é da equipe de RH.`;
    toast.loading("Enviando mensagens...", { id: "whatsapp-send" });
    let successCount = 0;
    for (const tel of cliente.telefones) {
      const result = await enviarWhatsApp(tel, mensagem);
      if (result.success) successCount++;
    }
    if (successCount === cliente.telefones.length) {
      toast.success(`Mensagem enviada para ${successCount} número(s)!`, { id: "whatsapp-send" });
    } else {
      toast.error(`Enviada para ${successCount}/${cliente.telefones.length} números.`, { id: "whatsapp-send" });
    }
  };

  const filteredClientes = useMemo(() => {
    if (!search.trim()) return clientes;
    const term = search.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(term) ||
        c.nomeFantasia?.toLowerCase().includes(term) ||
        c.cnpj.toLowerCase().includes(term) ||
        c.contato.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.cidade?.toLowerCase().includes(term) ||
        c.telefones.some((t) => t.toLowerCase().includes(term))
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
            Cadastre e gerencie os clientes e fornecedores do sistema.
          </p>
        </div>

        <ClienteForm
          key={editingId || "new"}
          editingId={editingId}
          initialData={editingData}
          onSubmit={handleSubmit}
          onCancel={resetForm}
        />

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
                  <div className="min-w-0 flex-1 grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-1">
                    <p className="text-sm font-medium text-foreground truncate">{cliente.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">{cliente.tipo}</p>
                    <p className="text-sm text-muted-foreground truncate tabular-nums">{cliente.cnpj || "—"}</p>
                    <p className="text-sm text-muted-foreground truncate">{cliente.contato || "—"}</p>
                    <p className="text-sm text-muted-foreground truncate">{cliente.cidade ? `${cliente.cidade}/${cliente.uf}` : "—"}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleEnviarWhatsApp(cliente)} className="text-emerald-600 hover:text-emerald-700" title="Enviar WhatsApp">
                      <MessageCircle className="h-3.5 w-3.5" />
                    </Button>
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
