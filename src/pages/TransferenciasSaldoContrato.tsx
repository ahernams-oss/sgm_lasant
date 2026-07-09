import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClientes, type Contrato } from "@/contexts/ClientesContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeftRight, Plus, Trash2 } from "lucide-react";
import DoubleConfirmDelete from "@/components/DoubleConfirmDelete";

type TipoSaldo = "maoDeObraMensal" | "maoDeObraAnual" | "maoDeObraContratual" | "valorVariavel";

const TIPO_LABEL: Record<TipoSaldo, string> = {
  maoDeObraMensal: "Mão de Obra Mensal",
  maoDeObraAnual: "Mão de Obra Anual",
  maoDeObraContratual: "Mão de Obra Contratual",
  valorVariavel: "Valor Variável (valorBase)",
};

const CAMPO_CONTRATO: Record<TipoSaldo, keyof Contrato> = {
  maoDeObraMensal: "maoDeObraMensal",
  maoDeObraAnual: "maoDeObraAnual",
  maoDeObraContratual: "maoDeObraContratual",
  valorVariavel: "valorBase",
};

const parseBR = (v?: string | number | null): number => {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};
const fmtBR = (n: number) => (n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtBRL = (n: number) => (n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface HistoricoRow {
  id: string;
  data: string;
  tipo_saldo: TipoSaldo;
  valor: number;
  cliente_origem_nome: string | null;
  contrato_origem_numero: string | null;
  saldo_origem_antes: number | null;
  saldo_origem_depois: number | null;
  cliente_destino_nome: string | null;
  contrato_destino_numero: string | null;
  saldo_destino_antes: number | null;
  saldo_destino_depois: number | null;
  motivo: string | null;
  usuario_nome: string | null;
  created_at: string;
}

export default function TransferenciasSaldoContrato() {
  const { clientes, updateCliente } = useClientes();
  const { usuarioLogado, temAcessoTotal } = useAuth();
  const [historico, setHistorico] = useState<HistoricoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [openNova, setOpenNova] = useState(false);

  const loadHistorico = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contrato_transferencias_saldo")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar histórico: " + error.message);
    setHistorico((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { loadHistorico(); }, []);

  // Form
  const [clienteOrigemId, setClienteOrigemId] = useState("");
  const [contratoOrigemId, setContratoOrigemId] = useState("");
  const [clienteDestinoId, setClienteDestinoId] = useState("");
  const [contratoDestinoId, setContratoDestinoId] = useState("");
  const [tipoSaldo, setTipoSaldo] = useState<TipoSaldo>("maoDeObraMensal");
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));

  const clienteOrigem = useMemo(() => clientes.find(c => c.id === clienteOrigemId), [clientes, clienteOrigemId]);
  const clienteDestino = useMemo(() => clientes.find(c => c.id === clienteDestinoId), [clientes, clienteDestinoId]);
  const contratoOrigem = useMemo(() => clienteOrigem?.contratos.find(k => k.id === contratoOrigemId), [clienteOrigem, contratoOrigemId]);
  const contratoDestino = useMemo(() => clienteDestino?.contratos.find(k => k.id === contratoDestinoId), [clienteDestino, contratoDestinoId]);

  const saldoOrigem = useMemo(() => contratoOrigem ? parseBR((contratoOrigem as any)[CAMPO_CONTRATO[tipoSaldo]]) : 0, [contratoOrigem, tipoSaldo]);
  const saldoDestino = useMemo(() => contratoDestino ? parseBR((contratoDestino as any)[CAMPO_CONTRATO[tipoSaldo]]) : 0, [contratoDestino, tipoSaldo]);

  const resetForm = () => {
    setClienteOrigemId(""); setContratoOrigemId(""); setClienteDestinoId(""); setContratoDestinoId("");
    setTipoSaldo("maoDeObraMensal"); setValor(""); setMotivo(""); setData(new Date().toISOString().slice(0, 10));
  };

  const efetivar = async () => {
    if (!temAcessoTotal) { toast.error("Apenas Diretor / Gerente Executivo / Coordenador podem transferir saldos."); return; }
    if (!clienteOrigem || !contratoOrigem) { toast.error("Selecione origem."); return; }
    if (!clienteDestino || !contratoDestino) { toast.error("Selecione destino."); return; }
    if (clienteOrigem.id === clienteDestino.id && contratoOrigem.id === contratoDestino.id) {
      toast.error("Origem e destino não podem ser o mesmo contrato."); return;
    }
    const v = parseBR(valor);
    if (!v || v <= 0) { toast.error("Valor inválido."); return; }
    if (v > saldoOrigem + 0.001) { toast.error(`Saldo insuficiente. Disponível na origem: ${fmtBRL(saldoOrigem)}`); return; }

    const campo = CAMPO_CONTRATO[tipoSaldo];
    const novoOrigem = saldoOrigem - v;
    const novoDestino = saldoDestino + v;

    // Atualiza contratos
    const contratosOrigem = clienteOrigem.contratos.map(k => k.id === contratoOrigem.id ? { ...k, [campo]: fmtBR(novoOrigem) } : k);
    const okO = await updateCliente(clienteOrigem.id, { contratos: contratosOrigem });
    if (!okO) { toast.error("Falha ao debitar origem."); return; }

    // Se mesmo cliente, precisa recarregar a partir do array já atualizado
    if (clienteDestino.id === clienteOrigem.id) {
      const contratosDestino = contratosOrigem.map(k => k.id === contratoDestino.id ? { ...k, [campo]: fmtBR(novoDestino) } : k);
      const okD = await updateCliente(clienteDestino.id, { contratos: contratosDestino });
      if (!okD) { toast.error("Falha ao creditar destino."); return; }
    } else {
      const contratosDestino = clienteDestino.contratos.map(k => k.id === contratoDestino.id ? { ...k, [campo]: fmtBR(novoDestino) } : k);
      const okD = await updateCliente(clienteDestino.id, { contratos: contratosDestino });
      if (!okD) {
        // rollback origem
        await updateCliente(clienteOrigem.id, { contratos: clienteOrigem.contratos });
        toast.error("Falha ao creditar destino. Origem revertida.");
        return;
      }
    }

    // Registra histórico
    const { error: errHist } = await supabase.from("contrato_transferencias_saldo").insert({
      data,
      tipo_saldo: tipoSaldo,
      valor: v,
      cliente_origem_id: clienteOrigem.id,
      cliente_origem_nome: clienteOrigem.nome,
      contrato_origem_id: contratoOrigem.id,
      contrato_origem_numero: contratoOrigem.numero,
      saldo_origem_antes: saldoOrigem,
      saldo_origem_depois: novoOrigem,
      cliente_destino_id: clienteDestino.id,
      cliente_destino_nome: clienteDestino.nome,
      contrato_destino_id: contratoDestino.id,
      contrato_destino_numero: contratoDestino.numero,
      saldo_destino_antes: saldoDestino,
      saldo_destino_depois: novoDestino,
      motivo,
      usuario_id: usuarioLogado?.id ?? null,
      usuario_nome: usuarioLogado?.nome ?? null,
    });
    if (errHist) { toast.error("Transferência realizada, mas falha ao gravar histórico: " + errHist.message); }
    else toast.success("Transferência efetivada!");

    resetForm();
    setOpenNova(false);
    loadHistorico();
  };

  const excluir = async (id: string) => {
    // Apenas apaga o registro histórico (não reverte saldos)
    const { error } = await supabase.from("contrato_transferencias_saldo").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir: " + error.message); return; }
    toast.success("Registro do histórico excluído.");
    loadHistorico();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6" /> Transferência de Saldos entre Contratos
          </h1>
          <p className="text-sm text-muted-foreground">Débito/crédito imediato entre contratos, com histórico completo.</p>
        </div>
        <Button onClick={() => setOpenNova(true)} disabled={!temAcessoTotal}>
          <Plus className="h-4 w-4 mr-2" /> Nova Transferência
        </Button>
      </div>

      {!temAcessoTotal && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-900">
            Somente usuários com cargo <strong>Diretor</strong>, <strong>Gerente Executivo</strong> ou <strong>Coordenador de Departamento</strong> podem efetuar transferências. Você pode visualizar o histórico.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Histórico de Transferências</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3">Data</TableHead>
                  <TableHead className="px-4 py-3">Tipo</TableHead>
                  <TableHead className="px-4 py-3">Origem</TableHead>
                  <TableHead className="px-4 py-3">Destino</TableHead>
                  <TableHead className="px-4 py-3 text-right">Valor</TableHead>
                  <TableHead className="px-4 py-3 text-right">Saldo Origem (antes → depois)</TableHead>
                  <TableHead className="px-4 py-3 text-right">Saldo Destino (antes → depois)</TableHead>
                  <TableHead className="px-4 py-3">Motivo</TableHead>
                  <TableHead className="px-4 py-3">Usuário</TableHead>
                  <TableHead className="px-4 py-3 text-center w-16">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-6">Carregando…</TableCell></TableRow>
                )}
                {!loading && historico.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-6">Nenhuma transferência registrada.</TableCell></TableRow>
                )}
                {historico.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="px-4 py-3 whitespace-nowrap">{new Date(h.data + "T00:00:00").toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">{TIPO_LABEL[h.tipo_saldo]}</TableCell>
                    <TableCell className="px-4 py-3">{h.cliente_origem_nome} <span className="text-muted-foreground">— Contrato {h.contrato_origem_numero || "—"}</span></TableCell>
                    <TableCell className="px-4 py-3">{h.cliente_destino_nome} <span className="text-muted-foreground">— Contrato {h.contrato_destino_numero || "—"}</span></TableCell>
                    <TableCell className="px-4 py-3 text-right whitespace-nowrap font-medium">{fmtBRL(Number(h.valor))}</TableCell>
                    <TableCell className="px-4 py-3 text-right whitespace-nowrap text-xs">{fmtBRL(Number(h.saldo_origem_antes ?? 0))} → {fmtBRL(Number(h.saldo_origem_depois ?? 0))}</TableCell>
                    <TableCell className="px-4 py-3 text-right whitespace-nowrap text-xs">{fmtBRL(Number(h.saldo_destino_antes ?? 0))} → {fmtBRL(Number(h.saldo_destino_depois ?? 0))}</TableCell>
                    <TableCell className="px-4 py-3 max-w-[240px] truncate" title={h.motivo ?? ""}>{h.motivo || "—"}</TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">{h.usuario_nome || "—"}</TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      {temAcessoTotal && (
                        <DoubleConfirmDelete
                          onConfirm={() => excluir(h.id)}
                          title="Excluir registro do histórico?"
                          description="Isto NÃO reverte os saldos dos contratos, apenas remove o registro do histórico. Deseja continuar?"
                        >
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </DoubleConfirmDelete>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openNova} onOpenChange={(o) => { setOpenNova(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Nova Transferência de Saldo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Data</label>
                <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Tipo de Saldo</label>
                <Select value={tipoSaldo} onValueChange={(v) => setTipoSaldo(v as TipoSaldo)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TIPO_LABEL) as TipoSaldo[]).map(k => (
                      <SelectItem key={k} value={k}>{TIPO_LABEL[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border rounded-md p-3">
              <div className="col-span-2 text-sm font-semibold text-muted-foreground">Origem (débito)</div>
              <div>
                <label className="text-sm font-medium">Cliente</label>
                <Select value={clienteOrigemId} onValueChange={(v) => { setClienteOrigemId(v); setContratoOrigemId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Contrato</label>
                <Select value={contratoOrigemId} onValueChange={setContratoOrigemId} disabled={!clienteOrigem}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clienteOrigem?.contratos.map(k => <SelectItem key={k.id} value={k.id}>Contrato {k.numero || "—"} {k.descricao ? "— " + k.descricao : ""}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 text-xs text-muted-foreground">Saldo atual ({TIPO_LABEL[tipoSaldo]}): <strong className="text-foreground">{fmtBRL(saldoOrigem)}</strong></div>
            </div>

            <div className="grid grid-cols-2 gap-4 border rounded-md p-3">
              <div className="col-span-2 text-sm font-semibold text-muted-foreground">Destino (crédito)</div>
              <div>
                <label className="text-sm font-medium">Cliente</label>
                <Select value={clienteDestinoId} onValueChange={(v) => { setClienteDestinoId(v); setContratoDestinoId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Contrato</label>
                <Select value={contratoDestinoId} onValueChange={setContratoDestinoId} disabled={!clienteDestino}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clienteDestino?.contratos.map(k => <SelectItem key={k.id} value={k.id}>Contrato {k.numero || "—"} {k.descricao ? "— " + k.descricao : ""}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 text-xs text-muted-foreground">Saldo atual ({TIPO_LABEL[tipoSaldo]}): <strong className="text-foreground">{fmtBRL(saldoDestino)}</strong></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Valor a transferir (R$)</label>
                <Input value={valor} onChange={(e) => setValor(e.target.value.replace(/[^\d,.]/g, ""))} placeholder="0,00" />
              </div>
              <div>
                <label className="text-sm font-medium">Motivo / Observação</label>
                <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} placeholder="Ex.: Realocação de mão de obra do contrato X para o Y" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNova(false)}>Cancelar</Button>
            <Button onClick={efetivar}>Efetivar Transferência</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
