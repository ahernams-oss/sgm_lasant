import { useState, useMemo } from "react";
import PaginationControls, { paginate } from "@/components/PaginationControls";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, Search, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProcessoSeletivo } from "@/contexts/ProcessoSeletivoContext";
import { useRequisicoes } from "@/contexts/RequisicaoContext";

const ProcessosSeletivos = () => {
  const navigate = useNavigate();
  const { processos } = useProcessoSeletivo();
  const { requisicoes } = useRequisicoes();
  const [search, setSearch] = useState("");
  const [cliente, setCliente] = useState("");
  const [cargo, setCargo] = useState("");
  const [status, setStatus] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);


  const processosComReq = useMemo(() =>
    processos.map((p) => ({
      ...p,
      requisicao: requisicoes.find((r) => r.id === p.requisicaoId),
    })),
    [processos, requisicoes]
  );

  const clientesUnicos = useMemo(
    () =>
      Array.from(
        new Set(processosComReq.map((p) => p.requisicao?.unidade).filter(Boolean))
      ).sort((a, b) => (a as string).localeCompare(b as string)),
    [processosComReq]
  );

  const cargosUnicos = useMemo(
    () =>
      Array.from(
        new Set(processosComReq.map((p) => p.requisicao?.cargoNome).filter(Boolean))
      ).sort((a, b) => (a as string).localeCompare(b as string)),
    [processosComReq]
  );

  const getProcessoStatus = (p: typeof processosComReq[0]) => {
    const total = p.candidatos.length;
    if (total === 0) return "em_andamento";
    const contratados = p.candidatos.filter((c) => c.etapaAtual === "contratacao").length;
    if (contratados === total) return "concluido";
    if (p.candidatos.some((c) => c.etapaAtual === "liberacao")) return "liberacao";
    return "em_andamento";
  };

  const parseData = (s: string) => {
    const [d, m, y] = (s || "").split("/");
    return new Date(Number(y), Number(m) - 1, Number(d)).getTime() || 0;
  };

  const parseInputDate = (s: string) => {
    if (!s) return 0;
    const [y, m, d] = s.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d)).getTime();
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const inicio = parseInputDate(dataInicio);
    const fim = parseInputDate(dataFim);
    const fimAjustado = fim ? fim + 24 * 60 * 60 * 1000 - 1 : 0;

    const base = processosComReq.filter((p) => {
      const dataProc = parseData(p.dataCriacao);
      const matchSearch =
        !term ||
        (p.requisicao?.cargoNome || "").toLowerCase().includes(term) ||
        (p.requisicao?.unidade || "").toLowerCase().includes(term) ||
        p.dataCriacao.toLowerCase().includes(term) ||
        p.candidatos.some((c) => c.nome.toLowerCase().includes(term));
      const matchCliente = !cliente || p.requisicao?.unidade === cliente;
      const matchCargo = !cargo || p.requisicao?.cargoNome === cargo;
      const matchStatus = !status || getProcessoStatus(p) === status;
      const matchPeriodo =
        (!inicio || dataProc >= inicio) &&
        (!fimAjustado || dataProc <= fimAjustado);
      return matchSearch && matchCliente && matchCargo && matchStatus && matchPeriodo;
    });

    return [...base].sort((a, b) => parseData(b.dataCriacao) - parseData(a.dataCriacao));
  }, [processosComReq, search, cliente, cargo, status, dataInicio, dataFim]);


  const limparFiltros = () => {
    setSearch("");
    setCliente("");
    setCargo("");
    setStatus("");
    setDataInicio("");
    setDataFim("");
    setPage(1);
  };

  const filtrosAtivos = search || cliente || cargo || status || dataInicio || dataFim;


  return (
    <div className="bg-background">
      <div className="container max-w-full mx-auto px-4 py-8">
        <div className="mb-6 animate-fade-up">
          <div className="flex items-center gap-2 text-primary mb-1">
            <ClipboardCheck className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Processos Seletivos</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Processos Seletivos</h1>
              <p className="text-sm text-muted-foreground">
                Acompanhe os processos seletivos vinculados às requisições aprovadas.
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6 animate-fade-up">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Filtros
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar processos..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 h-9"
                />
              </div>

              <Select value={cliente} onValueChange={(v) => { setCliente(v); setPage(1); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Cliente / Unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">Todos</SelectItem>
                  {clientesUnicos.map((u) => (
                    <SelectItem key={u as string} value={u as string}>{u as string}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={cargo} onValueChange={(v) => { setCargo(v); setPage(1); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">Todos</SelectItem>
                  {cargosUnicos.map((c) => (
                    <SelectItem key={c as string} value={c as string}>{c as string}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  placeholder="De"
                  value={dataInicio}
                  onChange={(e) => { setDataInicio(e.target.value); setPage(1); }}
                  className="h-9"
                />
                <span className="text-muted-foreground">→</span>
                <Input
                  type="date"
                  placeholder="Até"
                  value={dataFim}
                  onChange={(e) => { setDataFim(e.target.value); setPage(1); }}
                  className="h-9"
                />
              </div>
            </div>
            {filtrosAtivos && (
              <div className="flex justify-end mt-3">
                <Button variant="ghost" size="sm" onClick={limparFiltros} className="h-8 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5 mr-1" /> Limpar filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center text-sm text-muted-foreground">
              {processosComReq.length === 0 ? "Nenhum processo seletivo iniciado ainda." : "Nenhum resultado encontrado."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {paginate(filtered, page, pageSize).paginated.map((p, idx) => {
              const total = p.candidatos.length;
              const contratados = p.candidatos.filter((c) => c.etapaAtual === "contratacao").length;
              return (
                <Card
                  key={p.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${idx % 2 === 1 ? "bg-gray-200/60 hover:bg-gray-200/80" : "bg-white hover:bg-gray-100/60"}`}
                  onClick={() => navigate(`/processo-seletivo/${p.requisicaoId}`)}
                >
                  <CardContent className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {p.requisicao?.cargoNome || "Cargo"} — {p.requisicao?.unidade || "Unidade"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Criado em {p.dataCriacao} · {total} candidato{total !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {contratados > 0 && (
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          {contratados} liberado{contratados !== 1 ? "s" : ""}
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm">Abrir →</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        <PaginationControls currentPage={page} totalItems={filtered.length} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      </div>
    </div>
  );
};

export default ProcessosSeletivos;
