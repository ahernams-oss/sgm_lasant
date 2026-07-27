import { Link } from "react-router-dom";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Shield, FolderOpen, UserCog } from "lucide-react";

const items = [
  { to: "/portal/funcionario/holerites", label: "Holerites e Comprovantes", icon: FileText },
  { to: "/portal/funcionario/epis", label: "Confirmar EPIs (Facial)", icon: Shield },
  { to: "/portal/funcionario/documentos", label: "Meus Documentos", icon: FolderOpen },
  { to: "/portal/funcionario/perfil", label: "Perfil / Alterar Senha", icon: UserCog },
];

export default function PortalFuncHome() {
  return (
    <PortalLayout requireTipo="funcionario">
      <h1 className="text-2xl font-semibold mb-6">Bem-vindo</h1>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {items.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}>
            <Card className="hover:shadow-md transition">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="font-medium">{label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PortalLayout>
  );
}
