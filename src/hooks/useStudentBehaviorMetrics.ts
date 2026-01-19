import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StudentBehaviorMetrics {
  total_attended: number;
  late_notice_absences: number;
  early_notice_absences: number;
  total_absences: number;
  club_cancelled_classes: number;
}

/**
 * Hook to fetch student behavior metrics for waitlist evaluation
 * @param studentEnrollmentId - The student enrollment ID
 * @param classId - The class ID
 * @returns Query result with behavior metrics
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

      const { data, error } = await supabase
        .rpc('get_student_behavior_metrics', {
          p_student_enrollment_id: studentEnrollmentId,
          p_class_id: classId
        });

      if (error) {
        console.error('Error fetching student behavior metrics:', error);
        throw error;
      }

      // The RPC returns an array with one object
      if (!data || data.length === 0) {
        // Return default values if no data
        return {
          total_attended: 0,
          late_notice_absences: 0,
          early_notice_absences: 0,
          total_absences: 0,
          club_cancelled_classes: 0
        };
      }

      return data[0];
    },
    enabled: !!studentEnrollmentId && !!classId,
    // Cache for 5 minutes since this data doesn't change frequently
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

  const { total_attended, late_notice_absences, early_notice_absences } = metrics;

  const totalActions = total_attended + late_notice_absences + early_notice_absences;

  // If student hasn't participated yet, return neutral score
  if (totalActions === 0) return 5;

  // Calculate weighted score
  // Attended classes: +10 points (muy positivo - compromiso demostrado)
  // Early absences: +2 points (positivo - buena comunicación, avisa con tiempo)
  // Late absences: -5 points (negativo - causa problemas de organización)
  const rawScore = (
    (total_attended * 10) +
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

  if (!metrics || (metrics.total_attended === 0 && metrics.total_absences === 0)) {
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
