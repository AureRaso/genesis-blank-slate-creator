
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
  onTimeRangeChange
}: CalendarHeaderProps) {
  const { t } = useTranslation();
  const { getDateFnsLocale } = useLanguage();
  
  const timeSlots = [
    "08:00", "08:15", "08:30", "08:45", "09:00", "09:15", "09:30", "09:45",
    "10:00", "10:15", "10:30", "10:45", "11:00", "11:15", "11:30", "11:45",
    "12:00", "12:15", "12:30", "12:45", "13:00", "13:15", "13:30", "13:45",
    "14:00", "14:15", "14:30", "14:45", "15:00", "15:15", "15:30", "15:45",
    "16:00", "16:15", "16:30", "16:45", "17:00", "17:15", "17:30", "17:45",
    "18:00", "18:15", "18:30", "18:45", "19:00", "19:15", "19:30", "19:45",
    "20:00", "20:15", "20:30", "20:45", "21:00", "21:15", "21:30", "21:45", "22:00"
  ];
  
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">{t('classes.calendarTitle')}</h2>
        </div>
        {filteredClassesCount !== totalClasses && (
          <Badge variant="secondary">
            {filteredClassesCount} {t('classes.of')} {totalClasses}
          </Badge>
        )}
      </div>
      
      {/* Time range selectors */}
      {onTimeRangeChange && (
        <div className="flex items-center gap-2 mr-4">
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
      
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPreviousWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button variant="outline" size="sm" onClick={onToday}>
          {t('classes.today')}
        </Button>
        
        <Button variant="outline" size="sm" onClick={onNextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>

        {showFullscreenButton && onFullscreen && (
          <Button variant="outline" size="sm" onClick={onFullscreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
        
        <div className="text-sm font-medium ml-4 min-w-[200px] text-right">
          {format(weekStart, "dd MMM", { locale: getDateFnsLocale() })} - {format(weekEnd, "dd MMM yyyy", { locale: getDateFnsLocale() })}
        </div>
      </div>
    </div>
  );
}
