
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, UserCheck } from "lucide-react";
import { useClubs, useAdminClubs } from "@/hooks/useClubs";
import { useCreateTrainer, useUpdateTrainer, Trainer } from "@/hooks/useTrainers";
import { PhoneInput } from "@/components/PhoneInput";
import { useTranslation } from "react-i18next";

const createFormSchema = z.object({
  full_name: z.string().min(1, "Introduce el nombre completo"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "Introduce el teléfono"),
  // Support both single club_id (legacy) and club_ids array (multi-club)
  club_id: z.string().optional(),
  club_ids: z.array(z.string()).optional(),
  specialty: z.string().optional(),
  photo_url: z.string().url("URL inválida").optional().or(z.literal("")),
  is_active: z.boolean(),
}).refine(data => {
  // At least one club must be selected (either via club_id or club_ids)
  return (data.club_id && data.club_id.length > 0) || (data.club_ids && data.club_ids.length > 0);
}, {
  message: "Selecciona al menos un club",
  path: ["club_ids"],
});

const editFormSchema = z.object({
  specialty: z.string().optional(),
  photo_url: z.string().url("URL inválida").optional().or(z.literal("")),
  is_active: z.boolean(),
});

type CreateFormData = z.infer<typeof createFormSchema>;
type EditFormData = z.infer<typeof editFormSchema>;

interface TrainerFormProps {
  trainer?: Trainer;
  onClose: () => void;
}

const TrainerForm = ({ trainer, onClose }: TrainerFormProps) => {
  const { t } = useTranslation();
  const { data: clubs } = useAdminClubs();
  const createMutation = useCreateTrainer();
  const updateMutation = useUpdateTrainer();

  const isEditing = !!trainer;

  // Determine if we should show multi-select (when user has access to multiple clubs)
  const showMultiClubSelect = clubs && clubs.length > 1;

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      club_id: "",
      club_ids: [],
      specialty: "",
      photo_url: "",
      is_active: true,
    },
  });

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      specialty: trainer?.specialty || "",
      photo_url: trainer?.photo_url || "",
      is_active: trainer?.is_active ?? true,
    },
  });

  const onCreateSubmit = (data: CreateFormData) => {
    // Determine club_ids: use club_ids array if multi-select, otherwise use club_id
    const clubIds = showMultiClubSelect && data.club_ids && data.club_ids.length > 0
      ? data.club_ids
      : (data.club_id ? [data.club_id] : []);

    // Ensure all required fields are present
    const submitData = {
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      club_ids: clubIds, // Always send as array for edge function
      specialty: data.specialty,
      photo_url: data.photo_url,
      is_active: data.is_active,
    };

    createMutation.mutate(submitData, {
      onSuccess: () => onClose(),
    });
  };

  const onEditSubmit = (data: EditFormData) => {
    if (!trainer) return;
    
    updateMutation.mutate({ 
      id: trainer.id,
      ...data,
    }, {
      onSuccess: () => onClose(),
    });
  };

  if (isEditing) {
    return (
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-black">
            {t('trainersPage.trainerForm.editTitle')}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5" />
              <span>{t('trainersPage.trainerForm.cardTitle')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900">{t('trainersPage.trainerForm.profileInfo.title')}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('trainersPage.trainerForm.profileInfo.name')} {trainer.profiles?.full_name || t('trainersPage.trainerForm.profileInfo.notAvailable')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t('trainersPage.trainerForm.profileInfo.email')} {trainer.profiles?.email || t('trainersPage.trainerForm.profileInfo.notAvailable')}
                    </p>
                  </div>

                  <FormField
                    control={editForm.control}
                    name="specialty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('trainersPage.trainerForm.fields.specialty')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('trainersPage.trainerForm.fields.specialtyPlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/*<FormField
                    control={editForm.control}
                    name="photo_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL de la foto (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />*/}

                  <FormField
                    control={editForm.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>{t('trainersPage.trainerForm.fields.isActive')}</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    {t('trainersPage.trainerForm.buttons.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {t('trainersPage.trainerForm.buttons.updating')}
                      </div>
                    ) : (
                      t('trainersPage.trainerForm.buttons.updateTrainer')
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-black">
          {t('trainersPage.trainerForm.newTitle')}
        </h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5" />
            <span>{t('trainersPage.trainerForm.cardTitle')}</span>
          </CardTitle>
          <CardDescription>
            {t('trainersPage.trainerForm.cardDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
              <div className="space-y-6">
                <FormField
                  control={createForm.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('trainersPage.trainerForm.fields.fullName')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('trainersPage.trainerForm.fields.fullNamePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('trainersPage.trainerForm.fields.email')}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder={t('trainersPage.trainerForm.fields.emailPlaceholder')} {...field} />
                      </FormControl>
                      <FormDescription>
                        {t('trainersPage.trainerForm.fields.emailDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <PhoneInput
                          value={field.value}
                          onChange={field.onChange}
                          label={t('trainersPage.trainerForm.fields.phone')}
                          required={true}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('trainersPage.trainerForm.fields.specialty')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('trainersPage.trainerForm.fields.specialtyPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/*<FormField
                  control={createForm.control}
                  name="photo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de la foto (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />*/}

                {/* Show multi-select checkboxes when user has access to multiple clubs */}
                {showMultiClubSelect ? (
                  <FormField
                    control={createForm.control}
                    name="club_ids"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('trainersPage.trainerForm.fields.club')}</FormLabel>
                        <FormDescription className="mb-2">
                          Selecciona los clubes donde el entrenador dará clases
                        </FormDescription>
                        <div className="space-y-2 border border-gray-200 rounded-md p-3 max-h-48 overflow-y-auto">
                          {clubs?.map((club) => (
                            <div key={club.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`club-${club.id}`}
                                checked={field.value?.includes(club.id) || false}
                                onCheckedChange={(checked) => {
                                  const currentValues = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentValues, club.id]);
                                  } else {
                                    field.onChange(currentValues.filter((id: string) => id !== club.id));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`club-${club.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {club.name}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  /* Show single select dropdown when user has access to only one club */
                  <FormField
                    control={createForm.control}
                    name="club_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('trainersPage.trainerForm.fields.club')}</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          >
                            <option value="">{t('trainersPage.trainerForm.fields.clubPlaceholder')}</option>
                            {clubs?.map((club) => (
                              <option key={club.id} value={club.id}>
                                {club.name}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormDescription>
                          {t('trainersPage.trainerForm.fields.clubDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={createForm.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{t('trainersPage.trainerForm.fields.isActive')}</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  {t('trainersPage.trainerForm.buttons.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {t('trainersPage.trainerForm.buttons.creating')}
                    </div>
                  ) : (
                    t('trainersPage.trainerForm.buttons.createTrainer')
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainerForm;
