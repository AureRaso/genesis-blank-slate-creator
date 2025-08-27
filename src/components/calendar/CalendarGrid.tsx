
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
}

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00"
];

const SLOT_HEIGHT = 50; // Height in pixels for each 30-minute slot

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

export function CalendarGrid({ weekStart, weekEnd, classes }: CalendarGridProps) {
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
    // Each slot is 30 minutes, so height = (duration / 30) * SLOT_HEIGHT
    const slotsNeeded = durationMinutes / 30;
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
    
    const slotsNeeded = Math.ceil(cls.duration_minutes / 30);
    const classEndIndex = classStartIndex + slotsNeeded;
    
    return currentSlotIndex > classStartIndex && currentSlotIndex < classEndIndex;
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card max-h-[75vh] overflow-y-auto">
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
      <div className="relative">
        {TIME_SLOTS.map((timeSlot, index) => (
          <div key={timeSlot} className="grid grid-cols-8 border-b last:border-b-0" style={{ minHeight: `${SLOT_HEIGHT}px` }}>
            <div className="p-2 text-sm text-muted-foreground border-r bg-muted/30 flex items-center justify-center sticky left-0 z-20 backdrop-blur-sm">
              {timeSlot}
            </div>
            
            {weekDays.map((day) => {
              const dayClasses = getClassesForDayAndTime(day, timeSlot);
              const hasContinuationClasses = classes.some(cls => isClassContinuation(day, timeSlot, cls));
              
              return (
                <div 
                  key={`${day.toISOString()}-${timeSlot}`} 
                  className={cn(
                    "border-r last:border-r-0 relative",
                    hasContinuationClasses && "bg-muted/10"
                  )}
                  style={{ minHeight: `${SLOT_HEIGHT}px` }}
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
