import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

const DAY_INITIALS: Record<string, string[]> = {
  es: ["D", "L", "M", "X", "J", "V", "S"],
  en: ["S", "M", "T", "W", "T", "F", "S"],
  it: ["D", "L", "M", "M", "G", "V", "S"],
};

const DAY_NAMES_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export interface DayState {
  isActive: boolean;
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
  duration: string;
  hasMorning: boolean;
  hasAfternoon: boolean;
}

interface AvailabilityDayRowProps {
  dayOfWeek: number;
  state: DayState;
  onChange: (state: DayState) => void;
  onCopyTo: (targetDays: number[]) => void;
  orderedDays: number[];
}

const AvailabilityDayRow = ({
  dayOfWeek,
  state,
  onChange,
  onCopyTo,
  orderedDays,
}: AvailabilityDayRowProps) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.slice(0, 2) || "es";
  const initials = DAY_INITIALS[lang] || DAY_INITIALS.es;
  const initial = initials[dayOfWeek];

  const [copyTargets, setCopyTargets] = useState<number[]>([]);
  const [copyOpen, setCopyOpen] = useState(false);

  const handleActivate = () => {
    onChange({
      ...state,
      isActive: true,
      hasMorning: true,
      morningStart: state.morningStart || "09:00",
      morningEnd: state.morningEnd || "14:00",
    });
  };

  const handleRemoveInterval = (interval: "morning" | "afternoon") => {
    if (interval === "morning" && !state.hasAfternoon) {
      // Removing last interval → deactivate day
      onChange({ ...state, isActive: false, hasMorning: false, morningStart: "", morningEnd: "" });
    } else if (interval === "morning" && state.hasAfternoon) {
      // Remove morning, promote afternoon to morning slot visually
      onChange({
        ...state,
        hasMorning: true,
        hasAfternoon: false,
        morningStart: state.afternoonStart,
        morningEnd: state.afternoonEnd,
        afternoonStart: "",
        afternoonEnd: "",
      });
    } else {
      // Remove afternoon
      onChange({ ...state, hasAfternoon: false, afternoonStart: "", afternoonEnd: "" });
    }
  };

  const handleAddAfternoon = () => {
    onChange({
      ...state,
      hasAfternoon: true,
      afternoonStart: state.afternoonStart || "16:00",
      afternoonEnd: state.afternoonEnd || "21:00",
    });
  };

  const handleApplyCopy = () => {
    if (copyTargets.length > 0) {
      onCopyTo(copyTargets);
    }
    setCopyTargets([]);
    setCopyOpen(false);
  };

  const toggleCopyTarget = (day: number) => {
    setCopyTargets((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-b-0">
      {/* Day badge */}
      <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm flex-shrink-0 mt-0.5">
        {initial}
      </div>

      {/* Content */}
      {!state.isActive ? (
        /* Inactive state */
        <div className="flex items-center gap-3 flex-1 min-h-[36px]">
          <span className="text-sm text-muted-foreground">
            {t("privateLessons.availability.unavailable", "No disponible")}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleActivate}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        /* Active state */
        <div className="flex-1 space-y-2">
          {/* Morning interval */}
          {state.hasMorning && (
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                type="time"
                value={state.morningStart}
                onChange={(e) => onChange({ ...state, morningStart: e.target.value })}
                className="w-[110px] h-9 text-sm"
              />
              <span className="text-muted-foreground text-sm">—</span>
              <Input
                type="time"
                value={state.morningEnd}
                onChange={(e) => onChange({ ...state, morningEnd: e.target.value })}
                className="w-[110px] h-9 text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemoveInterval("morning")}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Add afternoon button (only on first row if no afternoon yet) */}
              {!state.hasAfternoon && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={handleAddAfternoon}
                  title={t("privateLessons.availability.addInterval", "Añadir intervalo")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}

              {/* Copy to other days */}
              <Popover open={copyOpen} onOpenChange={setCopyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    title={t("privateLessons.availability.copyTo", "Copiar a otros días")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 tracking-wider">
                    {t("privateLessons.availability.copyTimesTo", "Copiar horarios a...")}
                  </p>
                  <div className="space-y-2">
                    {orderedDays
                      .filter((d) => d !== dayOfWeek)
                      .map((d) => (
                        <label key={d} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={copyTargets.includes(d)}
                            onCheckedChange={() => toggleCopyTarget(d)}
                          />
                          <span className="text-sm">{DAY_NAMES_ES[d]}</span>
                        </label>
                      ))}
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-3"
                    onClick={handleApplyCopy}
                    disabled={copyTargets.length === 0}
                  >
                    {t("privateLessons.availability.apply", "Aplicar")}
                  </Button>
                </PopoverContent>
              </Popover>

              {/* Duration selector */}
              <Select value={state.duration} onValueChange={(v) => onChange({ ...state, duration: v })}>
                <SelectTrigger className="w-[90px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">1h</SelectItem>
                  <SelectItem value="90">1,5h</SelectItem>
                  <SelectItem value="120">2h</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Afternoon interval */}
          {state.hasAfternoon && (
            <div className="flex items-center gap-2 flex-wrap pl-0">
              <Input
                type="time"
                value={state.afternoonStart}
                onChange={(e) => onChange({ ...state, afternoonStart: e.target.value })}
                className="w-[110px] h-9 text-sm"
              />
              <span className="text-muted-foreground text-sm">—</span>
              <Input
                type="time"
                value={state.afternoonEnd}
                onChange={(e) => onChange({ ...state, afternoonEnd: e.target.value })}
                className="w-[110px] h-9 text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemoveInterval("afternoon")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AvailabilityDayRow;
