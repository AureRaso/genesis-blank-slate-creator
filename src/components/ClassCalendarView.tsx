
import { useState } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, Clock, Users, MapPin, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { useScheduledClasses, type ScheduledClassWithTemplate } from "@/hooks/useScheduledClasses";
import type { ClassFiltersData } from "./ClassFilters";

interface ClassCalendarViewProps {
  clubId?: string;
  filters: ClassFiltersData;
}

export default function ClassCalendarView({ clubId, filters }: ClassCalendarViewProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  
  const { data: classes, isLoading } = useScheduledClasses({
    startDate: format(weekStart, 'yyyy-MM-dd'),
    endDate: format(weekEnd, 'yyyy-MM-dd'),
  });

  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const timeSlots = generateTimeSlots();

  const goToPreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const goToToday = () => setCurrentWeek(new Date());

  // Filter classes based on active filters
  const filteredClasses = classes?.filter((cls) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        cls.template.name.toLowerCase().includes(searchLower) ||
        cls.enrollments?.some(e => 
          e.student_enrollment.full_name.toLowerCase().includes(searchLower)
        ) ||
        cls.template.group?.name.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (filters.level && cls.template.level !== filters.level) return false;
    if (filters.status && cls.status !== filters.status) return false;
    if (filters.groupId && cls.template.group_id !== filters.groupId) return false;

    return true;
  }) || [];

  const getClassesForDayAndTime = (day: Date, timeSlot: string) => {
    return filteredClasses.filter(cls => {
      const classDate = parseISO(cls.class_date);
      const classTime = cls.start_time.slice(0, 5); // Remove seconds
      return isSameDay(classDate, day) && classTime === timeSlot;
    });
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'iniciacion': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermedio': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'avanzado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendario de Clases
            {filteredClasses.length !== classes?.length && (
              <Badge variant="secondary">
                {filteredClasses.length} de {classes?.length || 0}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoy
            </Button>
            
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <div className="text-sm font-medium ml-4">
              {format(weekStart, "dd MMM", { locale: es })} - {format(weekEnd, "dd MMM yyyy", { locale: es })}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header with days */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="p-2 text-sm font-medium text-muted-foreground">Hora</div>
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="p-2 text-center">
                  <div className="text-sm font-medium">
                    {format(day, "EEE", { locale: es })}
                  </div>
                  <div className={cn(
                    "text-lg font-semibold",
                    isSameDay(day, new Date()) && "text-primary"
                  )}>
                    {format(day, "dd")}
                  </div>
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="space-y-1">
              {timeSlots.map((timeSlot) => (
                <div key={timeSlot} className="grid grid-cols-8 gap-1">
                  <div className="p-2 text-sm text-muted-foreground border-r">
                    {timeSlot}
                  </div>
                  
                  {weekDays.map((day) => {
                    const dayClasses = getClassesForDayAndTime(day, timeSlot);
                    
                    return (
                      <div key={`${day.toISOString()}-${timeSlot}`} className="p-1 min-h-[60px] border border-border/50">
                        {dayClasses.map((cls) => (
                          <ClassCard key={cls.id} class={cls} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ClassCardProps {
  class: ScheduledClassWithTemplate;
}

function ClassCard({ class: cls }: ClassCardProps) {
  const enrolledCount = cls.enrollments?.length || 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className={cn(
          "p-2 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity",
          "border",
          getLevelColor(cls.template.level)
        )}>
          <div className="font-medium truncate">
            {cls.template.name}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Users className="h-3 w-3" />
            <span>{enrolledCount}/{cls.max_students}</span>
          </div>
          {cls.court_number && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>P{cls.court_number}</span>
            </div>
          )}
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detalles de la Clase
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{cls.template.name}</h3>
            <Badge className={getLevelColor(cls.template.level)}>
              {cls.template.level}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Fecha</div>
              <div className="font-medium">
                {format(parseISO(cls.class_date), "dd/MM/yyyy", { locale: es })}
              </div>
            </div>

            <div>
              <div className="text-muted-foreground">Hora</div>
              <div className="font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {cls.start_time.slice(0, 5)} - {cls.end_time.slice(0, 5)}
              </div>
            </div>

            <div>
              <div className="text-muted-foreground">Alumnos</div>
              <div className="font-medium flex items-center gap-1">
                <Users className="h-3 w-3" />
                {enrolledCount}/{cls.max_students}
              </div>
            </div>

            {cls.court_number && (
              <div>
                <div className="text-muted-foreground">Pista</div>
                <div className="font-medium flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Pista {cls.court_number}
                </div>
              </div>
            )}
          </div>

          {cls.template.group && (
            <div>
              <div className="text-muted-foreground text-sm">Grupo</div>
              <div className="font-medium">{cls.template.group.name}</div>
            </div>
          )}

          {cls.template.objective && (
            <div>
              <div className="text-muted-foreground text-sm">Objetivo</div>
              <div className="text-sm">{cls.template.objective}</div>
            </div>
          )}

          {cls.enrollments && cls.enrollments.length > 0 && (
            <div>
              <div className="text-muted-foreground text-sm mb-2">Alumnos inscritos</div>
              <div className="space-y-1">
                {cls.enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="text-sm p-2 bg-muted rounded">
                    {enrollment.student_enrollment.full_name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1">
              Editar
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              Gestionar alumnos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function generateTimeSlots() {
  const slots = [];
  for (let hour = 8; hour <= 22; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 22) {
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  return slots;
}

function getLevelColor(level: string) {
  switch (level) {
    case 'iniciacion': return 'bg-green-100 text-green-800 border-green-200';
    case 'intermedio': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'avanzado': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}
