import { Users, Trophy, Calendar, BarChart3, UserPlus, Home, Building2 } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import UserMenu from "./UserMenu";

const AppSidebar = () => {
  const { isAdmin } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";

  const mainItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
    {
      title: "Jugadores",
      url: "/players",
      icon: Users,
      adminOnly: true,
    },
    {
      title: "Clubs",
      url: "/clubs",
      icon: Building2,
      adminOnly: true,
    },
    {
      title: "Ligas",
      url: "/leagues",
      icon: Trophy,
      adminOnly: true,
    },
    {
      title: "Partidos",
      url: "/matches",
      icon: Calendar,
    },
    {
      title: "Clasificaciones",
      url: "/standings",
      icon: BarChart3,
    },
  ];

  const playerItems = [
    {
      title: "Inscripciones",
      url: "/league-players",
      icon: UserPlus,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center space-x-3 px-2">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                PadelApp
              </h2>
              <p className="text-xs text-muted-foreground">Liga de Pádel</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems
                .filter(item => !item.adminOnly || isAdmin)
                .map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Jugador</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {playerItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
