
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
      action: () => navigate("/leagues")
    }] : []),
    {
      title: "Gestionar Jugadores",
      description: "Ver y administrar jugadores registrados",
      icon: Users,
      action: () => navigate("/players")
    },
    {
      title: "Gestionar Entrenadores",
      description: "Ver y administrar entrenadores del club",
      icon: UserCheck,
      action: () => navigate("/trainers")
    },
    {
      title: "Programar Clases",
      description: "Configurar clases de entrenamiento",
      icon: GraduationCap,
      action: () => navigate("/scheduled-classes")
    }
  ];

  const playerActions = [
    ...(leaguesEnabled ? [{
      title: "Crear Liga",
      description: "Configura una nueva liga de pádel",
      icon: Plus,
      action: () => navigate("/leagues")
    }] : []),
    {
      title: "Ver Jugadores",
      description: "Ver jugadores del club",
      icon: Users,
      action: () => navigate("/players")
    },
    {
      title: "Mis Clases",
      description: "Ver mis clases programadas",
      icon: GraduationCap,
      action: () => navigate("/scheduled-classes")
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
        <div className="grid grid-cols-3 gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                onClick={action.action}
                className="h-auto p-4 flex flex-col items-center space-y-2 bg-muted hover:bg-muted/80 text-foreground border"
              >
                <Icon className="h-6 w-6" />
                <span className="font-semibold text-sm text-center">{action.title}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
