import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useWaitlistCount = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["waitlist-count", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;

      // Obtener las clases del trainer
      const { data: trainerClasses, error: classesError } = await supabase
        .from("programmed_classes")
        .select("id")
        .eq("created_by", profile.id)
        .eq("is_active", true);

      if (classesError) throw classesError;
      if (!trainerClasses || trainerClasses.length === 0) return 0;

      const classIds = trainerClasses.map(c => c.id);

      // Contar estudiantes en lista de espera
      const { count, error } = await supabase
        .from("waitlists")
        .select("*", { count: 'exact' })
        .eq("status", "waiting")
        .in("class_id", classIds);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!profile?.id,
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });
};