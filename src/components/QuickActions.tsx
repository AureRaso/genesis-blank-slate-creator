
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Calendar, BarChart3, GraduationCap } from "lucide-react";
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
      color: "bg-gradient-to-r from-playtomic-green to-playtomic-green-dark hover:from-playtomic-green-dark hover:to-playtomic-green"
    },
    {
      title: "Gestionar Jugadores",
      description: "Ver y administrar jugadores registrados",
      icon: Users,
      action: () => navigate("/players"),
      color: "bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange"
    },
    {
      title: "Crear Clases",
      description: "Configurar clases de entrenamiento",
      icon: GraduationCap,
      action: () => navigate("/scheduled-classes"),
      color: "bg-gradient-to-r from-playtomic-orange-dark to-playtomic-orange hover:from-playtomic-orange to-playtomic-orange-dark"
    },
    {
      title: "Ver Estadísticas",
      description: "Analizar rendimiento de las ligas",
      icon: BarChart3,
      action: () => navigate("/standings"),
      color: "bg-gradient-to-r from-playtomic-green-dark to-playtomic-green hover:from-playtomic-green hover:to-playtomic-green-dark"
    }
  ];

  const playerActions = [
    {
      title: "Inscribirse en Liga",
      description: "Únete a las ligas disponibles",
      icon: Plus,
      action: () => navigate("/league-players"),
      color: "bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange"
    },
    {
      title: "Reservar Clases",
      description: "Apúntate a clases de entrenamiento",
      icon: GraduationCap,
      action: () => navigate("/classes"),
      color: "bg-gradient-to-r from-playtomic-green to-playtomic-green-dark hover:from-playtomic-green-dark hover:to-playtomic-green"
    },
    {
      title: "Mis Partidos",
      description: "Ver tus próximos partidos",
      icon: Calendar,
      action: () => navigate("/matches"),
      color: "bg-gradient-to-r from-playtomic-orange-dark to-playtomic-orange hover:from-playtomic-orange hover:to-playtomic-orange-dark"
    },
    {
      title: "Clasificaciones",
      description: "Ver tu posición en las ligas",
      icon: BarChart3,
      action: () => navigate("/standings"),
      color: "bg-gradient-to-r from-playtomic-green-dark to-playtomic-green hover:from-playtomic-green hover:to-playtomic-green-dark"
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
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
