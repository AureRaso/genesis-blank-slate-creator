import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook to archive/unarchive a student (soft delete)
 * Changes student status to 'inactive' to hide them from all lists
 * while preserving their data in the database
 */
export const useArchiveStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      studentId,
      archive = true
    }: {
      studentId: string;
      archive?: boolean;
    }) => {
      console.log(`${archive ? '🗄️ Archiving' : '📤 Restoring'} student:`, studentId);

      const newStatus = archive ? 'inactive' : 'active';

      const { data, error } = await supabase
        .from('student_enrollments')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Student ${archive ? 'archived' : 'restored'}:`, data);
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['student-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['class-participants'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-class-attendance'] });

      const action = variables.archive ? 'archivado' : 'restaurado';
      toast.success(`✓ Alumno ${action} correctamente`);
    },
    onError: (error: any) => {
      console.error('Error archiving/restoring student:', error);
      toast.error('Error al archivar/restaurar alumno');
    },
  });
};
