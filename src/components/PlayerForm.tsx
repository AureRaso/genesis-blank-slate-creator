
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreatePlayer } from "@/hooks/usePlayers";

const PlayerForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  
  const createPlayerMutation = useCreatePlayer();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !level) {
      return;
    }

    createPlayerMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      level,
    });

    // Reset form
    setName("");
    setEmail("");
    setLevel(null);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Nuevo Jugador</CardTitle>
        <CardDescription>Registra un nuevo jugador en el sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del jugador"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="level">Nivel (1-5)</Label>
            <Select value={level?.toString() || ""} onValueChange={(value) => setLevel(parseInt(value) as 1 | 2 | 3 | 4 | 5)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Nivel 1 - Principiante</SelectItem>
                <SelectItem value="2">Nivel 2 - Básico</SelectItem>
                <SelectItem value="3">Nivel 3 - Intermedio</SelectItem>
                <SelectItem value="4">Nivel 4 - Avanzado</SelectItem>
                <SelectItem value="5">Nivel 5 - Experto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={createPlayerMutation.isPending}
          >
            {createPlayerMutation.isPending ? "Creando..." : "Crear Jugador"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PlayerForm;
