import { useParams, useNavigate } from "react-router-dom";
import { enviarWhatsApp } from "@/lib/whatsapp";
import { useClientes } from "@/contexts/ClientesContext";
import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Plus, UserPlus, ClipboardCheck, ShieldCheck, CheckCircle2, XCircle, Clock, MinusCircle, Paperclip, FileText, Trash2, Pencil, CalendarDays, FileCheck } from "lucide-react";
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
  DocumentoContratacao,
  DOCUMENTOS_OBRIGATORIOS,
} from "@/contexts/ProcessoSeletivoContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const ESTADO_CIVIL_OPTIONS = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável"];

const DOCS_REMOVIDOS = ["Atestado de Antecedentes Criminais"];
const filtrarDocs = (docs?: DocumentoContratacao[]) =>
  (docs && docs.length > 0 ? docs : DOCUMENTOS_OBRIGATORIOS.map((n): DocumentoContratacao => ({ nome: n, entregue: false })))
    .filter((d) => !DOCS_REMOVIDOS.includes(d.nome));
import { useRequisicoes } from "@/contexts/RequisicaoContext";
import { useAuth } from "@/contexts/AuthContext";
import { useFuncionarios } from "@/contexts/FuncionariosContext";
import { usePermissao } from "@/hooks/usePermissao";
import { toast } from "sonner";

