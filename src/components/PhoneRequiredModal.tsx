import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

// Lista de países con sus prefijos
const COUNTRIES = [
  { code: "ES", name: "España", flag: "🇪🇸", prefix: "+34", minDigits: 9, maxDigits: 9, startsWithPattern: /^[67]/ },
  { code: "FR", name: "Francia", flag: "🇫🇷", prefix: "+33", minDigits: 9, maxDigits: 9 },
  { code: "GB", name: "Reino Unido", flag: "🇬🇧", prefix: "+44", minDigits: 10, maxDigits: 10 },
  { code: "PT", name: "Portugal", flag: "🇵🇹", prefix: "+351", minDigits: 9, maxDigits: 9 },
  { code: "DE", name: "Alemania", flag: "🇩🇪", prefix: "+49", minDigits: 10, maxDigits: 11 },
  { code: "IT", name: "Italia", flag: "🇮🇹", prefix: "+39", minDigits: 9, maxDigits: 10 },
  { code: "NL", name: "Países Bajos", flag: "🇳🇱", prefix: "+31", minDigits: 9, maxDigits: 9 },
  { code: "BE", name: "Bélgica", flag: "🇧🇪", prefix: "+32", minDigits: 9, maxDigits: 9 },
  { code: "CH", name: "Suiza", flag: "🇨🇭", prefix: "+41", minDigits: 9, maxDigits: 9 },
  { code: "AT", name: "Austria", flag: "🇦🇹", prefix: "+43", minDigits: 10, maxDigits: 13 },
  { code: "IE", name: "Irlanda", flag: "🇮🇪", prefix: "+353", minDigits: 9, maxDigits: 9 },
  { code: "PL", name: "Polonia", flag: "🇵🇱", prefix: "+48", minDigits: 9, maxDigits: 9 },
  { code: "RO", name: "Rumanía", flag: "🇷🇴", prefix: "+40", minDigits: 10, maxDigits: 10 },
  { code: "SE", name: "Suecia", flag: "🇸🇪", prefix: "+46", minDigits: 9, maxDigits: 10 },
  { code: "NO", name: "Noruega", flag: "🇳🇴", prefix: "+47", minDigits: 8, maxDigits: 8 },
  { code: "DK", name: "Dinamarca", flag: "🇩🇰", prefix: "+45", minDigits: 8, maxDigits: 8 },
  { code: "FI", name: "Finlandia", flag: "🇫🇮", prefix: "+358", minDigits: 9, maxDigits: 10 },
  { code: "GR", name: "Grecia", flag: "🇬🇷", prefix: "+30", minDigits: 10, maxDigits: 10 },
  { code: "CZ", name: "República Checa", flag: "🇨🇿", prefix: "+420", minDigits: 9, maxDigits: 9 },
  { code: "HU", name: "Hungría", flag: "🇭🇺", prefix: "+36", minDigits: 9, maxDigits: 9 },
  { code: "UA", name: "Ucrania", flag: "🇺🇦", prefix: "+380", minDigits: 9, maxDigits: 9 },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", prefix: "+1", minDigits: 10, maxDigits: 10 },
  { code: "CA", name: "Canadá", flag: "🇨🇦", prefix: "+1", minDigits: 10, maxDigits: 10 },
  { code: "MX", name: "México", flag: "🇲🇽", prefix: "+52", minDigits: 10, maxDigits: 10 },
  { code: "AR", name: "Argentina", flag: "🇦🇷", prefix: "+54", minDigits: 10, maxDigits: 11 },
  { code: "BR", name: "Brasil", flag: "🇧🇷", prefix: "+55", minDigits: 10, maxDigits: 11 },
  { code: "CL", name: "Chile", flag: "🇨🇱", prefix: "+56", minDigits: 9, maxDigits: 9 },
  { code: "CO", name: "Colombia", flag: "🇨🇴", prefix: "+57", minDigits: 10, maxDigits: 10 },
  { code: "PE", name: "Perú", flag: "🇵🇪", prefix: "+51", minDigits: 9, maxDigits: 9 },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", prefix: "+58", minDigits: 10, maxDigits: 10 },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", prefix: "+598", minDigits: 8, maxDigits: 9 },
  { code: "CN", name: "China", flag: "🇨🇳", prefix: "+86", minDigits: 11, maxDigits: 11 },
  { code: "JP", name: "Japón", flag: "🇯🇵", prefix: "+81", minDigits: 10, maxDigits: 10 },
  { code: "IN", name: "India", flag: "🇮🇳", prefix: "+91", minDigits: 10, maxDigits: 10 },
  { code: "MY", name: "Malasia", flag: "🇲🇾", prefix: "+60", minDigits: 9, maxDigits: 10 },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", prefix: "+502", minDigits: 8, maxDigits: 8 },
  { code: "AU", name: "Australia", flag: "🇦🇺", prefix: "+61", minDigits: 9, maxDigits: 9 },
  { code: "NZ", name: "Nueva Zelanda", flag: "🇳🇿", prefix: "+64", minDigits: 9, maxDigits: 10 },
  { code: "ZA", name: "Sudáfrica", flag: "🇿🇦", prefix: "+27", minDigits: 9, maxDigits: 9 },
  { code: "MA", name: "Marruecos", flag: "🇲🇦", prefix: "+212", minDigits: 9, maxDigits: 9 },
];

