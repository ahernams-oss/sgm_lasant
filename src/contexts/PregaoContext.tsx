import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";
import { supabase } from "@/integrations/supabase/client";

// ============ TYPES ============

export type PregaoModalidade = "Aberto" | "Aberto-Fechado" | "Fechado";
export type PregaoTipoDisputa = "Item" | "Lote" | "Misto";
export type PregaoStatus =
  | "Rascunho" | "Publicado" | "Credenciamento" | "Propostas"
  | "Disputa" | "Habilitacao" | "Adjudicado" | "Homologado"
  | "Cancelado" | "Encerrado";

export interface Pregao {
  id: string;
  numero: number;
  objeto: string;
  modalidade: PregaoModalidade;
  tipoDisputa: PregaoTipoDisputa;
  valorEstimado: number;
  valorEstimadoSigiloso: boolean;
  decrementoMinimo: number;
  decrementoTipo: "reais" | "percentual";
  tempoDisputaMin: number;
  tempoProrrogacaoMin: number;
  dataPublicacao: string;
  dataAberturaCredenciamento: string;
  dataAberturaPropostas: string;
  dataInicioDisputa: string;
  dataEncerramentoDisputa: string;
  status: PregaoStatus;
  termoParticipacao: string;
  termoHash: string;
  pregoeiroId: string;
  pregoeiroNome: string;
  observacoes: string;
  motivoCancelamento: string;
  resultadoPublico: boolean;
  createdAt: string;
}

export interface PregaoItem {
  id: string;
  pregaoId: string;
  ordem: number;
  agrupamento: "Item" | "Lote";
  loteCodigo: string;
  materialId: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  precoReferencia: number;
  precoReferenciaSigiloso: boolean;
  status: "Aguardando" | "EmDisputa" | "Suspenso" | "Encerrado" | "Fracassado" | "Deserto";
  iniciadoEm: string;
  encerraEm: string;
  encerradoEm: string;
  vencedorParticipanteId: string;
  vencedorValor: number;
  vencedorValorUnitario: number;
  observacoes: string;
}

export interface PregaoDocumentoExigido {
  id: string;
  pregaoId: string;
  nome: string;
  descricao: string;
  obrigatorio: boolean;
  ordem: number;
}

export interface PregaoParticipante {
  id: string;
  pregaoId: string;
  fornecedorId: string;
  fornecedorNome: string;
  fornecedorCnpj: string;
  apelido: string;
  apelidoSeq: number;
  termoAceitoEm: string;
  termoAceitoIp: string;
  termoHash: string;
  status: "Credenciado" | "Desclassificado" | "Inabilitado" | "Habilitado" | "Vencedor" | "Desistente";
  motivoStatus: string;
}

export interface PregaoLance {
  id: string;
  pregaoId: string;
  itemId: string;
  participanteId: string;
  valor: number;
  ts: string;
  cancelado: boolean;
  motivoCancelamento: string;
}

export interface PregaoMensagem {
  id: string;
  pregaoId: string;
  itemId: string | null;
  autorTipo: "pregoeiro" | "participante" | "sistema";
  autorId: string | null;
  autorNomeExibicao: string;
  mensagem: string;
  ts: string;
}

export interface PregaoPropostaInicial {
  id: string;
  pregaoId: string;
  itemId: string;
  participanteId: string;
  valor: number;
  marca: string;
  modelo: string;
  observacoes: string;
  enviadaEm: string;
}

// ============ MAPPERS ============

const rowToPregao = (r: any): Pregao => ({
  id: r.id,
  numero: r.numero ?? 0,
  objeto: r.objeto ?? "",
  modalidade: r.modalidade ?? "Aberto",
  tipoDisputa: r.tipo_disputa ?? "Item",
  valorEstimado: Number(r.valor_estimado ?? 0),
  valorEstimadoSigiloso: r.valor_estimado_sigiloso ?? true,
  decrementoMinimo: Number(r.decremento_minimo ?? 0),
  decrementoTipo: r.decremento_tipo ?? "reais",
  tempoDisputaMin: r.tempo_disputa_min ?? 10,
  tempoProrrogacaoMin: r.tempo_prorrogacao_min ?? 2,
  dataPublicacao: r.data_publicacao ?? "",
  dataAberturaCredenciamento: r.data_abertura_credenciamento ?? "",
  dataAberturaPropostas: r.data_abertura_propostas ?? "",
  dataInicioDisputa: r.data_inicio_disputa ?? "",
  dataEncerramentoDisputa: r.data_encerramento_disputa ?? "",
  status: r.status ?? "Rascunho",
  termoParticipacao: r.termo_participacao ?? "",
  termoHash: r.termo_hash ?? "",
  pregoeiroId: r.pregoeiro_id ?? "",
  pregoeiroNome: r.pregoeiro_nome ?? "",
  observacoes: r.observacoes ?? "",
  motivoCancelamento: r.motivo_cancelamento ?? "",
  resultadoPublico: r.resultado_publico ?? false,
  createdAt: r.created_at ?? "",
});

