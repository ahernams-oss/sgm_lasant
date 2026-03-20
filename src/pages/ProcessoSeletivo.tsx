import { useParams, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { ArrowLeft, Plus, UserPlus, ClipboardCheck, ShieldCheck, CheckCircle2, XCircle, Clock, MinusCircle, Paperclip, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  useProcessoSeletivo,
  Candidato,
  EtapaCandidato,
  AnexoCandidato,
} from "@/contexts/ProcessoSeletivoContext";
import { useRequisicoes } from "@/contexts/RequisicaoContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const etapaLabels: Record<EtapaCandidato, string> = {
  entrevista_psicologica: "Entrevista Psicológica",
  entrevista_tecnica: "Entrevista Técnica",
  liberacao: "Liberação",
  contratacao: "Contratação",
};

const statusIcons = {
  pendente: <Clock className="h-4 w-4 text-amber-500" />,
  aprovado: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  neutro: <MinusCircle className="h-4 w-4 text-blue-500" />,
  reprovado: <XCircle className="h-4 w-4 text-red-500" />,
};

const statusBadge = {
  pendente: "bg-amber-100 text-amber-800 border-amber-200",
  aprovado: "bg-emerald-100 text-emerald-800 border-emerald-200",
  neutro: "bg-blue-100 text-blue-800 border-blue-200",
  reprovado: "bg-red-100 text-red-800 border-red-200",
};

