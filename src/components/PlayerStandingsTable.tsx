
import { User, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { usePlayerStandings } from "@/hooks/usePlayerStandings";

interface PlayerStandingsTableProps {
  leagueId: string;
  leagueName?: string;
}

const PlayerStandingsTable = ({ leagueId, leagueName }: PlayerStandingsTableProps) => {
  const { data: standings, isLoading, error } = usePlayerStandings(leagueId);

  const getPositionBadge = (position: number) => {
    if (position === 1) {
      return <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">1º</Badge>;
    }
    if (position === 2) {
      return <Badge className="bg-gradient-to-r from-gray-400 to-gray-600 text-white">2º</Badge>;
    }
    if (position === 3) {
      return <Badge className="bg-gradient-to-r from-amber-500 to-amber-700 text-white">3º</Badge>;
    }
    return <Badge variant="outline">{position}º</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando clasificación individual...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-red-700">Error al cargar la clasificación individual</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!standings || standings.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin clasificación individual</h3>
            <p className="text-muted-foreground">
              Aún no hay partidos disputados en esta liga para mostrar estadísticas individuales.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2 text-blue-600" />
          Clasificación Individual - {leagueName}
        </CardTitle>
        <CardDescription>
          Rendimiento individual de cada jugador en la liga
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Pos.</TableHead>
              <TableHead>Jugador</TableHead>
              <TableHead className="text-center">PJ</TableHead>
              <TableHead className="text-center">PG</TableHead>
              <TableHead className="text-center">PP</TableHead>
              <TableHead className="text-center">% Vict.</TableHead>
              <TableHead className="text-center">SF</TableHead>
              <TableHead className="text-center">SC</TableHead>
              <TableHead className="text-center">JF</TableHead>
              <TableHead className="text-center">JC</TableHead>
              <TableHead className="text-center font-semibold">Pts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((standing, index) => (
              <TableRow key={standing.player_id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  {getPositionBadge(index + 1)}
                </TableCell>
                <TableCell>
                  <div className="font-semibold">{standing.player_name}</div>
                </TableCell>
                <TableCell className="text-center">{standing.matches_played}</TableCell>
                <TableCell className="text-center text-green-600 font-medium">
                  {standing.matches_won}
                </TableCell>
                <TableCell className="text-center text-red-600 font-medium">
                  {standing.matches_lost}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-xs">
                    {standing.win_percentage.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-center">{standing.sets_won}</TableCell>
                <TableCell className="text-center">{standing.sets_lost}</TableCell>
                <TableCell className="text-center">{standing.games_won}</TableCell>
                <TableCell className="text-center">{standing.games_lost}</TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold">
                    {standing.points}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PlayerStandingsTable;
