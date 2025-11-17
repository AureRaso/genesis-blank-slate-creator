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

      // Fetch all data in batches to avoid server-side limits
      let allData: any[] = [];
      let page = 0;
      const PAGE_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
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
          .order("created_at", { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

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

        if (!data || data.length === 0) {
          hasMore = false;
        } else {
          allData = [...allData, ...data];
          // If we got less than PAGE_SIZE results, we've reached the end
          if (data.length < PAGE_SIZE) {
            hasMore = false;
          } else {
            page++;
          }
        }
      }

      console.log("Raw classes data:", allData);

      // Filter classes that are active during the requested date range
      let filteredClasses = allData as any[];

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
      // First, get the class details to find all recurring instances
      const { data: classData, error: fetchError } = await supabase
        .from("programmed_classes")
        .select('id, club_id, name, start_time')
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;
      if (!classData) throw new Error("Clase no encontrada");

      // Find all classes in the recurring series (same club_id, name, and start_time)
      const { data: matchingClasses, error: matchError } = await supabase
        .from('programmed_classes')
        .select('id, name, start_time, club_id')
        .eq('club_id', classData.club_id)
        .eq('name', classData.name)
        .eq('start_time', classData.start_time)
        .eq('is_active', true);

      if (matchError) throw matchError;

      // Delete all matching classes (soft delete by setting is_active to false)
      const classIds = matchingClasses?.map(c => c.id) || [id];

      const { error } = await supabase
        .from("programmed_classes")
        .update({ is_active: false })
        .in("id", classIds);

      if (error) throw error;

      return { deletedCount: classIds.length, classIds };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-classes"] });
      toast({
        title: "Clases eliminadas",
        description: `Se han eliminado ${data.deletedCount} clase${data.deletedCount > 1 ? 's' : ''} de la serie recurrente.`,
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
