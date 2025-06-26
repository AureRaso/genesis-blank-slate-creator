
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useLeagues } from "@/hooks/useLeagues";
import { usePlayerRegistration, useRegisterForLeague } from "@/hooks/useLeaguePlayers";
import { usePlayers } from "@/hooks/usePlayers";
import { Calendar, Users, Trophy, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LeagueRegistrationWithPayment = () => {
  const { user } = useAuth();
  const { data: leagues } = useLeagues();
  const { data: players } = usePlayers();
  const registerForLeague = useRegisterForLeague();
  const { toast } = useToast();

  // Encontrar el jugador actual
  const currentPlayer = players?.find(player => player.email === user?.email);

  const handleRegister = async (leagueId: string, price: number) => {
    if (!currentPlayer) {
      toast({
        title: "Error",
        description: "Debes estar registrado como jugador para inscribirte en una liga.",
        variant: "destructive",
      });
      return;
    }

    if (price > 0) {
      // Aquí iría la integración con el sistema de pagos (Stripe)
      // Por ahora, simulamos el pago exitoso
      toast({
        title: "Pago requerido",
        description: `El precio de inscripción es €${price.toFixed(2)}. La integración de pagos se implementará próximamente.`,
        variant: "destructive",
      });
      return;
    }

    // Si la liga es gratuita, permitir registro directo
    try {
      await registerForLeague.mutateAsync({
        leagueId,
        playerId: currentPlayer.id,
      });
    } catch (error) {
      console.error("Error registering for league:", error);
    }
  };

  const availableLeagues = leagues?.filter(league => 
    league.status === 'upcoming' || league.status === 'active'
  ) || [];

  if (!currentPlayer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registro no disponible</CardTitle>
          <CardDescription>
            Debes estar registrado como jugador para poder inscribirte en las ligas.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Ligas Disponibles
        </h2>
        <p className="text-muted-foreground">
          Inscríbete en las ligas que estén abiertas para registros
        </p>
      </div>

      {availableLeagues.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No hay ligas disponibles para inscripciones en este momento.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {availableLeagues.map((league) => (
            <LeagueRegistrationCard
              key={league.id}
              league={league}
              currentPlayer={currentPlayer}
              onRegister={handleRegister}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface LeagueRegistrationCardProps {
  league: any;
  currentPlayer: any;
  onRegister: (leagueId: string, price: number) => void;
}

const LeagueRegistrationCard = ({ league, currentPlayer, onRegister }: LeagueRegistrationCardProps) => {
  const { data: registration } = usePlayerRegistration(currentPlayer.id, league.id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rechazado</Badge>;
      default:
        return null;
    }
  };

  const getLeagueStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Próxima</Badge>;
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Activa</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Completada</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {league.name}
              {getLeagueStatusBadge(league.status)}
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(league.start_date).toLocaleDateString()} - {new Date(league.end_date).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                {league.registration_price > 0 ? `€${league.registration_price.toFixed(2)}` : 'Gratis'}
              </span>
            </CardDescription>
          </div>
          {registration && getStatusBadge(registration.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Puntos por victoria:</span> {league.points_victory}
            </div>
            <div>
              <span className="font-medium">Puntos por derrota:</span> {league.points_defeat}
            </div>
          </div>
          
          {league.points_per_set && (
            <p className="text-sm text-muted-foreground">
              ✓ Punto extra por set ganado
            </p>
          )}

          <div className="flex justify-end">
            {registration ? (
              <div className="text-sm text-muted-foreground">
                Ya estás inscrito en esta liga
              </div>
            ) : (
              <Button 
                onClick={() => onRegister(league.id, league.registration_price)}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                {league.registration_price > 0 ? (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Inscribirse por €{league.registration_price.toFixed(2)}
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Inscribirse Gratis
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeagueRegistrationWithPayment;
