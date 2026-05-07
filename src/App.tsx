import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ReactNode } from "react";
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
import MapaPlantoes from "./pages/MapaPlantoes.tsx";
import Usuarios from "./pages/Usuarios.tsx";
import Login from "./pages/Login.tsx";
import EsqueciSenha from "./pages/EsqueciSenha.tsx";
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
import InteligenciaComprasPage from "./pages/InteligenciaCompras.tsx";
import AssinarLotePcPage from "./pages/AssinarLotePc.tsx";
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
import DashboardSSOSPage from "./pages/DashboardSSOS.tsx";
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
import AprovarLoteSS from "@/pages/AprovarLoteSS";
import { OrdensServicoProvider } from "@/contexts/OrdensServicoContext";
import { OrcamentosProvider } from "@/contexts/OrcamentosContext";
import { ComunicacaoProvider } from "@/contexts/ComunicacaoContext";
import ComunicacaoMensagensPage from "./pages/ComunicacaoMensagens";
import ComunicacaoAvisosPage from "./pages/ComunicacaoAvisos";
import ComunicacaoNotificacoesPage from "./pages/ComunicacaoNotificacoes";
import JuridicoPage from "./pages/Juridico";
import { ProcessosTrabalhalistasProvider } from "@/contexts/ProcessosTrabalhistas";
import ChatDudaPage from "./pages/ChatDuda";
import RdoPage from "./pages/Rdo.tsx";
import { RdosProvider } from "@/contexts/RdosContext";
import { RdoAssinaturasProvider } from "@/contexts/RdoAssinaturasContext";
import { OsAssinaturasProvider } from "@/contexts/OsAssinaturasContext";
import { PcAssinaturasProvider } from "@/contexts/PcAssinaturasContext";
import AssinarLoteOsPage from "./pages/AssinarLoteOs.tsx";
import ConfirmarLoteOsPage from "./pages/ConfirmarLoteOs.tsx";
import ValidarLoteOsPage from "./pages/ValidarLoteOs.tsx";
import ImprimirLoteOsPage from "./pages/ImprimirLoteOs.tsx";
import VerificarAssinaturaPage from "./pages/VerificarAssinatura.tsx";
import ResponsaveisTecnicosPage from "./pages/ResponsaveisTecnicos.tsx";
import { ResponsaveisTecnicosProvider } from "@/contexts/ResponsaveisTecnicosContext";
import { PlanosManutencaoProvider } from "@/contexts/PlanosManutencaoContext";
import PlanoManutencaoPage from "./pages/PlanoManutencao.tsx";
import { KnowledgeBaseProvider } from "@/contexts/KnowledgeBaseContext";
import BaseConhecimentoPage from "./pages/BaseConhecimento.tsx";
import MonitorTV from "./pages/MonitorTV.tsx";
import CronogramaPage from "./pages/Cronograma.tsx";
import BimPage from "./pages/Bim.tsx";
import { BimProvider } from "@/contexts/BimContext";
import { CronogramasProvider } from "@/contexts/CronogramasContext";
import { OrcamentosScoProvider } from "@/contexts/OrcamentosScoContext";
import OrcamentosSco from "./pages/OrcamentosSco.tsx";
import OrcamentoScoForm from "./pages/OrcamentoScoForm.tsx";
import ImportarCatalogoSco from "./pages/ImportarCatalogoSco.tsx";
import CatalogoSco from "./pages/CatalogoSco.tsx";
import AvaliacoesDesempenhoPage from "./pages/AvaliacoesDesempenho.tsx";
const queryClient = new QueryClient();

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function ProtectedAppRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clientes" element={<OrdensServicoProvider><Clientes /></OrdensServicoProvider>} />
        <Route path="/fornecedores" element={<Fornecedores />} />
        <Route path="/cargos" element={<Cargos />} />
        <Route path="/funcionarios" element={<Funcionarios />} />
        <Route path="/epis" element={<EpisPage />} />
        <Route path="/exames" element={<ExamesPage />} />
        <Route path="/mapa-funcionarios" element={<MapaFuncionarios />} />
        <Route path="/mapa-plantoes" element={<MapaPlantoes />} />
        <Route path="/avaliacoes-desempenho" element={<AvaliacoesDesempenhoPage />} />
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
        <Route path="/compras/inteligencia" element={<InteligenciaComprasPage />} />
        <Route path="/compras/assinar-lote-pc" element={<AssinarLotePcPage />} />
        <Route path="/compras/recebimento" element={<RecebimentoComprasPage />} />
        <Route path="/compras/estoque" element={<EstoquePage />} />
        <Route path="/compras/relatorios-estoque" element={<RelatoriosEstoquePage />} />
        <Route path="/compras/dashboard" element={<DashboardCompras />} />
        <Route path="/compras/fabricantes" element={<FabricantesPage />} />
        <Route path="/licitacoes" element={<LicitacoesPage />} />
        <Route path="/engenharia/dashboard-medicoes" element={<DashboardMedicoesPage />} />
        <Route
          path="/engenharia/dashboard"
          element={
            <SolicitacoesServicosProvider>
              <OrdensServicoProvider>
                <DashboardSSOSPage />
              </OrdensServicoProvider>
            </SolicitacoesServicosProvider>
          }
        />
        <Route path="/engenharia/medicoes" element={<MedicoesServicosPage />} />
        <Route path="/patrimonio/ferramentas" element={<FerramentasPage />} />
        <Route path="/qualidade/evidencias" element={<EvidenciasPage />} />
        <Route path="/qualidade/checklists" element={<ChecklistsPage />} />
        <Route path="/cadastros/equipamentos" element={<EquipamentosPage />} />
        <Route path="/pmoc" element={<PmocPage />} />
        <Route path="/engenharia/plano-manutencao" element={<PlanoManutencaoPage />} />
        <Route path="/engenharia/base-conhecimento" element={<BaseConhecimentoPage />} />
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
          path="/engenharia/aprovar-lote-ss"
          element={
            <SolicitacoesServicosProvider>
              <OrdensServicoProvider>
                <AprovarLoteSS />
              </OrdensServicoProvider>
            </SolicitacoesServicosProvider>
          }
        />
        <Route
          path="/engenharia/assinar-lote-os"
          element={
            <OrdensServicoProvider>
              <AssinarLoteOsPage />
            </OrdensServicoProvider>
          }
        />
        <Route
          path="/engenharia/confirmar-lote-os"
          element={
            <SolicitacoesServicosProvider>
              <OrdensServicoProvider>
              <ConfirmarLoteOsPage />
            </OrdensServicoProvider>
          </SolicitacoesServicosProvider>
        }
        />
        <Route
          path="/engenharia/validar-lote-os"
          element={
            <OrdensServicoProvider>
              <ValidarLoteOsPage />
            </OrdensServicoProvider>
          }
        />
        <Route
          path="/engenharia/imprimir-lote-os"
          element={
            <OrdensServicoProvider>
              <ImprimirLoteOsPage />
            </OrdensServicoProvider>
          }
        />
        <Route
          path="/engenharia/ordem-servico"
          element={
            <OrdensServicoProvider>
              <OrcamentosProvider>
                <OrdensServicoPage />
              </OrcamentosProvider>
            </OrdensServicoProvider>
          }
        />
        <Route path="/engenharia/rdo" element={<RdoPage />} />
        <Route path="/engenharia/cronograma" element={<CronogramaPage />} />
        <Route path="/obras/bim" element={<BimPage />} />
        <Route path="/engenharia/responsaveis-tecnicos" element={<ResponsaveisTecnicosPage />} />
        <Route path="/cadastros/responsaveis-tecnicos" element={<ResponsaveisTecnicosPage />} />
        <Route path="/comunicacao/mensagens" element={<ComunicacaoMensagensPage />} />
        <Route path="/comunicacao/avisos" element={<ComunicacaoAvisosPage />} />
        <Route path="/comunicacao/notificacoes" element={<ComunicacaoNotificacoesPage />} />
        <Route path="/juridico" element={<JuridicoPage />} />
        <Route path="/chat-duda" element={<ChatDudaPage />} />
        <Route path="/orcamentos" element={<OrcamentosSco />} />
        <Route path="/orcamentos/novo" element={<OrcamentoScoForm />} />
        <Route path="/orcamentos/:id" element={<OrcamentoScoForm />} />
        <Route path="/orcamentos/catalogo" element={<CatalogoSco />} />
        <Route path="/orcamentos/importar-catalogo" element={<ImportarCatalogoSco />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <ProtectedAppRoutes />
          </RequireAuth>
        }
      />
    </Routes>
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
    <ComunicacaoProvider>
    <ProcessosTrabalhalistasProvider>
    <ResponsaveisTecnicosProvider>
    <PlanosManutencaoProvider>
    <KnowledgeBaseProvider>
    <RdosProvider>
    <RdoAssinaturasProvider>
    <CronogramasProvider>
    <BimProvider>
    <OrcamentosScoProvider>
    <OsAssinaturasProvider>
    <PcAssinaturasProvider>
    <AuthProvider> {/* auth wrapper */}
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/cotacao/proposta/:token" element={<PropostaFornecedorPage />} />
          <Route path="/unsubscribe" element={<UnsubscribePage />} />
          <Route path="/verificar-assinatura" element={<VerificarAssinaturaPage />} />
          <Route path="/verificar-assinatura/:codigo" element={<VerificarAssinaturaPage />} />
          <Route
            path="/monitor-tv"
            element={
              <RequireAuth>
                <SolicitacoesServicosProvider>
                  <OrdensServicoProvider>
                    <MonitorTV />
                  </OrdensServicoProvider>
                </SolicitacoesServicosProvider>
              </RequireAuth>
            }
          />
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
    </PcAssinaturasProvider>
    </OsAssinaturasProvider>
    </OrcamentosScoProvider>
    </BimProvider>
    </CronogramasProvider>
    </RdoAssinaturasProvider>
    </RdosProvider>
    </KnowledgeBaseProvider>
    </PlanosManutencaoProvider>
    </ResponsaveisTecnicosProvider>
    </ProcessosTrabalhalistasProvider>
    </ComunicacaoProvider>
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