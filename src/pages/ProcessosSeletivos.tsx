import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useProcessoSeletivo } from "@/contexts/ProcessoSeletivoContext";
import { useRequisicoes } from "@/contexts/RequisicaoContext";

const ProcessosSeletivos = () => {
  const navigate = useNavigate();
  const { processos } = useProcessoSeletivo();
  const { requisicoes } = useRequisicoes();
  const [search, setSearch] = useState("");

  const processosComReq = processos.map((p) => ({
    ...p,
    requisicao: requisicoes.find((r) => r.id === p.requisicaoId),
  }));

  const filtered = useMemo(() => {
    if (!search.trim()) return processosComReq;
    const term = search.toLowerCase();
    return processosComReq.filter(
      (p) =>
        (p.requisicao?.cargoNome || "").toLowerCase().includes(term) ||
        (p.requisicao?.unidade || "").toLowerCase().includes(term) ||
        p.dataCriacao.toLowerCase().includes(term) ||
        p.candidatos.some((c) => c.nome.toLowerCase().includes(term))
    );
  }, [processosComReq, search]);

  return (
    <div className="bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 animate-fade-up">
          <div className="flex items-center gap-2 text-primary mb-1">
            <ClipboardCheck className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Processos Seletivos</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Processos Seletivos</h1>
              <p className="text-sm text-muted-foreground">
                Acompanhe os processos seletivos vinculados às requisições aprovadas.
              </p>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Pesquisar processos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center text-sm text-muted-foreground">
              {processosComReq.length === 0 ? "Nenhum processo seletivo iniciado ainda." : "Nenhum resultado encontrado."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map((p) => {
              const total = p.candidatos.length;
              const contratados = p.candidatos.filter((c) => c.etapaAtual === "contratacao").length;
              return (
                <Card
                  key={p.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
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
      </div>
    </div>
  );
};

export default ProcessosSeletivos;
