
import { UserPlus, Calendar, Trophy, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLeagues } from "@/hooks/useLeagues";
import { usePlayerRegistration } from "@/hooks/useLeaguePlayers";
import { useAuth } from "@/contexts/AuthContext";

interface LeagueRegistrationProps {
  onRegister?: (leagueId: string, registrationPrice: number) => void;
  onWithdraw?: (leagueId: string) => void;
}

const LeagueRegistration = ({ onRegister, onWithdraw }: LeagueRegistrationProps) => {
  const { profile: currentPlayer } = useAuth();
  const { data: leagues } = useLeagues();

  const availableLeagues = leagues?.filter(league => 
    league.status === 'active' || league.status === 'upcoming'
  ) || [];

  const handleRegister = (leagueId: string, registrationPrice: number) => {
    if (!currentPlayer) return;
    onRegister?.(leagueId, registrationPrice);
  };

  const handleWithdraw = (leagueId: string) => {
    if (!currentPlayer) return;
    onWithdraw?.(leagueId);
  };

  if (!currentPlayer) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-800">Perfil de Jugador Requerido</CardTitle>
          <CardDescription className="text-orange-700">
            Necesitas tener un perfil de jugador registrado para inscribirte en ligas. 
            Contacta a un administrador para que te registre como jugador.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Inscripción a Ligas</h2>
        <p className="text-muted-foreground">
          Inscríbete en las ligas disponibles para participar en torneos de pádel
        </p>
      </div>

      {availableLeagues.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay ligas disponibles</h3>
              <p className="text-muted-foreground">
                Actualmente no hay ligas abiertas para inscripción
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableLeagues.map((league) => (
            <LeagueCard
              key={league.id}
              league={league}
              profileId={currentPlayer.id}
              onRegister={handleRegister}
              onWithdraw={handleWithdraw}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface LeagueCardProps {
  league: any;
  profileId: string;
  onRegister: (leagueId: string, registrationPrice: number) => void;
  onWithdraw: (leagueId: string) => void;
}

const LeagueCard = ({ league, profileId, onRegister, onWithdraw }: LeagueCardProps) => {
  const { data: registration } = usePlayerRegistration(profileId, league.id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Activa</Badge>;
      case 'upcoming':
        return <Badge variant="secondary">Próximamente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRegistrationStatus = () => {
    if (!registration) return null;
    
    switch (registration.status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Inscrito</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{league.name}</CardTitle>
          {getStatusBadge(league.status)}
        </div>
        <CardDescription className="flex items-center space-x-4 text-sm">
          <span className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {league.start_date} - {league.end_date}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="text-sm">
            <p><strong>Precio:</strong> {league.registration_price > 0 ? `€${league.registration_price}` : 'Gratis'}</p>
            <p><strong>Puntos victoria:</strong> {league.points_victory}</p>
            <p><strong>Puntos derrota:</strong> {league.points_defeat}</p>
            {league.points_per_set && (
              <p className="text-green-600">✓ Puntos extra por set ganado</p>
            )}
          </div>
          
          {registration && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estado:</span>
              {getRegistrationStatus()}
            </div>
          )}
        </div>

        <div className="mt-4">
          {!registration ? (
            <Button
              onClick={() => onRegister(league.id, league.registration_price)}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Inscribirse
            </Button>
          ) : registration.status === 'approved' ? (
            <Button
              onClick={() => onWithdraw(league.id)}
              variant="outline"
              className="w-full"
            >
              <Users className="h-4 w-4 mr-2" />
              Darse de baja
            </Button>
          ) : (
            <Button
              onClick={() => onRegister(league.id, league.registration_price)}
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Volver a intentar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeagueRegistration;
