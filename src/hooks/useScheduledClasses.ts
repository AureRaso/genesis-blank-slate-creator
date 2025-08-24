import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { format, parseISO, isWithinInterval } from "date-fns";

// Updated to work with the new programmed_classes structure
type ProgrammedClass = Database["public"]["Tables"]["programmed_classes"]["Row"];
type ClassParticipant = Database["public"]["Tables"]["class_participants"]["Row"];

export type ScheduledClassWithTemplate = ProgrammedClass & {
  participants: (ClassParticipant & {
    student_enrollment: {
      full_name: string;
      email: string;
    };
  })[];
  trainer: {
    full_name: string;
  } | null;
  club: {
    name: string;
  } | null;
};

export type CreateScheduledClassData = {
  name: string;
  level_from?: number;
  level_to?: number;
  custom_level?: string;
  duration_minutes: number;
  start_time: string;
  days_of_week: string[];
  start_date: string;
  end_date: string;
  recurrence_type: string;
  trainer_profile_id: string;
  club_id: string;
  court_number?: number;
  selected_students?: string[];
};

// Hook to fetch programmed classes (replaces scheduled classes)
export const useScheduledClasses = (filters?: {
  startDate?: string;
  endDate?: string;
  clubId?: string;
  clubIds?: string[];
  status?: string;
}) => {
  return useQuery({
    queryKey: ["scheduled-classes", filters],
    queryFn: async () => {
      console.log("Fetching classes with filters:", filters);
      
      let query = supabase
        .from("programmed_classes")
        .select(`
          *,
          participants:class_participants(
            *,
            student_enrollment:student_enrollments!student_enrollment_id(
              full_name,
              email
            )
          ),
          trainer:profiles!trainer_profile_id(
            full_name
          ),
          club:clubs!club_id(
            name
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      // Filter by club(s) if provided
      if (filters?.clubId) {
        query = query.eq("club_id", filters.clubId);
      } else if (filters?.clubIds && filters.clubIds.length > 0) {
        query = query.in("club_id", filters.clubIds);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching classes:", error);
        throw error;
      }

      console.log("Raw classes data:", data);

      // Filter classes that are active during the requested date range
      let filteredClasses = data as any[];
      
      if (filters?.startDate && filters?.endDate) {
        const weekStart = parseISO(filters.startDate);
        const weekEnd = parseISO(filters.endDate);
        
        filteredClasses = filteredClasses.filter(cls => {
          const classStart = parseISO(cls.start_date);
          const classEnd = parseISO(cls.end_date);
          
          // Check if class period overlaps with the requested week
          const overlaps = 
            (classStart <= weekEnd && classEnd >= weekStart) ||
            isWithinInterval(weekStart, { start: classStart, end: classEnd }) ||
            isWithinInterval(weekEnd, { start: classStart, end: classEnd });
          
          return overlaps;
        });
      }

      console.log("Filtered classes for date range:", filteredClasses);
      return filteredClasses as ScheduledClassWithTemplate[];
    },
  });
};

// Hook to create a programmed class (replaces scheduled class)
export const useCreateScheduledClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateScheduledClassData) => {
      const { selected_students, ...classData } = data;

      // Create the programmed class
      const { data: result, error } = await supabase
        .from("programmed_classes")
        .insert([classData])
        .select()
        .single();

      if (error) throw error;

      // Create class participants for selected students
      if (selected_students && selected_students.length > 0) {
        const participantsData = selected_students.map(studentId => ({
          class_id: result.id,
          student_enrollment_id: studentId,
          status: 'active'
        }));

        const { error: participantsError } = await supabase
          .from("class_participants")
          .insert(participantsData);

        if (participantsError) throw participantsError;
      }

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

// Hook to update a programmed class
export const useUpdateScheduledClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateScheduledClassData> }) => {
      const { data: result, error } = await supabase
        .from("programmed_classes")
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

// Hook to delete a programmed class
export const useDeleteScheduledClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("programmed_classes")
        .update({ is_active: false })
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
