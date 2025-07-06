
import { useState } from "react";
import { ArrowLeft, Trophy, Users, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useLeagues } from "@/hooks/useLeagues";
import { useMatches, useCreateMatches } from "@/hooks/useMatches";
import { useLeagueTeams } from "@/hooks/useLeagueTeams";
import MatchesList from "@/components/MatchesList";
import CreateMatchForm from "@/components/CreateMatchForm";

const MatchesPage = () => {
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { isAdmin, isPlayer, profile } = useAuth();

  // Filtrar ligas por club si es jugador
  const { data: leagues } = useLeagues(isPlayer ? profile?.club_id : undefined);
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

  const canGenerateMatches = selectedLeague && 
    leagueTeams && 
    leagueTeams.length >= 2 && 
    (!matches || matches.length === 0) &&
    isAdmin;

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setShowCreateForm(false)}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Crear Nuevo Partido</h1>
        </div>
        
        <CreateMatchForm 
          leagues={activeLeagues}
          onSuccess={() => setShowCreateForm(false)}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            {isPlayer ? "Mis Partidos" : "Gestión de Partidos"}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "Consulta partidos, genera enfrentamientos y gestiona resultados"
              : isPlayer
              ? "Crea partidos, sube resultados y consulta el estado de tus encuentros en tu club"
              : "Crea partidos, sube resultados y consulta el estado de tus encuentros"
            }
          </p>
        </div>
        
        {!isAdmin && (
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear Partido
          </Button>
        )}
      </div>

      {/* League Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2" />
            {isPlayer ? "Seleccionar Liga de Mi Club" : "Seleccionar Liga"}
          </CardTitle>
          <CardDescription>
            {isPlayer 
              ? "Elige una liga de tu club para ver sus partidos"
              : "Elige una liga para ver sus partidos"
            }
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
        <MatchesList leagueId={selectedLeagueId} />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Selecciona una liga</h3>
              <p className="text-muted-foreground">
                {isPlayer 
                  ? "Elige una liga de tu club para ver sus partidos y gestionar encuentros"
                  : "Elige una liga activa para ver sus partidos y gestionar encuentros"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!isAdmin && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Sistema de Partidos
              </CardTitle>
              <CardDescription className="text-blue-700">
                Puedes crear un partido por semana. Los resultados deben ser confirmados por ambos equipos.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
        
        {isAdmin && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                Herramientas de Administrador
              </CardTitle>
              <CardDescription className="text-green-700">
                Puedes generar partidos automáticamente y resolver disputas de resultados.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MatchesPage;
