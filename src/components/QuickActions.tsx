
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Calendar, BarChart3, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const QuickActions = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const adminActions = [
    {
      title: "Crear Liga",
      description: "Configura una nueva liga de pádel",
      icon: Plus,
      action: () => navigate("/leagues"),
      color: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
    },
    {
      title: "Gestionar Jugadores",
      description: "Ver y administrar jugadores registrados",
      icon: Users,
      action: () => navigate("/players"),
      color: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
    },
    {
      title: "Programar Partidos",
      description: "Organizar calendario de partidos",
      icon: Calendar,
      action: () => navigate("/matches"),
      color: "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
    },
    {
      title: "Ver Estadísticas",
      description: "Analizar rendimiento de las ligas",
      icon: BarChart3,
      action: () => navigate("/standings"),
      color: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
    }
  ];

  const playerActions = [
    {
      title: "Inscribirse en Liga",
      description: "Únete a las ligas disponibles",
      icon: Plus,
      action: () => navigate("/league-players"),
      color: "bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
    },
    {
      title: "Mis Partidos",
      description: "Ver tus próximos partidos",
      icon: Calendar,
      action: () => navigate("/matches"),
      color: "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
    },
    {
      title: "Clasificaciones",
      description: "Ver tu posición en las ligas",
      icon: BarChart3,
      action: () => navigate("/standings"),
      color: "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                onClick={action.action}
                className={`h-auto p-4 flex flex-col items-start space-y-2 ${action.color} text-white`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="h-5 w-5" />
                  <span className="font-semibold">{action.title}</span>
                </div>
                <span className="text-sm opacity-90 text-left">
                  {action.description}
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
