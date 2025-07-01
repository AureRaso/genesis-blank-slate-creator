
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Users, Plus } from "lucide-react";
import { usePlayerLeagues } from "@/hooks/usePlayerLeagues";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const PlayerDashboard = () => {
  const { profile } = useAuth();
  const { data: playerLeagues, isLoading } = usePlayerLeagues(profile?.id);
  const navigate = useNavigate();

  const handleInscriptionClick = () => {
    navigate('/league-players');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!playerLeagues || playerLeagues.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No participas en ninguna liga</h3>
            <p className="text-muted-foreground mb-4">
              Únete a una liga para comenzar a jugar y competir con otros jugadores.
            </p>
            <Button 
              onClick={handleInscriptionClick}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Inscribirse en Liga
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Mis Ligas</h2>
        <Button 
          onClick={handleInscriptionClick}
          className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Inscribirse en Liga
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {playerLeagues.map((league) => (
          <Card key={league.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{league.name}</CardTitle>
                <Badge 
                  className={
                    league.status === 'active' 
                      ? "bg-green-100 text-green-800" 
                      : "bg-blue-100 text-blue-800"
                  }
                >
                  {league.status === 'active' ? 'Activa' : 'Próximamente'}
                </Badge>
              </div>
              <CardDescription className="flex items-center space-x-4">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {league.start_date} - {league.end_date}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Puntos victoria:</span>
                  <span className="font-medium">{league.points_victory}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Puntos derrota:</span>
                  <span className="font-medium">{league.points_defeat}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Precio:</span>
                  <span className="font-medium">
                    {league.registration_price > 0 ? `€${league.registration_price}` : 'Gratis'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PlayerDashboard;
