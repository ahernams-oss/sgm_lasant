import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useFinanceiro, ContaPagar, ContaReceber } from "@/contexts/FinanceiroContext";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  conta: ContaPagar | ContaReceber | null;
  modo: "pagar" | "receber";
}

export default function BaixaDialog({ open, onOpenChange, conta, modo }: Props) {
  const { contasBancarias, addLancamento, updateContaPagar, updateContaReceber, planoContas } = useFinanceiro();
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [contaBancariaId, setContaBancariaId] = useState("");
  const [obs, setObs] = useState("");

  useEffect(() => {
    if (open && conta) {
      const restante = (conta.valor_total || 0) - (modo === "pagar" ? (conta as ContaPagar).valor_pago : (conta as ContaReceber).valor_recebido);
      setValor(restante.toFixed(2).replace(".", ","));
      setData(new Date().toISOString().slice(0, 10));
      setContaBancariaId(conta.conta_bancaria_id || contasBancarias[0]?.id || "");
      setObs("");
    }
  }, [open, conta, modo, contasBancarias]);

  if (!conta) return null;

  const handleConfirm = async () => {
    const v = parseFloat(valor.replace(",", "."));
    if (!v || v <= 0) { toast.error("Informe um valor válido."); return; }
    if (!contaBancariaId) { toast.error("Selecione a conta bancária."); return; }

    const restante = (conta.valor_total || 0) - (modo === "pagar" ? (conta as ContaPagar).valor_pago : (conta as ContaReceber).valor_recebido);
    if (v > restante + 0.01) { toast.error("Valor maior que o saldo devedor."); return; }

    await addLancamento({
      tipo: modo === "pagar" ? "saida" : "entrada",
      conta_bancaria_id: contaBancariaId,
      valor: v,
      data,
      descricao: `${modo === "pagar" ? "Pagamento" : "Recebimento"}: ${conta.descricao}${obs ? ` — ${obs}` : ""}`,
      conta_pagar_id: modo === "pagar" ? conta.id : null,
      conta_receber_id: modo === "receber" ? conta.id : null,
      plano_conta_id: conta.plano_conta_id,
      centro_custo_id: conta.centro_custo_id,
      conciliado: false,
    });

    const novoPago = (modo === "pagar" ? (conta as ContaPagar).valor_pago : (conta as ContaReceber).valor_recebido) + v;
    const totalAtingido = novoPago >= (conta.valor_total || 0) - 0.01;
    const update: any = {
      conta_bancaria_id: contaBancariaId,
      status: totalAtingido ? (modo === "pagar" ? "paga" : "recebida") : "parcial",
    };
    if (modo === "pagar") {
      update.valor_pago = novoPago;
      if (totalAtingido) update.data_pagamento = data;
      await updateContaPagar(conta.id, update);
    } else {
      update.valor_recebido = novoPago;
      if (totalAtingido) update.data_recebimento = data;
      await updateContaReceber(conta.id, update);
    }
    toast.success(`${modo === "pagar" ? "Pagamento" : "Recebimento"} registrado!`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Baixar {modo === "pagar" ? "Pagamento" : "Recebimento"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">{conta.descricao}</div>
          <div>
            <label className="text-sm font-medium">Valor (R$)</label>
            <Input value={valor} onChange={(e) => setValor(e.target.value.replace(/[^\d,.]/g, ""))} />
          </div>
          <div>
            <label className="text-sm font-medium">Data</label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Conta Bancária</label>
            <Select value={contaBancariaId} onValueChange={setContaBancariaId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {contasBancarias.filter(c => c.ativo).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Observação</label>
            <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
