import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ClassWaitlist } from "@/types/waitlist";
import { subHours } from "date-fns";

// Hook to check if user can join waitlist
export const useCanJoinWaitlist = (classId: string, classDate: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['can-join-waitlist', classId, classDate, profile?.id],
    queryFn: async () => {
      console.log('🔍 [WAITLIST] Step 1: Starting validation');
      console.log('🔍 [WAITLIST] Profile:', profile);

      if (!profile?.id) {
        console.log('❌ [WAITLIST] No profile found');
        return {
          canJoin: false,
          reason: 'not_authenticated',
          message: 'Debes iniciar sesión para unirte a la lista de espera'
        };
      }

      // 1. Get class info
      console.log('🔍 [WAITLIST] Step 2: Fetching class info for classId:', classId);
      const { data: classData, error: classError } = await supabase
        .from('programmed_classes')
        .select(`
          id,
          name,
          start_time,
          duration_minutes,
          max_participants,
          is_active,
          start_date,
          end_date,
          club_id
        `)
        .eq('id', classId)
        .single();

      console.log('🔍 [WAITLIST] Class data:', classData);
      console.log('🔍 [WAITLIST] Class error:', classError);

      if (classError || !classData) {
        console.log('❌ [WAITLIST] Class not found');
        return {
          canJoin: false,
          reason: 'class_not_found',
          message: 'Clase no encontrada'
        };
      }

      if (!classData.is_active) {
        console.log('❌ [WAITLIST] Class is inactive');
        return {
          canJoin: false,
          reason: 'class_inactive',
          message: 'Esta clase no está activa'
        };
      }

      // 2. Check if waitlist is still open (closes 3 hours before class)
      console.log('🔍 [WAITLIST] Step 3: Checking time window');
      const [hours, minutes] = classData.start_time.split(':');
      const classDateTime = new Date(classDate);
      classDateTime.setHours(parseInt(hours), parseInt(minutes), 0);

      const now = new Date();
      const threeHoursBefore = subHours(classDateTime, 3);

      console.log('🔍 [WAITLIST] Now:', now);
      console.log('🔍 [WAITLIST] Class time:', classDateTime);
      console.log('🔍 [WAITLIST] Three hours before (cutoff):', threeHoursBefore);

      // Check if we're past the cutoff time (3 hours before class)
      if (now >= threeHoursBefore) {
        console.log('❌ [WAITLIST] Too late - waitlist closed');
        return {
          canJoin: false,
          reason: 'too_late',
          message: 'La lista de espera se cierra 3 horas antes de la clase'
        };
      }

      // If we're here, we're before the 3-hour cutoff, so it's OK to join
      console.log('✅ [WAITLIST] Time window OK - can join (before 3h cutoff)');

      // 3. Get user's enrollment for this club
      console.log('🔍 [WAITLIST] Step 4: Checking enrollment');
      console.log('🔍 [WAITLIST] Looking for email:', profile.email);
      console.log('🔍 [WAITLIST] Looking for club_id:', classData.club_id);

      // First, check if user belongs to the correct club
      console.log('🔍 [WAITLIST] User profile club_id:', profile.club_id);

      if (profile.club_id && profile.club_id !== classData.club_id) {
        console.log('❌ [WAITLIST] User belongs to different club');
        return {
          canJoin: false,
          reason: 'wrong_club',
          message: 'No perteneces al club de esta clase'
        };
      }

      // Check ALL enrollments for this user for debugging
      const { data: allEnrollments } = await supabase
        .from('student_enrollments')
        .select('id, status, club_id, email')
        .eq('email', profile.email);

      console.log('🔍 [WAITLIST] ALL enrollments for user:', allEnrollments);

      const { data: enrollments, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('id, status, club_id')
        .eq('email', profile.email)
        .eq('club_id', classData.club_id)
        .eq('status', 'active');

      console.log('🔍 [WAITLIST] Enrollments found for this club:', enrollments);
      console.log('🔍 [WAITLIST] Enrollment error:', enrollmentError);

      if (!enrollments || enrollments.length === 0) {
        console.log('❌ [WAITLIST] No active enrollment found');
        return {
          canJoin: false,
          reason: 'no_enrollment',
          message: 'Para unirte a la lista de espera necesitas una inscripción activa. Por favor, contacta con tu entrenador para que te inscriba en el sistema.'
        };
      }

      const enrollmentId = enrollments[0].id;

      // 4. Check if already enrolled in this class
      const { data: participant } = await supabase
        .from('class_participants')
        .select('id, status')
        .eq('class_id', classId)
        .eq('student_enrollment_id', enrollmentId)
        .eq('status', 'active')
        .maybeSingle();

      if (participant) {
        return {
          canJoin: false,
          reason: 'already_enrolled',
          message: 'Ya estás inscrito en esta clase'
        };
      }

      // 5. Check if already in waitlist
      const { data: waitlistEntry } = await supabase
        .from('class_waitlist')
        .select('id, status')
        .eq('class_id', classId)
        .eq('class_date', classDate)
        .eq('student_enrollment_id', enrollmentId)
        .maybeSingle();

      if (waitlistEntry) {
        if (waitlistEntry.status === 'pending') {
          return {
            canJoin: false,
            reason: 'already_in_waitlist',
            message: 'Ya estás en la lista de espera para esta clase'
          };
        }
        if (waitlistEntry.status === 'accepted') {
          return {
            canJoin: false,
            reason: 'already_accepted',
            message: 'Ya has sido aceptado en esta clase'
          };
        }
      }

      return {
        canJoin: true,
        reason: 'can_join',
        message: 'Puedes unirte a la lista de espera',
        classData,
        enrollmentId
      };
    },
    enabled: !!profile?.id && !!classId && !!classDate,
  });
};

