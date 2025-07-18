
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarDays, Clock, Users, Target, GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useCreateClassTemplate } from "@/hooks/useClassTemplates";
import { useCreateClassSchedule } from "@/hooks/useScheduledClasses";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  name: z.string().min(1, "Introduce el nombre de la clase"),
  level: z.enum(["iniciacion", "intermedio", "avanzado"]),
  duration_minutes: z.number().min(30, "Duración mínima 30 minutos"),
  max_students: z.number().min(1, "Mínimo 1 estudiante").max(12, "Máximo 12 estudiantes"),
  price_per_student: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  court_number: z.number().min(1, "Selecciona una pista").optional(),
  objective: z.string().optional(),
  day_of_week: z.enum(["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]),
  start_time: z.string().min(1, "Selecciona la hora de inicio"),
  start_date: z.string().min(1, "Selecciona la fecha de inicio"),
  end_date: z.string().min(1, "Selecciona la fecha de fin"),
  recurrence_type: z.enum(["weekly", "biweekly", "monthly"]),
  recurrence_interval: z.number().min(1, "Intervalo mínimo 1"),
});

type FormData = z.infer<typeof formSchema>;

interface ScheduledClassFormProps {
  onClose: () => void;
  clubId: string;
  trainerProfileId: string;
}

export default function ScheduledClassForm({ onClose, clubId, trainerProfileId }: ScheduledClassFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile } = useAuth();
  
  const createTemplateMutation = useCreateClassTemplate();
  const createScheduleMutation = useCreateClassSchedule();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      level: "iniciacion",
      duration_minutes: 60,
      max_students: 8,
      price_per_student: 15,
      court_number: 1,
      objective: "",
      day_of_week: "lunes",
      start_time: "",
      start_date: "",
      end_date: "",
      recurrence_type: "weekly",
      recurrence_interval: 1,
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!profile?.id) {
      console.error("No user profile found");
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("Creating class template with data:", data);
      
      // Primero crear la plantilla de clase
      const templateData = {
        name: data.name,
        level: data.level,
        trainer_profile_id: profile.id,
        club_id: clubId,
        duration_minutes: data.duration_minutes,
        max_students: data.max_students,
        price_per_student: data.price_per_student,
        court_number: data.court_number || null,
        objective: data.objective || null,
        created_by_profile_id: profile.id,
        is_active: true,
      };

      const template = await createTemplateMutation.mutateAsync(templateData);
      console.log("Template created successfully:", template);

      // Luego crear el horario recurrente
      const scheduleData = {
        template_id: template.id,
        day_of_week: data.day_of_week,
        start_time: data.start_time,
        start_date: data.start_date,
        end_date: data.end_date,
        recurrence_type: data.recurrence_type,
        recurrence_interval: data.recurrence_interval,
      };

      console.log("Creating schedule with data:", scheduleData);
      await createScheduleMutation.mutateAsync(scheduleData);
      console.log("Schedule created successfully");

      onClose();
    } catch (error) {
      console.error("Error creating schedule:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Nueva Clase Programada
        </DialogTitle>
      </DialogHeader>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Configuración de la Clase
          </CardTitle>
          <CardDescription>
            Crea una nueva clase con horario recurrente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información básica */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nombre de la Clase</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Técnica de saque avanzada" {...field} />
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
                            <SelectValue />
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
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_students"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Máximo de Estudiantes
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="12"
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 8)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price_per_student"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio por Estudiante (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.5"
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 15)}
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
                      <FormLabel>Número de Pista (Opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="10"
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
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
                    <FormItem className="md:col-span-2">
                      <FormLabel className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        Objetivo de la Clase (Opcional)
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe los objetivos específicos de esta clase..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Programación */}
                <FormField
                  control={form.control}
                  name="day_of_week"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Día de la Semana</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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
                      <FormLabel className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Hora de Inicio
                      </FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Inicio</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Fin</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recurrence_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Recurrencia</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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

                <FormField
                  control={form.control}
                  name="recurrence_interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intervalo</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="4"
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange"
                >
                  {isSubmitting ? "Creando..." : "Crear Clase Programada"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