interface PhoneRequiredModalProps {
  studentEnrollmentId: string;
  currentPhone: string | null;
  studentEmail: string;
  onPhoneUpdated: () => void;
}

export const PhoneRequiredModal = ({
  studentEnrollmentId,
  currentPhone,
  studentEmail,
  onPhoneUpdated
}: PhoneRequiredModalProps) => {
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("ES"); // España por defecto
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [phoneWasUpdated, setPhoneWasUpdated] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Get selected country
  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  // Handle phone input change - only allow digits and respect country's max digits
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, '');
    // Limit to country's max digits
    const limitedDigits = digitsOnly.slice(0, selectedCountry.maxDigits);
    setPhone(limitedDigits);
  };

  // Reset phone when country changes
  const handleCountryChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode);
    setPhone(""); // Clear phone when changing country
  };

  // Check if phone needs update
  const needsPhoneUpdate = !currentPhone || currentPhone === '' || currentPhone === '000000000';

  // Mostrar modal a todos los usuarios que necesiten completar su teléfono
  const showModal = needsPhoneUpdate && !phoneWasUpdated;

  const validatePhone = (phoneNumber: string, country: typeof COUNTRIES[0]): boolean => {
    const digits = phoneNumber.replace(/\D/g, '');

    // Check length
    if (digits.length < country.minDigits || digits.length > country.maxDigits) {
      return false;
    }

    // For Spain, check if it starts with 6 or 7
    if (country.code === "ES" && country.startsWithPattern) {
      return country.startsWithPattern.test(digits);
    }

    return true;
  };

  const formatPhoneForStorage = (phoneNumber: string, country: typeof COUNTRIES[0]): string => {
    const digits = phoneNumber.replace(/\D/g, '');

    // Para España: guardar SIN prefijo
    if (country.code === "ES") {
      return digits;
    }

    // Para cualquier otro país: guardar CON prefijo
    return country.prefix + digits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePhone(phone, selectedCountry)) {

      let errorMessage = `${t('playerDashboard.phoneModal.invalidNumberFor')} ${selectedCountry.name}`;

      if (selectedCountry.code === "ES") {
        errorMessage = t('playerDashboard.phoneModal.invalidSpanishNumber');
      } else {
        errorMessage += ` (${selectedCountry.minDigits}${selectedCountry.minDigits !== selectedCountry.maxDigits ? `-${selectedCountry.maxDigits}` : ''} ${t('playerDashboard.phoneModal.digits')})`;
      }

      toast({
        title: t('playerDashboard.phoneModal.invalidNumber'),
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    if (!whatsappConsent) {
      toast({
        title: t('playerDashboard.phoneModal.consentRequired'),
        description: t('playerDashboard.phoneModal.mustAcceptWhatsapp'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedPhone = formatPhoneForStorage(phone, selectedCountry);

      // Get the record to find the profile ID
      const { data: existingRecord, error: readError } = await supabase
        .from('student_enrollments')
        .select('id, phone, email, student_profile_id, created_by_profile_id')
        .eq('id', studentEnrollmentId)
        .single();

      if (readError) throw readError;

      // Update student_enrollments table
      const { error } = await supabase
        .from('student_enrollments')
        .update({ phone: formattedPhone })
        .eq('id', studentEnrollmentId);

      if (error) throw error;

      // Also update profiles table
      const profileId = existingRecord?.student_profile_id || existingRecord?.created_by_profile_id;

      if (profileId) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ phone: formattedPhone })
          .eq('id', profileId);

        if (profileError) {
          console.error('Warning: Could not update profiles table:', profileError);
          // Don't throw - enrollment update was successful
        }
      }

      toast({
        title: t('playerDashboard.phoneModal.phoneSaved'),
        description: t('playerDashboard.phoneModal.phoneRemindersEnabled'),
      });

      // Set local state to close modal immediately
      setPhoneWasUpdated(true);

      // Invalidate cache to refresh data
      onPhoneUpdated();
    } catch (error) {
      console.error('Error updating phone:', error);
      toast({
        title: t('playerDashboard.phoneModal.error'),
        description: t('playerDashboard.phoneModal.couldNotSave'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPhoneValid = validatePhone(phone, selectedCountry);
  const canSubmit = isPhoneValid && whatsappConsent;

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
            {t('playerDashboard.phoneModal.completeProfile')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <Phone className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-amber-900 mb-1">
                {t('playerDashboard.phoneModal.needPhoneNumber')}
              </p>
              <p className="text-amber-700">
                {t('playerDashboard.phoneModal.phoneReason')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="country" className="text-sm font-medium">
                {t('playerDashboard.phoneModal.country')}
              </label>
              <Select value={countryCode} onValueChange={handleCountryChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {selectedCountry.flag} {selectedCountry.name} ({selectedCountry.prefix})
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.flag} {country.name} ({country.prefix})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                {t('playerDashboard.phoneModal.phoneNumber')}
              </label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 border rounded-md bg-muted text-muted-foreground min-w-[80px] justify-center">
                  <span className="text-base font-medium">{selectedCountry.prefix}</span>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder={selectedCountry.code === "ES" ? "612345678" : "123456789"}
                  value={phone}
                  onChange={handlePhoneChange}
                  maxLength={selectedCountry.maxDigits}
                  className="text-base flex-1"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedCountry.code === "ES"
                  ? `${t('playerDashboard.phoneModal.enterWithoutPrefix')} +34`
                  : `${t('playerDashboard.phoneModal.enterWithoutPrefix')} ${selectedCountry.prefix} (${selectedCountry.minDigits}${selectedCountry.minDigits !== selectedCountry.maxDigits ? `-${selectedCountry.maxDigits}` : ''} ${t('playerDashboard.phoneModal.digits')})`
                }
              </p>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
              <Checkbox
                id="whatsapp-consent"
                checked={whatsappConsent}
                onCheckedChange={(checked) => setWhatsappConsent(checked as boolean)}
                className="mt-0.5"
              />
              <label
                htmlFor="whatsapp-consent"
                className="text-sm leading-tight cursor-pointer select-none"
              >
                {t('playerDashboard.phoneModal.whatsappConsent')}
              </label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? t('playerDashboard.phoneModal.saving') : t('playerDashboard.phoneModal.saveAndContinue')}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            {t('playerDashboard.phoneModal.cantUseApp')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