// Hook to join waitlist
export const useJoinWaitlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classId,
      classDate,
      enrollmentId
    }: {
      classId: string;
      classDate: string;
      enrollmentId: string;
    }) => {
      const { data, error } = await supabase
        .from('class_waitlist')
        .insert({
          class_id: classId,
          class_date: classDate,
          student_enrollment_id: enrollmentId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['can-join-waitlist'] });
      toast.success('✓ Te has unido a la lista de espera correctamente');
    },
    onError: (error: any) => {
      console.error('Error joining waitlist:', error);
      toast.error(error.message || 'Error al unirse a la lista de espera');
    },
  });
};

// Hook to get waitlist for a specific class/date (for trainers/admins)
export const useClassWaitlist = (classId: string, classDate: string) => {
  return useQuery({
    queryKey: ['class-waitlist', classId, classDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_waitlist')
        .select(`
          id,
          class_id,
          class_date,
          student_enrollment_id,
          requested_at,
          status,
          accepted_by,
          accepted_at,
          rejected_by,
          rejected_at,
          notes,
          student_enrollment:student_enrollments!student_enrollment_id(
            id,
            full_name,
            email,
            level
          )
        `)
        .eq('class_id', classId)
        .eq('class_date', classDate)
        .order('requested_at', { ascending: true });

      if (error) throw error;
      return data as ClassWaitlist[];
    },
    enabled: !!classId && !!classDate,
  });
};

// Hook to accept student from waitlist
export const useAcceptFromWaitlist = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      waitlistId,
      classId,
      classDate,
      studentEnrollmentId
    }: {
      waitlistId: string;
      classId: string;
      classDate: string;
      studentEnrollmentId: string;
    }) => {
      const now = new Date().toISOString();

      // 1. Create class participant with substitute flag and auto-confirmed attendance
      const { error: participantError } = await supabase
        .from('class_participants')
        .insert({
          class_id: classId,
          student_enrollment_id: studentEnrollmentId,
          status: 'active',
          is_substitute: true,
          joined_from_waitlist_at: now,
          attendance_confirmed_for_date: classDate,
          attendance_confirmed_at: now
        });

      if (participantError) throw participantError;

      // 2. Update waitlist entry as accepted
      const { error: waitlistError } = await supabase
        .from('class_waitlist')
        .update({
          status: 'accepted',
          accepted_by: profile?.id,
          accepted_at: now
        })
        .eq('id', waitlistId);

      if (waitlistError) throw waitlistError;

      // 3. Expire other pending entries for this class/date
      const { error: expireError } = await supabase
        .from('class_waitlist')
        .update({ status: 'expired' })
        .eq('class_id', classId)
        .eq('class_date', classDate)
        .eq('status', 'pending')
        .neq('id', waitlistId);

      if (expireError) console.error('Error expiring other waitlist entries:', expireError);

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-waitlist', variables.classId, variables.classDate] });
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      toast.success('✓ Alumno agregado a la clase');
    },
    onError: (error: any) => {
      console.error('Error accepting from waitlist:', error);
      toast.error(error.message || 'Error al aceptar alumno');
    },
  });
};

// Hook to reject student from waitlist
export const useRejectFromWaitlist = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      waitlistId,
      classId,
      classDate
    }: {
      waitlistId: string;
      classId: string;
      classDate: string;
    }) => {
      const { error } = await supabase
        .from('class_waitlist')
        .update({
          status: 'rejected',
          rejected_by: profile?.id,
          rejected_at: new Date().toISOString()
        })
        .eq('id', waitlistId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-waitlist', variables.classId, variables.classDate] });
      toast.success('Solicitud rechazada');
    },
    onError: (error: any) => {
      console.error('Error rejecting from waitlist:', error);
      toast.error(error.message || 'Error al rechazar solicitud');
    },
  });
};

// Hook to get user's own waitlist requests (for players)
export const useMyWaitlistRequests = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['my-waitlist-requests', profile?.id],
    queryFn: async () => {
      if (!profile?.id || !profile?.email) {
        return [];
      }

      // Get user's enrollment
      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('email', profile.email)
        .eq('status', 'active');

      if (!enrollments || enrollments.length === 0) {
        return [];
      }

      const enrollmentIds = enrollments.map(e => e.id);

      // Get all waitlist entries for this user
      const { data: waitlistData, error: waitlistError } = await supabase
        .from('class_waitlist')
        .select('*')
        .in('student_enrollment_id', enrollmentIds)
        .in('status', ['pending', 'accepted', 'rejected'])
        .order('requested_at', { ascending: false });

      if (waitlistError) {
        console.error('❌ Error fetching waitlist requests:', waitlistError);
        throw waitlistError;
      }

      if (!waitlistData || waitlistData.length === 0) {
        console.log('✅ No waitlist requests found');
        return [];
      }

      console.log('📋 Raw waitlist data:', waitlistData);

      // Get class details for all waitlist entries
      const classIds = waitlistData.map(w => w.class_id);
      const { data: classesData, error: classesError } = await supabase
        .from('programmed_classes')
        .select(`
          id,
          name,
          start_time,
          duration_minutes,
          trainer:profiles(full_name)
        `)
        .in('id', classIds);

      if (classesError) {
        console.error('❌ Error fetching class details:', classesError);
        // Return waitlist data without class details
        return waitlistData.map(item => ({
          ...item,
          programmed_class: null
        }));
      }

      // Combine waitlist data with class details
      const transformedData = waitlistData.map(item => {
        const classData = classesData?.find(c => c.id === item.class_id);
        return {
          ...item,
          programmed_class: classData || null
        };
      });

      console.log('✅ Waitlist requests with class details:', transformedData);
      return transformedData;
    },
    enabled: !!profile?.id && !!profile?.email,
  });
};
