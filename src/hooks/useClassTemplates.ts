
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type ClassTemplate = Database["public"]["Tables"]["class_templates"]["Row"];
type ClassTemplateInsert = Database["public"]["Tables"]["class_templates"]["Insert"];

export const useClassTemplates = (clubId?: string) => {
  return useQuery({
    queryKey: ["classTemplates", clubId],
    queryFn: async () => {
      try {
        let query = supabase
          .from("class_templates")
          .select("*")
          .eq("is_active", true);
        
        if (clubId) {
          query = query.eq("club_id", clubId);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching class templates:", error);
          throw error;
        }
        
        console.log("Class templates fetched successfully:", data?.length || 0);
        return data as ClassTemplate[];
      } catch (error) {
        console.error("Error in useClassTemplates:", error);
        return []; // Retornar array vacío en caso de error
      }
    },
    enabled: !!clubId,
    retry: false, // No reintentar automáticamente
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useCreateClassTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (templateData: ClassTemplateInsert) => {
      console.log("Creating class template:", templateData);
      
      const { data, error } = await supabase
        .from("class_templates")
        .insert(templateData)
        .select()
        .single();
        
      if (error) {
        console.error("Error creating class template:", error);
        throw error;
      }
      
      console.log("Class template created successfully:", data);
      return data as ClassTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classTemplates"] });
      toast({
        title: "Plantilla creada",
        description: "La plantilla de clase se ha creado correctamente.",
      });
    },
    onError: (error: any) => {
      console.error("Error in createClassTemplate mutation:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la plantilla: " + error.message,
        variant: "destructive",
      });
    },
  });
};
