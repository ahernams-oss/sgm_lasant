import { useState, useMemo } from "react";
import { useRequisicoes, Requisicao } from "@/contexts/RequisicaoContext";
import { useClientes } from "@/contexts/ClientesContext";
import { useCargos } from "@/contexts/CargosContext";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDown, ClipboardCheck, Search, Pencil } from "lucide-react";
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

const statusColors: Record<Requisicao["status"], string> = {
  Pendente: "bg-amber-100 text-amber-800 border-amber-200",
  "Em Análise": "bg-blue-100 text-blue-800 border-blue-200",
  Aprovada: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Reprovada: "bg-red-100 text-red-800 border-red-200",
  "Concluída": "bg-purple-100 text-purple-800 border-purple-200",
};

const statusOptions: Requisicao["status"][] = ["Pendente", "Em Análise", "Aprovada", "Reprovada"];

const RequisicaoGrid = () => {
  const { requisicoes, updateStatus, updateRequisicao } = useRequisicoes();
  const { clientes } = useClientes();
  const { cargos } = useCargos();
  const { usuarioLogado } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [editingReq, setEditingReq] = useState<Requisicao | null>(null);
  const [editForm, setEditForm] = useState({
    unidade: "", cargoId: "", jornada: "", cargaHoraria: "",
    tipoContratacao: [] as string[], internoExterno: "", origemVaga: "", motivoOutros: "",
    matricula: "", nomeSubstituido: "", cargoSubstituido: "",
    salarioSubstituido: "", dataDesligamento: "",
    formacao: [] as string[], formacaoDetalhe: "", experiencia: "",
    conhecimentoInformatica: "", atividadesCargo: "", salarioVaga: "",
  });

  const canEdit = (req: Requisicao) => req.status !== "Aprovada" && req.status !== "Reprovada" && req.status !== "Concluída";

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

  const handleStatusChange = (req: Requisicao, newStatus: Requisicao["status"]) => {
    const nomeAprovador = (newStatus === "Aprovada" || newStatus === "Reprovada") ? usuarioLogado?.nome : undefined;
    updateStatus(req.id, newStatus, nomeAprovador);

    // Encontrar o cliente pela unidade e enviar WhatsApp
    const cliente = clientes.find((c) => c.nome === req.unidade);
    if (cliente && cliente.telefones.length > 0) {
      const mensagem = `A requisição de contratação do cargo "${req.cargoNome}" para o "${req.unidade}" encontra-se com status de "${newStatus}".`;
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
    return result;
  }, [requisicoes, search, filterStatus]);

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
        <div className="flex items-center gap-2">
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
                <TableHead>Aprovador</TableHead>
                <TableHead className="pr-5">Status</TableHead>
                <TableHead className="text-center">PDF</TableHead>
                <TableHead className="text-center">Editar</TableHead>
                <TableHead className="pr-5 text-center">Seletivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequisicoes.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="pl-5 text-xs font-medium tabular-nums">{req.numero}</TableCell>
                  <TableCell className="text-xs tabular-nums whitespace-nowrap">{req.dataCriacao}</TableCell>
                  <TableCell className="text-sm">{req.unidade}</TableCell>
                  <TableCell className="text-sm font-medium">{req.cargoNome}</TableCell>
                  <TableCell className="text-sm">{req.jornada || "—"}</TableCell>
                  <TableCell className="text-sm">{req.origemVaga || "—"}</TableCell>
                  <TableCell className="text-sm">{req.nomeSubstituido || "—"}</TableCell>
                  <TableCell className="text-sm">{req.aprovadoPor || "—"}</TableCell>
                  <TableCell className="pr-5">
                    <Select value={req.status} onValueChange={(v) => handleStatusChange(req, v as Requisicao["status"])}>
                      <SelectTrigger className="h-7 w-[130px] text-xs border-0 p-0 focus:ring-0">
                        <Badge variant="outline" className={`${statusColors[req.status]} text-xs font-medium`}>{req.status}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary" title="Baixar PDF" onClick={() => gerarPdfRequisicao(req)}>
                      <FileDown className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">
                    {canEdit(req) && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary" title="Editar Requisição" onClick={() => openEdit(req)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="pr-5 text-center">
                    {req.status === "Aprovada" && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary" title="Processo Seletivo" onClick={() => navigate(`/processo-seletivo/${req.id}`)}>
                        <ClipboardCheck className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!editingReq} onOpenChange={(open) => !open && setEditingReq(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Requisição #{editingReq?.numero}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4">
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
                <Select value={editForm.cargoId} onValueChange={(v) => setEditForm(p => ({ ...p, cargoId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {cargos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}{c.nivel ? ` — Nível ${c.nivel}` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={editForm.cargoId} onChange={e => setEditForm(p => ({ ...p, cargoId: e.target.value }))} />
              )}
            </div>
            <div>
              <label className="field-label">Jornada</label>
              <Input value={editForm.jornada} onChange={e => setEditForm(p => ({ ...p, jornada: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Origem da Vaga</label>
              <Input value={editForm.origemVaga} onChange={e => setEditForm(p => ({ ...p, origemVaga: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Nome do Substituído</label>
              <Input value={editForm.nomeSubstituido} onChange={e => setEditForm(p => ({ ...p, nomeSubstituido: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingReq(null)}>Cancelar</Button>
              <Button onClick={saveEdit}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequisicaoGrid;
