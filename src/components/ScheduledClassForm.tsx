import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar, Clock, Users, Target, ArrowLeft, ArrowRight, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
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
import { useClassGroups } from "@/hooks/useClassGroups";
import { useStudentEnrollments } from "@/hooks/useStudentEnrollments";
import { useMyTrainerProfile } from "@/hooks/useTrainers";
import { useToast } from "@/hooks/use-toast";
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
  court_number: z.number().min(1).max(7, "Select a court from 1 to 7")
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
}
export default function ScheduledClassForm({
  onClose,
  clubId,
  trainerProfileId
}: ScheduledClassFormProps) {
  const { t } = useTranslation();
  const { getDateFnsLocale } = useLanguage();
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
  } = useClassGroups(trainerClubId); // Use trainer's club instead of passed clubId
  const {
    data: students
  } = useStudentEnrollments();
  const createMutation = useCreateProgrammedClass();
  const {
    toast
  } = useToast();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      club_id: clubId,
      trainer_profile_id: trainerProfileId,
      duration_minutes: 60,
      recurrence_type: "weekly",
      selection_type: "individual",
      selected_students: [],
      level_format: "numeric",
      level_from: 1.0,
      level_to: 10.0,
      selected_days: []
    }
  });
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
        trainer_profile_id: data.trainer_profile_id,
        club_id: data.club_id,
        court_number: data.court_number,
        // Only include the appropriate field based on selection type
        group_id: data.selection_type === "group" ? data.group_id : undefined,
        selected_students: data.selection_type === "individual" ? data.selected_students : []
      };
      await createMutation.mutateAsync(submitData);
      onClose();
    } catch (error) {
      console.error("Error creating programmed class:", error);
    }
  };
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
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
  return <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t('classes.createScheduledClasses')}
        </CardTitle>
        
        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3].map(step => <div key={step} className="flex items-center">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium", step === currentStep ? "bg-primary text-primary-foreground" : step < currentStep ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                {step}
              </div>
              {step < 3 && <div className="w-8 h-px bg-border mx-2" />}
            </div>)}
        </div>
        
        <div className="text-sm text-muted-foreground mt-2">
          {currentStep === 1 && t('classes.basicInfoAndRecurrence')}
          {currentStep === 2 && t('classes.groupAndStudents')}
          {currentStep === 3 && t('classes.finalConfiguration')}
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Step 1: Basic Info and Recurrence */}
            {currentStep === 1 && <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="name" render={({
                field
              }) => <FormItem>
                        <FormLabel>{t('classes.className')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('classes.classNamePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  {/* Modified Level Selection */}
                  <div className="space-y-4">
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

                    {watchedValues.level_format === "numeric" && <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="level_from" render={({
                    field
                  }) => <FormItem>
                              <FormLabel>{t('classes.levelFrom')}</FormLabel>
                              <FormControl>
                                <Input type="number" min="1.0" max="10.0" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>} />
                        <FormField control={form.control} name="level_to" render={({
                    field
                  }) => <FormItem>
                              <FormLabel>{t('classes.levelTo')}</FormLabel>
                              <FormControl>
                                <Input type="number" min="1.0" max="10.0" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>} />
                      </div>}

                    {watchedValues.level_format === "levante" && <FormField control={form.control} name="custom_level" render={({
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
                          </FormItem>} />}

                    {watchedValues.level_format === "numeric" && <p className="text-sm text-muted-foreground">
                        {t('classes.selectLevelRange')}
                      </p>}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="start_time" render={({
                field
              }) => <FormItem>
                        <FormLabel>{t('classes.startTime')}</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
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
                </div>

                <Separator />

                {/* Modified Days Selection */}
                <FormField control={form.control} name="selected_days" render={() => <FormItem>
                      <FormLabel>{t('classes.daysOfWeek')}</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {DAYS_OF_WEEK.map(day => <div key={day.value} className="flex items-center space-x-2">
                            <Checkbox id={`day-${day.value}`} checked={watchedValues.selected_days?.includes(day.value)} onCheckedChange={checked => handleDaySelection(day.value, checked as boolean)} />
                            <label htmlFor={`day-${day.value}`} className="text-sm font-medium cursor-pointer">
                              {day.label}
                            </label>
                          </div>)}
                      </div>
                      <FormMessage />
                    </FormItem>} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
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
                  </div>

                  <div className="space-y-4">
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

                    {previewDates.length > 0 && <div className="space-y-2">
                        <FormLabel>{t('classes.previewDates')} ({previewDates.length} {t('classes.totalClasses')})</FormLabel>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {previewDates.slice(0, 10).map((date, index) => <Badge key={index} variant="outline" className="text-xs">
                              {date}
                            </Badge>)}
                          {previewDates.length > 10 && <Badge variant="secondary" className="text-xs">
                              +{previewDates.length - 10} más...
                            </Badge>}
                        </div>
                      </div>}

                    {conflicts.length > 0 && <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {conflicts.map((conflict, index) => <div key={index}>{conflict}</div>)}
                        </AlertDescription>
                      </Alert>}
                  </div>
                </div>
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
                        No hay alumnos disponibles
                      </div>}
                  </div>
                  
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
            {currentStep === 3 && <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <FormField control={form.control} name="court_number" render={({
                field
              }) => <FormItem>
                        <FormLabel>{t('classes.court')}</FormLabel>
                        <Select onValueChange={value => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('classes.selectCourt')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border shadow-md z-50">
                            {[1, 2, 3, 4, 5, 6, 7].map(court => <SelectItem key={court} value={court.toString()}>
                                {t('classes.court')} {court}
                              </SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="objective" render={({
                field
              }) => <FormItem>
                        <FormLabel>Objetivo de la clase (opcional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe los objetivos de esta clase..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                </div>

                {/* Summary */}
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Resumen de clases a crear:</h4>
                  <div className="text-sm space-y-1">
                    <div>• {previewDates.length} clases programadas</div>
                    <div>• Desde {watchedValues.start_date ? format(watchedValues.start_date, "dd/MM/yyyy", {
                    locale: es
                  }) : "N/A"}</div>
                    <div>• Hasta {watchedValues.end_date ? format(watchedValues.end_date, "dd/MM/yyyy", {
                    locale: es
                  }) : "N/A"}</div>
                    {watchedValues.selection_type === "individual" && <div>• {watchedValues.selected_students.length} alumnos pre-inscritos</div>}
                    {watchedValues.selection_type === "group" && watchedValues.group_id && (() => {
                      const selectedGroup = groups?.find(g => g.id === watchedValues.group_id);
                      return selectedGroup ? <div>• Grupo: {selectedGroup.name} ({selectedGroup.members.length} miembros)</div> : null;
                    })()}
                     <div>• Días: {watchedValues.selected_days?.join(", ") || "Ninguno"}</div>
                     <div>• Pista: {watchedValues.court_number ? `Pista ${watchedValues.court_number}` : "No seleccionada"}</div>
                  </div>
                </div>
              </div>}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={currentStep === 1 ? onClose : prevStep}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentStep === 1 ? t('common.cancel') : t('classes.previous')}
              </Button>

              {currentStep < 3 ? <Button type="button" onClick={nextStep}>
                  {t('classes.next')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button> : <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? t('common.loading') : t('classes.createClasses')}
                </Button>}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>;
}