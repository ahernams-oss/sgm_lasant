import {
  ClipboardList,
  Users,
  Briefcase,
  UserCheck,
  Shield,
  LogOut,
  ClipboardCheck,
  Truck,
  LayoutDashboard,
  CalendarClock,
  FileSpreadsheet,
  DollarSign,
  ShoppingCart,
  Tags,
  Package,
  BarChart3,
  Scale,
  FileCheck,
  PackageCheck,
  Factory,
  Warehouse,
  KeyRound,
  Building2,
  HardHat,
  Stethoscope,
  FileBarChart,
  Gavel,
  Ruler,
  Wrench,
  ShieldCheck,
  Monitor,
  Fan,
  MessageSquare,
  Megaphone,
  Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    group: "Gestão de Pessoas",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Requisição de Colaboradores", url: "/", icon: ClipboardList },
      { title: "Processos Seletivos", url: "/processos-seletivos", icon: ClipboardCheck },
      { title: "Funcionários", url: "/funcionarios", icon: UserCheck },
      { title: "EPIs", url: "/epis", icon: HardHat },
      { title: "Exames Periódicos", url: "/exames", icon: Stethoscope },
      { title: "Mapa de Funcionários", url: "/mapa-funcionarios", icon: CalendarClock },
    ],
  },
  {
    group: "Patrimônio",
    items: [{ title: "Ferramentas", url: "/patrimonio/ferramentas", icon: Wrench }],
  },
  {
    group: "Engenharia",
    items: [
      { title: "Dashboard Engenharia", url: "/engenharia/dashboard", icon: BarChart3 },
      { title: "Medição de Serviços", url: "/engenharia/medicoes", icon: Ruler },
      { title: "Solicitação de Serviços", url: "/engenharia/solicitacao-servicos", icon: ClipboardList },
      { title: "Ordem de Serviço", url: "/engenharia/ordem-servico", icon: Wrench },
    ],
  },
  {
    group: "Compras e Suprimentos",
    items: [
      { title: "Requisições de Compras", url: "/compras/requisicoes", icon: ShoppingCart },
      { title: "Cotações", url: "/compras/cotacoes", icon: Scale },
      { title: "Pedidos de Compra", url: "/compras/pedidos", icon: FileCheck },
      { title: "Recebimento", url: "/compras/recebimento", icon: PackageCheck },
      { title: "Estoque", url: "/compras/estoque", icon: Warehouse },
      { title: "Relatórios de Estoque", url: "/compras/relatorios-estoque", icon: FileBarChart },
      { title: "Materiais e Serviços", url: "/compras/materiais", icon: Package },
      { title: "Categorias de Compras", url: "/compras/categorias", icon: Tags },
      { title: "Fabricantes", url: "/compras/fabricantes", icon: Factory },
    ],
  },
  {
    group: "Licitações",
    items: [{ title: "Licitações", url: "/licitacoes", icon: Gavel }],
  },
  {
    group: "Comunicação",
    items: [
      { title: "Mensagens", url: "/comunicacao/mensagens", icon: MessageSquare },
      { title: "Avisos e Comunicados", url: "/comunicacao/avisos", icon: Megaphone },
      { title: "Notificações de Tarefas", url: "/comunicacao/notificacoes", icon: Bell },
    ],
  },
  {
    group: "PMOC",
    items: [{ title: "PMOC", url: "/pmoc", icon: Fan }],
  },
  {
    group: "Qualidade",
    items: [
      { title: "Registro de Evidências", url: "/qualidade/evidencias", icon: ShieldCheck },
      { title: "Checklists", url: "/qualidade/checklists", icon: ClipboardCheck },
    ],
  },
  {
    group: "Cadastros",
    items: [
      { title: "Dados da Empresa", url: "/empresa", icon: Building2 },
      { title: "Clientes", url: "/clientes", icon: Users },
      { title: "Equipamentos", url: "/cadastros/equipamentos", icon: Monitor },
      { title: "Fornecedores", url: "/fornecedores", icon: Truck },
      { title: "Cargos", url: "/cargos", icon: Briefcase },
      { title: "Categorias de Serviços", url: "/cadastros/categorias-servicos", icon: Tags },
      { title: "Serviços", url: "/cadastros/servicos", icon: Wrench },
      { title: "SCO", url: "/sco", icon: FileSpreadsheet },
      { title: "I0", url: "/i0", icon: DollarSign },
    ],
  },
];
export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { usuarioLogado, logout } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <img src="/ced07ef5-714e-4ba9-a157-840424788064.png" alt="Lasant Construções" className="h-8 w-auto shrink-0 object-fill rounded-lg opacity-100 mx-[7px]" />
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="truncate text-2xl my-0 mx-[6px] font-[serif] text-left text-secondary-foreground">SGM</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel className="font-bold">{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-sidebar-accent/50 font-semibold"
                        activeClassName="bg-sidebar-accent text-primary font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/usuarios"
                end
                className="hover:bg-sidebar-accent/50"
                activeClassName="bg-sidebar-accent text-primary font-medium"
              >
                <Shield className="mr-2 h-4 w-4" />
                {!collapsed && <span>Usuários</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/perfis-acesso"
                end
                className="hover:bg-sidebar-accent/50"
                activeClassName="bg-sidebar-accent text-primary font-medium"
              >
                <KeyRound className="mr-2 h-4 w-4" />
                {!collapsed && <span>Perfis de Acesso</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {usuarioLogado && (
          <div className="px-3 pb-3 pt-1">
            <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/50 px-3 py-2">
              <div className="flex-1 min-w-0">
                {!collapsed && (
                  <>
                    <p className="text-xs font-medium text-sidebar-foreground truncate">{usuarioLogado.nome}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{usuarioLogado.email}</p>
                  </>
                )}
              </div>
              <button
                onClick={logout}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
