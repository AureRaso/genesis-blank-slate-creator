
import { useState } from "react";
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { CalendarGrid } from "./calendar/CalendarGrid";
import { useScheduledClasses } from "@/hooks/useScheduledClasses";
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
