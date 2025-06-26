
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Shuffle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface MatchGeneratorProps {
  leagueId: string;
  leagueName: string;
  approvedPlayers: number;
}

const MatchGenerator = ({ leagueId, leagueName, approvedPlayers }: MatchGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [matchesGenerated, setMatchesGenerated] = useState(false);
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const handleGenerateMatches = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate match generation logic
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const teamsCount = Math.floor(approvedPlayers / 2);
      const roundRobinMatches = (teamsCount * (teamsCount - 1)) / 2;
      
      setMatchesGenerated(true);
      toast({
        title: "Partidos generados",
        description: `Se han generado ${roundRobinMatches} partidos para ${teamsCount} equipos.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron generar los partidos automáticamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  const canGenerateMatches = approvedPlayers >= 4; // Minimum 2 teams

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center text-purple-800">
          <Calendar className="h-5 w-5 mr-2" />
          Generación de Partidos
        </CardTitle>
        <CardDescription className="text-purple-700">
          Genera automáticamente el calendario de partidos para {leagueName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Jugadores aprobados:
            </span>
            <Badge variant={canGenerateMatches ? "default" : "secondary"}>
              {approvedPlayers}
            </Badge>
          </div>
          
          {matchesGenerated ? (
            <div className="flex items-center justify-center py-4 text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>Partidos generados exitosamente</span>
            </div>
          ) : (
            <Button 
              onClick={handleGenerateMatches}
              disabled={!canGenerateMatches || isGenerating}
              className="w-full"
              variant={canGenerateMatches ? "default" : "secondary"}
            >
              {isGenerating ? (
                <>
                  <Shuffle className="h-4 w-4 mr-2 animate-spin" />
                  Generando partidos...
                </>
              ) : (
                <>
                  <Shuffle className="h-4 w-4 mr-2" />
                  Generar calendario de partidos
                </>
              )}
            </Button>
          )}
          
          {!canGenerateMatches && (
            <p className="text-xs text-muted-foreground text-center">
              Necesitas al menos 4 jugadores aprobados para generar partidos
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchGenerator;
