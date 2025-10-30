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

      // Si hay muchas clases, dividir en lotes para evitar URLs demasiado largas
      // URL límite aproximado: 2000 caracteres, cada UUID: ~36 chars
      const BATCH_SIZE = 50; // ~1800 chars por lote, seguro
      let totalCount = 0;

      for (let i = 0; i < classIds.length; i += BATCH_SIZE) {
        const batch = classIds.slice(i, i + BATCH_SIZE);

        const { count, error } = await supabase
          .from("waitlists")
          .select("*", { count: 'exact' })
          .eq("status", "waiting")
          .in("class_id", batch);

        if (error) throw error;
        totalCount += count || 0;
      }

      return totalCount;
    },
    enabled: !!profile?.id,
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });
};