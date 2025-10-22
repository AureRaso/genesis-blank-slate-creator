
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import AppSidebar from "./AppSidebar";
import Footer from "./Footer";
import MobileTabBar from "./MobileTabBar";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings } from "lucide-react";
import PadeLockLogo from "@/assets/PadeLock_D5Red.png";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const authContext = useAuth();
  const isPlayer = authContext?.isPlayer || false;
  const isTrainer = authContext?.isTrainer || false;
  const isGuardian = authContext?.isGuardian || false;
  const { profile, signOut } = useAuth();

  const getBreadcrumbInfo = () => {
    const path = location.pathname;
    switch (path) {
      case "/dashboard":
      case "/dashboard/":
        return { title: "Dashboard", path: "/dashboard" };
      case "/dashboard/players":
        return { title: "Jugadores", path: "/dashboard/players" };
      case "/dashboard/clubs":
        return { title: "Clubs", path: "/dashboard/clubs" };
      case "/dashboard/classes":
        return { title: "Clases", path: "/dashboard/classes" };
      case "/dashboard/leagues":
        return { title: "Ligas", path: "/dashboard/leagues" };
      case "/dashboard/matches":
        return { title: "Partidos", path: "/dashboard/matches" };
      case "/dashboard/standings":
        return { title: "Clasificaciones", path: "/dashboard/standings" };
      case "/dashboard/league-players":
        return { title: "Inscripciones", path: "/dashboard/league-players" };
      case "/dashboard/payment-control":
        return { title: "Control de Pagos", path: "/dashboard/payment-control" };
      case "/dashboard/scheduled-classes":
        return { title: "Clases Programadas", path: "/dashboard/scheduled-classes" };
      case "/dashboard/trainers":
        return { title: "Profesores", path: "/dashboard/trainers" };
      case "/dashboard/waitlist-notifications":
        return { title: "Notificaciones", path: "/dashboard/waitlist-notifications" };
      case "/dashboard/today-attendance":
        return { title: "Asistencia de hoy", path: "/dashboard/today-attendance" };
      default:
        return { title: "Dashboard", path: "/dashboard" };
    }
  };

  const breadcrumbInfo = getBreadcrumbInfo();

  // Layout for players, trainers, and guardians - Mobile-first with tab bar
  if (isPlayer || isTrainer || isGuardian) {
    return (
      <>
        <div className="flex min-h-screen w-full flex-col">
          {/* Mobile Header - Only visible on mobile */}
          <header className="md:hidden flex h-14 shrink-0 items-center justify-between px-4 border-b bg-sidebar shadow-sm sticky top-0 z-40">
            <Link to="/dashboard" className="flex items-center">
              <img src={PadeLockLogo} alt="PadeLock" className="h-10 object-contain" />
            </Link>

            {/* Mobile User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-primary text-white">
                    <span className="text-sm font-semibold">
                      {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{profile?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <div className="flex flex-1 min-h-0">
            {/* Sidebar - Hidden on mobile, visible on desktop */}
            <div className="hidden md:block">
              <AppSidebar />
            </div>

            <SidebarInset className="flex flex-col flex-1 min-h-screen w-full">
              {/* Desktop Header - Hidden on mobile */}
              <header className="hidden md:flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
                <div className="flex items-center gap-2 px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink asChild>
                          <Link to="/dashboard">
                            PadeLock
                          </Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{breadcrumbInfo.title}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
              </header>

              {/* Main Content */}
              <div className="flex-1 w-full md:p-0">
                {children}
              </div>
            </SidebarInset>
          </div>
        </div>

        {/* Mobile Tab Bar - Only visible on mobile */}
        <MobileTabBar />
      </>
    );
  }

  // Layout for admins - Original layout
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset className="flex flex-col flex-1 min-h-screen">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link to="/dashboard">
                      PadeLock
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{breadcrumbInfo.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
        <Footer />
      </SidebarInset>
    </div>
  );
};

export default AppLayout;
