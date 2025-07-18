import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar, Clock, Users, Target, ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react";
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
import { cn } from "@/lib/utils";

import { useCreateClassTemplate } from "@/hooks/useClassTemplates";
import { useClassGroups } from "@/hooks/useClassGroups";
import { useStudentEnrollments } from "@/hooks/useStudentEnrollments";
import { useCreateClassSchedule } from "@/hooks/useScheduledClasses";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

const formSchema = z.object({
  // Step 1: Basic Info
  name: z.string().min(1, "El nombre es obligatorio"),
  level: z.enum(["iniciacion", "intermedio", "avanzado"]),
  start_time: z.string().min(1, "La hora de inicio es obligatoria"),
  duration_minutes: z.number().min(30).max(180),
  
  // Recurrence
  day_of_week: z.enum(["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]),
  start_date: z.date({ required_error: "La fecha de inicio es obligatoria" }),
  end_date: z.date({ required_error: "La fecha de fin es obligatoria" }),
  recurrence_type: z.enum(["weekly", "biweekly", "monthly"]),
  recurrence_interval: z.number().min(1).default(1),
  
  // Step 2: Group and Students
  group_id: z.string().optional(),
  selected_students: z.array(z.string()).default([]),
  
  // Step 3: Configuration
  trainer_profile_id: z.string().min(1, "El profesor es obligatorio"),
  club_id: z.string().min(1, "El club es obligatorio"),
  max_students: z.number().min(1).max(12),
  court_number: z.number().optional(),
  objective: z.string().optional(),
  price_per_student: z.number().min(0).default(0),
});

type FormData = z.infer<typeof formSchema>;

interface ScheduledClassFormProps {
  onClose: () => void;
  clubId: string;
  trainerProfileId: string;
}

export default function ScheduledClassForm({ onClose, clubId, trainerProfileId }: ScheduledClassFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [previewDates, setPreviewDates] = useState<string[]>([]);
  const [conflicts, setConflicts] = useState<string[]>([]);

  const { data: groups } = useClassGroups(clubId);
  const { data: students } = useStudentEnrollments();
  const createTemplateMutation = useCreateClassTemplate();
  const createScheduleMutation = useCreateClassSchedule();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      club_id: clubId,
      trainer_profile_id: trainerProfileId,
      duration_minutes: 60,
      max_students: 8,
      recurrence_type: "weekly",
      recurrence_interval: 1,
      price_per_student: 0,
      selected_students: [],
    },
  });

  const watchedValues = form.watch();

  // Generate preview dates when recurrence settings change
  useEffect(() => {
    const dates = generatePreview();
    setPreviewDates(dates);
    
    // Check for conflicts (simplified - you might want more sophisticated conflict detection)
    const newConflicts = [];
    if (watchedValues.court_number && dates.length > 10) {
      newConflicts.push("Muchas clases programadas. Verifica disponibilidad de pista.");
    }
    setConflicts(newConflicts);
  }, [watchedValues.day_of_week, watchedValues.start_date, watchedValues.end_date, watchedValues.recurrence_type, watchedValues.recurrence_interval, watchedValues.court_number]);

  const generatePreview = () => {
    const { day_of_week, start_date, end_date, recurrence_type, recurrence_interval } = watchedValues;
    
    if (!day_of_week || !start_date || !end_date) return [];

    const dayMap: Record<string, number> = {
      'domingo': 0, 'lunes': 1, 'martes': 2, 'miercoles': 3,
      'jueves': 4, 'viernes': 5, 'sabado': 6
    };

    const targetDay = dayMap[day_of_week];
    let currentDate = new Date(start_date);
    const endDateObj = new Date(end_date);
    const dates: string[] = [];

    // Find first occurrence of target day
    while (currentDate.getDay() !== targetDay && currentDate <= endDateObj) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate dates based on recurrence
    const intervalDays = recurrence_type === 'weekly' ? 7 :
                        recurrence_type === 'biweekly' ? 14 : 30;

    while (currentDate <= endDateObj && dates.length < 20) { // Limit preview to 20 dates
      dates.push(format(currentDate, 'dd/MM/yyyy', { locale: es }));
      currentDate.setDate(currentDate.getDate() + intervalDays * (recurrence_interval || 1));
    }

    return dates;
  };

  const onSubmit = async (data: FormData) => {
    try {
      // First, create the class template
      const templateData = {
        name: data.name,
        level: data.level,
        trainer_profile_id: data.trainer_profile_id,
        club_id: data.club_id,
        duration_minutes: data.duration_minutes,
        max_students: data.max_students,
        price_per_student: data.price_per_student,
        court_number: data.court_number,
        objective: data.objective,
        group_id: data.group_id,
        created_by_profile_id: data.trainer_profile_id,
      };

      const template = await createTemplateMutation.mutateAsync(templateData);

      // Then create the schedule using the new template
      const scheduleData = {
        template_id: template.id,
        day_of_week: data.day_of_week,
        start_time: data.start_time,
        start_date: format(data.start_date, 'yyyy-MM-dd'),
        end_date: format(data.end_date, 'yyyy-MM-dd'),
        recurrence_type: data.recurrence_type,
        recurrence_interval: data.recurrence_interval,
      };

      await createScheduleMutation.mutateAsync(scheduleData);
      
      toast({
        title: "Clases programadas",
        description: "Se han creado las clases y la plantilla correctamente.",
      });
      
      onClose();
    } catch (error) {
      console.error("Error creating schedule:", error);
      toast({
        title: "Error",
        description: "No se pudieron crear las clases programadas.",
        variant: "destructive",
      });
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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Crear Clases Programadas
        </CardTitle>
        
        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                step === currentStep ? "bg-primary text-primary-foreground" :
                step < currentStep ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {step}
              </div>
              {step < 3 && <div className="w-8 h-px bg-border mx-2" />}
            </div>
          ))}
        </div>
        
        <div className="text-sm text-muted-foreground mt-2">
          {currentStep === 1 && "Información básica y recurrencia"}
          {currentStep === 2 && "Grupo y alumnos"}
          {currentStep === 3 && "Configuración final"}
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Step 1: Basic Info and Recurrence */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la clase</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Pádel Intermedio" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nivel</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un nivel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="iniciacion">Iniciación</SelectItem>
                            <SelectItem value="intermedio">Intermedio</SelectItem>
                            <SelectItem value="avanzado">Avanzado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="day_of_week"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Día de la semana</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona día" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lunes">Lunes</SelectItem>
                            <SelectItem value="martes">Martes</SelectItem>
                            <SelectItem value="miercoles">Miércoles</SelectItem>
                            <SelectItem value="jueves">Jueves</SelectItem>
                            <SelectItem value="viernes">Viernes</SelectItem>
                            <SelectItem value="sabado">Sábado</SelectItem>
                            <SelectItem value="domingo">Domingo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de inicio</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración (minutos)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="30" 
                            max="180" 
                            step="15"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de inicio</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {field.value ? format(field.value, "dd/MM/yyyy", { locale: es }) : "Selecciona fecha"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de fin</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {field.value ? format(field.value, "dd/MM/yyyy", { locale: es }) : "Selecciona fecha"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < (watchedValues.start_date || new Date())}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="recurrence_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de recurrencia</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weekly">Semanal</SelectItem>
                              <SelectItem value="biweekly">Quincenal</SelectItem>
                              <SelectItem value="monthly">Mensual</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {previewDates.length > 0 && (
                      <div className="space-y-2">
                        <FormLabel>Vista previa ({previewDates.length} clases)</FormLabel>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {previewDates.slice(0, 10).map((date, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {date}
                            </Badge>
                          ))}
                          {previewDates.length > 10 && (
                            <Badge variant="secondary" className="text-xs">
                              +{previewDates.length - 10} más...
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {conflicts.length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {conflicts.map((conflict, index) => (
                            <div key={index}>{conflict}</div>
                          ))}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Group and Students */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="group_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grupo (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un grupo existente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {groups?.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name} - {group.level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Enhanced student selection */}
                <div className="space-y-4">
                  <FormLabel>Seleccionar alumnos</FormLabel>
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                    {students && students.length > 0 ? (
                      <div className="space-y-3">
                        {students.map((student) => (
                          <div key={student.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded">
                            <Checkbox
                              id={`student-${student.id}`}
                              checked={watchedValues.selected_students.includes(student.id)}
                              onCheckedChange={(checked) => 
                                handleStudentSelection(student.id, checked as boolean)
                              }
                            />
                            <div className="flex-1">
                              <label 
                                htmlFor={`student-${student.id}`} 
                                className="text-sm font-medium cursor-pointer"
                              >
                                {student.full_name}
                              </label>
                              <div className="text-xs text-muted-foreground">
                                Nivel {student.level} • {student.email}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No hay alumnos disponibles
                      </div>
                    )}
                  </div>
                  
                  {watchedValues.selected_students.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {watchedValues.selected_students.length} alumno(s) seleccionado(s)
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Final Configuration */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="max_students"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número máximo de alumnos</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="12"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="court_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de pista (opcional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="price_per_student"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio por alumno (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="objective"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objetivo de la clase (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe los objetivos de esta clase..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Summary */}
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Resumen de clases a crear:</h4>
                  <div className="text-sm space-y-1">
                    <div>• {previewDates.length} clases programadas</div>
                    <div>• Desde {watchedValues.start_date ? format(watchedValues.start_date, "dd/MM/yyyy", { locale: es }) : "N/A"}</div>
                    <div>• Hasta {watchedValues.end_date ? format(watchedValues.end_date, "dd/MM/yyyy", { locale: es }) : "N/A"}</div>
                    <div>• {watchedValues.selected_students.length} alumnos pre-inscritos</div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={currentStep === 1 ? onClose : prevStep}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentStep === 1 ? "Cancelar" : "Anterior"}
              </Button>

              {currentStep < 3 ? (
                <Button type="button" onClick={nextStep}>
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={createTemplateMutation.isPending || createScheduleMutation.isPending}
                >
                  {(createTemplateMutation.isPending || createScheduleMutation.isPending) ? "Creando..." : "Crear Clases"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
