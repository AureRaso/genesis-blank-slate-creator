import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StudentScore {
  id: string;
  student_enrollment_id: string;
  score: number;
  score_category: string;
  no_show_when_confirmed: number;
  recent_failures: number;
  recent_streak_type: string;
  student_enrollment?: {
    full_name: string;
    email: string;
  };
}

interface MonthlyReportData {
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
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Obtener parámetros
    const { club_id, month, year } = await req.json();

    const reportMonth = month || new Date().getMonth() + 1;
    const reportYear = year || new Date().getFullYear();

    console.log(`Generando reporte mensual para club ${club_id}, ${reportMonth}/${reportYear}`);

    // 1. Obtener todos los scores de estudiantes del club
    const { data: scores, error: scoresError } = await supabaseClient
      .from("student_attendance_scores")
      .select(`
        *,
        student_enrollment:student_enrollments!student_enrollment_id(
          full_name,
          email,
          club_id
        )
      `)
      .eq("student_enrollment.club_id", club_id) as { data: StudentScore[] | null; error: any };

    if (scoresError) {
      throw new Error(`Error obteniendo scores: ${scoresError.message}`);
    }

    if (!scores || scores.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No hay datos de scores para este club"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // 2. Calcular estadísticas generales
    const reportData: MonthlyReportData = {
      total_students: scores.length,
      students_excellent: scores.filter(s => s.score_category === "excellent").length,
      students_good: scores.filter(s => s.score_category === "good").length,
      students_regular: scores.filter(s => s.score_category === "regular").length,
      students_problematic: scores.filter(s => s.score_category === "problematic").length,
      total_classes_month: scores.reduce((sum, s) => sum + (s as any).total_classes, 0),
      total_no_shows_month: scores.reduce((sum, s) => sum + s.no_show_when_confirmed, 0),
      total_confirmations_month: scores.reduce((sum, s) => sum + (s as any).total_confirmed_attendance, 0),
      average_score: scores.reduce((sum, s) => sum + s.score, 0) / scores.length,
      average_attendance_rate: 0,
      top_students: [],
      problematic_students: [],
      recommendations: "",
    };

    // Calcular tasa de asistencia promedio
    const totalAttended = scores.reduce((sum, s) => sum + (s as any).actually_attended_when_confirmed, 0);
    const totalConfirmed = scores.reduce((sum, s) => sum + (s as any).total_confirmed_attendance, 0);
    reportData.average_attendance_rate = totalConfirmed > 0 ? (totalAttended / totalConfirmed) * 100 : 0;

    // 3. Top 5 estudiantes
    reportData.top_students = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => ({
        id: s.student_enrollment_id,
        name: s.student_enrollment?.full_name || "Sin nombre",
        score: s.score,
      }));

    // 4. Estudiantes problemáticos (score < 60 o con alertas)
    reportData.problematic_students = scores
      .filter(s => s.score < 60 || s.no_show_when_confirmed >= 2 || s.recent_streak_type === "negative")
      .map(s => {
        const issues: string[] = [];
        if (s.score < 60) issues.push(`Score bajo: ${s.score}`);
        if (s.no_show_when_confirmed >= 2) issues.push(`${s.no_show_when_confirmed} no-shows`);
        if (s.recent_streak_type === "negative") issues.push(`Racha negativa: ${s.recent_failures}/3`);

        return {
          id: s.student_enrollment_id,
          name: s.student_enrollment?.full_name || "Sin nombre",
          score: s.score,
          issues,
        };
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, 10); // Top 10 problemáticos

    // 5. Generar recomendaciones
    reportData.recommendations = generateRecommendations(reportData);

    // 6. Guardar reporte en la base de datos
    const { error: insertError } = await supabaseClient
      .from("monthly_attendance_reports")
      .upsert({
        club_id,
        report_month: reportMonth,
        report_year: reportYear,
        total_students: reportData.total_students,
        students_excellent: reportData.students_excellent,
        students_good: reportData.students_good,
        students_regular: reportData.students_regular,
        students_problematic: reportData.students_problematic,
        total_classes_month: reportData.total_classes_month,
        total_no_shows_month: reportData.total_no_shows_month,
        total_confirmations_month: reportData.total_confirmations_month,
        average_score: reportData.average_score.toFixed(2),
        average_attendance_rate: reportData.average_attendance_rate.toFixed(2),
        top_students: reportData.top_students,
        problematic_students: reportData.problematic_students,
        recommendations: reportData.recommendations,
        generated_at: new Date().toISOString(),
      }, {
        onConflict: "club_id,report_month,report_year",
      });

    if (insertError) {
      throw new Error(`Error guardando reporte: ${insertError.message}`);
    }

    console.log(`Reporte generado exitosamente para ${reportMonth}/${reportYear}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Reporte generado exitosamente",
        data: reportData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generando reporte:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

function generateRecommendations(data: MonthlyReportData): string {
  const recommendations: string[] = [];

  // Recomendaciones basadas en el porcentaje de problemáticos
  const problematicPercentage = (data.students_problematic / data.total_students) * 100;

  if (problematicPercentage > 20) {
    recommendations.push(
      `🚨 CRÍTICO: ${problematicPercentage.toFixed(1)}% de alumnos son problemáticos. Se requiere intervención inmediata.`
    );
    recommendations.push(
      "- Realizar reunión individual con cada alumno problemático"
    );
    recommendations.push(
      "- Revisar horarios y disponibilidad de clases"
    );
  } else if (problematicPercentage > 10) {
    recommendations.push(
      `⚠️ ATENCIÓN: ${problematicPercentage.toFixed(1)}% de alumnos son problemáticos.`
    );
    recommendations.push(
      "- Contactar alumnos con score bajo para entender causas"
    );
  }

  // Recomendaciones basadas en score promedio
  if (data.average_score < 70) {
    recommendations.push(
      `📉 Score promedio bajo (${data.average_score.toFixed(1)}). Considerar:`
    );
    recommendations.push(
      "- Recordatorios más frecuentes de confirmación"
    );
    recommendations.push(
      "- Revisar sistema de penalizaciones"
    );
  } else if (data.average_score >= 85) {
    recommendations.push(
      `✅ Excelente score promedio (${data.average_score.toFixed(1)}). ¡Buen trabajo!`
    );
  }

  // Recomendaciones basadas en no-shows
  const noShowRate = (data.total_no_shows_month / data.total_confirmations_month) * 100;
  if (noShowRate > 15) {
    recommendations.push(
      `🚫 Tasa de no-shows alta (${noShowRate.toFixed(1)}%). Acciones recomendadas:`
    );
    recommendations.push(
      "- Implementar recordatorios 24h antes de clase"
    );
    recommendations.push(
      "- Evaluar política de penalizaciones por no-show"
    );
  }

  // Recomendaciones basadas en tasa de asistencia
  if (data.average_attendance_rate < 80) {
    recommendations.push(
      `📊 Tasa de asistencia baja (${data.average_attendance_rate.toFixed(1)}%). Mejorar comunicación con alumnos.`
    );
  }

  // Reconocimientos
  if (data.students_excellent > 0) {
    recommendations.push(
      `⭐ ${data.students_excellent} alumnos excelentes. Considerar programa de incentivos.`
    );
  }

  return recommendations.join("\n");
}
