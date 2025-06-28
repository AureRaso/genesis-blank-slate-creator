
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLeagueStandings } from "@/hooks/useLeagueStandings";

interface LeagueStandingsTableProps {
  leagueId: string;
  leagueName?: string;
}

const LeagueStandingsTable = ({ leagueId, leagueName }: LeagueStandingsTableProps) => {
  const { data: standings, isLoading, error } = useLeagueStandings(leagueId);

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="h-4 w-4 flex items-center justify-center text-xs font-semibold text-muted-foreground">{position}</span>;
    }
  };

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
            <p className="text-muted-foreground">Cargando clasificación...</p>
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
            <p className="text-red-700">Error al cargar la clasificación</p>
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
            <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin clasificación</h3>
            <p className="text-muted-foreground">
              No hay resultados suficientes para mostrar la clasificación de esta liga.
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
          <Trophy className="h-5 w-5 mr-2 text-green-600" />
          Clasificación - {leagueName}
        </CardTitle>
        <CardDescription>
          Tabla de posiciones actualizada con los últimos resultados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Pos.</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead className="text-center">PJ</TableHead>
              <TableHead className="text-center">PG</TableHead>
              <TableHead className="text-center">PP</TableHead>
              <TableHead className="text-center">SF</TableHead>
              <TableHead className="text-center">SC</TableHead>
              <TableHead className="text-center">Dif</TableHead>
              <TableHead className="text-center font-semibold">Pts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((standing, index) => (
              <TableRow key={standing.team_id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    {getPositionIcon(index + 1)}
                    {getPositionBadge(index + 1)}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-semibold">{standing.team_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {standing.player1_name} / {standing.player2_name}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">{standing.matches_played}</TableCell>
                <TableCell className="text-center text-green-600 font-medium">
                  {standing.matches_won}
                </TableCell>
                <TableCell className="text-center text-red-600 font-medium">
                  {standing.matches_lost}
                </TableCell>
                <TableCell className="text-center">{standing.sets_won}</TableCell>
                <TableCell className="text-center">{standing.sets_lost}</TableCell>
                <TableCell className="text-center">
                  <span className={(standing.sets_won - standing.sets_lost) >= 0 ? "text-green-600" : "text-red-600"}>
                    {(standing.sets_won - standing.sets_lost) > 0 ? "+" : ""}{standing.sets_won - standing.sets_lost}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold">
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

export default LeagueStandingsTable;
