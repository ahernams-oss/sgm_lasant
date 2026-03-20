import { useState } from "react";
import { toast } from "sonner";
import { Briefcase, Plus, Trash2 } from "lucide-react";
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
import { useCargos } from "@/contexts/CargosContext";

const niveis = ["I", "II", "III", "IV", "V"] as const;

const emptyForm = { nome: "", descricao: "", salario: "", nivel: "", dataBaseSalario: "" };

const Cargos = () => {
  const { cargos, addCargo, updateCargo, deleteCargo } = useCargos();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

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
      addCargo(form);
      toast.success("Cargo cadastrado com sucesso!");
    }
    resetForm();
  };

  const handleEdit = (cargo: typeof cargos[0]) => {
    setEditingId(cargo.id);
    setForm({
      nome: cargo.nome,
      descricao: cargo.descricao,
      salario: cargo.salario,
      nivel: cargo.nivel,
      dataBaseSalario: cargo.dataBaseSalario || "",
    });
  };

  const handleDelete = (id: string) => {
    deleteCargo(id);
    toast.success("Cargo removido.");
    if (editingId === id) resetForm();
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

        <form
          onSubmit={handleSubmit}
          className="section-card animate-fade-up mb-6"
          style={{ animationDelay: "80ms" }}
        >
          <h2 className="section-title">
            {editingId ? "Editar Cargo" : "Novo Cargo"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="field-label">Nome do Cargo</label>
              <Input
                placeholder="Ex: Eletricista de Alta"
                value={form.nome}
                onChange={(e) => update("nome", e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Nível</label>
              <Select value={form.nivel} onValueChange={(v) => update("nivel", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {niveis.map((n) => (
                    <SelectItem key={n} value={n}>
                      Nível {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="field-label">Salário (R$)</label>
              <Input
                placeholder="Ex: 2.511,98"
                value={form.salario}
                onChange={(e) => update("salario", e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="field-label">Descrição</label>
              <Textarea
                placeholder="Breve descrição do cargo"
                value={form.descricao}
                onChange={(e) => update("descricao", e.target.value)}
                rows={2}
                className="min-h-[40px]"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit" className="gap-2">
              <Plus className="h-4 w-4" />
              {editingId ? "Salvar Alterações" : "Adicionar Cargo"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            )}
          </div>
        </form>

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
                  <div className="min-w-0 flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {cargo.nome}
                    </p>
                    <div>
                      {cargo.nivel && (
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Nível {cargo.nivel}
                        </span>
                      )}
                    </div>
                    <div>
                      {cargo.salario && (
                        <p className="text-sm text-muted-foreground tabular-nums">
                          R$ {cargo.salario}
                        </p>
                      )}
                    </div>
                    <div>
                      {cargo.descricao && (
                        <p className="text-xs text-muted-foreground truncate">
                          {cargo.descricao}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(cargo)} className="text-xs">
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(cargo.id)} className="text-destructive hover:text-destructive">
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