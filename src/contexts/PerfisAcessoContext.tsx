import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";

export interface PermissaoModulo {
  key: string;
  label: string;
}

export interface GrupoPermissao {
  grupo: string;
  modulos: {
    key: string;
    label: string;
    acoes?: PermissaoModulo[];
    statusTransicoes?: PermissaoModulo[];
    flags?: PermissaoModulo[];
  }[];
}

export const MODULOS_SISTEMA: GrupoPermissao[] = [
  {
    grupo: "Gestão de Pessoas",
    modulos: [
      {
        key: "dashboard_gp",
        label: "Dashboard",
        acoes: [
          { key: "dashboard_gp.visualizar", label: "Visualizar dashboard" },
          { key: "dashboard_gp.exportar_pdf", label: "Exportar PDF" },
        ],
      },
      {
        key: "requisicao_colaboradores",
        label: "Requisição de Colaboradores",
        acoes: [
          { key: "requisicao_colaboradores.criar", label: "Criar requisição" },
          { key: "requisicao_colaboradores.editar", label: "Editar requisição" },
          { key: "requisicao_colaboradores.excluir", label: "Excluir requisição" },
          { key: "requisicao_colaboradores.exportar_pdf", label: "Exportar PDF" },
        ],
        statusTransicoes: [
          { key: "requisicao_colaboradores.status.pendente", label: "Pendente" },
          { key: "requisicao_colaboradores.status.em_analise", label: "Em Análise" },
          { key: "requisicao_colaboradores.status.aprovada", label: "Aprovada" },
          { key: "requisicao_colaboradores.status.reprovada", label: "Reprovada" },
          { key: "requisicao_colaboradores.status.concluida", label: "Concluída" },
        ],
      },
      {
        key: "processos_seletivos",
        label: "Processos Seletivos",
        acoes: [
          { key: "processos_seletivos.criar", label: "Iniciar processo seletivo" },
          { key: "processos_seletivos.editar", label: "Editar processo" },
          { key: "processos_seletivos.adicionar_candidato", label: "Adicionar candidato" },
          { key: "processos_seletivos.avaliar_candidato", label: "Avaliar candidato" },
        ],
        statusTransicoes: [
          { key: "processos_seletivos.status.pendente", label: "Pendente" },
          { key: "processos_seletivos.status.aprovado", label: "Aprovado" },
          { key: "processos_seletivos.status.reprovado", label: "Reprovado" },
          { key: "processos_seletivos.status.neutro", label: "Neutro" },
        ],
        flags: [
          { key: "processos_seletivos.flag.entrevista_psicologica", label: "Entrevista Psicológica" },
          { key: "processos_seletivos.flag.entrevista_tecnica", label: "Entrevista Técnica" },
          { key: "processos_seletivos.flag.liberacao", label: "Liberação" },
          { key: "processos_seletivos.flag.contratacao", label: "Contratação" },
        ],
      },
      {
        key: "funcionarios",
        label: "Funcionários",
        acoes: [
          { key: "funcionarios.criar", label: "Cadastrar funcionário" },
          { key: "funcionarios.editar", label: "Editar funcionário" },
          { key: "funcionarios.excluir", label: "Excluir funcionário" },
          { key: "funcionarios.exportar_pdf", label: "Exportar PDF" },
          { key: "funcionarios.gerenciar_epis", label: "Gerenciar EPIs" },
          { key: "funcionarios.gerenciar_nrs", label: "Gerenciar NRs" },
          { key: "funcionarios.gerenciar_lancamentos", label: "Gerenciar lançamentos" },
          { key: "funcionarios.gerenciar_exames", label: "Gerenciar exames periódicos" },
          { key: "funcionarios.gerenciar_promocoes", label: "Gerenciar promoções" },
        ],
        statusTransicoes: [
          { key: "funcionarios.status.ativo", label: "Ativo" },
          { key: "funcionarios.status.inativo", label: "Inativo" },
          { key: "funcionarios.status.ferias", label: "Férias" },
          { key: "funcionarios.status.afastado", label: "Afastado" },
        ],
        flags: [
          { key: "funcionarios.flag.pcd", label: "PCD" },
          { key: "funcionarios.flag.dependentes", label: "Dependentes" },
          { key: "funcionarios.flag.passagens", label: "Passagens" },
        ],
      },
      {
        key: "mapa_funcionarios",
        label: "Mapa de Funcionários",
        acoes: [
          { key: "mapa_funcionarios.visualizar", label: "Visualizar mapa" },
          { key: "mapa_funcionarios.exportar_pdf", label: "Exportar PDF" },
          { key: "mapa_funcionarios.exportar_excel", label: "Exportar Excel" },
        ],
      },
    ],
  },
  {
    grupo: "Compras e Suprimentos",
    modulos: [
      {
        key: "dashboard_compras",
        label: "Dashboard Compras",
        acoes: [
          { key: "dashboard_compras.visualizar", label: "Visualizar dashboard" },
        ],
      },
      {
        key: "requisicoes_compras",
        label: "Requisições de Compras",
        acoes: [
          { key: "requisicoes_compras.criar", label: "Criar requisição" },
          { key: "requisicoes_compras.editar", label: "Editar requisição" },
          { key: "requisicoes_compras.excluir", label: "Excluir requisição" },
          { key: "requisicoes_compras.anexar", label: "Gerenciar anexos" },
        ],
        statusTransicoes: [
          { key: "requisicoes_compras.status.rascunho", label: "Rascunho" },
          { key: "requisicoes_compras.status.enviada", label: "Enviada" },
          { key: "requisicoes_compras.status.em_cotacao", label: "Em Cotação" },
          { key: "requisicoes_compras.status.aguardando_aprovacao", label: "Aguardando Aprovação" },
          { key: "requisicoes_compras.status.aprovada", label: "Aprovada" },
          { key: "requisicoes_compras.status.reprovada", label: "Reprovada" },
          { key: "requisicoes_compras.status.pedido_emitido", label: "Pedido Emitido" },
          { key: "requisicoes_compras.status.em_entrega", label: "Em Entrega" },
          { key: "requisicoes_compras.status.recebida_parcial", label: "Recebida Parcial" },
          { key: "requisicoes_compras.status.recebida", label: "Recebida" },
          { key: "requisicoes_compras.status.concluida", label: "Concluída" },
          { key: "requisicoes_compras.status.cancelada", label: "Cancelada" },
        ],
        flags: [
          { key: "requisicoes_compras.flag.urgencia_alta", label: "Urgência Alta" },
          { key: "requisicoes_compras.flag.urgencia_urgente", label: "Urgência Urgente" },
        ],
      },
      {
        key: "cotacoes",
        label: "Cotações",
        acoes: [
          { key: "cotacoes.criar", label: "Criar cotação" },
          { key: "cotacoes.editar", label: "Editar cotação" },
          { key: "cotacoes.adicionar_proposta", label: "Adicionar proposta" },
          { key: "cotacoes.editar_proposta", label: "Editar proposta" },
          { key: "cotacoes.remover_proposta", label: "Remover proposta" },
          { key: "cotacoes.finalizar", label: "Finalizar cotação" },
          { key: "cotacoes.enviar_convite", label: "Enviar convite a fornecedor" },
        ],
        statusTransicoes: [
          { key: "cotacoes.status.em_andamento", label: "Em Andamento" },
          { key: "cotacoes.status.aguardando_aprovacao", label: "Aguardando Aprovação" },
          { key: "cotacoes.status.finalizada", label: "Finalizada" },
          { key: "cotacoes.status.cancelada", label: "Cancelada" },
        ],
      },
      {
        key: "pedidos_compra",
        label: "Pedidos de Compra",
        acoes: [
          { key: "pedidos_compra.criar", label: "Criar pedido" },
          { key: "pedidos_compra.editar", label: "Editar pedido" },
          { key: "pedidos_compra.cancelar", label: "Cancelar pedido" },
        ],
        statusTransicoes: [
          { key: "pedidos_compra.status.emitido", label: "Emitido" },
          { key: "pedidos_compra.status.comprado", label: "Comprado" },
          { key: "pedidos_compra.status.em_entrega", label: "Em Entrega" },
          { key: "pedidos_compra.status.entregue_parcial", label: "Entregue Parcial" },
          { key: "pedidos_compra.status.entregue", label: "Entregue" },
          { key: "pedidos_compra.status.cancelado", label: "Cancelado" },
        ],
      },
      {
        key: "recebimento",
        label: "Recebimento",
        acoes: [
          { key: "recebimento.registrar", label: "Registrar recebimento" },
          { key: "recebimento.anexar_nf", label: "Anexar nota fiscal" },
        ],
        flags: [
          { key: "recebimento.flag.total", label: "Recebimento Total" },
          { key: "recebimento.flag.parcial", label: "Recebimento Parcial" },
        ],
      },
      {
        key: "estoque",
        label: "Estoque",
        acoes: [
          { key: "estoque.registrar_entrada", label: "Registrar entrada" },
          { key: "estoque.registrar_saida", label: "Registrar saída" },
          { key: "estoque.registrar_ajuste", label: "Registrar ajuste" },
          { key: "estoque.criar_inventario", label: "Criar inventário" },
          { key: "estoque.finalizar_inventario", label: "Finalizar inventário" },
        ],
        flags: [
          { key: "estoque.flag.alerta_minimo", label: "Ver alertas de estoque mínimo" },
        ],
      },
      {
        key: "categorias_compras",
        label: "Categorias de Compras",
        acoes: [
          { key: "categorias_compras.criar", label: "Criar categoria" },
          { key: "categorias_compras.editar", label: "Editar categoria" },
          { key: "categorias_compras.excluir", label: "Excluir categoria" },
        ],
      },
      {
        key: "materiais_servicos",
        label: "Materiais e Serviços",
        acoes: [
          { key: "materiais_servicos.criar", label: "Cadastrar material/serviço" },
          { key: "materiais_servicos.editar", label: "Editar material/serviço" },
          { key: "materiais_servicos.excluir", label: "Excluir material/serviço" },
          { key: "materiais_servicos.exportar", label: "Exportar relatório" },
        ],
      },
      {
        key: "fabricantes",
        label: "Fabricantes",
        acoes: [
          { key: "fabricantes.criar", label: "Cadastrar fabricante" },
          { key: "fabricantes.editar", label: "Editar fabricante" },
          { key: "fabricantes.excluir", label: "Excluir fabricante" },
        ],
      },
    ],
  },
  {
    grupo: "Cadastros",
    modulos: [
      {
        key: "clientes",
        label: "Clientes",
        acoes: [
          { key: "clientes.criar", label: "Cadastrar cliente" },
          { key: "clientes.editar", label: "Editar cliente" },
          { key: "clientes.excluir", label: "Excluir cliente" },
          { key: "clientes.gerenciar_locais", label: "Gerenciar locais" },
          { key: "clientes.gerenciar_contratos", label: "Gerenciar contratos" },
          { key: "clientes.importar", label: "Importar clientes" },
        ],
      },
      {
        key: "fornecedores",
        label: "Fornecedores",
        acoes: [
          { key: "fornecedores.criar", label: "Cadastrar fornecedor" },
          { key: "fornecedores.editar", label: "Editar fornecedor" },
          { key: "fornecedores.excluir", label: "Excluir fornecedor" },
          { key: "fornecedores.importar", label: "Importar fornecedores" },
        ],
      },
      {
        key: "cargos",
        label: "Cargos",
        acoes: [
          { key: "cargos.criar", label: "Cadastrar cargo" },
          { key: "cargos.editar", label: "Editar cargo" },
          { key: "cargos.excluir", label: "Excluir cargo" },
          { key: "cargos.gerenciar_salarios", label: "Gerenciar salários" },
          { key: "cargos.gerenciar_nrs", label: "Gerenciar NRs" },
          { key: "cargos.gerenciar_anexos", label: "Gerenciar anexos" },
        ],
      },
      {
        key: "sco",
        label: "SCO",
        acoes: [
          { key: "sco.criar", label: "Cadastrar SCO" },
          { key: "sco.editar", label: "Editar SCO" },
          { key: "sco.excluir", label: "Excluir SCO" },
          { key: "sco.importar", label: "Importar SCO" },
        ],
      },
      {
        key: "i0",
        label: "I0",
        acoes: [
          { key: "i0.criar", label: "Cadastrar I0" },
          { key: "i0.editar", label: "Editar I0" },
          { key: "i0.excluir", label: "Excluir I0" },
        ],
      },
    ],
  },
  {
    grupo: "Administração",
    modulos: [
      {
        key: "usuarios",
        label: "Usuários",
        acoes: [
          { key: "usuarios.criar", label: "Cadastrar usuário" },
          { key: "usuarios.editar", label: "Editar usuário" },
          { key: "usuarios.excluir", label: "Excluir usuário" },
          { key: "usuarios.gerenciar_acessos", label: "Gerenciar acessos por cliente" },
        ],
      },
      {
        key: "perfis_acesso",
        label: "Perfis de Acesso",
        acoes: [
          { key: "perfis_acesso.criar", label: "Criar perfil" },
          { key: "perfis_acesso.editar", label: "Editar perfil" },
          { key: "perfis_acesso.excluir", label: "Excluir perfil" },
          { key: "perfis_acesso.duplicar", label: "Duplicar perfil" },
        ],
      },
    ],
  },
];

