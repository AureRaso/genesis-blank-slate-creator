
import { useState } from "react";
import { Trash2, Edit, MapPin, Phone, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClubs, usePlayerClubs, useDeleteClub, useAdminClubs } from "@/hooks/useClubs";
import { useAuth } from "@/contexts/AuthContext";
import { Club } from "@/types/clubs";
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

interface ClubsListProps {
  onEditClub: (club: Club) => void;
}

const ClubsList = ({ onEditClub }: ClubsListProps) => {
  const { isAdmin, isPlayer, profile } = useAuth();
  
  // Use different hooks based on user role
  const { data: adminClubs, isLoading: isLoadingAdmin } = useAdminClubs();
  const { data: playerClubs, isLoading: isLoadingPlayer } = usePlayerClubs(
    isPlayer ? profile?.club_id : undefined
  );
  
  const clubs = isPlayer ? playerClubs : adminClubs;
  const isLoading = isPlayer ? isLoadingPlayer : isLoadingAdmin;
  
  const deleteClub = useDeleteClub();
  const [deletingClub, setDeletingClub] = useState<string | null>(null);

  const handleDeleteClub = async (id: string) => {
    setDeletingClub(id);
    try {
      await deleteClub.mutateAsync(id);
    } finally {
      setDeletingClub(null);
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

  if (!clubs || clubs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {isPlayer ? "No estás asignado a ningún club" : "No hay clubs registrados"}
            </h3>
            <p className="text-muted-foreground">
              {isPlayer 
                ? "Contacta con un administrador para ser asignado a un club."
                : "Los clubs que crees aparecerán aquí."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clubs.map((club) => (
        <Card key={club.id} className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-playtomic-orange">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg line-clamp-2 mb-2">{club.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800">
                    {club.status === 'active' ? 'Activo' : club.status || 'Activo'}
                  </Badge>
                  <Badge variant="outline">
                    {club.court_count} {club.court_count === 1 ? 'pista' : 'pistas'}
                  </Badge>
                </div>
              </div>
              {isAdmin && (
                <div className="flex space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditClub(club)}
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
                        disabled={deletingClub === club.id}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar club?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente el club "{club.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteClub(club.id)}
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
            <div className="space-y-2">
              <div className="flex items-start space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 line-clamp-2">{club.address}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-gray-700">{club.phone}</span>
              </div>
            </div>

            {club.court_types && club.court_types.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {club.court_types.map((type, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            )}

            {club.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{club.description}</p>
            )}

            <div className="text-xs text-gray-500 pt-2 border-t">
              Creado el {new Date(club.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ClubsList;
