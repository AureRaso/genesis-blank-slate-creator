
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLeagues } from "@/hooks/useLeagues";
import { usePlayerTeams } from "@/hooks/usePlayerTeams";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import CreateMatchForm from "./CreateMatchForm";
import PartnerSelectionModal from "./PartnerSelectionModal";
import LeagueTeamsView from "./LeagueTeamsView";
import LeagueHeader from "./league/LeagueHeader";
import TeamStatusCard from "./league/TeamStatusCard";
import PlayerTeamDashboard from "./PlayerTeamDashboard";

interface PlayerLeagueDetailsProps {
  leagueId: string;
  onBack: () => void;
}

const PlayerLeagueDetails = ({ leagueId, onBack }: PlayerLeagueDetailsProps) => {
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [showPartnerSelection, setShowPartnerSelection] = useState(false);
  const [showTeamsView, setShowTeamsView] = useState(false);
  const [selectedOpponentTeamId, setSelectedOpponentTeamId] = useState<string | null>(null);
  const { profile } = useAuth();
  const { data: leagues } = useLeagues();
  const { data: playerTeam } = usePlayerTeams(leagueId, profile?.id);
  
  // Obtener información del compañero
  const { data: partnerInfo } = useQuery({
    queryKey: ['partner-info', playerTeam?.id],
    queryFn: async () => {
      if (!playerTeam) return null;
      
      const partnerId = playerTeam.player1_id === profile?.id ? 
        playerTeam.player2_id : playerTeam.player1_id;
      
      if (!partnerId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', partnerId)
        .single();
      
      if (error) {
        console.error('Error fetching partner info:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!playerTeam && !!profile?.id,
  });
  
  const league = leagues?.find(l => l.id === leagueId);

  console.log('PlayerLeagueDetails - playerTeam:', playerTeam, 'leagueId:', leagueId, 'profileId:', profile?.id);

  if (!league || !profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Liga no encontrada</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  // Si ya tiene equipo, mostrar el dashboard del equipo
  if (playerTeam && partnerInfo) {
    return (
      <PlayerTeamDashboard
        league={league}
        playerTeam={playerTeam}
        partner={[partnerInfo]}
        onBack={onBack}
      />
    );
  }

  if (showTeamsView) {
    return (
      <LeagueTeamsView
        leagueId={leagueId}
        leagueName={league.name}
        onProposeMatch={(teamId) => {
          setSelectedOpponentTeamId(teamId);
          setShowTeamsView(false);
          setShowCreateMatch(true);
        }}
        onBack={() => setShowTeamsView(false)}
      />
    );
  }

  if (showCreateMatch) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setShowCreateMatch(false)}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Crear Nuevo Partido</h1>
        </div>
        
        <CreateMatchForm 
          leagues={[league]}
          onSuccess={() => setShowCreateMatch(false)}
          onCancel={() => setShowCreateMatch(false)}
          preselectedOpponentTeamId={selectedOpponentTeamId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LeagueHeader league={league} onBack={onBack} />

      <TeamStatusCard
        playerTeam={playerTeam}
        partner={partnerInfo}
        onShowTeamsView={() => setShowTeamsView(true)}
        onCreateMatch={() => setShowCreateMatch(true)}
        onShowPartnerSelection={() => setShowPartnerSelection(true)}
      />

      <PartnerSelectionModal
        open={showPartnerSelection}
        onOpenChange={setShowPartnerSelection}
        leagueId={leagueId}
        currentPlayerId={profile.id}
        leagueName={league.name}
      />
    </div>
  );
};

export default PlayerLeagueDetails;
