
import { useState } from "react";
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format, eachDayOfInterval, isSameDay } from "date-fns";
import { Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { CalendarGrid } from "./calendar/CalendarGrid";
import { TrainerLegend } from "./calendar/TrainerLegend";
import { useScheduledClasses } from "@/hooks/useScheduledClasses";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import ScheduledClassForm from "@/components/ScheduledClassForm";
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
}

export default function ClassCalendarView({ clubId, clubIds, filters }: ClassCalendarViewProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ day: Date; time: string } | null>(null);
  const [timeRangeStart, setTimeRangeStart] = useState("08:00");
  const [timeRangeEnd, setTimeRangeEnd] = useState("22:00");
  const { profile, isAdmin } = useAuth();
  const { t } = useTranslation();
  const { getDateFnsLocale } = useLanguage();
  const { handleClassDrop } = useClassDragDrop();
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const { data: classes, isLoading, error } = useScheduledClasses({
    startDate: format(weekStart, 'yyyy-MM-dd'),
    endDate: format(weekEnd, 'yyyy-MM-dd'),
    clubId: clubId,
    clubIds: clubIds,
  });

  const goToPreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const goToToday = () => setCurrentWeek(new Date());

  const handleFullscreen = () => {
    setShowFullscreen(true);
  };

  const handleTimeRangeChange = (start: string, end: string) => {
    setTimeRangeStart(start);
    setTimeRangeEnd(end);
  };

  const handleTimeSlotClick = (day: Date, timeSlot: string) => {
    if (isAdmin) {
      setSelectedTimeSlot({ day, time: timeSlot });
      setShowCreateForm(true);
    }
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setSelectedTimeSlot(null);
  };

  // Get the day name in Spanish for the selected day
  const getSelectedDayName = () => {
    if (!selectedTimeSlot) return "";
    const dayNames = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    return dayNames[selectedTimeSlot.day.getDay()];
  };

  // Get current club for form
  const getCurrentClub = () => {
    if (clubId) return clubId;
    if (clubIds && clubIds.length > 0) return clubIds[0];
    return profile?.club_id || "";
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
      <CalendarHeader
        currentWeek={currentWeek}
        weekStart={weekStart}
        weekEnd={weekEnd}
        totalClasses={classes?.length || 0}
        filteredClassesCount={filteredClasses.length}
        onPreviousWeek={goToPreviousWeek}
        onNextWeek={goToNextWeek}
        onToday={goToToday}
        onFullscreen={handleFullscreen}
        timeRangeStart={timeRangeStart}
        timeRangeEnd={timeRangeEnd}
        onTimeRangeChange={handleTimeRangeChange}
      />
      
      {/* Show trainer legend for admins when there are multiple trainers */}
      {isAdmin && <TrainerLegend classes={filteredClasses} />}
      
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

      {/* Create Class Form Dialog */}
      {isAdmin && (
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] md:w-full">
            <DialogHeader className="sr-only">
              <DialogTitle>{t('classes.createScheduledClasses')}</DialogTitle>
              <DialogDescription>
                Formulario para crear una nueva clase programada para el {getSelectedDayName()} a las {selectedTimeSlot?.time}
              </DialogDescription>
            </DialogHeader>
            <ScheduledClassForm
              onClose={handleCloseForm}
              clubId={getCurrentClub()}
              trainerProfileId={profile?.id || ""}
              initialData={selectedTimeSlot ? {
                start_time: selectedTimeSlot.time,
                selected_days: [getSelectedDayName()],
                start_date: selectedTimeSlot.day,
                end_date: new Date(selectedTimeSlot.day.getTime() + (90 * 24 * 60 * 60 * 1000)) // 3 months later
              } : undefined}
            />
          </DialogContent>
        </Dialog>
      )}

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
    </div>
  );
}
