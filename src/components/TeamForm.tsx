
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateTeam } from "@/hooks/useTeams";
import { usePlayers } from "@/hooks/usePlayers";

const TeamForm = () => {
  const [name, setName] = useState("");
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  
  const { data: players } = usePlayers();
  const createTeamMutation = useCreateTeam();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !player1Id || !player2Id || player1Id === player2Id) {
      return;
    }

    createTeamMutation.mutate({
      name: name.trim(),
      player1_id: player1Id,
      player2_id: player2Id,
    });

    // Reset form
    setName("");
    setPlayer1Id("");
    setPlayer2Id("");
  };

  const availablePlayersForPlayer2 = players?.filter(p => p.id !== player1Id) || [];

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Nueva Pareja</CardTitle>
        <CardDescription>Forma una nueva pareja de jugadores</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teamName">Nombre de la Pareja</Label>
            <Input
              id="teamName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Los Campeones"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="player1">Jugador 1</Label>
            <Select value={player1Id} onValueChange={setPlayer1Id}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el primer jugador" />
              </SelectTrigger>
              <SelectContent>
                {players?.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name} (Nivel {player.level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="player2">Jugador 2</Label>
            <Select value={player2Id} onValueChange={setPlayer2Id}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el segundo jugador" />
              </SelectTrigger>
              <SelectContent>
                {availablePlayersForPlayer2.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name} (Nivel {player.level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={createTeamMutation.isPending || !players || players.length < 2}
          >
            {createTeamMutation.isPending ? "Creando..." : "Crear Pareja"}
          </Button>
          
          {players && players.length < 2 && (
            <p className="text-sm text-muted-foreground text-center">
              Se necesitan al menos 2 jugadores para formar una pareja
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default TeamForm;
