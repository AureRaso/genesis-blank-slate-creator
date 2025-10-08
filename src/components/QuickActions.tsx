
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
    <Card className="border-primary/10 hover:border-primary/20 transition-colors h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          Acciones Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.action}
                className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 p-3 border border-primary/20 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] text-left"
              >
                {/* Decorative background element */}
                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-primary/10 blur-xl group-hover:bg-primary/20 transition-colors duration-300" />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="p-2 rounded-lg bg-white shadow-sm w-fit mb-2 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-xs text-foreground mb-0.5 group-hover:text-primary transition-colors leading-tight">
                      {action.title}
                    </h3>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
