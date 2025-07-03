
import { UserCheck, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useTrainers, useDeleteTrainer, Trainer } from "@/hooks/useTrainers";
import { useAuth } from "@/contexts/AuthContext";

interface TrainersListProps {
  onEditTrainer: (trainer: Trainer) => void;
  onCreateTrainer: () => void;
}

const TrainerCard = ({ trainer, onEditTrainer }: { trainer: Trainer; onEditTrainer: (trainer: Trainer) => void }) => {
  const deleteTrainer = useDeleteTrainer();
  const { isAdmin } = useAuth();

  const handleDelete = async () => {
    await deleteTrainer.mutateAsync(trainer.id);
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'PR';
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={trainer.photo_url} alt={trainer.profiles?.full_name} />
              <AvatarFallback className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark text-white">
                {getInitials(trainer.profiles?.full_name || '')}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{trainer.profiles?.full_name}</CardTitle>
              <CardDescription className="text-sm">
                {trainer.profiles?.email}
              </CardDescription>
            </div>
          </div>
          {isAdmin && (
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" onClick={() => onEditTrainer(trainer)}>
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
                    <AlertDialogTitle>¿Desactivar profesor?</AlertDialogTitle>
                     <AlertDialogDescription>
                       Esta acción desactivará al profesor "{trainer.profiles?.full_name}". Podrás reactivarlo más tarde.
                     </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Desactivar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {trainer.specialty && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Especialidad:</p>
            <Badge variant="outline" className="text-xs">
              {trainer.specialty}
            </Badge>
          </div>
        )}

        <div className="space-y-1">
          <p className="text-sm font-medium">Clubs asignados:</p>
           <div className="flex flex-wrap gap-1">
             {trainer.trainer_clubs?.map((tc) => (
               <Badge key={tc.clubs.id} variant="secondary" className="text-xs">
                 {tc.clubs.name}
               </Badge>
             ))}
           </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <Badge variant={trainer.is_active ? "default" : "secondary"}>
            {trainer.is_active ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

const TrainersList = ({ onEditTrainer, onCreateTrainer }: TrainersListProps) => {
  const { data: trainers, isLoading, error } = useTrainers();
  const { isAdmin } = useAuth();

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
          <p className="text-red-600">Error al cargar los profesores</p>
        </CardContent>
      </Card>
    );
  }

  if (!trainers || trainers.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay profesores registrados</h3>
          <p className="text-muted-foreground mb-4">
            Crea el primer profesor para poder gestionar clases
          </p>
          {isAdmin && (
            <Button onClick={onCreateTrainer} className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark">
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Profesor
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trainers.map((trainer) => (
        <TrainerCard key={trainer.id} trainer={trainer} onEditTrainer={onEditTrainer} />
      ))}
    </div>
  );
};

export default TrainersList;
