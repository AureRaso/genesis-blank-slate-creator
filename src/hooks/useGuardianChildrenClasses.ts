import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChildClassParticipation {
  id: string;
  child_id: string;
  child_name: string;
  class_id: string;
  status: string;
  payment_status: string;
  payment_verified: boolean;
  payment_notes: string | null;
  programmed_class: {
    id: string;
    name: string;
    days_of_week: string[];
    start_time: string;
    duration_minutes: number;
    monthly_price: string;
    club: {
      name: string;
    };
    trainer: {
      full_name: string;
    } | null;
  };
  subscription: {
    id: string;
    status: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
  } | null;
}

export const useGuardianChildrenClasses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['guardian-children-classes', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('No user authenticated');
      }

      console.log('🔍 Fetching classes for guardian children:', user.id);

      // 1. Obtener los IDs de los hijos
      const { data: dependents, error: dependentsError } = await supabase
        .from('account_dependents')
        .select('dependent_profile_id')
        .eq('guardian_profile_id', user.id);

      if (dependentsError) {
        console.error('❌ Error fetching dependents:', dependentsError);
        throw dependentsError;
      }

      if (!dependents || dependents.length === 0) {
        console.log('⚠️ No children found');
        return [];
      }

      const childrenIds = dependents.map(d => d.dependent_profile_id);
      console.log('✅ Found children IDs:', childrenIds);

      // 2. Obtener las participaciones en clases de los hijos
      const { data: participations, error: participationsError } = await supabase
        .from('student_class_participations')
        .select(`
          id,
          student_profile_id,
          class_id,
          status,
          payment_status,
          payment_verified,
          payment_notes,
          programmed_classes (
            id,
            name,
            days_of_week,
            start_time,
            duration_minutes,
            monthly_price,
            clubs (
              name
            ),
            profiles!programmed_classes_trainer_id_fkey (
              full_name
            )
          ),
          subscriptions (
            id,
            status,
            current_period_end,
            cancel_at_period_end
          )
        `)
        .in('student_profile_id', childrenIds)
        .order('created_at', { ascending: false });

      if (participationsError) {
        console.error('❌ Error fetching participations:', participationsError);
        throw participationsError;
      }

      console.log('✅ Found participations:', participations?.length || 0);

      // 3. Obtener los nombres de los hijos
      const { data: children, error: childrenError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', childrenIds);

      if (childrenError) {
        console.error('❌ Error fetching children profiles:', childrenError);
        throw childrenError;
      }

      // 4. Combinar datos
      const result: ChildClassParticipation[] = (participations || []).map(p => {
        const child = children?.find(c => c.id === p.student_profile_id);
        const programmedClass = Array.isArray(p.programmed_classes)
          ? p.programmed_classes[0]
          : p.programmed_classes;
        const subscription = Array.isArray(p.subscriptions)
          ? p.subscriptions[0]
          : p.subscriptions;

        return {
          id: p.id,
          child_id: p.student_profile_id,
          child_name: child?.full_name || 'Desconocido',
          class_id: p.class_id,
          status: p.status,
          payment_status: p.payment_status,
          payment_verified: p.payment_verified,
          payment_notes: p.payment_notes,
          programmed_class: {
            id: programmedClass.id,
            name: programmedClass.name,
            days_of_week: programmedClass.days_of_week,
            start_time: programmedClass.start_time,
            duration_minutes: programmedClass.duration_minutes,
            monthly_price: programmedClass.monthly_price,
            club: {
              name: Array.isArray(programmedClass.clubs)
                ? programmedClass.clubs[0]?.name
                : programmedClass.clubs?.name
            },
            trainer: Array.isArray(programmedClass.profiles)
              ? programmedClass.profiles[0]
              : programmedClass.profiles
          },
          subscription: subscription ? {
            id: subscription.id,
            status: subscription.status,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end
          } : null
        };
      });

      console.log('✅ Processed classes:', result.length);
      return result;
    },
    enabled: !!user?.id,
  });
};
