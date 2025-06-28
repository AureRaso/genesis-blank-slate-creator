import { useMatches } from "@/hooks/useMatches";
import { useAuth } from "@/contexts/AuthContext";
import MatchCard from "./MatchCard";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Trophy } from "lucide-react";

interface MatchesListProps {
  leagueId?: string;
  showPlayerMatches?: boolean;
}

const MatchesList = ({ leagueId, showPlayerMatches = false }: MatchesListProps) => {
  const { data: matches, isLoading } = useMatches(leagueId);
  const { profile } = useAuth();

  const filteredMatches = showPlayerMatches && profile
    ? matches?.filter(match => {
        const team1Player1Email = match.team1?.player1?.[0]?.email;
        const team1Player2Email = match.team1?.player2?.[0]?.email;
        const team2Player1Email = match.team2?.player1?.[0]?.email;
        const team2Player2Email = match.team2?.player2?.[0]?.email;
        
        return team1Player1Email === profile.email || 
               team1Player2Email === profile.email || 
               team2Player1Email === profile.email || 
               team2Player2Email === profile.email;
      })
    : matches;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!filteredMatches || filteredMatches.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {showPlayerMatches ? "No tienes partidos" : "No hay partidos programados"}
            </h3>
            <p className="text-muted-foreground">
              {showPlayerMatches 
                ? "Aún no tienes partidos en esta liga." 
                : "Los partidos aparecerán aquí cuando se programen."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group matches by status
  const pendingMatches = filteredMatches.filter(match => match.status === 'pending');
  const completedMatches = filteredMatches.filter(match => match.status === 'completed');

  return (
    <div className="space-y-6">
      {pendingMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Próximos Partidos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {completedMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-green-600" />
            Partidos Finalizados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchesList;
