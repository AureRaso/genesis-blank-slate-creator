
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <Card>
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
        <CardDescription>
          {isAdmin ? "Gestiona tu liga de pádel" : "Participa en las actividades"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                onClick={action.action}
                className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 bg-muted hover:bg-muted/80 text-foreground border"
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="font-semibold text-xs sm:text-sm text-center leading-tight">{action.title}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
