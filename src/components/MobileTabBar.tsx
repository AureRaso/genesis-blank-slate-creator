import { Link, useLocation } from "react-router-dom";
import { Home, CreditCard, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileTabBar = () => {
  const location = useLocation();

  const tabs = [
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
    {
      name: "Configuración",
      path: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg md:hidden">
      <div className="grid grid-cols-3 h-16">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive && "scale-110"
                )}
              />
              <span className="text-xs font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileTabBar;
