import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Users, Plus, ArrowRight, MapPin, Phone, Building2, Clock, User, DollarSign } from "lucide-react";
import { usePlayerAvailableLeagues } from "@/hooks/usePlayerAvailableLeagues";
import { useMyReservations } from "@/hooks/useClassReservations";
import { useClub } from "@/hooks/useClub";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import PlayerLeagueDetails from "./PlayerLeagueDetails";
import LeagueRegistrationModal from "./LeagueRegistrationModal";

const PlayerDashboard = () => {
  const { profile } = useAuth();
  const { availableLeagues, enrolledLeagues, isLoading: loadingLeagues } = usePlayerAvailableLeagues(profile?.id, profile?.club_id);
  const { data: myReservations, isLoading: loadingReservations } = useMyReservations();
  const { data: club, isLoading: loadingClub } = useClub(profile?.club_id);
  const navigate = useNavigate();
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [registrationLeague, setRegistrationLeague] = useState(null);

  const handleLeagueClick = (leagueId: string) => {
    setSelectedLeagueId(leagueId);
  };

  const handleBackToLeagues = () => {
    setSelectedLeagueId(null);
  };

  const handleRegisterClick = (league) => {
    setRegistrationLeague(league);
  };

  const handleCloseRegistrationModal = () => {
    setRegistrationLeague(null);
  };

  if (selectedLeagueId) {
    return (
      <PlayerLeagueDetails
        leagueId={selectedLeagueId}
        onBack={handleBackToLeagues}
      />
    );
  }

  const formatDayOfWeek = (day: string) => {
    const days = {
      'lunes': 'Lunes',
      'martes': 'Martes', 
      'miercoles': 'Miércoles',
      'jueves': 'Jueves',
      'viernes': 'Viernes',
      'sabado': 'Sábado',
      'domingo': 'Domingo'
    };
    return days[day as keyof typeof days] || day;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'iniciacion':
        return 'bg-green-100 text-green-800';
      case 'intermedio':
        return 'bg-yellow-100 text-yellow-800';
      case 'avanzado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Encabezado con bienvenida */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">¡Hola, {profile?.full_name}!</h1>
        <p className="text-muted-foreground">
          Bienvenido a tu dashboard personal de pádel
        </p>
      </div>

      {/* Información del Club */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-blue-600" />
            Mi Club
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingClub ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : club ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">{club.name}</h3>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {club.address}
                </span>
                <span className="flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  {club.phone}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <Badge variant="outline">
                  {club.court_count} {club.court_count === 1 ? 'pista' : 'pistas'}
                </Badge>
                <Badge variant="outline">
                  {club.court_types.join(', ')}
                </Badge>
              </div>
              {club.description && (
                <p className="text-sm text-muted-foreground mt-2">{club.description}</p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No estás asignado a ningún club todavía.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sección de Mis Clases */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-green-600" />
                Mis Clases
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/classes')}
              >
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingReservations ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse p-3 border rounded-lg">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : myReservations && myReservations.length > 0 ? (
              <div className="space-y-3">
                {myReservations.slice(0, 3).map((reservation) => (
                  <div key={reservation.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">
                        {formatDayOfWeek(reservation.class_slots?.day_of_week || "")}
                      </div>
                      <Badge className={getLevelColor(reservation.class_slots?.level || "")}>
                        {reservation.class_slots?.level === 'iniciacion' ? 'Iniciación' : 
                         reservation.class_slots?.level === 'intermedio' ? 'Intermedio' : 'Avanzado'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {reservation.class_slots?.start_time}
                      </div>
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {reservation.class_slots?.trainer_name}
                      </div>
                    </div>
                  </div>
                ))}
                {myReservations.length > 3 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate('/classes')}
                  >
                    Ver {myReservations.length - 3} clases más
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-sm font-medium mb-2">No tienes clases reservadas</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Explora las clases disponibles y reserva tu plaza.
                </p>
                <Button 
                  onClick={() => navigate('/classes')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ver Clases Disponibles
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sección de Mis Ligas mejorada */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
                Mis Ligas
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/leagues')}
              >
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingLeagues ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse p-3 border rounded-lg">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Ligas Inscritas */}
                {enrolledLeagues.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">LIGAS INSCRITAS</h4>
                    <div className="space-y-3">
                      {enrolledLeagues.slice(0, 2).map((league) => (
                        <div key={league.id} className="p-3 border rounded-lg bg-green-50 border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{league.name}</div>
                            <Badge className={getStatusColor(league.status)}>
                              {getStatusText(league.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              {league.start_date} - {league.end_date}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleLeagueClick(league.id)}
                            >
                              Ver Liga <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ligas Disponibles */}
                {availableLeagues.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">LIGAS DISPONIBLES</h4>
                    <div className="space-y-3">
                      {availableLeagues.slice(0, 2).map((league) => (
                        <div key={league.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{league.name}</div>
                            <Badge className={getStatusColor(league.status)}>
                              {getStatusText(league.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-muted-foreground">
                              {league.start_date} - {league.end_date}
                            </div>
                            {league.registration_price > 0 && (
                              <div className="flex items-center text-sm font-medium text-green-600">
                                <DollarSign className="h-3 w-3 mr-1" />
                                €{league.registration_price}
                              </div>
                            )}
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => handleRegisterClick(league)}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            {league.registration_price > 0 
                              ? `Inscribirse - €${league.registration_price}`
                              : "Inscribirse Gratis"
                            }
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estado vacío */}
                {enrolledLeagues.length === 0 && availableLeagues.length === 0 && (
                  <div className="text-center py-6">
                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-sm font-medium mb-2">No hay ligas disponibles</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      No hay ligas creadas en tu club todavía.
                    </p>
                    <Button 
                      onClick={() => navigate('/leagues')}
                      variant="outline"
                    >
                      Ver Todas las Ligas
                    </Button>
                  </div>
                )}

                {/* Mostrar más enlace */}
                {(enrolledLeagues.length > 2 || availableLeagues.length > 2) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate('/leagues')}
                  >
                    Ver todas las ligas de mi club
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de confirmación de inscripción */}
      <LeagueRegistrationModal
        league={registrationLeague}
        isOpen={!!registrationLeague}
        onClose={handleCloseRegistrationModal}
        profileId={profile?.id || ''}
      />
    </div>
  );
};

export default PlayerDashboard;
