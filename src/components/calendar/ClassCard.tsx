
import { useState } from "react";
import { Users, Clock, Edit, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { EditClassModal } from "./EditClassModal";
import { ManageStudentsModal } from "./ManageStudentsModal";
import type { ScheduledClassWithTemplate } from "@/hooks/useScheduledClasses";

interface ClassCardProps {
  class: ScheduledClassWithTemplate;
}

export function ClassCard({ class: cls }: ClassCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showManageStudents, setShowManageStudents] = useState(false);
  
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

  const getEndTime = () => {
    const [hours, minutes] = cls.start_time.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + cls.duration_minutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <div className={cn(
                  "w-full h-full p-2 rounded-md text-xs cursor-pointer hover:opacity-90 transition-all border shadow-sm",
                  "flex flex-col justify-between",
                  getLevelColor()
                )}>
                  <div className="space-y-1">
                    <div className="font-medium truncate text-sm leading-tight">
                      {cls.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {getLevelDisplay()}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span className="text-xs">{enrolledCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">{cls.duration_minutes}min</span>
                    </div>
                  </div>
                </div>
              </DialogTrigger>

              <ClassDetailsModal 
                class={cls} 
                onEditClass={() => {
                  setShowDetails(false);
                  setShowEditModal(true);
                }}
                onManageStudents={() => {
                  setShowDetails(false);
                  setShowManageStudents(true);
                }}
              />
            </Dialog>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-medium">{cls.name}</div>
              <div className="text-xs">
                {cls.start_time.slice(0, 5)} - {getEndTime()} ({cls.duration_minutes} min)
              </div>
              <div className="text-xs">{enrolledCount} alumnos inscritos</div>
              <div className="text-xs">{getLevelDisplay()}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <EditClassModal 
        class={cls}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />

      <ManageStudentsModal 
        class={cls}
        isOpen={showManageStudents}
        onClose={() => setShowManageStudents(false)}
      />
    </>
  );
}

interface ClassDetailsModalProps {
  class: ScheduledClassWithTemplate;
  onEditClass: () => void;
  onManageStudents: () => void;
}

function ClassDetailsModal({ class: cls, onEditClass, onManageStudents }: ClassDetailsModalProps) {
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

  const getEndTime = () => {
    const [hours, minutes] = cls.start_time.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + cls.duration_minutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
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
                <span className="font-medium">{cls.start_time.slice(0, 5)} - {getEndTime()}</span>
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
                {new Date(cls.start_date).toLocaleDateString('es-ES')} - {new Date(cls.end_date).toLocaleDateString('es-ES')}
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
          <Button onClick={onEditClass} className="flex-1 gap-2">
            <Edit className="h-4 w-4" />
            Editar Clase
          </Button>
          <Button onClick={onManageStudents} variant="outline" className="flex-1 gap-2">
            <Settings className="h-4 w-4" />
            Gestionar Alumnos
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
