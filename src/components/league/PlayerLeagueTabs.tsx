
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, BarChart3 } from "lucide-react";
import MatchesList from "../MatchesList";
import LeagueStandingsTable from "../LeagueStandingsTable";

interface PlayerLeagueTabsProps {
  leagueId: string;
  leagueName: string;
}

const PlayerLeagueTabs = ({ leagueId, leagueName }: PlayerLeagueTabsProps) => {
  return (
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
        <LeagueStandingsTable leagueId={leagueId} leagueName={leagueName} />
      </TabsContent>
    </Tabs>
  );
};

export default PlayerLeagueTabs;
