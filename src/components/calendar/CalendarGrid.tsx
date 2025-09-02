
import { format, eachDayOfInterval, isSameDay } from "date-fns";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { ClassCard } from "./ClassCard";
import type { ScheduledClassWithTemplate } from "@/hooks/useScheduledClasses";

interface CalendarGridProps {
  weekStart: Date;
  weekEnd: Date;
  classes: ScheduledClassWithTemplate[];
  onTimeSlotClick?: (day: Date, timeSlot: string) => void;
  onClassDrop?: (classId: string, newDay: Date, newTimeSlot: string) => void;
}

const TIME_SLOTS = [
  "08:00", "08:15", "08:30", "08:45", "09:00", "09:15", "09:30", "09:45",
  "10:00", "10:15", "10:30", "10:45", "11:00", "11:15", "11:30", "11:45",
  "12:00", "12:15", "12:30", "12:45", "13:00", "13:15", "13:30", "13:45",
  "14:00", "14:15", "14:30", "14:45", "15:00", "15:15", "15:30", "15:45",
  "16:00", "16:15", "16:30", "16:45", "17:00", "17:15", "17:30", "17:45",
  "18:00", "18:15", "18:30", "18:45", "19:00", "19:15", "19:30", "19:45",
  "20:00", "20:15", "20:30", "20:45", "21:00", "21:15", "21:30", "21:45", "22:00"
];

const SLOT_HEIGHT = 25; // Height in pixels for each 15-minute slot

// Mapping of day names to standardized Spanish format (database format)
const DAY_MAPPING: { [key: string]: string } = {
  // Spanish (database format - without accents)
  'domingo': 'domingo',
  'lunes': 'lunes', 
  'martes': 'martes',
  'miercoles': 'miercoles', // Database uses no accent
  'miércoles': 'miercoles', // Handle accented version too
  'jueves': 'jueves',
  'viernes': 'viernes',
  'sabado': 'sabado', // Database uses no accent  
  'sábado': 'sabado', // Handle accented version too
  // English to Spanish mappings
  'sunday': 'domingo',
  'monday': 'lunes',
  'tuesday': 'martes', 
  'wednesday': 'miercoles',
  'thursday': 'jueves',
  'friday': 'viernes',
  'saturday': 'sabado'
};

export function CalendarGrid({ weekStart, weekEnd, classes, onTimeSlotClick, onClassDrop }: CalendarGridProps) {
  const { t } = useTranslation();
  const { getDateFnsLocale } = useLanguage();
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getClassesForDayAndTime = (day: Date, timeSlot: string) => {
    const dayName = format(day, 'EEEE', { locale: getDateFnsLocale() }).toLowerCase();
    
    const matchingClasses = classes.filter(cls => {
      const classDays = cls.days_of_week.map(d => {
        const normalized = d.toLowerCase().trim();
        // Normalize to database format (without accents)
        return DAY_MAPPING[normalized] || normalized;
      });
      
      const classTime = cls.start_time.slice(0, 5);
      // Map the current day name to Spanish for comparison
      const normalizedDayName = DAY_MAPPING[dayName] || dayName;
      
      const dayMatches = classDays.includes(normalizedDayName);
      const timeMatches = classTime === timeSlot;
      
      return dayMatches && timeMatches;
    });
    
    return matchingClasses;
  };

  const getClassHeight = (durationMinutes: number) => {
    // Each slot is 15 minutes, so height = (duration / 15) * SLOT_HEIGHT
    const slotsNeeded = durationMinutes / 15;
    return slotsNeeded * SLOT_HEIGHT;
  };

  const isClassContinuation = (day: Date, timeSlot: string, cls: ScheduledClassWithTemplate) => {
    const dayName = format(day, 'EEEE', { locale: getDateFnsLocale() }).toLowerCase();
    const normalizedDayName = DAY_MAPPING[dayName] || dayName;
    
    const classDays = cls.days_of_week.map(d => {
      const normalized = d.toLowerCase().trim();
      // Normalize to database format (without accents)
      return DAY_MAPPING[normalized] || normalized;
    });
    
    if (!classDays.includes(normalizedDayName)) return false;
    
    const classStartTime = cls.start_time.slice(0, 5);
    const classStartIndex = TIME_SLOTS.indexOf(classStartTime);
    const currentSlotIndex = TIME_SLOTS.indexOf(timeSlot);
    
    if (classStartIndex === -1 || currentSlotIndex === -1) return false;
    
    const slotsNeeded = Math.ceil(cls.duration_minutes / 15);
    const classEndIndex = classStartIndex + slotsNeeded;
    
    return currentSlotIndex > classStartIndex && currentSlotIndex < classEndIndex;
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card h-full flex flex-col">
      {/* Header with days */}
      <div className="grid grid-cols-8 bg-muted/50 border-b sticky top-0 z-30 backdrop-blur-sm bg-background/90">
        <div className="p-3 text-sm font-medium text-muted-foreground border-r bg-background/90">
          {t('classes.hour')}
        </div>
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="p-3 text-center border-r last:border-r-0 bg-background/90">
            <div className="text-sm font-medium text-muted-foreground">
              {format(day, "EEE", { locale: getDateFnsLocale() })}
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
      <div className="flex-1 overflow-y-auto">
        {TIME_SLOTS.map((timeSlot, index) => (
          <div key={timeSlot} className="grid grid-cols-8 border-b last:border-b-0" style={{ minHeight: `${SLOT_HEIGHT}px` }}>
            <div className="p-2 text-sm text-muted-foreground border-r bg-muted/30 flex items-center justify-center sticky left-0 z-20 backdrop-blur-sm">
              {timeSlot}
            </div>
            
            {weekDays.map((day) => {
              const dayClasses = getClassesForDayAndTime(day, timeSlot);
              const hasContinuationClasses = classes.some(cls => isClassContinuation(day, timeSlot, cls));
              
              const handleDragOver = (e: React.DragEvent) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              };

              const handleDrop = (e: React.DragEvent) => {
                e.preventDefault();
                const classId = e.dataTransfer.getData('text/plain');
                if (classId && onClassDrop && dayClasses.length === 0) {
                  onClassDrop(classId, day, timeSlot);
                }
              };
              
              return (
                <div 
                  key={`${day.toISOString()}-${timeSlot}`} 
                  className={cn(
                    "border-r last:border-r-0 relative cursor-pointer hover:bg-muted/50 transition-colors",
                    hasContinuationClasses && "bg-muted/10"
                  )}
                  style={{ minHeight: `${SLOT_HEIGHT}px` }}
                  onClick={() => {
                    if (dayClasses.length === 0 && onTimeSlotClick) {
                      onTimeSlotClick(day, timeSlot);
                    }
                  }}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {dayClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="absolute inset-x-0 top-0 p-1"
                      style={{
                        height: `${getClassHeight(cls.duration_minutes)}px`,
                        zIndex: 5
                      }}
                    >
                      <ClassCard class={cls} />
                    </div>
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
