import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ============================================
// TYPES & INTERFACES
// ============================================

export type ScoreCategory = 'excellent' | 'good' | 'regular' | 'problematic';
export type StreakType = 'positive' | 'negative' | 'neutral' | 'unknown';

export interface StudentAttendanceScore {
  id: string;
  student_enrollment_id: string;

  // Score principal
  score: number;
  score_category: ScoreCategory;

  // Métricas principales
  total_classes: number;
  total_confirmed_attendance: number;
  total_confirmed_absence: number;
  total_no_response: number;

  // Cumplimiento
  actually_attended_when_confirmed: number;
  no_show_when_confirmed: number;
  attended_without_confirmation: number;
  absent_without_confirmation: number;

  // Clases canceladas
  classes_cancelled_by_academy: number;

  // Contexto
  is_in_fixed_class: boolean;

  // Tendencia reciente
  recent_streak_type: StreakType | null;
  recent_failures: number;

  // Componentes del score
  score_fulfillment: number;
  score_communication: number;
  score_cancellation: number;
  score_stability_bonus: number;
  score_penalties: number;

  // Metadata
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
}

export interface StudentScoreWithDetails extends StudentAttendanceScore {
  student_enrollment?: {
    full_name: string;
    email: string;
    club_id?: string;
  };
}

export interface ScoreHistory {
  id: string;
  student_enrollment_id: string;
  score: number;
  score_category: ScoreCategory;
  total_classes: number;
  no_show_when_confirmed: number;
  recorded_at: string;
}

export interface ScoreMetrics {
  totalClasses: number;
  totalConfirmed: number;
  totalCancelled: number;
  totalNoResponse: number;
  attendedWhenConfirmed: number;
  noShowWhenConfirmed: number;
  attendedWithoutConfirmation: number;
  absentWithoutConfirmation: number;
  classesCancelledByAcademy: number;
  isInFixedClass: boolean;
  last3Classes: Array<{
    confirmed: boolean;
    attended: boolean;
  }>;
}

// ============================================
// ALGORITMO DE SCORING
// ============================================

/**
 * Calcula el score (0-100) basado en las métricas de asistencia
 *
 * FÓRMULA:
 * SCORE = (40) Cumplimiento + (30) Comunicación + (20) Cancelaciones + (10) Estabilidad - Penalizaciones
 */
