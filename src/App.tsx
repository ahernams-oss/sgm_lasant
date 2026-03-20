import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Clientes from "./pages/Clientes.tsx";
import Cargos from "./pages/Cargos.tsx";
import Funcionarios from "./pages/Funcionarios.tsx";
import Usuarios from "./pages/Usuarios.tsx";
import Login from "./pages/Login.tsx";
import { CargosProvider } from "@/contexts/CargosContext";
import { RequisicaoProvider } from "@/contexts/RequisicaoContext";
import { ClientesProvider } from "@/contexts/ClientesContext";
import { FuncionariosProvider } from "@/contexts/FuncionariosContext";
import { UsuariosProvider } from "@/contexts/UsuariosContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/cargos" element={<Cargos />} />
        <Route path="/funcionarios" element={<Funcionarios />} />
        <Route path="/usuarios" element={<Usuarios />} />
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
    <UsuariosProvider>
    <RequisicaoProvider>
    <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
    </RequisicaoProvider>
    </UsuariosProvider>
    </FuncionariosProvider>
    </CargosProvider>
    </ClientesProvider>
  </QueryClientProvider>
);

export default App;
