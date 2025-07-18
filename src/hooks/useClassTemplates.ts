
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ClassTemplate = Database["public"]["Tables"]["class_templates"]["Row"];
type ClassTemplateInsert = Database["public"]["Tables"]["class_templates"]["Insert"];

export const useClassTemplates = (clubId?: string) => {
  return useQuery({
    queryKey: ["classTemplates", clubId],
    queryFn: async () => {
      let query = supabase
        .from("class_templates")
        .select("*")
        .eq("is_active", true);
      
      if (clubId) {
        query = query.eq("club_id", clubId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as ClassTemplate[];
    },
    enabled: !!clubId,
  });
};

export const useCreateClassTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (templateData: ClassTemplateInsert) => {
      const { data, error } = await supabase
        .from("class_templates")
        .insert(templateData)
        .select()
        .single();
        
      if (error) throw error;
      return data as ClassTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classTemplates"] });
    },
  });
};
