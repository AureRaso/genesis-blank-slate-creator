/**
 * OwnerSidebar
 *
 * Sidebar personalizado para owners del SaaS con opciones de administración.
 */

import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  BarChart3,
  Shield
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";
import UserMenu from "@/components/UserMenu";
import PadeLockLogo from "@/assets/PadeLock_D5Red.png";

const OwnerSidebar = () => {
  const location = useLocation();

  return (
    <Sidebar variant="inset" className="w-64">
      <SidebarHeader className="flex items-center justify-center py-3">
        <Link to="/owner" className="flex items-center justify-center">
          <img src={PadeLockLogo} alt="PadeLock" className="w-30 h-20 object-contain" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {/* Dashboard */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === "/owner"}
              >
                <Link to="/owner">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Clubes */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === "/owner/clubs"}
              >
                <Link to="/owner/clubs">
                  <Building2 className="h-4 w-4" />
                  <span>Clubes</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Usuarios */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === "/owner/users"}
              >
                <Link to="/owner/users">
                  <Users className="h-4 w-4" />
                  <span>Usuarios</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Métricas */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === "/owner/metrics"}
              >
                <Link to="/owner/metrics">
                  <BarChart3 className="h-4 w-4" />
                  <span>Métricas</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Sistema */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === "/owner/system"}
              >
                <Link to="/owner/system">
                  <Shield className="h-4 w-4" />
                  <span>Sistema</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Configuración */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === "/owner/settings"}
              >
                <Link to="/owner/settings">
                  <Settings className="h-4 w-4" />
                  <span>Configuración</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-0">
        {/* Badge de Owner */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gradient-to-br from-playtomic-orange to-orange-600"></div>
            <span className="font-semibold text-sm text-slate-700">Panel de Administración</span>
          </div>
        </div>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
};

export default OwnerSidebar;
