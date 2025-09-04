import { Link } from "react-router-dom";
import { Building2, Calendar, GraduationCap, LogOut, SquareTerminal, Trophy, UserCheck, Users, Zap, Bell, CreditCard } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useWaitlistCount } from "@/hooks/useWaitlistCount";
import { useTranslation } from "react-i18next";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
const AppSidebar = () => {
  const authContext = useAuth();
  const { data: waitlistCount = 0 } = useWaitlistCount();
  const { t } = useTranslation();
  const { leagues: leaguesEnabled, matches: matchesEnabled } = useFeatureFlags();

  // Provide safe defaults if auth context is not available
  const {
    isAdmin = false,
    isTrainer = false,
    isPlayer = false
  } = authContext || {};

  // Si es trainer, mostrar panel personalizado con clases programadas
  if (isTrainer) {
    return <Sidebar variant="inset" className="w-56">
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
                    <span>{t('sidebar.dashboard')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/scheduled-classes">
                    <Calendar />
                    <span>{t('sidebar.scheduledClasses')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/waitlist-notifications">
                    <Bell className="h-4 w-4" />
                    <span>{t('sidebar.waitlistNotifications')}</span>
                    {waitlistCount > 0 && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        {waitlistCount}
                      </Badge>
                    )}
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
    const playerNavItems = [
      {
        title: t('sidebar.dashboard'),
        url: "/",
        icon: SquareTerminal,
        isActive: true
      },
      ...(leaguesEnabled ? [{
        title: t('sidebar.leagues'),
        url: "/leagues",
        icon: Trophy
      }] : []),
      {
        title: t('sidebar.scheduledClasses'),
        url: "/scheduled-classes",
        icon: Calendar
      },
      {
        title: t('sidebar.clubs'),
        url: "/clubs",
        icon: Building2
      }
    ];
    return <Sidebar variant="inset" className="w-56">
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
                     <span>{t('auth.signOut')}</span>
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

  // Panel para administradores con feature flags
  const data = {
    navMain: [
      {
        title: t('sidebar.dashboard'),
        url: "/",
        icon: SquareTerminal,
        isActive: true
      },
      ...(leaguesEnabled ? [{
        title: t('sidebar.leagues'),
        url: "/leagues",
        icon: Trophy
      }] : []),
      ...(matchesEnabled ? [{
        title: t('sidebar.matches'),
        url: "/matches",
        icon: Zap
      }] : []),
      {
        title: t('sidebar.scheduledClasses'),
        url: "/scheduled-classes",
        icon: Calendar
      },
      {
        title: "Control de Pagos",
        url: "/payment-control",
        icon: CreditCard
      },
      {
        title: t('sidebar.players'),
        url: "/players",
        icon: Users
      },
      {
        title: t('sidebar.trainers'),
        url: "/trainers",
        icon: UserCheck
      },
      {
        title: t('sidebar.clubs'),
        url: "/clubs",
        icon: Building2
      }
    ]
  };
  return <Sidebar variant="inset" className="w-56">
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
                  <span>{t('auth.signOut')}</span>
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
