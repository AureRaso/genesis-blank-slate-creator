
import { useState } from "react";
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { CalendarGrid } from "./calendar/CalendarGrid";
import { TrainerLegend } from "./calendar/TrainerLegend";
import { useScheduledClasses } from "@/hooks/useScheduledClasses";
import { useAuth } from "@/contexts/AuthContext";
import type { ClassFiltersData } from "@/contexts/ClassFiltersContext";

interface ClassCalendarViewProps {
  clubId?: string;
  filters: ClassFiltersData;
}

export default function ClassCalendarView({ clubId, filters }: ClassCalendarViewProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { profile, isAdmin } = useAuth();
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  
  console.log("ClassCalendarView - Current user profile:", profile);
  console.log("ClassCalendarView - Week range:", {
    weekStart: format(weekStart, 'yyyy-MM-dd'),
    weekEnd: format(weekEnd, 'yyyy-MM-dd')
  });
  
  const { data: classes, isLoading, error } = useScheduledClasses({
    startDate: format(weekStart, 'yyyy-MM-dd'),
    endDate: format(weekEnd, 'yyyy-MM-dd'),
    clubId: clubId,
  });

  console.log("ClassCalendarView - useScheduledClasses result:", { classes, isLoading, error });

  const goToPreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const goToToday = () => setCurrentWeek(new Date());

  // Aplicar todos los filtros
  const filteredClasses = classes?.filter((cls) => {
    // Filtro de búsqueda existente
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        cls.name.toLowerCase().includes(searchLower) ||
        cls.participants?.some(p => 
          p.student_enrollment.full_name.toLowerCase().includes(searchLower)
        );
      if (!matchesSearch) return false;
    }

    // Filtro por tamaño de grupo
    const participantCount = cls.participants?.length || 0;
    if (filters.minGroupSize !== undefined && participantCount < filters.minGroupSize) return false;
    if (filters.maxGroupSize !== undefined && participantCount > filters.maxGroupSize) return false;

    // Filtro por nivel numérico
    if (filters.levelFrom !== undefined && cls.level_from !== undefined && cls.level_from < filters.levelFrom) return false;
    if (filters.levelTo !== undefined && cls.level_to !== undefined && cls.level_to > filters.levelTo) return false;

    // Filtro por niveles personalizados
    if (filters.customLevels.length > 0 && cls.custom_level) {
      if (!filters.customLevels.includes(cls.custom_level)) return false;
    }

    // Filtro por días de la semana
    if (filters.weekDays.length > 0) {
      const hasMatchingDay = cls.days_of_week.some(day => 
        filters.weekDays.includes(day.toLowerCase())
      );
      if (!hasMatchingDay) return false;
    }

    // Filtro por nombre/email de alumno
    if (filters.studentName) {
      const studentNameLower = filters.studentName.toLowerCase();
      const hasMatchingStudent = cls.participants?.some(p => 
        p.student_enrollment.full_name.toLowerCase().includes(studentNameLower) ||
        p.student_enrollment.email.toLowerCase().includes(studentNameLower)
      );
      if (!hasMatchingStudent) return false;
    }

    // Filtro por descuentos
    if (filters.withDiscountOnly) {
      const hasDiscount = cls.participants?.some(p => 
        (p.discount_1 !== null && p.discount_1 > 0) ||
        (p.discount_2 !== null && p.discount_2 > 0)
      );
      if (!hasDiscount) return false;
    }

    return true;
  }) || [];

  console.log("ClassCalendarView - Filtered classes:", filteredClasses);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.error("Error loading classes:", error);
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            Error al cargar las clases: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <CalendarHeader
        currentWeek={currentWeek}
        weekStart={weekStart}
        weekEnd={weekEnd}
        totalClasses={classes?.length || 0}
        filteredClassesCount={filteredClasses.length}
        onPreviousWeek={goToPreviousWeek}
        onNextWeek={goToNextWeek}
        onToday={goToToday}
      />
      
      {/* Show trainer legend for admins when there are multiple trainers */}
      {isAdmin && <TrainerLegend classes={filteredClasses} />}
      
      <CalendarGrid
        weekStart={weekStart}
        weekEnd={weekEnd}
        classes={filteredClasses}
      />
    </div>
  );
}
