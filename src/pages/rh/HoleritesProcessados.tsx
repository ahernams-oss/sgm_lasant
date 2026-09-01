import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFuncionarios } from "@/contexts/FuncionariosContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PaginationControls from "@/components/PaginationControls";
import { Loader2, FileSpreadsheet, RefreshCw, Upload, Undo2 } from "lucide-react";
import { toast } from "sonner";

interface Registro {
  id: string;
  pagina: number;
  cpf_detectado: string | null;
  nome_detectado: string | null;
  funcionario_id: string | null;
  tipo: string;
  valor_liquido: number | null;
  salario_base: number | null;
  horas_trabalhadas: number | null;
  horas_extras: number | null;
  valor_horas_extras: number | null;
  total_proventos: number | null;
  total_descontos: number | null;
  publicado: boolean;
  ignorar: boolean;
  lote: {
    competencia_mes: number;
    competencia_ano: number;
    arquivo_nome: string | null;
  } | null;
}

const TIPOS: Record<string, string> = {
  folha: "Folha Mensal",
  "13o": "13º Salário",
  ferias: "Férias",
  rescisao: "Rescisão",
  outros: "Outros",
};

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const money = (v: number | null) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const horas = (v: number | null) =>
  v == null ? "—" : `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} h`;

export default function HoleritesProcessados() {
  const { funcionarios } = useFuncionarios();
  const now = new Date();
  const [loading, setLoading] = useState(true);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [busca, setBusca] = useState("");
  const [mes, setMes] = useState<string>("todos");
  const [ano, setAno] = useState<string>(String(now.getFullYear()));
  const [tipo, setTipo] = useState<string>("todos");
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(20);

  const carregar = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("portal_holerites_import_item")
      .select(
        "id,pagina,cpf_detectado,nome_detectado,funcionario_id,tipo,valor_liquido,salario_base,horas_trabalhadas,horas_extras,valor_horas_extras,total_proventos,total_descontos,publicado,ignorar,lote:portal_holerites_import_lote(competencia_mes,competencia_ano,arquivo_nome)"
      )
      .order("created_at", { ascending: false })
      .limit(3000);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setRegistros((data || []) as any);
  };

  useEffect(() => { carregar(); }, []);

  const nomeFuncionario = (r: Registro) => {
    const f = funcionarios.find((x: any) => x.id === r.funcionario_id);
    return f?.nome || r.nome_detectado || "—";
  };

  const anos = useMemo(() => {
    const s = new Set<string>();
    registros.forEach((r) => r.lote && s.add(String(r.lote.competencia_ano)));
    s.add(String(now.getFullYear()));
    return Array.from(s).sort().reverse();
  }, [registros]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return registros.filter((r) => {
      if (r.ignorar) return false;
      if (ano !== "todos" && String(r.lote?.competencia_ano) !== ano) return false;
      if (mes !== "todos" && String(r.lote?.competencia_mes) !== mes) return false;
      if (tipo !== "todos" && r.tipo !== tipo) return false;
      if (!q) return true;
      return (
        nomeFuncionario(r).toLowerCase().includes(q) ||
        (r.cpf_detectado || "").includes(q.replace(/\D/g, ""))
      );
    });
  }, [registros, busca, mes, ano, tipo, funcionarios]);

  useEffect(() => { setPagina(1); }, [busca, mes, ano, tipo, porPagina]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const visiveis = filtrados.slice((pagina - 1) * porPagina, pagina * porPagina);

  const soma = (k: keyof Registro) =>
    filtrados.reduce((acc, r) => acc + (Number(r[k]) || 0), 0);

  const exportarCsv = () => {
    const linhas = [
      ["Competência","Funcionário","CPF","Tipo","Salário base","Horas","Horas extras","Valor HE","Proventos","Descontos","Líquido","Publicado"],
      ...filtrados.map((r) => [
        r.lote ? `${String(r.lote.competencia_mes).padStart(2,"0")}/${r.lote.competencia_ano}` : "",
        nomeFuncionario(r), r.cpf_detectado || "", TIPOS[r.tipo] || r.tipo,
        r.salario_base ?? "", r.horas_trabalhadas ?? "", r.horas_extras ?? "",
        r.valor_horas_extras ?? "", r.total_proventos ?? "", r.total_descontos ?? "",
        r.valor_liquido ?? "", r.publicado ? "Sim" : "Não",
      ]),
    ];
    const csv = linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "holerites-processados.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Holerites Processados</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={carregar}>
            <RefreshCw className="mr-2 h-4 w-4" />Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportarCsv} disabled={!filtrados.length}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Holerites", v: String(filtrados.length) },
          { l: "Total salários", v: money(soma("salario_base")) },
          { l: "Horas extras", v: horas(soma("horas_extras")) },
          { l: "Total líquido", v: money(soma("valor_liquido")) },
        ].map((k) => (
          <Card key={k.l}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">{k.l}</p>
              <p className="text-xl font-semibold">{k.v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Filtros</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label>Buscar (nome ou CPF)</Label>
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite para filtrar…" />
          </div>
          <div>
            <Label>Mês</Label>
            <Select value={mes} onValueChange={setMes}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {MESES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ano</Label>
            <Select value={ano} onValueChange={setAno}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {anos.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {Object.entries(TIPOS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />Carregando…
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Competência</TableHead>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Salário base</TableHead>
                      <TableHead className="text-right">Horas</TableHead>
                      <TableHead className="text-right">Horas extras</TableHead>
                      <TableHead className="text-right">Valor HE</TableHead>
                      <TableHead className="text-right">Proventos</TableHead>
                      <TableHead className="text-right">Descontos</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visiveis.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap">
                          {r.lote ? `${String(r.lote.competencia_mes).padStart(2, "0")}/${r.lote.competencia_ano}` : "—"}
                        </TableCell>
                        <TableCell className="font-medium">{nomeFuncionario(r)}</TableCell>
                        <TableCell className="text-sm">{r.cpf_detectado || "—"}</TableCell>
                        <TableCell className="text-sm">{TIPOS[r.tipo] || r.tipo}</TableCell>
                        <TableCell className="text-right">{money(r.salario_base)}</TableCell>
                        <TableCell className="text-right">{horas(r.horas_trabalhadas)}</TableCell>
                        <TableCell className="text-right">{horas(r.horas_extras)}</TableCell>
                        <TableCell className="text-right">{money(r.valor_horas_extras)}</TableCell>
                        <TableCell className="text-right">{money(r.total_proventos)}</TableCell>
                        <TableCell className="text-right">{money(r.total_descontos)}</TableCell>
                        <TableCell className="text-right font-semibold">{money(r.valor_liquido)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={r.publicado ? "default" : "secondary"}>
                            {r.publicado ? "Publicado" : "Em conferência"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!visiveis.length && (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                          Nenhum holerite processado com os filtros atuais.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <PaginationControls
                currentPage={pagina}
                totalItems={filtrados.length}
                pageSize={porPagina}
                onPageChange={setPagina}
                onPageSizeChange={setPorPagina}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
