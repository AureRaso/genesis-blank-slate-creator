import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import { PrivateLessonAvailability } from "@/hooks/usePrivateLessons";
import { useTranslation } from "react-i18next";

const DAY_NAMES_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

interface AvailabilityDayCardProps {
  dayOfWeek: number;
  existing?: PrivateLessonAvailability;
  onSave: (data: Omit<PrivateLessonAvailability, "id" | "created_at" | "updated_at">) => void;
  isSaving: boolean;
  trainerProfileId: string;
  clubId: string;
}

const AvailabilityDayCard = ({
  dayOfWeek,
  existing,
  onSave,
  isSaving,
  trainerProfileId,
  clubId,
}: AvailabilityDayCardProps) => {
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(existing?.is_active ?? false);
  const [morningStart, setMorningStart] = useState(existing?.morning_start?.slice(0, 5) || "");
  const [morningEnd, setMorningEnd] = useState(existing?.morning_end?.slice(0, 5) || "");
  const [afternoonStart, setAfternoonStart] = useState(existing?.afternoon_start?.slice(0, 5) || "");
  const [afternoonEnd, setAfternoonEnd] = useState(existing?.afternoon_end?.slice(0, 5) || "");
  const [duration, setDuration] = useState(String(existing?.slot_duration_minutes || 60));

  useEffect(() => {
    if (existing) {
      setIsActive(existing.is_active);
      setMorningStart(existing.morning_start?.slice(0, 5) || "");
      setMorningEnd(existing.morning_end?.slice(0, 5) || "");
      setAfternoonStart(existing.afternoon_start?.slice(0, 5) || "");
      setAfternoonEnd(existing.afternoon_end?.slice(0, 5) || "");
      setDuration(String(existing.slot_duration_minutes || 60));
    }
  }, [existing]);

  const handleSave = () => {
    onSave({
      trainer_profile_id: trainerProfileId,
      club_id: clubId,
      day_of_week: dayOfWeek,
      morning_start: morningStart || null,
      morning_end: morningEnd || null,
      afternoon_start: afternoonStart || null,
      afternoon_end: afternoonEnd || null,
      slot_duration_minutes: parseInt(duration),
      is_active: isActive,
    });
  };

  return (
    <Card className={`${isActive ? "border-playtomic-orange/40" : "opacity-60"}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{DAY_NAMES_ES[dayOfWeek]}</h3>
          <div className="flex items-center gap-2">
            <Label htmlFor={`active-${dayOfWeek}`} className="text-xs text-muted-foreground">
              {isActive ? t("privateLessons.availability.enabled") : t("privateLessons.availability.disabled")}
            </Label>
            <Switch
              id={`active-${dayOfWeek}`}
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>

        {isActive && (
          <>
            {/* Morning range */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                {t("privateLessons.availability.morning")}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={morningStart}
                  onChange={(e) => setMorningStart(e.target.value)}
                  className="w-28 text-sm"
                />
                <span className="text-muted-foreground text-sm">—</span>
                <Input
                  type="time"
                  value={morningEnd}
                  onChange={(e) => setMorningEnd(e.target.value)}
                  className="w-28 text-sm"
                />
              </div>
            </div>

            {/* Afternoon range */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                {t("privateLessons.availability.afternoon")}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={afternoonStart}
                  onChange={(e) => setAfternoonStart(e.target.value)}
                  className="w-28 text-sm"
                />
                <span className="text-muted-foreground text-sm">—</span>
                <Input
                  type="time"
                  value={afternoonEnd}
                  onChange={(e) => setAfternoonEnd(e.target.value)}
                  className="w-28 text-sm"
                />
              </div>
            </div>

            {/* Duration selector */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                {t("privateLessons.availability.duration")}
              </Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">1h</SelectItem>
                  <SelectItem value="90">1,5h</SelectItem>
                  <SelectItem value="120">2h</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Save button */}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-playtomic-orange hover:bg-playtomic-orange-dark"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              {t("privateLessons.availability.save")}
            </Button>
          </>
        )}

        {/* Save even when inactive (to persist deactivation) */}
        {!isActive && existing?.is_active && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            {t("privateLessons.availability.save")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AvailabilityDayCard;