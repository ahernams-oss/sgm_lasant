import { ReactNode } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import logoLasant from "@/assets/Logo_Lasant.png";

interface Props {
  children: ReactNode;
  requireTipo?: "funcionario" | "candidato";
}

export default function PortalLayout({ children, requireTipo }: Props) {
  const { user, logout } = usePortalAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  if (!user) return <Navigate to="/portal" replace state={{ from: loc.pathname }} />;
  if (requireTipo && user.tipo !== requireTipo) {
    return <Navigate to={user.tipo === "funcionario" ? "/portal/funcionario" : "/portal/candidato"} replace />;
  }

  const menuFunc = [
    { to: "/portal/funcionario", label: "Início", isLogo: true },
    { to: "/portal/funcionario/holerites", label: "Holerites" },
    { to: "/portal/funcionario/epis", label: "EPIs" },
    { to: "/portal/funcionario/documentos", label: "Documentos" },
    { to: "/portal/funcionario/perfil", label: "Perfil" },
  ];
  const menuCand = [
    { to: "/portal/candidato", label: "Início", isLogo: true },
    { to: "/portal/candidato/ficha", label: "Ficha" },
    { to: "/portal/candidato/documentos", label: "Documentos" },
    { to: "/portal/candidato/termos", label: "Termos" },
    { to: "/portal/candidato/admissional", label: "Admissional" },
  ];
  const menu = user.tipo === "funcionario" ? menuFunc : menuCand;

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between relative">
          <div className="flex items-center gap-2">
            <img src={logoLasant} alt="Lasant" className="h-8 w-auto" />
          </div>
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-semibold tracking-tight text-lg">Portal de RH</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{user.nome}</span>
            <Button size="sm" variant="secondary" onClick={() => { logout(); navigate("/portal"); }}>
              <LogOut className="w-4 h-4 mr-1" /> Sair
            </Button>
          </div>
        </div>
        <nav className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto text-sm items-center">
          <Link to="/portal" className="flex items-center px-2 py-1 rounded-t-md hover:bg-primary-foreground/10">
            <img src={logoLasant} alt="Lasant" className="h-6 w-auto" />
          </Link>
          {menu.map((m) => {
            const active = loc.pathname === m.to;
            return (
              <Link key={m.to} to={m.to}
                className={`px-3 py-2 rounded-t-md whitespace-nowrap ${active ? "bg-background text-foreground" : "hover:bg-primary-foreground/10"}`}>
                {m.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">{children}</main>
      <footer className="text-xs text-muted-foreground text-center py-4">
        © LASANT — Portal do Colaborador
      </footer>
    </div>
  );
}
