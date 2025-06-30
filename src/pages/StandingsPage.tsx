
import { useState } from "react";
import { Trophy, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeagues } from "@/hooks/useLeagues";
import LeagueStandingsTable from "@/components/LeagueStandingsTable";
import PlayerStandingsTable from "@/components/PlayerStandingsTable";

const StandingsPage = () => {
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  
  const { data: leagues } = useLeagues();
  const selectedLeague = leagues?.find(league => league.id === selectedLeagueId);
  const activeLeagues = leagues?.filter(league => league.status === 'active') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Clasificaciones
          </h1>
          <p className="text-muted-foreground">
            Consulta las tablas de posiciones y estadísticas de las ligas
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
            Elige una liga para ver su clasificación actual
          </CardDescription>
        </CardHeader>
        <CardContent>
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

          {selectedLeague && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-800">{selectedLeague.name}</h3>
                  <p className="text-sm text-green-700">
                    Sistema: {selectedLeague.points_victory} pts victoria, {selectedLeague.points_defeat} pts derrota
                    {selectedLeague.points_per_set && " + pts por set"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-600">
                    {selectedLeague.start_date} - {selectedLeague.end_date}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Standings Tables */}
      {selectedLeagueId ? (
        <Tabs defaultValue="teams" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="teams" className="flex items-center">
              <Trophy className="h-4 w-4 mr-2" />
              Por Parejas
            </TabsTrigger>
            <TabsTrigger value="players" className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Individual
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="teams" className="space-y-4">
            <LeagueStandingsTable 
              leagueId={selectedLeagueId} 
              leagueName={selectedLeague?.name}
            />
          </TabsContent>
          
          <TabsContent value="players" className="space-y-4">
            <PlayerStandingsTable 
              leagueId={selectedLeagueId} 
              leagueName={selectedLeague?.name}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Selecciona una liga</h3>
              <p className="text-muted-foreground">
                Elige una liga activa para ver su tabla de clasificación y estadísticas
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StandingsPage;
