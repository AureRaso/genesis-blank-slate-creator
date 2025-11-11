import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CurrentUserEnrollment {
  id: string;
  full_name: string;
  email: string;
  status: string;
  club_id: string;
  club_name?: string;
  level: number;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to get the current user's enrollment status
 * Returns the enrollment if exists, null if not enrolled, or error if failed
 */
export const useCurrentUserEnrollment = (profileId?: string) => {
  return useQuery({
    queryKey: ['current-user-enrollment', profileId],
    queryFn: async () => {
      if (!profileId) return null;

      console.log('🔍 Fetching enrollment for profile:', profileId);

      const { data, error } = await supabase
        .from('student_enrollments')
        .select(`
          id,
          full_name,
          email,
          status,
          club_id,
          level,
          created_at,
          updated_at,
          clubs(name)
        `)
        .eq('created_by_profile_id', profileId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching user enrollment:', error);
        throw error;
      }

      if (!data) {
        console.log('ℹ️ No enrollment found for profile:', profileId);
        return null;
      }

      const enrollment: CurrentUserEnrollment = {
        ...data,
        club_name: (data.clubs as any)?.name
      };

      console.log('✅ User enrollment:', {
        id: enrollment.id,
        status: enrollment.status,
        club_name: enrollment.club_name
      });

      return enrollment;
    },
    enabled: !!profileId,
  });
};
