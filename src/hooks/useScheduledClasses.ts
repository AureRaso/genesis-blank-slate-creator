import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type ClassGroup = Database["public"]["Tables"]["class_groups"]["Row"];
type ClassTemplate = Database["public"]["Tables"]["class_templates"]["Row"];
type ClassSchedule = Database["public"]["Tables"]["class_schedules"]["Row"];
type ScheduledClass = Database["public"]["Tables"]["scheduled_classes"]["Row"];
type ClassEnrollment = Database["public"]["Tables"]["class_enrollments"]["Row"];

export type ScheduledClassWithTemplate = ScheduledClass & {
  template: ClassTemplate & {
    group?: ClassGroup;
  };
  enrollments: (ClassEnrollment & {
    student_enrollment: {
      full_name: string;
      email: string;
    };
  })[];
};

export type CreateScheduledClassData = {
  template_id: string;
  class_date: string;
  start_time: string;
  end_time: string;
  court_number?: number;
  max_students: number;
  notes?: string;
};

export type CreateClassScheduleData = {
  template_id: string;
  day_of_week: Database["public"]["Enums"]["day_of_week"];
  start_time: string;
  start_date: string;
  end_date: string;
  recurrence_type: Database["public"]["Enums"]["recurrence_type"];
  recurrence_interval?: number;
};

// Hook to fetch scheduled classes
export const useScheduledClasses = (filters?: {
  startDate?: string;
  endDate?: string;
  templateId?: string;
  status?: Database["public"]["Enums"]["class_status"];
}) => {
  return useQuery({
    queryKey: ["scheduled-classes", filters],
    queryFn: async () => {
      let query = supabase
        .from("scheduled_classes")
        .select(`
          *,
          template:class_templates!inner(
            *,
            group:class_groups(*)
          ),
          enrollments:class_enrollments(
            *,
            student_enrollment:student_enrollments(
              full_name,
              email
            )
          )
        `)
        .order("class_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (filters?.startDate) {
        query = query.gte("class_date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("class_date", filters.endDate);
      }
      if (filters?.templateId) {
        query = query.eq("template_id", filters.templateId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ScheduledClassWithTemplate[];
    },
  });
};

// Hook to create a single scheduled class
export const useCreateScheduledClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateScheduledClassData) => {
      const user = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from("scheduled_classes")
        .insert([{
          ...data,
          created_by_profile_id: user.data.user?.id!
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-classes"] });
      toast({
        title: "Clase creada",
        description: "La clase se ha programado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo crear la clase: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to create multiple scheduled classes from a schedule
export const useCreateClassSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateClassScheduleData) => {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id!;
      
      // First create the schedule
      const { data: schedule, error: scheduleError } = await supabase
        .from("class_schedules")
        .insert([{
          ...data,
          created_by_profile_id: userId
        }])
        .select()
        .single();

      if (scheduleError) throw scheduleError;

      // Generate individual class instances
      const classInstances = generateClassInstances(data);
      
      // Create all class instances
      const { data: classes, error: classesError } = await supabase
        .from("scheduled_classes")
        .insert(
          classInstances.map(instance => ({
            schedule_id: schedule.id,
            template_id: data.template_id,
            class_date: instance.date,
            start_time: data.start_time,
            end_time: calculateEndTime(data.start_time, 60), // Default 60 minutes
            max_students: 8, // Default value, should come from template
            created_by_profile_id: userId
          }))
        )
        .select();

      if (classesError) throw classesError;

      return { schedule, classes };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-classes"] });
      queryClient.invalidateQueries({ queryKey: ["class-schedules"] });
      toast({
        title: "Clases programadas",
        description: `Se han creado ${result.classes?.length} clases correctamente.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudieron programar las clases: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to update a scheduled class
export const useUpdateScheduledClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateScheduledClassData> }) => {
      const { data: result, error } = await supabase
        .from("scheduled_classes")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-classes"] });
      toast({
        title: "Clase actualizada",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la clase: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to delete a scheduled class
export const useDeleteScheduledClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("scheduled_classes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-classes"] });
      toast({
        title: "Clase eliminada",
        description: "La clase se ha eliminado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la clase: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Utility function to generate class instances based on recurrence
function generateClassInstances(scheduleData: CreateClassScheduleData): { date: string }[] {
  const instances: { date: string }[] = [];
  const startDate = new Date(scheduleData.start_date);
  const endDate = new Date(scheduleData.end_date);
  
  // Map day names to numbers (0 = Sunday, 1 = Monday, etc.)
  const dayMap: Record<string, number> = {
    'domingo': 0,
    'lunes': 1,
    'martes': 2,
    'miercoles': 3,
    'jueves': 4,
    'viernes': 5,
    'sabado': 6
  };
  
  const targetDay = dayMap[scheduleData.day_of_week];
  let currentDate = new Date(startDate);
  
  // Find the first occurrence of the target day
  while (currentDate.getDay() !== targetDay && currentDate <= endDate) {
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Generate instances based on recurrence type
  const intervalDays = scheduleData.recurrence_type === 'weekly' ? 7 :
                      scheduleData.recurrence_type === 'biweekly' ? 14 : 30;
  
  while (currentDate <= endDate) {
    instances.push({
      date: currentDate.toISOString().split('T')[0]
    });
    
    currentDate.setDate(currentDate.getDate() + intervalDays * (scheduleData.recurrence_interval || 1));
  }
  
  return instances;
}

// Utility function to calculate end time
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMins = totalMinutes % 60;
  
  return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
}