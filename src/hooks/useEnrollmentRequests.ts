import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EnrollmentRequest {
  id: string;
  programmed_class_id: string;
  student_profile_id: string;
  requested_at: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  processed_by?: string;
  processed_at?: string;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  programmed_class?: {
    id: string;
    name: string;
    start_time: string;
    days_of_week: string[];
  };
  student_profile?: {
    id: string;
    full_name: string;
    email: string;
  };
}

// Hook para obtener solicitudes de un jugador
export const useMyEnrollmentRequests = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["my-enrollment-requests"],
    queryFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from("class_enrollment_requests")
        .select(`
          *,
          programmed_class:programmed_classes(
            id,
            name,
            start_time,
            days_of_week
          ),
          student_profile:profiles!student_profile_id(
            id,
            full_name,
            email
          )
        `)
        .eq("student_profile_id", userData.user.id)
        .order("requested_at", { ascending: false });

      if (error) throw error;
      return data as EnrollmentRequest[];
    },
    refetchOnWindowFocus: true, // Refetch cuando la ventana vuelve a tener foco
  });

  // Set up Realtime subscription
  const setupRealtimeSubscription = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    console.log('🔌 [EnrollmentRequests] Setting up Realtime subscription for user:', userData.user.id);

    const channel = supabase
      .channel('enrollment-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_enrollment_requests',
          filter: `student_profile_id=eq.${userData.user.id}`
        },
        (payload) => {
          console.log('🔔 [EnrollmentRequests] Realtime change detected:', payload);
          // Invalidar y refetch automáticamente
          queryClient.invalidateQueries({ queryKey: ["my-enrollment-requests"] });
        }
      )
      .subscribe((status) => {
        console.log('🔌 [EnrollmentRequests] Subscription status:', status);
      });

    return channel;
  };

  // Setup and cleanup subscription
  React.useEffect(() => {
    let channel: any;

    setupRealtimeSubscription().then((ch) => {
      channel = ch;
    });

    return () => {
      if (channel) {
        console.log('🔌 [EnrollmentRequests] Cleaning up Realtime subscription');
        supabase.removeChannel(channel);
      }
    };
  }, [queryClient]);

  return query;
};

