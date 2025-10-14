
import { format, addWeeks, subWeeks } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Maximize2, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CalendarHeaderProps {
  currentWeek: Date;
  weekStart: Date;
  weekEnd: Date;
  totalClasses: number;
  filteredClassesCount: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onFullscreen?: () => void;
  showFullscreenButton?: boolean;
  timeRangeStart?: string;
  timeRangeEnd?: string;
  onTimeRangeChange?: (start: string, end: string) => void;
  viewMode?: 'day' | 'week' | 'month';
  onViewModeChange?: (mode: 'day' | 'week' | 'month') => void;
  currentDate?: Date;
  viewModeToggle?: 'calendar' | 'list';
}

export function CalendarHeader({
  currentWeek,
  weekStart,
  weekEnd,
  totalClasses,
  filteredClassesCount,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onFullscreen,
  showFullscreenButton = true,
  timeRangeStart = "08:00",
  timeRangeEnd = "22:00",
  onTimeRangeChange,
  viewMode = 'week',
  onViewModeChange,
  currentDate,
  viewModeToggle
}: CalendarHeaderProps) {
  const { t } = useTranslation();
  const { getDateFnsLocale } = useLanguage();

  // Get display date range based on view mode
  const getDisplayText = () => {
    if (viewMode === 'day' && currentDate) {
      return format(currentDate, "dd MMM yyyy", { locale: getDateFnsLocale() });
    } else if (viewMode === 'month' && currentDate) {
      return format(currentDate, "MMMM yyyy", { locale: getDateFnsLocale() });
    } else {
      return `${format(weekStart, "dd MMM", { locale: getDateFnsLocale() })} - ${format(weekEnd, "dd MMM yyyy", { locale: getDateFnsLocale() })}`;
    }
  };
  
  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
    "20:00", "20:30", "21:00", "21:30", "22:00"
  ];
  
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
      {/* Mobile: Badge only */}
      <div className="flex lg:hidden items-center gap-1">
        {filteredClassesCount !== totalClasses && (
          <Badge variant="secondary" className="text-xs">
            {filteredClassesCount} {t('classes.of')} {totalClasses}
          </Badge>
        )}
      </div>

      {/* Desktop: Original layout */}
      <div className="hidden lg:flex items-center gap-1">
        {filteredClassesCount !== totalClasses && (
          <Badge variant="secondary">
            {filteredClassesCount} {t('classes.of')} {totalClasses}
          </Badge>
        )}
      </div>

      {/* View mode selector - desktop */}
      {onViewModeChange && (
        <div className="hidden lg:flex justify-start">
          <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('day')}
              className="text-xs"
            >
              Día
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('week')}
              className="text-xs"
            >
              Semana
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('month')}
              className="text-xs"
            >
              Mes
            </Button>
          </div>
        </div>
      )}

      {/* Time range selectors - hidden on mobile */}
      {onTimeRangeChange && (
        <div className="hidden md:flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-1 text-sm">
            <Select value={timeRangeStart} onValueChange={(value) => onTimeRangeChange(value, timeRangeEnd)}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>{time}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">-</span>
            <Select value={timeRangeEnd} onValueChange={(value) => onTimeRangeChange(timeRangeStart, value)}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>{time}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPreviousWeek} className="flex-1 sm:flex-none">
            <ChevronLeft className="h-4 w-4" />
            <span className="ml-1 sm:hidden">Anterior</span>
          </Button>
          
          <Button variant="outline" size="sm" onClick={onToday} className="flex-1 sm:flex-none">
            {t('classes.today')}
          </Button>
          
          <Button variant="outline" size="sm" onClick={onNextWeek} className="flex-1 sm:flex-none">
            <ChevronRight className="h-4 w-4" />
            <span className="mr-1 sm:hidden">Siguiente</span>
          </Button>

          {showFullscreenButton && onFullscreen && (
            <Button variant="outline" size="sm" onClick={onFullscreen} className="hidden sm:flex">
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="text-sm font-medium text-center sm:text-right sm:min-w-[200px]">
          {getDisplayText()}
        </div>
      </div>
    </div>
  );
}
