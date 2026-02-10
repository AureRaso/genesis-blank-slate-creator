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
      // First get class_participant IDs for our enrollment IDs
      const { data: participantIds, error: pError } = await supabase
        .from('class_participants')
        .select('id, student_enrollment_id')
        .in('student_enrollment_id', studentEnrollmentIds);

      if (pError) {
        console.error('📊 [BulkMetrics] Error fetching participant IDs:', pError);
      }

      console.log('📊 [BulkMetrics] Enrollment IDs count:', studentEnrollmentIds.length);
      console.log('📊 [BulkMetrics] Participant IDs found:', participantIds?.length ?? 0);

      // Map participant_id -> enrollment_id
      const participantToEnrollment = new Map<string, string>();
      (participantIds || []).forEach(p => {
        participantToEnrollment.set(p.id, p.student_enrollment_id);
      });

      // Now fetch attendance records directly
      const allParticipantIds = (participantIds || []).map(p => p.id);
      let attendanceRecords: any[] = [];

      if (allParticipantIds.length > 0) {
        // Supabase .in() has a limit, so batch if needed
        const batchSize = 500;
        for (let i = 0; i < allParticipantIds.length; i += batchSize) {
          const batch = allParticipantIds.slice(i, i + batchSize);
          const { data: batchData, error: attError } = await supabase
            .from('class_attendance_records')
            .select('class_participant_id, had_confirmed_attendance, actually_attended')
            .in('class_participant_id', batch);

          if (attError) {
            console.error('📊 [BulkMetrics] Error fetching attendance records batch:', attError);
          } else {
            attendanceRecords = attendanceRecords.concat(batchData || []);
          }
        }
      }

      console.log('📊 [BulkMetrics] Attendance records found:', attendanceRecords.length);
      if (attendanceRecords.length > 0) {
        console.log('📊 [BulkMetrics] Sample record:', attendanceRecords[0]);
      }

      // Aggregate attendance counts per student
      const attendedMap = new Map<string, number>();
      const noShowMap = new Map<string, number>();
      attendanceRecords.forEach((record: any) => {
        const enrollmentId = participantToEnrollment.get(record.class_participant_id);
        if (!enrollmentId) return;
        if (record.had_confirmed_attendance) {
          if (record.actually_attended) {
            attendedMap.set(enrollmentId, (attendedMap.get(enrollmentId) || 0) + 1);
          } else {
            noShowMap.set(enrollmentId, (noShowMap.get(enrollmentId) || 0) + 1);
          }
        }
      });

      console.log('📊 [BulkMetrics] Students with attended > 0:', attendedMap.size);
      console.log('📊 [BulkMetrics] Students with noShow > 0:', noShowMap.size);

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