
import { useState } from "react";
import { Clock, MapPin, Users, Euro, Calendar, Target, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useClassSlots } from "@/hooks/useClassSlots";
import { useCreateClassPayment } from "@/hooks/useClassPayment";

const ClassBooking = () => {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const { data: classSlots, isLoading } = useClassSlots();
  const createPayment = useCreateClassPayment();

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

  const getAvailableSpots = (classSlot: any) => {
    const reservedCount = classSlot.class_reservations?.filter((r: any) => r.status === 'reservado').length || 0;
    return classSlot.max_players - reservedCount;
  };

  const handleReservation = (slotId: string) => {
    const slot = classSlots?.find(s => s.id === slotId);
    if (!slot) return;

    createPayment.mutate({
      slotId: slotId,
      trainerName: slot.trainer_name,
      price: slot.price_per_player,
      notes
    });
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

  const availableSlots = classSlots?.filter(slot => {
    const availableSpots = getAvailableSpots(slot);
    return availableSpots > 0 && slot.is_active;
  });

  if (!availableSlots?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Calendar className="h-12 w-12 text-playtomic-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-playtomic-gray-900 mb-2">
            No hay clases disponibles
          </h3>
          <p className="text-playtomic-gray-600 text-center">
            En este momento no hay clases con plazas disponibles. Vuelve a comprobar más tarde.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-playtomic-orange">Clases Disponibles</h2>
        <p className="text-playtomic-gray-600">
          Encuentra y reserva tu clase de pádel ideal
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableSlots.map((classSlot) => {
          const availableSpots = getAvailableSpots(classSlot);
          
          return (
            <Card key={classSlot.id} className="hover:shadow-lg transition-shadow border-playtomic-orange/20">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-playtomic-gray-900">
                      {formatDayOfWeek(classSlot.day_of_week)}
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
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-playtomic-orange" />
                    <span className="text-sm font-medium">{classSlot.start_time} ({classSlot.duration_minutes} min)</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-playtomic-orange" />
                    <span className="text-sm font-medium">Entrenador: {classSlot.trainer_name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-playtomic-orange" />
                    <span className="text-sm">{classSlot.objective}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Euro className="h-4 w-4 text-playtomic-gray-500" />
                      <span className="font-semibold text-playtomic-orange">{classSlot.price_per_player}€</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-playtomic-gray-500" />
                      <span className="text-playtomic-green font-medium">
                        {availableSpots} plazas libres
                      </span>
                    </div>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      className="w-full bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange"
                      onClick={() => setSelectedSlot(classSlot.id)}
                    >
                      Reservar Plaza
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Reserva</AlertDialogTitle>
                       <AlertDialogDescription asChild>
                         <div className="space-y-3">
                           <p>Confirma tu reserva para esta clase. Serás redirigido al pago de {classSlot.price_per_player}€ por la clase.</p>
                           <div className="bg-playtomic-gray-50 p-3 rounded-lg space-y-2">
                             <p><strong>Clase:</strong> {formatDayOfWeek(classSlot.day_of_week)} - {classSlot.start_time}</p>
                             <p><strong>Club:</strong> {classSlot.clubs?.name} - Pista {classSlot.court_number}</p>
                             <p><strong>Entrenador:</strong> {classSlot.trainer_name}</p>
                             <p><strong>Precio:</strong> {classSlot.price_per_player}€</p>
                           </div>
                          <div className="space-y-2">
                            <Label htmlFor="notes">Notas adicionales (opcional)</Label>
                            <Textarea
                              id="notes"
                              placeholder="Cualquier información adicional..."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                            />
                          </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setNotes("")}>
                        Cancelar
                      </AlertDialogCancel>
                       <AlertDialogAction
                         onClick={() => handleReservation(classSlot.id)}
                         className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange"
                         disabled={createPayment.isPending}
                       >
                         {createPayment.isPending ? "Procesando..." : "Pagar y Reservar"}
                       </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ClassBooking;
