
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Trophy, Users, MessageCircle, BarChart3 } from "lucide-react";
import { useLeagues } from "@/hooks/useLeagues";
import MatchesList from "./MatchesList";
import LeagueStandingsTable from "./LeagueStandingsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlayerLeagueDetailsProps {
  leagueId: string;
  onBack: () => void;
}

const PlayerLeagueDetails = ({ leagueId, onBack }: PlayerLeagueDetailsProps) => {
  const { data: leagues } = useLeagues();
  const league = leagues?.find(l => l.id === leagueId);

  if (!league) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{league.name}</h1>
            <p className="text-muted-foreground flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              {league.start_date} - {league.end_date}
            </p>
          </div>
        </div>
        <Button 
          variant="outline"
          className="border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Contactar Admin
        </Button>
      </div>

      {/* League Info */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{league.points_victory}</div>
              <div className="text-sm text-muted-foreground">Puntos por Victoria</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{league.points_defeat}</div>
              <div className="text-sm text-muted-foreground">Puntos por Derrota</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {league.points_per_set ? "Sí" : "No"}
              </div>
              <div className="text-sm text-muted-foreground">Puntos por Set</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="matches" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="matches" className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Mis Partidos
          </TabsTrigger>
          <TabsTrigger value="standings" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Clasificación
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Tus Partidos
              </CardTitle>
              <CardDescription>
                Próximos partidos y resultados anteriores en esta liga
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MatchesList leagueId={leagueId} showPlayerMatches={true} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="standings" className="space-y-4">
          <LeagueStandingsTable leagueId={leagueId} leagueName={league.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlayerLeagueDetails;
