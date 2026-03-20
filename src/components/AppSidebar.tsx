import { ClipboardList, Users, Briefcase, UserCheck, Shield, LogOut } from "lucide-react";
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
      { title: "Requisição de Colaboradores", url: "/", icon: ClipboardList },
    ],
  },
  {
    group: "Cadastros",
    items: [
      { title: "Clientes", url: "/clientes", icon: Users },
      { title: "Cargos", url: "/cargos", icon: Briefcase },
      { title: "Funcionários", url: "/funcionarios", icon: UserCheck },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <img src={logoLasant} alt="Lasant Construções" className="h-8 w-auto shrink-0" />
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-[10px] text-muted-foreground truncate">
                Sistema de RH
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
      </SidebarFooter>
    </Sidebar>
  );
}