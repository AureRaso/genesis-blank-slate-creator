import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import PlayerLeagueDetails from "./PlayerLeagueDetails";
import LeagueRegistrationModal from "./LeagueRegistrationModal";
import { TodayClassesConfirmation } from "./TodayClassesConfirmation";
import { usePlayerAvailableLeagues } from "@/hooks/usePlayerAvailableLeagues";
import { useGuardianChildren } from "@/hooks/useGuardianChildren";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";

const PlayerDashboard = () => {
  const { profile, isGuardian } = useAuth();
  const { availableLeagues, enrolledLeagues, isLoading: loadingLeagues } = usePlayerAvailableLeagues(profile?.id, profile?.club_id);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [registrationLeague, setRegistrationLeague] = useState(null);
  const [selectedChildId, setSelectedChildId] = useState<string>("all");

  // Get children if user is guardian
  const { children, isLoading: loadingChildren } = useGuardianChildren();

  console.log('🔍 PlayerDashboard - Guardian children:', {
    isGuardian,
    childrenCount: children?.length,
    children,
    selectedChildId
  });

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
    <div className="min-h-screen overflow-y-auto flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6">
      {/* Encabezado con bienvenida y Selector - Responsive */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        {/* Título y subtítulo */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            ¡Hola, {profile?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Bienvenido a tu panel de control
          </p>
        </div>

        {/* Selector de Hijos - Solo para Guardians */}
        {isGuardian && children && children.length > 0 && (
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <span className="font-medium text-xs sm:text-sm whitespace-nowrap">Ver clases de:</span>
            </div>
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger className="w-full sm:w-[200px] lg:w-[240px]">
                <SelectValue placeholder="Selecciona un hijo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Todos mis hijos</span>
                  </div>
                </SelectItem>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.full_name || 'Sin nombre'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Confirmación de Clases de Hoy - Destacado */}
      <TodayClassesConfirmation selectedChildId={isGuardian ? selectedChildId : undefined} />

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
