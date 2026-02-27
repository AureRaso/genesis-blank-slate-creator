import { useState, useEffect } from "react";
import { Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trainer, PrivateLessonRates, useUpdateTrainerRates } from "@/hooks/useTrainers";
import { useTranslation } from "react-i18next";

interface TrainerRateDialogProps {
  trainer: Trainer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DURATIONS = [60, 90, 120] as const;

const getInitials = (name: string) => {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'PR';
};

const TrainerRateDialog = ({ trainer, open, onOpenChange }: TrainerRateDialogProps) => {
  const { t } = useTranslation();
  const updateRates = useUpdateTrainerRates();

  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  // All rates for all durations, keyed by duration string
  const [allRates, setAllRates] = useState<Record<string, { p1: string; p2: string; p3: string; p4: string }>>({});

  useEffect(() => {
    if (open) {
      const rates: Record<string, { p1: string; p2: string; p3: string; p4: string }> = {};
      const existing = trainer.private_lesson_rates || {};

      for (const dur of DURATIONS) {
        const key = String(dur);
        const tierRates = existing[key];
        rates[key] = {
          p1: tierRates?.price_1_player != null ? String(tierRates.price_1_player) : '',
          p2: tierRates?.price_2_players != null ? String(tierRates.price_2_players) : '',
          p3: tierRates?.price_3_players != null ? String(tierRates.price_3_players) : '',
          p4: tierRates?.price_4_players != null ? String(tierRates.price_4_players) : '',
        };
      }

      setAllRates(rates);

      // Select the first duration that has any price configured, or default to 60
      const firstConfigured = DURATIONS.find((dur) => {
        const r = existing[String(dur)];
        return r && (r.price_1_player != null || r.price_2_players != null || r.price_3_players != null || r.price_4_players != null);
      });
      setSelectedDuration(firstConfigured || 60);
    }
  }, [open, trainer]);

  const trainerName = trainer.profiles?.full_name || t('trainersPage.trainersList.fallback.nameNotAvailable');

  const currentRates = allRates[String(selectedDuration)] || { p1: '', p2: '', p3: '', p4: '' };

  const setCurrentField = (field: 'p1' | 'p2' | 'p3' | 'p4', value: string) => {
    setAllRates((prev) => ({
      ...prev,
      [String(selectedDuration)]: {
        ...prev[String(selectedDuration)],
        [field]: value,
      },
    }));
  };

  // Count how many durations have at least one price configured
  const configuredDurations = DURATIONS.filter((dur) => {
    const r = allRates[String(dur)];
    return r && (r.p1 || r.p2 || r.p3 || r.p4);
  });

  const handleSave = () => {
    const ratesPayload: PrivateLessonRates = {};

    for (const dur of DURATIONS) {
      const key = String(dur);
      const r = allRates[key];
      if (!r) continue;

      // Only include duration tiers that have at least one price
      const hasAnyPrice = r.p1 || r.p2 || r.p3 || r.p4;
      if (hasAnyPrice) {
        ratesPayload[key] = {
          price_1_player: r.p1 ? parseFloat(r.p1) : null,
          price_2_players: r.p2 ? parseFloat(r.p2) : null,
          price_3_players: r.p3 ? parseFloat(r.p3) : null,
          price_4_players: r.p4 ? parseFloat(r.p4) : null,
        };
      }
    }

    updateRates.mutate({
      id: trainer.id,
      private_lesson_rates: ratesPayload,
    }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const durationLabel = (mins: number) => {
    const h = mins / 60;
    return h === 1 ? '1h' : `${h.toLocaleString('es-ES', { maximumFractionDigits: 1 })}h`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Edit className="h-5 w-5 text-playtomic-orange" />
            {t('trainersPage.rateDialog.title')} · {trainerName}
          </DialogTitle>
        </DialogHeader>

        {/* Trainer info */}
        <div className="flex flex-col items-center py-4">
          <Avatar className="h-16 w-16 mb-2">
            <AvatarImage src={trainer.photo_url || undefined} alt={trainerName} />
            <AvatarFallback className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark text-white text-lg">
              {getInitials(trainerName)}
            </AvatarFallback>
          </Avatar>
          <p className="font-semibold">{trainerName}</p>
          {configuredDurations.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {configuredDurations.map(d => durationLabel(d)).join(' · ')}
            </p>
          )}
        </div>

        {/* Duration selector */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('trainersPage.rateDialog.duration')}
          </Label>
          <div className="flex gap-2">
            {DURATIONS.map((mins) => {
              const key = String(mins);
              const hasRates = allRates[key] && (allRates[key].p1 || allRates[key].p2 || allRates[key].p3 || allRates[key].p4);
              return (
                <Button
                  key={mins}
                  type="button"
                  variant={selectedDuration === mins ? "default" : "outline"}
                  size="sm"
                  className={`relative ${selectedDuration === mins ? "bg-playtomic-orange hover:bg-playtomic-orange-dark" : ""}`}
                  onClick={() => setSelectedDuration(mins)}
                >
                  {durationLabel(mins)}
                  {hasRates && selectedDuration !== mins && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500" />
                  )}
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('trainersPage.rateDialog.durationHint')}
          </p>
        </div>

        {/* Price inputs for selected duration */}
        <div className="space-y-3 mt-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('trainersPage.rateDialog.pricesTitle')} · {durationLabel(selectedDuration)}
          </Label>
          <p className="text-xs text-muted-foreground -mt-1">
            {t('trainersPage.rateDialog.pricesHint')}
          </p>
          <p className="text-xs text-amber-600 font-medium -mt-1">
            {t('trainersPage.rateDialog.commissionNotice', 'Se aplicará una comisión del 6% sobre el precio total de cada clase con pago online.')}
          </p>

          <div className="space-y-2">
            {[
              { label: t('trainersPage.rateDialog.player1'), field: 'p1' as const, value: currentRates.p1 },
              { label: t('trainersPage.rateDialog.player2'), field: 'p2' as const, value: currentRates.p2 },
              { label: t('trainersPage.rateDialog.player3'), field: 'p3' as const, value: currentRates.p3 },
              { label: t('trainersPage.rateDialog.player4'), field: 'p4' as const, value: currentRates.p4 },
            ].map(({ label, field, value }, i) => (
              <div key={field} className="flex items-center justify-between gap-4">
                <span className={`text-sm ${i === 0 ? 'font-semibold' : 'text-muted-foreground'}`}>
                  {label}
                </span>
                <div className="relative w-28">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="—"
                    value={value}
                    onChange={(e) => setCurrentField(field, e.target.value)}
                    className="text-right pr-7"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    &euro;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updateRates.isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateRates.isPending}
            className="bg-playtomic-orange hover:bg-playtomic-orange-dark"
          >
            {updateRates.isPending
              ? t('trainersPage.rateDialog.saving')
              : t('trainersPage.rateDialog.save')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TrainerRateDialog;
