import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchAll, insertRow, updateRow, deleteRow } from "@/lib/supabaseHelper";

export const MODULOS_SISTEMA = [
  { grupo: "Gestão de Pessoas", modulos: [
    { key: "dashboard_gp", label: "Dashboard" },
    { key: "requisicao_colaboradores", label: "Requisição de Colaboradores" },
    { key: "processos_seletivos", label: "Processos Seletivos" },
    { key: "funcionarios", label: "Funcionários" },
    { key: "mapa_funcionarios", label: "Mapa de Funcionários" },
  ]},
  { grupo: "Compras e Suprimentos", modulos: [
    { key: "dashboard_compras", label: "Dashboard Compras" },
    { key: "requisicoes_compras", label: "Requisições de Compras" },
    { key: "cotacoes", label: "Cotações" },
    { key: "pedidos_compra", label: "Pedidos de Compra" },
    { key: "recebimento", label: "Recebimento" },
    { key: "estoque", label: "Estoque" },
    { key: "categorias_compras", label: "Categorias de Compras" },
    { key: "materiais_servicos", label: "Materiais e Serviços" },
    { key: "fabricantes", label: "Fabricantes" },
  ]},
  { grupo: "Cadastros", modulos: [
    { key: "clientes", label: "Clientes" },
    { key: "fornecedores", label: "Fornecedores" },
    { key: "cargos", label: "Cargos" },
    { key: "sco", label: "SCO" },
    { key: "i0", label: "I0" },
  ]},
  { grupo: "Administração", modulos: [
    { key: "usuarios", label: "Usuários" },
    { key: "perfis_acesso", label: "Perfis de Acesso" },
  ]},
];

export const ALL_MODULE_KEYS = MODULOS_SISTEMA.flatMap(g => g.modulos.map(m => m.key));

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