// Debounced Input to avoid saving on every keystroke
function DebouncedInput({ value: externalValue, onChange, delay = 800, ...props }: React.ComponentProps<"input"> & { delay?: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  const [localValue, setLocalValue] = useState(externalValue ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const dirtyRef = useRef(false);
  useEffect(() => {
    if (!dirtyRef.current) setLocalValue(externalValue ?? "");
  }, [externalValue]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dirtyRef.current = true;
    setLocalValue(e.target.value);
    clearTimeout(timerRef.current);
    const val = e.target.value;
    timerRef.current = setTimeout(() => {
      dirtyRef.current = false;
      onChange({ target: { value: val } } as React.ChangeEvent<HTMLInputElement>);
    }, delay);
  };
  const handleBlur = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      dirtyRef.current = false;
      onChange({ target: { value: localValue } } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  };
  useEffect(() => () => clearTimeout(timerRef.current), []);
  return <Input {...props} value={localValue} onChange={handleChange} onBlur={handleBlur} />;
}

function DebouncedTextarea({ value: externalValue, onChange, delay = 800, ...props }: React.ComponentProps<typeof Textarea> & { delay?: number; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }) {
  const [localValue, setLocalValue] = useState(externalValue ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const dirtyRef = useRef(false);
  useEffect(() => {
    if (!dirtyRef.current) setLocalValue(externalValue ?? "");
  }, [externalValue]);
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dirtyRef.current = true;
    setLocalValue(e.target.value);
    clearTimeout(timerRef.current);
    const val = e.target.value;
    timerRef.current = setTimeout(() => {
      dirtyRef.current = false;
      onChange({ target: { value: val } } as React.ChangeEvent<HTMLTextAreaElement>);
    }, delay);
  };
  const handleBlur = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      dirtyRef.current = false;
      onChange({ target: { value: localValue } } as unknown as React.ChangeEvent<HTMLTextAreaElement>);
    }
  };
  useEffect(() => () => clearTimeout(timerRef.current), []);
  return <Textarea {...props} value={localValue} onChange={handleChange} onBlur={handleBlur} />;
}

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
  const { requisicoes, updateStatus } = useRequisicoes();
  const { getProcessoByRequisicao, criarProcesso, addCandidato, updateCandidato, avancarEtapa } =
    useProcessoSeletivo();
  const { temAcessoTotal } = useAuth();
  const { clientes } = useClientes();
  const { funcionarios, addFuncionario } = useFuncionarios();
  const { tem } = usePermissao();
  const podeAddCandidato = tem("processos_seletivos.adicionar_candidato");
  const podeEditar = tem("processos_seletivos.editar");
  const podeAvaliar = tem("processos_seletivos.avaliar_candidato");
  const podeStatusPS = (s: "aprovado" | "neutro" | "reprovado") =>
    tem(`processos_seletivos.status.${s}`);

  const requisicao = requisicoes.find((r) => r.id === requisicaoId);

  // Auto-create processo if it doesn't exist
  let processo = getProcessoByRequisicao(requisicaoId || "");
  if (!processo && requisicaoId && requisicao?.status === "Aprovada") {
    processo = criarProcesso(requisicaoId);
  }

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCandidato, setEditingCandidato] = useState<Candidato | null>(null);
  const [newCandidato, setNewCandidato] = useState({ nome: "", telefone: "", email: "" });
  const [anexos, setAnexos] = useState<AnexoCandidato[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTab, setSelectedTab] = useState<string>("candidatos");

  if (!requisicao || !processo) {
    return (
      <div className="container max-w-full mx-auto px-4 py-8">
        <p className="text-muted-foreground">Requisição não encontrada ou não aprovada.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  const handleAddCandidato = () => {
    if (!podeAddCandidato) { toast.error("Você não possui permissão para esta ação."); return; }
    if (!newCandidato.nome.trim()) {
      toast.error("Informe o nome do candidato.");
      return;
    }
    if (processo!.candidatos.length >= 5) {
      toast.error("Limite de 5 candidatos atingido.");
      return;
    }
    addCandidato(processo!.id, { ...newCandidato, anexos });
    setNewCandidato({ nome: "", telefone: "", email: "" });
    setAnexos([]);
    setShowAddDialog(false);
    toast.success("Candidato adicionado com sucesso.");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`Arquivo "${file.name}" excede 2MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAnexos((prev) => [...prev, { nome: file.name, tipo: file.type, base64: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownloadAnexo = (anexo: AnexoCandidato) => {
    const link = document.createElement("a");
    link.href = anexo.base64;
    link.download = anexo.nome;
    link.click();
  };

  const openEditDialog = (c: Candidato) => {
    setEditingCandidato({ ...c });
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editingCandidato) return;
    Array.from(files).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`Arquivo "${file.name}" excede 2MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setEditingCandidato((prev) =>
          prev ? { ...prev, anexos: [...(prev.anexos || []), { nome: file.name, tipo: file.type, base64: reader.result as string }] } : prev
        );
      };
      reader.readAsDataURL(file);
    });
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const handleSaveEdit = () => {
    if (!editingCandidato) return;
    if (!podeEditar) { toast.error("Você não possui permissão para esta ação."); return; }
    if (!editingCandidato.nome.trim()) {
      toast.error("Informe o nome do candidato.");
      return;
    }
    updateCandidato(processo!.id, editingCandidato.id, {
      nome: editingCandidato.nome,
      email: editingCandidato.email,
      telefone: editingCandidato.telefone,
      anexos: editingCandidato.anexos,
    });
    setEditingCandidato(null);
    toast.success("Candidato atualizado.");
  };

  const handleSalvarParecer = (candidatoId: string, field: string, value: string) => {
    if (!podeAvaliar) { toast.error("Você não possui permissão para esta ação."); return; }
    updateCandidato(processo!.id, candidatoId, { [field]: value });
  };

  const handleAprovarEtapa = async (candidato: Candidato, statusField: string, status: "aprovado" | "neutro" | "reprovado") => {
    if (!podeAvaliar) { toast.error("Você não possui permissão para esta ação."); return; }
    if (!podeStatusPS(status)) { toast.error(`Você não possui permissão para marcar candidato como "${status}".`); return; }
    const updates: Partial<Candidato> = { [statusField]: status };

    if (statusField === "statusLiberacao" && status === "aprovado") {
      updates.liberadoPor = "Usuário Autorizado";
    }

    // Se aprovado ou neutro, avançar etapa na mesma atualização
    if (status === "aprovado" || status === "neutro") {
      const etapas: EtapaCandidato[] = ["entrevista_psicologica", "entrevista_tecnica", "liberacao", "contratacao"];
      const idx = etapas.indexOf(candidato.etapaAtual);
      if (idx < etapas.length - 1) {
        const nextEtapa = etapas[idx + 1];
        updates.etapaAtual = nextEtapa;
        const dateNow = new Date().toLocaleDateString("pt-BR");
        if (nextEtapa === "entrevista_tecnica") updates.dataEntrevistaTecnica = dateNow;
        else if (nextEtapa === "liberacao") updates.dataLiberacao = dateNow;
        else if (nextEtapa === "contratacao") updates.dataContratacao = dateNow;
      }
    }

    await updateCandidato(processo!.id, candidato.id, updates);

    // Mapeamento de etapa para label
    const etapaMap: Record<string, string> = {
      statusPsicologico: "Entrevista Psicológica",
      statusTecnico: "Entrevista Técnica",
      statusLiberacao: "Liberação",
    };
    const etapaLabel = etapaMap[statusField] || statusField;
    const statusLabel = status === "aprovado" ? "aprovado(a)" : status === "reprovado" ? "reprovado(a)" : "avaliado(a) como neutro";

    // Enviar WhatsApp para os telefones do cliente (unidade)
    const cliente = clientes.find((c) => c.nome === requisicao?.unidade);
    if (cliente && cliente.telefones.length > 0) {
      const mensagem = `Processo Seletivo - Cargo: ${requisicao?.cargoNome}. Candidato ${candidato.nome} foi ${statusLabel} na etapa "${etapaLabel}".`;
      for (const tel of cliente.telefones) {
        enviarWhatsApp(tel, mensagem).then((result) => {
          if (result.success) {
            toast.success(`WhatsApp enviado para ${tel}.`);
          } else {
            toast.error(`Falha ao enviar WhatsApp para ${tel}: ${result.error}`);
          }
        });
      }
    }

    // Liberação aprovada: enviar link do portal do candidato via WhatsApp
    if (statusField === "statusLiberacao" && status === "aprovado" && candidato.telefone) {
      const link = `${window.location.origin}/portal-candidato/${processo!.id}/${candidato.id}`;
      const msg =
        `Olá ${candidato.nome}! Você foi aprovado(a) na etapa de Liberação do processo seletivo` +
        (requisicao?.cargoNome ? ` para a vaga de ${requisicao.cargoNome}` : "") +
        `.\n\nPara prosseguir com a contratação, acesse o link abaixo, leia e aceite os termos da LGPD e anexe seus documentos:\n\n${link}\n\nCaso não possua algum documento, marque a opção "Não possuo".`;
      enviarWhatsApp(candidato.telefone, msg).then((r) => {
        if (r.success) toast.success(`Link enviado para o WhatsApp de ${candidato.nome}.`);
        else toast.error(`Falha ao enviar link ao candidato: ${r.error}`);
      });
      updates.portalEnviadoEm = new Date().toISOString();
      await updateCandidato(processo!.id, candidato.id, { portalEnviadoEm: updates.portalEnviadoEm });
    }

    if (status === "aprovado") {
      toast.success(`Candidato ${candidato.nome} aprovado nesta etapa.`);
    } else if (status === "neutro") {
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
      <div className="container max-w-full mx-auto px-4 py-8">
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

        {/* Workflow Timeline */}
        {processo.candidatos.length > 0 && (
          <Card className="mb-6 animate-fade-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Workflow do Processo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Candidato</th>
                      <th className="text-center py-2 px-3 font-medium text-muted-foreground">Ent. Psicológica</th>
                      <th className="text-center py-2 px-3 font-medium text-muted-foreground">Ent. Técnica</th>
                      <th className="text-center py-2 px-3 font-medium text-muted-foreground">Liberação</th>
                      <th className="text-center py-2 pl-3 font-medium text-muted-foreground">Contratação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processo.candidatos.map((c) => {
                      const etapaOrder: EtapaCandidato[] = ["entrevista_psicologica", "entrevista_tecnica", "liberacao", "contratacao"];
                      const currentIdx = etapaOrder.indexOf(c.etapaAtual);
                      const dates = [
                        c.dataEntrevistaPsicologica,
                        c.dataEntrevistaTecnica,
                        c.dataLiberacao,
                        c.dataContratacao,
                      ];
                      // Detecta a etapa onde o candidato foi reprovado (encerra o processo)
                      const reprovadoIdx = etapaOrder.findIndex(et => getEtapaStatus(c, et) === "reprovado");
                      const isEncerrado = reprovadoIdx !== -1;
                      return (
                        <tr key={c.id} className={`border-b last:border-0 ${isEncerrado ? "opacity-90" : ""}`}>
                          <td className="py-2.5 pr-4 font-medium text-foreground whitespace-nowrap">
                            {c.nome}
                            {isEncerrado && (
                              <span className="ml-2 text-[10px] font-semibold text-red-600 uppercase">Reprovado</span>
                            )}
                          </td>
                          {etapaOrder.map((etapa, idx) => {
                            const status = getEtapaStatus(c, etapa);
                            const isReprovadoAqui = status === "reprovado";
                            const isAfterReprovado = isEncerrado && idx > reprovadoIdx;
                            const isCompleted = !isEncerrado && idx < currentIdx;
                            const isCurrent = !isEncerrado && idx === currentIdx;
                            return (
                              <td key={etapa} className="text-center py-2.5 px-3">
                                <div className="flex flex-col items-center gap-1">
                                  <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                                    isReprovadoAqui
                                      ? "bg-red-100 text-red-600 ring-2 ring-red-300"
                                      : isAfterReprovado
                                        ? "bg-red-50 text-red-400"
                                        : isCompleted
                                          ? "bg-emerald-100 text-emerald-600"
                                          : isCurrent
                                            ? "bg-primary/10 text-primary ring-2 ring-primary/30"
                                            : "bg-muted text-muted-foreground"
                                  }`}>
                                    {isReprovadoAqui || isAfterReprovado ? (
                                      <XCircle className="h-3.5 w-3.5" />
                                    ) : isCompleted ? (
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    ) : isCurrent ? (
                                      <Clock className="h-3.5 w-3.5" />
                                    ) : (
                                      <span className="text-[10px] font-medium">{idx + 1}</span>
                                    )}
                                  </div>
                                  {isAfterReprovado ? (
                                    <span className="text-[10px] text-red-400">Encerrado</span>
                                  ) : dates[idx] ? (
                                    <span className="text-[10px] text-muted-foreground">{dates[idx]}</span>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground/40">—</span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="candidatos">Candidatos</TabsTrigger>
            <TabsTrigger value="etapa1">1. Psicológica</TabsTrigger>
            <TabsTrigger value="etapa2">2. Técnica</TabsTrigger>
            <TabsTrigger value="etapa3">3. Liberação</TabsTrigger>
            <TabsTrigger value="etapa4">4. Contratação</TabsTrigger>
          </TabsList>

          {/* TAB: Candidatos */}
          <TabsContent value="candidatos">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-foreground">Lista de Candidatos</h2>
              {podeAddCandidato && processo.candidatos.length < 5 && !processo.candidatos.some((c) => c.etapaAtual === "contratacao" || c.contratacaoFinalizada) && (
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
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{c.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.email} {c.telefone && `· ${c.telefone}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {podeEditar && (<Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditDialog(c)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>)}
                          <Badge variant="outline" className={statusBadge[getEtapaStatus(c, c.etapaAtual)]}>
                            {etapaLabels[c.etapaAtual]}
                          </Badge>
                          {statusIcons[getEtapaStatus(c, c.etapaAtual)]}
                        </div>
                      </div>
                      {c.anexos && c.anexos.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {c.anexos.map((a, i) => (
                            <button
                              key={i}
                              onClick={() => handleDownloadAnexo(a)}
                              className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
                            >
                              <FileText className="h-3 w-3" />
                              <span className="truncate max-w-[120px]">{a.nome}</span>
                            </button>
                          ))}
                        </div>
                      )}
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
                            <DebouncedInput
                              value={c.idade}
                              onChange={(e) => handleSalvarParecer(c.id, "idade", e.target.value)}
                              placeholder="Ex: 28"
                              className="mt-1"
                              disabled={!isCurrentEtapa}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Estado Civil</label>
                            <Select
                              value={c.estadoCivil || ""}
                              onValueChange={(v) => handleSalvarParecer(c.id, "estadoCivil", v)}
                              disabled={!isCurrentEtapa}
                            >
                              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                              <SelectContent>
                                {ESTADO_CIVIL_OPTIONS.map((ec) => <SelectItem key={ec} value={ec}>{ec}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Experiências Anteriores</label>
                          <DebouncedTextarea
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
                          <DebouncedTextarea
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
                              <DebouncedInput
                                value={c.avaliadorTecnico}
                                onChange={(e) => handleSalvarParecer(c.id, "avaliadorTecnico", e.target.value)}
                                placeholder="Nome do avaliador técnico"
                                className="mt-1"
                                disabled={!isCurrentEtapa}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Parecer Técnico</label>
                              <DebouncedTextarea
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
                          {isCurrentEtapa && c.statusLiberacao === "pendente" && (
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
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </TabsContent>

          {/* TAB: Etapa 4 – Contratação */}
          <TabsContent value="etapa4">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Processo de Contratação
            </h2>
            {processo.candidatos.filter((c) => c.etapaAtual === "contratacao").length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum candidato chegou à etapa de contratação.</p>
            ) : (
              <div className="grid gap-6">
                {processo.candidatos
                  .filter((c) => c.etapaAtual === "contratacao")
                  .map((c) => (
                    <Card key={c.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          {c.nome}
                        </CardTitle>
                      </CardHeader>
                        <CardContent className="space-y-6">
                          {c.portalEnviadoEm && (
                            <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs flex items-center justify-between gap-2">
                              <span>📲 Link de envio de documentos enviado ao candidato em {new Date(c.portalEnviadoEm).toLocaleString("pt-BR")}</span>
                              {c.lgpdAceite
                                ? <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">LGPD aceita</Badge>
                                : <Badge variant="outline">Aguardando aceite LGPD</Badge>}
                            </div>
                          )}
                          {/* Checklist de Documentos */}
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-3">📋 Checklist de Documentos</h3>
                          <div className="grid grid-cols-1 gap-2">
                            {(filtrarDocs(c.documentos)).map((doc, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                              >
                                <Checkbox
                                  checked={doc.entregue}
                                  onCheckedChange={(checked) => {
                                    const docs = [...(filtrarDocs(c.documentos))];
                                    docs[idx] = { ...docs[idx], entregue: !!checked };
                                    updateCandidato(processo!.id, c.id, { documentos: docs });
                                  }}
                                />
                                <span className={`flex-1 ${doc.entregue ? "line-through text-muted-foreground" : ""}`}>{doc.nome}</span>
                                {doc.naoPossui && <Badge variant="secondary" className="text-[10px]">Não possui</Badge>}
                                <div className="flex items-center gap-1 shrink-0">
                                  {doc.anexo ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          const link = document.createElement("a");
                                          link.href = doc.anexo!.base64;
                                          link.download = doc.anexo!.nome;
                                          link.click();
                                        }}
                                        className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition-colors"
                                        title={`Baixar ${doc.anexo.nome}`}
                                      >
                                        <FileText className="h-3 w-3" />
                                        <span className="truncate max-w-[80px]">{doc.anexo.nome}</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          const docs = [...(filtrarDocs(c.documentos))];
                                          const { anexo, ...rest } = docs[idx];
                                          docs[idx] = rest as typeof docs[number];
                                          updateCandidato(processo!.id, c.id, { documentos: docs });
                                        }}
                                        className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                                        title="Remover anexo"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <input
                                        type="file"
                                        id={`doc-file-${c.id}-${idx}`}
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          if (file.size > 2 * 1024 * 1024) {
                                            toast.error(`Arquivo "${file.name}" excede 2MB.`);
                                            return;
                                          }
                                          const reader = new FileReader();
                                          reader.onload = () => {
                                            const docs = [...(filtrarDocs(c.documentos))];
                                            docs[idx] = { ...docs[idx], anexo: { nome: file.name, tipo: file.type, base64: reader.result as string } };
                                            updateCandidato(processo!.id, c.id, { documentos: docs });
                                          };
                                          reader.readAsDataURL(file);
                                          e.target.value = "";
                                        }}
                                      />
                                      <button
                                        onClick={() => document.getElementById(`doc-file-${c.id}-${idx}`)?.click()}
                                        className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition-colors"
                                        title="Anexar arquivo"
                                      >
                                        <Paperclip className="h-3 w-3" />
                                        Anexar
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {(c.documentos || []).filter((d) => d.entregue).length} de {(filtrarDocs(c.documentos)).length} documentos entregues
                          </p>
                        </div>

                        {/* Exame Admissional */}
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-3">🏥 Exame Admissional</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Data do Exame</label>
                              <Input
                                type="date"
                                value={c.exameAdmissional?.dataExame || ""}
                                onChange={(e) =>
                                  updateCandidato(processo!.id, c.id, {
                                    exameAdmissional: { ...(c.exameAdmissional || { dataExame: "", resultado: "pendente" as const, observacoes: "" }), dataExame: e.target.value },
                                  })
                                }
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Resultado</label>
                              <select
                                value={c.exameAdmissional?.resultado || "pendente"}
                                onChange={(e) =>
                                  updateCandidato(processo!.id, c.id, {
                                    exameAdmissional: {
                                      ...(c.exameAdmissional || { dataExame: "", resultado: "pendente" as const, observacoes: "" }),
                                      resultado: e.target.value as "pendente" | "apto" | "inapto",
                                    },
                                  })
                                }
                                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                <option value="pendente">Pendente</option>
                                <option value="apto">Apto</option>
                                <option value="inapto">Inapto</option>
                              </select>
                            </div>
                          </div>
                          <div className="mt-3">
                            <label className="text-xs font-medium text-muted-foreground">Observações</label>
                            <Textarea
                              value={c.exameAdmissional?.observacoes || ""}
                              onChange={(e) =>
                                updateCandidato(processo!.id, c.id, {
                                  exameAdmissional: { ...(c.exameAdmissional || { dataExame: "", resultado: "pendente" as const, observacoes: "" }), observacoes: e.target.value },
                                })
                              }
                              placeholder="Observações do exame admissional..."
                              className="mt-1"
                              rows={2}
                            />
                          </div>
                          {c.exameAdmissional?.resultado === "apto" && (
                            <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-md p-2 text-xs text-emerald-800">
                              ✅ Candidato apto no exame admissional
                            </div>
                          )}
                          {c.exameAdmissional?.resultado === "inapto" && (
                            <div className="mt-2 bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-800">
                              ❌ Candidato inapto no exame admissional
                            </div>
                          )}
                          {/* Anexo do Exame */}
                          <div className="mt-3">
                            <label className="text-xs font-medium text-muted-foreground">Anexo do Exame</label>
                            <div className="mt-1 flex items-center gap-2">
                              {c.exameAdmissional?.anexo ? (
                                <>
                                  <button
                                    onClick={() => {
                                      const link = document.createElement("a");
                                      link.href = c.exameAdmissional!.anexo!.base64;
                                      link.download = c.exameAdmissional!.anexo!.nome;
                                      link.click();
                                    }}
                                    className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    <span className="truncate max-w-[150px]">{c.exameAdmissional.anexo.nome}</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      const exame = { ...(c.exameAdmissional || { dataExame: "", resultado: "pendente" as const, observacoes: "" }) };
                                      delete (exame as any).anexo;
                                      updateCandidato(processo!.id, c.id, { exameAdmissional: exame });
                                    }}
                                    className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                                    title="Remover anexo"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <input
                                    type="file"
                                    id={`exame-file-${c.id}`}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      if (file.size > 2 * 1024 * 1024) {
                                        toast.error(`Arquivo "${file.name}" excede 2MB.`);
                                        return;
                                      }
                                      const reader = new FileReader();
                                      reader.onload = () => {
                                        updateCandidato(processo!.id, c.id, {
                                          exameAdmissional: {
                                            ...(c.exameAdmissional || { dataExame: "", resultado: "pendente" as const, observacoes: "" }),
                                            anexo: { nome: file.name, tipo: file.type, base64: reader.result as string },
                                          },
                                        });
                                      };
                                      reader.readAsDataURL(file);
                                      e.target.value = "";
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    onClick={() => document.getElementById(`exame-file-${c.id}`)?.click()}
                                  >
                                    <Paperclip className="h-3.5 w-3.5" /> Anexar exame
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Dados Bancários */}
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-3">🏦 Dados Bancários e Cadastrais</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Banco</label>
                              <Input
                                value={c.dadosBancarios?.banco || ""}
                                onChange={(e) =>
                                  updateCandidato(processo!.id, c.id, {
                                    dadosBancarios: { ...(c.dadosBancarios || { banco: "", agencia: "", conta: "", tipoConta: "", pisPasep: "" }), banco: e.target.value },
                                  })
                                }
                                placeholder="Ex: Bradesco"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Agência</label>
                              <Input
                                value={c.dadosBancarios?.agencia || ""}
                                onChange={(e) =>
                                  updateCandidato(processo!.id, c.id, {
                                    dadosBancarios: { ...(c.dadosBancarios || { banco: "", agencia: "", conta: "", tipoConta: "", pisPasep: "" }), agencia: e.target.value },
                                  })
                                }
                                placeholder="Ex: 1234"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Conta</label>
                              <Input
                                value={c.dadosBancarios?.conta || ""}
                                onChange={(e) =>
                                  updateCandidato(processo!.id, c.id, {
                                    dadosBancarios: { ...(c.dadosBancarios || { banco: "", agencia: "", conta: "", tipoConta: "", pisPasep: "" }), conta: e.target.value },
                                  })
                                }
                                placeholder="Ex: 12345-6"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Tipo de Conta</label>
                              <select
                                value={c.dadosBancarios?.tipoConta || ""}
                                onChange={(e) =>
                                  updateCandidato(processo!.id, c.id, {
                                    dadosBancarios: { ...(c.dadosBancarios || { banco: "", agencia: "", conta: "", tipoConta: "", pisPasep: "" }), tipoConta: e.target.value },
                                  })
                                }
                                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                <option value="">Selecione...</option>
                                <option value="corrente">Corrente</option>
                                <option value="poupanca">Poupança</option>
                                <option value="salario">Salário</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">PIS/PASEP</label>
                              <Input
                                value={c.dadosBancarios?.pisPasep || ""}
                                onChange={(e) =>
                                  updateCandidato(processo!.id, c.id, {
                                    dadosBancarios: { ...(c.dadosBancarios || { banco: "", agencia: "", conta: "", tipoConta: "", pisPasep: "" }), pisPasep: e.target.value },
                                  })
                                }
                                placeholder="Número do PIS/PASEP"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">PIX</label>
                              <Input
                                value={c.dadosBancarios?.pix || ""}
                                onChange={(e) =>
                                  updateCandidato(processo!.id, c.id, {
                                    dadosBancarios: { ...(c.dadosBancarios || { banco: "", agencia: "", conta: "", tipoConta: "", pisPasep: "" }), pix: e.target.value },
                                  })
                                }
                                placeholder="Chave PIX"
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Finalizar Contratação */}
                        <div className="pt-4 border-t">
                          {c.contratacaoFinalizada ? (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 text-sm text-emerald-800 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              Contratação finalizada — funcionário cadastrado com sucesso.
                            </div>
                          ) : (
                            <Button
                              className="w-full bg-[hsl(120,30%,35%)] hover:bg-[hsl(120,30%,28%)] text-white"
                              onClick={() => {
                                // Validações
                                const docsList = filtrarDocs(c.documentos);
                                const docsOk = docsList.filter((d) => d.entregue || d.naoPossui).length;
                                const totalDocs = docsList.length;
                                if (docsOk < totalDocs) {
                                  toast.error("Todos os documentos devem estar entregues ou marcados como 'não possui'.");
                                  return;
                                }
                                if (c.exameAdmissional?.resultado !== "apto") {
                                  toast.error("O candidato precisa estar apto no exame admissional.");
                                  return;
                                }

                                // Recupera dados da requisição/processo seletivo
                                const cargoId = requisicao?.cargoId || requisicao?.cargoNome || "";
                                const salario = requisicao?.salarioVaga || "";
                                // Converte dataContratacao (dd/mm/yyyy) para yyyy-mm-dd
                                const toIsoDate = (br?: string) => {
                                  if (!br) return new Date().toISOString().slice(0, 10);
                                  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                                  return m ? `${m[3]}-${m[2]}-${m[1]}` : new Date().toISOString().slice(0, 10);
                                };
                                const dataAdmissao = toIsoDate(c.dataContratacao);

                                addFuncionario({
                                  ...({} as any),
                                  nome: c.nome,
                                  cargoId,
                                  telefone: c.telefone || "",
                                  email: c.email || "",
                                  cpf: "", rg: "", orgaoEmissor: "", dataNascimento: "", sexo: "",
                                  estadoCivil: "", nacionalidade: "Brasileira", naturalidade: "",
                                  nomeMae: "", nomePai: "", pcd: false, tipoPcd: "",
                                  cep: "", logradouro: "", numero: "", complemento: "",
                                  bairro: "", cidade: "", uf: "",
                                  clienteId: requisicao?.unidade || "", dataAdmissao,
                                  dataDemissao: "", tipoContrato: "CLT", salario,
                                  jornadaTrabalho: requisicao?.jornada || "", ctps: "", serieCtps: "", pis: "",
                                  banco: c.dadosBancarios?.banco || "", agencia: c.dadosBancarios?.agencia || "",
                                  conta: c.dadosBancarios?.conta || "", tipoConta: "Corrente", chavePix: "",
                                  tituloEleitor: "", zonaEleitoral: "", secaoEleitoral: "",
                                  cnh: "", categoriaCnh: "", validadeCnh: "", certificadoReservista: "",
                                  observacoes: "", status: "Ativo" as const,
                                });

                                updateCandidato(processo!.id, c.id, { contratacaoFinalizada: true });
                                // Atualizar status da requisição para Concluída
                                if (requisicaoId) {
                                  updateStatus(requisicaoId, "Concluída");
                                }
                                toast.success(`${c.nome} foi cadastrado como funcionário com sucesso!`);
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Finalizar Contratação
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
              <div>
                <label className="text-xs font-medium text-muted-foreground">Anexos (máx. 2MB cada)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1 w-full gap-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" /> Anexar arquivos
                </Button>
                {anexos.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {anexos.map((a, i) => (
                      <div key={i} className="flex items-center justify-between rounded-md border px-2 py-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[200px]">{a.nome}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => setAnexos((prev) => prev.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
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

        {/* Dialog: Editar Candidato */}
        <Dialog open={!!editingCandidato} onOpenChange={(open) => !open && setEditingCandidato(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Candidato</DialogTitle>
            </DialogHeader>
            {editingCandidato && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nome *</label>
                  <Input
                    value={editingCandidato.nome}
                    onChange={(e) => setEditingCandidato((p) => p ? { ...p, nome: e.target.value } : p)}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">E-mail</label>
                  <Input
                    value={editingCandidato.email}
                    onChange={(e) => setEditingCandidato((p) => p ? { ...p, email: e.target.value } : p)}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Telefone</label>
                  <Input
                    value={editingCandidato.telefone}
                    onChange={(e) => setEditingCandidato((p) => p ? { ...p, telefone: e.target.value } : p)}
                    placeholder="+55 (00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Anexos</label>
                  <input
                    type="file"
                    ref={editFileInputRef}
                    onChange={handleEditFileChange}
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-1 w-full gap-1"
                    onClick={() => editFileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" /> Anexar arquivos
                  </Button>
                  {editingCandidato.anexos && editingCandidato.anexos.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {editingCandidato.anexos.map((a, i) => (
                        <div key={i} className="flex items-center justify-between rounded-md border px-2 py-1.5 text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <FileText className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[200px]">{a.nome}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setEditingCandidato((p) => p ? { ...p, anexos: p.anexos.filter((_, idx) => idx !== i) } : p)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleSaveEdit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProcessoSeletivoPage;
