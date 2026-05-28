import React, { useState, useEffect, useMemo } from "react";
import { Calendar, Search, FileDown, Filter, AlertTriangle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import PaginationControls, { paginate } from "@/components/PaginationControls";
import { useFuncionarios } from "@/contexts/FuncionariosContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useCargos } from "@/contexts/CargosContext";
import { toast } from "sonner";

interface FeriasRow {
  id: string;
  funcionario_id: string;
  funcionario_nome: string;
  periodo_aquisitivo_inicio: string;
  periodo_aquisitivo_fim: string;
  data_limite_concessao: string;
  dias_direito: number;
  data_inicio_gozo: string | null;
  data_fim_gozo: string | null;
  dias_gozados: number;
  dias_abonados: number;
  status: string;
  observacoes: string;
  anexo_url: string | null;
}

const MapaFerias = () => {
  const { funcionarios } = useFuncionarios();
  const { clientes } = useClientes();
  const { cargos } = useCargos();

  const [ferias, setFerias] = useState<FeriasRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroVencimento, setFiltroVencimento] = useState("todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchFerias = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('ferias')
      .select('*')
      .order('data_limite_concessao', { ascending: true });
    if (error) { console.error(error); toast.error('Erro ao carregar férias.'); }
    else setFerias((data as FeriasRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchFerias(); }, []);

  const enriched = useMemo(() => {
    return ferias.map((f) => {
      const func = funcionarios.find((x) => x.id === f.funcionario_id);
      const cliente = clientes.find((c) => c.id === func?.clienteId);
      const cargo = cargos.find((c) => c.id === func?.cargoId);
      const hoje = new Date();
      const lim = new Date(f.data_limite_concessao + 'T00:00:00');
      const diff = Math.ceil((lim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...f,
        clienteId: func?.clienteId || "",
        clienteNome: cliente?.nome || "—",
        cargoNome: cargo?.nome || "—",
        diasParaVencer: diff,
      };
    });
  }, [ferias, funcionarios, clientes, cargos]);

  const filtered = useMemo(() => {
    let r = enriched;
    if (filtroCliente !== "todos") r = r.filter((f) => f.clienteNome === filtroCliente);
    if (filtroStatus !== "todos") r = r.filter((f) => f.status === filtroStatus);
    if (filtroVencimento === "vencidas") r = r.filter((f) => f.diasParaVencer < 0 && f.status !== 'Concluída');
    else if (filtroVencimento === "30d") r = r.filter((f) => f.diasParaVencer >= 0 && f.diasParaVencer <= 30 && f.status !== 'Concluída');
    else if (filtroVencimento === "60d") r = r.filter((f) => f.diasParaVencer >= 0 && f.diasParaVencer <= 60 && f.status !== 'Concluída');
    if (search.trim()) {
      const s = search.toLowerCase();
      r = r.filter((f) =>
        (f.funcionario_nome || "").toLowerCase().includes(s) ||
        f.clienteNome.toLowerCase().includes(s) ||
        f.cargoNome.toLowerCase().includes(s)
      );
    }
    return r;
  }, [enriched, filtroCliente, filtroStatus, filtroVencimento, search]);

  const { paginated, totalPages, safePage } = paginate(filtered, page, pageSize);

  const clientesUnicos = useMemo(() => {
    const set = new Set(enriched.map((f) => f.clienteNome).filter((n) => n !== "—"));
    return Array.from(set).sort();
  }, [enriched]);

  const stats = useMemo(() => {
    const vencidas = enriched.filter((f) => f.diasParaVencer < 0 && f.status !== 'Concluída').length;
    const proximas = enriched.filter((f) => f.diasParaVencer >= 0 && f.diasParaVencer <= 30 && f.status !== 'Concluída').length;
    const emGozo = enriched.filter((f) => f.status === 'Em gozo').length;
    const programadas = enriched.filter((f) => f.status === 'Programada').length;
    return { vencidas, proximas, emGozo, programadas };
  }, [enriched]);

  const getBadge = (dias: number, status: string) => {
    if (status === 'Concluída') return { label: 'Concluída', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
    if (status === 'Em gozo') return { label: 'Em gozo', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
    if (dias < 0) return { label: 'Vencida', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    if (dias <= 30) return { label: `${dias}d`, cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    if (dias <= 60) return { label: `${dias}d`, cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
    return { label: `${dias}d`, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  };

  const exportCSV = () => {
    const headers = ['Funcionário', 'Cliente', 'Cargo', 'Período Aquisitivo', 'Limite Concessão', 'Status', 'Dias Direito', 'Início Gozo', 'Fim Gozo', 'Dias Gozados', 'Dias Abonados'];
    const rows = filtered.map((f) => [
      f.funcionario_nome,
      f.clienteNome,
      f.cargoNome,
      `${f.periodo_aquisitivo_inicio.split('-').reverse().join('/')} a ${f.periodo_aquisitivo_fim.split('-').reverse().join('/')}`,
      f.data_limite_concessao.split('-').reverse().join('/'),
      f.status,
      String(f.dias_direito),
      f.data_inicio_gozo ? f.data_inicio_gozo.split('-').reverse().join('/') : '',
      f.data_fim_gozo ? f.data_fim_gozo.split('-').reverse().join('/') : '',
      String(f.dias_gozados || 0),
      String(f.dias_abonados || 0),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mapa-ferias-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mapa de Férias</h1>
            <p className="text-sm text-muted-foreground">Acompanhe os períodos aquisitivos e a concessão de férias dos funcionários.</p>
          </div>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <FileDown className="h-4 w-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border p-4 bg-card">
          <p className="text-xs text-muted-foreground">Vencidas</p>
          <p className="text-2xl font-bold text-red-600">{stats.vencidas}</p>
        </div>
        <div className="rounded-lg border border-border p-4 bg-card">
          <p className="text-xs text-muted-foreground">Vencem em 30 dias</p>
          <p className="text-2xl font-bold text-amber-600">{stats.proximas}</p>
        </div>
        <div className="rounded-lg border border-border p-4 bg-card">
          <p className="text-xs text-muted-foreground">Em gozo</p>
          <p className="text-2xl font-bold text-blue-600">{stats.emGozo}</p>
        </div>
        <div className="rounded-lg border border-border p-4 bg-card">
          <p className="text-xs text-muted-foreground">Programadas</p>
          <p className="text-2xl font-bold text-primary">{stats.programadas}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por funcionário, cliente ou cargo..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={filtroCliente} onValueChange={(v) => { setFiltroCliente(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Clientes</SelectItem>
            {clientesUnicos.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={(v) => { setFiltroStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="A vencer">A vencer</SelectItem>
            <SelectItem value="Programada">Programada</SelectItem>
            <SelectItem value="Em gozo">Em gozo</SelectItem>
            <SelectItem value="Concluída">Concluída</SelectItem>
            <SelectItem value="Vencida">Vencida</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroVencimento} onValueChange={(v) => { setFiltroVencimento(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Vencimento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Vencimentos</SelectItem>
            <SelectItem value="vencidas">Apenas Vencidas</SelectItem>
            <SelectItem value="30d">Vencem em 30 dias</SelectItem>
            <SelectItem value="60d">Vencem em 60 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
      ) : paginated.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum período de férias encontrado.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Período Aquisitivo</TableHead>
                <TableHead className="text-center">Limite</TableHead>
                <TableHead className="text-center">Vencimento</TableHead>
                <TableHead>Gozo</TableHead>
                <TableHead className="text-center">Dias</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Anexo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((f) => {
                const badge = getBadge(f.diasParaVencer, f.status);
                const gozo = f.data_inicio_gozo
                  ? `${f.data_inicio_gozo.split('-').reverse().join('/')}${f.data_fim_gozo ? ' a ' + f.data_fim_gozo.split('-').reverse().join('/') : ''}`
                  : '—';
                return (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.funcionario_nome}</TableCell>
                    <TableCell>{f.clienteNome}</TableCell>
                    <TableCell>{f.cargoNome}</TableCell>
                    <TableCell className="text-sm">
                      {f.periodo_aquisitivo_inicio.split('-').reverse().join('/')} a {f.periodo_aquisitivo_fim.split('-').reverse().join('/')}
                    </TableCell>
                    <TableCell className="text-center">{f.data_limite_concessao.split('-').reverse().join('/')}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${badge.cls} text-xs font-medium`}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{gozo}</TableCell>
                    <TableCell className="text-center text-sm">
                      {f.dias_gozados || 0}/{f.dias_direito}
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{f.status}</Badge></TableCell>
                    <TableCell className="text-center">
                      {f.anexo_url ? (
                        <a href={f.anexo_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex">
                          <FileText className="h-4 w-4" />
                        </a>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <PaginationControls
        currentPage={safePage}
        totalItems={filtered.length}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />

      <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> CLT - Art. 134</p>
        <p>O período de concessão das férias é de até 12 meses após o término do período aquisitivo.</p>
      </div>
    </div>
  );
};

export default MapaFerias;
