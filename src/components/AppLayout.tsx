import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import AvisosPopup from "@/components/AvisosPopup";
import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { lastRouteKey } from "@/lib/accessRoutes";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const { usuarioLogado } = useAuth();

  // Persiste última rota acessada por usuário
  useEffect(() => {
    if (!usuarioLogado?.id) return;
    const path = location.pathname + location.search;
    if (path.startsWith("/login") || path.startsWith("/esqueci-senha")) return;
    try {
      localStorage.setItem(lastRouteKey(usuarioLogado.id), path);
    } catch {}
  }, [location.pathname, location.search, usuarioLogado?.id]);

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border bg-card sticky top-0 z-10">
            <SidebarTrigger className="ml-3" />
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
      <AvisosPopup />
    </SidebarProvider>
  );
};

export default AppLayout;