// Hook para obtener solicitudes de una clase específica
export const useClassEnrollmentRequests = (classId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["class-enrollment-requests", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_enrollment_requests")
        .select(`
          *,
          programmed_class:programmed_classes(
            id,
            name,
            start_time,
            days_of_week
          ),
          student_profile:profiles!student_profile_id(
            id,
            full_name,
            email
          )
        `)
        .eq("programmed_class_id", classId)
        .order("requested_at", { ascending: true });

      if (error) throw error;
      return data as EnrollmentRequest[];
    },
    enabled: !!classId,
    refetchOnWindowFocus: true,
  });

  // Set up Realtime subscription for this specific class
  React.useEffect(() => {
    if (!classId) return;

    console.log('🔌 [ClassEnrollmentRequests] Setting up Realtime subscription for class:', classId);

    const channel = supabase
      .channel(`class-enrollment-requests-${classId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_enrollment_requests',
          filter: `programmed_class_id=eq.${classId}`
        },
        (payload) => {
          console.log('🔔 [ClassEnrollmentRequests] Realtime change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ["class-enrollment-requests", classId] });
        }
      )
      .subscribe((status) => {
        console.log('🔌 [ClassEnrollmentRequests] Subscription status:', status);
      });

    return () => {
      console.log('🔌 [ClassEnrollmentRequests] Cleaning up Realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [classId, queryClient]);

  return query;
};

// Hook para obtener todas las solicitudes pendientes del club
export const useClubPendingEnrollmentRequests = (clubId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["club-pending-enrollment-requests", clubId],
    queryFn: async () => {
      if (!clubId) return [];

      const { data, error } = await supabase
        .from("class_enrollment_requests")
        .select(`
          *,
          programmed_class:programmed_classes!inner(
            id,
            name,
            start_time,
            days_of_week,
            club_id
          ),
          student_profile:profiles!student_profile_id(
            id,
            full_name,
            email
          )
        `)
        .eq("programmed_class.club_id", clubId)
        .eq("status", "pending")
        .order("requested_at", { ascending: true });

      if (error) throw error;
      return data as EnrollmentRequest[];
    },
    enabled: !!clubId,
    refetchOnWindowFocus: true,
  });

  // Set up Realtime subscription for club enrollment requests
  React.useEffect(() => {
    if (!clubId) return;

    console.log('🔌 [ClubEnrollmentRequests] Setting up Realtime subscription for club:', clubId);

    // Note: We can't filter by club_id directly since it's in the programmed_classes table
    // So we listen to all enrollment request changes and invalidate the query
    // The query will re-fetch and apply the club filter
    const channel = supabase
      .channel(`club-enrollment-requests-${clubId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_enrollment_requests'
        },
        (payload) => {
          console.log('🔔 [ClubEnrollmentRequests] Realtime change detected:', payload);
          // Invalidate to re-fetch with club filter
          queryClient.invalidateQueries({ queryKey: ["club-pending-enrollment-requests", clubId] });
        }
      )
      .subscribe((status) => {
        console.log('🔌 [ClubEnrollmentRequests] Subscription status:', status);
      });

    return () => {
      console.log('🔌 [ClubEnrollmentRequests] Cleaning up Realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [clubId, queryClient]);

  return query;
};

// Hook para crear una solicitud de inscripción
export const useCreateEnrollmentRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ classId, notes }: { classId: string; notes?: string }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from("class_enrollment_requests")
        .insert([{
          programmed_class_id: classId,
          student_profile_id: userData.user.id,
          notes: notes,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-enrollment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["class-enrollment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["club-pending-enrollment-requests"] });
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de inscripción ha sido enviada. El profesor te confirmará pronto.",
      });
    },
    onError: (error: any) => {
      console.error('Error creating enrollment request:', error);

      let errorMessage = "No se pudo enviar la solicitud.";
      if (error.code === '23505') {
        errorMessage = "Ya tienes una solicitud pendiente para esta clase.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

// Hook para aceptar una solicitud
export const useAcceptEnrollmentRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Usuario no autenticado');

      // 1. Obtener la solicitud para tener los datos del estudiante y la clase
      const { data: request, error: requestError } = await supabase
        .from("class_enrollment_requests")
        .select(`
          *,
          programmed_class:programmed_classes(id, name, club_id)
        `)
        .eq("id", requestId)
        .single();

      if (requestError) throw requestError;
      if (!request) throw new Error('Solicitud no encontrada');

      // 2. Obtener el perfil del estudiante para crear student_enrollment
      const { data: studentProfile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email, club_id")
        .eq("id", request.student_profile_id)
        .single();

      if (profileError) throw profileError;
      if (!studentProfile) throw new Error('Perfil del estudiante no encontrado');

      // 3. Crear o verificar student_enrollment
      let studentEnrollmentId: string;

      const { data: existingEnrollment } = await supabase
        .from("student_enrollments")
        .select("id")
        .eq("email", studentProfile.email)
        .eq("club_id", request.programmed_class.club_id)
        .single();

      if (existingEnrollment) {
        studentEnrollmentId = existingEnrollment.id;
      } else {
        const { data: newEnrollment, error: enrollmentError } = await supabase
          .from("student_enrollments")
          .insert([{
            full_name: studentProfile.full_name,
            email: studentProfile.email,
            club_id: request.programmed_class.club_id,
            created_by_profile_id: userData.user.id
          }])
          .select()
          .single();

        if (enrollmentError) throw enrollmentError;
        if (!newEnrollment) throw new Error('Error creando student_enrollment');
        studentEnrollmentId = newEnrollment.id;
      }

      // 4. Crear class_participant
      const { error: participantError } = await supabase
        .from("class_participants")
        .insert([{
          class_id: request.programmed_class_id,
          student_enrollment_id: studentEnrollmentId,
          status: 'active'
        }]);

      if (participantError) {
        // Si ya existe el participante, ignorar el error
        if (participantError.code !== '23505') {
          throw participantError;
        }
      }

      // 5. Actualizar la solicitud a aceptada
      const { data, error } = await supabase
        .from("class_enrollment_requests")
        .update({
          status: 'accepted',
          processed_by: userData.user.id,
          processed_at: new Date().toISOString()
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-enrollment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["club-pending-enrollment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["programmed-classes"] });
      queryClient.invalidateQueries({ queryKey: ["class-participants"] });
      toast({
        title: "Solicitud aceptada",
        description: "El alumno ha sido inscrito en la clase correctamente.",
      });
    },
    onError: (error: any) => {
      console.error('Error accepting request:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo aceptar la solicitud.",
        variant: "destructive",
      });
    },
  });
};

// Hook para rechazar una solicitud
export const useRejectEnrollmentRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason?: string }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from("class_enrollment_requests")
        .update({
          status: 'rejected',
          processed_by: userData.user.id,
          processed_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-enrollment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["club-pending-enrollment-requests"] });
      toast({
        title: "Solicitud rechazada",
        description: "La solicitud ha sido rechazada.",
      });
    },
    onError: (error) => {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "No se pudo rechazar la solicitud.",
        variant: "destructive",
      });
    },
  });
};

// Hook para cancelar propia solicitud (jugador)
export const useCancelEnrollmentRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase
        .from("class_enrollment_requests")
        .update({ status: 'cancelled' })
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-enrollment-requests"] });
      toast({
        title: "Solicitud cancelada",
        description: "Tu solicitud ha sido cancelada.",
      });
    },
    onError: (error) => {
      console.error('Error cancelling request:', error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la solicitud.",
        variant: "destructive",
      });
    },
  });
};
