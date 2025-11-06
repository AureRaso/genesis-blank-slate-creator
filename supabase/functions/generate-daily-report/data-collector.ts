import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DailyReportData, ClassWithGaps, WaitlistEntry } from './types.ts';

/**
 * Collect all data needed for the daily report
 * Simplified version - no trainer filtering, just club-wide report
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
    .select('name, created_by_profile_id')
    .eq('id', clubId)
    .single();

  // Get club owner name
  let trainerName = 'Equipo';
  if (club?.created_by_profile_id) {
    const { data: owner } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', club.created_by_profile_id)
      .single();
    if (owner) trainerName = owner.full_name;
  }

  // Collect all data in parallel
  const [
    classesWithGaps,
    waitlist,
    responseMetrics
  ] = await Promise.all([
    getClassesWithGaps(supabase, clubId, today),
    getWaitlist(supabase, clubId),
    getResponseMetrics(supabase, clubId, today)
  ]);

  const reportData: DailyReportData = {
    club_id: clubId,
    club_name: club?.name || 'Club',
    report_date: today,
    report_type: reportType,
    trainer_name: trainerName,
    response_rate: responseMetrics.response_rate,
    total_students_notified: responseMetrics.total_students,
    total_responses: responseMetrics.total_responses,
    classes_with_gaps: classesWithGaps,
    waitlist: waitlist,
    urgent_actions: [] // Will be generated later
  };

  return reportData;
}

/**
 * Get classes with available spots (gaps)
 * Using class_participants table for enrollment tracking
 */
async function getClassesWithGaps(
  supabase: SupabaseClient,
  clubId: string,
  date: string
): Promise<ClassWithGaps[]> {
  // Get day of week from date
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const dateObj = new Date(date + 'T00:00:00');
  const dayOfWeek = dayNames[dateObj.getDay()];

  // Get recurring classes for this club and day
  const { data: classes, error } = await supabase
    .from('programmed_classes')
    .select(`
      id,
      name,
      start_time,
      max_participants,
      days_of_week,
      trainer:profiles!programmed_classes_trainer_id_fkey(full_name)
    `)
    .eq('club_id', clubId)
    .eq('is_active', true)
    .contains('days_of_week', [dayOfWeek]);

  if (error) {
    console.error('Error fetching classes:', error);
    return [];
  }

  if (!classes) return [];

  // Process classes to find those with gaps
  const classesWithGaps: ClassWithGaps[] = [];

  for (const cls of classes) {
    // Get participants for this class
    const { data: participants } = await supabase
      .from('class_participants')
      .select(`
        id,
        status,
        attendance_confirmed_for_date,
        absence_confirmed,
        student_enrollment:student_enrollments(full_name)
      `)
      .eq('class_id', cls.id)
      .eq('status', 'active');

    // Count confirmed attendees for today
    const confirmedToday = participants?.filter(
      (p: any) => p.attendance_confirmed_for_date === date && !p.absence_confirmed
    ) || [];

    const currentCount = confirmedToday.length;
    const maxParticipants = cls.max_participants || 4;
    const gaps = maxParticipants - currentCount;

    // Only include if there are gaps
    if (gaps > 0) {
      // Get absences/rejections for this class today
      const absences = participants?.filter(
        (p: any) => p.absence_confirmed && p.attendance_confirmed_for_date === date
      ) || [];

      const rejections = absences.map((p: any) => ({
        student_name: p.student_enrollment?.full_name || 'Desconocido',
        reason: undefined
      }));

      classesWithGaps.push({
        id: cls.id,
        name: cls.name,
        time: cls.start_time,
        trainer_name: cls.trainer?.full_name || 'Sin asignar',
        current_participants: currentCount,
        max_participants: maxParticipants,
        gaps: gaps,
        rejections: rejections.length > 0 ? rejections : undefined
      });
    }
  }

  // Sort by time
  classesWithGaps.sort((a, b) => a.time.localeCompare(b.time));

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
 * Based on class_participants confirmations for today
 */
async function getResponseMetrics(
  supabase: SupabaseClient,
  clubId: string,
  date: string
): Promise<{
  response_rate: number;
  total_students: number;
  total_responses: number;
}> {
  // Get day of week from date
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const dateObj = new Date(date + 'T00:00:00');
  const dayOfWeek = dayNames[dateObj.getDay()];

  // Get classes for today
  const { data: classes } = await supabase
    .from('programmed_classes')
    .select('id')
    .eq('club_id', clubId)
    .eq('is_active', true)
    .contains('days_of_week', [dayOfWeek]);

  if (!classes || classes.length === 0) {
    return {
      response_rate: 0,
      total_students: 0,
      total_responses: 0
    };
  }

  const classIds = classes.map((c: any) => c.id);

  // Get all active participants for these classes
  const { data: participants } = await supabase
    .from('class_participants')
    .select('attendance_confirmed_for_date, absence_confirmed')
    .in('class_id', classIds)
    .eq('status', 'active');

  if (!participants || participants.length === 0) {
    return {
      response_rate: 0,
      total_students: 0,
      total_responses: 0
    };
  }

  const totalStudents = participants.length;

  // Count responses (confirmed attendance or absence for today)
  const responses = participants.filter(
    (p: any) =>
      (p.attendance_confirmed_for_date === date) ||
      (p.absence_confirmed === true)
  );

  const totalResponses = responses.length;
  const responseRate = totalStudents > 0 ? (totalResponses / totalStudents) * 100 : 0;

  return {
    response_rate: responseRate,
    total_students: totalStudents,
    total_responses: totalResponses
  };
}
