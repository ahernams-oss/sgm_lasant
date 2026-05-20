import { useState, useMemo } from "react";
import { useRequisicoes, Requisicao, StatusHistorico } from "@/contexts/RequisicaoContext";
import { usePermissao } from "@/hooks/usePermissao";
import { useClientes } from "@/contexts/ClientesContext";
import { useCargos } from "@/contexts/CargosContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProcessoSeletivo } from "@/contexts/ProcessoSeletivoContext";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDown, ClipboardCheck, Search, Pencil, History, MoreVertical, CheckCircle2, XCircle, Clock } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { gerarPdfRequisicao } from "@/lib/gerarPdfRequisicao";
import { enviarWhatsApp } from "@/lib/whatsapp";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PaginationControls, { paginate } from "@/components/PaginationControls";

const statusColors: Record<Requisicao["status"], string> = {
  Pendente: "bg-amber-100 text-amber-800 border-amber-200",
  "Em Análise": "bg-blue-100 text-blue-800 border-blue-200",
  Aprovada: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Reprovada: "bg-red-100 text-red-800 border-red-200",
  Suspensa: "bg-orange-100 text-orange-800 border-orange-200",
  "Concluída": "bg-purple-100 text-purple-800 border-purple-200",
};

const statusOptions: Requisicao["status"][] = ["Pendente", "Em Análise", "Aprovada", "Reprovada", "Suspensa", "Concluída"];

