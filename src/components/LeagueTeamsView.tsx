
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Trophy } from "lucide-react";
import { useLeagueTeams } from "@/hooks/useLeagueTeams";

interface LeagueTeamsViewProps {
  leagueId: string;
  leagueName: string;
  onProposeMatch?: (teamId: string) => void;
  onBack: () => void;
}

const LeagueTeamsView = ({ leagueId, leagueName, onProposeMatch, onBack }: LeagueTeamsViewProps) => {
  const { data: teams, isLoading } = useLeagueTeams(leagueId);

  const getPlayerInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Equipos de {leagueName}</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-24 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Equipos de {leagueName}</h1>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay equipos</h3>
              <p className="text-muted-foreground">
                Aún no se han formado equipos en esta liga.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">Equipos de {leagueName}</h1>
        <Badge variant="outline">{teams.length} equipos</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((teamData) => {
          const team = teamData.teams;
          if (!team) return null;

          return (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{team.name}</CardTitle>
                <CardDescription>Equipo de pádel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {getPlayerInitials(team.player1?.[0]?.full_name || 'Jugador 1')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{team.player1?.[0]?.full_name || 'Jugador 1'}</p>
                      <p className="text-xs text-muted-foreground">Jugador 1</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white">
                        {getPlayerInitials(team.player2?.[0]?.full_name || 'Jugador 2')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{team.player2?.[0]?.full_name || 'Jugador 2'}</p>
                      <p className="text-xs text-muted-foreground">Jugador 2</p>
                    </div>
                  </div>
                </div>

                {onProposeMatch && (
                  <Button 
                    onClick={() => onProposeMatch(team.id)}
                    className="w-full mt-4 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                    size="sm"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Proponer Partido
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default LeagueTeamsView;