export function calculateAttendanceScore(metrics: ScoreMetrics): {
  score: number;
  category: ScoreCategory;
  components: {
    fulfillment: number;
    communication: number;
    cancellation: number;
    stabilityBonus: number;
    penalties: number;
  };
  streakType: StreakType;
} {
  // 1. CUMPLIMIENTO DE CONFIRMACIONES (40 puntos max)
  let scoreFulfillment = 0;
  if (metrics.totalConfirmed > 0) {
    const fulfillmentRate = metrics.attendedWhenConfirmed / metrics.totalConfirmed;
    scoreFulfillment = fulfillmentRate * 40;
  }

  // 2. COMUNICACIÓN (30 puntos max)
  const totalClassesExcludingCancelled = metrics.totalClasses - metrics.classesCancelledByAcademy;
  let scoreCommunication = 0;
  if (totalClassesExcludingCancelled > 0) {
    const communicationRate =
      (metrics.totalConfirmed + metrics.totalCancelled) / totalClassesExcludingCancelled;
    scoreCommunication = communicationRate * 30;
  }

  // 3. PATRÓN DE CANCELACIONES (20 puntos max)
  let scoreCancellation = 20;
  if (totalClassesExcludingCancelled > 0) {
    const cancellationRate = metrics.totalCancelled / totalClassesExcludingCancelled;
    if (cancellationRate > 0.3) {
      scoreCancellation = 10; // Cancela mucho
    } else if (cancellationRate > 0.15) {
      scoreCancellation = 15; // Cancela moderado
    }
  }

  // 4. BONUS POR ESTABILIDAD (10 puntos max)
  let scoreStabilityBonus = 0;
  if (metrics.isInFixedClass) {
    scoreStabilityBonus += 5; // Comprometido con grupo fijo
  }
  if (metrics.attendedWithoutConfirmation === 0) {
    scoreStabilityBonus += 5; // Siempre confirma antes de venir
  }

  // SUMA BASE
  let scoreBase =
    scoreFulfillment +
    scoreCommunication +
    scoreCancellation +
    scoreStabilityBonus;

  // 5. PENALIZACIONES
  const penaltyNoShows = metrics.noShowWhenConfirmed * 15;

  // Verificar racha negativa (2+ fallos en últimas 3)
  const recentFailures = metrics.last3Classes.filter(c => c.confirmed && !c.attended).length;
  const penaltyStreak = recentFailures >= 2 ? 10 : 0;

  const totalPenalties = penaltyNoShows + penaltyStreak;

  // SCORE FINAL
  let scoreFinal = scoreBase - totalPenalties;
  scoreFinal = Math.max(0, Math.min(100, Math.round(scoreFinal)));

  // Determinar categoría
  let category: ScoreCategory;
  if (scoreFinal >= 90) {
    category = 'excellent';
  } else if (scoreFinal >= 75) {
    category = 'good';
  } else if (scoreFinal >= 60) {
    category = 'regular';
  } else {
    category = 'problematic';
  }

  // Determinar tipo de racha
  let streakType: StreakType;
  if (recentFailures >= 2) {
    streakType = 'negative';
  } else if (metrics.last3Classes.every(c => c.confirmed && c.attended)) {
    streakType = 'positive';
  } else {
    streakType = 'neutral';
  }

  return {
    score: scoreFinal,
    category,
    components: {
      fulfillment: Math.round(scoreFulfillment * 100) / 100,
      communication: Math.round(scoreCommunication * 100) / 100,
      cancellation: Math.round(scoreCancellation * 100) / 100,
      stabilityBonus: Math.round(scoreStabilityBonus * 100) / 100,
      penalties: Math.round(totalPenalties * 100) / 100,
    },
    streakType,
  };
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook para obtener los scores de todos los alumnos
 */
export const useAllStudentScores = (clubId?: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['student-attendance-scores', clubId],
    queryFn: async () => {
      if (!profile?.id) throw new Error('Usuario no autenticado');

      // First, get student enrollments for the club(s)
      let enrollmentsQuery = supabase
        .from('student_enrollments')
        .select('id')
        .neq('status', 'inactive');

      if (clubId) {
        enrollmentsQuery = enrollmentsQuery.eq('club_id', clubId);
      }

      const { data: enrollments, error: enrollmentsError } = await enrollmentsQuery;

      if (enrollmentsError) {
        console.error('❌ Error fetching enrollments:', enrollmentsError);
        throw enrollmentsError;
      }

      if (!enrollments || enrollments.length === 0) {
        return [];
      }

      const enrollmentIds = enrollments.map(e => e.id);

      // Now fetch scores for those enrollments
      const { data, error } = await supabase
        .from('student_attendance_scores')
        .select(`
          *,
          student_enrollment:student_enrollments!student_enrollment_id(
            full_name,
            email,
            club_id
          )
        `)
        .in('student_enrollment_id', enrollmentIds)
        .order('score', { ascending: false });

      if (error) {
        console.error('❌ Error fetching student scores:', error);
        throw error;
      }

      return (data || []) as StudentScoreWithDetails[];
    },
    enabled: !!profile?.id,
  });
};

/**
 * Hook para obtener el score de un alumno específico
 */
