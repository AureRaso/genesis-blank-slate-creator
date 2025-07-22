
import { format, eachDayOfInterval, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ClassCard } from "./ClassCard";
import type { ScheduledClassWithTemplate } from "@/hooks/useScheduledClasses";

interface CalendarGridProps {
  weekStart: Date;
  weekEnd: Date;
  classes: ScheduledClassWithTemplate[];
}

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00"
];

export function CalendarGrid({ weekStart, weekEnd, classes }: CalendarGridProps) {
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getClassesForDayAndTime = (day: Date, timeSlot: string) => {
    const dayName = format(day, 'EEEE', { locale: es }).toLowerCase();
    
    return classes.filter(cls => {
      const classDays = cls.days_of_week.map(d => d.toLowerCase());
      const classTime = cls.start_time.slice(0, 5);
      
      return classDays.includes(dayName) && classTime === timeSlot;
    });
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card max-h-[75vh] overflow-y-auto">
      {/* Header with days */}
      <div className="grid grid-cols-8 bg-muted/50 border-b sticky top-0 z-10">
        <div className="p-3 text-sm font-medium text-muted-foreground border-r">
          Hora
        </div>
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="p-3 text-center border-r last:border-r-0">
            <div className="text-sm font-medium text-muted-foreground">
              {format(day, "EEE", { locale: es })}
            </div>
            <div className={cn(
              "text-lg font-semibold mt-1",
              isSameDay(day, new Date()) && "text-primary"
            )}>
              {format(day, "dd")}
            </div>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="divide-y">
        {TIME_SLOTS.map((timeSlot) => (
          <div key={timeSlot} className="grid grid-cols-8 min-h-[60px]">
            <div className="p-2 text-sm text-muted-foreground border-r bg-muted/20 flex items-center justify-center">
              {timeSlot}
            </div>
            
            {weekDays.map((day) => {
              const dayClasses = getClassesForDayAndTime(day, timeSlot);
              
              return (
                <div 
                  key={`${day.toISOString()}-${timeSlot}`} 
                  className="p-1 border-r last:border-r-0 relative min-h-[60px]"
                >
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
  );
}