const pregaoToRow = (p: Omit<Pregao, "id" | "numero" | "createdAt">) => ({
  objeto: p.objeto,
  modalidade: p.modalidade,
  tipo_disputa: p.tipoDisputa,
  valor_estimado: p.valorEstimado,
  valor_estimado_sigiloso: p.valorEstimadoSigiloso,
  decremento_minimo: p.decrementoMinimo,
  decremento_tipo: p.decrementoTipo,
  tempo_disputa_min: p.tempoDisputaMin,
  tempo_prorrogacao_min: p.tempoProrrogacaoMin,
  data_publicacao: p.dataPublicacao || null,
  data_abertura_credenciamento: p.dataAberturaCredenciamento || null,
  data_abertura_propostas: p.dataAberturaPropostas || null,
  data_inicio_disputa: p.dataInicioDisputa || null,
  data_encerramento_disputa: p.dataEncerramentoDisputa || null,
  status: p.status,
  termo_participacao: p.termoParticipacao,
  termo_hash: p.termoHash,
  pregoeiro_id: p.pregoeiroId || null,
  pregoeiro_nome: p.pregoeiroNome,
  observacoes: p.observacoes,
  motivo_cancelamento: p.motivoCancelamento || null,
  resultado_publico: p.resultadoPublico,
});

const rowToItem = (r: any): PregaoItem => ({
  id: r.id,
  pregaoId: r.pregao_id,
  ordem: r.ordem ?? 1,
  agrupamento: r.agrupamento ?? "Item",
  loteCodigo: r.lote_codigo ?? "",
  materialId: r.material_id ?? "",
  descricao: r.descricao ?? "",
  unidade: r.unidade ?? "UN",
  quantidade: Number(r.quantidade ?? 1),
  precoReferencia: Number(r.preco_referencia ?? 0),
  precoReferenciaSigiloso: r.preco_referencia_sigiloso ?? true,
  status: r.status ?? "Aguardando",
  iniciadoEm: r.iniciado_em ?? "",
  encerraEm: r.encerra_em ?? "",
  encerradoEm: r.encerrado_em ?? "",
  vencedorParticipanteId: r.vencedor_participante_id ?? "",
  vencedorValor: Number(r.vencedor_valor ?? 0),
  vencedorValorUnitario: Number(r.vencedor_valor_unitario ?? 0),
  observacoes: r.observacoes ?? "",
});

const itemToRow = (i: Omit<PregaoItem, "id">) => ({
  pregao_id: i.pregaoId,
  ordem: i.ordem,
  agrupamento: i.agrupamento,
  lote_codigo: i.loteCodigo || null,
  material_id: i.materialId || null,
  descricao: i.descricao,
  unidade: i.unidade,
  quantidade: i.quantidade,
  preco_referencia: i.precoReferencia,
  preco_referencia_sigiloso: i.precoReferenciaSigiloso,
  status: i.status,
  observacoes: i.observacoes,
});

const rowToDoc = (r: any): PregaoDocumentoExigido => ({
  id: r.id,
  pregaoId: r.pregao_id,
  nome: r.nome ?? "",
  descricao: r.descricao ?? "",
  obrigatorio: r.obrigatorio ?? true,
  ordem: r.ordem ?? 1,
});

const docToRow = (d: Omit<PregaoDocumentoExigido, "id">) => ({
  pregao_id: d.pregaoId,
  nome: d.nome,
  descricao: d.descricao,
  obrigatorio: d.obrigatorio,
  ordem: d.ordem,
});

const rowToPart = (r: any): PregaoParticipante => ({
  id: r.id,
  pregaoId: r.pregao_id,
  fornecedorId: r.fornecedor_id,
  fornecedorNome: r.fornecedor_nome ?? "",
  fornecedorCnpj: r.fornecedor_cnpj ?? "",
  apelido: r.apelido ?? "",
  apelidoSeq: r.apelido_seq ?? 0,
  termoAceitoEm: r.termo_aceito_em ?? "",
  termoAceitoIp: r.termo_aceito_ip ?? "",
  termoHash: r.termo_hash ?? "",
  status: r.status ?? "Credenciado",
  motivoStatus: r.motivo_status ?? "",
});

