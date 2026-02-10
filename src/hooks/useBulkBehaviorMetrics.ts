import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BulkBehaviorMetric {
  student_enrollment_id: string;
  total_attended: number;
  late_notice_absences: number;
  early_notice_absences: number;
  total_absences: number;
  club_cancelled_classes: number;
  substitute_attendances: number;
  // Real attendance data from class_attendance_records (via SECURITY DEFINER RPC)
  attended_count: number;
  no_show_count: number;
}

/**
 * Hook to fetch behavior metrics for multiple students in batch.
 * Uses two RPCs:
 * - get_student_behavior_metrics: late notices, absences, cancellations
 * - get_bulk_attendance_counts: real attended/no-show from class_attendance_records (SECURITY DEFINER)
 * Also fetches substitute attendance counts from class_participants.
 */
export const useBulkBehaviorMetrics = (studentEnrollmentIds: string[]) => {
  return useQuery({
    queryKey: ['bulk-behavior-metrics', studentEnrollmentIds],
    queryFn: async (): Promise<BulkBehaviorMetric[]> => {
      if (!studentEnrollmentIds.length) {
        return [];
      }

      const GLOBAL_CLASS_ID = '00000000-0000-0000-0000-000000000000';

      // Batch query 1: substitute attendance counts
      const { data: substituteCounts, error: subError } = await supabase
        .from('class_participants')
        .select('student_enrollment_id')
        .in('student_enrollment_id', studentEnrollmentIds)
        .eq('is_substitute', true);

      if (subError) {
        console.error('Error fetching substitute counts:', subError);
      }

      const substituteCountMap = new Map<string, number>();
      (substituteCounts || []).forEach(row => {
        const count = substituteCountMap.get(row.student_enrollment_id) || 0;
        substituteCountMap.set(row.student_enrollment_id, count + 1);
      });

      // Batch query 2: real attendance counts from class_attendance_records via SECURITY DEFINER RPC
      const attendedMap = new Map<string, number>();
      const noShowMap = new Map<string, number>();

      const { data: attendanceCounts, error: attError } = await supabase
        .rpc('get_bulk_attendance_counts', {
          p_student_enrollment_ids: studentEnrollmentIds
        });

      if (attError) {
        console.error('Error fetching bulk attendance counts:', attError);
      } else if (attendanceCounts) {
        (attendanceCounts as any[]).forEach((row: any) => {
          attendedMap.set(row.student_enrollment_id, Number(row.attended_count) || 0);
          noShowMap.set(row.student_enrollment_id, Number(row.no_show_count) || 0);
        });
      }

      // Fetch behavior metrics (late notices, etc.) for each student via RPC
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

            const substituteAttendances = substituteCountMap.get(enrollmentId) || 0;
            const attendedCount = attendedMap.get(enrollmentId) || 0;
            const noShowCount = noShowMap.get(enrollmentId) || 0;

            if (!data || data.length === 0) {
              return {
                student_enrollment_id: enrollmentId,
                total_attended: 0,
                late_notice_absences: 0,
                early_notice_absences: 0,
                total_absences: 0,
                club_cancelled_classes: 0,
                substitute_attendances: substituteAttendances,
                attended_count: attendedCount,
                no_show_count: noShowCount,
              };
            }

            return {
              student_enrollment_id: enrollmentId,
              ...data[0],
              substitute_attendances: substituteAttendances,
              attended_count: attendedCount,
              no_show_count: noShowCount,
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
    staleTime: 5 * 60 * 1000,
  });
};
