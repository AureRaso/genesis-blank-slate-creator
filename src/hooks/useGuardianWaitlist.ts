import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface EligibleChild {
  profileId: string;
  enrollmentId: string;
  fullName: string;
  canJoin: boolean;
  reason?: string;
  message?: string;
}

export interface GuardianWaitlistData {
  classData: {
    id: string;
    name: string;
    start_time: string;
    duration_minutes: number;
    max_participants: number;
    is_active: boolean;
    club_id: string;
  } | null;
  eligibleChildren: EligibleChild[];
  error: string | null;
}

/**
 * Hook específico para que guardianes apunten a sus hijos a la waitlist.
 * COMPLETAMENTE SEPARADO del hook useCanJoinWaitlist usado por jugadores.
 * Solo se activa si el usuario es guardian.
 */
export const useGuardianCanJoinWaitlist = (classId: string, classDate: string) => {
  const { profile, user } = useAuth();

  return useQuery({
    queryKey: ['guardian-can-join-waitlist', classId, classDate, user?.id],
    queryFn: async (): Promise<GuardianWaitlistData> => {
      // 1. Obtener datos de la clase
      const { data: classData, error: classError } = await supabase
        .from('programmed_classes')
        .select('id, name, start_time, duration_minutes, max_participants, is_active, club_id')
        .eq('id', classId)
        .single();

      if (classError || !classData) {
        return {
          classData: null,
          eligibleChildren: [],
          error: 'Clase no encontrada'
        };
      }

      if (!classData.is_active) {
        return {
          classData,
          eligibleChildren: [],
          error: 'Esta clase no está activa'
        };
      }

      // 2. Verificar si la clase ya pasó
      const [hours, minutes] = classData.start_time.split(':');
      const classDateTime = new Date(classDate);
      classDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
      const classEndTime = new Date(classDateTime);
      classEndTime.setMinutes(classEndTime.getMinutes() + (classData.duration_minutes || 60));

      if (new Date() >= classEndTime) {
        return {
          classData,
          eligibleChildren: [],
          error: 'Esta clase ya ha finalizado'
        };
      }

      // 3. Obtener hijos del guardian desde account_dependents
      const { data: dependents, error: dependentsError } = await supabase
        .from('account_dependents')
        .select('dependent_profile_id')
        .eq('guardian_profile_id', user?.id);

      if (dependentsError || !dependents || dependents.length === 0) {
        return {
          classData,
          eligibleChildren: [],
          error: 'No tienes hijos registrados en el sistema. Añade a tus hijos desde tu perfil.'
        };
      }

      // 4. Obtener profiles de los hijos
      const childProfileIds = dependents.map(d => d.dependent_profile_id);
      const { data: childProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, club_id')
        .in('id', childProfileIds);

      if (!childProfiles || childProfiles.length === 0) {
        return {
          classData,
          eligibleChildren: [],
          error: 'No se encontraron los perfiles de tus hijos'
        };
      }

      // 5. Para cada hijo, verificar elegibilidad
      const eligibleChildren: EligibleChild[] = [];

      for (const child of childProfiles) {
        // Verificar club
        if (child.club_id !== classData.club_id) {
          eligibleChildren.push({
            profileId: child.id,
            enrollmentId: '',
            fullName: child.full_name,
            canJoin: false,
            reason: 'wrong_club',
            message: 'No pertenece al club de esta clase'
          });
          continue;
        }

        // Obtener enrollment del hijo por su email
        const { data: enrollment } = await supabase
          .from('student_enrollments')
          .select('id, status')
          .eq('email', child.email)
          .eq('club_id', classData.club_id)
          .eq('status', 'active')
          .maybeSingle();

        if (!enrollment) {
          eligibleChildren.push({
            profileId: child.id,
            enrollmentId: '',
            fullName: child.full_name,
            canJoin: false,
            reason: 'no_enrollment',
            message: 'No tiene inscripción activa'
          });
          continue;
        }

        // Verificar si ya está inscrito en la clase
        const { data: participant } = await supabase
          .from('class_participants')
          .select('id')
          .eq('class_id', classId)
          .eq('student_enrollment_id', enrollment.id)
          .eq('status', 'active')
          .maybeSingle();

        if (participant) {
          eligibleChildren.push({
            profileId: child.id,
            enrollmentId: enrollment.id,
            fullName: child.full_name,
            canJoin: false,
            reason: 'already_enrolled',
            message: 'Ya está inscrito en esta clase'
          });
          continue;
        }

        // Verificar si ya está en waitlist
        const { data: waitlistEntry } = await supabase
          .from('class_waitlist')
          .select('id, status')
          .eq('class_id', classId)
          .eq('class_date', classDate)
          .eq('student_enrollment_id', enrollment.id)
          .maybeSingle();

        if (waitlistEntry) {
          if (waitlistEntry.status === 'pending') {
            eligibleChildren.push({
              profileId: child.id,
              enrollmentId: enrollment.id,
              fullName: child.full_name,
              canJoin: false,
              reason: 'already_in_waitlist',
              message: 'Ya está en la lista de espera'
            });
          } else if (waitlistEntry.status === 'accepted') {
            eligibleChildren.push({
              profileId: child.id,
              enrollmentId: enrollment.id,
              fullName: child.full_name,
              canJoin: false,
              reason: 'already_accepted',
              message: 'Ya fue aceptado en esta clase'
            });
          } else {
            // rejected o expired - puede volver a intentar
            eligibleChildren.push({
              profileId: child.id,
              enrollmentId: enrollment.id,
              fullName: child.full_name,
              canJoin: true
            });
          }
          continue;
        }

        // Puede unirse
        eligibleChildren.push({
          profileId: child.id,
          enrollmentId: enrollment.id,
          fullName: child.full_name,
          canJoin: true
        });
      }

      return {
        classData,
        eligibleChildren,
        error: null
      };
    },
    enabled: !!classId && !!classDate && !!user?.id && profile?.role === 'guardian',
  });
};

/**
 * Mutation para que un guardian apunte a su hijo a la waitlist.
 * Usa la misma estructura que useJoinWaitlist pero acepta enrollmentId directamente.
 */
export const useGuardianJoinWaitlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classId,
      classDate,
      enrollmentId,
      childName
    }: {
      classId: string;
      classDate: string;
      enrollmentId: string;
      childName: string;
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
      return { data, childName };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['guardian-can-join-waitlist'] });
      toast.success(`${result.childName} se ha unido a la lista de espera`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al unirse a la lista de espera');
    },
  });
};
