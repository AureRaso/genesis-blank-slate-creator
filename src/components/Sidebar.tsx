
import { Users, Trophy, Calendar, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import UserMenu from "./UserMenu";

interface SidebarProps {
  currentView: "dashboard" | "players" | "leagues" | "matches" | "standings";
  onViewChange: (view: "dashboard" | "players" | "leagues" | "matches" | "standings") => void;
}

const Sidebar = ({ currentView, onViewChange }: SidebarProps) => {
  const menuItems = [
    {
      id: "dashboard" as const,
      label: "Dashboard",
      icon: BarChart3,
      color: "text-playtomic-orange"
    },
    {
      id: "players" as const,
      label: "Jugadores",
      icon: Users,
      color: "text-playtomic-green"
    },
    {
      id: "leagues" as const,
      label: "Ligas",
      icon: Trophy,
      color: "text-playtomic-orange-dark"
    },
    {
      id: "matches" as const,
      label: "Partidos",
      icon: Calendar,
      color: "text-playtomic-orange-light"
    },
    {
      id: "standings" as const,
      label: "Clasificación",
      icon: BarChart3,
      color: "text-playtomic-green-dark"
    }
  ];

  return (
    <div className="w-64 bg-white border-r border-playtomic-gray-200 shadow-lg flex flex-col">
      <div className="p-6 border-b border-playtomic-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark rounded-lg flex items-center justify-center">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark bg-clip-text text-transparent">
              PadeLock
            </h2>
            <p className="text-xs text-muted-foreground">Liga de Pádel</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left",
                isActive
                  ? "bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark text-white shadow-lg"
                  : "text-playtomic-gray-600 hover:bg-playtomic-gray-100 hover:text-playtomic-gray-900"
              )}
            >
              <Icon className={cn(
                "h-5 w-5",
                isActive ? "text-white" : item.color
              )} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-playtomic-gray-200">
        <UserMenu />
      </div>
    </div>
  );
};

export default Sidebar;
