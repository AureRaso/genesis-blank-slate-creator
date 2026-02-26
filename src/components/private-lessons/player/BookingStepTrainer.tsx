import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, User, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  TrainerWithRates,
  useTrainerFreeSlots,
} from "@/hooks/usePlayerPrivateLessons";
import { ComputedSlot } from "@/hooks/usePrivateLessons";
import { PrivateLessonRates } from "@/hooks/useTrainers";
import {
  format,
  addDays,
  startOfWeek,
  addWeeks,
  isToday,
  isBefore,
  isAfter,
  startOfDay,
} from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

const DAY_LABELS_BY_LANG: Record<string, string[]> = {
  es: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  it: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
};

interface BookingStepTrainerProps {
  trainers: TrainerWithRates[];
  selectedTrainerId: string;
  onSelectTrainer: (trainer: TrainerWithRates) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  selectedSlot: ComputedSlot | null;
  onSelectSlot: (slot: ComputedSlot) => void;
  onContinue: () => void;
  clubId: string;
}

function getMinPrice(rates: PrivateLessonRates): { duration: string; price: number } | null {
  let minPrice: number | null = null;
  let minDuration = "";
  for (const [dur, dr] of Object.entries(rates)) {
    if (dr?.price_1_player != null && (minPrice === null || dr.price_1_player < minPrice)) {
      minPrice = dr.price_1_player;
      minDuration = dur;
    }
  }
  if (minPrice === null) return null;
  return { duration: minDuration, price: minPrice };
}

function getDurations(rates: PrivateLessonRates): string[] {
  return Object.keys(rates)
    .filter((dur) => {
      const dr = rates[dur];
      return dr && dr.price_1_player != null && dr.price_1_player > 0;
    })
    .sort((a, b) => Number(a) - Number(b));
}

function formatDuration(minutes: string): string {
  const m = Number(minutes);
  if (m === 60) return "1h";
  if (m === 90) return "1.5h";
  if (m === 120) return "2h";
  return `${m}min`;
}

const BookingStepTrainer = ({
  trainers,
  selectedTrainerId,
  onSelectTrainer,
  selectedDate,
  onSelectDate,
  selectedSlot,
  onSelectSlot,
  onContinue,
  clubId,
}: BookingStepTrainerProps) => {
  const { t } = useTranslation();
  const { language, getDateFnsLocale } = useLanguage();
  const dateFnsLocale = getDateFnsLocale();
  const dayLabels = DAY_LABELS_BY_LANG[language] || DAY_LABELS_BY_LANG.es;
  const [weekOffset, setWeekOffset] = useState(0);

  const selectedTrainer = trainers.find((tr) => tr.profile_id === selectedTrainerId);

  // Booking window limits from selected trainer
  const bookingWindowDays = selectedTrainer?.booking_window_days ?? 7;
  const minNoticeHours = selectedTrainer?.min_notice_hours ?? 24;
  const maxBookingDate = startOfDay(addDays(new Date(), bookingWindowDays));

  // Generate week days for date picker
  const weekDays = useMemo(() => {
    const base = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset);
    return Array.from({ length: 7 }, (_, i) => addDays(base, i));
  }, [weekOffset]);

  // Check if next week is entirely beyond booking window
  const nextWeekStart = useMemo(() => {
    return addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset + 1);
  }, [weekOffset]);
  const canGoForward = !selectedTrainerId || isBefore(nextWeekStart, maxBookingDate);

  // Free slots for selected trainer + date (filtered by min notice hours)
  const { data: freeSlots = [], isLoading: slotsLoading } = useTrainerFreeSlots(
    selectedTrainerId,
    clubId,
    selectedDate,
    minNoticeHours
  );

  const canContinue = !!selectedTrainerId && !!selectedDate && !!selectedSlot;

  const today = startOfDay(new Date());

  return (
    <div className="space-y-6">
      {/* Trainer selection */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {t("privateLessonsBooking.selectTrainer", "Elige tu profesor")}
        </h3>
        <div className="space-y-2">
          {trainers.map((trainer) => {
            const isSelected = trainer.profile_id === selectedTrainerId;
            const minP = getMinPrice(trainer.private_lesson_rates);
            const durations = getDurations(trainer.private_lesson_rates);

            return (
              <Card
                key={trainer.profile_id}
                className={`p-3 cursor-pointer transition-all ${
                  isSelected
                    ? "border-primary bg-orange-50 ring-1 ring-primary"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => onSelectTrainer(trainer)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    {trainer.photo_url ? (
                      <img
                        src={trainer.photo_url}
                        alt={trainer.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{trainer.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {durations.map((d) => formatDuration(d)).join(" · ")}
                      {minP && ` · Desde ${minP.price}€/pers`}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Date picker (horizontal scroll) */}
      {selectedTrainerId && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {t("privateLessonsBooking.selectDate", "Selecciona fecha")}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setWeekOffset((p) => p - 1)}
              disabled={weekOffset === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-gray-500 flex-1 text-center">
              {format(weekDays[0], "d MMM", { locale: dateFnsLocale })} —{" "}
              {format(weekDays[6], "d MMM", { locale: dateFnsLocale })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setWeekOffset((p) => p + 1)}
              disabled={!canGoForward}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {weekDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isSelected = dateStr === selectedDate;
              const isPast = isBefore(day, today);
              const isBeyondWindow = !isBefore(day, maxBookingDate);
              const isDisabled = isPast || isBeyondWindow;
              const isTodayDay = isToday(day);

              return (
                <button
                  key={dateStr}
                  disabled={isDisabled}
                  onClick={() => onSelectDate(dateStr)}
                  className={`flex flex-col items-center justify-center min-w-[48px] py-2 px-1.5 rounded-xl transition-all text-center ${
                    isSelected
                      ? "bg-primary text-white shadow-md"
                      : isDisabled
                        ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                        : isTodayDay
                          ? "bg-orange-50 text-primary border border-orange-200"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-[10px] font-medium uppercase">
                    {dayLabels[day.getDay()]}
                  </span>
                  <span className="text-lg font-bold leading-tight">{day.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Time slots grid */}
      {selectedTrainerId && selectedDate && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            <Clock className="inline h-3.5 w-3.5 mr-1" />
            {t("privateLessonsBooking.selectTime", "Horarios disponibles")}
          </h3>
          {slotsLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : freeSlots.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              {t(
                "privateLessonsBooking.noSlots",
                "No hay horarios disponibles para este día"
              )}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {freeSlots.map((slot) => {
                const isSelected =
                  selectedSlot?.startTime === slot.startTime &&
                  selectedSlot?.date === slot.date;
                return (
                  <button
                    key={`${slot.date}-${slot.startTime}`}
                    onClick={() => onSelectSlot(slot)}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-primary text-white shadow-md"
                        : "bg-gray-50 text-gray-700 border border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                  >
                    {slot.startTime}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      <Button
        className="w-full bg-primary hover:bg-orange-600 text-white rounded-xl py-6 text-base font-semibold"
        disabled={!canContinue}
        onClick={onContinue}
      >
        {t("privateLessonsBooking.continue", "Continuar")} →
      </Button>
    </div>
  );
};

export default BookingStepTrainer;
