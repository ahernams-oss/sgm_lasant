import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";

export interface MaterialOS {
  id: string;
  codigo: string;
  descricao: string;
  unidade: string;
  valorUnitario: number;
  quantidade: number;
  valorTotal: number;
}

export interface AnexoOS {
  id: string;
  titulo: string;
  url: string;
}

export interface FotoOS {
  id: string;
  url: string;
}

export interface ProfissionalOS {
  id: string;
  funcionarioId: string;
  nome: string;
  cargo: string;
}

export interface ObservacaoOS {
  id: string;
  descricao: string;
  usuario: string;
  data: string;
}

export interface ObservacaoFiscalizacao {
  id: string;
  titulo: string;
  descricao: string;
  usuario: string;
  data: string;
}

export interface OrdemServico {
  id: string;
  numero: number;
  solicitacaoId: string;
  solicitacaoNumero: number;
  nCliente: string;
  clienteId: string;
  clienteNome: string;
  situacao: string;
  dataInicio: string;
  horaInicio: string;
  dataTermino: string;
  horaTermino: string;
  prioridade: string;
  solicitante: string;
  matricula: string;
  ramal: string;
  telefone: string;
  localId: string;
  localDescricao: string;
  pavimentoId: string;
  pavimentoDescricao: string;
  setorId: string;
  setorDescricao: string;
  categoria: string;
  servico: string;
  descricaoServicos: string;
  ressalvaAprovacao: string;
  descricaoConclusao: string;
  materiais: MaterialOS[];
  materiaisEstoque: MaterialOS[];
  anexos: AnexoOS[];
  fotos: FotoOS[];
  observacoesFiscalizacao: ObservacaoFiscalizacao[];
  bdi: number;
  operadorId: string;
  operadorNome: string;
  createdAt: string;
}

interface OrdensServicoContextType {
  ordens: OrdemServico[];
  addOrdem: (d: any) => Promise<void>;
  updateOrdem: (id: string, d: any) => Promise<void>;
  deleteOrdem: (id: string) => Promise<void>;
  loading: boolean;
}

const OrdensServicoContext = createContext<OrdensServicoContextType | undefined>(undefined);

const rowToOrdem = (r: any): OrdemServico => ({
  id: r.id,
  numero: r.numero ?? 0,
  solicitacaoId: r.solicitacao_id ?? "",
  solicitacaoNumero: r.solicitacao_numero ?? 0,
  nCliente: r.n_cliente ?? "",
  clienteId: r.cliente_id ?? "",
  clienteNome: r.cliente_nome ?? "",
  situacao: r.situacao ?? "Aberta",
  dataInicio: r.data_inicio ?? "",
  horaInicio: r.hora_inicio ?? "",
  dataTermino: r.data_termino ?? "",
  horaTermino: r.hora_termino ?? "",
  prioridade: r.prioridade ?? "C: PROGRAMADA",
  solicitante: r.solicitante ?? "",
  matricula: r.matricula ?? "",
  ramal: r.ramal ?? "",
  telefone: r.telefone ?? "",
  localId: r.local_id ?? "",
  localDescricao: r.local_descricao ?? "",
  pavimentoId: r.pavimento_id ?? "",
  pavimentoDescricao: r.pavimento_descricao ?? "",
  setorId: r.setor_id ?? "",
  setorDescricao: r.setor_descricao ?? "",
  categoria: r.categoria ?? "",
  servico: r.servico ?? "",
  descricaoServicos: r.descricao_servicos ?? "",
  ressalvaAprovacao: r.ressalva_aprovacao ?? "",
  descricaoConclusao: r.descricao_conclusao ?? "",
  materiais: Array.isArray(r.materiais) ? r.materiais : [],
  materiaisEstoque: Array.isArray(r.materiais_estoque) ? r.materiais_estoque : [],
  anexos: Array.isArray(r.anexos) ? r.anexos : [],
  fotos: Array.isArray(r.fotos) ? r.fotos : [],
  observacoesFiscalizacao: Array.isArray(r.observacoes_fiscalizacao) ? r.observacoes_fiscalizacao : [],
  bdi: r.bdi ?? 0,
  operadorId: r.operador_id ?? "",
  operadorNome: r.operador_nome ?? "",
  createdAt: r.created_at ?? "",
});

export function OrdensServicoProvider({ children }: { children: ReactNode }) {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAll("ordens_servico", "numero");
    setOrdens(data.map(rowToOrdem));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addOrdem = async (d: any) => { await insertRow("ordens_servico", d); await load(); };
  const updateOrdem = async (id: string, d: any) => { await updateRow("ordens_servico", id, d); await load(); };
  const deleteOrdem = async (id: string) => { await deleteRow("ordens_servico", id); await load(); };

  return (
    <OrdensServicoContext.Provider value={{ ordens, addOrdem, updateOrdem, deleteOrdem, loading }}>
      {children}
    </OrdensServicoContext.Provider>
  );
}

export function useOrdensServico() {
  const ctx = useContext(OrdensServicoContext);
  if (!ctx) throw new Error("useOrdensServico must be used within OrdensServicoProvider");
  return ctx;
}
