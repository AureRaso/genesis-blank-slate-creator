
import { Package, LayoutDashboard, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentView: "dashboard" | "products" | "create";
  onViewChange: (view: "dashboard" | "products" | "create") => void;
}

const Sidebar = ({ currentView, onViewChange }: SidebarProps) => {
  const menuItems = [
    {
      id: "dashboard" as const,
      label: "Dashboard",
      icon: LayoutDashboard,
      color: "text-blue-600"
    },
    {
      id: "products" as const,
      label: "Productos",
      icon: Package,
      color: "text-green-600"
    },
    {
      id: "create" as const,
      label: "Crear Producto",
      icon: Plus,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ProductoApp
            </h2>
            <p className="text-xs text-muted-foreground">Gestión de inventario</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
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
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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

      <div className="absolute bottom-4 left-4 right-4">
        <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-all duration-200">
          <Settings className="h-5 w-5 text-gray-500" />
          <span className="font-medium">Configuración</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
