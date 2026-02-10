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
  attended_when_confirmed: number;
  no_show_when_confirmed: number;
}

/**
 * Hook to fetch behavior metrics for multiple students in batch
 * Uses the placeholder class_id '00000000-0000-0000-0000-000000000000' to get global metrics
 * Also fetches real-time attendance counts from class_attendance_records
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

      // Batch query 1: substitute attendance counts
      const { data: substituteCounts, error: subError } = await supabase
        .from('class_participants')
        .select('student_enrollment_id')
        .in('student_enrollment_id', studentEnrollmentIds)
        .eq('is_substitute', true);

      if (subError) {
        console.error('Error fetching substitute counts:', subError);
      }

      // Count substitutes per student
      const substituteCountMap = new Map<string, number>();
      (substituteCounts || []).forEach(row => {
        const count = substituteCountMap.get(row.student_enrollment_id) || 0;
        substituteCountMap.set(row.student_enrollment_id, count + 1);
      });

      // Batch query 2: real-time attendance records from class_attendance_records
      // Join through class_participants to get student_enrollment_id
      const { data: attendanceData, error: attError } = await supabase
        .from('class_participants')
        .select(`
          student_enrollment_id,
          class_attendance_records(
            had_confirmed_attendance,
            actually_attended
          )
        `)
        .in('student_enrollment_id', studentEnrollmentIds);

      if (attError) {
        console.error('Error fetching attendance records:', attError);
      }

      // Aggregate attendance counts per student
      const attendedMap = new Map<string, number>();
      const noShowMap = new Map<string, number>();
      (attendanceData || []).forEach((participant: any) => {
        const enrollmentId = participant.student_enrollment_id;
        const records = participant.class_attendance_records || [];
        records.forEach((record: any) => {
          if (record.had_confirmed_attendance) {
            if (record.actually_attended) {
              attendedMap.set(enrollmentId, (attendedMap.get(enrollmentId) || 0) + 1);
            } else {
              noShowMap.set(enrollmentId, (noShowMap.get(enrollmentId) || 0) + 1);
            }
          }
        });
      });

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
            const attendedWhenConfirmed = attendedMap.get(enrollmentId) || 0;
            const noShowWhenConfirmed = noShowMap.get(enrollmentId) || 0;

            if (!data || data.length === 0) {
              return {
                student_enrollment_id: enrollmentId,
                total_attended: 0,
                late_notice_absences: 0,
                early_notice_absences: 0,
                total_absences: 0,
                club_cancelled_classes: 0,
                substitute_attendances: substituteAttendances,
                attended_when_confirmed: attendedWhenConfirmed,
                no_show_when_confirmed: noShowWhenConfirmed,
              };
            }

            return {
              student_enrollment_id: enrollmentId,
              ...data[0],
              substitute_attendances: substituteAttendances,
              attended_when_confirmed: attendedWhenConfirmed,
              no_show_when_confirmed: noShowWhenConfirmed,
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