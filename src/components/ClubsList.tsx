
import { useState } from "react";
import { Building2, MapPin, Phone, Users, Trash2, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useClubs, useDeleteClub, useClubLeagues } from "@/hooks/useClubs";
import { Club } from "@/types/clubs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ClubsListProps {
  onEditClub: (club: Club) => void;
}

const ClubCard = ({ club, onEditClub }: { club: Club; onEditClub: (club: Club) => void }) => {
  const deleteClub = useDeleteClub();
  const { data: leagues } = useClubLeagues(club.id);

  const handleDelete = async () => {
    await deleteClub.mutateAsync(club.id);
  };

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-green-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{club.name}</CardTitle>
              <CardDescription className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {club.address.substring(0, 50)}...
              </CardDescription>
            </div>
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" onClick={() => onEditClub(club)}>
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar club?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente el club "{club.name}".
                    {leagues && leagues.length > 0 && (
                      <span className="text-red-600 font-medium">
                        <br />Atención: Este club tiene {leagues.length} liga(s) asociada(s).
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-muted-foreground">
            <Phone className="h-4 w-4 mr-2" />
            {club.phone}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            {club.court_count} pista{club.court_count !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Tipos de pistas:</p>
          <div className="flex flex-wrap gap-1">
            {club.court_types.map((type) => (
              <Badge key={type} variant="outline" className="text-xs capitalize">
                {type}
              </Badge>
            ))}
          </div>
        </div>

        {club.description && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Descripción:</p>
            <p className="text-sm text-muted-foreground">{club.description}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            {leagues ? (
              <>
                <Badge variant="secondary" className="mr-2">
                  {leagues.length} liga{leagues.length !== 1 ? 's' : ''}
                </Badge>
                asociada{leagues.length !== 1 ? 's' : ''}
              </>
            ) : (
              "Cargando ligas..."
            )}
          </div>
          {leagues && leagues.length > 0 && (
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Ver ligas
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ClubsList = ({ onEditClub }: ClubsListProps) => {
  const { data: clubs, isLoading, error } = useClubs();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-red-600">Error al cargar los clubs</p>
        </CardContent>
      </Card>
    );
  }

  if (!clubs || clubs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay clubs registrados</h3>
          <p className="text-muted-foreground">
            Crea tu primer club para empezar a gestionar ligas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clubs.map((club) => (
        <ClubCard key={club.id} club={club} onEditClub={onEditClub} />
      ))}
    </div>
  );
};

export default ClubsList;
