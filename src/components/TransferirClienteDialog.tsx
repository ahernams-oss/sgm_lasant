import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, ArrowRightLeft, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { verificarSenhaUsuario } from "@/lib/verifySenha";
import { useAuth } from "@/contexts/AuthContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useFuncionarios } from "@/contexts/FuncionariosContext";

interface HistoricoRow {
  id: string;
  cliente_id: string | null;
  cliente_nome: string | null;
  data_inicio: string;
  data_fim: string | null;
  justificativa: string | null;
  autorizado_por_email: string | null;
  alterado_por: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  funcionarioId: string;
  funcionarioNome: string;
  clienteAtualId: string;
}

const fmt = (s?: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function TransferirClienteDialog({ open, onOpenChange, funcionarioId, funcionarioNome, clienteAtualId }: Props) {
  const { clientes } = useClientes();
  const { updateFuncionario } = useFuncionarios();
  const { usuarioLogado } = useAuth();

  const [novoClienteId, setNovoClienteId] = useState("");
  const [comboOpen, setComboOpen] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [historico, setHistorico] = useState<HistoricoRow[]>([]);

  const clientesAtivos = clientes.filter((c) => c.tipo === "Cliente");
  const clienteAtualNome = clientes.find((c) => c.id === clienteAtualId)?.nome ?? "—";
  const novoClienteNome = clientes.find((c) => c.id === novoClienteId)?.nome ?? "";

  const loadHistorico = async () => {
    const { data } = await (supabase as any)
      .from("funcionario_cliente_historico")
      .select("*")
      .eq("funcionario_id", funcionarioId)
      .order("data_inicio", { ascending: false });
    setHistorico((data as HistoricoRow[]) || []);
  };

  useEffect(() => {
    if (open) {
      setNovoClienteId("");
      setJustificativa("");
      setEmail("");
      setSenha("");
      loadHistorico();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, funcionarioId]);

  const handleConfirm = async () => {
    if (!novoClienteId) { toast.error("Selecione o novo Cliente/Unidade."); return; }
    if (novoClienteId === clienteAtualId) { toast.error("Selecione um Cliente/Unidade diferente do atual."); return; }
    if (justificativa.trim().length < 5) { toast.error("Informe a justificativa (mín. 5 caracteres)."); return; }
    if (!email.trim() || !senha) { toast.error("Informe e-mail e senha do supervisor."); return; }

    setSalvando(true);
    try {
      const ok = await verificarSenhaUsuario(email, senha);
      if (!ok) { toast.error("Credenciais de supervisor inválidas."); return; }

      const agora = new Date().toISOString();

      // Fecha histórico aberto (data_fim null)
      await (supabase as any)
        .from("funcionario_cliente_historico")
        .update({ data_fim: agora })
        .eq("funcionario_id", funcionarioId)
        .is("data_fim", null);

      // Se não existir nenhum registro aberto e havia cliente atual, registra o período anterior
      const { data: abertos } = await (supabase as any)
        .from("funcionario_cliente_historico")
        .select("id")
        .eq("funcionario_id", funcionarioId)
        .limit(1);
      if ((!abertos || abertos.length === 0) && clienteAtualId) {
        await (supabase as any).from("funcionario_cliente_historico").insert({
          funcionario_id: funcionarioId,
          cliente_id: clienteAtualId,
          cliente_nome: clienteAtualNome,
          data_inicio: agora,
          data_fim: agora,
          justificativa: "Registro inicial (anterior à transferência)",
          autorizado_por_email: email.trim().toLowerCase(),
          alterado_por: usuarioLogado?.nome || usuarioLogado?.email || null,
        });
      }

      // Cria novo período em aberto
      const { error: insErr } = await (supabase as any).from("funcionario_cliente_historico").insert({
        funcionario_id: funcionarioId,
        cliente_id: novoClienteId,
        cliente_nome: novoClienteNome,
        data_inicio: agora,
        data_fim: null,
        justificativa: justificativa.trim(),
        autorizado_por_email: email.trim().toLowerCase(),
        alterado_por: usuarioLogado?.nome || usuarioLogado?.email || null,
      });
      if (insErr) { toast.error("Erro ao registrar histórico."); return; }

      await updateFuncionario(funcionarioId, { clienteId: novoClienteId });
      toast.success("Cliente/Unidade transferido com sucesso.");
      onOpenChange(false);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Transferir Cliente/Unidade
          </DialogTitle>
          <DialogDescription>
            {funcionarioNome} — atualmente em <strong>{clienteAtualNome}</strong>.
            Esta ação exige autorização de supervisor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold">Novo Cliente/Unidade *</Label>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between mt-1.5 font-normal">
                  {novoClienteId ? novoClienteNome : "Selecione..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Pesquisar cliente..." />
                  <CommandList>
                    <CommandEmpty>Nenhum encontrado.</CommandEmpty>
                    <CommandGroup>
                      {clientesAtivos.map((c) => (
                        <CommandItem key={c.id} value={c.nome} onSelect={() => { setNovoClienteId(c.id); setComboOpen(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", novoClienteId === c.id ? "opacity-100" : "opacity-0")} />
                          {c.nome}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="text-xs font-semibold">Justificativa *</Label>
            <Textarea rows={3} value={justificativa} onChange={(e) => setJustificativa(e.target.value)} placeholder="Motivo da transferência..." className="mt-1.5" />
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg bg-amber-50 dark:bg-amber-900/10">
            <div className="col-span-2 text-xs font-semibold text-amber-700 dark:text-amber-400">🛡️ Autorização do supervisor</div>
            <div>
              <Label className="text-xs">E-mail</Label>
              <Input type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="supervisor@empresa.com" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Senha</Label>
              <Input type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="border rounded-lg">
            <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/40 text-xs font-semibold">
              <History className="h-4 w-4" />
              Histórico de Cliente/Unidade ({historico.length})
            </div>
            <div className="max-h-56 overflow-auto">
              {historico.length === 0 ? (
                <div className="p-3 text-xs text-muted-foreground text-center">Nenhuma transferência registrada.</div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-muted/30">
                    <tr className="text-left">
                      <th className="px-3 py-2 font-medium">Cliente/Unidade</th>
                      <th className="px-3 py-2 font-medium">Início</th>
                      <th className="px-3 py-2 font-medium">Fim</th>
                      <th className="px-3 py-2 font-medium">Autorizado por</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((h) => (
                      <tr key={h.id} className="border-t">
                        <td className="px-3 py-2">{h.cliente_nome || "—"}</td>
                        <td className="px-3 py-2">{fmt(h.data_inicio)}</td>
                        <td className="px-3 py-2">{h.data_fim ? fmt(h.data_fim) : <span className="text-emerald-600 font-medium">Em vigor</span>}</td>
                        <td className="px-3 py-2">{h.autorizado_por_email || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={salvando}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={salvando}>
            {salvando ? "Processando..." : "Confirmar transferência"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
