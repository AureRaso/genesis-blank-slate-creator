
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths, addDays, subDays } from "date-fns";
import { Calendar, GraduationCap, Users, UserCheck, List } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { CalendarGrid } from "./calendar/CalendarGrid";
import { TrainerLegend } from "./calendar/TrainerLegend";
import { useScheduledClasses } from "@/hooks/useScheduledClasses";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ClassCard } from "./calendar/ClassCard";
import { cn } from "@/lib/utils";
import type { ClassFiltersData } from "@/contexts/ClassFiltersContext";
import { useClassDragDrop } from "@/hooks/useClassDragDrop";

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00"
];

interface ClassCalendarViewProps {
  clubId?: string;
  clubIds?: string[];
  filters: ClassFiltersData;
  viewModeToggle?: 'calendar' | 'list';
}

export default function ClassCalendarView({ clubId, clubIds, filters, viewModeToggle }: ClassCalendarViewProps) {
  const navigate = useNavigate();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [selectedDayForModal, setSelectedDayForModal] = useState<Date | null>(null);
  const [timeRangeStart, setTimeRangeStart] = useState("08:00");
  const [timeRangeEnd, setTimeRangeEnd] = useState("22:00");
  const { profile, isAdmin } = useAuth();
  const { t } = useTranslation();
  const { getDateFnsLocale } = useLanguage();
  const { handleClassDrop } = useClassDragDrop();

  // Calculate date ranges based on view mode
  let rangeStart: Date;
  let rangeEnd: Date;
  let displayDays: Date[];

  if (viewMode === 'day') {
    rangeStart = currentDate;
    rangeEnd = currentDate;
    displayDays = [currentDate];
  } else if (viewMode === 'week') {
    rangeStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    rangeEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
    displayDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  } else {
    // month view - ensure grid starts on Monday
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    // Get the Monday of the week containing the first day of the month
    rangeStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    // Get the Sunday of the week containing the last day of the month
    rangeEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    displayDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  }

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const { data: classes, isLoading, error } = useScheduledClasses({
    startDate: format(rangeStart, 'yyyy-MM-dd'),
    endDate: format(rangeEnd, 'yyyy-MM-dd'),
    clubId: clubId,
    clubIds: clubIds,
  });

  const goToPrevious = () => {
    if (viewMode === 'day') {
      setCurrentDate(subDays(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentWeek(subWeeks(currentWeek, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentWeek(addWeeks(currentWeek, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setCurrentWeek(today);
  };

  const goToPreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));

  const handleFullscreen = () => {
    setShowFullscreen(true);
  };

  const handleTimeRangeChange = (start: string, end: string) => {
    setTimeRangeStart(start);
    setTimeRangeEnd(end);
  };

  const handleTimeSlotClick = (day: Date, timeSlot: string) => {
    // Only admins and trainers can create classes
    if (profile?.role !== 'admin' && profile?.role !== 'trainer') {
      return;
    }

    // Navigate to create page with parameters
    const dayName = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"][day.getDay()];
    const params = new URLSearchParams({
      time: timeSlot,
      days: dayName,
      date: format(day, 'yyyy-MM-dd')
    });
    navigate(`/dashboard/scheduled-classes/new?${params.toString()}`);
  };

  // Aplicar todos los filtros
  const filteredClasses = classes?.filter((cls) => {
    // Filtro de búsqueda existente
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        cls.name.toLowerCase().includes(searchLower) ||
        cls.participants?.some(p => 
          p.student_enrollment?.full_name?.toLowerCase().includes(searchLower)
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
        p.student_enrollment?.full_name?.toLowerCase().includes(studentNameLower) ||
        p.student_enrollment?.email?.toLowerCase().includes(studentNameLower)
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
            {t('common.error')}: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Show trainer legend for admins when there are multiple trainers */}
      {isAdmin && <TrainerLegend classes={filteredClasses} />}

      {/* Mobile: Calendar/List + Day/Week/Month selectors on same row */}
      <div className="flex lg:hidden items-center gap-2 mb-4">
        {/* Calendar/List toggle */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={viewModeToggle === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate('/dashboard/scheduled-classes')}
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Button
            variant={viewModeToggle === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('view', 'list');
              navigate(url.pathname + url.search);
            }}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Day/Week/Month selector - only show in calendar view */}
        {viewModeToggle === 'calendar' && (
          <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
              className="text-xs h-8"
            >
              Día
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="text-xs h-8"
            >
              Semana
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="text-xs h-8"
            >
              Mes
            </Button>
          </div>
        )}
      </div>

      <CalendarHeader
        currentWeek={currentWeek}
        weekStart={weekStart}
        weekEnd={weekEnd}
        totalClasses={classes?.length || 0}
        filteredClassesCount={filteredClasses.length}
        onPreviousWeek={goToPrevious}
        onNextWeek={goToNext}
        onToday={goToToday}
        onFullscreen={handleFullscreen}
        timeRangeStart={timeRangeStart}
        timeRangeEnd={timeRangeEnd}
        onTimeRangeChange={handleTimeRangeChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentDate={currentDate}
        viewModeToggle={viewModeToggle}
      />

      {/* Calendar Grid - remove side margins in mobile for month and week view */}
      <div className={cn(
        (viewMode === 'month' || viewMode === 'week') && "-mx-3 sm:mx-0"
      )}>
        <CalendarGrid
          weekStart={rangeStart}
          weekEnd={rangeEnd}
          classes={filteredClasses}
          onTimeSlotClick={handleTimeSlotClick}
          onClassDrop={(classId: string, newDay: Date, newTimeSlot: string) =>
            handleClassDrop(classId, newDay, newTimeSlot, classes || [])
          }
          timeRangeStart={timeRangeStart}
          timeRangeEnd={timeRangeEnd}
          viewMode={viewMode}
          onDayClick={(day: Date) => {
            if (viewMode === 'month') {
              setSelectedDayForModal(day);
            }
          }}
        />
      </div>

      {/* Fullscreen Calendar Modal */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-[98vw] max-h-[98vh] w-[98vw] h-[98vh] p-2 md:p-4 flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-sm md:text-base">
              <Calendar className="h-4 w-4 md:h-5 md:w-5" />
              {t('classes.calendarTitle')} - Pantalla completa
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 flex flex-col gap-2 md:gap-4">
            <div className="flex-shrink-0">
              <CalendarHeader
                currentWeek={currentWeek}
                weekStart={weekStart}
                weekEnd={weekEnd}
                totalClasses={classes?.length || 0}
                filteredClassesCount={filteredClasses.length}
                onPreviousWeek={goToPreviousWeek}
                onNextWeek={goToNextWeek}
                onToday={goToToday}
                showFullscreenButton={false}
                timeRangeStart={timeRangeStart}
                timeRangeEnd={timeRangeEnd}
                onTimeRangeChange={handleTimeRangeChange}
              />
              
              {/* Show trainer legend for admins when there are multiple trainers */}
              {isAdmin && <TrainerLegend classes={filteredClasses} />}
            </div>
            
            <div className="flex-1 min-h-0">
              <CalendarGrid
                weekStart={weekStart}
                weekEnd={weekEnd}
                classes={filteredClasses}
                onTimeSlotClick={handleTimeSlotClick}
                onClassDrop={(classId: string, newDay: Date, newTimeSlot: string) => 
                  handleClassDrop(classId, newDay, newTimeSlot, classes || [])
                }
                timeRangeStart={timeRangeStart}
                timeRangeEnd={timeRangeEnd}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Day Details Modal for Month View */}
      <Dialog open={!!selectedDayForModal} onOpenChange={(open) => !open && setSelectedDayForModal(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {selectedDayForModal && format(selectedDayForModal, "EEEE, dd 'de' MMMM yyyy", { locale: getDateFnsLocale() })}
            </DialogTitle>
            <DialogDescription>
              Clases programadas para este día
            </DialogDescription>
          </DialogHeader>

          {selectedDayForModal && (() => {
            const dayName = format(selectedDayForModal, 'EEEE', { locale: getDateFnsLocale() }).toLowerCase();
            const dayClasses = filteredClasses.filter(cls => {
              const classDays = cls.days_of_week.map(d => d.toLowerCase().trim());
              return classDays.includes(dayName);
            }).sort((a, b) => a.start_time.localeCompare(b.start_time));

            if (dayClasses.length === 0) {
              return (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No hay clases programadas para este día</p>
                  {isAdmin && (
                    <Button
                      onClick={() => {
                        const dayName = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"][selectedDayForModal!.getDay()];
                        const params = new URLSearchParams({
                          time: "09:00",
                          days: dayName,
                          date: format(selectedDayForModal!, 'yyyy-MM-dd')
                        });
                        navigate(`/dashboard/scheduled-classes/new?${params.toString()}`);
                      }}
                      className="mt-4"
                    >
                      Crear clase
                    </Button>
                  )}
                </div>
              );
            }

            return (
              <div className="space-y-3 mt-4">
                {dayClasses.map((cls) => (
                  <Card key={cls.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="bg-primary/10 text-primary">
                              {cls.start_time.slice(0, 5)}
                            </Badge>
                            <h3 className="font-semibold text-lg">{cls.name}</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <GraduationCap className="h-4 w-4" />
                              <span>Nivel: {cls.level || 'Todos'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>{cls.participants?.length || 0} participantes</span>
                            </div>
                            {cls.trainer_name && (
                              <div className="flex items-center gap-1 text-muted-foreground col-span-2">
                                <UserCheck className="h-4 w-4" />
                                <span>Profesor: {cls.trainer_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
