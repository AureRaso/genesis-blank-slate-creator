
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLeagues } from "@/hooks/useLeagues";
import { useLeagueTeams } from "@/hooks/useLeagueTeams";
import { useCanCreateMatch, useCreatePlayerMatch } from "@/hooks/usePlayerMatchCreation";
import LeagueSelector from "@/components/match/LeagueSelector";
import TeamSelector from "@/components/match/TeamSelector";
import ScheduleSelector from "@/components/match/ScheduleSelector";
import PermissionCard from "@/components/match/PermissionCard";
import LoadingCard from "@/components/match/LoadingCard";

interface CreateMatchFormProps {
  onClose?: () => void;
}

const CreateMatchForm = ({ onClose }: CreateMatchFormProps) => {
  const [selectedLeagueId, setSelectedLeagueId] = useState("");
  const [selectedTeam1Id, setSelectedTeam1Id] = useState("");
  const [selectedTeam2Id, setSelectedTeam2Id] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const { user } = useAuth();
  const { data: leagues } = useLeagues();
  const { data: leagueTeams } = useLeagueTeams(selectedLeagueId);
  const { data: canCreate, isLoading: checkingPermission } = useCanCreateMatch();
  const createMatch = useCreatePlayerMatch();

  const activeLeagues = leagues?.filter(league => league.status === 'active') || [];

  // Filtrar equipos donde el usuario actual es miembro
  const userTeams = leagueTeams?.filter(lt => {
    const team = lt.teams;
    const player1Email = Array.isArray(team?.player1) ? team.player1[0]?.email : team?.player1?.email;
    const player2Email = Array.isArray(team?.player2) ? team.player2[0]?.email : team?.player2?.email;
    return player1Email === user?.email || player2Email === user?.email;
  }) || [];

  // Filtrar equipos oponentes (que no incluyan al usuario)
  const opponentTeams = leagueTeams?.filter(lt => {
    const team = lt.teams;
    const player1Email = Array.isArray(team?.player1) ? team.player1[0]?.email : team?.player1?.email;
    const player2Email = Array.isArray(team?.player2) ? team.player2[0]?.email : team?.player2?.email;
    return player1Email !== user?.email && player2Email !== user?.email;
  }) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLeagueId || !selectedTeam1Id || !selectedTeam2Id) {
      return;
    }

    createMatch.mutate({
      leagueId: selectedLeagueId,
      team1Id: selectedTeam1Id,
      team2Id: selectedTeam2Id,
      scheduledDate: scheduledDate || undefined,
      scheduledTime: scheduledTime || undefined,
    }, {
      onSuccess: () => {
        onClose?.();
      }
    });
  };

  if (checkingPermission) {
    return <LoadingCard />;
  }

  if (!canCreate) {
    return <PermissionCard />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Crear Nuevo Partido
        </CardTitle>
        <CardDescription>
          Puedes crear un partido por semana. Selecciona tu equipo y el equipo oponente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <LeagueSelector
            leagues={activeLeagues}
            selectedLeagueId={selectedLeagueId}
            onLeagueChange={setSelectedLeagueId}
          />

          {selectedLeagueId && (
            <>
              <TeamSelector
                label="Tu Equipo"
                placeholder="Selecciona tu equipo..."
                teams={userTeams}
                selectedTeamId={selectedTeam1Id}
                onTeamChange={setSelectedTeam1Id}
              />

              <TeamSelector
                label="Equipo Oponente"
                placeholder="Selecciona el equipo oponente..."
                teams={opponentTeams}
                selectedTeamId={selectedTeam2Id}
                onTeamChange={setSelectedTeam2Id}
              />

              <ScheduleSelector
                scheduledDate={scheduledDate}
                scheduledTime={scheduledTime}
                onDateChange={setScheduledDate}
                onTimeChange={setScheduledTime}
              />

              <div className="flex space-x-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={!selectedTeam1Id || !selectedTeam2Id || createMatch.isPending}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                >
                  {createMatch.isPending ? 'Creando...' : 'Crear Partido'}
                </Button>
                {onClose && (
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                )}
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateMatchForm;
