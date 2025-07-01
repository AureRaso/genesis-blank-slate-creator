import { useAuth } from "@/contexts/AuthContext";
import { useLeagues } from "@/hooks/useLeagues";
import { useRegisterForLeague, useWithdrawFromLeague, usePlayerRegistration, useLeaguePlayers } from "@/hooks/useLeaguePlayers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Calendar, Trophy, Users, Euro, Settings } from "lucide-react";
import PaymentIntegration from "@/components/PaymentIntegration";
import MatchGenerator from "@/components/MatchGenerator";
import LeaguePlayersTable from "@/components/LeaguePlayersTable";

const LeaguePlayersPage = () => {
  const { profile, isAdmin } = useAuth();
  const { data: leagues } = useLeagues();
  const registerForLeague = useRegisterForLeague();
  const withdrawFromLeague = useWithdrawFromLeague();

  const availableLeagues = leagues?.filter(league => 
    league.status === 'active' || league.status === 'upcoming'
  ) || [];

  const handleRegister = (leagueId: string) => {
    if (!profile?.id) return;
    registerForLeague.mutate({ leagueId, profileId: profile.id });
  };

  const handleWithdraw = (leagueId: string) => {
    if (!profile?.id) return;
    withdrawFromLeague.mutate({ leagueId, profileId: profile.id });
  };

  if (!profile && !isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Inscripciones</h1>
          <p className="text-muted-foreground">Inscríbete en las ligas disponibles</p>
        </div>
        
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Perfil Requerido</CardTitle>
            <CardDescription className="text-orange-700">
              Necesitas tener un perfil registrado para inscribirte en ligas. 
              Contacta a un administrador para obtener acceso.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {isAdmin ? "Gestión de Inscripciones" : "Ligas Disponibles"}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin 
            ? "Administra las inscripciones de los jugadores en las ligas"
            : "Inscríbete en las ligas disponibles para participar en torneos de pádel"
          }
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {availableLeagues.map((league) => (
            <LeagueRegistrationCard
              key={league.id}
              league={league}
              profileId={profile?.id}
              onRegister={handleRegister}
              onWithdraw={handleWithdraw}
              isLoading={registerForLeague.isPending || withdrawFromLeague.isPending}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {isAdmin && availableLeagues.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Administración de Ligas</h2>
          {availableLeagues.map((league) => (
            <LeagueAdminSection key={league.id} league={league} />
          ))}
        </div>
      )}
    </div>
  );
};

interface LeagueRegistrationCardProps {
  league: any;
  profileId?: string;
  onRegister: (leagueId: string) => void;
  onWithdraw: (leagueId: string) => void;
  isLoading: boolean;
  isAdmin: boolean;
}

const LeagueRegistrationCard = ({ 
  league, 
  profileId, 
  onRegister, 
  onWithdraw, 
  isLoading,
  isAdmin 
}: LeagueRegistrationCardProps) => {
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

  const isFree = league.registration_price === 0;

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{league.name}</CardTitle>
          {getStatusBadge(league.status)}
        </div>
        <CardDescription className="space-y-2">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2" />
            {new Date(league.start_date).toLocaleDateString()} - {new Date(league.end_date).toLocaleDateString()}
          </div>
          <div className="flex items-center text-sm font-medium">
            <Euro className="h-4 w-4 mr-2" />
            {isFree ? (
              <span className="text-green-600">Gratis</span>
            ) : (
              <span>{league.registration_price}€ por persona</span>
            )}
          </div>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <div className="text-sm">
            <p><strong>Puntos victoria:</strong> {league.points_victory}</p>
            <p><strong>Puntos derrota:</strong> {league.points_defeat}</p>
            {league.points_per_set && (
              <p className="text-green-600">✓ Puntos extra por set ganado</p>
            )}
          </div>
          
          {registration && !isAdmin && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estado:</span>
              {getRegistrationStatus()}
            </div>
          )}

          {!isFree && !registration && !isAdmin && (
            <PaymentIntegration
              leagueId={league.id}
              leagueName={league.name}
              price={league.registration_price}
              onPaymentSuccess={() => onRegister(league.id)}
            />
          )}
        </div>

        <div className="space-y-2">
          {isAdmin ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {/* Navigate to specific league management */}}
            >
              <Settings className="h-4 w-4 mr-2" />
              Administrar Liga
            </Button>
          ) : !registration ? (
            isFree ? (
              <Button
                onClick={() => onRegister(league.id)}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Inscribirse Gratis
              </Button>
            ) : null
          ) : registration.status === 'approved' ? (
            <Button disabled className="w-full bg-green-100 text-green-800">
              <Users className="h-4 w-4 mr-2" />
              Ya inscrito
            </Button>
          ) : (
            <Button
              onClick={() => onRegister(league.id)}
              disabled={isLoading}
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

interface LeagueAdminSectionProps {
  league: any;
}

const LeagueAdminSection = ({ league }: LeagueAdminSectionProps) => {
  const { data: leaguePlayers } = useLeaguePlayers(league.id);
  const approvedPlayers = leaguePlayers?.filter(lp => lp.status === 'approved').length || 0;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">{league.name}</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MatchGenerator
          leagueId={league.id}
          leagueName={league.name}
          approvedPlayers={approvedPlayers}
        />
        
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Inscripciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total inscripciones:</span>
                <Badge>{leaguePlayers?.length || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Aprobadas:</span>
                <Badge className="bg-green-100 text-green-800">{approvedPlayers}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Pendientes:</span>
                <Badge variant="secondary">
                  {leaguePlayers?.filter(lp => lp.status === 'pending').length || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <LeaguePlayersTable leagueId={league.id} leagueName={league.name} />
    </div>
  );
};

export default LeaguePlayersPage;
