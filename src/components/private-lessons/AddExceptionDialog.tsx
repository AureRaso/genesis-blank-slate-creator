import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useCreateException } from "@/hooks/usePrivateLessons";

interface AddExceptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainerProfileId: string;
  clubId: string;
}

const AddExceptionDialog = ({ open, onOpenChange, trainerProfileId, clubId }: AddExceptionDialogProps) => {
  const { t } = useTranslation();
  const createMutation = useCreateException();

  const [exceptionType, setExceptionType] = useState<"block_day" | "extra_day" | "vacation">("block_day");
  const [exceptionDate, setExceptionDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  // Extra day fields
  const [morningStart, setMorningStart] = useState("");
  const [morningEnd, setMorningEnd] = useState("");
  const [afternoonStart, setAfternoonStart] = useState("");
  const [afternoonEnd, setAfternoonEnd] = useState("");
  const [duration, setDuration] = useState("60");

  const resetForm = () => {
    setExceptionType("block_day");
    setExceptionDate("");
    setStartDate("");
    setEndDate("");
    setReason("");
    setMorningStart("");
    setMorningEnd("");
    setAfternoonStart("");
    setAfternoonEnd("");
    setDuration("60");
  };

  const handleSubmit = () => {
    createMutation.mutate(
      {
        trainer_profile_id: trainerProfileId,
        club_id: clubId,
        exception_type: exceptionType,
        exception_date: exceptionType !== "vacation" ? exceptionDate || null : null,
        start_date: exceptionType === "vacation" ? startDate || null : null,
        end_date: exceptionType === "vacation" ? endDate || null : null,
        morning_start: exceptionType === "extra_day" && morningStart ? morningStart : null,
        morning_end: exceptionType === "extra_day" && morningEnd ? morningEnd : null,
        afternoon_start: exceptionType === "extra_day" && afternoonStart ? afternoonStart : null,
        afternoon_end: exceptionType === "extra_day" && afternoonEnd ? afternoonEnd : null,
        slot_duration_minutes: exceptionType === "extra_day" ? parseInt(duration) : null,
        reason: reason || null,
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      }
    );
  };

  const isValid =
    (exceptionType === "vacation" && startDate && endDate) ||
    (exceptionType !== "vacation" && exceptionDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("privateLessons.exceptions.addTitle", "Añadir excepción")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Exception type */}
          <div className="space-y-1">
            <Label>{t("privateLessons.exceptions.type", "Tipo")}</Label>
            <Select value={exceptionType} onValueChange={(v) => setExceptionType(v as typeof exceptionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="block_day">{t("privateLessons.exceptions.blockDay", "Bloquear día")}</SelectItem>
                <SelectItem value="extra_day">{t("privateLessons.exceptions.extraDay", "Día extra")}</SelectItem>
                <SelectItem value="vacation">{t("privateLessons.exceptions.vacation", "Vacaciones")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date fields */}
          {exceptionType === "vacation" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t("privateLessons.exceptions.startDate", "Fecha inicio")}</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t("privateLessons.exceptions.endDate", "Fecha fin")}</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <Label>{t("privateLessons.exceptions.date", "Fecha")}</Label>
              <Input type="date" value={exceptionDate} onChange={(e) => setExceptionDate(e.target.value)} />
            </div>
          )}

          {/* Extra day: time ranges */}
          {exceptionType === "extra_day" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t("privateLessons.availability.morning", "Mañana")}
                </Label>
                <div className="flex items-center gap-2">
                  <Input type="time" value={morningStart} onChange={(e) => setMorningStart(e.target.value)} className="w-28 text-sm" />
                  <span className="text-muted-foreground text-sm">—</span>
                  <Input type="time" value={morningEnd} onChange={(e) => setMorningEnd(e.target.value)} className="w-28 text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t("privateLessons.availability.afternoon", "Tarde")}
                </Label>
                <div className="flex items-center gap-2">
                  <Input type="time" value={afternoonStart} onChange={(e) => setAfternoonStart(e.target.value)} className="w-28 text-sm" />
                  <span className="text-muted-foreground text-sm">—</span>
                  <Input type="time" value={afternoonEnd} onChange={(e) => setAfternoonEnd(e.target.value)} className="w-28 text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t("privateLessons.availability.duration", "Duración")}
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
            </>
          )}

          {/* Reason */}
          <div className="space-y-1">
            <Label>{t("privateLessons.exceptions.reason", "Motivo")} ({t("common.optional", "opcional")})</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("privateLessons.exceptions.reasonPlaceholder", "Ej: Torneo, Festivo...")}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Cancelar")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || createMutation.isPending}
            className="bg-playtomic-orange hover:bg-playtomic-orange-dark"
          >
            {t("common.save", "Guardar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddExceptionDialog;