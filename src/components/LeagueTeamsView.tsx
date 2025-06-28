
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLeagueTeams } from "@/hooks/useLeagueTeams";
import { useLeagueStandings } from "@/hooks/useLeagueStandings";
import { Users, Trophy, Swords } from "lucide-react";

interface LeagueTeamsViewProps {
  leagueId: string;
  leagueName: string;
  onProposeMatch: (teamId: string) => void;
  onBack: () => void;
}

const LeagueTeamsView = ({ leagueId, leagueName, onProposeMatch, onBack }: LeagueTeamsViewProps) => {
  const { data: teams, isLoading } = useLeagueTeams(leagueId);
  const { data: standings } = useLeagueStandings(leagueId);

  const getTeamPosition = (teamId: string) => {
    const standing = standings?.find(s => s.team_id === teamId);
    return standing?.position || null;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay equipos disponibles</h3>
            <p className="text-muted-foreground">
              Aún no hay equipos formados en esta liga.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Equipos de {leagueName}</h2>
          <p className="text-muted-foreground">Elige un equipo para proponer un partido</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Volver
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((teamData) => {
          const team = teamData.teams;
          if (!team) return null;

          const position = getTeamPosition(team.id);

          return (
            <Card key={team.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                    {team.name}
                  </CardTitle>
                  {position && (
                    <Badge variant="secondary" className="text-sm">
                      #{position}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {team.player1?.full_name?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {team.player1?.full_name || 'Jugador 1'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {team.player2?.full_name?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {team.player2?.full_name || 'Jugador 2'}
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => onProposeMatch(team.id)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Swords className="h-4 w-4 mr-2" />
                    Proponer Partido
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default LeagueTeamsView;
