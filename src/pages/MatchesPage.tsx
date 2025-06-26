
import { useState } from "react";
import { ArrowLeft, Trophy, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useLeagues } from "@/hooks/useLeagues";
import { useMatches, useCreateMatches } from "@/hooks/useMatches";
import { useLeagueTeams } from "@/hooks/useLeagueTeams";
import MatchesList from "@/components/MatchesList";

const MatchesPage = () => {
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const { isAdmin } = useAuth();

  const { data: leagues } = useLeagues();
  const { data: leagueTeams } = useLeagueTeams(selectedLeagueId);
  const { data: matches } = useMatches(selectedLeagueId);
  const createMatches = useCreateMatches();

  const selectedLeague = leagues?.find(league => league.id === selectedLeagueId);
  const activeLeagues = leagues?.filter(league => league.status === 'active') || [];

  const handleGenerateMatches = () => {
    if (!selectedLeagueId || !leagueTeams) return;
    
    const teamIds = leagueTeams.map(lt => lt.team_id);
    if (teamIds.length < 2) {
      alert("Se necesitan al menos 2 equipos para generar partidos");
      return;
    }

    createMatches.mutate({ leagueId: selectedLeagueId, teamIds });
  };

  const handleSignUp = (matchId: string) => {
    // TODO: Implement sign-up functionality
    console.log('Sign up for match:', matchId);
    // This could open a modal to select players or register interest
  };

  const canGenerateMatches = selectedLeague && 
    leagueTeams && 
    leagueTeams.length >= 2 && 
    (!matches || matches.length === 0) &&
    isAdmin;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Gestión de Partidos
          </h1>
          <p className="text-muted-foreground">
            Consulta partidos, apúntate para jugar y registra resultados
          </p>
        </div>
      </div>

      {/* League Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2" />
            Seleccionar Liga
          </CardTitle>
          <CardDescription>
            Elige una liga para ver sus partidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una liga..." />
                </SelectTrigger>
                <SelectContent>
                  {activeLeagues.map((league) => (
                    <SelectItem key={league.id} value={league.id}>
                      {league.name} ({league.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {canGenerateMatches && (
              <Button 
                onClick={handleGenerateMatches}
                disabled={createMatches.isPending}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {createMatches.isPending ? 'Generando...' : 'Generar Partidos'}
              </Button>
            )}
          </div>

          {selectedLeague && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-800">{selectedLeague.name}</h3>
                  <p className="text-sm text-green-700">
                    {leagueTeams?.length || 0} equipos participantes
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-700">
                    {matches?.length || 0} partidos programados
                  </p>
                  <p className="text-xs text-green-600">
                    Sistema: {selectedLeague.points_victory} pts victoria, {selectedLeague.points_defeat} pts derrota
                    {selectedLeague.points_per_set && " + pts por set"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matches List */}
      {selectedLeagueId ? (
        <MatchesList leagueId={selectedLeagueId} onSignUp={handleSignUp} />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Selecciona una liga</h3>
              <p className="text-muted-foreground">
                Elige una liga activa para ver sus partidos y poder apuntarte
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isAdmin && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Información para Jugadores</CardTitle>
            <CardDescription className="text-blue-700">
              Los administradores se encargan de generar los partidos y registrar resultados. 
              Tú puedes apuntarte a los partidos disponibles.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
};

export default MatchesPage;
