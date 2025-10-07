import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ============================================
// LEGACY WAITLIST HOOKS (for existing features)
// ============================================

export interface WaitlistEntry {
  id: string;
  class_id: string;
  user_id: string;
  joined_at: string;
  notified_at?: string;
  status: 'waiting' | 'notified' | 'accepted' | 'skipped' | 'expired';
  position: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WaitlistWithDetails extends WaitlistEntry {
  programmed_classes?: {
    name: string;
    start_time: string;
    days_of_week: string[];
  };
  profiles?: {
    full_name: string;
    email: string;
  };
}

// Hook para obtener la lista de espera de una clase específica
export const useClassWaitlistOld = (classId: string) => {
  return useQuery({
    queryKey: ["class-waitlist-old", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waitlists")
        .select(`
          *
        `)
        .eq("class_id", classId)
        .in("status", ["waiting", "notified"])
        .order("position", { ascending: true });

      if (error) throw error;
      return data as WaitlistEntry[];
    },
    enabled: !!classId,
  });
};

// Hook para obtener la lista de espera con detalles de usuarios (para administradores)
export const useClassWaitlistWithDetails = (classId: string) => {
  return useQuery({
    queryKey: ["class-waitlist-details", classId],
    queryFn: async () => {
      // Primero obtenemos la lista de espera
      const { data: waitlistData, error: waitlistError } = await supabase
        .from("waitlists")
        .select("*")
        .eq("class_id", classId)
        .in("status", ["waiting", "notified"])
        .order("position", { ascending: true });

      if (waitlistError) throw waitlistError;

      if (!waitlistData || waitlistData.length === 0) {
        return [];
      }

      // Luego obtenemos los detalles de los usuarios
      const userIds = waitlistData.map(w => w.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Combinamos los datos
      const waitlistWithDetails = waitlistData.map(waitlistEntry => ({
        ...waitlistEntry,
        profiles: profilesData?.find(profile => profile.id === waitlistEntry.user_id) || null
      }));

      return waitlistWithDetails as WaitlistWithDetails[];
    },
    enabled: !!classId,
  });
};

// Hook para obtener la posición del usuario en la lista de espera
export const useUserWaitlistPosition = (classId: string, userId?: string) => {
  return useQuery({
    queryKey: ["user-waitlist-position", classId, userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("waitlists")
        .select("*")
        .eq("class_id", classId)
        .eq("user_id", userId)
        .in("status", ["waiting", "notified"])
        .single();

      if (error && error.code === 'PGRST116') {
        // No encontrado, no está en lista de espera
        return null;
      }
      if (error) throw error;

      return data as WaitlistEntry;
    },
    enabled: !!classId && !!userId,
  });
};

// Hook para unirse a una lista de espera
export const useJoinWaitlist = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ classId, userId }: { classId: string; userId: string }) => {
      // El position se calcula automáticamente en el trigger
      const { data, error } = await supabase
        .from("waitlists")
        .insert({
          class_id: classId,
          user_id: userId,
          status: "waiting",
          position: 0 // Se actualizará automáticamente por el trigger
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["class-waitlist-old"] });
      queryClient.invalidateQueries({ queryKey: ["user-waitlist-position"] });

      toast({
        title: "¡Te has unido a la lista de espera!",
        description: `Estás en la posición ${data.position}. Te notificaremos cuando haya una plaza disponible.`,
      });
    },
    onError: (error: any) => {
      console.error("Error joining waitlist:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo unir a la lista de espera",
        variant: "destructive",
      });
    },
  });
};

// Hook para salir de una lista de espera
export const useLeaveWaitlist = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ classId, userId }: { classId: string; userId: string }) => {
      const { error } = await supabase
        .from("waitlists")
        .delete()
        .eq("class_id", classId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-waitlist-old"] });
      queryClient.invalidateQueries({ queryKey: ["user-waitlist-position"] });

      toast({
        title: "Has salido de la lista de espera",
        description: "Ya no recibirás notificaciones para esta clase.",
      });
    },
    onError: (error: any) => {
      console.error("Error leaving waitlist:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo salir de la lista de espera",
        variant: "destructive",
      });
    },
  });
};

// Hook para obtener estadísticas de capacidad de una clase
export const useClassCapacity = (classId: string) => {
  return useQuery({
    queryKey: ["class-capacity", classId],
    queryFn: async () => {
      // Obtener información de la clase con participantes activos
      const { data: classData, error: classError } = await supabase
        .from("programmed_classes")
        .select(`
          max_participants,
          participants:class_participants!inner(
            id,
            status,
            student_enrollment:student_enrollments(
              id,
              full_name,
              status
            )
          )
        `)
        .eq("id", classId)
        .eq("participants.status", "active")
        .maybeSingle();

      if (classError) {
        console.error("Error fetching class data:", classError);
        throw classError;
      }

      // Si no hay datos de la clase, obtener solo la info básica
      if (!classData) {
        const { data: basicClassData, error: basicError } = await supabase
          .from("programmed_classes")
          .select("max_participants")
          .eq("id", classId)
          .single();

        if (basicError) throw basicError;

        // Obtener lista de espera
        const { data: waitlist, error: waitlistError } = await supabase
          .from("waitlists")
          .select("id")
          .eq("class_id", classId)
          .in("status", ["waiting", "notified"]);

        if (waitlistError) {
          console.error("Error fetching waitlist:", waitlistError);
          throw waitlistError;
        }

        const maxParticipants = basicClassData.max_participants || 8;
        const currentParticipants = 0;
        const waitlistCount = waitlist?.length || 0;
        const availableSpots = Math.max(0, maxParticipants - currentParticipants);
        const isFull = currentParticipants >= maxParticipants;

        return {
          maxParticipants,
          currentParticipants,
          availableSpots,
          waitlistCount,
          isFull,
          participants: []
        };
      }

      // Obtener lista de espera
      const { data: waitlist, error: waitlistError } = await supabase
        .from("waitlists")
        .select("id")
        .eq("class_id", classId)
        .in("status", ["waiting", "notified"]);

      if (waitlistError) {
        console.error("Error fetching waitlist:", waitlistError);
        throw waitlistError;
      }

      const maxParticipants = classData.max_participants || 8;
      const activeParticipants = classData.participants?.filter(
        p => p.status === 'active' && p.student_enrollment?.status === 'active'
      ) || [];
      const currentParticipants = activeParticipants.length;
      const waitlistCount = waitlist?.length || 0;
      const availableSpots = Math.max(0, maxParticipants - currentParticipants);
      const isFull = currentParticipants >= maxParticipants;

      return {
        maxParticipants,
        currentParticipants,
        availableSpots,
        waitlistCount,
        isFull,
        participants: activeParticipants
      };
    },
    enabled: !!classId,
  });
};

// Hook para notificar manualmente a la lista de espera (solo administradores)
export const useNotifyWaitlist = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ classId, availableSpots = 1 }: { classId: string; availableSpots?: number }) => {
      const { data, error } = await supabase.functions.invoke("notify-waitlist", {
        body: { classId, availableSpots }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Notificaciones enviadas",
        description: "Se han enviado las notificaciones a la lista de espera.",
      });
    },
    onError: (error: any) => {
      console.error("Error notifying waitlist:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron enviar las notificaciones",
        variant: "destructive",
      });
    },
  });
};
