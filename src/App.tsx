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
import EstoquePage from "./pages/Estoque.tsx";
import RelatoriosEstoquePage from "./pages/RelatoriosEstoque.tsx";
import PerfisAcessoPage from "./pages/PerfisAcesso.tsx";
import EmpresaDadosPage from "./pages/EmpresaDados.tsx";
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
import { EstoqueProvider } from "@/contexts/EstoqueContext";
import { FabricantesProvider } from "@/contexts/FabricantesContext";
import { PerfisAcessoProvider } from "@/contexts/PerfisAcessoContext";
import { EmpresaProvider } from "@/contexts/EmpresaContext";
import { LicitacoesProvider } from "@/contexts/LicitacoesContext";
import { MedicoesProvider } from "@/contexts/MedicoesContext";
import { FerramentasProvider } from "@/contexts/FerramentasContext";
import FabricantesPage from "./pages/Fabricantes.tsx";
import EpisPage from "./pages/EpisPage.tsx";
import ExamesPage from "./pages/ExamesPage.tsx";
import UnsubscribePage from "./pages/Unsubscribe.tsx";
import LicitacoesPage from "./pages/Licitacoes.tsx";
import MedicoesServicosPage from "./pages/MedicoesServicos.tsx";
import DashboardMedicoesPage from "./pages/DashboardMedicoes.tsx";
import FerramentasPage from "./pages/Ferramentas.tsx";
import EvidenciasPage from "./pages/Evidencias.tsx";
import ChecklistsPage from "./pages/Checklists.tsx";
import { EvidenciasProvider } from "@/contexts/EvidenciasContext";
import { ChecklistsProvider } from "@/contexts/ChecklistsContext";
import EquipamentosPage from "./pages/Equipamentos.tsx";
import { EquipamentosProvider } from "@/contexts/EquipamentosContext";
import PmocPage from "./pages/Pmoc.tsx";
import { PmocProvider } from "@/contexts/PmocContext";
import { CategoriasServicosProvider } from "@/contexts/CategoriasServicosContext";
import { ServicosProvider } from "@/contexts/ServicosContext";
import CategoriasServicosPage from "./pages/CategoriasServicosPage.tsx";
import ServicosPage from "./pages/ServicosPage.tsx";
import SolicitacaoServicosPage from "@/pages/SolicitacaoServicos";
import { SolicitacoesServicosProvider } from "@/contexts/SolicitacoesServicosContext";
import OrdensServicoPage from "@/pages/OrdensServico";
import { OrdensServicoProvider } from "@/contexts/OrdensServicoContext";
import { OrcamentosProvider } from "@/contexts/OrcamentosContext";

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
        <Route path="/epis" element={<EpisPage />} />
        <Route path="/exames" element={<ExamesPage />} />
        <Route path="/mapa-funcionarios" element={<MapaFuncionarios />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/perfis-acesso" element={<PerfisAcessoPage />} />
        <Route path="/empresa" element={<EmpresaDadosPage />} />
        <Route path="/processo-seletivo/:requisicaoId" element={<ProcessoSeletivo />} />
        <Route path="/processos-seletivos" element={<ProcessosSeletivos />} />
        <Route path="/sco" element={<Sco />} />
        <Route path="/i0" element={<I0Page />} />
        <Route path="/compras/categorias" element={<CategoriasCompras />} />
        <Route path="/compras/materiais" element={<MateriaisServicos />} />
        <Route path="/compras/requisicoes" element={<RequisicaoComprasPage />} />
        <Route path="/compras/cotacoes" element={<CotacaoComprasPage />} />
        <Route path="/compras/pedidos" element={<PedidoCompraPage />} />
        <Route path="/compras/recebimento" element={<RecebimentoComprasPage />} />
        <Route path="/compras/estoque" element={<EstoquePage />} />
        <Route path="/compras/relatorios-estoque" element={<RelatoriosEstoquePage />} />
        <Route path="/compras/dashboard" element={<DashboardCompras />} />
        <Route path="/compras/fabricantes" element={<FabricantesPage />} />
        <Route path="/licitacoes" element={<LicitacoesPage />} />
        <Route path="/engenharia/dashboard" element={<DashboardMedicoesPage />} />
        <Route path="/engenharia/medicoes" element={<MedicoesServicosPage />} />
        <Route path="/patrimonio/ferramentas" element={<FerramentasPage />} />
        <Route path="/qualidade/evidencias" element={<EvidenciasPage />} />
        <Route path="/qualidade/checklists" element={<ChecklistsPage />} />
        <Route path="/cadastros/equipamentos" element={<EquipamentosPage />} />
        <Route path="/pmoc" element={<PmocPage />} />
        <Route path="/cadastros/categorias-servicos" element={<CategoriasServicosPage />} />
        <Route path="/cadastros/servicos" element={<ServicosPage />} />
        <Route
          path="/engenharia/solicitacao-servicos"
          element={
            <SolicitacoesServicosProvider>
              <OrdensServicoProvider>
                <OrcamentosProvider>
                  <SolicitacaoServicosPage />
                </OrcamentosProvider>
              </OrdensServicoProvider>
            </SolicitacoesServicosProvider>
          }
        />
        <Route
          path="/engenharia/ordem-servico"
          element={
            <OrdensServicoProvider>
              <OrdensServicoPage />
            </OrdensServicoProvider>
          }
        />
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
    <EstoqueProvider>
    <RecebimentoProvider>
    <FabricantesProvider>
    <PerfisAcessoProvider>
    <EmpresaProvider>
    <LicitacoesProvider>
    <MedicoesProvider>
    <FerramentasProvider>
    <EvidenciasProvider>
    <ChecklistsProvider>
    <EquipamentosProvider>
    <PmocProvider>
    <CategoriasServicosProvider>
    <ServicosProvider>
    <AuthProvider> {/* auth wrapper */}
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/cotacao/proposta/:token" element={<PropostaFornecedorPage />} />
          <Route path="/unsubscribe" element={<UnsubscribePage />} />
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
    </ServicosProvider>
    </CategoriasServicosProvider>
    </PmocProvider>
    </EquipamentosProvider>
    </ChecklistsProvider>
    </EvidenciasProvider>
    </FerramentasProvider>
    </MedicoesProvider>
    </LicitacoesProvider>
    </EmpresaProvider>
    </PerfisAcessoProvider>
    </FabricantesProvider>
    </RecebimentoProvider>
    </EstoqueProvider>
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