// ============ HASH ============
async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

const rowToLance = (r: any): PregaoLance => ({
  id: r.id, pregaoId: r.pregao_id, itemId: r.item_id,
  participanteId: r.participante_id, valor: Number(r.valor ?? 0),
  ts: r.ts ?? "", cancelado: r.cancelado ?? false,
  motivoCancelamento: r.motivo_cancelamento ?? "",
});
const rowToMsg = (r: any): PregaoMensagem => ({
  id: r.id, pregaoId: r.pregao_id, itemId: r.item_id ?? null,
  autorTipo: r.autor_tipo ?? "sistema", autorId: r.autor_id ?? null,
  autorNomeExibicao: r.autor_nome_exibicao ?? "",
  mensagem: r.mensagem ?? "", ts: r.ts ?? "",
});
const rowToPropIni = (r: any): PregaoPropostaInicial => ({
  id: r.id, pregaoId: r.pregao_id, itemId: r.item_id,
  participanteId: r.participante_id, valor: Number(r.valor ?? 0),
  marca: r.marca ?? "", modelo: r.modelo ?? "",
  observacoes: r.observacoes ?? "", enviadaEm: r.enviada_em ?? "",
});

// ============ CONTEXT ============

interface PregaoContextType {
  pregoes: Pregao[];
  itens: PregaoItem[];
  documentos: PregaoDocumentoExigido[];
  participantes: PregaoParticipante[];
  lances: PregaoLance[];
  mensagens: PregaoMensagem[];
  propostasIniciais: PregaoPropostaInicial[];
  loading: boolean;
  reload: () => Promise<void>;
  loadDisputa: (pregaoId: string) => Promise<void>;
  // Pregão
  addPregao: (data: Omit<Pregao, "id" | "numero" | "createdAt">) => Promise<Pregao | null>;
  updatePregao: (id: string, data: Omit<Pregao, "id" | "numero" | "createdAt">) => Promise<boolean>;
  deletePregao: (id: string) => Promise<boolean>;
  publicarPregao: (id: string) => Promise<boolean>;
  cancelarPregao: (id: string, motivo: string) => Promise<boolean>;
  abrirDisputa: (id: string) => Promise<boolean>;
  encerrarDisputa: (id: string) => Promise<boolean>;
  publicarResultado: (id: string) => Promise<boolean>;
  // Itens
  addItem: (data: Omit<PregaoItem, "id">) => Promise<PregaoItem | null>;
  updateItem: (id: string, data: Omit<PregaoItem, "id">) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  iniciarItem: (itemId: string, duracaoMin?: number) => Promise<boolean>;
  encerrarItem: (itemId: string) => Promise<boolean>;
  prorrogarItem: (itemId: string, minutos: number) => Promise<boolean>;
  // Documentos exigidos
  addDocumento: (data: Omit<PregaoDocumentoExigido, "id">) => Promise<PregaoDocumentoExigido | null>;
  updateDocumento: (id: string, data: Omit<PregaoDocumentoExigido, "id">) => Promise<boolean>;
  deleteDocumento: (id: string) => Promise<boolean>;
  // Credenciamento
  credenciarFornecedor: (pregaoId: string, fornecedor: { id: string; nome: string; cnpj: string }, ip?: string) => Promise<PregaoParticipante | null>;
  hashTermo: (texto: string) => Promise<string>;
  // Disputa
  enviarLance: (pregaoId: string, itemId: string, participanteId: string, valor: number) => Promise<boolean>;
  enviarMensagem: (pregaoId: string, autorTipo: "pregoeiro" | "participante" | "sistema", autorNome: string, mensagem: string, itemId?: string) => Promise<boolean>;
  cancelarLance: (lanceId: string, motivo: string) => Promise<boolean>;
}

const PregaoContext = createContext<PregaoContextType | undefined>(undefined);

