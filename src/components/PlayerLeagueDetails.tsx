import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLeagues } from "@/hooks/useLeagues";
import { usePlayerTeams } from "@/hooks/usePlayerTeams";
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
  
  const league = leagues?.find(l => l.id === leagueId);

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
  if (playerTeam) {
    const partner = playerTeam.player1?.[0]?.id === profile.id ? playerTeam.player2 : playerTeam.player1;
    
    return (
      <PlayerTeamDashboard
        league={league}
        playerTeam={playerTeam}
        partner={partner}
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
        playerTeam={null}
        partner={null}
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
