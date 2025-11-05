import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, CreditCard, Settings, Users, Calendar, ClipboardCheck, Tag, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useHasPromotions } from "@/hooks/usePromotions";

const MobileTabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isPlayer, isTrainer, isGuardian, isAdmin, profile } = useAuth();

  // Check if club has promotions
  const { data: hasPromotions = false } = useHasPromotions(profile?.club_id);

  // Tabs for players
  const playerTabs = [
    {
      name: "Inicio",
      path: "/dashboard",
      icon: Home,
    },
    {
      name: "Mis Pagos",
      path: "/dashboard/my-classes",
      icon: CreditCard,
    },
    ...(isGuardian ? [{
      name: "Mis Hijos",
      path: "/dashboard/my-children",
      icon: Users,
    }] : []),
    ...(hasPromotions ? [{
      name: "Promociones",
      path: "/dashboard/promotions",
      icon: Tag,
    }] : []),
  ];

  // Tabs for trainers
  const trainerTabs = [
    {
      name: "Inicio",
      path: "/dashboard",
      icon: Home,
    },
    {
      name: "Alumnos",
      path: "/dashboard/students",
      icon: Users,
    },
    {
      name: "Clases",
      action: () => {
        // Navegar directamente a la página de crear clase
        navigate("/dashboard/scheduled-classes/new");
      },
      icon: Calendar,
    },
    {
      name: "Asistencia",
      path: "/dashboard/today-attendance",
      icon: ClipboardCheck,
    },
  ];

  // Tabs for admins
  const adminTabs = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: Home,
    },
    {
      name: "Crear Clase",
      action: () => {
        // Navegar directamente a la página de crear clase
        navigate("/dashboard/scheduled-classes/new");
      },
      icon: Plus,
    },
    {
      name: "Asistencia",
      path: "/dashboard/today-attendance",
      icon: ClipboardCheck,
    },
  ];

  // Guardians use the same tabs as players
  const tabs = isAdmin ? adminTabs : isTrainer ? trainerTabs : playerTabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden w-full overflow-hidden">
      <div className="relative bg-primary shadow-2xl">
        {/* Decorative notch on the right side */}
        <div className="absolute -top-2 right-8 w-16 h-8 bg-primary rounded-b-full" />

        <div className="flex items-center justify-around h-20 px-4">
          {tabs.map((tab: any, index) => {
            const isActive = tab.path ? location.pathname === tab.path : false;
            const Icon = tab.icon;

            const content = (
              <>
                {/* Active background circle */}
                <div className="relative flex items-center justify-center w-12 h-12">
                  {isActive && (
                    <div className="absolute inset-0 bg-white/20 rounded-full transition-all duration-300" />
                  )}

                  {/* Icon */}
                  <Icon
                    className={cn(
                      "relative z-10 transition-all duration-300 ease-out",
                      isActive
                        ? "h-6 w-6 text-white drop-shadow-lg"
                        : "h-5 w-5 text-white/60"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-[10px] font-medium transition-all duration-300 mt-0.5",
                    isActive
                      ? "text-white"
                      : "text-white/60"
                  )}
                >
                  {tab.name}
                </span>
              </>
            );

            // Si tiene action, usar button; si tiene path, usar Link
            if (tab.action) {
              return (
                <button
                  key={index}
                  onClick={tab.action}
                  className={cn(
                    "relative flex flex-col items-center justify-center transition-all duration-300 ease-out",
                    "active:scale-95"
                  )}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  "relative flex flex-col items-center justify-center transition-all duration-300 ease-out",
                  "active:scale-95"
                )}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileTabBar;
