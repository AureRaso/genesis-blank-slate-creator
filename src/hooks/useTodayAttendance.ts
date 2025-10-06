import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export interface TodayAttendanceClass {
  id: string;
  name: string;
  start_time: string;
  duration_minutes: number;
  trainer: {
    full_name: string;
  } | null;
  participants: {
    id: string;
    student_enrollment: {
      full_name: string;
      email: string;
    };
    attendance_confirmed_for_date: string | null;
    attendance_confirmed_at: string | null;
    absence_confirmed: boolean | null;
    absence_reason: string | null;
    absence_confirmed_at: string | null;
  }[];
}

// Get day of week in Spanish format used in database
const getDayOfWeekInSpanish = (date: Date): string => {
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return days[date.getDay()];
};

// Hook for admins/trainers to see all today's classes with attendance confirmations
export const useTodayAttendance = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const todayDayName = getDayOfWeekInSpanish(new Date());

  const query = useQuery({
    queryKey: ['today-attendance', profile?.id, today],
    queryFn: async () => {
      if (!profile?.id) throw new Error('Usuario no autenticado');

      console.log('🔍 DEBUG - useTodayAttendance:', {
        profileId: profile.id,
        profileEmail: profile.email,
        profileRole: profile.role,
        profileClubId: profile.club_id,
        today,
        todayDayName
      });

      // Get all programmed classes for today in the user's club(s)
      let query = supabase
        .from('programmed_classes')
        .select(`
          id,
          name,
          start_time,
          duration_minutes,
          days_of_week,
          start_date,
          end_date,
          club_id,
          trainer:profiles!trainer_profile_id(
            full_name
          ),
          participants:class_participants(
            id,
            status,
            attendance_confirmed_for_date,
            attendance_confirmed_at,
            absence_confirmed,
            absence_reason,
            absence_confirmed_at,
            student_enrollment:student_enrollments!student_enrollment_id(
              full_name,
              email
            )
          )
        `)
        .eq('is_active', true)
        .contains('days_of_week', [todayDayName])
        .lte('start_date', today)
        .gte('end_date', today);

      // Filter by club if user has a club_id
      if (profile.club_id) {
        query = query.eq('club_id', profile.club_id);
      }

      // If trainer (not admin), filter by classes they created
      if (profile.role === 'trainer') {
        query = query.eq('created_by', profile.id);
      }

      query = query.order('start_time', { ascending: true });

      const { data, error } = await query;

      console.log('📊 Today attendance data:', { data, error });

      if (error) {
        console.error('❌ Error fetching today attendance:', error);
        throw error;
      }

      // Filter and format the data
      const todayClasses = (data || []).map((classData: any) => ({
        id: classData.id,
        name: classData.name,
        start_time: classData.start_time,
        duration_minutes: classData.duration_minutes,
        trainer: classData.trainer,
        participants: (classData.participants || [])
          .filter((p: any) => p.status === 'active')
          .map((p: any) => ({
            id: p.id,
            student_enrollment: p.student_enrollment,
            attendance_confirmed_for_date: p.attendance_confirmed_for_date,
            attendance_confirmed_at: p.attendance_confirmed_at,
            absence_confirmed: p.absence_confirmed,
            absence_reason: p.absence_reason,
            absence_confirmed_at: p.absence_confirmed_at
          }))
      })) as TodayAttendanceClass[];

      console.log('✅ Final today classes with attendance:', todayClasses);
      return todayClasses;
    },
    enabled: !!profile?.id,
    // Auto-refetch every 30 seconds as fallback
    refetchInterval: 30000,
    // Refetch on window focus
    refetchOnWindowFocus: true,
  });

  // Setup Realtime subscription for instant updates
  useEffect(() => {
    if (!profile?.id) return;

    console.log('🔌 Setting up Realtime subscription for class_participants');

    // Subscribe to changes in class_participants table
    const channel = supabase
      .channel('today-attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'class_participants',
        },
        (payload) => {
          console.log('🔔 Realtime update received:', payload);

          // Invalidate and refetch the query when any change happens
          queryClient.invalidateQueries({
            queryKey: ['today-attendance', profile.id, today]
          });
        }
      )
      .subscribe((status) => {
        console.log('🔌 Realtime subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 Cleaning up Realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [profile?.id, today, queryClient]);

  return query;
};
