import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFinanceiro, formatBRL, formatDate, FluxoAjuste } from "@/contexts/FinanceiroContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Plus, Trash2, Settings2 } from "lucide-react";
import { toast } from "sonner";

const num = (v: string) => Number(String(v).replace(/\./g, "").replace(",", ".")) || 0;

export default function FluxoCaixa() {
  const {
    contasPagar, contasReceber, lancamentos, contasBancarias, saldoConta,
    fluxoAjustes, fluxoSaldoInicial, addFluxoAjuste, updateFluxoAjuste, deleteFluxoAjuste,
    setFluxoSaldoInicial, updateContaPagar, updateContaReceber,
  } = useFinanceiro();

  const [conta, setConta] = useState("todas");
  const hoje = new Date().toISOString().slice(0, 10);
  const [ini, setIni] = useState(hoje);
  const fim60 = new Date(); fim60.setDate(fim60.getDate() + 60);
  const [fim, setFim] = useState(fim60.toISOString().slice(0, 10));

  // --- Saldo inicial manual -------------------------------------------------
  const chaveSaldo = conta === "todas" ? "todas" : conta;
  const saldoManual = fluxoSaldoInicial.find((s) => s.chave === chaveSaldo);
  const saldoCalculado = conta === "todas"
    ? contasBancarias.reduce((s, c) => s + saldoConta(c.id), 0)
    : saldoConta(conta);
  const saldoInicial = saldoManual?.ativo ? Number(saldoManual.valor) : saldoCalculado;

  const [saldoOpen, setSaldoOpen] = useState(false);
  const [saldoManualAtivo, setSaldoManualAtivo] = useState(false);
  const [saldoValor, setSaldoValor] = useState("");

  const abrirSaldo = () => {
    setSaldoManualAtivo(!!saldoManual?.ativo);
    setSaldoValor(String(saldoManual?.valor ?? saldoCalculado).replace(".", ","));
    setSaldoOpen(true);
  };
  const salvarSaldo = async () => {
    await setFluxoSaldoInicial(chaveSaldo, num(saldoValor), saldoManualAtivo);
    setSaldoOpen(false);
    toast.success("Saldo inicial atualizado.");
  };

  // --- Ajustes manuais ------------------------------------------------------
  const [ajusteOpen, setAjusteOpen] = useState(false);
  const [editAjuste, setEditAjuste] = useState<FluxoAjuste | null>(null);
  const [aData, setAData] = useState(hoje);
  const [aTipo, setATipo] = useState<"entrada" | "saida">("entrada");
  const [aDesc, setADesc] = useState("");
  const [aValor, setAValor] = useState("");
  const [aConta, setAConta] = useState("nenhuma");

  const abrirAjuste = (a?: FluxoAjuste) => {
    setEditAjuste(a || null);
    setAData(a?.data || hoje);
    setATipo(a?.tipo || "entrada");
    setADesc(a?.descricao || "");
    setAValor(a ? String(a.valor).replace(".", ",") : "");
    setAConta(a?.conta_bancaria_id || "nenhuma");
    setAjusteOpen(true);
  };

  const salvarAjuste = async () => {
    if (!aDesc.trim()) { toast.error("Informe a descrição."); return; }
    if (num(aValor) <= 0) { toast.error("Informe um valor maior que zero."); return; }
    const payload = {
      data: aData,
      tipo: aTipo,
      descricao: aDesc.trim(),
      valor: num(aValor),
      conta_bancaria_id: aConta === "nenhuma" ? null : aConta,
    };
    if (editAjuste) await updateFluxoAjuste(editAjuste.id, payload);
    else await addFluxoAjuste(payload as any);
    setAjusteOpen(false);
    toast.success("Ajuste salvo.");
  };

  const excluirAjuste = async (a: FluxoAjuste) => {
    if (!confirm(`Excluir o ajuste "${a.descricao}"?`)) return;
    await deleteFluxoAjuste(a.id);
    toast.success("Ajuste excluído.");
  };

  const ajustesPeriodo = useMemo(
    () => fluxoAjustes
      .filter((a) => a.data >= ini && a.data <= fim)
      .filter((a) => conta === "todas" || !a.conta_bancaria_id || a.conta_bancaria_id === conta)
      .sort((a, b) => a.data.localeCompare(b.data)),
    [fluxoAjustes, ini, fim, conta],
  );

  // --- Previsões editáveis --------------------------------------------------
  type Prev = { id: string; origem: "pagar" | "receber"; descricao: string; data: string; valor: number };
  const previsoes = useMemo<Prev[]>(() => {
    const out: Prev[] = [];
    contasPagar.forEach((c) => {
      if (c.status === "cancelada" || c.status === "paga") return;
      if (c.data_vencimento < ini || c.data_vencimento > fim) return;
      const restante = Number(c.valor_total) - Number(c.valor_pago);
      if (restante > 0) out.push({ id: c.id, origem: "pagar", descricao: c.descricao, data: c.data_vencimento, valor: restante });
    });
    contasReceber.forEach((c) => {
      if (c.status === "cancelada" || c.status === "recebida") return;
      if (c.data_vencimento < ini || c.data_vencimento > fim) return;
      const restante = Number(c.valor_total) - Number(c.valor_recebido);
      if (restante > 0) out.push({ id: c.id, origem: "receber", descricao: c.descricao, data: c.data_vencimento, valor: restante });
    });
    return out.sort((a, b) => a.data.localeCompare(b.data));
  }, [contasPagar, contasReceber, ini, fim]);

  const [prevOpen, setPrevOpen] = useState(false);
  const [editPrev, setEditPrev] = useState<Prev | null>(null);
  const [pData, setPData] = useState(hoje);
  const [pValor, setPValor] = useState("");

  const abrirPrevisao = (p: Prev) => {
    setEditPrev(p);
    setPData(p.data);
    setPValor(String(p.valor).replace(".", ","));
    setPrevOpen(true);
  };

  const salvarPrevisao = async () => {
    if (!editPrev) return;
    const novoValor = num(pValor);
    if (novoValor <= 0) { toast.error("Informe um valor maior que zero."); return; }
    if (editPrev.origem === "pagar") {
      const c = contasPagar.find((x) => x.id === editPrev.id);
      await updateContaPagar(editPrev.id, { data_vencimento: pData, valor_total: novoValor + Number(c?.valor_pago || 0) });
    } else {
      const c = contasReceber.find((x) => x.id === editPrev.id);
      await updateContaReceber(editPrev.id, { data_vencimento: pData, valor_total: novoValor + Number(c?.valor_recebido || 0) });
    }
    setPrevOpen(false);
    toast.success("Previsão atualizada.");
  };

  // --- Projeção -------------------------------------------------------------
  const dias = useMemo(() => {
    type Dia = { entradas: number; saidas: number; entradasReal: number; saidasReal: number; ajustes: number };
    const map = new Map<string, Dia>();
    const add = (d: string, k: keyof Dia, v: number) => {
      if (!map.has(d)) map.set(d, { entradas: 0, saidas: 0, entradasReal: 0, saidasReal: 0, ajustes: 0 });
      map.get(d)![k] += v;
    };
    previsoes.forEach((p) => add(p.data, p.origem === "pagar" ? "saidas" : "entradas", p.valor));
    lancamentos.forEach((l) => {
      if (l.data < ini || l.data > fim) return;
      if (conta !== "todas" && l.conta_bancaria_id !== conta && l.conta_destino_id !== conta) return;
      if (l.tipo === "entrada") add(l.data, "entradasReal", Number(l.valor));
      else if (l.tipo === "saida") add(l.data, "saidasReal", Number(l.valor));
    });
    ajustesPeriodo.forEach((a) => add(a.data, "ajustes", a.tipo === "entrada" ? Number(a.valor) : -Number(a.valor)));
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [previsoes, lancamentos, ajustesPeriodo, ini, fim, conta]);

  let saldoCorrente = saldoInicial;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-serif font-semibold">Fluxo de Caixa</h1>

      <Card>
        <CardHeader className="flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            Saldo inicial: {formatBRL(saldoInicial)}
            {saldoManual?.ativo && <span className="text-xs font-normal text-muted-foreground">(ajustado manualmente)</span>}
            <Button variant="ghost" size="icon" onClick={abrirSaldo} title="Ajustar saldo inicial"><Settings2 className="h-4 w-4" /></Button>
          </CardTitle>
          <div className="flex gap-2">
            <Select value={conta} onValueChange={setConta}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas as contas</SelectItem>{contasBancarias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent></Select>
            <Input type="date" value={ini} onChange={e => setIni(e.target.value)} className="w-40" />
            <Input type="date" value={fim} onChange={e => setFim(e.target.value)} className="w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead className="text-right">Entradas Previstas</TableHead><TableHead className="text-right">Saídas Previstas</TableHead><TableHead className="text-right">Realizado</TableHead><TableHead className="text-right">Ajustes</TableHead><TableHead className="text-right">Saldo Projetado</TableHead></TableRow></TableHeader>
            <TableBody>
              {dias.map(([d, v]) => {
                saldoCorrente += v.entradas + v.entradasReal - v.saidas - v.saidasReal + v.ajustes;
                return (
                  <TableRow key={d}>
                    <TableCell className="tabular-nums">{formatDate(d)}</TableCell>
                    <TableCell className="text-right text-emerald-600 tabular-nums">{v.entradas ? formatBRL(v.entradas) : "—"}</TableCell>
                    <TableCell className="text-right text-red-600 tabular-nums">{v.saidas ? formatBRL(v.saidas) : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{(v.entradasReal - v.saidasReal) ? formatBRL(v.entradasReal - v.saidasReal) : "—"}</TableCell>
                    <TableCell className={`text-right tabular-nums ${v.ajustes < 0 ? "text-red-600" : v.ajustes > 0 ? "text-emerald-600" : ""}`}>{v.ajustes ? formatBRL(v.ajustes) : "—"}</TableCell>
                    <TableCell className={`text-right tabular-nums font-medium ${saldoCorrente < 0 ? "text-red-600" : ""}`}>{formatBRL(saldoCorrente)}</TableCell>
                  </TableRow>
                );
              })}
              {dias.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Sem movimento previsto no período.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Ajustes manuais do período</CardTitle>
          <Button size="sm" onClick={() => abrirAjuste()}><Plus className="h-4 w-4 mr-1" /> Novo ajuste</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Conta</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="w-24" /></TableRow></TableHeader>
            <TableBody>
              {ajustesPeriodo.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="tabular-nums">{formatDate(a.data)}</TableCell>
                  <TableCell>{a.descricao}</TableCell>
                  <TableCell>{contasBancarias.find(c => c.id === a.conta_bancaria_id)?.nome || "—"}</TableCell>
                  <TableCell className={a.tipo === "entrada" ? "text-emerald-600" : "text-red-600"}>{a.tipo === "entrada" ? "Entrada" : "Saída"}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(Number(a.valor))}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => abrirAjuste(a)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => excluirAjuste(a)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {ajustesPeriodo.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Nenhum ajuste manual no período.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Previsões do período (contas a pagar e receber)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Vencimento</TableHead><TableHead>Descrição</TableHead><TableHead>Origem</TableHead><TableHead className="text-right">Valor em aberto</TableHead><TableHead className="w-16" /></TableRow></TableHeader>
            <TableBody>
              {previsoes.map((p) => (
                <TableRow key={`${p.origem}-${p.id}`}>
                  <TableCell className="tabular-nums">{formatDate(p.data)}</TableCell>
                  <TableCell>{p.descricao}</TableCell>
                  <TableCell className={p.origem === "pagar" ? "text-red-600" : "text-emerald-600"}>{p.origem === "pagar" ? "A pagar" : "A receber"}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(p.valor)}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => abrirPrevisao(p)}><Pencil className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
              {previsoes.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nenhuma previsão no período.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog saldo inicial */}
      <Dialog open={saldoOpen} onOpenChange={setSaldoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Saldo inicial da projeção</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Saldo calculado pelas contas: {formatBRL(saldoCalculado)}</p>
            <div className="flex items-center gap-2">
              <input id="manual" type="checkbox" checked={saldoManualAtivo} onChange={(e) => setSaldoManualAtivo(e.target.checked)} />
              <Label htmlFor="manual">Informar saldo inicial manualmente</Label>
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input value={saldoValor} onChange={(e) => setSaldoValor(e.target.value)} disabled={!saldoManualAtivo} placeholder="Ex: 15000,00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaldoOpen(false)}>Cancelar</Button>
            <Button onClick={salvarSaldo}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog ajuste */}
      <Dialog open={ajusteOpen} onOpenChange={setAjusteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editAjuste ? "Editar ajuste" : "Novo ajuste"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data</Label><Input type="date" value={aData} onChange={(e) => setAData(e.target.value)} /></div>
              <div>
                <Label>Tipo</Label>
                <Select value={aTipo} onValueChange={(v) => setATipo(v as "entrada" | "saida")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="entrada">Entrada</SelectItem><SelectItem value="saida">Saída</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Descrição</Label><Input value={aDesc} onChange={(e) => setADesc(e.target.value)} placeholder="Ex: Aporte de sócio" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor (R$)</Label><Input value={aValor} onChange={(e) => setAValor(e.target.value)} placeholder="Ex: 2500,00" /></div>
              <div>
                <Label>Conta</Label>
                <Select value={aConta} onValueChange={setAConta}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72"><SelectItem value="nenhuma">Sem conta específica</SelectItem>{contasBancarias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAjusteOpen(false)}>Cancelar</Button>
            <Button onClick={salvarAjuste}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog previsão */}
      <Dialog open={prevOpen} onOpenChange={setPrevOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar previsão</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{editPrev?.descricao}</p>
            <div><Label>Vencimento</Label><Input type="date" value={pData} onChange={(e) => setPData(e.target.value)} /></div>
            <div><Label>Valor em aberto (R$)</Label><Input value={pValor} onChange={(e) => setPValor(e.target.value)} placeholder="Ex: 1200,00" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrevOpen(false)}>Cancelar</Button>
            <Button onClick={salvarPrevisao}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