const RequisicaoGrid = () => {
  const { requisicoes, updateStatus, updateRequisicao } = useRequisicoes();
  const { clientes } = useClientes();
  const { cargos } = useCargos();
  const { usuarioLogado } = useAuth();
  const { empresa } = useEmpresa();
  const navigate = useNavigate();
  const { processos } = useProcessoSeletivo();
  const { tem } = usePermissao();
  const podeStatusRP = (s: Requisicao["status"]) => {
    const map: Record<Requisicao["status"], string> = {
      "Pendente": "requisicao_colaboradores.status.pendente",
      "Em Análise": "requisicao_colaboradores.status.em_analise",
      "Aprovada": "requisicao_colaboradores.status.aprovada",
      "Reprovada": "requisicao_colaboradores.status.reprovada",
      "Suspensa": "requisicao_colaboradores.status.suspensa",
      "Concluída": "requisicao_colaboradores.status.concluida",
    };
    return tem(map[s] || "");
  };
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterUnidade, setFilterUnidade] = useState<string>("todos");
  const [filterDataDe, setFilterDataDe] = useState<string>("");
  const [filterDataAte, setFilterDataAte] = useState<string>("");
  const [editingReq, setEditingReq] = useState<Requisicao | null>(null);
  const [historicoReq, setHistoricoReq] = useState<Requisicao | null>(null);
  const [reprovandoReq, setReprovandoReq] = useState<Requisicao | null>(null);
  const [justificativaReprovacao, setJustificativaReprovacao] = useState("");
  const [suspendendoReq, setSuspendendoReq] = useState<Requisicao | null>(null);
  const [justificativaSuspensao, setJustificativaSuspensao] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(7);
  const [editForm, setEditForm] = useState({
    unidade: "", cargoId: "", jornada: "", cargaHoraria: "",
    tipoContratacao: [] as string[], internoExterno: "", origemVaga: "", motivoOutros: "",
    matricula: "", nomeSubstituido: "", cargoSubstituido: "",
    salarioSubstituido: "", dataDesligamento: "",
    formacao: [] as string[], formacaoDetalhe: "", experiencia: "",
    conhecimentoInformatica: "", atividadesCargo: "", salarioVaga: "",
  });

  const canEdit = (req: Requisicao) => req.status !== "Aprovada" && req.status !== "Reprovada" && req.status !== "Concluída";

  const isProcessoLiberado = (reqId: string) => {
    const processo = processos.find(p => p.requisicaoId === reqId);
    if (!processo) return false;
    return processo.candidatos.some(c => c.statusLiberacao === "aprovado");
  };

  const openEdit = (req: Requisicao) => {
    setEditForm({
      unidade: req.unidade || "",
      cargoId: req.cargoId || "",
      jornada: req.jornada || "",
      cargaHoraria: req.cargaHoraria || "",
      tipoContratacao: req.tipoContratacao || [],
      internoExterno: req.internoExterno || "",
      origemVaga: req.origemVaga || "",
      motivoOutros: req.motivoOutros || "",
      matricula: req.matricula || "",
      nomeSubstituido: req.nomeSubstituido || "",
      cargoSubstituido: req.cargoSubstituido || "",
      salarioSubstituido: req.salarioSubstituido || "",
      dataDesligamento: req.dataDesligamento || "",
      formacao: req.formacao || [],
      formacaoDetalhe: req.formacaoDetalhe || "",
      experiencia: req.experiencia || "",
      conhecimentoInformatica: req.conhecimentoInformatica || "",
      atividadesCargo: req.atividadesCargo || "",
      salarioVaga: req.salarioVaga || "",
    });
    setEditingReq(req);
  };

  const saveEdit = () => {
    if (!editingReq) return;
    const cargoObj = cargos.find(c => c.id === editForm.cargoId);
    updateRequisicao(editingReq.id, {
      unidade: editForm.unidade,
      cargoId: editForm.cargoId,
      cargoNome: cargoObj ? `${cargoObj.nome}${cargoObj.nivel ? ` — Nível ${cargoObj.nivel}` : ""}` : editingReq.cargoNome,
      jornada: editForm.jornada,
      cargaHoraria: editForm.cargaHoraria,
      tipoContratacao: editForm.tipoContratacao,
      internoExterno: editForm.internoExterno,
      origemVaga: editForm.origemVaga,
      motivoOutros: editForm.motivoOutros,
      matricula: editForm.matricula,
      nomeSubstituido: editForm.nomeSubstituido,
      cargoSubstituido: editForm.cargoSubstituido,
      salarioSubstituido: editForm.salarioSubstituido,
      dataDesligamento: editForm.dataDesligamento,
      formacao: editForm.formacao,
      formacaoDetalhe: editForm.formacaoDetalhe,
      experiencia: editForm.experiencia,
      conhecimentoInformatica: editForm.conhecimentoInformatica,
      atividadesCargo: editForm.atividadesCargo,
      salarioVaga: editForm.salarioVaga,
    });
    toast.success("Requisição atualizada!");
    setEditingReq(null);
  };

  const jornadaOptions = ["Diarista", "Plantão Diurno - PAR", "Plantão Diurno - ÍMPAR", "Plantão Noturno - PAR", "Plantão Noturno - ÍMPAR"];
  const contratacaoOptions = ["Efetivo", "Temporário", "PCD", "Estagiário"];
  const internoExternoOptions = ["Interno", "Externo"];
  const origemOptions = ["Afastamento", "Desligamento", "Aumento de Quadro", "Promoção", "Outros"];
  const formacaoOptions = ["Ensino Fundamental", "Ensino Médio", "Ensino Superior", "Curso Técnico", "Outros"];
  const experienciaOptions = ["Não Necessita", "Até 1 ano", "De 1 a 3 anos", "De 3 a 5 anos", "Acima de 5 anos"];

  const handleStatusChange = (req: Requisicao, newStatus: Requisicao["status"], observacao?: string) => {
    if (!podeStatusRP(newStatus)) {
      toast.error(`Você não possui permissão para alterar a requisição para "${newStatus}".`);
      return;
    }
    const nomeAprovador = (newStatus === "Aprovada" || newStatus === "Reprovada") ? usuarioLogado?.nome : undefined;
    updateStatus(req.id, newStatus, nomeAprovador, observacao);

    // Encontrar o cliente pela unidade e enviar WhatsApp
    const cliente = clientes.find((c) => c.nome === req.unidade);
    if (cliente && cliente.telefones.length > 0) {
      const mensagem = `A requisição de contratação do cargo "${req.cargoNome}" para o "${req.unidade}" encontra-se com status de "${newStatus}".${observacao ? `\n\nJustificativa: ${observacao}` : ""}`;
      for (const tel of cliente.telefones) {
        enviarWhatsApp(tel, mensagem).then((result) => {
          if (result.success) {
            toast.success(`WhatsApp enviado para ${tel}`);
          } else {
            toast.error(`Falha ao enviar WhatsApp para ${tel}: ${result.error}`);
          }
        });
      }
    }
  };

  const confirmarReprovacao = () => {
    if (!reprovandoReq) return;
    const just = justificativaReprovacao.trim();
    if (!just) {
      toast.error("Informe a justificativa da reprovação.");
      return;
    }
    handleStatusChange(reprovandoReq, "Reprovada", just);
    setReprovandoReq(null);
    setJustificativaReprovacao("");
    toast.success("Requisição reprovada.");
  };

  const parseDataBR = (d: string): Date | null => {
    const parts = d.split("/");
    if (parts.length !== 3) return null;
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  };

  const filteredRequisicoes = useMemo(() => {
    let result = requisicoes;
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.cargoNome.toLowerCase().includes(term) ||
          r.unidade.toLowerCase().includes(term) ||
          (r.nomeSubstituido || "").toLowerCase().includes(term) ||
          (r.origemVaga || "").toLowerCase().includes(term) ||
          r.dataCriacao.toLowerCase().includes(term)
      );
    }
    if (filterStatus !== "todos") {
      result = result.filter((r) => r.status === filterStatus);
    }
    if (filterUnidade !== "todos") {
      result = result.filter((r) => r.unidade === filterUnidade);
    }
    if (filterDataDe) {
      const de = new Date(filterDataDe);
      result = result.filter((r) => { const d = parseDataBR(r.dataCriacao); return d && d >= de; });
    }
    if (filterDataAte) {
      const ate = new Date(filterDataAte);
      ate.setHours(23, 59, 59, 999);
      result = result.filter((r) => { const d = parseDataBR(r.dataCriacao); return d && d <= ate; });
    }
    return [...result].sort((a, b) => {
      const da = parseDataBR(a.dataCriacao)?.getTime() ?? 0;
      const db = parseDataBR(b.dataCriacao)?.getTime() ?? 0;
      if (db !== da) return db - da;
      return (b.numero ?? 0) - (a.numero ?? 0);
    });
  }, [requisicoes, search, filterStatus, filterUnidade, filterDataDe, filterDataAte]);

  if (requisicoes.length === 0) {
    return (
      <div className="section-card text-center py-14 text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: "600ms" }}>
        Nenhuma requisição enviada ainda.
      </div>
    );
  }

  return (
    <div className="section-card animate-fade-up overflow-hidden" style={{ animationDelay: "600ms" }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <h2 className="section-title mb-0">Acompanhamento de Requisições</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterUnidade} onValueChange={setFilterUnidade}>
            <SelectTrigger className="h-9 w-[180px] text-xs">
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas Unidades</SelectItem>
              {clientes.filter(c => c.tipo === "Cliente").map((c) => (
                <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={filterDataDe} onChange={(e) => setFilterDataDe(e.target.value)} className="h-9 w-[140px] text-xs" placeholder="De" title="Data inicial" />
          <Input type="date" value={filterDataAte} onChange={(e) => setFilterDataAte(e.target.value)} className="h-9 w-[140px] text-xs" placeholder="Até" title="Data final" />
          <div className="relative w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar requisições..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
        </div>
      </div>
      {filteredRequisicoes.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-10">Nenhum resultado encontrado.</p>
      ) : (
        <div className="overflow-x-auto -mx-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Nº</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Jornada</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Substituído</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Aprovador</TableHead>
                <TableHead className="pr-5">Status</TableHead>
                <TableHead className="pr-5 text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginate(filteredRequisicoes, page, pageSize).paginated.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="pl-5 text-xs font-medium tabular-nums">{req.numero}</TableCell>
                  <TableCell className="text-xs tabular-nums whitespace-nowrap">{req.dataCriacao}</TableCell>
                  <TableCell className="text-sm">{req.unidade}</TableCell>
                  <TableCell className="text-sm font-medium">{req.cargoNome}</TableCell>
                  <TableCell className="text-sm">{req.jornada || "—"}</TableCell>
                  <TableCell className="text-sm">{req.origemVaga || "—"}</TableCell>
                  <TableCell className="text-sm">{req.nomeSubstituido || "—"}</TableCell>
                  <TableCell className="text-sm">{req.solicitante || "—"}</TableCell>
                  <TableCell className="text-sm">{req.aprovadoPor || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${statusColors[req.status]} text-xs font-medium`}>{req.status}</Badge>
                  </TableCell>
                  <TableCell className="pr-5 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => gerarPdfRequisicao(req, empresa)}>
                          <FileDown className="mr-2 h-4 w-4" /> Baixar PDF
                        </DropdownMenuItem>
                        {canEdit(req) && (
                          <DropdownMenuItem onClick={() => openEdit(req)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setHistoricoReq(req)}>
                          <History className="mr-2 h-4 w-4" /> Histórico
                        </DropdownMenuItem>
                        {req.status === "Aprovada" && (
                          <DropdownMenuItem onClick={() => navigate(`/processo-seletivo/${req.id}`)}>
                            <ClipboardCheck className="mr-2 h-4 w-4" /> Processo Seletivo
                          </DropdownMenuItem>
                        )}
                        {!isProcessoLiberado(req.id) && req.status !== "Concluída" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-muted-foreground">Aprovação</DropdownMenuLabel>
                            {req.status !== "Em Análise" && podeStatusRP("Em Análise") && (
                              <DropdownMenuItem onClick={() => handleStatusChange(req, "Em Análise")}>
                                <Clock className="mr-2 h-4 w-4 text-blue-600" /> Marcar Em Análise
                              </DropdownMenuItem>
                            )}
                            {req.status !== "Aprovada" && podeStatusRP("Aprovada") && (
                              <DropdownMenuItem onClick={() => handleStatusChange(req, "Aprovada")}>
                                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" /> Aprovar
                              </DropdownMenuItem>
                            )}
                            {req.status !== "Reprovada" && podeStatusRP("Reprovada") && (
                              <DropdownMenuItem onClick={() => { setReprovandoReq(req); setJustificativaReprovacao(""); }}>
                                <XCircle className="mr-2 h-4 w-4 text-red-600" /> Reprovar
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {filteredRequisicoes.length > 0 && (
        <PaginationControls currentPage={page} totalItems={filteredRequisicoes.length} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      )}

      <Dialog open={!!editingReq} onOpenChange={(open) => !open && setEditingReq(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Requisição #{editingReq?.numero}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Especificação da Vaga */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Especificação da Vaga</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Unidade</label>
                  {clientes.length > 0 ? (
                    <Select value={editForm.unidade} onValueChange={(v) => setEditForm(p => ({ ...p, unidade: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {clientes.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={editForm.unidade} onChange={e => setEditForm(p => ({ ...p, unidade: e.target.value }))} />
                  )}
                </div>
                <div>
                  <label className="field-label">Cargo</label>
                  {cargos.length > 0 ? (
                    <Select value={editForm.cargoId} onValueChange={(v) => {
                      const selected = cargos.find(c => c.id === v);
                      const salarioVigente = selected?.salarios?.length
                        ? [...selected.salarios].sort((a, b) => (b.dataBase || "").localeCompare(a.dataBase || ""))[0]
                        : null;
                      setEditForm(p => ({ ...p, cargoId: v, salarioVaga: salarioVigente?.valor || selected?.salario || p.salarioVaga }));
                    }}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {cargos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}{c.nivel ? ` — Nível ${c.nivel}` : ""}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={editForm.cargoId} onChange={e => setEditForm(p => ({ ...p, cargoId: e.target.value }))} />
                  )}
                </div>
                {editForm.salarioVaga && (
                  <div>
                    <label className="field-label">Salário da Vaga</label>
                    <Input readOnly value={`R$ ${editForm.salarioVaga}`} className="bg-muted/50" />
                  </div>
                )}
              </div>
            </div>

            {/* Jornada */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Jornada de Trabalho</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Jornada</label>
                  <Select value={editForm.jornada} onValueChange={(v) => setEditForm(p => ({ ...p, jornada: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {jornadaOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {editForm.jornada === "Diarista" && (
                  <div>
                    <label className="field-label">Carga Horária</label>
                    <Input value={editForm.cargaHoraria} onChange={e => setEditForm(p => ({ ...p, cargaHoraria: e.target.value }))} placeholder="Ex: 44h semanais" />
                  </div>
                )}
              </div>
            </div>

            {/* Tipo de Contratação */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tipo de Contratação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Modalidade</label>
                  <Select value={editForm.tipoContratacao[0] || ""} onValueChange={(v) => setEditForm(p => ({ ...p, tipoContratacao: [v] }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {contratacaoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="field-label">Recrutamento</label>
                  <Select value={editForm.internoExterno} onValueChange={(v) => setEditForm(p => ({ ...p, internoExterno: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {internoExternoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Origem da Vaga */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Origem da Vaga</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Origem</label>
                  <Select value={editForm.origemVaga} onValueChange={(v) => setEditForm(p => ({ ...p, origemVaga: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {origemOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {editForm.origemVaga === "Outros" && (
                  <div>
                    <label className="field-label">Especifique o motivo</label>
                    <Input value={editForm.motivoOutros} onChange={e => setEditForm(p => ({ ...p, motivoOutros: e.target.value }))} />
                  </div>
                )}
              </div>
            </div>

            {/* Colaborador Substituído */}
            {editForm.origemVaga !== "Aumento de Quadro" && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Colaborador Substituído</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="field-label">Matrícula</label>
                    <Input value={editForm.matricula} onChange={e => setEditForm(p => ({ ...p, matricula: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label">Nome</label>
                    <Input value={editForm.nomeSubstituido} onChange={e => setEditForm(p => ({ ...p, nomeSubstituido: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label">Cargo</label>
                    <Input value={editForm.cargoSubstituido} onChange={e => setEditForm(p => ({ ...p, cargoSubstituido: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label">Salário (R$)</label>
                    <Input value={editForm.salarioSubstituido} onChange={e => setEditForm(p => ({ ...p, salarioSubstituido: e.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label">Data de Desligamento</label>
                    <Input type="date" value={editForm.dataDesligamento} onChange={e => setEditForm(p => ({ ...p, dataDesligamento: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            {/* Qualificação */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Qualificação da Vaga</h3>
              <div className="space-y-4">
                <div>
                  <label className="field-label">Formação Acadêmica</label>
                  <Select value={editForm.formacao[0] || ""} onValueChange={(v) => setEditForm(p => ({ ...p, formacao: [v] }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {formacaoOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {(editForm.formacao.includes("Ensino Superior") || editForm.formacao.includes("Curso Técnico") || editForm.formacao.includes("Outros")) && (
                    <div className="mt-3">
                      <label className="field-label">Especifique</label>
                      <Input value={editForm.formacaoDetalhe} onChange={e => setEditForm(p => ({ ...p, formacaoDetalhe: e.target.value }))} placeholder="Qual formação?" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="field-label">Tempo de Experiência</label>
                  <Select value={editForm.experiencia} onValueChange={(v) => setEditForm(p => ({ ...p, experiencia: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {experienciaOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="field-label">Conhecimento em Informática</label>
                  <Input value={editForm.conhecimentoInformatica} onChange={e => setEditForm(p => ({ ...p, conhecimentoInformatica: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Atividades */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Atividades do Cargo</h3>
              <Textarea rows={4} value={editForm.atividadesCargo} onChange={e => setEditForm(p => ({ ...p, atividadesCargo: e.target.value }))} className="resize-none" />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setEditingReq(null)}>Cancelar</Button>
              <Button onClick={saveEdit}>Salvar Alterações</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historicoReq} onOpenChange={(open) => !open && setHistoricoReq(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Histórico — Requisição #{historicoReq?.numero}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {(!historicoReq?.historicoStatus || historicoReq.historicoStatus.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro de histórico.</p>
            ) : (
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-2.5 top-1 bottom-1 w-px bg-border" />
                {historicoReq.historicoStatus.map((h, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[18px] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                    <div>
                      <Badge variant="outline" className="text-xs font-medium mb-1">
                        {h.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground tabular-nums">{h.dataHora}</p>
                      {h.usuario && <p className="text-xs text-muted-foreground">por {h.usuario}</p>}
                      {h.observacao && <p className="text-xs text-foreground mt-1 italic">"{h.observacao}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reprovandoReq} onOpenChange={(open) => { if (!open) { setReprovandoReq(null); setJustificativaReprovacao(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reprovar Requisição #{reprovandoReq?.numero}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="field-label">Justificativa da reprovação <span className="text-red-600">*</span></label>
            <Textarea
              value={justificativaReprovacao}
              onChange={(e) => setJustificativaReprovacao(e.target.value)}
              placeholder="Descreva o motivo da reprovação..."
              rows={5}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setReprovandoReq(null); setJustificativaReprovacao(""); }}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarReprovacao}>
              <XCircle className="mr-2 h-4 w-4" /> Confirmar Reprovação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequisicaoGrid;
