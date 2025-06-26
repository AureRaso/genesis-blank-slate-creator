
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Clock, Users, Trophy } from "lucide-react";
import { useLeagues } from "@/hooks/useLeagues";
import { useLeagueTeams } from "@/hooks/useLeagueTeams";
import { useAuth } from "@/contexts/AuthContext";
import { useCanCreateMatch, useCreatePlayerMatch } from "@/hooks/usePlayerMatchCreation";

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
    return team?.player1?.email === user?.email || team?.player2?.email === user?.email;
  }) || [];

  // Filtrar equipos oponentes (que no incluyan al usuario)
  const opponentTeams = leagueTeams?.filter(lt => {
    const team = lt.teams;
    return team?.player1?.email !== user?.email && team?.player2?.email !== user?.email;
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
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Verificando permisos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!canCreate) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center">
            <Trophy className="h-5 w-5 mr-2" />
            Límite de partidos alcanzado
          </CardTitle>
          <CardDescription className="text-amber-700">
            Solo puedes crear un partido por semana. Ya has utilizado tu partido de esta semana.
          </CardDescription>
        </CardHeader>
      </Card>
    );
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
          <div>
            <Label htmlFor="league">Liga</Label>
            <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una liga activa..." />
              </SelectTrigger>
              <SelectContent>
                {activeLeagues.map((league) => (
                  <SelectItem key={league.id} value={league.id}>
                    {league.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedLeagueId && (
            <>
              <div>
                <Label htmlFor="team1">Tu Equipo</Label>
                <Select value={selectedTeam1Id} onValueChange={setSelectedTeam1Id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu equipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {userTeams.map((lt) => (
                      <SelectItem key={lt.team_id} value={lt.team_id}>
                        {lt.teams?.name} ({lt.teams?.player1?.name} & {lt.teams?.player2?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="team2">Equipo Oponente</Label>
                <Select value={selectedTeam2Id} onValueChange={setSelectedTeam2Id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el equipo oponente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {opponentTeams.map((lt) => (
                      <SelectItem key={lt.team_id} value={lt.team_id}>
                        {lt.teams?.name} ({lt.teams?.player1?.name} & {lt.teams?.player2?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Fecha (opcional)</Label>
                  <Input
                    id="date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Hora (opcional)</Label>
                  <Input
                    id="time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>

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
