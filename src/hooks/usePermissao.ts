import { useAuth } from "@/contexts/AuthContext";
import { usePerfisAcesso } from "@/contexts/PerfisAcessoContext";
import { useCargos } from "@/contexts/CargosContext";

const CARGOS_ACESSO_TOTAL = ["Diretor", "Gerente Executivo", "Coordenador de Departamento"];

export function usePermissao() {
  const { usuarioLogado } = useAuth();
  const { perfis } = usePerfisAcesso();
  const { cargos } = useCargos();

  const cargo = cargos.find(c => c.id === usuarioLogado?.cargoId);
  const acessoTotal = cargo ? CARGOS_ACESSO_TOTAL.includes(cargo.nome) : false;

  const perfil = perfis.find(p => p.id === usuarioLogado?.perfilAcessoId);

  const tem = (key: string): boolean => {
    if (!usuarioLogado) return false;
    if (acessoTotal) return true;
    return !!perfil?.permissoes?.[key];
  };

  /**
   * Retorna true se o usuário tem QUALQUER permissão do módulo
   * (chave exata ou qualquer subchave começando com `${prefix}.`).
   * Usado para decidir se um item de menu deve aparecer.
   */
  const temModulo = (prefix: string): boolean => {
    if (!usuarioLogado) return false;
    if (acessoTotal) return true;
    const perms = perfil?.permissoes || {};
    if (perms[prefix]) return true;
    const dot = `${prefix}.`;
    for (const k of Object.keys(perms)) {
      if (perms[k] && k.startsWith(dot)) return true;
    }
    return false;
  };

  return { tem, temModulo, acessoTotal, perfil, usuarioLogado };
}
