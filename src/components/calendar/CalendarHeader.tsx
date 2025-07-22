
import { format, addWeeks, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CalendarHeaderProps {
  currentWeek: Date;
  weekStart: Date;
  weekEnd: Date;
  totalClasses: number;
  filteredClassesCount: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

export function CalendarHeader({
  currentWeek,
  weekStart,
  weekEnd,
  totalClasses,
  filteredClassesCount,
  onPreviousWeek,
  onNextWeek,
  onToday
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Calendario de Clases</h2>
        </div>
        {filteredClassesCount !== totalClasses && (
          <Badge variant="secondary">
            {filteredClassesCount} de {totalClasses}
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPreviousWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button variant="outline" size="sm" onClick={onToday}>
          Hoy
        </Button>
        
        <Button variant="outline" size="sm" onClick={onNextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <div className="text-sm font-medium ml-4 min-w-[200px] text-right">
          {format(weekStart, "dd MMM", { locale: es })} - {format(weekEnd, "dd MMM yyyy", { locale: es })}
        </div>
      </div>
    </div>
  );
}
