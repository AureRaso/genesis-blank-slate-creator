import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DailyReportData, ClassWithGaps, WaitlistEntry } from './types.ts';

/**
 * Collect all data needed for the daily report
 * Uses the SAME logic as TodayAttendancePage (useTodayAttendance hook)
 */
export async function collectReportData(
  supabase: SupabaseClient,
  clubId: string,
  reportType: 'morning' | 'afternoon'
): Promise<DailyReportData> {
  const today = new Date().toISOString().split('T')[0];

  // Get club info
  const { data: club } = await supabase
    .from('clubs')
    .select('name')
    .eq('id', clubId)
    .single();

  const trainerName = 'Entrenador'; // Generic name for reports

  // Get day of week in Spanish (same as useTodayAttendance)
  const getDayOfWeekInSpanish = (date: Date): string => {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return days[date.getDay()];
  };

  const todayDate = new Date(today + 'T00:00:00');
  const dayOfWeek = getDayOfWeekInSpanish(todayDate);

  console.log(`📅 Collecting report data for club ${clubId} on ${today} (${dayOfWeek})`);

  // Get all programmed classes for today (SAME query as useTodayAttendance)
  const { data: classes, error } = await supabase
    .from('programmed_classes')
    .select(`
      id,
      name,
      start_time,
      duration_minutes,
      days_of_week,
      start_date,
      end_date,
      max_participants,
      trainer:profiles!trainer_profile_id(full_name),
      participants:class_participants(
        id,
        status,
        attendance_confirmed_for_date,
        attendance_confirmed_at,
        absence_confirmed,
        absence_reason,
        absence_confirmed_at,
        is_substitute,
        student_enrollment:student_enrollments(full_name, email)
      )
    `)
    .eq('club_id', clubId)
    .eq('is_active', true)
    .lte('start_date', today)
    .gte('end_date', today)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('❌ Error fetching classes:', error);
    throw error;
  }

  console.log(`📊 Found ${classes?.length || 0} total classes`);

  // Filter classes for today's day of week (SAME logic as useTodayAttendance)
  const todayClasses = (classes || []).filter((classData: any) => {
    const classDays = classData.days_of_week || [];
    return classDays.includes(dayOfWeek);
  });

  console.log(`📊 Filtered to ${todayClasses.length} classes for ${dayOfWeek}`);

  // Collect all data
  const [classesWithGaps, waitlist, responseMetrics] = await Promise.all([
    getClassesWithGaps(todayClasses, today),
    getWaitlist(supabase, clubId),
    getResponseMetrics(todayClasses, today)
  ]);

  // Calculate additional metrics
  const pendingParticipants = responseMetrics.total_students - responseMetrics.total_responses;

  // Count full classes (classes at 100% capacity)
  const fullClasses = todayClasses.filter((classData: any) => {
    const validParticipants = (classData.participants || [])
      .filter((p: any) => p.status === 'active' && p.student_enrollment);
    const confirmedCount = validParticipants.filter(
      (p: any) => p.attendance_confirmed_for_date === today
    ).length;
    const maxParticipants = classData.max_participants || 8;
    return confirmedCount >= maxParticipants;
  }).length;

  const reportData: DailyReportData = {
    club_id: clubId,
    club_name: club?.name || 'Club',
    report_date: today,
    report_type: reportType,
    trainer_name: trainerName,
    // Statistics (SAME as TodayAttendancePage cards)
    total_classes: todayClasses.length,
    total_participants: responseMetrics.total_students,
    confirmed_participants: responseMetrics.confirmed_participants,
    absent_participants: responseMetrics.absent_participants,
    pending_participants: pendingParticipants,
    full_classes: fullClasses,
    total_waitlist: waitlist.length,
    response_rate: responseMetrics.response_rate,
    total_students_notified: responseMetrics.total_students,
    total_responses: responseMetrics.total_responses,
    classes_with_gaps: classesWithGaps,
    waitlist: waitlist,
    urgent_actions: [] // Will be generated later
  };

  console.log('✅ Report data collected:', {
    total_classes: todayClasses.length,
    total_participants: responseMetrics.total_students,
    confirmed: responseMetrics.confirmed_participants,
    absent: responseMetrics.absent_participants,
    pending: pendingParticipants,
    full_classes: fullClasses,
    waitlist_count: waitlist.length,
    classes_with_gaps: classesWithGaps.length,
    response_rate: Math.round(responseMetrics.response_rate) + '%'
  });

  return reportData;
}

/**
 * Get classes with available spots (gaps)
 * SAME logic as TodayAttendancePage
 */
