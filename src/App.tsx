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
import Sco from "./pages/Sco.tsx";
import I0Page from "./pages/I0.tsx";
import CategoriasCompras from "./pages/CategoriasCompras.tsx";
import MateriaisServicos from "./pages/MateriaisServicos.tsx";
import RequisicaoComprasPage from "./pages/RequisicaoCompras.tsx";
import DashboardCompras from "./pages/DashboardCompras.tsx";
import CotacaoComprasPage from "./pages/CotacaoCompras.tsx";
import PedidoCompraPage from "./pages/PedidoCompra.tsx";
import PropostaFornecedorPage from "./pages/PropostaFornecedor.tsx";
import RecebimentoComprasPage from "./pages/RecebimentoCompras.tsx";
import { CargosProvider } from "@/contexts/CargosContext";
import { RequisicaoProvider } from "@/contexts/RequisicaoContext";
import { ClientesProvider } from "@/contexts/ClientesContext";
import { FuncionariosProvider } from "@/contexts/FuncionariosContext";
import { LancamentosProvider } from "@/contexts/LancamentosContext";
import { UsuariosProvider } from "@/contexts/UsuariosContext";
import { ProcessoSeletivoProvider } from "@/contexts/ProcessoSeletivoContext";
import { ScoProvider } from "@/contexts/ScoContext";
import { I0Provider } from "@/contexts/I0Context";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CategoriasComprasProvider } from "@/contexts/CategoriasComprasContext";
import { MateriaisServicosProvider } from "@/contexts/MateriaisServicosContext";
import { RequisicaoComprasProvider } from "@/contexts/RequisicaoComprasContext";
import { CotacaoComprasProvider } from "@/contexts/CotacaoComprasContext";
import { PedidoCompraProvider } from "@/contexts/PedidoCompraContext";
import { RecebimentoProvider } from "@/contexts/RecebimentoContext";

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
        <Route path="/i0" element={<I0Page />} />
        <Route path="/compras/categorias" element={<CategoriasCompras />} />
        <Route path="/compras/materiais" element={<MateriaisServicos />} />
        <Route path="/compras/requisicoes" element={<RequisicaoComprasPage />} />
        <Route path="/compras/cotacoes" element={<CotacaoComprasPage />} />
        <Route path="/compras/pedidos" element={<PedidoCompraPage />} />
        <Route path="/compras/dashboard" element={<DashboardCompras />} />
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
    <I0Provider>
    <CategoriasComprasProvider>
    <MateriaisServicosProvider>
    <RequisicaoComprasProvider>
    <CotacaoComprasProvider>
    <PedidoCompraProvider>
    <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/cotacao/proposta/:token" element={<PropostaFornecedorPage />} />
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
    </PedidoCompraProvider>
    </CotacaoComprasProvider>
    </RequisicaoComprasProvider>
    </MateriaisServicosProvider>
    </CategoriasComprasProvider>
    </I0Provider>
    </ScoProvider>
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