// Collect all permission keys
export const ALL_MODULE_KEYS = MODULOS_SISTEMA.flatMap(g => g.modulos.map(m => m.key));
export const ALL_PERMISSION_KEYS = MODULOS_SISTEMA.flatMap(g =>
  g.modulos.flatMap(m => [
    m.key,
    ...(m.acoes?.map(a => a.key) ?? []),
    ...(m.statusTransicoes?.map(s => s.key) ?? []),
    ...(m.flags?.map(f => f.key) ?? []),
  ])
);

export type Permissoes = Record<string, boolean>;

export interface PerfilAcesso {
  id: string;
  nome: string;
  descricao: string;
  permissoes: Permissoes;
}

interface PerfisAcessoContextType {
  perfis: PerfilAcesso[];
  addPerfil: (p: Omit<PerfilAcesso, "id">) => Promise<void>;
  updatePerfil: (id: string, p: Omit<PerfilAcesso, "id">) => Promise<void>;
  deletePerfil: (id: string) => Promise<void>;
}

const PerfisAcessoContext = createContext<PerfisAcessoContextType | undefined>(undefined);

const rowToPerfil = (r: any): PerfilAcesso => ({
  id: r.id,
  nome: r.nome ?? "",
  descricao: r.descricao ?? "",
  permissoes: (r.permissoes as Permissoes) ?? {},
});

const perfilToRow = (p: Omit<PerfilAcesso, "id">) => ({
  nome: p.nome,
  descricao: p.descricao,
  permissoes: p.permissoes as any,
});

export function PerfisAcessoProvider({ children }: { children: ReactNode }) {
  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);

  const load = useCallback(async () => {
    const data = await fetchAll("perfis_acesso", "nome");
    setPerfis(data.map(rowToPerfil));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addPerfil = async (p: Omit<PerfilAcesso, "id">) => {
    await insertRow("perfis_acesso", perfilToRow(p));
    await load();
  };

  const updatePerfil = async (id: string, data: Omit<PerfilAcesso, "id">) => {
    await updateRow("perfis_acesso", id, perfilToRow(data));
    await load();
  };

  const deletePerfil = async (id: string) => {
    await deleteRow("perfis_acesso", id);
    await load();
  };

  return (
    <PerfisAcessoContext.Provider value={{ perfis, addPerfil, updatePerfil, deletePerfil }}>
      {children}
    </PerfisAcessoContext.Provider>
  );
}

export function usePerfisAcesso() {
  const ctx = useContext(PerfisAcessoContext);
  if (!ctx) throw new Error("usePerfisAcesso must be used within PerfisAcessoProvider");
  return ctx;
}
