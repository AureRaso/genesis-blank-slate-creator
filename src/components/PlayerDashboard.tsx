import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import PlayerLeagueDetails from "./PlayerLeagueDetails";
import LeagueRegistrationModal from "./LeagueRegistrationModal";
import { PlayerClassesTabs } from "./PlayerClassesTabs";
import DeletedUserMessage from "./DeletedUserMessage";
import { PhoneRequiredModal } from "./PhoneRequiredModal";
import { PlayerDetailsModal } from "./PlayerDetailsModal";
import { WhatsAppActivationModal } from "./WhatsAppActivationModal";
import { usePlayerAvailableLeagues } from "@/hooks/usePlayerAvailableLeagues";
import { useGuardianChildren } from "@/hooks/useGuardianChildren";
import { useCurrentUserEnrollment } from "@/hooks/useCurrentUserEnrollment";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PlayerDashboard = () => {
  const { profile, isGuardian, retryAuth } = useAuth();
  const queryClient = useQueryClient();
  const { availableLeagues, enrolledLeagues, isLoading: loadingLeagues } = usePlayerAvailableLeagues(profile?.id, profile?.club_id);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [registrationLeague, setRegistrationLeague] = useState(null);
  const [selectedChildId, setSelectedChildId] = useState<string>("all");
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(true);

  // Get current user enrollment status
  const { data: enrollment, isLoading: loadingEnrollment } = useCurrentUserEnrollment(profile?.id);

  // Get children if user is guardian
  const { children, isLoading: loadingChildren } = useGuardianChildren();

  // Get club settings to check if player details are required
  const { data: clubSettings } = useQuery({
    queryKey: ['club-settings', profile?.club_id],
    queryFn: async () => {
      if (!profile?.club_id) return null;
      const { data, error } = await supabase
        .from('clubs')
        .select('require_player_details')
        .eq('id', profile.club_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.club_id,
  });

  // Check if player details modal should be shown
  const needsPlayerDetails =
    clubSettings?.require_player_details &&
    (!profile?.birth_date || !profile?.shirt_size);

  // Check if phone modal should be shown (to avoid showing both at once)
  const needsPhoneUpdate = !enrollment?.phone || enrollment?.phone === '' || enrollment?.phone === '000000000';

  // Check if WhatsApp activation modal should be shown
  // Only show after phone and player details are complete
  // Cast profile fields to boolean since they may not exist in the type yet
  const whatsappOptInCompleted = (profile as any)?.whatsapp_opt_in_completed === true;
  const whatsappOptInDismissed = (profile as any)?.whatsapp_opt_in_dismissed === true;
  const shouldShowWhatsAppModal =
    showWhatsAppModal &&
    profile &&
    !needsPhoneUpdate &&
    !needsPlayerDetails &&
    !whatsappOptInCompleted &&
    !whatsappOptInDismissed;

  // Callback to refresh enrollment data after phone update
  const handlePhoneUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['current-user-enrollment'] });
  };

  // Callback to refresh profile data after player details update
  const handleDetailsUpdated = () => {
    // Refresh the profile from AuthContext to get updated birth_date and shirt_size
    retryAuth();
  };

  // Callbacks for WhatsApp activation modal
  const handleWhatsAppCompleted = () => {
    setShowWhatsAppModal(false);
    retryAuth(); // Refresh profile to get updated whatsapp_opt_in fields
  };

  const handleWhatsAppDismissed = () => {
    setShowWhatsAppModal(false);
    retryAuth(); // Refresh profile to get updated whatsapp_opt_in fields
  };

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

  // Check if user has been deleted/deactivated from the club
  if (!loadingEnrollment && enrollment && enrollment.status === 'inactive') {
    return <DeletedUserMessage clubName={enrollment.club_name} />;
  }

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
    <>
      {/* Phone Required Modal */}
      {enrollment && profile?.email && (
        <PhoneRequiredModal
          studentEnrollmentId={enrollment.id}
          currentPhone={enrollment.phone}
          studentEmail={profile.email}
          onPhoneUpdated={handlePhoneUpdated}
        />
      )}

      {/* Player Details Modal - Only for clubs that require it, and only after phone is complete */}
      {profile && !needsPhoneUpdate && needsPlayerDetails && (
        <PlayerDetailsModal
          profileId={profile.id}
          currentBirthDate={profile.birth_date}
          currentShirtSize={profile.shirt_size}
          onDetailsUpdated={handleDetailsUpdated}
        />
      )}

      {/* WhatsApp Activation Modal - Show after phone and details are complete */}
      {shouldShowWhatsAppModal && profile && (
        <WhatsAppActivationModal
          userName={profile.full_name || 'Usuario'}
          profileId={profile.id}
          onCompleted={handleWhatsAppCompleted}
          onDismissed={handleWhatsAppDismissed}
        />
      )}

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
                    <span>Todos mis perfiles</span>
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

      {/* Tabs: Próximas Clases y Clases Disponibles */}
      <PlayerClassesTabs selectedChildId={isGuardian ? selectedChildId : undefined} />

        {/* Modal de confirmación de inscripción */}
        <LeagueRegistrationModal
          league={registrationLeague}
          isOpen={!!registrationLeague}
          onClose={handleCloseRegistrationModal}
          profileId={profile?.id || ''}
        />
      </div>
    </>
  );
};

export default PlayerDashboard;
