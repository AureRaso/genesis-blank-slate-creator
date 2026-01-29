import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BulkBehaviorMetric {
  student_enrollment_id: string;
  total_attended: number;
  late_notice_absences: number;
  early_notice_absences: number;
  total_absences: number;
  club_cancelled_classes: number;
}

/**
 * Hook to fetch behavior metrics for multiple students in batch
 * Uses the placeholder class_id '00000000-0000-0000-0000-000000000000' to get global metrics
 */
export const useBulkBehaviorMetrics = (studentEnrollmentIds: string[]) => {
  return useQuery({
    queryKey: ['bulk-behavior-metrics', studentEnrollmentIds],
    queryFn: async (): Promise<BulkBehaviorMetric[]> => {
      if (!studentEnrollmentIds.length) {
        return [];
      }

      // Fetch metrics for each student using the RPC function
      // Using the placeholder UUID to get global metrics across all classes
      const GLOBAL_CLASS_ID = '00000000-0000-0000-0000-000000000000';

      const results = await Promise.all(
        studentEnrollmentIds.map(async (enrollmentId) => {
          try {
            const { data, error } = await supabase
              .rpc('get_student_behavior_metrics', {
                p_student_enrollment_id: enrollmentId,
                p_class_id: GLOBAL_CLASS_ID
              });

            if (error) {
              console.error(`Error fetching metrics for student ${enrollmentId}:`, error);
              return null;
            }

            if (!data || data.length === 0) {
              return {
                student_enrollment_id: enrollmentId,
                total_attended: 0,
                late_notice_absences: 0,
                early_notice_absences: 0,
                total_absences: 0,
                club_cancelled_classes: 0
              };
            }

            return {
              student_enrollment_id: enrollmentId,
              ...data[0]
            };
          } catch (err) {
            console.error(`Exception fetching metrics for student ${enrollmentId}:`, err);
            return null;
          }
        })
      );

      return results.filter((r): r is BulkBehaviorMetric => r !== null);
    },
    enabled: studentEnrollmentIds.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};