function getClassesWithGaps(
  classes: any[],
  date: string
): ClassWithGaps[] {
  const classesWithGaps: ClassWithGaps[] = [];

  for (const classData of classes) {
    // Filter active participants (SAME as useTodayAttendance)
    const validParticipants = (classData.participants || [])
      .filter((p: any) => p.status === 'active' && p.student_enrollment);

    // Count confirmed attendees for today (SAME logic as TodayAttendancePage)
    const confirmedCount = validParticipants.filter(
      (p: any) => p.attendance_confirmed_for_date === date
    ).length;

    // Count absences (SAME logic as TodayAttendancePage)
    const absentCount = validParticipants.filter(
      (p: any) => p.absence_confirmed === true
    ).length;

    const totalCount = validParticipants.length;
    const maxParticipants = classData.max_participants || 8;

    // Current participants = confirmed for today
    const currentCount = confirmedCount;
    const gaps = maxParticipants - currentCount;

    console.log(`📊 Class ${classData.name}:`, {
      totalEnrolled: totalCount,
      maxParticipants,
      confirmedToday: confirmedCount,
      absentToday: absentCount,
      gaps
    });

    // Only include if there are gaps
    if (gaps > 0) {
      // Get absences with reasons
      const absences = validParticipants
        .filter((p: any) => p.absence_confirmed === true)
        .map((p: any) => ({
          student_name: p.student_enrollment?.full_name || 'Desconocido',
          reason: p.absence_reason || undefined
        }));

      classesWithGaps.push({
        id: classData.id,
        name: classData.name,
        time: classData.start_time,
        trainer_name: classData.trainer?.full_name || 'Sin asignar',
        current_participants: currentCount,
        max_participants: maxParticipants,
        gaps: gaps,
        rejections: absences.length > 0 ? absences : undefined
      });
    }
  }

  // Sort by time
  classesWithGaps.sort((a, b) => a.time.localeCompare(b.time));

  console.log(`✅ Found ${classesWithGaps.length} classes with gaps`);

  return classesWithGaps;
}

/**
 * Get waitlist entries
 */
async function getWaitlist(
  supabase: SupabaseClient,
  clubId: string
): Promise<WaitlistEntry[]> {
  const { data: waitlist } = await supabase
    .from('class_waitlist')
    .select(`
      requested_at,
      class_name,
      class_start_time,
      preferred_day_of_week,
      student_enrollment:student_enrollments(full_name)
    `)
    .eq('club_id', clubId)
    .eq('status', 'waiting')
    .order('priority', { ascending: false })
    .order('requested_at', { ascending: true })
    .limit(20);

  if (!waitlist) return [];

  const now = new Date();

  return waitlist.map((entry: any) => {
    const requestedAt = new Date(entry.requested_at);
    const hoursDiff = Math.floor((now.getTime() - requestedAt.getTime()) / (1000 * 60 * 60));
    const daysDiff = Math.floor(hoursDiff / 24);

    return {
      student_name: entry.student_enrollment?.full_name || 'Desconocido',
      class_name: entry.class_name,
      class_time: entry.class_start_time,
      day_of_week: entry.preferred_day_of_week || 'Cualquiera',
      hours_waiting: hoursDiff,
      days_waiting: daysDiff
    };
  });
}

/**
 * Calculate response rate metrics
 * SAME logic as TodayAttendancePage statistics
 */
function getResponseMetrics(
  classes: any[],
  date: string
): {
  response_rate: number;
  total_students: number;
  total_responses: number;
  confirmed_participants: number;
  absent_participants: number;
} {
  let totalParticipants = 0;
  let confirmedParticipants = 0;
  let absentParticipants = 0;

  // Calculate totals across all classes (SAME as TodayAttendancePage)
  for (const classData of classes) {
    const validParticipants = (classData.participants || [])
      .filter((p: any) => p.status === 'active' && p.student_enrollment);

    totalParticipants += validParticipants.length;

    confirmedParticipants += validParticipants.filter(
      (p: any) => p.attendance_confirmed_for_date === date
    ).length;

    absentParticipants += validParticipants.filter(
      (p: any) => p.absence_confirmed === true
    ).length;
  }

  // Total responses = confirmed + absent
  const totalResponses = confirmedParticipants + absentParticipants;

  // Response rate = (responses / total) * 100
  const responseRate = totalParticipants > 0
    ? (totalResponses / totalParticipants) * 100
    : 0;

  console.log('📊 Response metrics:', {
    totalParticipants,
    confirmedParticipants,
    absentParticipants,
    totalResponses,
    responseRate: Math.round(responseRate) + '%'
  });

  return {
    response_rate: responseRate,
    total_students: totalParticipants,
    total_responses: totalResponses,
    confirmed_participants: confirmedParticipants,
    absent_participants: absentParticipants
  };
}
