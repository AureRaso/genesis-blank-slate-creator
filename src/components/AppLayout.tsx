
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import AppSidebar from "./AppSidebar";
import { useLocation, Link } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  
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
      default:
        return { title: "Dashboard", path: "/dashboard" };
    }
  };

  const breadcrumbInfo = getBreadcrumbInfo();

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link to="/dashboard">
                      PadelApp
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
      </SidebarInset>
    </div>
  );
};

export default AppLayout;
