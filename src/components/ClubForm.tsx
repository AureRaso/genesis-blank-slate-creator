
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateClub, useUpdateClub } from "@/hooks/useClubs";
import { Club, CreateClubData, COURT_TYPES } from "@/types/clubs";
import { ArrowLeft, Building2, Shield } from "lucide-react";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";

interface ClubFormProps {
  club?: Club;
  onClose: () => void;
}

interface ClubFormData extends CreateClubData {}

const ClubForm = ({ club, onClose }: ClubFormProps) => {
  const { t } = useTranslation();
  const isEditing = !!club;
  const createClub = useCreateClub();
  const updateClub = useUpdateClub();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ClubFormData>({
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      court_count: 1,
      court_types: [],
      description: "",
      lopivi_delegate_name: "",
      lopivi_delegate_email: "",
      lopivi_delegate_phone: "",
    },
  });

  // Persistencia del formulario solo para nuevos clubs
  const persistenceKey = `club-form-${isEditing ? club?.id : 'new'}`;
  const { clearPersistedData } = useFormPersistence({
    key: persistenceKey,
    watch,
    setValue,
  });

  // Cargar datos del club existente si estamos editando
  useEffect(() => {
    if (isEditing && club) {
      setValue("name", club.name);
      setValue("address", club.address);
      setValue("phone", club.phone);
      setValue("court_count", club.court_count);
      setValue("court_types", club.court_types);
      setValue("description", club.description || "");
      setValue("lopivi_delegate_name", club.lopivi_delegate_name || "");
      setValue("lopivi_delegate_email", club.lopivi_delegate_email || "");
      setValue("lopivi_delegate_phone", club.lopivi_delegate_phone || "");
    }
  }, [isEditing, club, setValue]);

  const courtTypes = watch("court_types");

  const handleCourtTypeChange = (courtType: string, checked: boolean) => {
    const current = courtTypes || [];
    if (checked) {
      setValue("court_types", [...current, courtType]);
    } else {
      setValue("court_types", current.filter(type => type !== courtType));
    }
  };

  const onSubmit = async (data: ClubFormData) => {
    try {
      if (isEditing && club) {
        await updateClub.mutateAsync({
          id: club.id,
          ...data,
        });
      } else {
        await createClub.mutateAsync(data);
      }
      // Limpiar datos persistidos después de envío exitoso
      clearPersistedData();
      onClose();
    } catch (error) {
      console.error("Error submitting club form:", error);
    }
  };

  const handleCancel = () => {
    // Limpiar datos persistidos al cancelar
    if (!isEditing) {
      clearPersistedData();
    }
    onClose();
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-black">
          {isEditing ? t('clubsPage.clubForm.editTitle') : t('clubsPage.clubForm.newTitle')}
        </h1>
      </div>

      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">{t('clubsPage.clubForm.fields.name')} *</Label>
            <Input
              id="name"
              {...register("name", { required: t('clubsPage.clubForm.fields.nameRequired') })}
              placeholder={t('clubsPage.clubForm.fields.namePlaceholder')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t('clubsPage.clubForm.fields.address')} *</Label>
            <Textarea
              id="address"
              {...register("address", { required: t('clubsPage.clubForm.fields.addressRequired') })}
              placeholder={t('clubsPage.clubForm.fields.addressPlaceholder')}
              rows={3}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('clubsPage.clubForm.fields.phone')} *</Label>
            <Input
              id="phone"
              {...register("phone", { required: t('clubsPage.clubForm.fields.phoneRequired') })}
              placeholder={t('clubsPage.clubForm.fields.phonePlaceholder')}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="court_count">{t('clubsPage.clubForm.fields.courtCount')} *</Label>
            <Input
              id="court_count"
              type="number"
              min="1"
              {...register("court_count", {
                required: t('clubsPage.clubForm.fields.courtCountRequired'),
                min: { value: 1, message: t('clubsPage.clubForm.fields.courtCountMin') }
              })}
            />
            {errors.court_count && (
              <p className="text-sm text-destructive">{errors.court_count.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('clubsPage.clubForm.fields.courtTypes')} *</Label>
            <div className="grid grid-cols-2 gap-3">
              {COURT_TYPES.map((courtType) => (
                <div key={courtType} className="flex items-center space-x-2">
                  <Checkbox
                    id={courtType}
                    checked={courtTypes?.includes(courtType) || false}
                    onCheckedChange={(checked) =>
                      handleCourtTypeChange(courtType, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={courtType}
                    className="text-sm font-normal capitalize"
                  >
                    {courtType}
                  </Label>
                </div>
              ))}
            </div>
            {(!courtTypes || courtTypes.length === 0) && (
              <p className="text-sm text-destructive">{t('clubsPage.clubForm.fields.courtTypesRequired')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('clubsPage.clubForm.fields.description')}</Label>
            <Textarea
              id="description"
              {...register("description", {
                maxLength: { value: 200, message: t('clubsPage.clubForm.fields.descriptionMaxLength') }
              })}
              placeholder={t('clubsPage.clubForm.fields.descriptionPlaceholder')}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {watch("description")?.length || 0}/200 {t('clubsPage.clubForm.fields.characters')}
            </p>
          </div>

          <Separator className="my-6" />

          {/* Sección Delegado de Protección LOPIVI */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{t('clubsPage.clubForm.lopivi.title')}</h3>
                <p className="text-sm text-slate-500">
                  {t('clubsPage.clubForm.lopivi.description')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lopivi_delegate_name">{t('clubsPage.clubForm.lopivi.delegateName')}</Label>
              <Input
                id="lopivi_delegate_name"
                {...register("lopivi_delegate_name")}
                placeholder={t('clubsPage.clubForm.lopivi.delegateNamePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lopivi_delegate_email">{t('clubsPage.clubForm.lopivi.delegateEmail')}</Label>
              <Input
                id="lopivi_delegate_email"
                type="email"
                {...register("lopivi_delegate_email", {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: t('clubsPage.clubForm.lopivi.delegateEmailInvalid')
                  }
                })}
                placeholder={t('clubsPage.clubForm.lopivi.delegateEmailPlaceholder')}
              />
              {errors.lopivi_delegate_email && (
                <p className="text-sm text-destructive">{errors.lopivi_delegate_email.message}</p>
              )}
              <p className="text-xs text-slate-500">
                {t('clubsPage.clubForm.lopivi.delegateEmailHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lopivi_delegate_phone">{t('clubsPage.clubForm.lopivi.delegatePhone')}</Label>
              <Input
                id="lopivi_delegate_phone"
                {...register("lopivi_delegate_phone")}
                placeholder={t('clubsPage.clubForm.lopivi.delegatePhonePlaceholder')}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              {t('clubsPage.clubForm.buttons.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={createClub.isPending || updateClub.isPending || !courtTypes?.length}
              className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark"
            >
              {(createClub.isPending || updateClub.isPending)
                ? t('clubsPage.clubForm.buttons.saving')
                : isEditing
                  ? t('clubsPage.clubForm.buttons.updateClub')
                  : t('clubsPage.clubForm.buttons.createClub')
              }
            </Button>
          </div>
        </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubForm;
