import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Users, Plus, ArrowRight, MapPin, Phone, Building2, DollarSign } from "lucide-react";
import { usePlayerAvailableLeagues } from "@/hooks/usePlayerAvailableLeagues";
import { useClub } from "@/hooks/useClub";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import PlayerLeagueDetails from "./PlayerLeagueDetails";
import LeagueRegistrationModal from "./LeagueRegistrationModal";
import PlayerClassesWidget from "./PlayerClassesWidget";
import { TodayClassesConfirmation } from "./TodayClassesConfirmation";

const PlayerDashboard = () => {
  const { profile } = useAuth();
  const { availableLeagues, enrolledLeagues, isLoading: loadingLeagues } = usePlayerAvailableLeagues(profile?.id, profile?.club_id);
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

      {/* Confirmación de Clases de Hoy - Destacado */}
      <TodayClassesConfirmation />

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

      {/* Sección de Clases Programadas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-green-600" />
              Clases Programadas
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/scheduled-classes')}
            >
              Ver todas
            </Button>
          </div>
          <CardDescription>
            Clases disponibles en tu club - Apúntate o únete a lista de espera
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlayerClassesWidget
            limit={3}
            showViewAll={true}
            onViewAll={() => navigate('/dashboard/scheduled-classes')}
          />
        </CardContent>
      </Card>

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
