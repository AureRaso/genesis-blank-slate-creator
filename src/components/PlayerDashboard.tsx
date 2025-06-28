
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Users, ArrowRight, Play, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayerLeagues } from "@/hooks/usePlayerLeagues";
import QuickActions from "./QuickActions";
import PlayerLeagueDetails from "./PlayerLeagueDetails";

const PlayerDashboard = () => {
  const { profile } = useAuth();
  const { data: playerLeagues, isLoading } = usePlayerLeagues(profile?.id);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Próxima</Badge>;
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800"><Play className="w-3 h-3 mr-1" />Activa</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800"><CheckCircle className="w-3 h-3 mr-1" />Finalizada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (selectedLeagueId) {
    return (
      <PlayerLeagueDetails 
        leagueId={selectedLeagueId} 
        onBack={() => setSelectedLeagueId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          ¡Hola, {profile?.full_name}!
        </h1>
        <p className="text-muted-foreground">
          Bienvenido a tu panel de jugador. Aquí tienes todo lo que necesitas para gestionar tus partidos.
        </p>
      </div>

      {/* Tus Ligas Activas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-green-600" />
            Tus Ligas
          </CardTitle>
          <CardDescription>
            Ligas en las que estás inscrito
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg" />
              ))}
            </div>
          ) : !playerLeagues || playerLeagues.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sin ligas activas</h3>
              <p className="text-muted-foreground mb-4">
                No estás inscrito en ninguna liga activa.
              </p>
              <Button 
                onClick={() => setSelectedLeagueId('register')}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                <Users className="h-4 w-4 mr-2" />
                Inscribirse en Liga
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {playerLeagues.map((league) => (
                <div 
                  key={league.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{league.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{league.start_date} - {league.end_date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(league.status)}
                    <Button 
                      onClick={() => setSelectedLeagueId(league.id)}
                      size="sm"
                      className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                    >
                      Entrar
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones Rápidas */}
      <QuickActions />
    </div>
  );
};

export default PlayerDashboard;
