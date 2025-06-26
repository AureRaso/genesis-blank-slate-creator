
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Trophy, Users, Play, Pause, CheckCircle, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLeagues, useDeleteLeague } from "@/hooks/useLeagues";
import { useLeagueTeams } from "@/hooks/useLeagueTeams";
import { useAuth } from "@/contexts/AuthContext";
import { League } from "@/types/padel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LeaguesListProps {
  onEditLeague: (league: League) => void;
}

const LeaguesList = ({ onEditLeague }: LeaguesListProps) => {
  const { data: leagues, isLoading } = useLeagues();
  const deleteLeague = useDeleteLeague();
  const { isAdmin } = useAuth();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Play className="w-3 h-3 mr-1" />Próxima</Badge>;
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800"><Pause className="w-3 h-3 mr-1" />Activa</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800"><CheckCircle className="w-3 h-3 mr-1" />Completada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  const LeagueTeamsInfo = ({ leagueId }: { leagueId: string }) => {
    const { data: leagueTeams } = useLeagueTeams(leagueId);
    const teamCount = leagueTeams?.length || 0;
    
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Users className="w-4 h-4 mr-1" />
        {teamCount} {teamCount === 1 ? "equipo" : "equipos"}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
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
    );
  }

  if (!leagues || leagues.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay ligas creadas</h3>
            <p className="text-muted-foreground">
              Crea tu primera liga para comenzar a organizar torneos de pádel.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {leagues.map((league) => (
        <Card key={league.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-xl">{league.name}</CardTitle>
                {getStatusBadge(league.status)}
              </div>
              <CardDescription className="flex items-center gap-4">
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(league.start_date)} - {formatDate(league.end_date)}
                </div>
                <LeagueTeamsInfo leagueId={league.id} />
              </CardDescription>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEditLeague(league)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar liga?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente la liga
                        "{league.name}" y todos sus datos asociados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteLeague.mutate(league.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">SISTEMA DE PUNTOS</h4>
                <div className="text-sm">
                  <div>Victoria: <span className="font-semibold">{league.points_victory} puntos</span></div>
                  <div>Derrota: <span className="font-semibold">{league.points_defeat} puntos</span></div>
                  {league.points_per_set && (
                    <div className="text-green-600">+ 1 punto por set ganado</div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">FECHAS</h4>
                <div className="text-sm">
                  <div>Inicio: <span className="font-semibold">{formatDate(league.start_date)}</span></div>
                  <div>Fin: <span className="font-semibold">{formatDate(league.end_date)}</span></div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">ESTADO</h4>
                <div className="text-sm">
                  {getStatusBadge(league.status)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default LeaguesList;
