import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface StudentClassParticipation {
  id: string;
  class_id: string;
  payment_status: string;
  payment_method?: string;
  payment_date?: string;
  payment_verified: boolean;
  payment_notes?: string;
  status: string;
  subscription_id?: string;
  created_at: string;
  updated_at: string;
  programmed_class: {
    id: string;
    name: string;
    monthly_price: number;
    start_date: string;
    end_date: string;
    start_time: string;
    duration_minutes: number;
    days_of_week: string[];
    trainer_profile_id: string;
    trainer?: {
      full_name: string;
    };
    club: {
      id: string;
      name: string;
    };
  };
  subscription?: {
    id: string;
    status: string;
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    canceled_at?: string;
  };
}

export interface StudentClassReservation {
  id: string;
  slot_id: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  class_slots: {
    id: string;
    trainer_name: string;
    objective: string;
    level: string;
    day_of_week: string;
    start_time: string;
    duration_minutes: number;
    price_per_player: number;
    clubs: {
      name: string;
    };
  };
}

// Hook para obtener participaciones en clases programadas del estudiante actual
export const useStudentClassParticipations = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['student-class-participations', profile?.id],
    queryFn: async () => {
      if (!profile?.id) throw new Error('Usuario no autenticado');

      // Buscar enrollments que coincidan con el profile_id del usuario
      console.log('Searching enrollments for profile ID:', profile.id);

      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('created_by_profile_id', profile.id);

      console.log('Enrollments query result:', { enrollments, enrollmentsError });

      if (enrollmentsError) throw enrollmentsError;

      if (!enrollments?.length) {
        console.log('No enrollments found for this user');
        return [];
      }

      const enrollmentIds = enrollments.map(e => e.id);

      // Simple query without subscriptions first to debug
      console.log('Querying with enrollment IDs:', enrollmentIds);

      const { data, error } = await supabase
        .from('class_participants')
        .select(`
          *,
          programmed_class:programmed_classes(
            id,
            name,
            monthly_price,
            start_date,
            end_date,
            start_time,
            duration_minutes,
            days_of_week,
            trainer_profile_id,
            trainer:profiles!trainer_profile_id(
              full_name
            ),
            club:clubs(
              id,
              name
            )
          )
        `)
        .in('student_enrollment_id', enrollmentIds)
        .order('created_at', { ascending: false });

      console.log('Class participants query result:', { data, error });

      if (error) throw error;

      // Add null subscription for now (we'll add this back later)
      const dataWithSubscriptions = data?.map(participation => ({
        ...participation,
        subscription: null
      })) || [];

      return dataWithSubscriptions as StudentClassParticipation[];
    },
    enabled: !!profile?.id,
  });
};

// Hook para obtener reservas de class slots del estudiante actual
export const useStudentClassReservations = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['student-class-reservations', profile?.id],
    queryFn: async () => {
      if (!profile?.id) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('class_reservations')
        .select(`
          *,
          class_slots!inner(
            id,
            trainer_name,
            objective,
            level,
            day_of_week,
            start_time,
            duration_minutes,
            price_per_player,
            clubs!inner(name)
          )
        `)
        .eq('player_profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StudentClassReservation[];
    },
    enabled: !!profile?.id,
  });
};