
import { useState } from "react";
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { CalendarGrid } from "./calendar/CalendarGrid";
import { useScheduledClasses } from "@/hooks/useScheduledClasses";
import { useAuth } from "@/contexts/AuthContext";
import type { ClassFiltersData } from "./ClassFilters";

interface ClassCalendarViewProps {
  clubId?: string;
  filters: ClassFiltersData;
}

export default function ClassCalendarView({ clubId, filters }: ClassCalendarViewProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { profile } = useAuth();
  
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

  // Filter classes based on active filters
  const filteredClasses = classes?.filter((cls) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        cls.name.toLowerCase().includes(searchLower) ||
        cls.participants?.some(p => 
          p.student_enrollment.full_name.toLowerCase().includes(searchLower)
        );
      if (!matchesSearch) return false;
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
      
      <CalendarGrid
        weekStart={weekStart}
        weekEnd={weekEnd}
        classes={filteredClasses}
      />
    </div>
  );
}
