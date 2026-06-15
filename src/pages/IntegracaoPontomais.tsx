import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SyncLog {
  id: string;
  iniciado_em: string;
  finalizado_em: string | null;
  periodo_ini: string | null;
  periodo_fim: string | null;
  origem: string;
  status: string;
  total_funcionarios: number;
  total_funcionarios_vinculados: number;
  total_marcacoes: number;
  total_espelhos: number;
  mensagem: string | null;
}

const formatDt = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const statusBadge = (status: string) => {
  switch (status) {
    case "sucesso":
      return <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Sucesso</Badge>;
    case "concluido_com_erros":
      return <Badge className="bg-yellow-600 hover:bg-yellow-700"><AlertTriangle className="w-3 h-3 mr-1" />Com erros</Badge>;
    case "erro":
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Erro</Badge>;
    case "em_andamento":
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Em andamento</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function IntegracaoPontomais() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ponto_sync_log")
      .select("*")
      .order("iniciado_em", { ascending: false })
      .limit(20);
    if (error) {
      toast({ title: "Erro ao carregar histórico", description: error.message, variant: "destructive" });
    } else {
      setLogs((data as SyncLog[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("pontomais-sync", {
        body: { origem: "manual", diasAtras: 2 },
      });
      if (error) throw error;
      if ((data as any)?.ok === false) throw new Error((data as any).error);
      toast({
        title: "Sincronização concluída",
        description: `Funcionários: ${(data as any).totalFuncionarios} (${(data as any).totalVinculados} vinculados) · Marcações: ${(data as any).totalMarcacoes} · Espelhos: ${(data as any).totalEspelhos}`,
      });
      await fetchLogs();
    } catch (err: any) {
      toast({ title: "Falha na sincronização", description: String(err?.message ?? err), variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const ultima = logs.find((l) => l.status === "sucesso" || l.status === "concluido_com_erros");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-primary">Integração Pontomais</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Importação de funcionários, marcações de ponto e espelho diário a partir do sistema Pontomais.
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncing} className="rounded-xl">
          {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {syncing ? "Sincronizando..." : "Sincronizar agora"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Última sincronização</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{formatDt(ultima?.iniciado_em ?? null)}</p>
            <div className="mt-2">{ultima ? statusBadge(ultima.status) : <Badge variant="outline">—</Badge>}</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Funcionários Pontomais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{ultima?.total_funcionarios ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {ultima?.total_funcionarios_vinculados ?? 0} vinculados por CPF
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Marcações importadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{ultima?.total_marcacoes ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Espelhos diários</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{ultima?.total_espelhos ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Histórico de sincronizações (últimas 20)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Funcionários</TableHead>
                  <TableHead className="text-right">Marcações</TableHead>
                  <TableHead className="text-right">Espelhos</TableHead>
                  <TableHead>Mensagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Nenhuma sincronização executada ainda. Clique em "Sincronizar agora".
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{formatDt(l.iniciado_em)}</TableCell>
                      <TableCell>{formatDt(l.finalizado_em)}</TableCell>
                      <TableCell className="text-xs">
                        {l.periodo_ini} → {l.periodo_fim}
                      </TableCell>
                      <TableCell><Badge variant="outline">{l.origem}</Badge></TableCell>
                      <TableCell>{statusBadge(l.status)}</TableCell>
                      <TableCell className="text-right">
                        {l.total_funcionarios_vinculados}/{l.total_funcionarios}
                      </TableCell>
                      <TableCell className="text-right">{l.total_marcacoes}</TableCell>
                      <TableCell className="text-right">{l.total_espelhos}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate">
                        {l.mensagem ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
