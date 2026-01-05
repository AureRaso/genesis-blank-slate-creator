import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Shirt, Calendar, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const VALID_SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

interface PlayerDetailsModalProps {
  profileId: string;
  currentBirthDate: string | null | undefined;
  currentShirtSize: string | null | undefined;
  onDetailsUpdated: () => void;
}

export const PlayerDetailsModal = ({
  profileId,
  currentBirthDate,
  currentShirtSize,
  onDetailsUpdated
}: PlayerDetailsModalProps) => {
  const [birthDate, setBirthDate] = useState(currentBirthDate || "");
  const [shirtSize, setShirtSize] = useState(currentShirtSize || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailsWereUpdated, setDetailsWereUpdated] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Validate shirt size
  const isValidShirtSize = VALID_SHIRT_SIZES.includes(shirtSize.toUpperCase());

  // Handle shirt size input - convert to uppercase and validate
  const handleShirtSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    // Only allow letters and numbers (for 3XL)
    const filtered = value.replace(/[^A-Z0-9]/g, '').slice(0, 3);
    setShirtSize(filtered);
  };

  // Check if details need update
  const needsDetailsUpdate = !currentBirthDate || !currentShirtSize;
  const showModal = needsDetailsUpdate && !detailsWereUpdated;

  const validateBirthDate = (date: string): boolean => {
    if (!date) return false;

    const birthDateObj = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDateObj.getFullYear();

    // Check if age is between 5 and 100 years
    return age >= 5 && age <= 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateBirthDate(birthDate)) {
      toast({
        title: t('playerDashboard.playerDetailsModal.invalidDate'),
        description: t('playerDashboard.playerDetailsModal.invalidDateDescription'),
        variant: "destructive",
      });
      return;
    }

    if (!shirtSize || !isValidShirtSize) {
      toast({
        title: t('playerDashboard.playerDetailsModal.invalidSize'),
        description: t('playerDashboard.playerDetailsModal.invalidSizeDescription'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          birth_date: birthDate,
          shirt_size: shirtSize.toUpperCase()
        })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: t('playerDashboard.playerDetailsModal.dataSaved'),
        description: t('playerDashboard.playerDetailsModal.dataSavedDescription'),
      });

      setDetailsWereUpdated(true);
      onDetailsUpdated();
    } catch (error) {
      console.error('Error updating player details:', error);
      toast({
        title: t('playerDashboard.playerDetailsModal.error'),
        description: t('playerDashboard.playerDetailsModal.couldNotSave'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = validateBirthDate(birthDate) && isValidShirtSize;

  if (!showModal) return null;

  return (
    <Dialog open={showModal} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        hideCloseButton
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertCircle className="h-6 w-6 text-amber-500" />
            {t('playerDashboard.playerDetailsModal.completeProfile')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <Shirt className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-amber-900 mb-1">
                {t('playerDashboard.playerDetailsModal.needAdditionalData')}
              </p>
              <p className="text-amber-700">
                {t('playerDashboard.playerDetailsModal.dataReason')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="birthDate" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('playerDashboard.playerDetailsModal.birthDate')}
              </label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="shirtSize" className="text-sm font-medium flex items-center gap-2">
                <Shirt className="h-4 w-4" />
                {t('playerDashboard.playerDetailsModal.shirtSize')}
              </label>
              <div className="relative">
                <Input
                  id="shirtSize"
                  type="text"
                  placeholder={t('playerDashboard.playerDetailsModal.shirtSizePlaceholder')}
                  value={shirtSize}
                  onChange={handleShirtSizeChange}
                  maxLength={3}
                  className={`text-base uppercase pr-10 ${
                    shirtSize && !isValidShirtSize ? 'border-red-500 focus-visible:ring-red-500' : ''
                  } ${shirtSize && isValidShirtSize ? 'border-green-500 focus-visible:ring-green-500' : ''}`}
                />
                {shirtSize && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isValidShirtSize ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('playerDashboard.playerDetailsModal.validSizes')}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? t('playerDashboard.playerDetailsModal.saving') : t('playerDashboard.playerDetailsModal.saveAndContinue')}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            {t('playerDashboard.playerDetailsModal.cantUseApp')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
