import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Shield, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

interface LopiviReportFormData {
  reporter_name: string;
  reporter_email: string;
  reporter_phone: string;
  reporter_relationship: string;
  incident_type: string;
  incident_date: string;
  incident_description: string;
  people_involved: string;
  witnesses: string;
}

interface LopiviReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: string;
  clubName: string;
}

// Keys for incident types - values sent to database
const INCIDENT_TYPE_KEYS = [
  "physicalViolence",
  "psychologicalViolence",
  "harassment",
  "discrimination",
  "inappropriateConduct",
  "negligence",
  "other"
] as const;

// Keys for relationship types - values sent to database
const RELATIONSHIP_TYPE_KEYS = [
  "parentMother",
  "legalGuardian",
  "student",
  "witness",
  "other"
] as const;

export const LopiviReportDialog = ({ open, onOpenChange, clubId, clubName }: LopiviReportDialogProps) => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<LopiviReportFormData>({
    defaultValues: {
      reporter_name: profile?.full_name || "",
      reporter_email: "",
      reporter_phone: profile?.phone || "",
      reporter_relationship: "",
      incident_type: "",
      incident_date: "",
      incident_description: "",
      people_involved: "",
      witnesses: "",
    },
  });

  const onSubmit = async (data: LopiviReportFormData) => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('lopivi_reports')
        .insert({
          club_id: clubId,
          reporter_profile_id: profile?.id || null,
          reporter_name: data.reporter_name,
          reporter_email: data.reporter_email,
          reporter_phone: data.reporter_phone || null,
          reporter_relationship: data.reporter_relationship,
          incident_type: data.incident_type,
          incident_date: data.incident_date || null,
          incident_description: data.incident_description,
          people_involved: data.people_involved || null,
          witnesses: data.witnesses || null,
          status: 'pending'
        });

      if (error) {
        throw error;
      }

      toast.success(t('settings.lopivi.reportSent'), {
        description: t('settings.lopivi.reportSentDescription'),
      });

      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting LOPIVI report:', error);
      toast.error(t('settings.lopivi.errorSending'), {
        description: t('settings.lopivi.errorSendingDescription'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-5 w-5 text-blue-600" />
            {t('settings.lopivi.title')}
          </DialogTitle>
          <DialogDescription>
            {t('settings.lopivi.clubLabel')} {clubName} · {t('settings.lopivi.confidentialNote')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)] pr-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Alert Box */}
            <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r">
              <div className="flex gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  {t('settings.lopivi.alertText')}
                </p>
              </div>
            </div>

            {/* Compact Form Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="reporter_name" className="text-sm">{t('settings.lopivi.reporterName')} *</Label>
                <Input
                  id="reporter_name"
                  {...register("reporter_name", { required: t('settings.lopivi.reporterNameRequired') })}
                  placeholder={t('settings.lopivi.reporterNamePlaceholder')}
                  className="h-9"
                />
                {errors.reporter_name && (
                  <p className="text-xs text-destructive mt-1">{errors.reporter_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="reporter_email" className="text-sm">{t('settings.lopivi.reporterEmail')} *</Label>
                <Input
                  id="reporter_email"
                  type="email"
                  {...register("reporter_email", {
                    required: t('settings.lopivi.reporterEmailRequired'),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t('settings.lopivi.reporterEmailInvalid')
                    }
                  })}
                  placeholder={t('settings.lopivi.reporterEmailPlaceholder')}
                  className="h-9"
                />
                {errors.reporter_email && (
                  <p className="text-xs text-destructive mt-1">{errors.reporter_email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="reporter_phone" className="text-sm">{t('settings.lopivi.reporterPhone')}</Label>
                <Input
                  id="reporter_phone"
                  {...register("reporter_phone")}
                  placeholder={t('settings.lopivi.reporterPhonePlaceholder')}
                  className="h-9"
                />
              </div>

              <div>
                <Label htmlFor="reporter_relationship" className="text-sm">{t('settings.lopivi.relationship')} *</Label>
                <Select
                  onValueChange={(value) => setValue("reporter_relationship", value)}
                  value={watch("reporter_relationship")}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={t('settings.lopivi.relationshipPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_TYPE_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>{t(`settings.lopivi.relationshipTypes.${key}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!watch("reporter_relationship") && (
                  <p className="text-xs text-destructive mt-1">{t('settings.lopivi.relationshipRequired')}</p>
                )}
              </div>

              <div>
                <Label htmlFor="incident_type" className="text-sm">{t('settings.lopivi.incidentType')} *</Label>
                <Select
                  onValueChange={(value) => setValue("incident_type", value)}
                  value={watch("incident_type")}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={t('settings.lopivi.incidentTypePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {INCIDENT_TYPE_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>{t(`settings.lopivi.incidentTypes.${key}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!watch("incident_type") && (
                  <p className="text-xs text-destructive mt-1">{t('settings.lopivi.incidentTypeRequired')}</p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="incident_date" className="text-sm">{t('settings.lopivi.incidentDate')}</Label>
                <Input
                  id="incident_date"
                  type="date"
                  {...register("incident_date")}
                  className="h-9"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="incident_description" className="text-sm">{t('settings.lopivi.incidentDescription')} * ({t('settings.lopivi.incidentDescriptionMin')})</Label>
                <Textarea
                  id="incident_description"
                  {...register("incident_description", {
                    required: t('settings.lopivi.incidentDescriptionRequired'),
                    minLength: { value: 20, message: t('settings.lopivi.incidentDescriptionMinLength') }
                  })}
                  placeholder={t('settings.lopivi.incidentDescriptionPlaceholder')}
                  rows={4}
                  className="resize-none"
                />
                {errors.incident_description && (
                  <p className="text-xs text-destructive mt-1">{errors.incident_description.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {watch("incident_description")?.length || 0}/20
                </p>
              </div>

              <div className="col-span-2">
                <Label htmlFor="people_involved" className="text-sm">{t('settings.lopivi.peopleInvolved')}</Label>
                <Textarea
                  id="people_involved"
                  {...register("people_involved")}
                  placeholder={t('settings.lopivi.peopleInvolvedPlaceholder')}
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="witnesses" className="text-sm">{t('settings.lopivi.witnesses')}</Label>
                <Textarea
                  id="witnesses"
                  {...register("witnesses")}
                  placeholder={t('settings.lopivi.witnessesPlaceholder')}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('settings.lopivi.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !watch("reporter_relationship") || !watch("incident_type")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('settings.lopivi.sending')}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {t('settings.lopivi.sendReport')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
