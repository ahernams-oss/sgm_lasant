import { ClipboardList, Users, Briefcase, UserCheck, Shield, LogOut, ClipboardCheck, Truck, LayoutDashboard, CalendarClock, FileSpreadsheet, DollarSign, ShoppingCart, Tags, Package, BarChart3, Scale, FileCheck, PackageCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logoLasant from "@/assets/Logo_Lasant.png";
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
      { title: "Mapa de Funcionários", url: "/mapa-funcionarios", icon: CalendarClock },
    ],
  },
  {
    group: "Compras e Suprimentos",
    items: [
      { title: "Dashboard Compras", url: "/compras/dashboard", icon: BarChart3 },
      { title: "Requisições de Compras", url: "/compras/requisicoes", icon: ShoppingCart },
      { title: "Cotações", url: "/compras/cotacoes", icon: Scale },
      { title: "Pedidos de Compra", url: "/compras/pedidos", icon: FileCheck },
      { title: "Recebimento", url: "/compras/recebimento", icon: PackageCheck },
      { title: "Categorias de Compras", url: "/compras/categorias", icon: Tags },
      { title: "Materiais e Serviços", url: "/compras/materiais", icon: Package },
    ],
  },
  {
    group: "Cadastros",
    items: [
      { title: "Clientes", url: "/clientes", icon: Users },
      { title: "Fornecedores", url: "/fornecedores", icon: Truck },
      { title: "Cargos", url: "/cargos", icon: Briefcase },
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
          <img src={logoLasant} alt="Lasant Construções" className="h-8 w-auto shrink-0" />
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-[10px] text-muted-foreground truncate">
                SGM
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-sidebar-accent/50"
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
        </SidebarMenu>

        {usuarioLogado && (
          <div className="px-3 pb-3 pt-1">
            <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/50 px-3 py-2">
              <div className="flex-1 min-w-0">
                {!collapsed && (
                  <>
                    <p className="text-xs font-medium text-sidebar-foreground truncate">
                      {usuarioLogado.nome}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {usuarioLogado.email}
                    </p>
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