const ProcessoSeletivoPage = () => {
  const { requisicaoId } = useParams<{ requisicaoId: string }>();
  const navigate = useNavigate();
  const { requisicoes } = useRequisicoes();
  const { getProcessoByRequisicao, criarProcesso, addCandidato, updateCandidato, avancarEtapa } =
    useProcessoSeletivo();
  const { temAcessoTotal } = useAuth();

  const requisicao = requisicoes.find((r) => r.id === requisicaoId);

  // Auto-create processo if it doesn't exist
  let processo = getProcessoByRequisicao(requisicaoId || "");
  if (!processo && requisicaoId && requisicao?.status === "Aprovada") {
    processo = criarProcesso(requisicaoId);
  }

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCandidato, setNewCandidato] = useState({ nome: "", telefone: "", email: "" });
  const [anexos, setAnexos] = useState<AnexoCandidato[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTab, setSelectedTab] = useState<string>("candidatos");

  if (!requisicao || !processo) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <p className="text-muted-foreground">Requisição não encontrada ou não aprovada.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  const handleAddCandidato = () => {
    if (!newCandidato.nome.trim()) {
      toast.error("Informe o nome do candidato.");
      return;
    }
    if (processo!.candidatos.length >= 5) {
      toast.error("Limite de 5 candidatos atingido.");
      return;
    }
    addCandidato(processo!.id, newCandidato);
    setNewCandidato({ nome: "", telefone: "", email: "" });
    setShowAddDialog(false);
    toast.success("Candidato adicionado com sucesso.");
  };

  const handleSalvarParecer = (candidatoId: string, field: string, value: string) => {
    updateCandidato(processo!.id, candidatoId, { [field]: value });
  };

  const handleAprovarEtapa = (candidato: Candidato, statusField: string, status: "aprovado" | "neutro" | "reprovado") => {
    const updates: Partial<Candidato> = { [statusField]: status };

    if (statusField === "statusLiberacao" && status === "aprovado") {
      updates.liberadoPor = "Usuário Autorizado";
    }

    updateCandidato(processo!.id, candidato.id, updates);

    if (status === "aprovado") {
      avancarEtapa(processo!.id, candidato.id);
      toast.success(`Candidato ${candidato.nome} aprovado nesta etapa.`);
    } else if (status === "neutro") {
      avancarEtapa(processo!.id, candidato.id);
      toast.info(`Candidato ${candidato.nome} marcado como neutro e avançou para próxima etapa.`);
    } else {
      toast.info(`Candidato ${candidato.nome} reprovado nesta etapa.`);
    }
  };

  const getEtapaStatus = (c: Candidato, etapa: EtapaCandidato) => {
    if (etapa === "entrevista_psicologica") return c.statusPsicologico;
    if (etapa === "entrevista_tecnica") return c.statusTecnico;
    if (etapa === "liberacao") return c.statusLiberacao;
    return "aprovado";
  };

  const etapas: EtapaCandidato[] = ["entrevista_psicologica", "entrevista_tecnica", "liberacao"];

  return (
    <div className="bg-background">
      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 animate-fade-up">
          <Button variant="ghost" size="sm" className="mb-3 -ml-2" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar às Requisições
          </Button>
          <div className="flex items-center gap-2 text-primary mb-1">
            <ClipboardCheck className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Processo Seletivo</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {requisicao.cargoNome} — {requisicao.unidade}
          </h1>
          <p className="text-sm text-muted-foreground">
            Requisição de {requisicao.dataCriacao} · {processo.candidatos.length}/5 candidatos
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="candidatos">Candidatos</TabsTrigger>
            <TabsTrigger value="etapa1">1. Psicológica</TabsTrigger>
            <TabsTrigger value="etapa2">2. Técnica</TabsTrigger>
            <TabsTrigger value="etapa3">3. Liberação</TabsTrigger>
          </TabsList>

          {/* TAB: Candidatos */}
          <TabsContent value="candidatos">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-foreground">Lista de Candidatos</h2>
              {processo.candidatos.length < 5 && (
                <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1">
                  <Plus className="h-4 w-4" /> Adicionar
                </Button>
              )}
            </div>
            {processo.candidatos.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  <UserPlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  Nenhum candidato adicionado ainda.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {processo.candidatos.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{c.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.email} {c.telefone && `· ${c.telefone}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={statusBadge[getEtapaStatus(c, c.etapaAtual)]}>
                          {etapaLabels[c.etapaAtual]}
                        </Badge>
                        {statusIcons[getEtapaStatus(c, c.etapaAtual)]}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB: Etapa 1 – Entrevista Psicológica */}
          <TabsContent value="etapa1">
            <h2 className="text-lg font-semibold text-foreground mb-4">Entrevista Psicológica</h2>
            {processo.candidatos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Adicione candidatos primeiro.</p>
            ) : (
              <div className="grid gap-4">
                {processo.candidatos.map((c) => {
                  const isCurrentEtapa = c.etapaAtual === "entrevista_psicologica";
                  const isPast = ["entrevista_tecnica", "liberacao", "contratacao"].includes(c.etapaAtual);
                  return (
                    <Card key={c.id} className={!isCurrentEtapa && !isPast ? "opacity-50" : ""}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center justify-between">
                          {c.nome}
                          <Badge variant="outline" className={statusBadge[c.statusPsicologico]}>
                            {c.statusPsicologico === "pendente" ? "Pendente" : c.statusPsicologico === "aprovado" ? "Aprovado" : c.statusPsicologico === "neutro" ? "Neutro" : "Reprovado"}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Idade</label>
                            <Input
                              value={c.idade}
                              onChange={(e) => handleSalvarParecer(c.id, "idade", e.target.value)}
                              placeholder="Ex: 28"
                              className="mt-1"
                              disabled={!isCurrentEtapa}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Estado Civil</label>
                            <Input
                              value={c.estadoCivil}
                              onChange={(e) => handleSalvarParecer(c.id, "estadoCivil", e.target.value)}
                              placeholder="Ex: Solteiro(a)"
                              className="mt-1"
                              disabled={!isCurrentEtapa}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Experiências Anteriores</label>
                          <Textarea
                            value={c.experienciasAnteriores}
                            onChange={(e) => handleSalvarParecer(c.id, "experienciasAnteriores", e.target.value)}
                            placeholder="Descreva as experiências anteriores do candidato..."
                            className="mt-1"
                            rows={2}
                            disabled={!isCurrentEtapa}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Parecer da Psicóloga</label>
                          <Textarea
                            value={c.parecerPsicologo}
                            onChange={(e) => handleSalvarParecer(c.id, "parecerPsicologo", e.target.value)}
                            placeholder="Descreva a avaliação psicológica do candidato..."
                            className="mt-1 min-h-[80px] resize-y"
                            rows={3}
                            disabled={!isCurrentEtapa}
                          />
                        </div>
                        {isCurrentEtapa && c.statusPsicologico === "pendente" && (
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleAprovarEtapa(c, "statusPsicologico", "reprovado")}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Reprovar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => {
                                if (!c.parecerPsicologo.trim()) {
                                  toast.error("Preencha o parecer antes de definir o status.");
                                  return;
                                }
                                handleAprovarEtapa(c, "statusPsicologico", "neutro");
                              }}
                            >
                              <MinusCircle className="h-4 w-4 mr-1" /> Neutro
                            </Button>
                            <Button
                              size="sm"
                              className="bg-[hsl(120,30%,35%)] hover:bg-[hsl(120,30%,28%)] text-white"
                              onClick={() => {
                                if (!c.parecerPsicologo.trim()) {
                                  toast.error("Preencha o parecer antes de aprovar.");
                                  return;
                                }
                                handleAprovarEtapa(c, "statusPsicologico", "aprovado");
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB: Etapa 2 – Entrevista Técnica */}
          <TabsContent value="etapa2">
            <h2 className="text-lg font-semibold text-foreground mb-4">Entrevista Técnica</h2>
            {processo.candidatos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Adicione candidatos primeiro.</p>
            ) : (
              <div className="grid gap-4">
                {processo.candidatos.filter((c) => ["entrevista_tecnica", "liberacao", "contratacao"].includes(c.etapaAtual)).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum candidato avançou para esta etapa ainda.</p>
                ) : (
                  processo.candidatos
                    .filter((c) => ["entrevista_tecnica", "liberacao", "contratacao"].includes(c.etapaAtual))
                    .map((c) => {
                      const isCurrentEtapa = c.etapaAtual === "entrevista_tecnica";
                      const isPast = ["liberacao", "contratacao"].includes(c.etapaAtual);
                      return (
                        <Card key={c.id}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center justify-between">
                              {c.nome}
                              <Badge variant="outline" className={statusBadge[c.statusTecnico]}>
                                {c.statusTecnico === "pendente" ? "Pendente" : c.statusTecnico === "aprovado" ? "Aprovado" : "Reprovado"}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Nome do Avaliador</label>
                              <Input
                                value={c.avaliadorTecnico}
                                onChange={(e) => handleSalvarParecer(c.id, "avaliadorTecnico", e.target.value)}
                                placeholder="Nome do avaliador técnico"
                                className="mt-1"
                                disabled={!isCurrentEtapa}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Parecer Técnico</label>
                              <Textarea
                                value={c.parecerTecnico}
                                onChange={(e) => handleSalvarParecer(c.id, "parecerTecnico", e.target.value)}
                                placeholder="Descreva a avaliação técnica do candidato..."
                                className="mt-1"
                                rows={3}
                                disabled={!isCurrentEtapa}
                              />
                            </div>
                            {isCurrentEtapa && c.statusTecnico === "pendente" && (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleAprovarEtapa(c, "statusTecnico", "reprovado")}
                                >
                                  <XCircle className="h-4 w-4 mr-1" /> Reprovar
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-[hsl(120,30%,35%)] hover:bg-[hsl(120,30%,28%)] text-white"
                                  onClick={() => {
                                    if (!c.parecerTecnico.trim() || !c.avaliadorTecnico.trim()) {
                                      toast.error("Preencha o avaliador e o parecer antes de aprovar.");
                                      return;
                                    }
                                    handleAprovarEtapa(c, "statusTecnico", "aprovado");
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                )}
              </div>
            )}
          </TabsContent>

          {/* TAB: Etapa 3 – Liberação */}
          <TabsContent value="etapa3">
            <h2 className="text-lg font-semibold text-foreground mb-4">Liberação para Contratação</h2>
            {processo.candidatos.filter((c) => ["liberacao", "contratacao"].includes(c.etapaAtual)).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum candidato avançou para a etapa de liberação.</p>
            ) : (
              <div className="grid gap-4">
                {processo.candidatos
                  .filter((c) => ["liberacao", "contratacao"].includes(c.etapaAtual))
                  .map((c) => {
                    const isCurrentEtapa = c.etapaAtual === "liberacao";
                    const canAuthorize = temAcessoTotal;
                    return (
                      <Card key={c.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {c.etapaAtual === "contratacao" && <ShieldCheck className="h-4 w-4 text-emerald-600" />}
                              {c.nome}
                            </div>
                            <Badge variant="outline" className={statusBadge[c.statusLiberacao]}>
                              {c.statusLiberacao === "pendente" ? "Aguardando" : c.statusLiberacao === "aprovado" ? "Liberado" : "Reprovado"}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {c.etapaAtual === "contratacao" && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 text-sm text-emerald-800">
                              ✅ Candidato liberado por <strong>{c.liberadoPor}</strong> — pronto para contratação.
                            </div>
                          )}
                          {isCurrentEtapa && (
                            <>
                              {!canAuthorize ? (
                                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
                                  🔒 Apenas Diretores, Gerentes Executivos ou Coordenadores podem liberar candidatos.
                                </div>
                              ) : (
                                c.statusLiberacao === "pendente" && (
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700"
                                      onClick={() => handleAprovarEtapa(c, "statusLiberacao", "reprovado")}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" /> Reprovar
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-[hsl(120,30%,35%)] hover:bg-[hsl(120,30%,28%)] text-white"
                                      onClick={() => handleAprovarEtapa(c, "statusLiberacao", "aprovado")}
                                    >
                                      <ShieldCheck className="h-4 w-4 mr-1" /> Liberar
                                    </Button>
                                  </div>
                                )
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog: Adicionar Candidato */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Candidato</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nome *</label>
                <Input
                  value={newCandidato.nome}
                  onChange={(e) => setNewCandidato((p) => ({ ...p, nome: e.target.value }))}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">E-mail</label>
                <Input
                  value={newCandidato.email}
                  onChange={(e) => setNewCandidato((p) => ({ ...p, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Telefone</label>
                <Input
                  value={newCandidato.telefone}
                  onChange={(e) => setNewCandidato((p) => ({ ...p, telefone: e.target.value }))}
                  placeholder="+55 (00) 00000-0000"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleAddCandidato}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProcessoSeletivoPage;
