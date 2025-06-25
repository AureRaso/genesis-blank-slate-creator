
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Users } from "lucide-react";
import { usePlayers, useDeletePlayer } from "@/hooks/usePlayers";
import { useAuth } from "@/contexts/AuthContext";

const PlayersList = () => {
  const { isAdmin } = useAuth();
  const { data: players, isLoading, error } = usePlayers();
  const deletePlayerMutation = useDeletePlayer();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Cargando jugadores...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-red-600">Error al cargar los jugadores</p>
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
