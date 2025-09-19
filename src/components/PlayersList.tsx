
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Users, Building2, Search } from "lucide-react";
import { usePlayers, useDeletePlayer } from "@/hooks/usePlayers";
import { useAuth } from "@/contexts/AuthContext";
import { useClubs } from "@/hooks/useClubs";

const PlayersList = () => {
  const { isAdmin, profile } = useAuth();
  const { data: players, isLoading, error } = usePlayers();
  const { data: clubs = [] } = useClubs();
  const deletePlayerMutation = useDeletePlayer();

  const [searchTerm, setSearchTerm] = useState("");
  const [clubFilter, setClubFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");

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

  const filteredPlayers = players?.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClub = clubFilter === "all" || player.club_id === clubFilter;
    const matchesLevel = levelFilter === "all" || player.level.toString() === levelFilter;
    
    return matchesSearch && matchesClub && matchesLevel;
  }) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Jugadores Registrados
        </CardTitle>
        <CardDescription>
          {filteredPlayers.length} de {players?.length || 0} jugadores
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={clubFilter} onValueChange={setClubFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Club" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {clubs.map((club) => (
                <SelectItem key={club.id} value={club.id}>
                  {club.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Nivel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="1">Nivel 1 - Principiante</SelectItem>
              <SelectItem value="2">Nivel 2 - Básico</SelectItem>
              <SelectItem value="3">Nivel 3 - Intermedio</SelectItem>
              <SelectItem value="4">Nivel 4 - Avanzado</SelectItem>
              <SelectItem value="5">Nivel 5 - Experto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredPlayers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {players?.length === 0 ? "No hay jugadores registrados" : "No se encontraron jugadores con los filtros seleccionados"}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredPlayers.map((player) => (
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
