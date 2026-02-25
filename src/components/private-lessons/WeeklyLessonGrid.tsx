import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  ComputedSlot,
  PrivateLessonAvailability,
  PrivateLessonException,
  PrivateLessonBooking,
  ScheduledClassBlock,
  generateSlotsForDateRange,
} from "@/hooks/usePrivateLessons";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  isSameDay,
  eachDayOfInterval,
} from "date-fns";
import { es } from "date-fns/locale";

const DAY_LABELS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface WeeklyLessonGridProps {
  availability: PrivateLessonAvailability[];
  exceptions: PrivateLessonException[];
  bookings: PrivateLessonBooking[];
  scheduledClasses?: ScheduledClassBlock[];
}

const WeeklyLessonGrid = ({ availability, exceptions, bookings, scheduledClasses = [] }: WeeklyLessonGridProps) => {
  const { t } = useTranslation();
  const [weekOffset, setWeekOffset] = useState(0);

  const currentWeekStart = useMemo(() => {
    const base = weekOffset === 0 ? new Date() : addWeeks(new Date(), weekOffset);
    return startOfWeek(base, { weekStartsOn: 1 });
  }, [weekOffset]);

  const currentWeekEnd = useMemo(() => endOfWeek(currentWeekStart, { weekStartsOn: 1 }), [currentWeekStart]);

  const weekDays = useMemo(
    () => eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd }),
    [currentWeekStart, currentWeekEnd]
  );

  const slots = useMemo(
    () => generateSlotsForDateRange(availability, exceptions, bookings, currentWeekStart, currentWeekEnd, scheduledClasses),
    [availability, exceptions, bookings, currentWeekStart, currentWeekEnd, scheduledClasses]
  );

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const map: Record<string, ComputedSlot[]> = {};
    for (const slot of slots) {
      if (!map[slot.date]) map[slot.date] = [];
      map[slot.date].push(slot);
    }
    return map;
  }, [slots]);

  // Get unique time rows across all days
  const uniqueTimes = useMemo(() => {
    const times = new Set<string>();
    for (const slot of slots) {
      times.add(slot.startTime);
    }
    return Array.from(times).sort();
  }, [slots]);

  const statusColors: Record<string, string> = {
    free: "bg-green-100 text-green-700 border-green-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  };

  const statusLabels: Record<string, string> = {
    free: t("privateLessons.slots.free", "Disponible"),
    pending: t("privateLessons.slots.pending", "Pendiente"),
    confirmed: t("privateLessons.slots.confirmed", "Confirmada"),
  };

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setWeekOffset((p) => p - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {format(currentWeekStart, "d MMM", { locale: es })} — {format(currentWeekEnd, "d MMM yyyy", { locale: es })}
        </span>
        <Button variant="outline" size="sm" onClick={() => setWeekOffset((p) => p + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-200 border border-green-300" /> {statusLabels.free}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-200 border border-amber-300" /> {statusLabels.pending}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-200 border border-blue-300" /> {statusLabels.confirmed}
        </span>
      </div>

      {slots.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {t("privateLessons.slots.noSlots", "No hay huecos configurados para esta semana. Configura tu disponibilidad primero.")}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border p-2 bg-muted text-left w-16">
                  {t("privateLessons.slots.time", "Hora")}
                </th>
                {weekDays.map((day) => {
                  const isToday = isSameDay(day, new Date());
                  const dow = day.getDay();
                  return (
                    <th
                      key={day.toISOString()}
                      className={`border p-2 text-center ${isToday ? "bg-playtomic-orange/10 font-bold" : "bg-muted"}`}
                    >
                      <div>{DAY_LABELS_SHORT[dow]}</div>
                      <div className="text-[10px] text-muted-foreground">{format(day, "d/M")}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {uniqueTimes.map((time) => (
                <tr key={time}>
                  <td className="border p-1 font-mono text-muted-foreground">{time}</td>
                  {weekDays.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const daySlots = slotsByDate[dateStr] || [];
                    const slot = daySlots.find((s) => s.startTime === time);

                    if (!slot) {
                      return <td key={day.toISOString()} className="border p-1 bg-gray-50" />;
                    }

                    return (
                      <td key={day.toISOString()} className="border p-1">
                        <div
                          className={`rounded p-1 text-center text-[10px] border ${statusColors[slot.status]}`}
                        >
                          <div className="font-medium">
                            {slot.startTime}–{slot.endTime}
                          </div>
                          {slot.booking ? (
                            <div className="truncate mt-0.5">
                              {slot.booking.booker_name}
                              {slot.booking.num_companions > 0 && (
                                <span className="ml-1">+{slot.booking.num_companions}</span>
                              )}
                            </div>
                          ) : (
                            <div className="mt-0.5">{statusLabels[slot.status]}</div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WeeklyLessonGrid;