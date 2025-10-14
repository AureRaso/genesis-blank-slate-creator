import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar, Clock, Users, Target, ArrowLeft, ArrowRight, AlertTriangle, ChevronDown, ChevronUp, MapPin, Euro, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useCreateProgrammedClass } from "@/hooks/useProgrammedClasses";
import { useClassGroups, useAdminClassGroups } from "@/hooks/useClassGroups";
import { useStudentEnrollments, useAdminStudentEnrollments } from "@/hooks/useStudentEnrollments";
import { useMyTrainerProfile, useTrainers, useAdminTrainers } from "@/hooks/useTrainers";
import { useAdminClubs } from "@/hooks/useClubs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
const formSchema = z.object({
  // Step 1: Basic Info
  name: z.string().min(1, "Name is required"),
  // Modified level fields
  level_format: z.enum(["numeric", "levante"]).default("numeric"),
  level_from: z.number().min(1.0).max(10.0).optional(),
  level_to: z.number().min(1.0).max(10.0).optional(),
  custom_level: z.enum(["primera_alta", "primera_media", "primera_baja", "segunda_alta", "segunda_media", "segunda_baja", "tercera_alta", "tercera_media", "tercera_baja"]).optional(),
  start_time: z.string().min(1, "Start time is required"),
  duration_minutes: z.number().min(30).max(180),
  max_participants: z.number().min(1).max(12).default(4),
  // Modified days of week - now multiple selection
  selected_days: z.array(z.string()).min(1, "Select at least one day"),
  start_date: z.date({
    required_error: "Start date is required"
  }),
  end_date: z.date({
    required_error: "End date is required"
  }),
  recurrence_type: z.enum(["weekly", "biweekly", "monthly"]),
  // Step 2: Group and Students
  selection_type: z.enum(["group", "individual"]).default("individual"),
  group_id: z.string().optional(),
  selected_students: z.array(z.string()).default([]),
  // Step 3: Configuration
  trainer_profile_id: z.string().min(1, "Trainer is required"),
  club_id: z.string().min(1, "Club is required"),
  objective: z.string().optional(),
  court_number: z.number().min(1).nullable().optional(),
  // Optional trainer assignment for admins
  assigned_trainer_id: z.string().optional(),
  // Precio mensual
  monthly_price: z.number().min(0, "El precio debe ser mayor o igual a 0")
}).refine(data => {
  if (data.level_format === "numeric") {
    return data.level_from && data.level_to && data.level_from <= data.level_to;
  } else {
    return !!data.custom_level;
  }
}, {
  message: "Configure the level correctly",
  path: ["level_from"]
});
type FormData = z.infer<typeof formSchema>;
interface ScheduledClassFormProps {
  onClose: () => void;
  clubId: string;
  trainerProfileId: string;
  initialData?: {
    start_time?: string;
    selected_days?: string[];
    start_date?: Date;
    end_date?: Date;
  };
  showPreview?: boolean;
  renderPreview?: (data: {
    formData: any;
    previewDates: string[];
    conflicts: string[];
    students: any[];
    groups: any[];
    clubs: any[];
    currentStep: number;
  }) => React.ReactNode;
}
export default function ScheduledClassForm({
  onClose,
  clubId,
  trainerProfileId,
  initialData,
  showPreview = false,
  renderPreview
}: ScheduledClassFormProps) {
  const { t } = useTranslation();
  const { getDateFnsLocale } = useLanguage();
  const { isAdmin } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [previewDates, setPreviewDates] = useState<string[]>([]);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [isAlternativeFormatOpen, setIsAlternativeFormatOpen] = useState(false);
  
  // Get trainer profile to get the correct club
  const { data: trainerProfile } = useMyTrainerProfile();
  const trainerClubId = trainerProfile?.trainer_clubs?.[0]?.club_id;

  // Dynamic translation arrays
  const LEVANTE_LEVELS = [
    { value: "primera_alta", label: t('classes.primeraAlta') },
    { value: "primera_media", label: t('classes.primeraMedia') },
    { value: "primera_baja", label: t('classes.primeraBaja') },
    { value: "segunda_alta", label: t('classes.segundaAlta') },
    { value: "segunda_media", label: t('classes.segundaMedia') },
    { value: "segunda_baja", label: t('classes.segundaBaja') },
    { value: "tercera_alta", label: t('classes.terceraAlta') },
    { value: "tercera_media", label: t('classes.terceraMedia') },
    { value: "tercera_baja", label: t('classes.terceraBaja') }
  ];

  const DAYS_OF_WEEK = [
    { value: "lunes", label: t('classes.monday') },
    { value: "martes", label: t('classes.tuesday') },
    { value: "miercoles", label: t('classes.wednesday') },
    { value: "jueves", label: t('classes.thursday') },
    { value: "viernes", label: t('classes.friday') },
    { value: "sabado", label: t('classes.saturday') },
    { value: "domingo", label: t('classes.sunday') }
  ];
  
  const {
    data: groups
  } = isAdmin ? useAdminClassGroups() : useClassGroups(trainerClubId); // Use admin hook for admins
  
  const {
    data: allTrainers
  } = isAdmin ? useAdminTrainers() : useTrainers(); // Use admin hook for admins
  
  // Get admin clubs for club selection
  const { data: adminClubs } = useAdminClubs();

  // Get the first available club for default value
  const defaultClubId = isAdmin
    ? (adminClubs?.[0]?.id || "")
    : (trainerClubId || clubId);

  // Filter trainers by club - for admins, adminTrainers already filtered
  const availableTrainers = isAdmin
    ? allTrainers // Admin trainers already filtered by admin's clubs
    : allTrainers?.filter(trainer =>
        trainer.trainer_clubs?.some(tc => tc.club_id === clubId)
      );
  const createMutation = useCreateProgrammedClass();
  const {
    toast
  } = useToast();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      club_id: defaultClubId,
      trainer_profile_id: trainerProfileId,
      duration_minutes: 60,
      max_participants: 4,
      recurrence_type: "weekly",
      selection_type: "individual",
      selected_students: [],
      level_format: "numeric",
      level_from: 1.0,
      level_to: 10.0,
      selected_days: initialData?.selected_days || [],
      monthly_price: 0,
      start_time: initialData?.start_time || "",
      start_date: initialData?.start_date || new Date(),
      end_date: initialData?.end_date || new Date(Date.now() + (90 * 24 * 60 * 60 * 1000))
    }
  });
  
  // Watch for club_id changes to filter students
  const selectedClubId = form.watch('club_id');
  
  const {
    data: students
  } = isAdmin ? useAdminStudentEnrollments(selectedClubId) : useStudentEnrollments(); // Use admin hook for admins with club filtering
  const watchedValues = form.watch();

  // Generate preview dates when recurrence settings change
  useEffect(() => {
    const dates = generatePreview();
    setPreviewDates(dates);

    // Check for conflicts (simplified - you might want more sophisticated conflict detection)
    const newConflicts = [];
    if (dates.length > 20) {
      newConflicts.push("Muchas clases programadas. Verifica la configuración.");
    }
    setConflicts(newConflicts);
  }, [watchedValues.selected_days, watchedValues.start_date, watchedValues.end_date, watchedValues.recurrence_type]);

  // Set default club when adminClubs loads
  useEffect(() => {
    if (isAdmin && adminClubs && adminClubs.length > 0 && !form.getValues().club_id) {
      form.setValue("club_id", adminClubs[0].id);
    }
  }, [adminClubs, isAdmin, form]);

  // Clear selected students when club changes (for admins only)
  useEffect(() => {
    if (isAdmin && selectedClubId) {
      form.setValue("selected_students", []);
    }
  }, [selectedClubId, isAdmin, form]);

  // Debug: Monitor step changes
  useEffect(() => {
    console.log("🔄 Step changed to:", currentStep);
    if (currentStep === 3) {
      console.log("🎯 Llegamos al paso 3!");
      console.log("📊 Form values at step 3:", form.getValues());
      console.log("🏀 Court number value:", form.getValues().court_number);
      console.log("💰 Price value:", form.getValues().monthly_price);
    }
  }, [currentStep]);
  const generatePreview = () => {
    const {
      selected_days,
      start_date,
      end_date,
      recurrence_type
    } = watchedValues;
    if (!selected_days?.length || !start_date || !end_date) return [];
    const dayMap: Record<string, number> = {
      'domingo': 0,
      'lunes': 1,
      'martes': 2,
      'miercoles': 3,
      'jueves': 4,
      'viernes': 5,
      'sabado': 6
    };
    const endDateObj = new Date(end_date);
    const dates: string[] = [];

    // Generate dates for each selected day
    selected_days.forEach(day => {
      const targetDay = dayMap[day];
      let currentDate = new Date(start_date);

      // Find first occurrence of target day
      while (currentDate.getDay() !== targetDay && currentDate <= endDateObj) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Generate dates based on recurrence
      const intervalDays = recurrence_type === 'weekly' ? 7 : recurrence_type === 'biweekly' ? 14 : 30;
      let dayCount = 0;
      while (currentDate <= endDateObj && dayCount < 10) {
        // Limit preview per day
        dates.push(`${format(currentDate, 'dd/MM/yyyy', {
          locale: getDateFnsLocale()
        })} (${day})`);
        currentDate.setDate(currentDate.getDate() + intervalDays);
        dayCount++;
      }
    });
    return dates.sort();
  };
  const onSubmit = async (data: FormData) => {
    console.log("🔥 onSubmit LLAMADO - Inicio de validación");
    console.log("📋 Current Step:", currentStep);
    console.log("📋 Form Data:", data);
    console.log("🏀 Court Number:", data.court_number);
    console.log("💰 Monthly Price:", data.monthly_price);

    // Validar que estamos en el paso 3
    if (currentStep !== 3) {
      console.log("❌ BLOQUEADO: No estamos en el paso 3");
      return;
    }

    // Validar que court_number esté presente
    if (!data.court_number || data.court_number === null) {
      console.log("❌ BLOQUEADO: court_number no está definido");
      toast({
        title: "Pista requerida",
        description: "Debes seleccionar una pista antes de crear las clases",
        variant: "destructive"
      });
      return;
    }

    console.log("✅ Validaciones pasadas, procediendo a crear clases...");

    try {
      const submitData = {
        name: data.name,
        level_from: data.level_format === "numeric" ? data.level_from : undefined,
        level_to: data.level_format === "numeric" ? data.level_to : undefined,
        custom_level: data.level_format === "levante" ? data.custom_level : undefined,
        duration_minutes: data.duration_minutes,
        start_time: data.start_time,
        days_of_week: data.selected_days,
        start_date: format(data.start_date, 'yyyy-MM-dd'),
        end_date: format(data.end_date, 'yyyy-MM-dd'),
        recurrence_type: data.recurrence_type,
        // Use assigned trainer if admin selected one, otherwise use current trainer
        trainer_profile_id: (isAdmin && data.assigned_trainer_id && data.assigned_trainer_id !== "unassigned") ? data.assigned_trainer_id : data.trainer_profile_id,
        club_id: data.club_id,
        court_number: data.court_number,
        // Only include the appropriate field based on selection type
        group_id: data.selection_type === "group" ? data.group_id : undefined,
        selected_students: data.selection_type === "individual" ? data.selected_students : [],
        monthly_price: data.monthly_price
      };

      console.log("📤 Enviando datos:", submitData);
      await createMutation.mutateAsync(submitData);

      toast({
        title: "¡Clases creadas!",
        description: `Se han creado ${previewDates.length} clases programadas exitosamente`,
      });

      onClose();
    } catch (error) {
      console.error("❌ Error creating programmed class:", error);
      toast({
        title: "Error al crear clases",
        description: "Ocurrió un error al crear las clases. Por favor intenta nuevamente.",
        variant: "destructive"
      });
    }
  };
  const nextStep = () => {
    console.log("➡️ nextStep llamado, currentStep:", currentStep);

    // Validate club selection before moving to step 2
    if (currentStep === 1 && isAdmin) {
      const currentClubId = form.getValues().club_id;
      if (!currentClubId) {
        toast({
          title: "Club requerido",
          description: "Debes seleccionar un club antes de continuar",
          variant: "destructive"
        });
        return;
      }
    }

    if (currentStep < 3) {
      const nextStepNumber = currentStep + 1;
      console.log("✅ Avanzando al paso:", nextStepNumber);
      setCurrentStep(nextStepNumber);
    }
  };
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  const handleStudentSelection = (studentId: string, checked: boolean) => {
    const currentStudents = form.getValues().selected_students;
    if (checked) {
      form.setValue("selected_students", [...currentStudents, studentId]);
    } else {
      form.setValue("selected_students", currentStudents.filter(id => id !== studentId));
    }
  };
  const handleDaySelection = (day: string, checked: boolean) => {
    const currentDays = form.getValues().selected_days;
    if (checked) {
      form.setValue("selected_days", [...currentDays, day]);
    } else {
      form.setValue("selected_days", currentDays.filter(d => d !== day));
    }
  };
  // Render preview if provided
  const previewPanel = renderPreview?.({
    formData: watchedValues,
    previewDates,
    conflicts,
    students: students || [],
    groups: groups || [],
    clubs: adminClubs || [],
    currentStep
  });

  const formContent = (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          {/* Step indicator */}
          <div className="flex items-center gap-1">
            {[1, 2, 3].map(step => <div key={step} className="flex items-center">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium", step === currentStep ? "bg-primary text-primary-foreground" : step < currentStep ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                  {step}
                </div>
                {step < 3 && <div className="w-8 h-px bg-border mx-2" />}
              </div>)}
          </div>

          <div className="text-lg font-semibold">
            {currentStep === 1 && t('classes.basicInfoAndRecurrence')}
            {currentStep === 2 && t('classes.groupAndStudents')}
            {currentStep === 3 && t('classes.finalConfiguration')}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={(e) => {
            console.log("🚨 Form onSubmit disparado!");
            console.log("📍 Current step en form handler:", currentStep);
            console.log("🔍 Event:", e);
            console.log("📦 Event target:", e.target);
            console.log("🎯 Event nativeEvent:", e.nativeEvent);

            e.preventDefault();
            e.stopPropagation();

            // Only submit if we're on step 3
            if (currentStep === 3) {
              console.log("✅ Estamos en paso 3, ejecutando handleSubmit");
              form.handleSubmit(onSubmit, (errors) => {
                // Show toast with validation errors
                const errorFields = Object.keys(errors);
                const fieldNames: Record<string, string> = {
                  name: "Nombre de la clase",
                  start_time: "Hora de inicio",
                  selected_days: "Días de la semana",
                  start_date: "Fecha de inicio",
                  end_date: "Fecha de fin",
                  club_id: "Club",
                  court_number: "Pista"
                };

                const missingFieldNames = errorFields.map(field => fieldNames[field] || field);

                toast({
                  title: "Faltan campos requeridos",
                  description: `Por favor completa: ${missingFieldNames.join(", ")}`,
                  variant: "destructive"
                });
              })(e);
            } else {
              console.log("❌ NO estamos en paso 3, bloqueando submit");
            }
          }} className="space-y-6">
            
            {/* Step 1: Basic Info and Recurrence */}
            {currentStep === 1 && <div className="space-y-6">
                {/* Single row layout for all basic info fields */}
                <div className="space-y-4">
                  {/* Numeric level format: all fields in one row */}
                  {watchedValues.level_format === "numeric" && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-4">
                        <FormField control={form.control} name="name" render={({
                          field
                        }) => <FormItem>
                              <FormLabel>{t('classes.className')}</FormLabel>
                              <FormControl>
                                <Input placeholder={t('classes.classNamePlaceholder')} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>} />
                      </div>

                      <div className="md:col-span-4">
                        <FormField control={form.control} name="level_format" render={({
                          field
                        }) => <FormItem>
                              <FormLabel>{t('classes.levelFormat')}</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="numeric">{t('classes.numeric')}</SelectItem>
                                  <SelectItem value="levante">{t('classes.levelCategories')}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>} />
                      </div>

                      <div className="md:col-span-4">
                        <div className="space-y-2">
                          <FormLabel>Nivel</FormLabel>
                          <div className="flex gap-2 items-center">
                            <FormField control={form.control} name="level_from" render={({
                              field
                            }) => <FormItem className="flex-1">
                                  <FormControl>
                                    <Input placeholder="Desde" className="w-full text-center" type="number" min="1.0" max="10.0" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>} />
                            <span className="text-muted-foreground">-</span>
                            <FormField control={form.control} name="level_to" render={({
                              field
                            }) => <FormItem className="flex-1">
                                  <FormControl>
                                    <Input placeholder="Hasta" className="w-full text-center" type="number" min="1.0" max="10.0" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Levante level format: name, format, and category in one row */}
                  {watchedValues.level_format === "levante" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={form.control} name="name" render={({
                        field
                      }) => <FormItem>
                            <FormLabel>{t('classes.className')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('classes.classNamePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />

                      <FormField control={form.control} name="level_format" render={({
                        field
                      }) => <FormItem>
                            <FormLabel>{t('classes.levelFormat')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="numeric">{t('classes.numeric')}</SelectItem>
                                <SelectItem value="levante">{t('classes.levelCategories')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>} />

                      <FormField control={form.control} name="custom_level" render={({
                        field
                      }) => <FormItem>
                            <FormLabel>{t('classes.categoryLevel')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('classes.selectLevel')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {LEVANTE_LEVELS.map(level => <SelectItem key={level.value} value={level.value}>
                                    {level.label}
                                  </SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>} />
                    </div>
                  )}

                  {watchedValues.level_format === "numeric" && <p className="text-sm text-muted-foreground">
                      
                    </p>}
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField control={form.control} name="start_time" render={({
                field
              }) => <FormItem>
                        <FormLabel>{t('classes.startTime')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar hora" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, hour) => {
                              const hourStr = hour.toString().padStart(2, '0');
                              return [
                                <SelectItem key={`${hourStr}:00`} value={`${hourStr}:00`}>
                                  {`${hourStr}:00`}
                                </SelectItem>,
                                <SelectItem key={`${hourStr}:30`} value={`${hourStr}:30`}>
                                  {`${hourStr}:30`}
                                </SelectItem>
                              ];
                            }).flat()}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="duration_minutes" render={({
                field
              }) => <FormItem>
                        <FormLabel>{t('classes.duration')} ({t('classes.minutes')})</FormLabel>
                        <FormControl>
                          <Input type="number" min="30" max="180" step="15" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="max_participants" render={({
                field
              }) => <FormItem>
                        <FormLabel>Número de jugadores</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="12" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                </div>

                <Separator />

                {/* Modified Days Selection */}
                <FormField control={form.control} name="selected_days" render={() => <FormItem>
                      <FormLabel>{t('classes.daysOfWeek')}</FormLabel>
                      <div className="flex justify-between gap-3">
                        {DAYS_OF_WEEK.map(day => <div key={day.value} className="flex items-center space-x-2">
                            <Checkbox id={`day-${day.value}`} checked={watchedValues.selected_days?.includes(day.value)} onCheckedChange={checked => handleDaySelection(day.value, checked as boolean)} />
                            <label htmlFor={`day-${day.value}`} className="text-sm font-medium cursor-pointer whitespace-nowrap">
                              {day.label}
                            </label>
                          </div>)}
                      </div>
                      <FormMessage />
                    </FormItem>} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="start_date" render={({
                  field
                }) => <FormItem>
                      <FormLabel>{t('classes.startDate')}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                              <Calendar className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "dd/MM/yyyy", {
                        locale: getDateFnsLocale()
                      }) : t('common.selectDate')}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent mode="single" selected={field.value} onSelect={field.onChange} disabled={date => date < new Date()} initialFocus className="pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>} />

                  <FormField control={form.control} name="end_date" render={({
                  field
                }) => <FormItem>
                      <FormLabel>{t('classes.endDate')}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                              <Calendar className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "dd/MM/yyyy", {
                        locale: getDateFnsLocale()
                      }) : t('common.selectDate')}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent mode="single" selected={field.value} onSelect={field.onChange} disabled={date => date < (watchedValues.start_date || new Date())} initialFocus className="pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>} />

                  <FormField control={form.control} name="recurrence_type" render={({
                  field
                }) => <FormItem>
                      <FormLabel>{t('classes.recurrence')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('classes.selectLevel')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">{t('classes.weekly')}</SelectItem>
                          <SelectItem value="biweekly">{t('classes.biweekly')}</SelectItem>
                          <SelectItem value="monthly">{t('classes.monthly')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>} />
                </div>

                {/* Admin-only club and trainer assignment */}
                {isAdmin && <div className="border-t pt-6 space-y-6">
                    {/* <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Configuración Avanzada (Admin)
                    </h4> */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Club assignment */}
                      <FormField control={form.control} name="club_id" render={({
                        field
                      }) => <FormItem>
                            <FormLabel>Asignar a Club</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar club" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {adminClubs && adminClubs.length > 0 ? (
                                  adminClubs.map(club => (
                                      <SelectItem key={club.id} value={club.id}>
                                        {club.name}
                                      </SelectItem>
                                    ))
                                ) : (
                                  <div className="p-2 text-sm text-muted-foreground">
                                    No tienes clubes creados
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                            <p className="text-sm text-muted-foreground mt-1">
                              Selecciona en qué club se creará esta clase programada.
                            </p>
                          </FormItem>} />

                      {/* Trainer assignment */}
                      <FormField control={form.control} name="assigned_trainer_id" render={({
                        field
                      }) => <FormItem>
                            <FormLabel>Asignar clase a otro profesor (Opcional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar profesor (opcional)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="unassigned">Sin asignar (permanece como mi clase)</SelectItem>
                                {availableTrainers && availableTrainers.length > 0 ? (
                                  availableTrainers
                                    .filter(trainer => trainer.profile_id !== trainerProfileId) // Exclude current trainer
                                    .map(trainer => (
                                      <SelectItem key={trainer.profile_id} value={trainer.profile_id}>
                                        {trainer.profiles?.full_name} {trainer.specialty && `(${trainer.specialty})`}
                                      </SelectItem>
                                    ))
                                ) : (
                                  <div className="p-2 text-sm text-muted-foreground">
                                    No hay otros profesores disponibles
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                            <p className="text-sm text-muted-foreground mt-1">
                                Selecciona a un profesor de tu club
                            </p>
                          </FormItem>} />
                    </div>
                  </div>}
              </div>}

            {/* Step 2: Group and Students */}
            {currentStep === 2 && <div className="space-y-6">
                {/* Selection Type */}
                <FormField control={form.control} name="selection_type" render={({
              field
            }) => <FormItem>
                      <FormLabel>{t('classes.groupSelection')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="individual">{t('classes.individualStudents')}</SelectItem>
                          <SelectItem value="group">{t('classes.existingGroup')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>} />

                {/* Group Selection - Only when selection_type is "group" */}
                {watchedValues.selection_type === "group" && <FormField control={form.control} name="group_id" render={({
              field
            }) => <FormItem>
                      <FormLabel>Seleccionar grupo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un grupo existente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {groups && groups.length > 0 ? groups.map(group => <SelectItem key={group.id} value={group.id}>
                              {group.name} - {group.level} ({group.members.length} miembros)
                            </SelectItem>) : <div className="p-2 text-sm text-muted-foreground">
                              No hay grupos disponibles
                            </div>}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>} />}

                {/* Student Selection - Only when selection_type is "individual" */}
                {watchedValues.selection_type === "individual" && <div className="space-y-4">
                  <FormLabel>Seleccionar alumnos</FormLabel>
                  
                  {/* Show message if admin hasn't selected a club yet */}
                  {isAdmin && !selectedClubId && (
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <div className="text-center py-4 text-muted-foreground">
                        Primero selecciona un club en el paso anterior para ver los alumnos disponibles
                      </div>
                    </div>
                  )}
                  
                  {/* Show students when club is selected or for non-admin users */}
                  {(!isAdmin || selectedClubId) && (
                    <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                      {students && students.length > 0 ? <div className="space-y-3">
                          {students.map(student => <div key={student.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded">
                              <Checkbox id={`student-${student.id}`} checked={watchedValues.selected_students.includes(student.id)} onCheckedChange={checked => handleStudentSelection(student.id, checked as boolean)} />
                              <div className="flex-1">
                                <label htmlFor={`student-${student.id}`} className="text-sm font-medium cursor-pointer">
                                  {student.full_name}
                                </label>
                                <div className="text-xs text-muted-foreground">
                                  Nivel {student.level} • {student.email}
                                </div>
                              </div>
                            </div>)}
                        </div> : <div className="text-center py-4 text-muted-foreground">
                          {isAdmin ? "No hay alumnos en este club" : "No hay alumnos disponibles"}
                        </div>}
                    </div>
                  )}
                  
                  {watchedValues.selected_students.length > 0 && <div className="text-sm text-muted-foreground">
                      {watchedValues.selected_students.length} alumno(s) seleccionado(s)
                    </div>}
                </div>}

                {/* Show group preview when group is selected */}
                {watchedValues.selection_type === "group" && watchedValues.group_id && groups && <div className="bg-muted p-4 rounded-lg">
                    {(() => {
                  const selectedGroup = groups.find(g => g.id === watchedValues.group_id);
                  return selectedGroup ? <div>
                        <h4 className="font-medium mb-2">Grupo seleccionado: {selectedGroup.name}</h4>
                        <div className="text-sm space-y-1">
                          <div>• Nivel: {selectedGroup.level}</div>
                          <div>• {selectedGroup.members.length} miembros</div>
                          <div className="mt-2">
                            <strong>Miembros:</strong>
                            <div className="grid grid-cols-2 gap-1 mt-1">
                              {selectedGroup.members.map(member => <div key={member.id} className="text-xs">
                                  • {member.student_enrollment.full_name}
                                </div>)}
                            </div>
                          </div>
                        </div>
                      </div> : null;
                })()}
                  </div>}
              </div>}

            {/* Step 3: Final Configuration */}
            {currentStep === 3 && <div className="space-y-8">
                {/* Court and Price - In same row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Court Number */}
                  <FormField control={form.control} name="court_number" render={({
                    field
                  }) => {
                    // Get available courts from selected club
                    const selectedClub = adminClubs?.find(c => c.id === selectedClubId);
                    const availableCourts = selectedClub?.court_count || 7;
                    const courtOptions = Array.from({ length: availableCourts }, (_, i) => i + 1);

                    return (
                      <Card className="border-primary/20">
                        <CardContent className="pt-6">
                          <FormItem>
                            <div className="flex items-center gap-2 mb-3">
                              <MapPin className="h-5 w-5 text-primary" />
                              <FormLabel className="text-base font-semibold">
                                Seleccionar Pista <span className="text-red-500">*</span>
                              </FormLabel>
                            </div>
                            <Select onValueChange={value => field.onChange(parseInt(value))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="¿En qué pista?" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-background border shadow-md z-50">
                                {courtOptions.map(court => (
                                  <SelectItem key={court} value={court.toString()}>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      Pista {court}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-2">
                              Disponibles: {availableCourts}
                            </p>
                            <FormMessage />
                          </FormItem>
                        </CardContent>
                      </Card>
                    );
                  }} />

                  {/* Price */}
                  <FormField control={form.control} name="monthly_price" render={({
                    field
                  }) => (
                    <Card className="border-primary/20">
                      <CardContent className="pt-6">
                        <FormItem>
                          <div className="flex items-center gap-2 mb-3">
                            <Euro className="h-5 w-5 text-primary" />
                            <FormLabel className="text-base font-semibold">
                              Precio Mensual
                            </FormLabel>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="h-12 text-lg pr-12"
                                value={field.value ?? 0}
                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                €/mes
                              </div>
                            </div>
                          </FormControl>
                          <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">ℹ</span>
                            {field.value === 0 || !field.value ? "Clase gratuita" : "Precio mensual"}
                          </p>
                          <FormMessage />
                        </FormItem>
                      </CardContent>
                    </Card>
                  )} />
                </div>

                {/* Objective - Secondary */}
                <FormField control={form.control} name="objective" render={({
                  field
                }) => (
                  <Card>
                    <CardContent className="pt-6">
                      <FormItem>
                        <div className="flex items-center gap-2 mb-3">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <FormLabel className="text-sm font-medium text-muted-foreground">
                            Objetivo de la Clase <span className="text-xs">(opcional)</span>
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder="Ej: Mejorar el saque, trabajar la volea, practicar el revés..."
                            className="min-h-[100px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-2">
                          Describe brevemente qué trabajarás en estas clases
                        </p>
                        <FormMessage />
                      </FormItem>
                    </CardContent>
                  </Card>
                )} />
              </div>}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-0">
              <Button type="button" variant="outline" onClick={currentStep === 1 ? onClose : prevStep}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentStep === 1 ? t('common.cancel') : t('classes.previous')}
              </Button>

              {currentStep < 3 ? <Button type="button" onClick={nextStep}>
                  {t('classes.next')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button> : <Button
                  type="button"
                  disabled={createMutation.isPending}
                  onClick={(e) => {
                    console.log("🖱️ Submit button clicked manually");
                    e.preventDefault();
                    form.handleSubmit(onSubmit)();
                  }}
                >
                  {createMutation.isPending ? t('common.loading') : t('classes.createClasses')}
                </Button>}
            </div>
          </form>
        </Form>
      </CardContent>
    </>
  );

  // If showPreview is true, return split layout, otherwise return wrapped in Card
  if (showPreview && renderPreview) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="w-full">
            {formContent}
          </Card>
        </div>
        <div className="lg:col-span-1">
          {previewPanel}
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      {formContent}
    </Card>
  );
}