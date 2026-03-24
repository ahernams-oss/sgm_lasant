import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, AlertTriangle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useCargos } from "@/contexts/CargosContext";
import { useClientes } from "@/contexts/ClientesContext";

interface Promocao {
  id: string;
  funcionario_id: string;
  data_promocao: string;
  cargo_anterior_id: string;
  cargo_anterior_nome: string;
  cargo_novo_id: string;
  cargo_novo_nome: string;
  salario_anterior: string;
  salario_novo: string;
  cliente_anterior_id: string;
  cliente_anterior_nome: string;
  cliente_novo_id: string;
  cliente_novo_nome: string;
  motivo: string;
  observacoes: string;
  created_at: string;
}

interface Props {
  funcionarioId: string;
  cargoAtualId: string;
  salarioAtual: string;
  clienteAtualId: string;
  onPromover: (dados: { cargoId: string; salario: string; clienteId: string }) => void;
}

const Field = ({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold text-foreground/80">{label}{required && " *"}</Label>
    {children}
  </div>
);

export function PromocoesTab({ funcionarioId, cargoAtualId, salarioAtual, clienteAtualId, onPromover }: Props) {
  const { cargos } = useCargos();
  const { clientes } = useClientes();
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    data_promocao: new Date().toISOString().split("T")[0],
    cargo_novo_id: "",
    salario_novo: "",
    cliente_novo_id: "",
    motivo: "",
    observacoes: "",
  });

  const cargoAtual = cargos.find((c) => c.id === cargoAtualId);
  const clienteAtual = clientes.find((c) => c.id === clienteAtualId);

  const fetchPromocoes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("promocoes")
      .select("*")
      .eq("funcionario_id", funcionarioId)
      .order("data_promocao", { ascending: false });

    if (error) {
      console.error("Erro ao buscar promoções:", error);
      toast.error("Erro ao carregar histórico de promoções.");
    } else {
      setPromocoes((data as unknown as Promocao[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (funcionarioId) fetchPromocoes();
  }, [funcionarioId]);

  // Auto-fill salary when cargo changes
  useEffect(() => {
    if (form.cargo_novo_id) {
      const cargo = cargos.find((c) => c.id === form.cargo_novo_id);
      if (cargo) {
        const salarioAtualCargo = cargo.historico?.find((h: any) => h.atual)?.salario || "";
        if (salarioAtualCargo) {
          setForm((prev) => ({ ...prev, salario_novo: salarioAtualCargo }));
        }
      }
    }
  }, [form.cargo_novo_id, cargos]);

  const handlePromover = async () => {
    if (!form.cargo_novo_id || !form.data_promocao) {
      toast.error("Informe o novo cargo e a data da promoção.");
      return;
    }

    const cargoNovo = cargos.find((c) => c.id === form.cargo_novo_id);
    const clienteNovo = form.cliente_novo_id ? clientes.find((c) => c.id === form.cliente_novo_id) : null;

    const { error } = await supabase.from("promocoes").insert({
      funcionario_id: funcionarioId,
      data_promocao: form.data_promocao,
      cargo_anterior_id: cargoAtualId,
      cargo_anterior_nome: cargoAtual?.nome || "",
      cargo_novo_id: form.cargo_novo_id,
      cargo_novo_nome: cargoNovo?.nome || "",
      salario_anterior: salarioAtual,
      salario_novo: form.salario_novo,
      cliente_anterior_id: clienteAtualId,
      cliente_anterior_nome: clienteAtual?.nome || "",
      cliente_novo_id: form.cliente_novo_id || clienteAtualId,
      cliente_novo_nome: clienteNovo?.nome || clienteAtual?.nome || "",
      motivo: form.motivo,
      observacoes: form.observacoes,
    } as any);

    if (error) {
      console.error("Erro ao registrar promoção:", error);
      toast.error("Erro ao registrar promoção.");
      return;
    }

    // Update the employee data in localStorage via callback
    onPromover({
      cargoId: form.cargo_novo_id,
      salario: form.salario_novo || salarioAtual,
      clienteId: form.cliente_novo_id || clienteAtualId,
    });

    toast.success("Promoção registrada com sucesso! Dados do funcionário atualizados.");
    setForm({
      data_promocao: new Date().toISOString().split("T")[0],
      cargo_novo_id: "",
      salario_novo: "",
      cliente_novo_id: "",
      motivo: "",
      observacoes: "",
    });
    fetchPromocoes();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("promocoes").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover registro.");
    } else {
      toast.success("Registro removido.");
      fetchPromocoes();
    }
  };

  if (!funcionarioId) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
        <p className="text-sm">Salve o funcionário primeiro para gerenciar promoções.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current info */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Situação Atual</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <span><strong>Cargo:</strong> {cargoAtual?.nome || "—"}</span>
          <span><strong>Salário:</strong> {salarioAtual ? `R$ ${salarioAtual}` : "—"}</span>
          <span><strong>Cliente:</strong> {clienteAtual?.nome || "—"}</span>
        </div>
      </div>

      {/* Promotion form */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Field label="Data da Promoção" required>
          <Input type="date" value={form.data_promocao} onChange={(e) => setForm({ ...form, data_promocao: e.target.value })} />
        </Field>
        <Field label="Novo Cargo" required>
          <Select value={form.cargo_novo_id} onValueChange={(v) => setForm({ ...form, cargo_novo_id: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione o novo cargo..." /></SelectTrigger>
            <SelectContent>
              {cargos.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome} {c.id === cargoAtualId ? "(atual)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Novo Salário">
          <Input value={form.salario_novo} onChange={(e) => setForm({ ...form, salario_novo: e.target.value })} placeholder="R$ 0,00" />
        </Field>
        <Field label="Novo Cliente/Local">
          <Select value={form.cliente_novo_id} onValueChange={(v) => setForm({ ...form, cliente_novo_id: v })}>
            <SelectTrigger><SelectValue placeholder="Manter atual..." /></SelectTrigger>
            <SelectContent>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome} {c.id === clienteAtualId ? "(atual)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Motivo">
          <Input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Ex: Mérito, tempo de serviço..." />
        </Field>
        <Field label="Observações">
          <Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Observações adicionais" />
        </Field>
      </div>
      <Button type="button" onClick={handlePromover} className="shadow-md">
        <TrendingUp className="h-4 w-4 mr-1" /> Registrar Promoção
      </Button>

      {/* History table */}
      <div>
        <h3 className="text-sm font-semibold text-foreground/80 mb-3">Histórico de Promoções</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : promocoes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma promoção registrada.</p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cargo Anterior</TableHead>
                  <TableHead>Novo Cargo</TableHead>
                  <TableHead>Salário Anterior</TableHead>
                  <TableHead>Novo Salário</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promocoes.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.data_promocao.split("-").reverse().join("/")}</TableCell>
                    <TableCell>{p.cargo_anterior_nome || "—"}</TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
                        {p.cargo_novo_nome}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.salario_anterior ? `R$ ${p.salario_anterior}` : "—"}</TableCell>
                    <TableCell className="font-medium">{p.salario_novo ? `R$ ${p.salario_novo}` : "—"}</TableCell>
                    <TableCell>
                      {p.cliente_anterior_nome !== p.cliente_novo_nome ? (
                        <span className="text-xs">{p.cliente_anterior_nome || "—"} → {p.cliente_novo_nome || "—"}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Mantido</span>
                      )}
                    </TableCell>
                    <TableCell>{p.motivo || "—"}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" type="button" onClick={() => handleDelete(p.id)} className="h-7 w-7 text-destructive hover:text-destructive">
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
    </div>
  );
}
