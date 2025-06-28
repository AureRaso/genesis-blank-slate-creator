
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Trophy, Users, UserPlus } from "lucide-react";
import { useMatches } from "@/hooks/useMatches";
import { useAuth } from "@/contexts/AuthContext";

interface MatchesListProps {
  leagueId: string;
  onSignUp?: (matchId: string) => void;
}

const MatchesList = ({ leagueId, onSignUp }: MatchesListProps) => {
  const { data: matches, isLoading } = useMatches(leagueId);
  const { user } = useAuth();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Cargando partidos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay partidos programados</h3>
            <p className="text-muted-foreground">
              Los partidos aparecerán aquí una vez que se generen para esta liga
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pendiente</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">En Curso</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canUserSignUp = (match: any) => {
    if (!user || match.status !== 'pending') return false;
    
    // Check if user is part of either team
    const team1Player1Email = match.team1?.player1?.email;
    const team1Player2Email = match.team1?.player2?.email;
    const team2Player1Email = match.team2?.player1?.email;
    const team2Player2Email = match.team2?.player2?.email;
    
    return team1Player1Email === user.email || 
           team1Player2Email === user.email || 
           team2Player1Email === user.email || 
           team2Player2Email === user.email;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Partidos de la Liga
          </CardTitle>
          <CardDescription>
            {matches.length} partido{matches.length !== 1 ? 's' : ''} programado{matches.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
      </Card>

      {matches.map((match) => (
        <Card key={match.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Ronda {match.round}
                </span>
                {getStatusBadge(match.status)}
              </div>
              {match.scheduled_date && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(match.scheduled_date).toLocaleDateString()}
                  {match.scheduled_time && (
                    <>
                      <Clock className="h-4 w-4 ml-2 mr-1" />
                      {match.scheduled_time}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <h3 className="font-semibold">{match.team1?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {match.team1?.player1?.full_name} & {match.team1?.player2?.full_name}
                    </p>
                  </div>
                  
                  <div className="px-4">
                    <div className="text-center">
                      <span className="text-2xl font-bold text-muted-foreground">VS</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="font-semibold">{match.team2?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {match.team2?.player1?.full_name} & {match.team2?.player2?.full_name}
                    </p>
                  </div>
                </div>
              </div>
              
              {canUserSignUp(match) && onSignUp && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSignUp(match.id)}
                  className="ml-4"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Apuntarse
                </Button>
              )}
            </div>

            {match.match_results && Array.isArray(match.match_results) && match.match_results.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm">
                  <span className="font-medium">Resultado:</span>
                  <div className="mt-1 space-y-1">
                    {match.match_results.map((result: any) => (
                      <div key={result.id} className="flex justify-between">
                        <span>Set 1: {result.team1_set1} - {result.team2_set1}</span>
                        <span>Set 2: {result.team1_set2} - {result.team2_set2}</span>
                        {result.team1_set3 !== null && (
                          <span>Set 3: {result.team1_set3} - {result.team2_set3}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MatchesList;
