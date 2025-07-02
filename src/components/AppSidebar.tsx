import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Calendar,
  GraduationCap,
  ListChecks,
  Settings,
  SquareTerminal,
  Trophy,
  User,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";

const AppSidebar = () => {
  const { isAdmin, isTrainer } = useAuth();

  // Si es trainer, mostrar solo el dashboard
  if (isTrainer) {
    return (
      <Sidebar variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <UserCheck className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Padel Pro</span>
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
                    <Calendar />
                    <span>Mi Calendario</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <UserMenu />
        </SidebarFooter>
      </Sidebar>
    );
  }

  const data = {
    navAccount: [
      {
        title: "Mi Perfil",
        url: "/profile",
        icon: User,
      },
      {
        title: "Ajustes",
        url: "/settings",
        icon: Settings,
      },
    ],
    navMain: [
      {
        title: "Dashboard",
        url: "/",
        icon: SquareTerminal,
        isActive: true,
      },
      {
        title: "Ligas",
        url: "/leagues",
        icon: Trophy,
        items: [
          {
            title: "Ver Ligas",
            url: "/leagues",
          },
          {
            title: "Clasificación",
            url: "/standings",
          },
        ],
      },
      {
        title: "Partidos",
        url: "/matches",
        icon: Zap,
      },
      {
        title: "Clases",
        url: "/classes",
        icon: GraduationCap,
      },
      {
        title: "Jugadores",
        url: "/players",
        icon: Users,
      },
      {
        title: "Profesores",
        url: "/trainers",
        icon: UserCheck,
      },
      {
        title: "Clubs",
        url: "/clubs",
        icon: Building2,
      },
    ],
    navMisc: [
      {
        title: "Listados",
        url: "/listings",
        icon: ListChecks,
      },
    ],
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <SquareTerminal className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Padel Pro</span>
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
            {data.navMain.map((item) => {
              if (item.items) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    <SidebarMenu indent>
                      {item.items.map((subItem) => (
                        <SidebarMenuItem key={subItem.title}>
                          <SidebarMenuButton asChild>
                            <Link to={subItem.url}>{subItem.title}</Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarMenuItem>
                );
              }

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Misc</SidebarGroupLabel>
          <SidebarMenu>
            {data.navMisc.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link to={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
