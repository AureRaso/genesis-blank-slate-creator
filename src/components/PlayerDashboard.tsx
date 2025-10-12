import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import PlayerLeagueDetails from "./PlayerLeagueDetails";
import LeagueRegistrationModal from "./LeagueRegistrationModal";
import { TodayClassesConfirmation } from "./TodayClassesConfirmation";
import { usePlayerAvailableLeagues } from "@/hooks/usePlayerAvailableLeagues";

const PlayerDashboard = () => {
  const { profile } = useAuth();
  const { availableLeagues, enrolledLeagues, isLoading: loadingLeagues } = usePlayerAvailableLeagues(profile?.id, profile?.club_id);
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
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        {/* Encabezado con bienvenida - Responsive */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            ¡Hola, {profile?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Bienvenido a tu panel de control
          </p>
        </div>

        {/* Confirmación de Clases de Hoy - Destacado */}
        <TodayClassesConfirmation />

        {/* Modal de confirmación de inscripción */}
        <LeagueRegistrationModal
          league={registrationLeague}
          isOpen={!!registrationLeague}
          onClose={handleCloseRegistrationModal}
          profileId={profile?.id || ''}
        />
      </div>
    </div>
  );
};

export default PlayerDashboard;
