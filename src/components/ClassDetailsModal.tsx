
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Users, MapPin, Target, Euro } from "lucide-react";
import { ClassSlot } from "@/hooks/useClassSlots";

interface ClassDetailsModalProps {
  classSlot: ClassSlot;
  onClose: () => void;
}

const ClassDetailsModal = ({ classSlot, onClose }: ClassDetailsModalProps) => {
  const enrolledStudents = classSlot.class_reservations?.filter(
    reservation => reservation.status === 'reservado'
  ) || [];

  const getDayName = (day: string) => {
    const days: Record<string, string> = {
      'lunes': 'Lunes',
      'martes': 'Martes',
      'miercoles': 'Miércoles',
      'jueves': 'Jueves',
      'viernes': 'Viernes',
      'sabado': 'Sábado',
      'domingo': 'Domingo'
    };
    return days[day] || day;
  };

  const getLevelName = (level: string) => {
    const levels: Record<string, string> = {
      'iniciacion': 'Iniciación',
      'intermedio': 'Intermedio',
      'avanzado': 'Avanzado'
    };
    return levels[level] || level;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-playtomic-orange">
            Detalles de la Clase
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Información General</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">{classSlot.objective}</h3>
                <p className="text-muted-foreground">Objetivo de la clase</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{getLevelName(classSlot.level)}</Badge>
                  <span className="text-sm text-muted-foreground">Nivel</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Euro className="h-4 w-4 text-playtomic-orange" />
                  <span className="font-medium">{classSlot.price_per_player}€</span>
                  <span className="text-sm text-muted-foreground">por persona</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule & Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Horario y Ubicación</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{getDayName(classSlot.day_of_week)}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{classSlot.start_time} - {classSlot.duration_minutes} minutos</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{classSlot.clubs?.name} - Pista {classSlot.court_number}</span>
              </div>
            </CardContent>
          </Card>

          {/* Students */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Alumnos Inscritos</span>
                </div>
                <Badge variant="outline">
                  {enrolledStudents.length} / {classSlot.max_players}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enrolledStudents.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Aún no hay alumnos inscritos en esta clase
                </p>
              ) : (
                <div className="space-y-2">
                  {enrolledStudents.map((reservation, index) => (
                    <div key={reservation.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-playtomic-orange rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {index + 1}
                        </div>
                        <span className="font-medium">{reservation.profiles.full_name}</span>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Confirmado
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClassDetailsModal;
