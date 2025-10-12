
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
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
          Jugadores Registrados
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {players?.length || 0} jugadores en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        {!players || players.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            No hay jugadores registrados
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm sm:text-base truncate">{player.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{player.email}</p>
                  <div className="flex items-center mt-1 text-xs sm:text-sm text-muted-foreground">
                    <Building2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{player.club_name}</span>
                    {player.club_status && (
                      <Badge variant="outline" className="ml-2 text-xs flex-shrink-0">
                        {player.club_status}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <Badge className={`${getLevelColor(player.level)} text-xs`}>
                    <span className="hidden sm:inline">Nivel {player.level} - {getLevelText(player.level)}</span>
                    <span className="sm:hidden">Nv. {player.level}</span>
                  </Badge>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePlayerMutation.mutate(player.id)}
                      disabled={deletePlayerMutation.isPending}
                      className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
