
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Calendar, BarChart3, GraduationCap, UserCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

const QuickActions = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { leagues: leaguesEnabled } = useFeatureFlags();

  const adminActions = [
    ...(leaguesEnabled ? [{
      title: "Crear Liga",
      description: "Configura una nueva liga de pádel",
      icon: Plus,
      action: () => navigate("/dashboard/leagues")
    }] : []),
    {
      title: "Gestionar Jugadores",
      description: "Ver y administrar jugadores registrados",
      icon: Users,
      action: () => navigate("/dashboard/players")
    },
    {
      title: "Gestionar Entrenadores",
      description: "Ver y administrar entrenadores del club",
      icon: UserCheck,
      action: () => navigate("/dashboard/trainers")
    },
    {
      title: "Programar Clases",
      description: "Configurar clases de entrenamiento",
      icon: GraduationCap,
      action: () => navigate("/dashboard/scheduled-classes")
    }
  ];

  const playerActions = [
    ...(leaguesEnabled ? [{
      title: "Crear Liga",
      description: "Configura una nueva liga de pádel",
      icon: Plus,
      action: () => navigate("/dashboard/leagues")
    }] : []),
    {
      title: "Ver Jugadores",
      description: "Ver jugadores del club",
      icon: Users,
      action: () => navigate("/dashboard/players")
    },
    {
      title: "Mis Clases",
      description: "Ver mis clases programadas",
      icon: GraduationCap,
      action: () => navigate("/dashboard/scheduled-classes")
    }
  ];

  const actions = isAdmin ? adminActions : playerActions;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-white/90">
          <div className="p-1.5 rounded-lg bg-primary/20">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          Acciones Rápidas
        </h3>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.action}
                className="group relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm hover:bg-white/10 p-4 border border-white/10 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] text-left"
              >
                {/* Decorative background element */}
                <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-primary/10 blur-xl group-hover:bg-primary/20 transition-colors duration-300" />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="p-2.5 rounded-lg bg-primary/20 w-fit mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-white/90 mb-0.5 group-hover:text-white transition-colors leading-tight">
                      {action.title}
                    </h3>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
