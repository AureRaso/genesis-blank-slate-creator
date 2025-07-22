
import { Users, Clock, Edit, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ScheduledClassWithTemplate } from "@/hooks/useScheduledClasses";

interface ClassCardProps {
  class: ScheduledClassWithTemplate;
}

export function ClassCard({ class: cls }: ClassCardProps) {
  const enrolledCount = cls.participants?.length || 0;

  const getLevelDisplay = () => {
    if (cls.custom_level) {
      return cls.custom_level.replace('_', ' ');
    }
    if (cls.level_from && cls.level_to) {
      return cls.level_from === cls.level_to ? 
        `Nivel ${cls.level_from}` : 
        `Nivel ${cls.level_from}-${cls.level_to}`;
    }
    return 'Sin nivel';
  };

  const getLevelColor = () => {
    if (cls.custom_level) {
      if (cls.custom_level.includes('primera')) return 'bg-green-100 text-green-800 border-green-200';
      if (cls.custom_level.includes('segunda')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      if (cls.custom_level.includes('tercera')) return 'bg-red-100 text-red-800 border-red-200';
    }
    
    if (cls.level_from) {
      if (cls.level_from <= 3) return 'bg-green-100 text-green-800 border-green-200';
      if (cls.level_from <= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className={cn(
          "w-full p-2 rounded-md text-xs cursor-pointer hover:opacity-80 transition-all border shadow-sm mb-1",
          getLevelColor()
        )}>
          <div className="font-medium truncate mb-1">
            {cls.name}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span className="text-xs">{enrolledCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="text-xs">{cls.duration_minutes}min</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-1 truncate">
            {getLevelDisplay()}
          </div>
        </div>
      </DialogTrigger>

      <ClassDetailsModal class={cls} />
    </Dialog>
  );
}

interface ClassDetailsModalProps {
  class: ScheduledClassWithTemplate;
}

function ClassDetailsModal({ class: cls }: ClassDetailsModalProps) {
  const enrolledCount = cls.participants?.length || 0;

  const getLevelDisplay = () => {
    if (cls.custom_level) {
      return cls.custom_level.replace('_', ' ');
    }
    if (cls.level_from && cls.level_to) {
      return cls.level_from === cls.level_to ? 
        `Nivel ${cls.level_from}` : 
        `Nivel ${cls.level_from}-${cls.level_to}`;
    }
    return 'Sin nivel';
  };

  const getLevelColor = () => {
    if (cls.custom_level) {
      if (cls.custom_level.includes('primera')) return 'bg-green-100 text-green-800 border-green-200';
      if (cls.custom_level.includes('segunda')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      if (cls.custom_level.includes('tercera')) return 'bg-red-100 text-red-800 border-red-200';
    }
    
    if (cls.level_from) {
      if (cls.level_from <= 3) return 'bg-green-100 text-green-800 border-green-200';
      if (cls.level_from <= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>Detalles de la Clase</span>
          <Badge className={getLevelColor()}>
            {getLevelDisplay()}
          </Badge>
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-lg mb-2">{cls.name}</h3>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Horario</div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{cls.start_time.slice(0, 5)}</span>
                <span className="text-muted-foreground">({cls.duration_minutes} min)</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Días de la semana</div>
              <div className="flex flex-wrap gap-1">
                {cls.days_of_week.map((day) => (
                  <Badge key={day} variant="outline" className="text-xs">
                    {day}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Periodo</div>
              <div className="text-sm">
                {format(new Date(cls.start_date), "dd/MM/yyyy")} - {format(new Date(cls.end_date), "dd/MM/yyyy")}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Alumnos inscritos</div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{enrolledCount} alumnos</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Tipo de recurrencia</div>
              <div className="text-sm font-medium">{cls.recurrence_type}</div>
            </div>
          </div>
        </div>

        {cls.participants && cls.participants.length > 0 && (
          <div>
            <div className="text-sm text-muted-foreground mb-3">Lista de alumnos</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {cls.participants.map((participant) => (
                <div key={participant.id} className="text-sm p-3 bg-muted rounded-lg">
                  <div className="font-medium">{participant.student_enrollment.full_name}</div>
                  <div className="text-xs text-muted-foreground">{participant.student_enrollment.email}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t">
          <Button className="flex-1 gap-2">
            <Edit className="h-4 w-4" />
            Editar Clase
          </Button>
          <Button variant="outline" className="flex-1 gap-2">
            <Users className="h-4 w-4" />
            Gestionar Alumnos
          </Button>
          <Button variant="destructive" size="sm" className="gap-2">
            <X className="h-4 w-4" />
            Cancelar
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
