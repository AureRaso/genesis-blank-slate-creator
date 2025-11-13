import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StudentScoreNotification {
  id: string;
  student_enrollment_id: string;
  notification_type: "negative_streak" | "low_score" | "multiple_no_shows" | "monthly_report";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  action_plan: string | null;
  score_at_notification: number | null;
  no_shows_at_notification: number | null;
  recent_failures_at_notification: number | null;
  is_read: boolean;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  sent_to_trainer: boolean;
  sent_to_student: boolean;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  student_enrollment?: {
    full_name: string;
    email: string;
    club_id?: string;
  };
}

export interface MonthlyReport {
  id: string;
  club_id: string;
  report_month: number;
  report_year: number;
  total_students: number;
  students_excellent: number;
  students_good: number;
  students_regular: number;
  students_problematic: number;
  total_classes_month: number;
  total_no_shows_month: number;
  total_confirmations_month: number;
  average_score: number;
  average_attendance_rate: number;
  top_students: Array<{ id: string; name: string; score: number }>;
  problematic_students: Array<{ id: string; name: string; score: number; issues: string[] }>;
  recommendations: string;
  generated_at: string;
  sent_to_trainers: boolean;
  sent_at: string | null;
  created_at: string;
}

/**
 * Hook para obtener todas las notificaciones
 */
export function useNotifications(clubId?: string, includeRead = false) {
  return useQuery({
    queryKey: ["score-notifications", clubId, includeRead],
    queryFn: async () => {
      let query = supabase
        .from("student_score_notifications")
        .select(`
          *,
          student_enrollment:student_enrollments!student_enrollment_id(
            full_name,
            email,
            club_id
          )
        `)
        .order("created_at", { ascending: false });

      // Filtrar por leídas/no leídas
      if (!includeRead) {
        query = query.eq("is_read", false);
      }

      // Filtrar por club si se especifica
      if (clubId) {
        query = query.eq("student_enrollment.club_id", clubId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching notifications:", error);
        throw error;
      }

      return data as StudentScoreNotification[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener notificaciones sin resolver
 */
export function useUnresolvedNotifications(clubId?: string) {
  return useQuery({
    queryKey: ["unresolved-notifications", clubId],
    queryFn: async () => {
      let query = supabase
        .from("student_score_notifications")
        .select(`
          *,
          student_enrollment:student_enrollments!student_enrollment_id(
            full_name,
            email,
            club_id
          )
        `)
        .eq("is_resolved", false)
        .order("severity", { ascending: false })
        .order("created_at", { ascending: false });

      if (clubId) {
        query = query.eq("student_enrollment.club_id", clubId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching unresolved notifications:", error);
        throw error;
      }

      return data as StudentScoreNotification[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para obtener notificaciones de un estudiante específico
 */
export function useStudentNotifications(studentEnrollmentId?: string) {
  return useQuery({
    queryKey: ["student-notifications", studentEnrollmentId],
    queryFn: async () => {
      if (!studentEnrollmentId) return [];

      const { data, error } = await supabase
        .from("student_score_notifications")
        .select("*")
        .eq("student_enrollment_id", studentEnrollmentId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching student notifications:", error);
        throw error;
      }

      return data as StudentScoreNotification[];
    },
    enabled: !!studentEnrollmentId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para marcar notificación como leída
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("student_score_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["score-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unresolved-notifications"] });
    },
  });
}

/**
 * Hook para resolver notificación
 */
export function useResolveNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      notificationId,
      resolutionNotes,
      resolvedBy,
    }: {
      notificationId: string;
      resolutionNotes?: string;
      resolvedBy: string;
    }) => {
      const { error } = await supabase
        .from("student_score_notifications")
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy,
          resolution_notes: resolutionNotes || null,
        })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["score-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unresolved-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["student-notifications"] });
    },
  });
}

/**
 * Hook para obtener reportes mensuales
 */
export function useMonthlyReports(clubId?: string) {
  return useQuery({
    queryKey: ["monthly-reports", clubId],
    queryFn: async () => {
      let query = supabase
        .from("monthly_attendance_reports")
        .select("*")
        .order("report_year", { ascending: false })
        .order("report_month", { ascending: false });

      if (clubId) {
        query = query.eq("club_id", clubId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching monthly reports:", error);
        throw error;
      }

      return data as MonthlyReport[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Hook para obtener un reporte mensual específico
 */
export function useMonthlyReport(clubId?: string, month?: number, year?: number) {
  return useQuery({
    queryKey: ["monthly-report", clubId, month, year],
    queryFn: async () => {
      if (!clubId || !month || !year) return null;

      const { data, error } = await supabase
        .from("monthly_attendance_reports")
        .select("*")
        .eq("club_id", clubId)
        .eq("report_month", month)
        .eq("report_year", year)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No hay reporte para este mes
          return null;
        }
        console.error("Error fetching monthly report:", error);
        throw error;
      }

      return data as MonthlyReport;
    },
    enabled: !!clubId && !!month && !!year,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Hook para generar reporte mensual
 */
export function useGenerateMonthlyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clubId,
      month,
      year,
    }: {
      clubId: string;
      month?: number;
      year?: number;
    }) => {
      const response = await supabase.functions.invoke("generate-monthly-score-report", {
        body: {
          club_id: clubId,
          month: month || new Date().getMonth() + 1,
          year: year || new Date().getFullYear(),
        },
      });

      if (response.error) throw response.error;

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-reports"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-report"] });
    },
  });
}

/**
 * Hook para contar notificaciones sin leer
 */
export function useUnreadNotificationsCount(clubId?: string) {
  return useQuery({
    queryKey: ["unread-notifications-count", clubId],
    queryFn: async () => {
      let query = supabase
        .from("student_score_notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);

      if (clubId) {
        query = query.eq("student_enrollment.club_id", clubId);
      }

      const { count, error } = await query;

      if (error) {
        console.error("Error counting notifications:", error);
        return 0;
      }

      return count || 0;
    },
    staleTime: 1000 * 60 * 1, // 1 minuto
  });
}
