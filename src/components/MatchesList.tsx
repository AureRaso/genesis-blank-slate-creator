
import { useState } from "react";
import { Calendar, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMatches } from "@/hooks/useMatches";
import MatchCard from "./MatchCard";

interface MatchesListProps {
  leagueId?: string;
  onSignUp?: (matchId: string) => void;
}

const MatchesList = ({ leagueId, onSignUp }: MatchesListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roundFilter, setRoundFilter] = useState("all");

  const { data: matches, isLoading, error } = useMatches(leagueId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando partidos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-red-700">Error al cargar los partidos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay partidos</h3>
            <p className="text-muted-foreground">
              {leagueId ? "Esta liga no tiene partidos programados aún." : "No hay partidos disponibles."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get unique rounds for filter
  const rounds = [...new Set(matches.map(match => match.round))].sort((a, b) => a - b);

  // Filter matches
  const filteredMatches = matches.filter(match => {
    const matchesSearch = !searchTerm || 
      match.team1?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.team2?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.team1?.player1?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.team1?.player2?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.team2?.player1?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.team2?.player2?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || match.status === statusFilter;
    const matchesRound = roundFilter === "all" || match.round.toString() === roundFilter;

    return matchesSearch && matchesStatus && matchesRound;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
          <CardDescription>
            Busca y filtra partidos por equipos, estado o ronda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar equipos o jugadores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roundFilter} onValueChange={setRoundFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Ronda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las rondas</SelectItem>
                {rounds.map(round => (
                  <SelectItem key={round} value={round.toString()}>
                    Ronda {round}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setRoundFilter("all");
              }}
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Matches Grid */}
      {filteredMatches.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron partidos con los filtros aplicados</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMatches.map((match) => (
            <MatchCard 
              key={match.id} 
              match={match} 
              onSignUp={onSignUp}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchesList;
