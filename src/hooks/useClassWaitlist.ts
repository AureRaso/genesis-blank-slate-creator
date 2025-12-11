import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ClassWaitlist } from "@/types/waitlist";
// import { subHours } from "date-fns"; // COMMENTED: Removed 3-hour restriction for waitlist

// Hook to check if user can join waitlist
export const useCanJoinWaitlist = (classId: string, classDate: string) => {
  const { profile, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['can-join-waitlist', classId, classDate, profile?.id],
    queryFn: async () => {
      // 1. Get class info - ALWAYS fetch this regardless of authentication
      const { data: classData, error: classError } = await supabase
        .from('programmed_classes')
        .select('id,name,start_time,duration_minutes,max_participants,is_active,start_date,end_date,club_id')
        .eq('id', classId)
        .single();

      if (classError || !classData) {
        return {
          canJoin: false,
          reason: 'class_not_found',
          message: 'Clase no encontrada',
          classData: null
        };
      }

      if (!classData.is_active) {
        return {
          canJoin: false,
          reason: 'class_inactive',
          message: 'Esta clase no está activa',
          classData
        };
      }

      // 2. Check if class has already passed
      const [hours, minutes] = classData.start_time.split(':');
      const classDateTime = new Date(classDate);
      classDateTime.setHours(parseInt(hours), parseInt(minutes), 0);

      const now = new Date();

      // Calculate class end time
      const classEndTime = new Date(classDateTime);
      classEndTime.setMinutes(classEndTime.getMinutes() + (classData.duration_minutes || 60));

      // Check if class has already ended
      if (now >= classEndTime) {
        return {
          canJoin: false,
          reason: 'class_ended',
          message: 'Esta clase ya ha finalizado',
          classData
        };
      }

      // 3. Check authentication - if not authenticated, return with class data
      if (!profile?.id) {
        return {
          canJoin: false,
          reason: 'not_authenticated',
          message: 'Debes iniciar sesión para unirte a la lista de espera',
          classData
        };
      }

      // 4. Get user's enrollment for this club
      if (profile.club_id && profile.club_id !== classData.club_id) {
        return {
          canJoin: false,
          reason: 'wrong_club',
          message: 'No perteneces al club de esta clase'
        };
      }

      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select('id, status, club_id')
        .eq('email', profile.email)
        .eq('club_id', classData.club_id)
        .eq('status', 'active');

      if (!enrollments || enrollments.length === 0) {
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

      // 6. Check if class is full (no available spots)
      // Count only active participants who have NOT marked absence
      const { count: participantCount } = await supabase
        .from('class_participants')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', classId)
        .eq('status', 'active')
        .neq('absence_confirmed', true);

      const maxParticipants = classData.max_participants || 8;
      const currentParticipants = participantCount || 0;
      const availableSpots = maxParticipants - currentParticipants;

      if (availableSpots <= 0) {
        return {
          canJoin: false,
          reason: 'class_full',
          message: 'Lo sentimos, esta plaza ya ha sido cubierta. La clase está completa en este momento.'
        };
      }

      return {
        canJoin: true,
        reason: 'can_join',
        message: 'Puedes unirte a la lista de espera',
        classData,
        enrollmentId
      };
    },
    // Always run this query if we have classId and classDate
    // The query itself will check authentication and return appropriate messages
    enabled: !!classId && !!classDate,
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
        .select('id,class_id,class_date,student_enrollment_id,requested_at,status,accepted_by,accepted_at,rejected_by,rejected_at,notes,student_enrollment:student_enrollments!student_enrollment_id(id,full_name,email,level)')
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

      // 1. Verify class capacity before accepting
      const { data: classData, error: classError } = await supabase
        .from('programmed_classes')
        .select('max_participants')
        .eq('id', classId)
        .single();

      if (classError) throw new Error('No se pudo verificar la clase');
      if (!classData) throw new Error('Clase no encontrada');

      // Count active participants who have NOT marked absence
      // This ensures that people who marked "Ausente" don't count as occupying a spot
      const { count: activeCount, error: countError } = await supabase
        .from('class_participants')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId)
        .eq('status', 'active')
        .neq('absence_confirmed', true);

      if (countError) throw new Error('Error al verificar participantes activos');

      const maxParticipants = classData.max_participants || 8;
      const currentParticipants = activeCount || 0;

      if (currentParticipants >= maxParticipants) {
        throw new Error('La clase ya está completa. No hay plazas disponibles.');
      }

      // 2. Create class participant with substitute flag and auto-confirmed attendance
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

      // 3. Update waitlist entry as accepted
      const { error: waitlistError } = await supabase
        .from('class_waitlist')
        .update({
          status: 'accepted',
          accepted_by: profile?.id,
          accepted_at: now
        })
        .eq('id', waitlistId);

      if (waitlistError) throw waitlistError;

      // 4. Get other pending entries before expiring (for email notifications)
      const { data: otherPendingEntries } = await supabase
        .from('class_waitlist')
        .select('id, student_enrollment_id')
        .eq('class_id', classId)
        .eq('class_date', classDate)
        .eq('status', 'pending')
        .neq('id', waitlistId);

      // 5. Expire other pending entries for this class/date
      const { error: expireError } = await supabase
        .from('class_waitlist')
        .update({ status: 'expired' })
        .eq('class_id', classId)
        .eq('class_date', classDate)
        .eq('status', 'pending')
        .neq('id', waitlistId);

      if (expireError) console.error('Error expiring other waitlist entries:', expireError);

      return { success: true, expiredEntries: otherPendingEntries || [] };
    },
    onSuccess: async (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-waitlist', variables.classId, variables.classDate] });
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      toast.success('✓ Alumno agregado a la clase');

      // Send email notification to accepted student
      console.log('🔔 [EMAIL] Starting email notification process...');
      console.log('🔔 [EMAIL] Variables:', variables);
      console.log('🔔 [EMAIL] Expired entries:', result.expiredEntries);
      try {
        // Fetch student data
        console.log('🔔 [EMAIL] Fetching student data for ID:', variables.studentEnrollmentId);
        const { data: studentData, error: studentError } = await supabase
          .from('student_enrollments')
          .select('full_name, email')
          .eq('id', variables.studentEnrollmentId)
          .single();

        console.log('🔔 [EMAIL] Student data:', studentData);
        console.log('🔔 [EMAIL] Student error:', studentError);

        // Fetch class data with club info
        console.log('🔔 [EMAIL] Fetching class data for ID:', variables.classId);
        const { data: classData, error: classError } = await supabase
          .from('programmed_classes')
          .select('name,start_time,clubs:club_id(name)')
          .eq('id', variables.classId)
          .single();

        console.log('🔔 [EMAIL] Class data:', classData);
        console.log('🔔 [EMAIL] Class error:', classError);

        if (studentData && classData) {
          console.log('🔔 [EMAIL] Invoking Edge Function...');
          const emailPayload = {
            type: 'accepted',
            studentEmail: studentData.email,
            studentName: studentData.full_name,
            className: classData.name,
            classDate: variables.classDate,
            classTime: classData.start_time,
            clubName: (classData.clubs as any)?.name || ''
          };
          console.log('🔔 [EMAIL] Payload:', emailPayload);

          const { data: functionData, error: functionError } = await supabase.functions.invoke('send-waitlist-email', {
            body: emailPayload
          });

          console.log('🔔 [EMAIL] Function response:', functionData);
          console.log('🔔 [EMAIL] Function error:', functionError);

          if (functionError) {
            throw functionError;
          }

          console.log('✅ [EMAIL] Acceptance email sent successfully to:', studentData.email);

          // Send WhatsApp notification
          console.log('📱 [WHATSAPP] Sending acceptance WhatsApp...');
          try {
            const { data: whatsappData, error: whatsappError } = await supabase.functions.invoke('send-waitlist-whatsapp', {
              body: emailPayload
            });
            console.log('📱 [WHATSAPP] Response:', whatsappData);
            if (whatsappError) {
              console.error('📱 [WHATSAPP] Error:', whatsappError);
            } else {
              console.log('✅ [WHATSAPP] Acceptance WhatsApp sent to:', studentData.email);
            }
          } catch (whatsappErr) {
            console.error('📱 [WHATSAPP] Error sending:', whatsappErr);
          }
        } else {
          console.warn('⚠️ [EMAIL] Missing data - student or class not found');
        }
      } catch (emailError) {
        console.error('❌ [EMAIL] Error sending acceptance email:', emailError);
        console.error('❌ [EMAIL] Error details:', JSON.stringify(emailError, null, 2));
        // Don't show error to user - email is not critical
      }

      // Send rejection emails to expired waitlist entries
      if (result.expiredEntries && result.expiredEntries.length > 0) {
        console.log(`🔔 [EMAIL-EXPIRED] Sending rejection emails to ${result.expiredEntries.length} expired entries`);

        try {
          // Fetch class data once (we need it for all emails)
          const { data: classData } = await supabase
            .from('programmed_classes')
            .select('name,start_time,clubs:club_id(name)')
            .eq('id', variables.classId)
            .single();

          if (classData) {
            // Send email to each expired entry
            for (const expiredEntry of result.expiredEntries) {
              try {
                // Fetch student data
                const { data: expiredStudentData } = await supabase
                  .from('student_enrollments')
                  .select('full_name, email')
                  .eq('id', expiredEntry.student_enrollment_id)
                  .single();

                if (expiredStudentData) {
                  console.log('🔔 [EMAIL-EXPIRED] Sending to:', expiredStudentData.email);

                  const rejectionPayload = {
                    type: 'rejected',
                    studentEmail: expiredStudentData.email,
                    studentName: expiredStudentData.full_name,
                    className: classData.name,
                    classDate: variables.classDate,
                    classTime: classData.start_time,
                    clubName: (classData.clubs as any)?.name || ''
                  };

                  await supabase.functions.invoke('send-waitlist-email', {
                    body: rejectionPayload
                  });

                  console.log('✅ [EMAIL-EXPIRED] Email sent to:', expiredStudentData.email);

                  // Send WhatsApp notification
                  try {
                    await supabase.functions.invoke('send-waitlist-whatsapp', {
                      body: rejectionPayload
                    });
                    console.log('✅ [WHATSAPP-EXPIRED] WhatsApp sent to:', expiredStudentData.email);
                  } catch (whatsappErr) {
                    console.error('📱 [WHATSAPP-EXPIRED] Error sending:', whatsappErr);
                  }
                }
              } catch (singleEmailError) {
                console.error('❌ [EMAIL-EXPIRED] Error sending to single recipient:', singleEmailError);
                // Continue with next email even if one fails
              }
            }
            console.log('✅ [EMAIL-EXPIRED] Finished sending all rejection emails');
          }
        } catch (expiredEmailError) {
          console.error('❌ [EMAIL-EXPIRED] Error in expired email process:', expiredEmailError);
          // Don't show error to user - email is not critical
        }
      }
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
      classDate,
      studentEnrollmentId
    }: {
      waitlistId: string;
      classId: string;
      classDate: string;
      studentEnrollmentId?: string;
    }) => {
      // Get student enrollment ID if not provided
      let enrollmentId = studentEnrollmentId;
      if (!enrollmentId) {
        const { data: waitlistData } = await supabase
          .from('class_waitlist')
          .select('student_enrollment_id')
          .eq('id', waitlistId)
          .single();
        enrollmentId = waitlistData?.student_enrollment_id;
      }

      const { error } = await supabase
        .from('class_waitlist')
        .update({
          status: 'rejected',
          rejected_by: profile?.id,
          rejected_at: new Date().toISOString()
        })
        .eq('id', waitlistId);

      if (error) throw error;
      return { success: true, enrollmentId };
    },
    onSuccess: async (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-waitlist', variables.classId, variables.classDate] });
      toast.success('Solicitud rechazada');

      // Send email notification
      console.log('🔔 [EMAIL-REJECT] Starting email notification process...');
      console.log('🔔 [EMAIL-REJECT] Variables:', variables);
      console.log('🔔 [EMAIL-REJECT] Result:', result);
      try {
        if (result.enrollmentId) {
          // Fetch student data
          console.log('🔔 [EMAIL-REJECT] Fetching student data for ID:', result.enrollmentId);
          const { data: studentData, error: studentError } = await supabase
            .from('student_enrollments')
            .select('full_name, email')
            .eq('id', result.enrollmentId)
            .single();

          console.log('🔔 [EMAIL-REJECT] Student data:', studentData);
          console.log('🔔 [EMAIL-REJECT] Student error:', studentError);

          // Fetch class data with club info
          console.log('🔔 [EMAIL-REJECT] Fetching class data for ID:', variables.classId);
          const { data: classData, error: classError } = await supabase
            .from('programmed_classes')
            .select('name,start_time,clubs:club_id(name)')
            .eq('id', variables.classId)
            .single();

          console.log('🔔 [EMAIL-REJECT] Class data:', classData);
          console.log('🔔 [EMAIL-REJECT] Class error:', classError);

          if (studentData && classData) {
            console.log('🔔 [EMAIL-REJECT] Invoking Edge Function...');
            const emailPayload = {
              type: 'rejected',
              studentEmail: studentData.email,
              studentName: studentData.full_name,
              className: classData.name,
              classDate: variables.classDate,
              classTime: classData.start_time,
              clubName: (classData.clubs as any)?.name || ''
            };
            console.log('🔔 [EMAIL-REJECT] Payload:', emailPayload);

            const { data: functionData, error: functionError } = await supabase.functions.invoke('send-waitlist-email', {
              body: emailPayload
            });

            console.log('🔔 [EMAIL-REJECT] Function response:', functionData);
            console.log('🔔 [EMAIL-REJECT] Function error:', functionError);

            if (functionError) {
              throw functionError;
            }

            console.log('✅ [EMAIL-REJECT] Rejection email sent successfully to:', studentData.email);

            // Send WhatsApp notification
            console.log('📱 [WHATSAPP-REJECT] Sending rejection WhatsApp...');
            try {
              const { data: whatsappData, error: whatsappError } = await supabase.functions.invoke('send-waitlist-whatsapp', {
                body: emailPayload
              });
              console.log('📱 [WHATSAPP-REJECT] Response:', whatsappData);
              if (whatsappError) {
                console.error('📱 [WHATSAPP-REJECT] Error:', whatsappError);
              } else {
                console.log('✅ [WHATSAPP-REJECT] Rejection WhatsApp sent to:', studentData.email);
              }
            } catch (whatsappErr) {
              console.error('📱 [WHATSAPP-REJECT] Error sending:', whatsappErr);
            }
          } else {
            console.warn('⚠️ [EMAIL-REJECT] Missing data - student or class not found');
          }
        } else {
          console.warn('⚠️ [EMAIL-REJECT] No enrollment ID found');
        }
      } catch (emailError) {
        console.error('❌ [EMAIL-REJECT] Error sending rejection email:', emailError);
        console.error('❌ [EMAIL-REJECT] Error details:', JSON.stringify(emailError, null, 2));
        // Don't show error to user - email is not critical
      }
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
        .select('id,name,start_time,duration_minutes,trainer:profiles!trainer_profile_id(full_name),trainer_2:profiles!trainer_profile_id_2(full_name)')
        .in('id', classIds);

      if (classesError) {
        console.error('❌ Error fetching class details:', classesError);
        // Return waitlist data without class details
        return waitlistData.map(item => ({
          ...item,
          programmed_class: null
        }));
      }

      // Combine waitlist data with class details and filter by time
      const now = new Date();

      const transformedData = waitlistData
        .map(item => {
          const classData = classesData?.find(c => c.id === item.class_id);
          return {
            ...item,
            programmed_class: classData || null
          };
        })
        .filter(item => {
          // Check if we have class details
          if (!item.programmed_class?.start_time) {
            // If we don't have class details, keep it to be safe
            return true;
          }

          // Calculate class start time + 1 hour
          const classStartDate = new Date(item.class_date + 'T00:00:00');
          const [hours, minutes] = item.programmed_class.start_time.split(':').map(Number);

          classStartDate.setHours(hours, minutes, 0, 0);

          // Add 1 hour to class start time
          classStartDate.setHours(classStartDate.getHours() + 1);

          // For pending: hide after class start + 1 hour
          // For accepted/rejected: hide after class end + 1 hour
          let cutoffTime = classStartDate;

          if (item.status === 'accepted' || item.status === 'rejected') {
            // For accepted/rejected, use class end time + 1 hour
            if (item.programmed_class?.duration_minutes) {
              cutoffTime = new Date(item.class_date + 'T00:00:00');
              cutoffTime.setHours(hours, minutes, 0, 0);
              cutoffTime.setMinutes(cutoffTime.getMinutes() + item.programmed_class.duration_minutes);
              cutoffTime.setHours(cutoffTime.getHours() + 1);
            }
          }

          // Keep if current time is before cutoff
          const shouldKeep = now < cutoffTime;

          console.log('🕐 Filtering waitlist request:', {
            class: item.programmed_class.name,
            status: item.status,
            class_date: item.class_date,
            start_time: item.programmed_class.start_time,
            duration: item.programmed_class?.duration_minutes,
            cutoff_type: item.status === 'pending' ? 'start + 1h' : 'end + 1h',
            cutoff_time: cutoffTime.toISOString(),
            now: now.toISOString(),
            shouldKeep
          });

          return shouldKeep;
        });

      console.log('✅ Waitlist requests with class details (filtered):', transformedData);
      return transformedData;
    },
    enabled: !!profile?.id && !!profile?.email,
  });
};