export const useStudentScore = (studentEnrollmentId?: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['student-attendance-score', studentEnrollmentId],
    queryFn: async () => {
      if (!profile?.id || !studentEnrollmentId) throw new Error('Datos incompletos');

      const { data, error } = await supabase
        .from('student_attendance_scores')
        .select(`
          *,
          student_enrollment:student_enrollments!student_enrollment_id(
            full_name,
            email
          )
        `)
        .eq('student_enrollment_id', studentEnrollmentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching student score:', error);
        throw error;
      }

      return data as StudentScoreWithDetails | null;
    },
    enabled: !!profile?.id && !!studentEnrollmentId,
  });
};

/**
 * Hook para obtener el historial de scores de un alumno
 */
export const useStudentScoreHistory = (studentEnrollmentId?: string, limit: number = 30) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['student-score-history', studentEnrollmentId, limit],
    queryFn: async () => {
      if (!profile?.id || !studentEnrollmentId) throw new Error('Datos incompletos');

      const { data, error } = await supabase
        .from('student_attendance_score_history')
        .select('*')
        .eq('student_enrollment_id', studentEnrollmentId)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching score history:', error);
        throw error;
      }

      return (data as ScoreHistory[]).reverse(); // Más antiguo primero para gráfica
    },
    enabled: !!profile?.id && !!studentEnrollmentId,
  });
};

/**
 * Hook para calcular/recalcular el score de un alumno
 */
