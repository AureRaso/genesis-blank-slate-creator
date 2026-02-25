import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StudentBehaviorMetrics {
  total_attended: number;
  late_notice_absences: number;
  early_notice_absences: number;
  total_absences: number;
  club_cancelled_classes: number;
  // From get_bulk_attendance_counts (same source as admin players list)
  attended_count: number;
  no_show_count: number;
  substitute_attendances: number;
}

/**
 * Hook to fetch student behavior metrics for waitlist evaluation and cards.
 * Combines data from:
 * - get_student_behavior_metrics: late/early notices, cancellations
 * - get_bulk_attendance_counts: attended/no-show (same logic as admin players list)
 * - class_participants: substitute attendance count
 */
export const useStudentBehaviorMetrics = (
  studentEnrollmentId: string | undefined,
  classId: string | undefined
) => {
  return useQuery({
    queryKey: ['student-behavior-metrics', studentEnrollmentId, classId],
    queryFn: async (): Promise<StudentBehaviorMetrics> => {
      if (!studentEnrollmentId || !classId) {
        throw new Error('Student enrollment ID and class ID are required');
      }

      // Fetch all 3 data sources in parallel
      const [behaviorResult, attendanceResult, substituteResult] = await Promise.all([
        // 1. Behavior metrics (late/early notices, cancellations)
        supabase.rpc('get_student_behavior_metrics', {
          p_student_enrollment_id: studentEnrollmentId,
          p_class_id: classId
        }),
        // 2. Attendance counts (same RPC as admin players list)
        supabase.rpc('get_bulk_attendance_counts', {
          p_student_enrollment_ids: [studentEnrollmentId]
        }),
        // 3. Substitute attendance count
        supabase
          .from('class_participants')
          .select('id')
          .eq('student_enrollment_id', studentEnrollmentId)
          .eq('is_substitute', true)
      ]);

      if (behaviorResult.error) {
        console.error('Error fetching student behavior metrics:', behaviorResult.error);
        throw behaviorResult.error;
      }

      const behaviorData = behaviorResult.data?.[0] ?? {
        total_attended: 0,
        late_notice_absences: 0,
        early_notice_absences: 0,
        total_absences: 0,
        club_cancelled_classes: 0
      };

      // Attendance counts from corrected RPC
      let attendedCount = 0;
      let noShowCount = 0;
      if (!attendanceResult.error && attendanceResult.data?.length > 0) {
        attendedCount = Number(attendanceResult.data[0].attended_count) || 0;
        noShowCount = Number(attendanceResult.data[0].no_show_count) || 0;
      }

      // Substitute count
      const substituteAttendances = substituteResult.data?.length ?? 0;

      return {
        ...behaviorData,
        attended_count: attendedCount,
        no_show_count: noShowCount,
        substitute_attendances: substituteAttendances,
      };
    },
    enabled: !!studentEnrollmentId && !!classId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Calculate a reliability score based on behavior metrics
 * Score ranges from 0-10, where 10 is the most reliable
 *
 * La fórmula valora:
 * - Asistir: muy positivo (demuestra compromiso)
 * - Cancelar con anticipación: positivo (buena comunicación, permite reorganizar)
 * - Cancelar tarde: negativo (causa problemas de organización)
 */
export const calculateReliabilityScore = (metrics: StudentBehaviorMetrics | undefined): number => {
  if (!metrics) return 0;

  const { attended_count, late_notice_absences, early_notice_absences } = metrics;

  const totalActions = attended_count + late_notice_absences + early_notice_absences;

  // If student hasn't participated yet, return neutral score
  if (totalActions === 0) return 5;

  // Calculate weighted score
  // Attended classes: +10 points (muy positivo - compromiso demostrado)
  // Early absences: +2 points (positivo - buena comunicación, avisa con tiempo)
  // Late absences: -5 points (negativo - causa problemas de organización)
  const rawScore = (
    (attended_count * 10) +
    (early_notice_absences * 2) -
    (late_notice_absences * 5)
  ) / totalActions;

  // Normalize to 0-10 scale
  const normalizedScore = Math.max(0, Math.min(10, rawScore));

  return Math.round(normalizedScore * 10) / 10; // Round to 1 decimal
};

/**
 * Get reliability badge information based on score
 */
export const getReliabilityBadge = (metrics: StudentBehaviorMetrics | undefined): {
  text: string;
  color: 'green' | 'yellow' | 'red' | 'gray' | 'blue';
  emoji: string;
} => {
  const score = calculateReliabilityScore(metrics);

  if (!metrics || (metrics.attended_count === 0 && metrics.total_absences === 0)) {
    return { text: 'Nuevo', color: 'blue', emoji: '🆕' };
  }

  if (score >= 8) {
    return { text: 'Excelente', color: 'green', emoji: '🟢' };
  }

  if (score >= 5) {
    return { text: 'Regular', color: 'yellow', emoji: '🟡' };
  }

  return { text: 'Problemático', color: 'red', emoji: '🔴' };
};