import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Truck, Trash2, Search, MessageCircle, MoreVertical, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { enviarWhatsApp } from "@/lib/whatsapp";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useClientes, type Cliente } from "@/contexts/ClientesContext";
import ClienteForm, { emptyForm, type FormData } from "@/components/ClienteForm";
import LocaisSection from "@/components/LocaisSection";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Fornecedores = () => {
  const { clientes, addCliente, updateCliente, deleteCliente } = useClientes();
  const [formOpen, setFormOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<FormData | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [locaisClienteId, setLocaisClienteId] = useState<string | null>(null);

  const fornecedores = useMemo(() => clientes.filter((c) => c.tipo === "Fornecedor"), [clientes]);

  const handleSubmit = (data: FormData, id: string | null) => {
    if (!data.nome.trim()) {
      toast.error("Informe o nome do fornecedor.");
      return;
    }
    const fullData = {
      ...data,
      tipo: "Fornecedor" as const,
      informacoesFinanceiras: id ? (clientes.find(c => c.id === id)?.informacoesFinanceiras || []) : [],
      locais: id ? (clientes.find(c => c.id === id)?.locais || []) : [],
      locaisEntrega: id ? (clientes.find(c => c.id === id)?.locaisEntrega || []) : [],
      contratos: id ? (clientes.find(c => c.id === id)?.contratos || []) : [],
    };
    if (id) {
      updateCliente(id, fullData);
      toast.success("Fornecedor atualizado com sucesso!");
    } else {
      addCliente(fullData);
      toast.success("Fornecedor cadastrado com sucesso!");
    }
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setEditingData(undefined);
  };

  const handleEdit = (fornecedor: Cliente) => {
    setEditingId(fornecedor.id);
    const { id, informacoesFinanceiras, locais, locaisEntrega, ...rest } = fornecedor;
    setEditingData(rest as FormData);
  };

  const handleDelete = (id: string) => {
    deleteCliente(id);
    toast.success("Fornecedor removido.");
    if (editingId === id) resetForm();
  };

  const handleEnviarWhatsApp = async (fornecedor: Cliente) => {
    if (!fornecedor.telefones || fornecedor.telefones.length === 0) {
      toast.error("Fornecedor sem telefone cadastrado.");
      return;
    }
    const mensagem = `Olá ${fornecedor.contato || fornecedor.nome}! Aqui é da equipe de RH.`;
    toast.loading("Enviando mensagens...", { id: "whatsapp-send" });
    let successCount = 0;
    for (const tel of fornecedor.telefones) {
      const result = await enviarWhatsApp(tel, mensagem);
      if (result.success) successCount++;
    }
    if (successCount === fornecedor.telefones.length) {
      toast.success(`Mensagem enviada para ${successCount} número(s)!`, { id: "whatsapp-send" });
    } else {
      toast.error(`Enviada para ${successCount}/${fornecedor.telefones.length} números.`, { id: "whatsapp-send" });
    }
  };

  const filteredFornecedores = useMemo(() => {
    if (!search.trim()) return fornecedores;
    const term = search.toLowerCase();
    return fornecedores.filter(
      (c) =>
        c.nome.toLowerCase().includes(term) ||
        c.nomeFantasia?.toLowerCase().includes(term) ||
        c.cnpj.toLowerCase().includes(term) ||
        c.contato.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.cidade?.toLowerCase().includes(term) ||
        c.telefones.some((t) => t.toLowerCase().includes(term))
    );
  }, [fornecedores, search]);

  const defaultData: FormData = { ...emptyForm, tipo: "Fornecedor" };

  return (
    <div className="bg-background">
      <div className="container max-w-full mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Truck className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Cadastro</span>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">Fornecedores</h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            Cadastre e gerencie os fornecedores do sistema.
          </p>
        </div>

        <ClienteForm
          key={editingId || "new"}
          editingId={editingId}
          initialData={editingData || defaultData}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          tipoFixo="Fornecedor"
        />


        <div className="section-card animate-fade-up" style={{ animationDelay: "160ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Fornecedores Cadastrados</h2>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar fornecedores..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
          {filteredFornecedores.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              {fornecedores.length === 0 ? "Nenhum fornecedor cadastrado ainda." : "Nenhum resultado encontrado."}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {filteredFornecedores.map((fornecedor) => (
                <div key={fornecedor.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="min-w-0 flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
                    <p className="text-sm font-medium text-foreground truncate">{fornecedor.nome}</p>
                    <p className="text-sm text-muted-foreground truncate tabular-nums">{fornecedor.cnpj || "—"}</p>
                    <p className="text-sm text-muted-foreground truncate">{fornecedor.contato || "—"}</p>
                    <p className="text-sm text-muted-foreground truncate">{fornecedor.cidade ? `${fornecedor.cidade}/${fornecedor.uf}` : "—"}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleEnviarWhatsApp(fornecedor)} className="text-emerald-600 hover:text-emerald-700" title="Enviar WhatsApp">
                      <MessageCircle className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(fornecedor)} className="text-xs">Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(fornecedor.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setLocaisClienteId(locaisClienteId === fornecedor.id ? null : fornecedor.id)}>
                          <MapPin className="mr-2 h-4 w-4" />
                          Locais
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {locaisClienteId && (
          <LocaisSection
            locais={clientes.find((c) => c.id === locaisClienteId)?.locais || []}
            onChange={(locais) => updateCliente(locaisClienteId, { locais })}
          />
        )}
      </div>
    </div>
  );
};

export default Fornecedores;