export function PregaoProvider({ children }: { children: ReactNode }) {
  const [pregoes, setPregoes] = useState<Pregao[]>([]);
  const [itens, setItens] = useState<PregaoItem[]>([]);
  const [documentos, setDocumentos] = useState<PregaoDocumentoExigido[]>([]);
  const [participantes, setParticipantes] = useState<PregaoParticipante[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [pp, ii, dd, pt] = await Promise.all([
      fetchAll("pregoes", "created_at"),
      fetchAll("pregao_itens", "ordem"),
      fetchAll("pregao_documentos_exigidos", "ordem"),
      fetchAll("pregao_participantes", "created_at"),
    ]);
    setPregoes(pp.map(rowToPregao));
    setItens(ii.map(rowToItem));
    setDocumentos(dd.map(rowToDoc));
    setParticipantes(pt.map(rowToPart));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addPregao = async (data: Omit<Pregao, "id" | "numero" | "createdAt">) => {
    const hash = data.termoParticipacao ? await sha256(data.termoParticipacao) : "";
    const row = await insertRow("pregoes", { ...pregaoToRow(data), termo_hash: hash });
    if (row) { await load(); return rowToPregao(row); }
    return null;
  };

  const updatePregao = async (id: string, data: Omit<Pregao, "id" | "numero" | "createdAt">) => {
    const hash = data.termoParticipacao ? await sha256(data.termoParticipacao) : "";
    const ok = await updateRow("pregoes", id, { ...pregaoToRow(data), termo_hash: hash });
    if (ok) await load();
    return ok;
  };

  const deletePregao = async (id: string) => {
    const p = pregoes.find(x => x.id === id);
    if (p && p.status !== "Rascunho") return false;
    const ok = await deleteRow("pregoes", id);
    if (ok) await load();
    return ok;
  };

  const publicarPregao = async (id: string) => {
    const ok = await updateRow("pregoes", id, {
      status: "Publicado",
      data_publicacao: new Date().toISOString(),
    });
    if (ok) await load();
    return ok;
  };

  const cancelarPregao = async (id: string, motivo: string) => {
    const ok = await updateRow("pregoes", id, { status: "Cancelado", motivo_cancelamento: motivo });
    if (ok) await load();
    return ok;
  };

  const addItem = async (data: Omit<PregaoItem, "id">) => {
    const row = await insertRow("pregao_itens", itemToRow(data));
    if (row) { await load(); return rowToItem(row); }
    return null;
  };
  const updateItem = async (id: string, data: Omit<PregaoItem, "id">) => {
    const ok = await updateRow("pregao_itens", id, itemToRow(data));
    if (ok) await load();
    return ok;
  };
  const deleteItem = async (id: string) => {
    const ok = await deleteRow("pregao_itens", id);
    if (ok) await load();
    return ok;
  };

  const addDocumento = async (data: Omit<PregaoDocumentoExigido, "id">) => {
    const row = await insertRow("pregao_documentos_exigidos", docToRow(data));
    if (row) { await load(); return rowToDoc(row); }
    return null;
  };
  const updateDocumento = async (id: string, data: Omit<PregaoDocumentoExigido, "id">) => {
    const ok = await updateRow("pregao_documentos_exigidos", id, docToRow(data));
    if (ok) await load();
    return ok;
  };
  const deleteDocumento = async (id: string) => {
    const ok = await deleteRow("pregao_documentos_exigidos", id);
    if (ok) await load();
    return ok;
  };

  const credenciarFornecedor = async (
    pregaoId: string,
    fornecedor: { id: string; nome: string; cnpj: string },
    ip?: string
  ) => {
    const pregao = pregoes.find(p => p.id === pregaoId);
    if (!pregao) return null;
    const seq = participantes.filter(p => p.pregaoId === pregaoId).length + 1;
    const apelido = `Licitante ${String(seq).padStart(2, "0")}`;
    const hash = await sha256(pregao.termoParticipacao || "");
    const row = await insertRow("pregao_participantes", {
      pregao_id: pregaoId,
      fornecedor_id: fornecedor.id,
      fornecedor_nome: fornecedor.nome,
      fornecedor_cnpj: fornecedor.cnpj,
      apelido,
      apelido_seq: seq,
      termo_aceito_em: new Date().toISOString(),
      termo_aceito_ip: ip ?? "",
      termo_hash: hash,
      status: "Credenciado",
    });
    if (row) { await load(); return rowToPart(row); }
    return null;
  };

  return (
    <PregaoContext.Provider value={{
      pregoes, itens, documentos, participantes, loading, reload: load,
      addPregao, updatePregao, deletePregao, publicarPregao, cancelarPregao,
      addItem, updateItem, deleteItem,
      addDocumento, updateDocumento, deleteDocumento,
      credenciarFornecedor, hashTermo: sha256,
    }}>
      {children}
    </PregaoContext.Provider>
  );
}

export function usePregao() {
  const ctx = useContext(PregaoContext);
  if (!ctx) throw new Error("usePregao must be used within PregaoProvider");
  return ctx;
}
