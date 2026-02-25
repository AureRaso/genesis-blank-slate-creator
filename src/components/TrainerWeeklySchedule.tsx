import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Info, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trainer } from "@/hooks/useTrainers";
import {
  useTrainerWeeklySlots,
  getWeekDays,
  getTimeSlots,
  getSlotForDayAndTime,
  expandSlotsForGrid,
  ExpandedSlot,
} from "@/hooks/useTrainerWeeklySlots";
import { addWeeks, subWeeks, format, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface TrainerWeeklyScheduleProps {
  trainer: Trainer;
  onBack: () => void;
}

const TrainerWeeklySchedule = ({ trainer, onBack }: TrainerWeeklyScheduleProps) => {
  const { t } = useTranslation();
  const [weekDate, setWeekDate] = useState(new Date());

  // Use trainer.profile_id to match programmed_classes.trainer_profile_id
  const { data: slots = [], isLoading } = useTrainerWeeklySlots(trainer.profile_id, weekDate);

  const trainerName = trainer.profiles?.full_name || t('trainersPage.trainersList.fallback.nameNotAvailable');
  const rates = trainer.private_lesson_rates || {};
  const configuredDurations = Object.keys(rates)
    .filter((k) => {
      const r = rates[k];
      return r && (r.price_1_player != null || r.price_2_players != null);
    })
    .sort((a, b) => Number(a) - Number(b));

  const durationLabel = configuredDurations.length > 0
    ? configuredDurations.map((k) => {
        const h = Number(k) / 60;
        return h === 1 ? '1h' : `${h.toLocaleString('es-ES', { maximumFractionDigits: 1 })}h`;
      }).join(' / ')
    : '1h';

  const minRate = configuredDurations.reduce<number | null>((min, k) => {
    const p = rates[k]?.price_1_player;
    if (p == null) return min;
    return min == null ? p : Math.min(min, p);
  }, null);
  const rateLabel = minRate != null ? `${t('trainersPage.schedule.rateFrom')} ${minRate}\u20AC/clase` : null;

  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
  const weekDays = getWeekDays(weekDate);

  // Expand programmed_classes (which have days_of_week arrays) into per-day entries
  const expandedSlots = expandSlotsForGrid(slots);
  const timeSlots = getTimeSlots(expandedSlots);

  const weekRangeLabel = `${format(weekStart, 'd', { locale: es })}-${format(weekEnd, 'd MMM', { locale: es })}`;

  // Today's classes with participants
  const todayDayName = format(new Date(), 'EEEE', { locale: es }).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const todaySlots = expandedSlots.filter(
    (s) => s.dayOfWeek === todayDayName && s.participants.length > 0
  );
  const todayLabel = format(new Date(), "EEEE d MMM", { locale: es });
  const todayClassCount = todaySlots.length;

  const renderCellContent = (slot: ExpandedSlot | undefined) => {
    if (!slot) {
      return <span className="text-gray-300">&mdash;</span>;
    }

    const activeParticipants = slot.participants.filter((p) => p.status === 'active' || p.status === 'confirmed');

    if (activeParticipants.length === 0) {
      return (
        <span className="text-playtomic-orange font-medium text-sm">
          {t('trainersPage.schedule.free')}
        </span>
      );
    }

    const firstStudent = activeParticipants[0].student_enrollment;
    const nameParts = firstStudent.full_name.split(' ');
    const shortName = `${nameParts[0]} ${nameParts.length > 1 ? nameParts[1]?.[0] + '.' : ''}`;
    const extra = activeParticipants.length > 1 ? ` +${activeParticipants.length - 1}` : '';

    return (
      <span className="text-emerald-700 font-medium text-sm">
        {shortName}{extra}
      </span>
    );
  };

  const getCellBg = (slot: ExpandedSlot | undefined) => {
    if (!slot) return '';
    const activeParticipants = slot.participants.filter((p) => p.status === 'active' || p.status === 'confirmed');
    if (activeParticipants.length > 0) return 'bg-emerald-50';
    return 'bg-orange-50';
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        <button onClick={onBack} className="hover:underline">PadeLock</button>
        {' > '}
        <button onClick={onBack} className="hover:underline">{t('trainersPage.schedule.breadcrumbTrainers')}</button>
        {' > '}
        <button onClick={onBack} className="hover:underline">{trainerName}</button>
        {' > '}
        <span className="font-semibold text-foreground">{t('trainersPage.schedule.breadcrumbSchedule')}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-500" />
            <h1 className="text-xl sm:text-2xl font-bold">
              {trainerName} · {t('trainersPage.schedule.weekLabel')} {weekRangeLabel}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {rateLabel && <>{t('trainersPage.schedule.rate')}: {rateLabel} · </>}
            {t('trainersPage.schedule.durationLabel')}: {durationLabel}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekDate(subWeeks(weekDate, 1))}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('trainersPage.schedule.previous')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekDate(addWeeks(weekDate, 1))}>
            {t('trainersPage.schedule.next')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-orange-100 border border-orange-200" />
          <span>{t('trainersPage.schedule.available')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-200" />
          <span>{t('trainersPage.schedule.reserved')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200" />
          <span>{t('trainersPage.schedule.notAvailable')}</span>
        </div>
      </div>

      {/* Weekly grid */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">{t('common.loading')}</div>
          ) : timeSlots.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {t('trainersPage.schedule.noSlots')}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left font-medium text-muted-foreground w-16" />
                  {weekDays.map((day) => (
                    <th
                      key={day.dayName}
                      className={`p-3 text-center font-semibold text-xs uppercase tracking-wider ${
                        day.isToday ? 'text-playtomic-orange' : 'text-muted-foreground'
                      }`}
                    >
                      {day.shortLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time) => (
                  <tr key={time} className="border-b last:border-0">
                    <td className="p-3 text-muted-foreground font-medium text-xs whitespace-nowrap">
                      {time}
                    </td>
                    {weekDays.map((day) => {
                      const slot = getSlotForDayAndTime(expandedSlots, day.dayName!, time);
                      return (
                        <td
                          key={`${day.dayName}-${time}`}
                          className={`p-3 text-center border-l ${getCellBg(slot)}`}
                        >
                          {renderCellContent(slot)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Today's reservations */}
      {todaySlots.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-bold">
              {t('trainersPage.schedule.todayReservations')} · {todayLabel}
            </CardTitle>
            <Badge variant="outline" className="text-playtomic-orange border-playtomic-orange">
              {todayClassCount} {todayClassCount === 1 ? 'clase' : 'clases'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaySlots.map((slot) => {
              const activeParticipants = slot.participants.filter((p) => p.status === 'active' || p.status === 'confirmed');
              const playerNames = activeParticipants.map((p) => p.student_enrollment.full_name).join(', ');
              const courtInfo = slot.clubName
                ? `Pista ${slot.courtNumber || '—'} · ${slot.clubName}`
                : `Pista ${slot.courtNumber || '—'}`;

              return (
                <div key={`${slot.classId}-${slot.dayOfWeek}`} className="flex items-center gap-4">
                  <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-center min-w-[60px]">
                    <div className="font-bold text-sm">{slot.startTime}</div>
                    <div className="text-xs opacity-75">{slot.durationMinutes / 60}h</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{playerNames || slot.className}</p>
                    <p className="text-sm text-muted-foreground">{courtInfo}</p>
                  </div>
                  <Badge variant="outline" className="flex-shrink-0">
                    <Users className="h-3 w-3 mr-1" />
                    {activeParticipants.length} {activeParticipants.length === 1
                      ? t('trainersPage.schedule.player')
                      : t('trainersPage.schedule.players')}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          {t('trainersPage.schedule.infoBanner')}
        </p>
      </div>
    </div>
  );
};

export default TrainerWeeklySchedule;
