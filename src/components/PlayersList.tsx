
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Users, Building2 } from "lucide-react";
import { usePlayers, useDeletePlayer } from "@/hooks/usePlayers";
import { useAuth } from "@/contexts/AuthContext";

const PlayersList = () => {
  const { isAdmin, profile } = useAuth();
  const { data: players, isLoading, error } = usePlayers();
  const deletePlayerMutation = useDeletePlayer();

  console.log('👥 PlayersList Debug:', {
    isAdmin,
    profileId: profile?.id,
    profileRole: profile?.role,
    isLoading,
    error: error?.message,
    playersCount: players?.length || 0,
    firstFewPlayers: players?.slice(0, 3).map(p => ({ id: p.id, name: p.name, club_id: p.club_id })) || []
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Jugadores Registrados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange"></div>
            <span className="ml-2 text-muted-foreground">Cargando jugadores...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Jugadores Registrados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-center text-red-600">
            Error al cargar los jugadores: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getLevelColor = (level: number) => {
    const colors = {
      1: "bg-gray-100 text-gray-800",
      2: "bg-blue-100 text-blue-800",
      3: "bg-green-100 text-green-800",
      4: "bg-orange-100 text-orange-800",
      5: "bg-red-100 text-red-800",
    };
    return colors[level as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getLevelText = (level: number) => {
    const texts = {
      1: "Principiante",
      2: "Básico",
      3: "Intermedio",
      4: "Avanzado",
      5: "Experto",
    };
    return texts[level as keyof typeof texts] || "Desconocido";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Jugadores Registrados
        </CardTitle>
        <CardDescription>
          {players?.length || 0} jugadores en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!players || players.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay jugadores registrados
          </p>
        ) : (
          <div className="space-y-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{player.name}</h3>
                  <p className="text-sm text-muted-foreground">{player.email}</p>
                  <div className="flex items-center mt-1 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4 mr-1" />
                    <span>{player.club_name}</span>
                    {player.club_status && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {player.club_status}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getLevelColor(player.level)}>
                    Nivel {player.level} - {getLevelText(player.level)}
                  </Badge>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePlayerMutation.mutate(player.id)}
                      disabled={deletePlayerMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayersList;
