
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// This hook now works with programmed_classes instead of class_templates
type ProgrammedClass = Database["public"]["Tables"]["programmed_classes"]["Row"];
type ProgrammedClassInsert = Database["public"]["Tables"]["programmed_classes"]["Insert"];

export const useClassTemplates = (clubId?: string) => {
  return useQuery({
    queryKey: ["classTemplates", clubId],
    queryFn: async () => {
      let query = supabase
        .from("programmed_classes")
        .select("*")
        .eq("is_active", true);
      
      if (clubId) {
        query = query.eq("club_id", clubId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as ProgrammedClass[];
    },
    enabled: !!clubId,
  });
};

export const useCreateClassTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (templateData: ProgrammedClassInsert) => {
      const { data, error } = await supabase
        .from("programmed_classes")
        .insert(templateData)
        .select()
        .single();
        
      if (error) throw error;
      return data as ProgrammedClass;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classTemplates"] });
    },
  });
};
