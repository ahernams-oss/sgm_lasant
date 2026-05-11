import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingDown, TrendingUp, AlertTriangle, Banknote } from "lucide-react";
import KpiCardFinanceiro from "@/components/financeiro/KpiCardFinanceiro";
import { useFinanceiro, formatBRL, formatDate, isVencida } from "@/contexts/FinanceiroContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DashboardFinanceiro() {
  const { contasBancarias, contasPagar, contasReceber, lancamentos, saldoConta } = useFinanceiro();

  const kpi = useMemo(() => {
    const saldo = contasBancarias.reduce((s, c) => s + saldoConta(c.id), 0);
    const hoje = new Date();
    const em30 = new Date(); em30.setDate(em30.getDate() + 30);
    const dHoje = hoje.toISOString().slice(0, 10);
    const d30 = em30.toISOString().slice(0, 10);
    const aPagar = contasPagar.filter(c => (c.status === "aberta" || c.status === "parcial") && c.data_vencimento <= d30).reduce((s, c) => s + (Number(c.valor_total) - Number(c.valor_pago)), 0);
    const aReceber = contasReceber.filter(c => (c.status === "aberta" || c.status === "parcial") && c.data_vencimento <= d30).reduce((s, c) => s + (Number(c.valor_total) - Number(c.valor_recebido)), 0);
    const inadimp = contasReceber.filter(c => isVencida(c)).reduce((s, c) => s + (Number(c.valor_total) - Number(c.valor_recebido)), 0);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
    const mes = lancamentos.filter(l => l.data >= inicioMes && l.data <= dHoje && l.tipo !== "transferencia");
    const result = mes.filter(l => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0)
                 - mes.filter(l => l.tipo === "saida").reduce((s, l) => s + Number(l.valor), 0);
    return { saldo, aPagar, aReceber, inadimp, result };
  }, [contasBancarias, contasPagar, contasReceber, lancamentos, saldoConta]);

  const proximas = useMemo(() => {
    const todas = [
      ...contasPagar.filter(c => c.status === "aberta" || c.status === "parcial").map(c => ({ tipo: "Pagar" as const, ...c, valor: Number(c.valor_total) - Number(c.valor_pago) })),
      ...contasReceber.filter(c => c.status === "aberta" || c.status === "parcial").map(c => ({ tipo: "Receber" as const, ...c, valor: Number(c.valor_total) - Number(c.valor_recebido) })),
    ];
    return todas.sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento)).slice(0, 10);
  }, [contasPagar, contasReceber]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-serif font-semibold">Dashboard Financeiro</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCardFinanceiro title="Saldo total" value={formatBRL(kpi.saldo)} icon={Wallet} tone="info" />
        <KpiCardFinanceiro title="A pagar (30d)" value={formatBRL(kpi.aPagar)} icon={TrendingDown} tone="warning" />
        <KpiCardFinanceiro title="A receber (30d)" value={formatBRL(kpi.aReceber)} icon={TrendingUp} tone="success" />
        <KpiCardFinanceiro title="Inadimplência" value={formatBRL(kpi.inadimp)} icon={AlertTriangle} tone="danger" />
        <KpiCardFinanceiro title="Resultado do mês" value={formatBRL(kpi.result)} icon={Banknote} tone={kpi.result >= 0 ? "success" : "danger"} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Saldos por conta</CardTitle></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>Conta</TableHead><TableHead>Banco</TableHead><TableHead className="text-right">Saldo</TableHead></TableRow></TableHeader>
            <TableBody>{contasBancarias.map(c => <TableRow key={c.id}><TableCell>{c.nome}</TableCell><TableCell>{c.banco || "—"}</TableCell><TableCell className="text-right tabular-nums font-medium">{formatBRL(saldoConta(c.id))}</TableCell></TableRow>)}
            {contasBancarias.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-4">Cadastre uma conta bancária.</TableCell></TableRow>}
            </TableBody></Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Próximos vencimentos</CardTitle></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Vencimento</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
            <TableBody>{proximas.map((p, i) => <TableRow key={i} className={isVencida(p) ? "bg-red-50/50" : ""}><TableCell><span className={p.tipo === "Pagar" ? "text-red-600" : "text-emerald-600"}>{p.tipo}</span></TableCell><TableCell className="tabular-nums">{formatDate(p.data_vencimento)}</TableCell><TableCell>{p.descricao}</TableCell><TableCell className="text-right tabular-nums">{formatBRL(p.valor)}</TableCell></TableRow>)}
            {proximas.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">Sem títulos em aberto.</TableCell></TableRow>}
            </TableBody></Table>
        </CardContent>
      </Card>
    </div>
  );
}
