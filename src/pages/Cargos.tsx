import { useState } from "react";
import { toast } from "sonner";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Cargo {
  id: string;
  nome: string;
  descricao: string;
}

const Cargos = () => {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Informe o nome do cargo.");
      return;
    }

    if (editingId) {
      setCargos((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, nome, descricao } : c))
      );
      toast.success("Cargo atualizado com sucesso!");
      setEditingId(null);
    } else {
      setCargos((prev) => [
        ...prev,
        { id: crypto.randomUUID(), nome, descricao },
      ]);
      toast.success("Cargo cadastrado com sucesso!");
    }
    setNome("");
    setDescricao("");
  };

  const handleEdit = (cargo: Cargo) => {
    setEditingId(cargo.id);
    setNome(cargo.nome);
    setDescricao(cargo.descricao);
  };

  const handleDelete = (id: string) => {
    setCargos((prev) => prev.filter((c) => c.id !== id));
    toast.success("Cargo removido.");
    if (editingId === id) {
      setEditingId(null);
      setNome("");
      setDescricao("");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setNome("");
    setDescricao("");
  };

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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="section-card animate-fade-up mb-6"
          style={{ animationDelay: "80ms" }}
        >
          <h2 className="section-title">
            {editingId ? "Editar Cargo" : "Novo Cargo"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Nome do Cargo</label>
              <Input
                placeholder="Ex: Eletricista de Alta"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Descrição</label>
              <Input
                placeholder="Breve descrição do cargo"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit" className="gap-2">
              <Plus className="h-4 w-4" />
              {editingId ? "Salvar Alterações" : "Adicionar Cargo"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </form>

        {/* List */}
        <div
          className="section-card animate-fade-up"
          style={{ animationDelay: "160ms" }}
        >
          <h2 className="section-title">Cargos Cadastrados</h2>
          {cargos.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              Nenhum cargo cadastrado ainda.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {cargos.map((cargo) => (
                <div
                  key={cargo.id}
                  className="flex items-center justify-between py-3 gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {cargo.nome}
                    </p>
                    {cargo.descricao && (
                      <p className="text-xs text-muted-foreground truncate">
                        {cargo.descricao}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(cargo)}
                      className="text-xs"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cargo.id)}
                      className="text-destructive hover:text-destructive"
                    >
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

export default Cargos;