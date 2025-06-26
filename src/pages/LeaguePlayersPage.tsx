
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLeagues } from "@/hooks/useLeagues";
import LeaguePlayersTable from "@/components/LeaguePlayersTable";

interface LeaguePlayersPageProps {
  onBack: () => void;
}

const LeaguePlayersPage = ({ onBack }: LeaguePlayersPageProps) => {
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const { data: leagues } = useLeagues();
  
  const selectedLeague = leagues?.find(league => league.id === selectedLeagueId);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Inscripciones de Ligas
          </h1>
          <p className="text-muted-foreground">
            Gestiona las inscripciones de jugadores a las ligas
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Liga</CardTitle>
          <CardDescription>
            Elige una liga para ver sus inscripciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una liga..." />
            </SelectTrigger>
            <SelectContent>
              {leagues?.map((league) => (
                <SelectItem key={league.id} value={league.id}>
                  {league.name} ({league.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedLeagueId && (
        <LeaguePlayersTable 
          leagueId={selectedLeagueId} 
          leagueName={selectedLeague?.name}
        />
      )}
    </div>
  );
};

export default LeaguePlayersPage;
