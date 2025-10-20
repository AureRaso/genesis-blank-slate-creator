/**
 * OwnerLayout
 *
 * Layout especial para owners del SaaS con sidebar.
 * Usa la misma estructura que AppLayout pero con opciones de owner.
 */

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import OwnerSidebar from "./OwnerSidebar";
import { useLocation } from "react-router-dom";

interface OwnerLayoutProps {
  children: React.ReactNode;
}

export const OwnerLayout = ({ children }: OwnerLayoutProps) => {
  const location = useLocation();

  const getBreadcrumbInfo = () => {
    const path = location.pathname;
    switch (path) {
      case "/owner":
        return { title: "Dashboard", path: "/owner" };
      case "/owner/clubs":
        return { title: "Clubes", path: "/owner/clubs" };
      case "/owner/users":
        return { title: "Usuarios", path: "/owner/users" };
      case "/owner/metrics":
        return { title: "Métricas", path: "/owner/metrics" };
      case "/owner/system":
        return { title: "Sistema", path: "/owner/system" };
      case "/owner/settings":
        return { title: "Configuración", path: "/owner/settings" };
      default:
        return { title: "Dashboard", path: "/owner" };
    }
  };

  const breadcrumb = getBreadcrumbInfo();

  return (
    <SidebarProvider>
      <OwnerSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/owner">Panel de Owner</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{breadcrumb.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default OwnerLayout;