export const useCalculateStudentScore = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (studentEnrollmentId: string) => {
      if (!profile?.id) throw new Error('Usuario no autenticado');

      console.log('📊 Calculando score para alumno:', studentEnrollmentId);

      // 1. Obtener todos los registros de asistencia del alumno
      const { data: attendanceRecords, error: fetchError } = await supabase
        .from('class_attendance_records')
        .select(`
          *,
          class_participant:class_participants!class_participant_id(
            id,
            class_id
          ),
          programmed_class:programmed_classes!programmed_class_id(
            id,
            name
          )
        `)
        .eq('class_participant.student_enrollment_id', studentEnrollmentId)
        .order('class_date', { ascending: false });

      if (fetchError) throw fetchError;

      // 2. Obtener clases canceladas
      const { data: cancelledClasses } = await supabase
        .from('cancelled_classes')
        .select('programmed_class_id, cancelled_date');

      const cancelledSet = new Set(
        (cancelledClasses || []).map(c => `${c.programmed_class_id}_${c.cancelled_date}`)
      );

      // 3. Calcular métricas
      const metrics: ScoreMetrics = {
        totalClasses: 0,
        totalConfirmed: 0,
        totalCancelled: 0,
        totalNoResponse: 0,
        attendedWhenConfirmed: 0,
        noShowWhenConfirmed: 0,
        attendedWithoutConfirmation: 0,
        absentWithoutConfirmation: 0,
        classesCancelledByAcademy: 0,
        isInFixedClass: false, // TODO: detectar si está en clase fija
        last3Classes: [],
      };

      // Filtrar clases canceladas
      const validRecords = (attendanceRecords || []).filter(record => {
        const key = `${record.programmed_class_id}_${record.class_date}`;
        return !cancelledSet.has(key);
      });

      metrics.totalClasses = validRecords.length;

      // Últimas 3 clases
      metrics.last3Classes = validRecords.slice(0, 3).map(r => ({
        confirmed: r.had_confirmed_attendance,
        attended: r.actually_attended,
      }));

      // Contar métricas
      validRecords.forEach(record => {
        // Confirmaciones previas
        if (record.had_confirmed_attendance) {
          metrics.totalConfirmed++;
          if (record.actually_attended) {
            metrics.attendedWhenConfirmed++;
          } else {
            metrics.noShowWhenConfirmed++;
          }
        } else if (record.had_confirmed_absence) {
          metrics.totalCancelled++;
        } else {
          metrics.totalNoResponse++;
          if (record.actually_attended) {
            metrics.attendedWithoutConfirmation++;
          } else {
            metrics.absentWithoutConfirmation++;
          }
        }
      });

      // Contar clases canceladas por academia
      metrics.classesCancelledByAcademy = (attendanceRecords?.length || 0) - validRecords.length;

      // 4. Calcular score
      const scoreResult = calculateAttendanceScore(metrics);

      // 5. Guardar/actualizar en BD
      const scoreData = {
        student_enrollment_id: studentEnrollmentId,
        score: scoreResult.score,
        score_category: scoreResult.category,
        total_classes: metrics.totalClasses,
        total_confirmed_attendance: metrics.totalConfirmed,
        total_confirmed_absence: metrics.totalCancelled,
        total_no_response: metrics.totalNoResponse,
        actually_attended_when_confirmed: metrics.attendedWhenConfirmed,
        no_show_when_confirmed: metrics.noShowWhenConfirmed,
        attended_without_confirmation: metrics.attendedWithoutConfirmation,
        absent_without_confirmation: metrics.absentWithoutConfirmation,
        classes_cancelled_by_academy: metrics.classesCancelledByAcademy,
        is_in_fixed_class: metrics.isInFixedClass,
        recent_streak_type: scoreResult.streakType,
        recent_failures: metrics.last3Classes.filter(c => c.confirmed && !c.attended).length,
        score_fulfillment: scoreResult.components.fulfillment,
        score_communication: scoreResult.components.communication,
        score_cancellation: scoreResult.components.cancellation,
        score_stability_bonus: scoreResult.components.stabilityBonus,
        score_penalties: scoreResult.components.penalties,
        last_calculated_at: new Date().toISOString(),
        calculation_method: 'manual',
      };

      const { data: savedScore, error: saveError } = await supabase
        .from('student_attendance_scores')
        .upsert(scoreData, {
          onConflict: 'student_enrollment_id',
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // 6. Guardar en historial
      const { error: historyError } = await supabase
        .from('student_attendance_score_history')
        .insert({
          student_enrollment_id: studentEnrollmentId,
          score: scoreResult.score,
          score_category: scoreResult.category,
          total_classes: metrics.totalClasses,
          no_show_when_confirmed: metrics.noShowWhenConfirmed,
        });

      if (historyError) {
        console.warn('⚠️ Error guardando historial:', historyError);
      }

      console.log('✅ Score calculado:', scoreResult);

      return {
        score: savedScore,
        metrics,
        components: scoreResult.components,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-attendance-scores'] });
      queryClient.invalidateQueries({ queryKey: ['student-attendance-score'] });
      queryClient.invalidateQueries({ queryKey: ['student-score-history'] });
      toast.success('✓ Score calculado correctamente');
    },
    onError: (error: any) => {
      console.error('❌ Error calculando score:', error);
      toast.error('Error al calcular score', {
        description: error.message,
      });
    },
  });
};

/**
 * Hook para recalcular los scores de todos los alumnos
 */
export const useRecalculateAllScores = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const calculateScore = useCalculateStudentScore();

  return useMutation({
    mutationFn: async (clubId?: string) => {
      if (!profile?.id) throw new Error('Usuario no autenticado');

      console.log('📊 Recalculando scores de todos los alumnos...');

      // Obtener todos los student_enrollments
      let query = supabase
        .from('student_enrollments')
        .select('id');

      if (clubId) {
        query = query.eq('club_id', clubId);
      }

      const { data: enrollments, error } = await query;

      if (error) throw error;

      // Calcular score para cada alumno
      const results = [];
      for (const enrollment of enrollments || []) {
        try {
          const result = await calculateScore.mutateAsync(enrollment.id);
          results.push(result);
        } catch (err) {
          console.error(`Error calculando score para ${enrollment.id}:`, err);
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['student-attendance-scores'] });
      toast.success(`✓ ${results.length} scores recalculados`);
    },
    onError: (error: any) => {
      console.error('❌ Error recalculando scores:', error);
      toast.error('Error al recalcular scores');
    },
  });
};
