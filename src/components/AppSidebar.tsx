import { Link } from "react-router-dom";
import { Building2, Calendar, GraduationCap, LogOut, SquareTerminal, Trophy, UserCheck, Users, Zap } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
const AppSidebar = () => {
  const authContext = useAuth();

  // Provide safe defaults if auth context is not available
  const {
    isAdmin = false,
    isTrainer = false,
    isPlayer = false
  } = authContext || {};

  // Si es trainer, mostrar panel personalizado con clases programadas
  if (isTrainer) {
    return <Sidebar variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <UserCheck className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">PadeLock</span>
                    <span className="truncate text-xs">Panel Profesor</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Mis Clases</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/">
                    <GraduationCap />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/scheduled-classes">
                    <Calendar />
                    <span>Clases Programadas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <UserMenu />
        </SidebarFooter>
      </Sidebar>;
  }

  // Si es jugador, mostrar panel personalizado sin profesores
  if (isPlayer) {
    const playerNavItems = [{
      title: "Dashboard",
      url: "/",
      icon: SquareTerminal,
      isActive: true
    }, {
      title: "Ligas",
      url: "/leagues",
      icon: Trophy
    }, {
      title: "Partidos",
      url: "/matches",
      icon: Zap
    }, {
      title: "Clases",
      url: "/classes",
      icon: GraduationCap
    }, {
      title: "Jugadores",
      url: "/players",
      icon: Users
    }, {
      title: "Clubs",
      url: "/clubs",
      icon: Building2
    }];
    return <Sidebar variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Users className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">PadeLock</span>
                    <span className="truncate text-xs">Panel Jugador</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegación</SidebarGroupLabel>
            <SidebarMenu>
              {playerNavItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Cuenta</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/logout">
                    <LogOut />
                    <span>Cerrar Sesión</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <UserMenu />
        </SidebarFooter>
      </Sidebar>;
  }

  // Panel para administradores (mantener funcionalidad original)
  const data = {
    navMain: [{
      title: "Dashboard",
      url: "/",
      icon: SquareTerminal,
      isActive: true
    }, {
      title: "Ligas",
      url: "/leagues",
      icon: Trophy
    }, {
      title: "Partidos",
      url: "/matches",
      icon: Zap
    }, {
      title: "Clases",
      url: "/classes",
      icon: GraduationCap
    }, {
      title: "Clases Programadas",
      url: "/scheduled-classes",
      icon: Calendar
    }, {
      title: "Jugadores",
      url: "/players",
      icon: Users
    }, {
      title: "Profesores",
      url: "/trainers",
      icon: UserCheck
    }, {
      title: "Clubs",
      url: "/clubs",
      icon: Building2
    }]
  };
  return <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <SquareTerminal className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">PadeLock</span>
                  <span className="truncate text-xs">Panel Administrador</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarMenu>
            {data.navMain.map(item => <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link to={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>)}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Cuenta</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/logout">
                  <LogOut />
                  <span>Cerrar Sesión</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>;
};
export default AppSidebar;
