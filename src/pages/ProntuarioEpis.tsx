import { useMemo, useState } from "react";
import { ClipboardList, FileDown, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFuncionarios, EpiItem } from "@/contexts/FuncionariosContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useCargos } from "@/contexts/CargosContext";
import { useEpisDevolucoes } from "@/contexts/EpisDevolucoesContext";
import { gerarPdfProntuarioEpi, ProntuarioEvento } from "@/lib/gerarPdfProntuarioEpi";
import { toast } from "sonner";

const fmt = (d: string) => (d ? d.slice(0, 10).split("-").reverse().join("/") : "—");

export default function ProntuarioEpis() {
  const { funcionarios } = useFuncionarios();
  const { clientes } = useClientes();
  const { cargos } = useCargos();
  const { devolucoes } = useEpisDevolucoes();

  const [funcionarioId, setFuncionarioId] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  const func = funcionarios.find((f) => f.id === funcionarioId);
  const clienteNome = clientes.find((c) => c.id === func?.clienteId)?.nome || "—";
  const cargoNome = cargos.find((c: any) => c.id === func?.cargoId)?.nome || "—";

  const epis = ((func?.epis as EpiItem[] | null) || []);
  const devsFunc = useMemo(
    () => devolucoes.filter((d) => d.funcionarioId === funcionarioId),
    [devolucoes, funcionarioId]
  );

  const devolvidoPorItem = useMemo(() => {
    const map: Record<string, number> = {};
    devsFunc.forEach((d) => { map[d.epiItemId] = (map[d.epiItemId] || 0) + Number(d.quantidade || 0); });
    return map;
  }, [devsFunc]);

  const emAberto = useMemo(
    () =>
      epis
        .map((e) => ({
          descricao: e.descricao,
          ca: e.ca || "",
          quantidade: Number(e.quantidade || 0) - (devolvidoPorItem[e.id] || 0),
          dataEntrega: e.dataEntrega || "",
          dataVencimento: e.dataVencimento || "",
        }))
        .filter((e) => e.quantidade > 0),
    [epis, devolvidoPorItem]
  );

  const eventos: ProntuarioEvento[] = useMemo(() => {
    const list: ProntuarioEvento[] = [];
    epis.forEach((e) => {
      if (!e.dataEntrega) return;
      list.push({
        data: e.dataEntrega,
        tipo: "Entrega",
        descricao: e.descricao,
        ca: e.ca || "",
        quantidade: Number(e.quantidade || 0),
        detalhe: e.dataVencimento ? `Vencimento: ${fmt(e.dataVencimento)}` : "",
      });
    });
    devsFunc.forEach((d) => {
      list.push({
        data: d.dataDevolucao,
        tipo: "Devolução",
        descricao: d.descricao,
        ca: d.ca,
        quantidade: Number(d.quantidade || 0),
        detalhe: [d.motivo, d.condicao, d.destino, d.observacao].filter(Boolean).join(" • "),
      });
    });
    return list
      .filter((e) => (!de || e.data >= de) && (!ate || e.data <= ate))
      .sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  }, [epis, devsFunc, de, ate]);

  const exportar = async () => {
    if (!func) { toast.error("Selecione um funcionário."); return; }
    try {
      await gerarPdfProntuarioEpi({
        funcionarioNome: func.nome,
        cpf: func.cpf,
        cargoNome,
        clienteNome,
        admissao: func.dataAdmissao,
        eventos: [...eventos].reverse(),
        emAberto,
      });
      toast.success("Prontuário gerado.");
    } catch (e: any) {
      toast.error("Falha ao gerar PDF: " + (e?.message || ""));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Prontuário de EPIs</h1>
            <p className="text-sm text-muted-foreground">Histórico contínuo de recebimento e recolhimento por funcionário</p>
          </div>
        </div>
        <Button size="sm" onClick={exportar} disabled={!func}>
          <FileDown className="h-4 w-4 mr-1" /> Gerar prontuário (PDF)
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1 min-w-[280px]">
          <label className="text-xs text-muted-foreground">Funcionário</label>
          <Select value={funcionarioId} onValueChange={setFuncionarioId}>
            <SelectTrigger><SelectValue placeholder="Selecione o funcionário" /></SelectTrigger>
            <SelectContent className="max-h-72">
              {[...funcionarios].sort((a, b) => a.nome.localeCompare(b.nome)).map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Período de</label>
          <Input type="date" className="w-[160px]" value={de} onChange={(e) => setDe(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Período até</label>
          <Input type="date" className="w-[160px]" value={ate} onChange={(e) => setAte(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" onClick={() => { setDe(""); setAte(""); }}>Limpar período</Button>
      </div>

      {!func ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Selecione um funcionário para visualizar o prontuário.</p>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{func.nome}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><span className="text-muted-foreground">CPF:</span> {func.cpf || "—"}</div>
              <div><span className="text-muted-foreground">Cargo:</span> {cargoNome}</div>
              <div><span className="text-muted-foreground">Cliente:</span> {clienteNome}</div>
              <div><span className="text-muted-foreground">Admissão:</span> {fmt(func.dataAdmissao)}</div>
              <div><span className="text-muted-foreground">Entregas:</span> {epis.length}</div>
              <div><span className="text-muted-foreground">Devoluções:</span> {devsFunc.length}</div>
              <div><span className="text-muted-foreground">Em posse:</span> {emAberto.reduce((s, e) => s + e.quantidade, 0)} item(ns)</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">EPIs em posse do funcionário</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>EPI</TableHead>
                    <TableHead className="w-32 text-center">CA</TableHead>
                    <TableHead className="w-20 text-center">Qtd</TableHead>
                    <TableHead className="w-32 text-center">Entrega</TableHead>
                    <TableHead className="w-32 text-center">Vencimento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emAberto.map((e, i) => (
                    <TableRow key={i}>
                      <TableCell>{e.descricao}</TableCell>
                      <TableCell className="text-center">{e.ca || "—"}</TableCell>
                      <TableCell className="text-center">{e.quantidade}</TableCell>
                      <TableCell className="text-center">{fmt(e.dataEntrega)}</TableCell>
                      <TableCell className="text-center">{fmt(e.dataVencimento)}</TableCell>
                    </TableRow>
                  ))}
                  {emAberto.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nenhum EPI em posse.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Histórico contínuo</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {eventos.map((ev, i) => (
                  <div key={i} className="flex gap-3 border-l-2 border-border pl-4 relative">
                    <span className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full flex items-center justify-center ${ev.tipo === "Entrega" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                      {ev.tipo === "Entrega" ? <ArrowDownToLine className="h-2.5 w-2.5" /> : <ArrowUpFromLine className="h-2.5 w-2.5" />}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={ev.tipo === "Entrega" ? "default" : "destructive"}>{ev.tipo}</Badge>
                        <span className="text-sm font-medium">{ev.descricao}</span>
                        {ev.ca && <span className="text-xs text-muted-foreground">CA {ev.ca}</span>}
                        <span className="text-xs text-muted-foreground">Qtd {ev.quantidade}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{fmt(ev.data)}</span>
                      </div>
                      {ev.detalhe && <p className="text-xs text-muted-foreground mt-0.5">{ev.detalhe}</p>}
                    </div>
                  </div>
                ))}
                {eventos.length === 0 && (
                  <p className="text-center text-muted-foreground py-6">Sem movimentações no período.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
