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
    // TEMP: liberado para testes — remover depois
    if (key === "clientes.ver_valor_folha") return true;
    if (!usuarioLogado) return false;
    if (acessoTotal) return true;
    return !!perfil?.permissoes?.[key];
  };

  return { tem, acessoTotal, perfil, usuarioLogado };
}
