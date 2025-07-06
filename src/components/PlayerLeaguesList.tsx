import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, DollarSign, TrendingUp, ArrowRight, MapPin, CheckCircle, Clock } from "lucide-react";
import { usePlayerAvailableLeagues } from "@/hooks/usePlayerAvailableLeagues";
import { useAuth } from "@/contexts/AuthContext";
import LeagueRegistrationModal from "./LeagueRegistrationModal";
import PlayerLeagueDetails from "./PlayerLeagueDetails";

interface PlayerLeaguesListProps {
  clubId?: string;
}

const PlayerLeaguesList = ({ clubId }: PlayerLeaguesListProps) => {
  const { profile } = useAuth();
  const { availableLeagues, enrolledLeagues, pendingLeagues, isLoading } = usePlayerAvailableLeagues(profile?.id, clubId);
  const [registrationLeague, setRegistrationLeague] = useState(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);

  const handleRegisterClick = (league) => {
    setRegistrationLeague(league);
  };

  const handleCloseRegistrationModal = () => {
    setRegistrationLeague(null);
  };

  const handleLeagueClick = (leagueId: string) => {
    setSelectedLeagueId(leagueId);
  };

  const handleBackToLeagues = () => {
    setSelectedLeagueId(null);
  };

  if (selectedLeagueId) {
    return (
      <PlayerLeagueDetails
        leagueId={selectedLeagueId}
        onBack={handleBackToLeagues}
      />
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'upcoming':
        return 'Próximamente';
      case 'completed':
        return 'Finalizada';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Mis Ligas Inscritas */}
      {enrolledLeagues.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-green-600" />
            Mis Ligas Inscritas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledLeagues.map((league) => (
              <Card key={league.id} className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 mb-2">{league.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(league.status)}>
                          {getStatusText(league.status)}
                        </Badge>
                        {league.clubs && (
                          <Badge variant="outline" className="text-xs">
                            {league.clubs.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span className="text-muted-foreground">Inicio:</span>
                    </div>
                    <span className="font-medium">{league.start_date}</span>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-red-600" />
                      <span className="text-muted-foreground">Fin:</span>
                    </div>
                    <span className="font-medium">{league.end_date}</span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span>Victoria: {league.points_victory} pts</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-red-600" />
                        <span>Derrota: {league.points_defeat} pts</span>
                      </div>
                    </div>
                    {league.points_per_set && (
                      <div className="mt-1 text-xs text-blue-600 flex items-center">
                        <Trophy className="h-3 w-3 mr-1" />
                        Puntos adicionales por sets ganados
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={() => handleLeagueClick(league.id)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Ver Liga <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Ligas Pendientes de Aprobación */}
      {pendingLeagues.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-yellow-600" />
            Inscripciones Pendientes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingLeagues.map((league) => (
              <Card key={league.id} className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-yellow-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 mb-2">{league.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(league.status)}>
                          {getStatusText(league.status)}
                        </Badge>
                        <Badge variant="outline" className="text-yellow-700 bg-yellow-50">
                          Pendiente
                        </Badge>
                        {league.clubs && (
                          <Badge variant="outline" className="text-xs">
                            {league.clubs.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span className="text-muted-foreground">Inicio:</span>
                    </div>
                    <span className="font-medium">{league.start_date}</span>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-red-600" />
                      <span className="text-muted-foreground">Fin:</span>
                    </div>
                    <span className="font-medium">{league.end_date}</span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span>Victoria: {league.points_victory} pts</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-red-600" />
                        <span>Derrota: {league.points_defeat} pts</span>
                      </div>
                    </div>
                    {league.points_per_set && (
                      <div className="mt-1 text-xs text-blue-600 flex items-center">
                        <Trophy className="h-3 w-3 mr-1" />
                        Puntos adicionales por sets ganados
                      </div>
                    )}
                  </div>

                  <Button 
                    disabled
                    className="w-full bg-yellow-100 text-yellow-800 hover:bg-yellow-100 cursor-not-allowed"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Inscripción Pendiente
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Ligas Disponibles */}
      {availableLeagues.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-blue-600" />
            Ligas Disponibles para Inscribirse
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableLeagues.map((league) => (
              <Card key={league.id} className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 mb-2">{league.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(league.status)}>
                          {getStatusText(league.status)}
                        </Badge>
                        {league.clubs && (
                          <Badge variant="outline" className="text-xs">
                            {league.clubs.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span className="text-muted-foreground">Inicio:</span>
                    </div>
                    <span className="font-medium">{league.start_date}</span>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-red-600" />
                      <span className="text-muted-foreground">Fin:</span>
                    </div>
                    <span className="font-medium">{league.end_date}</span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span>Victoria: {league.points_victory} pts</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-red-600" />
                        <span>Derrota: {league.points_defeat} pts</span>
                      </div>
                    </div>
                    {league.points_per_set && (
                      <div className="mt-1 text-xs text-blue-600 flex items-center">
                        <Trophy className="h-3 w-3 mr-1" />
                        Puntos adicionales por sets ganados
                      </div>
                    )}
                  </div>

                  {league.registration_price > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-2 text-sm">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-muted-foreground">Inscripción:</span>
                      </div>
                      <span className="font-semibold text-green-600">
                        €{league.registration_price}
                      </span>
                    </div>
                  )}

                  <Button 
                    onClick={() => handleRegisterClick(league)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {league.registration_price > 0 
                      ? `Inscribirse - €${league.registration_price}`
                      : "Inscribirse Gratis"
                    }
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {enrolledLeagues.length === 0 && availableLeagues.length === 0 && pendingLeagues.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay ligas disponibles</h3>
              <p className="text-muted-foreground">
                No hay ligas creadas en tu club todavía. Contacta con el administrador para crear nuevas ligas.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de registro */}
      <LeagueRegistrationModal
        league={registrationLeague}
        isOpen={!!registrationLeague}
        onClose={handleCloseRegistrationModal}
        profileId={profile?.id || ''}
      />
    </div>
  );
};

export default PlayerLeaguesList;
