
import { useState } from "react";
import { Trash2, Edit, Trophy, Calendar, DollarSign, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLeagues, useDeleteLeague } from "@/hooks/useLeagues";
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
  clubId?: string;
}

const LeaguesList = ({ onEditLeague, clubId }: LeaguesListProps) => {
  const { isAdmin } = useAuth();
  const { data: leagues, isLoading } = useLeagues(clubId);
  const deleteLeague = useDeleteLeague();
  const [deletingLeague, setDeletingLeague] = useState<string | null>(null);

  const handleDeleteLeague = async (id: string) => {
    setDeletingLeague(id);
    try {
      await deleteLeague.mutateAsync(id);
    } finally {
      setDeletingLeague(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'upcoming':
        return 'Próximamente';
      case 'completed':
        return 'Finalizada';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!leagues || leagues.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay ligas disponibles</h3>
            <p className="text-muted-foreground">
              {clubId 
                ? "No hay ligas creadas en tu club todavía."
                : "Las ligas que crees aparecerán aquí."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {leagues.map((league) => (
        <Card key={league.id} className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg line-clamp-2 mb-2">{league.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(league.status)}>
                    {getStatusText(league.status)}
                  </Badge>
                  {league.clubs && (
                    <Badge variant="outline" className="text-xs">
                      {league.clubs.name}
                    </Badge>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="flex space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditLeague(league)}
                    className="h-8 w-8 p-0 hover:bg-blue-100"
                  >
                    <Edit className="h-4 w-4 text-blue-600" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-red-100"
                        disabled={deletingLeague === league.id}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar liga?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente la liga "{league.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteLeague(league.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Inicio:</span>
              </div>
              <span className="font-medium">{league.start_date}</span>
              
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-red-600" />
                <span className="text-muted-foreground">Fin:</span>
              </div>
              <span className="font-medium">{league.end_date}</span>
            </div>

            <div className="border-t pt-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span>Victoria: {league.points_victory} pts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-red-600" />
                  <span>Derrota: {league.points_defeat} pts</span>
                </div>
              </div>
              {league.points_per_set && (
                <div className="mt-1 text-xs text-blue-600 flex items-center">
                  <Trophy className="h-3 w-3 mr-1" />
                  Puntos adicionales por sets ganados
                </div>
              )}
            </div>

            {league.registration_price > 0 && (
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center space-x-2 text-sm">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">Inscripción:</span>
                </div>
                <span className="font-semibold text-green-600">
                  €{league.registration_price}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default LeaguesList;
