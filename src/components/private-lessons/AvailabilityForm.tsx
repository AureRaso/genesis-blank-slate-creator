import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AvailabilityDayRow, { DayState } from "./AvailabilityDayCard";
import { PrivateLessonAvailability } from "@/hooks/usePrivateLessons";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AvailabilityFormProps {
  availability: PrivateLessonAvailability[];
  trainerProfileId: string;
  clubId: string;
}

// Days: 1=Monday to 6=Saturday, 0=Sunday (shown last)
const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0];

function buildDayState(existing?: PrivateLessonAvailability): DayState {
  if (!existing) {
    return {
      isActive: false,
      morningStart: "",
      morningEnd: "",
      afternoonStart: "",
      afternoonEnd: "",
      duration: "60",
      hasMorning: false,
      hasAfternoon: false,
    };
  }

  const ms = existing.morning_start?.slice(0, 5) || "";
  const me = existing.morning_end?.slice(0, 5) || "";
  const as = existing.afternoon_start?.slice(0, 5) || "";
  const ae = existing.afternoon_end?.slice(0, 5) || "";

  return {
    isActive: existing.is_active,
    morningStart: ms,
    morningEnd: me,
    afternoonStart: as,
    afternoonEnd: ae,
    duration: String(existing.slot_duration_minutes || 60),
    hasMorning: existing.is_active && !!(ms && me),
    hasAfternoon: existing.is_active && !!(as && ae),
  };
}

const AvailabilityForm = ({ availability, trainerProfileId, clubId }: AvailabilityFormProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Centralized state: map dayOfWeek → DayState
  const [days, setDays] = useState<Record<number, DayState>>(() => {
    const initial: Record<number, DayState> = {};
    for (const d of ORDERED_DAYS) {
      const existing = availability.find((a) => a.day_of_week === d);
      initial[d] = buildDayState(existing);
    }
    return initial;
  });

  const [isSaving, setIsSaving] = useState(false);

  // Sync from props when availability changes (e.g. after refetch)
  useEffect(() => {
    const updated: Record<number, DayState> = {};
    for (const d of ORDERED_DAYS) {
      const existing = availability.find((a) => a.day_of_week === d);
      updated[d] = buildDayState(existing);
    }
    setDays(updated);
  }, [availability]);

  const handleDayChange = useCallback((dayOfWeek: number, state: DayState) => {
    setDays((prev) => ({ ...prev, [dayOfWeek]: state }));
  }, []);

  const handleCopyTo = useCallback((fromDay: number, targetDays: number[]) => {
    setDays((prev) => {
      const source = prev[fromDay];
      const next = { ...prev };
      for (const target of targetDays) {
        next[target] = { ...source };
      }
      return next;
    });
  }, []);

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const rows = ORDERED_DAYS.map((d) => {
        const s = days[d];
        return {
          trainer_profile_id: trainerProfileId,
          club_id: clubId,
          day_of_week: d,
          morning_start: s.isActive && s.hasMorning && s.morningStart ? s.morningStart : null,
          morning_end: s.isActive && s.hasMorning && s.morningEnd ? s.morningEnd : null,
          afternoon_start: s.isActive && s.hasAfternoon && s.afternoonStart ? s.afternoonStart : null,
          afternoon_end: s.isActive && s.hasAfternoon && s.afternoonEnd ? s.afternoonEnd : null,
          slot_duration_minutes: parseInt(s.duration) || 60,
          is_active: s.isActive,
        };
      });
      const { error } = await supabase
        .from("private_lesson_availability")
        .upsert(rows, { onConflict: "trainer_profile_id,club_id,day_of_week" });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["private-lesson-availability"] });
      toast.success(t("privateLessons.availability.savedAll", "Disponibilidad guardada correctamente"));
    } catch {
      toast.error(t("privateLessons.availability.saveError", "Error al guardar la disponibilidad"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <RefreshCw className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">
            {t("privateLessons.availability.weeklyHoursTitle", "Horario semanal")}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {t("privateLessons.availability.weeklyHoursDesc", "Configura las franjas horarias disponibles para clases particulares")}
        </p>

        {/* Day rows */}
        <div className="divide-y-0">
          {ORDERED_DAYS.map((d) => (
            <AvailabilityDayRow
              key={d}
              dayOfWeek={d}
              state={days[d]}
              onChange={(state) => handleDayChange(d, state)}
              onCopyTo={(targets) => handleCopyTo(d, targets)}
              orderedDays={ORDERED_DAYS}
            />
          ))}
        </div>

        {/* Global save button */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving
              ? t("privateLessons.availability.saving", "Guardando...")
              : t("privateLessons.availability.saveAll", "Guardar cambios")}
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          {t("privateLessons.availability.groupClassNote", "Los horarios de tus clases grupales se tienen en cuenta automáticamente. Los slots que coincidan con una clase grupal no se mostrarán como disponibles, no necesitas adaptar tu disponibilidad.")}
        </p>
      </CardContent>
    </Card>
  );
};

export default AvailabilityForm;
