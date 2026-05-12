import { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { usePermissao } from "@/hooks/usePermissao";

interface RotaProtegidaProps {
  /** Chave do módulo em MODULOS_SISTEMA (ex.: "ordem_servico"). Se vazia, libera acesso. */
  perm?: string;
  children: ReactNode;
}

/**
 * Protege uma rota verificando a permissão do módulo no perfil de acesso do usuário.
 * Cargos com acesso total (Diretor, Gerente Executivo, Coordenador) sempre passam.
 */
export function RotaProtegida({ perm, children }: RotaProtegidaProps) {
  const { temModulo, acessoTotal, usuarioLogado } = usePermissao();

  if (!usuarioLogado) return <>{children}</>;
  if (!perm) return <>{children}</>;
  if (acessoTotal || temModulo(perm)) return <>{children}</>;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Acesso negado</h1>
        <p className="text-sm text-muted-foreground">
          Você não possui permissão para acessar esta página. Entre em contato com o administrador
          se acredita que deveria ter acesso.
        </p>
      </div>
    </div>
  );
}

export default RotaProtegida;
