
import { format, eachDayOfInterval, isSameDay } from "date-fns";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { ClassCard } from "./ClassCard";
import { MultiEventDropdown } from "./MultiEventDropdown";
import type { ScheduledClassWithTemplate } from "@/hooks/useScheduledClasses";

interface CalendarGridProps {
  weekStart: Date;
  weekEnd: Date;
  classes: ScheduledClassWithTemplate[];
  onTimeSlotClick?: (day: Date, timeSlot: string) => void;
  onClassDrop?: (classId: string, newDay: Date, newTimeSlot: string) => void;
  timeRangeStart?: string;
  timeRangeEnd?: string;
  viewMode?: 'day' | 'week' | 'month';
  onDayClick?: (day: Date) => void;
}

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00"
];

const SLOT_HEIGHT = 40; // Height in pixels for each 30-minute slot - reduced for mobile

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

export function CalendarGrid({ weekStart, weekEnd, classes, onTimeSlotClick, onClassDrop, timeRangeStart = "08:00", timeRangeEnd = "22:00", viewMode = 'week', onDayClick }: CalendarGridProps) {
  const { t } = useTranslation();
  const { getDateFnsLocale } = useLanguage();
  const { profile } = useAuth();
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Check if user can create classes
  const canCreateClasses = profile?.role === 'admin' || profile?.role === 'trainer';

  // Determine column count based on view mode
  const getGridColumns = () => {
    if (viewMode === 'day') return 'grid-cols-[80px_1fr]';
    if (viewMode === 'month') return 'grid-cols-8'; // Time + 7 days
    return 'grid-cols-8'; // Default week view: Time + 7 days
  };

  // Filter time slots based on the selected range
  const filteredTimeSlots = TIME_SLOTS.filter(slot => {
    return slot >= timeRangeStart && slot <= timeRangeEnd;
  });

  const detectOverlappingClasses = (day: Date, targetClasses: ScheduledClassWithTemplate[]) => {
    const dayName = format(day, 'EEEE', { locale: getDateFnsLocale() }).toLowerCase();
    const normalizedDayName = DAY_MAPPING[dayName] || dayName;
    
    // Get all classes for this day
    const dayClasses = classes.filter(cls => {
      const classDays = cls.days_of_week.map(d => {
        const normalized = d.toLowerCase().trim();
        return DAY_MAPPING[normalized] || normalized;
      });
      return classDays.includes(normalizedDayName);
    });
    
    // For each target class, find overlapping classes
    const overlappingGroups: ScheduledClassWithTemplate[][] = [];
    
    targetClasses.forEach(targetClass => {
      const targetStart = TIME_SLOTS.indexOf(targetClass.start_time.slice(0, 5));
      const targetEnd = targetStart + Math.ceil(targetClass.duration_minutes / 30);
      
      const overlapping = dayClasses.filter(cls => {
        if (cls.id === targetClass.id) return true;
        
        const classStart = TIME_SLOTS.indexOf(cls.start_time.slice(0, 5));
        const classEnd = classStart + Math.ceil(cls.duration_minutes / 30);
        
        // Check if classes overlap
        return !(classEnd <= targetStart || classStart >= targetEnd);
      });
      
      // Sort by start time to ensure consistent ordering
      overlapping.sort((a, b) => {
        const aStart = TIME_SLOTS.indexOf(a.start_time.slice(0, 5));
        const bStart = TIME_SLOTS.indexOf(b.start_time.slice(0, 5));
        return aStart - bStart;
      });
      
      overlappingGroups.push(overlapping);
    });
    
    return overlappingGroups;
  };

  const calculateColumnLayout = (targetClass: ScheduledClassWithTemplate, overlappingClasses: ScheduledClassWithTemplate[]) => {
    const totalColumns = overlappingClasses.length;
    const columnIndex = overlappingClasses.findIndex(cls => cls.id === targetClass.id);
    
    const width = totalColumns > 1 ? `${95 / totalColumns}%` : '100%';
    const left = totalColumns > 1 ? `${(columnIndex * 95) / totalColumns}%` : '0%';
    
    return { width, left, totalColumns };
  };

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

  // Helper function to group overlapping classes and return display info
  const getDisplayClassesForSlot = (day: Date, timeSlot: string) => {
    const slotClasses = getClassesForDayAndTime(day, timeSlot);
    
    if (slotClasses.length === 0) return { displayClass: null, allClasses: [] };
    if (slotClasses.length === 1) return { displayClass: slotClasses[0], allClasses: slotClasses };
    
    // For multiple classes, show the first one as indicator
    return { 
      displayClass: slotClasses[0], 
      allClasses: slotClasses,
      hasMultiple: true 
    };
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

  // For month view, render differently
  if (viewMode === 'month') {
    return (
      <div className="border rounded-lg overflow-hidden bg-card p-0 md:p-4">
        <div className="grid grid-cols-7 gap-0 md:gap-2">
          {/* Day headers */}
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="text-[10px] md:text-xs font-semibold text-center text-muted-foreground p-1 md:p-2 border-b md:border-b-0">
              {day}
            </div>
          ))}
          {/* Days of month */}
          {weekDays.map((day) => {
            const dayClasses = classes.filter(cls => {
              const dayName = format(day, 'EEEE', { locale: getDateFnsLocale() }).toLowerCase();
              const normalizedDayName = DAY_MAPPING[dayName] || dayName;
              return cls.days_of_week.some(d => {
                const normalized = d.toLowerCase().trim();
                return (DAY_MAPPING[normalized] || normalized) === normalizedDayName;
              });
            });

            return (
              <div
                key={day.toISOString()}
                onClick={() => canCreateClasses && onDayClick && onDayClick(day)}
                className={cn(
                  "min-h-[80px] md:min-h-[100px] p-1 md:p-2 transition-colors border-r border-b last:border-r-0 md:border md:rounded-lg",
                  canCreateClasses && "cursor-pointer hover:bg-muted/50",
                  isSameDay(day, new Date()) && "bg-primary/5 md:border-primary"
                )}
              >
                <div className={cn(
                  "text-[11px] md:text-sm font-medium mb-1 md:mb-2 text-center md:text-left",
                  isSameDay(day, new Date()) && "text-primary font-bold"
                )}>
                  {format(day, "dd")}
                </div>
                <div className="space-y-0.5 md:space-y-1">
                  {dayClasses.slice(0, 3).map((cls) => (
                    <div key={cls.id} className="text-[9px] md:text-xs px-0.5 py-0.5 md:p-1 bg-primary/10 text-primary rounded truncate">
                      <span className="hidden md:inline">{cls.start_time.slice(0, 5)} - </span>{cls.name}
                    </div>
                  ))}
                  {dayClasses.length > 3 && (
                    <div className="text-[9px] md:text-xs text-muted-foreground">
                      +{dayClasses.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Day and Week views
  return (
    <div className="border rounded-lg overflow-hidden bg-card h-full flex flex-col">
      {/* Header with days */}
      <div className={cn("grid bg-muted/50 border-b sticky top-0 z-30 backdrop-blur-sm bg-background/90", getGridColumns())}>
        <div className="p-0.5 md:p-3 text-[10px] md:text-sm font-medium text-muted-foreground border-r bg-background/90">
          {t('classes.hour')}
        </div>
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="p-0.5 md:p-3 text-center border-r last:border-r-0 bg-background/90">
            <div className="text-[9px] md:text-xs font-medium text-muted-foreground">
              {format(day, "EEE", { locale: getDateFnsLocale() })}
            </div>
            <div className={cn(
              "text-[10px] md:text-sm font-semibold mt-0.5 md:mt-1",
              isSameDay(day, new Date()) && "text-primary"
            )}>
              {format(day, "dd")}
            </div>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        {filteredTimeSlots.map((timeSlot, index) => (
          <div key={timeSlot} className={cn("grid border-b last:border-b-0", getGridColumns())} style={{ minHeight: `${SLOT_HEIGHT}px` }}>
            <div className="p-0.5 md:p-2 text-[9px] md:text-sm text-muted-foreground border-r bg-muted/30 flex items-center justify-center sticky left-0 z-20 backdrop-blur-sm">
              {timeSlot}
            </div>
            
            {weekDays.map((day) => {
              const { displayClass, allClasses, hasMultiple } = getDisplayClassesForSlot(day, timeSlot);
              const hasContinuationClasses = classes.some(cls => isClassContinuation(day, timeSlot, cls));
              
              const handleDragOver = (e: React.DragEvent) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              };

              const handleDrop = (e: React.DragEvent) => {
                e.preventDefault();
                const classId = e.dataTransfer.getData('text/plain');
                if (classId && onClassDrop && allClasses.length === 0) {
                  onClassDrop(classId, day, timeSlot);
                }
              };
              
              return (
                <div
                  key={`${day.toISOString()}-${timeSlot}`}
                  className={cn(
                    "border-r last:border-r-0 relative transition-colors",
                    hasContinuationClasses && "bg-muted/10",
                    canCreateClasses && "cursor-pointer hover:bg-muted/50"
                  )}
                  style={{ minHeight: `${SLOT_HEIGHT}px` }}
                  onClick={() => {
                    if (canCreateClasses && allClasses.length === 0 && onTimeSlotClick) {
                      onTimeSlotClick(day, timeSlot);
                    }
                  }}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {displayClass && !hasContinuationClasses && (
                    <div
                      className="absolute top-0 p-0.5 md:p-1 w-full overflow-hidden"
                      style={{
                        height: `${getClassHeight(displayClass.duration_minutes)}px`,
                        maxHeight: `${getClassHeight(displayClass.duration_minutes)}px`,
                        zIndex: 10
                      }}
                    >
                      {hasMultiple ? (
                        <MultiEventDropdown
                          allEvents={allClasses}
                          onEventClick={(event) => {
                            // Each event will handle its own modal through ClassCard
                          }}
                          onEventDragStart={(e, eventId) => {
                            e.dataTransfer.setData('text/plain', eventId);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                        >
                          <ClassCard
                            class={displayClass}
                            showAsIndicator={true}
                            eventCount={allClasses.length}
                          />
                        </MultiEventDropdown>
                      ) : (
                        <ClassCard
                          class={displayClass}
                          showAsIndicator={false}
                          eventCount={1}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
