
import { useState } from "react";
import { Edit, Trash2, Users, Clock, MapPin, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMyClassSlots, useDeleteClassSlot, ClassSlot } from "@/hooks/useClassSlots";

interface ClassSlotsListProps {
  onEditClassSlot: (classSlot: ClassSlot) => void;
}

const ClassSlotsList = ({ onEditClassSlot }: ClassSlotsListProps) => {
  const { data: classSlots, isLoading } = useMyClassSlots();
  const deleteClassSlot = useDeleteClassSlot();

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'iniciacion':
        return 'bg-playtomic-green text-white';
      case 'intermedio':
        return 'bg-playtomic-orange text-white';
      case 'avanzado':
        return 'bg-playtomic-orange-dark text-white';
      default:
        return 'bg-playtomic-gray-100 text-playtomic-gray-800';
    }
  };

  const formatDayOfWeek = (day: string) => {
    const days = {
      'lunes': 'Lunes',
      'martes': 'Martes', 
      'miercoles': 'Miércoles',
      'jueves': 'Jueves',
      'viernes': 'Viernes',
      'sabado': 'Sábado',
      'domingo': 'Domingo'
    };
    return days[day as keyof typeof days] || day;
  };

  const getAvailableSpots = (classSlot: ClassSlot) => {
    const reservedCount = classSlot.class_reservations?.filter(r => r.status === 'reservado').length || 0;
    return classSlot.max_players - reservedCount;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-playtomic-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-playtomic-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-3 bg-playtomic-gray-200 rounded"></div>
              <div className="h-3 bg-playtomic-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!classSlots?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Users className="h-12 w-12 text-playtomic-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-playtomic-gray-900 mb-2">
            No hay clases creadas
          </h3>
          <p className="text-playtomic-gray-600 text-center">
            Crea tu primera clase para empezar a recibir reservas de jugadores.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classSlots.map((classSlot) => (
          <Card key={classSlot.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg text-playtomic-gray-900">
                    {formatDayOfWeek(classSlot.day_of_week)} - {classSlot.start_time}
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{classSlot.clubs?.name} - Pista {classSlot.court_number}</span>
                  </CardDescription>
                </div>
                <Badge className={getLevelColor(classSlot.level)}>
                  {classSlot.level === 'iniciacion' ? 'Iniciación' : 
                   classSlot.level === 'intermedio' ? 'Intermedio' : 'Avanzado'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-playtomic-gray-900">
                  Entrenador: {classSlot.trainer_name}
                </p>
                <p className="text-sm text-playtomic-gray-600">
                  {classSlot.objective}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-playtomic-gray-500" />
                    <span>{classSlot.duration_minutes} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Euro className="h-4 w-4 text-playtomic-gray-500" />
                    <span>{classSlot.price_per_player}€</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4 text-playtomic-gray-500" />
                  <span className={getAvailableSpots(classSlot) > 0 ? "text-playtomic-green" : "text-red-600"}>
                    {getAvailableSpots(classSlot)}/{classSlot.max_players}
                  </span>
                </div>
              </div>

              {classSlot.class_reservations && classSlot.class_reservations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-playtomic-gray-900">Inscritos:</p>
                  <div className="flex flex-wrap gap-1">
                    {classSlot.class_reservations
                      .filter(r => r.status === 'reservado')
                      .map((reservation) => (
                      <Badge key={reservation.id} variant="secondary" className="text-xs">
                        {reservation.profiles.full_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditClassSlot(classSlot)}
                    className="flex items-center space-x-1"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Editar</span>
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar clase?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará la clase y todas las reservas asociadas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            console.log('🟢 [BUTTON] Eliminar button clicked for class:', classSlot.id);
                            console.log('🟢 [BUTTON] deleteClassSlot object:', deleteClassSlot);
                            deleteClassSlot.mutate(classSlot.id);
                          }}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <Badge variant={classSlot.is_active ? "default" : "secondary"}>
                  {classSlot.is_active ? "Activa" : "Inactiva"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClassSlotsList;
