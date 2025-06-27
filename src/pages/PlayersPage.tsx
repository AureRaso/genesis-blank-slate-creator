
import PlayerForm from "@/components/PlayerForm";
import PlayersList from "@/components/PlayersList";
import TeamForm from "@/components/TeamForm";
import TeamsList from "@/components/TeamsList";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield } from "lucide-react";

const PlayersPage = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Acceso Restringido
          </h1>
          <p className="text-muted-foreground">Esta sección es solo para administradores</p>
        </div>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Permisos de Administrador Requeridos
            </CardTitle>
            <CardDescription className="text-orange-700">
              Solo los administradores pueden acceder a la gestión de jugadores y equipos.
              Si necesitas crear un equipo o gestionar jugadores, contacta a un administrador.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Gestión de Jugadores
        </h1>
        <p className="text-muted-foreground">Administra jugadores y forma parejas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <PlayerForm />
          <TeamForm />
        </div>
        <div className="space-y-6">
          <PlayersList />
          <TeamsList />
        </div>
      </div>
    </div>
  );
};

export default PlayersPage;
