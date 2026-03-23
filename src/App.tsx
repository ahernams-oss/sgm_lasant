import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import NotFound from "./pages/NotFound.tsx";
import Clientes from "./pages/Clientes.tsx";
import Fornecedores from "./pages/Fornecedores.tsx";
import Cargos from "./pages/Cargos.tsx";
import Funcionarios from "./pages/Funcionarios.tsx";
import MapaFuncionarios from "./pages/MapaFuncionarios.tsx";
import Usuarios from "./pages/Usuarios.tsx";
import Login from "./pages/Login.tsx";
import ProcessoSeletivo from "./pages/ProcessoSeletivo.tsx";
import ProcessosSeletivos from "./pages/ProcessosSeletivos.tsx";
import { CargosProvider } from "@/contexts/CargosContext";
import { RequisicaoProvider } from "@/contexts/RequisicaoContext";
import { ClientesProvider } from "@/contexts/ClientesContext";
import { FuncionariosProvider } from "@/contexts/FuncionariosContext";
import { LancamentosProvider } from "@/contexts/LancamentosContext";
import { UsuariosProvider } from "@/contexts/UsuariosContext";
import { ProcessoSeletivoProvider } from "@/contexts/ProcessoSeletivoContext";
import { ScoProvider } from "@/contexts/ScoContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Sco from "./pages/Sco.tsx";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
         <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/fornecedores" element={<Fornecedores />} />
        <Route path="/cargos" element={<Cargos />} />
        <Route path="/funcionarios" element={<Funcionarios />} />
        <Route path="/mapa-funcionarios" element={<MapaFuncionarios />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/processo-seletivo/:requisicaoId" element={<ProcessoSeletivo />} />
        <Route path="/processos-seletivos" element={<ProcessosSeletivos />} />
        <Route path="/sco" element={<Sco />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ClientesProvider>
    <CargosProvider>
    <FuncionariosProvider>
    <LancamentosProvider>
    <UsuariosProvider>
    <RequisicaoProvider>
    <ProcessoSeletivoProvider>
    <ScoProvider>
    <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
    </ProcessoSeletivoProvider>
    </RequisicaoProvider>
    </UsuariosProvider>
    </LancamentosProvider>
    </FuncionariosProvider>
    </CargosProvider>
    </ClientesProvider>
  </QueryClientProvider>
);

export default App;
