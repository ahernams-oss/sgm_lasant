import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index.tsx";
import Home from "./pages/Home.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import NotFound from "./pages/NotFound.tsx";
import Clientes from "./pages/Clientes.tsx";
import Fornecedores from "./pages/Fornecedores.tsx";
import Cargos from "./pages/Cargos.tsx";
import Funcionarios from "./pages/Funcionarios.tsx";
import MapaFuncionarios from "./pages/MapaFuncionarios.tsx";
import MapaPlantoes from "./pages/MapaPlantoes.tsx";
import MapaFerias from "./pages/MapaFerias.tsx";
import MapaUniformes from "./pages/MapaUniformes.tsx";
import Usuarios from "./pages/Usuarios.tsx";
import Login from "./pages/Login.tsx";
import EsqueciSenha from "./pages/EsqueciSenha.tsx";
import RedefinirSenha from "./pages/RedefinirSenha.tsx";
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
import AprovarLoteCotacoesPage from "./pages/AprovarLoteCotacoes.tsx";
import PropostaFornecedorPage from "./pages/PropostaFornecedor.tsx";
import PortalFornecedorPage from "./pages/PortalFornecedor.tsx";
import PregaoSalaFornecedorPage from "./pages/portal-fornecedor/PregaoSalaFornecedor.tsx";
import RecebimentoComprasPage from "./pages/RecebimentoCompras.tsx";
import EstoquePage from "./pages/Estoque.tsx";
import RelatoriosEstoquePage from "./pages/RelatoriosEstoque.tsx";
import PerfisAcessoPage from "./pages/PerfisAcesso.tsx";
import AuditoriaPage from "./pages/Auditoria.tsx";
import EmpresaDadosPage from "./pages/EmpresaDados.tsx";
import BancoPrecosPage from "./pages/BancoPrecos.tsx";
import Trust from "./pages/Trust.tsx";
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
import { PregaoProvider } from "@/contexts/PregaoContext";
import PregoesPage from "./pages/pregao/Pregoes.tsx";
import PregaoFormPage from "./pages/pregao/PregaoForm.tsx";
import PregaoSalaPage from "./pages/pregao/PregaoSala.tsx";
import PregaoHabilitacaoPage from "./pages/pregao/PregaoHabilitacao.tsx";
import PregaoResultadoPage from "./pages/pregao/PregaoResultado.tsx";
import FabricantesPage from "./pages/Fabricantes.tsx";
import EpisPage from "./pages/EpisPage.tsx";
import EpisCatalogoPage from "./pages/EpisCatalogo.tsx";
import { EpisCatalogoProvider } from "@/contexts/EpisCatalogoContext";
import ExamesPage from "./pages/ExamesPage.tsx";
import UnsubscribePage from "./pages/Unsubscribe.tsx";
import PortalCandidato from "./pages/PortalCandidato.tsx";
import EquipamentoPublico from "./pages/EquipamentoPublico.tsx";
import Instalar from "./pages/Instalar.tsx";
import LicitacoesPage from "./pages/Licitacoes.tsx";
import MedicoesServicosPage from "./pages/MedicoesServicos.tsx";
import DashboardMedicoesPage from "./pages/DashboardMedicoes.tsx";
import DashboardSSOSPage from "./pages/DashboardSSOS.tsx";
import DashboardSolicitacoesPage from "./pages/DashboardSolicitacoes.tsx";
import FerramentasPage from "./pages/Ferramentas.tsx";
import EvidenciasPage from "./pages/Evidencias.tsx";
import ChecklistsPage from "./pages/Checklists.tsx";
import { EvidenciasProvider } from "@/contexts/EvidenciasContext";
import { ChecklistsProvider } from "@/contexts/ChecklistsContext";
import EquipamentosPage from "./pages/Equipamentos.tsx";
import { EquipamentosProvider } from "@/contexts/EquipamentosContext";
import { LaudosCondenacaoProvider } from "@/contexts/LaudosCondenacaoContext";
import PmocPage from "./pages/Pmoc.tsx";
import PmocGerenciarOperacaoPage from "./pages/PmocGerenciarOperacao.tsx";
import { PmocProvider } from "@/contexts/PmocContext";
import { CategoriasServicosProvider } from "@/contexts/CategoriasServicosContext";
import { ServicosProvider } from "@/contexts/ServicosContext";
import { OsModelosProvider } from "@/contexts/OsModelosContext";
import CategoriasServicosPage from "./pages/CategoriasServicosPage.tsx";
import ServicosPage from "./pages/ServicosPage.tsx";
import OsModelosPage from "./pages/OsModelos.tsx";
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
import ComunicacaoWhatsappPage from "./pages/ComunicacaoWhatsapp";
import JuridicoPage from "./pages/Juridico";
import { ProcessosTrabalhalistasProvider } from "@/contexts/ProcessosTrabalhistas";
import ChatDudaPage from "./pages/ChatDuda";
import RdoPage from "./pages/Rdo.tsx";
import { RdosProvider } from "@/contexts/RdosContext";
import { RdoAssinaturasProvider } from "@/contexts/RdoAssinaturasContext";
import { ObrasProvider } from "@/contexts/ObrasContext";
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
import ContratosTerceirosPage from "./pages/ContratosTerceiros.tsx";
import { BimProvider } from "@/contexts/BimContext";
import { CronogramasProvider } from "@/contexts/CronogramasContext";
import EventogramaPage from "./pages/Eventograma.tsx";
import { EventogramasProvider } from "@/contexts/EventogramasContext";
import { OrcamentosScoProvider } from "@/contexts/OrcamentosScoContext";
import OrcamentosSco from "./pages/OrcamentosSco.tsx";
import OrcamentoScoForm from "./pages/OrcamentoScoForm.tsx";
import ImportarCatalogoSco from "./pages/ImportarCatalogoSco.tsx";
import CatalogoSco from "./pages/CatalogoSco.tsx";
import AvaliacoesDesempenhoPage from "./pages/AvaliacoesDesempenho.tsx";
import { FinanceiroProvider } from "@/contexts/FinanceiroContext";
import DashboardFinanceiro from "./pages/financeiro/DashboardFinanceiro.tsx";
import ContasPagar from "./pages/financeiro/ContasPagar.tsx";
import ContasReceber from "./pages/financeiro/ContasReceber.tsx";
import ContasBancarias from "./pages/financeiro/ContasBancarias.tsx";
import PlanoContas from "./pages/financeiro/PlanoContas.tsx";
import CentrosCusto from "./pages/financeiro/CentrosCusto.tsx";
import FluxoCaixa from "./pages/financeiro/FluxoCaixa.tsx";
import Dre from "./pages/financeiro/Dre.tsx";
import Conciliacao from "./pages/financeiro/Conciliacao.tsx";
import Lancamentos from "./pages/financeiro/Lancamentos.tsx";
import RelatoriosFinanceiros from "./pages/financeiro/RelatoriosFinanceiros.tsx";
import CondicoesPagamento from "./pages/financeiro/CondicoesPagamento.tsx";
import NfesRecebidas from "./pages/financeiro/NfesRecebidas.tsx";
import NfseEmitir from "./pages/financeiro/NfseEmitir.tsx";
import { NfsesProvider } from "@/contexts/NfsesContext";
import RelatoriosGerenciais from "./pages/gerencial/RelatoriosGerenciais.tsx";
import RelatoriosMultidimensional from "./pages/gerencial/RelatoriosMultidimensional.tsx";
import DashboardMultisistemico from "./pages/gerencial/DashboardMultisistemico.tsx";
import MapaClientes from "./pages/gerencial/MapaClientes.tsx";
import { RotaProtegida } from "@/components/RotaProtegida";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function ProtectedAppRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/trust" element={<Trust />} />
        <Route path="/requisicao-pessoal" element={<RotaProtegida perm="requisicao_colaboradores"><Index /></RotaProtegida>} />

        <Route path="/dashboard" element={<RotaProtegida perm="dashboard_gp"><Dashboard /></RotaProtegida>} />
        <Route path="/clientes" element={<RotaProtegida perm="clientes"><OrdensServicoProvider><Clientes /></OrdensServicoProvider></RotaProtegida>} />
        <Route path="/fornecedores" element={<RotaProtegida perm="fornecedores"><Fornecedores /></RotaProtegida>} />
        <Route path="/cargos" element={<RotaProtegida perm="cargos"><Cargos /></RotaProtegida>} />
        <Route path="/funcionarios" element={<RotaProtegida perm="funcionarios"><Funcionarios /></RotaProtegida>} />
        <Route path="/epis" element={<RotaProtegida perm="funcionarios"><EpisPage /></RotaProtegida>} />
        <Route path="/epis/catalogo" element={<RotaProtegida perm="cargos"><EpisCatalogoPage /></RotaProtegida>} />
        <Route path="/exames" element={<RotaProtegida perm="funcionarios"><ExamesPage /></RotaProtegida>} />
        <Route path="/mapa-funcionarios" element={<RotaProtegida perm="mapa_funcionarios"><MapaFuncionarios /></RotaProtegida>} />
        <Route path="/mapa-plantoes" element={<RotaProtegida perm="mapa_funcionarios"><MapaPlantoes /></RotaProtegida>} />
        <Route path="/mapa-ferias" element={<RotaProtegida perm="mapa_funcionarios"><MapaFerias /></RotaProtegida>} />
        <Route path="/mapa-uniformes" element={<RotaProtegida perm="mapa_funcionarios"><MapaUniformes /></RotaProtegida>} />
        <Route path="/avaliacoes-desempenho" element={<RotaProtegida perm="avaliacoes_desempenho"><AvaliacoesDesempenhoPage /></RotaProtegida>} />
        <Route path="/usuarios" element={<RotaProtegida perm="usuarios"><Usuarios /></RotaProtegida>} />
        <Route path="/perfis-acesso" element={<RotaProtegida perm="perfis_acesso"><PerfisAcessoPage /></RotaProtegida>} />
        <Route path="/auditoria" element={<RotaProtegida perm="auditoria"><AuditoriaPage /></RotaProtegida>} />
        <Route path="/empresa" element={<RotaProtegida perm="empresa"><EmpresaDadosPage /></RotaProtegida>} />
        <Route path="/processo-seletivo/:requisicaoId" element={<RotaProtegida perm="processos_seletivos"><ProcessoSeletivo /></RotaProtegida>} />
        <Route path="/processos-seletivos" element={<RotaProtegida perm="processos_seletivos"><ProcessosSeletivos /></RotaProtegida>} />
        <Route path="/sco" element={<RotaProtegida perm="sco"><Sco /></RotaProtegida>} />
        <Route path="/i0" element={<RotaProtegida perm="i0"><I0Page /></RotaProtegida>} />
        <Route path="/compras/categorias" element={<RotaProtegida perm="categorias_compras"><CategoriasCompras /></RotaProtegida>} />
        <Route path="/compras/materiais" element={<RotaProtegida perm="materiais_servicos"><MateriaisServicos /></RotaProtegida>} />
        <Route path="/compras/requisicoes" element={<RotaProtegida perm="requisicoes_compras"><RequisicaoComprasPage /></RotaProtegida>} />
        <Route path="/compras/cotacoes" element={<RotaProtegida perm="cotacoes"><CotacaoComprasPage /></RotaProtegida>} />
        <Route path="/compras/pedidos" element={<RotaProtegida perm="pedidos_compra"><PedidoCompraPage /></RotaProtegida>} />
        <Route path="/compras/inteligencia" element={<RotaProtegida perm="requisicoes_compras"><InteligenciaComprasPage /></RotaProtegida>} />
        <Route path="/compras/assinar-lote-pc" element={<RotaProtegida perm="pedidos_compra"><AssinarLotePcPage /></RotaProtegida>} />
        <Route path="/compras/aprovar-lote-cotacoes" element={<RotaProtegida perm="cotacoes"><AprovarLoteCotacoesPage /></RotaProtegida>} />
        <Route path="/compras/recebimento" element={<RotaProtegida perm="recebimento"><RecebimentoComprasPage /></RotaProtegida>} />
        <Route path="/compras/estoque" element={<RotaProtegida perm="estoque"><EstoquePage /></RotaProtegida>} />
        <Route path="/compras/relatorios-estoque" element={<RotaProtegida perm="estoque"><RelatoriosEstoquePage /></RotaProtegida>} />
        <Route path="/compras/dashboard" element={<RotaProtegida perm="dashboard_compras"><DashboardCompras /></RotaProtegida>} />
        <Route path="/compras/banco-precos" element={<RotaProtegida perm="pedidos_compra"><BancoPrecosPage /></RotaProtegida>} />
        <Route path="/compras/fabricantes" element={<RotaProtegida perm="fabricantes"><FabricantesPage /></RotaProtegida>} />
        <Route path="/compras/pregao" element={<RotaProtegida perm="pregao"><PregoesPage /></RotaProtegida>} />
        <Route path="/compras/pregao/novo" element={<RotaProtegida perm="pregao"><PregaoFormPage /></RotaProtegida>} />
        <Route path="/compras/pregao/:id" element={<RotaProtegida perm="pregao"><PregaoFormPage /></RotaProtegida>} />
        <Route path="/compras/pregao/:id/sala" element={<RotaProtegida perm="pregao"><PregaoSalaPage /></RotaProtegida>} />
        <Route path="/compras/pregao/:id/habilitacao" element={<RotaProtegida perm="pregao"><PregaoHabilitacaoPage /></RotaProtegida>} />
        <Route path="/compras/pregao/:id/resultado" element={<RotaProtegida perm="pregao"><PregaoResultadoPage /></RotaProtegida>} />
        <Route path="/licitacoes" element={<RotaProtegida perm="licitacoes"><LicitacoesPage /></RotaProtegida>} />
        <Route path="/engenharia/dashboard-medicoes" element={<RotaProtegida perm="dashboard_medicoes"><DashboardMedicoesPage /></RotaProtegida>} />
        <Route
          path="/engenharia/dashboard"
          element={
            <RotaProtegida perm="dashboard_ssos">
              <SolicitacoesServicosProvider>
                <OrdensServicoProvider>
                  <OrcamentosProvider>
                    <DashboardSSOSPage />
                  </OrcamentosProvider>
                </OrdensServicoProvider>
              </SolicitacoesServicosProvider>
            </RotaProtegida>
          }
        />
        <Route
          path="/engenharia/dashboard-solicitacoes"
          element={
            <RotaProtegida perm="solicitacao_servicos">
              <SolicitacoesServicosProvider>
                <OrdensServicoProvider>
                  <OrcamentosProvider>
                    <DashboardSolicitacoesPage />
                  </OrcamentosProvider>
                </OrdensServicoProvider>
              </SolicitacoesServicosProvider>
            </RotaProtegida>
          }
        />
        <Route path="/engenharia/contratos-terceiros" element={<RotaProtegida perm="medicoes"><ContratosTerceirosPage /></RotaProtegida>} />
        <Route path="/engenharia/medicoes" element={<RotaProtegida perm="medicoes"><MedicoesProvider><MedicoesServicosPage /></MedicoesProvider></RotaProtegida>} />

        <Route path="/patrimonio/ferramentas" element={<RotaProtegida perm="ferramentas"><FerramentasPage /></RotaProtegida>} />
        <Route path="/qualidade/evidencias" element={<RotaProtegida perm="evidencias"><EvidenciasPage /></RotaProtegida>} />
        <Route path="/qualidade/checklists" element={<RotaProtegida perm="checklists"><ChecklistsPage /></RotaProtegida>} />
        <Route path="/cadastros/equipamentos" element={<RotaProtegida perm="equipamentos"><EquipamentosPage /></RotaProtegida>} />
        <Route path="/pmoc" element={<RotaProtegida perm="pmoc"><PmocPage /></RotaProtegida>} />
        <Route path="/pmoc/gerenciar-operacao" element={<RotaProtegida perm="pmoc"><PmocGerenciarOperacaoPage /></RotaProtegida>} />
        <Route path="/engenharia/plano-manutencao" element={<RotaProtegida perm="plano_manutencao"><PlanoManutencaoPage /></RotaProtegida>} />
        <Route path="/engenharia/base-conhecimento" element={<RotaProtegida perm="base_conhecimento"><BaseConhecimentoPage /></RotaProtegida>} />
        <Route path="/cadastros/categorias-servicos" element={<RotaProtegida perm="categorias_servicos"><CategoriasServicosPage /></RotaProtegida>} />
        <Route path="/cadastros/servicos" element={<RotaProtegida perm="servicos"><ServicosPage /></RotaProtegida>} />
        <Route path="/cadastros/modelos-os" element={<RotaProtegida><OsModelosPage /></RotaProtegida>} />
        <Route
          path="/engenharia/solicitacao-servicos"
          element={
            <RotaProtegida perm="solicitacao_servicos">
              <SolicitacoesServicosProvider>
                <OrdensServicoProvider>
                  <OrcamentosProvider>
                    <SolicitacaoServicosPage />
                  </OrcamentosProvider>
                </OrdensServicoProvider>
              </SolicitacoesServicosProvider>
            </RotaProtegida>
          }
        />
        <Route
          path="/engenharia/aprovar-lote-ss"
          element={
            <RotaProtegida perm="solicitacao_servicos">
              <SolicitacoesServicosProvider>
                <OrdensServicoProvider>
                  <AprovarLoteSS />
                </OrdensServicoProvider>
              </SolicitacoesServicosProvider>
            </RotaProtegida>
          }
        />
        <Route
          path="/engenharia/assinar-lote-os"
          element={
            <RotaProtegida perm="ordem_servico">
              <OrdensServicoProvider>
                <AssinarLoteOsPage />
              </OrdensServicoProvider>
            </RotaProtegida>
          }
        />
        <Route
          path="/engenharia/confirmar-lote-os"
          element={
            <RotaProtegida perm="ordem_servico">
              <SolicitacoesServicosProvider>
                <OrdensServicoProvider>
                  <ConfirmarLoteOsPage />
                </OrdensServicoProvider>
              </SolicitacoesServicosProvider>
            </RotaProtegida>
          }
        />
        <Route
          path="/engenharia/validar-lote-os"
          element={
            <RotaProtegida perm="ordem_servico">
              <OrdensServicoProvider>
                <ValidarLoteOsPage />
              </OrdensServicoProvider>
            </RotaProtegida>
          }
        />
        <Route
          path="/engenharia/imprimir-lote-os"
          element={
            <RotaProtegida perm="ordem_servico">
              <OrdensServicoProvider>
                <ImprimirLoteOsPage />
              </OrdensServicoProvider>
            </RotaProtegida>
          }
        />
        <Route
          path="/engenharia/ordem-servico"
          element={
            <RotaProtegida perm="ordem_servico">
              <OrdensServicoProvider>
                <OrcamentosProvider>
                  <OrdensServicoPage />
                </OrcamentosProvider>
              </OrdensServicoProvider>
            </RotaProtegida>
          }
        />
        <Route path="/engenharia/rdo" element={<RotaProtegida perm="rdo"><RdoPage /></RotaProtegida>} />
        <Route path="/engenharia/cronograma" element={<RotaProtegida perm="cronograma"><CronogramaPage /></RotaProtegida>} />
        <Route path="/engenharia/eventograma" element={<RotaProtegida perm="eventograma"><EventogramaPage /></RotaProtegida>} />
        <Route path="/obras/bim" element={<RotaProtegida perm="bim"><BimPage /></RotaProtegida>} />
        <Route path="/engenharia/responsaveis-tecnicos" element={<RotaProtegida perm="responsaveis_tecnicos"><ResponsaveisTecnicosPage /></RotaProtegida>} />
        <Route path="/cadastros/responsaveis-tecnicos" element={<RotaProtegida perm="responsaveis_tecnicos"><ResponsaveisTecnicosPage /></RotaProtegida>} />
        <Route path="/comunicacao/mensagens" element={<RotaProtegida perm="comunicacao_mensagens"><ComunicacaoMensagensPage /></RotaProtegida>} />
        <Route path="/comunicacao/avisos" element={<RotaProtegida perm="comunicacao_avisos"><ComunicacaoAvisosPage /></RotaProtegida>} />
        <Route path="/comunicacao/notificacoes" element={<RotaProtegida perm="comunicacao_notificacoes"><ComunicacaoNotificacoesPage /></RotaProtegida>} />
        <Route path="/comunicacao/whatsapp" element={<RotaProtegida perm="comunicacao_whatsapp"><ComunicacaoWhatsappPage /></RotaProtegida>} />
        <Route path="/juridico" element={<RotaProtegida perm="juridico"><JuridicoPage /></RotaProtegida>} />
        <Route path="/chat-duda" element={<RotaProtegida perm="chat_duda"><ChatDudaPage /></RotaProtegida>} />
        <Route path="/orcamentos" element={<RotaProtegida perm="orcamentos_sco"><OrcamentosSco /></RotaProtegida>} />
        <Route path="/orcamentos/novo" element={<RotaProtegida perm="orcamentos_sco"><OrcamentoScoForm /></RotaProtegida>} />
        <Route path="/orcamentos/:id" element={<RotaProtegida perm="orcamentos_sco"><OrcamentoScoForm /></RotaProtegida>} />
        <Route path="/orcamentos/catalogo" element={<RotaProtegida perm="orcamentos_sco"><CatalogoSco /></RotaProtegida>} />
        <Route path="/orcamentos/importar-catalogo" element={<RotaProtegida perm="orcamentos_sco"><ImportarCatalogoSco /></RotaProtegida>} />
        <Route path="/financeiro/dashboard" element={<RotaProtegida perm="financeiro.dashboard"><DashboardFinanceiro /></RotaProtegida>} />
        <Route path="/financeiro/contas-pagar" element={<RotaProtegida perm="financeiro.contas_pagar"><ContasPagar /></RotaProtegida>} />
        <Route path="/financeiro/contas-receber" element={<RotaProtegida perm="financeiro.contas_receber"><ContasReceber /></RotaProtegida>} />
        <Route path="/financeiro/contas-bancarias" element={<RotaProtegida perm="financeiro.contas_bancarias"><ContasBancarias /></RotaProtegida>} />
        <Route path="/financeiro/plano-contas" element={<RotaProtegida perm="financeiro.plano_contas"><PlanoContas /></RotaProtegida>} />
        <Route path="/financeiro/centros-custo" element={<RotaProtegida perm="financeiro.centros_custo"><CentrosCusto /></RotaProtegida>} />
        <Route path="/financeiro/fluxo-caixa" element={<RotaProtegida perm="financeiro.fluxo_caixa"><FluxoCaixa /></RotaProtegida>} />
        <Route path="/financeiro/dre" element={<RotaProtegida perm="financeiro.dre"><Dre /></RotaProtegida>} />
        <Route path="/financeiro/conciliacao" element={<RotaProtegida perm="financeiro.conciliacao"><Conciliacao /></RotaProtegida>} />
        <Route path="/financeiro/lancamentos" element={<RotaProtegida perm="financeiro.lancamentos"><Lancamentos /></RotaProtegida>} />
        <Route path="/financeiro/relatorios" element={<RotaProtegida perm="financeiro.relatorios"><RelatoriosFinanceiros /></RotaProtegida>} />
        <Route path="/financeiro/condicoes-pagamento" element={<RotaProtegida perm="financeiro.condicoes_pagamento"><CondicoesPagamento /></RotaProtegida>} />
        <Route path="/financeiro/nfes-recebidas" element={<RotaProtegida perm="financeiro.nfes_recebidas"><NfesRecebidas /></RotaProtegida>} />
        <Route path="/financeiro/nfse" element={<RotaProtegida perm="financeiro.nfes_recebidas"><NfseEmitir /></RotaProtegida>} />
        <Route
          path="/gerencial/relatorios"
          element={
            <RotaProtegida perm="gerencial_relatorios">
              <SolicitacoesServicosProvider>
                <OrdensServicoProvider>
                  <RelatoriosGerenciais />
                </OrdensServicoProvider>
              </SolicitacoesServicosProvider>
            </RotaProtegida>
          }
        />
        <Route
          path="/gerencial/dashboard"
          element={
            <RotaProtegida perm="gerencial_dashboard">
              <SolicitacoesServicosProvider>
                <OrdensServicoProvider>
                  <DashboardMultisistemico />
                </OrdensServicoProvider>
              </SolicitacoesServicosProvider>
            </RotaProtegida>
          }
        />
        <Route
          path="/gerencial/multidimensional"
          element={
            <RotaProtegida perm="gerencial_multidim">
              <SolicitacoesServicosProvider>
                <OrdensServicoProvider>
                  <RelatoriosMultidimensional />
                </OrdensServicoProvider>
              </SolicitacoesServicosProvider>
            </RotaProtegida>
          }
        />
        <Route
          path="/gerencial/mapa-clientes"
          element={
            <RotaProtegida perm="gerencial_mapa_clientes">
              <MapaClientes />
            </RotaProtegida>
          }
        />
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
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />
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
    <EpisCatalogoProvider>
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
    <PregaoProvider>
    <PerfisAcessoProvider>
    <EmpresaProvider>
    <LicitacoesProvider>
    <MedicoesProvider>
    <FerramentasProvider>
    <EvidenciasProvider>
    <ChecklistsProvider>
    <EquipamentosProvider>
    <LaudosCondenacaoProvider>
    <PmocProvider>
    <CategoriasServicosProvider>
    <ServicosProvider>
    <OsModelosProvider>
    <ComunicacaoProvider>
    <ProcessosTrabalhalistasProvider>
    <ResponsaveisTecnicosProvider>
    <PlanosManutencaoProvider>
    <KnowledgeBaseProvider>
    <ObrasProvider>
    <RdosProvider>
    <RdoAssinaturasProvider>
    <CronogramasProvider>
    <EventogramasProvider>
    <BimProvider>
    <OrcamentosScoProvider>
    <OsAssinaturasProvider>
    <PcAssinaturasProvider>
    <FinanceiroProvider>
    <NfsesProvider>
    <AuthProvider> {/* auth wrapper */}
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/cotacao/proposta/:token" element={<PropostaFornecedorPage />} />
          <Route path="/portal-fornecedor" element={<PortalFornecedorPage />} />
          <Route path="/portal-fornecedor/pregao/:id/sala" element={<PregaoSalaFornecedorPage />} />
          <Route path="/unsubscribe" element={<UnsubscribePage />} />
          <Route path="/portal-candidato/:processoId/:candidatoId" element={<PortalCandidato />} />
          <Route path="/equipamento/:id" element={<EquipamentoPublico />} />
          <Route path="/instalar" element={<Instalar />} />
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
    </NfsesProvider>
    </FinanceiroProvider>
    </PcAssinaturasProvider>
    </OsAssinaturasProvider>
    </OrcamentosScoProvider>
    </BimProvider>
    </EventogramasProvider>
    </CronogramasProvider>
    </RdoAssinaturasProvider>
    </RdosProvider>
    </ObrasProvider>
    </KnowledgeBaseProvider>
    </PlanosManutencaoProvider>
    </ResponsaveisTecnicosProvider>
    </ProcessosTrabalhalistasProvider>
    </ComunicacaoProvider>
    </OsModelosProvider>
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
    </PregaoProvider>
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
    </EpisCatalogoProvider>
    </CargosProvider>
    </ClientesProvider>
  </QueryClientProvider>
);

export default App;