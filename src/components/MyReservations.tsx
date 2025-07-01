
import { Calendar, Clock, MapPin, User, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMyReservations, useCancelReservation } from "@/hooks/useClassReservations";

const MyReservations = () => {
  const { data: reservations, isLoading } = useMyReservations();
  const cancelReservation = useCancelReservation();

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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
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

  if (!reservations?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Calendar className="h-12 w-12 text-playtomic-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-playtomic-gray-900 mb-2">
            No tienes reservas activas
          </h3>
          <p className="text-playtomic-gray-600 text-center">
            Cuando reserves una clase, aparecerá aquí para que puedas gestionarla.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-playtomic-orange">Mis Reservas</h2>
        <p className="text-playtomic-gray-600">
          Gestiona tus clases reservadas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reservations.map((reservation) => (
          <Card key={reservation.id} className="hover:shadow-lg transition-shadow border-playtomic-orange/20">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg text-playtomic-gray-900">
                    {formatDayOfWeek(reservation.class_slots?.day_of_week || "")}
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{reservation.class_slots?.clubs?.name}</span>
                  </CardDescription>
                </div>
                <Badge className={getLevelColor(reservation.class_slots?.level || "")}>
                  {reservation.class_slots?.level === 'iniciacion' ? 'Iniciación' : 
                   reservation.class_slots?.level === 'intermedio' ? 'Intermedio' : 'Avanzado'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-playtomic-orange" />
                  <span className="text-sm font-medium">
                    {reservation.class_slots?.start_time} ({reservation.class_slots?.duration_minutes} min)
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-playtomic-orange" />
                  <span className="text-sm font-medium">
                    Entrenador: {reservation.class_slots?.trainer_name}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-playtomic-orange" />
                  <span className="text-sm">{reservation.class_slots?.objective}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-lg font-semibold text-playtomic-orange">
                  {reservation.class_slots?.price_per_player}€
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Cancelar reserva?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción cancelará tu reserva para la clase. Podrás volver a reservar si quedan plazas disponibles.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => cancelReservation.mutate(reservation.id)}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={cancelReservation.isPending}
                      >
                        Sí, cancelar reserva
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {reservation.notes && (
                <div className="bg-playtomic-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-playtomic-gray-600">
                    <strong>Notas:</strong> {reservation.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyReservations;
