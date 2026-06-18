import { useMemo, useState } from "react";
import { usePmoc } from "@/contexts/PmocContext";
import { useEquipamentos } from "@/contexts/EquipamentosContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, Wrench, CheckCircle2, ArrowLeft, CalendarClock } from "lucide-react";

const PERIODICIDADE_ORDEM = ["Diária", "Semanal", "Quinzenal", "Mensal", "Bimestral", "Trimestral", "Semestral", "Anual"];

function addPeriodicidade(date: Date, periodicidade: string): Date {
  const d = new Date(date);
  switch ((periodicidade || "").trim()) {
    case "Diária": d.setDate(d.getDate() + 1); break;
    case "Semanal": d.setDate(d.getDate() + 7); break;
    case "Quinzenal": d.setDate(d.getDate() + 15); break;
    case "Mensal": d.setMonth(d.getMonth() + 1); break;
    case "Bimestral": d.setMonth(d.getMonth() + 2); break;
    case "Trimestral": d.setMonth(d.getMonth() + 3); break;
    case "Semestral": d.setMonth(d.getMonth() + 6); break;
    case "Anual": d.setFullYear(d.getFullYear() + 1); break;
    default: d.setMonth(d.getMonth() + 1);
  }
  return d;
}

function fmtDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PmocGerenciarOperacao() {
  const { atividades, planos, updateAtividade } = usePmoc();
  const { equipamentos } = useEquipamentos();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedEquipId, setSelectedEquipId] = useState<string | null>(null);
  const [registrandoId, setRegistrandoId] = useState<string | null>(null);

  // Agrupa atividades por equipamento
  const equipamentosComPlano = useMemo(() => {
    const map = new Map<string, { id: string; nome: string; atividades: typeof atividades }>();
    atividades.forEach((a) => {
      if (!a.equipamentoId) return;
      const equip = equipamentos.find((e) => e.id === a.equipamentoId);
      const nome = equip ? `${equip.tag || ""} ${equip.equipamento || ""}`.trim() || a.equipamentoNome : a.equipamentoNome || "Equipamento";
      if (!map.has(a.equipamentoId)) {
        map.set(a.equipamentoId, { id: a.equipamentoId, nome, atividades: [] });
      }
      map.get(a.equipamentoId)!.atividades.push(a);
    });
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [atividades, equipamentos]);

  const filtered = useMemo(() => {
    if (!search) return equipamentosComPlano;
    const s = search.toLowerCase();
    return equipamentosComPlano.filter((e) => e.nome.toLowerCase().includes(s));
  }, [equipamentosComPlano, search]);

  const selected = selectedEquipId
    ? equipamentosComPlano.find((e) => e.id === selectedEquipId)
    : null;

  const atividadesOrdenadas = useMemo(() => {
    if (!selected) return [];
    return [...selected.atividades].sort((a, b) => {
      const ia = PERIODICIDADE_ORDEM.indexOf(a.periodicidade);
      const ib = PERIODICIDADE_ORDEM.indexOf(b.periodicidade);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [selected]);

  const handleRegistrar = async (atividade: any) => {
    setRegistrandoId(atividade.id);
    try {
      const agora = new Date();
      const proxima = addPeriodicidade(agora, atividade.periodicidade);
      await updateAtividade(atividade.id, {
        ultima_execucao: agora.toISOString(),
        proxima_execucao: proxima.toISOString(),
      });
      toast({
        title: "Manutenção registrada",
        description: `Próxima ${atividade.descricao || "manutenção"} agendada para ${fmtDateTime(proxima.toISOString())}.`,
      });
    } catch (e: any) {
      toast({ title: "Erro ao registrar", description: e.message, variant: "destructive" });
    } finally {
      setRegistrandoId(null);
    }
  };

  if (selected) {
    const plano = planos.find((p) => p.id === selected.atividades[0]?.planoId);
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setSelectedEquipId(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <h1 className="text-2xl font-serif font-semibold">{selected.nome}</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" /> Manutenções do Equipamento
            </CardTitle>
            {plano && (
              <p className="text-sm text-muted-foreground">
                Plano: {plano.titulo} {plano.clienteNome ? `— ${plano.clienteNome}` : ""}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Atividade</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Periodicidade</TableHead>
                  <TableHead>Última Execução</TableHead>
                  <TableHead>Próxima Execução</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atividadesOrdenadas.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.descricao || "—"}</TableCell>
                    <TableCell>{a.tipo}</TableCell>
                    <TableCell><Badge variant="secondary">{a.periodicidade}</Badge></TableCell>
                    <TableCell>{fmtDateTime(a.ultimaExecucao)}</TableCell>
                    <TableCell className="flex items-center gap-1">
                      <CalendarClock className="h-4 w-4 text-muted-foreground" />
                      {fmtDateTime(a.proximaExecucao)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleRegistrar(a)}
                        disabled={registrandoId === a.id}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        {registrandoId === a.id ? "Registrando..." : "Registrar Manutenção"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {atividadesOrdenadas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                      Nenhuma atividade cadastrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-serif font-semibold">Gerenciar Operação</h1>
      <Card>
        <CardHeader>
          <CardTitle>Equipamentos com Plano PMOC</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar equipamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead>Atividades</TableHead>
                <TableHead>Próxima Manutenção</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => {
                const proximas = e.atividades
                  .map((a) => a.proximaExecucao)
                  .filter(Boolean)
                  .sort();
                const proxima = proximas[0] || "";
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.nome}</TableCell>
                    <TableCell>{e.atividades.length}</TableCell>
                    <TableCell>{fmtDateTime(proxima)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelectedEquipId(e.id)}>
                        <Wrench className="h-4 w-4 mr-1" /> Operar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                    Nenhum equipamento com plano PMOC encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
