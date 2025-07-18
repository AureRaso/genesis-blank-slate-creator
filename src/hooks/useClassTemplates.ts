import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type ClassTemplate = Database["public"]["Tables"]["class_templates"]["Row"];
type ClassGroup = Database["public"]["Tables"]["class_groups"]["Row"];

export type ClassTemplateWithGroup = ClassTemplate & {
  group?: ClassGroup;
  trainer_profile: {
    full_name: string;
    email: string;
  };
  club: {
    name: string;
  };
};

export type CreateClassTemplateData = {
  name: string;
  group_id?: string;
  level: Database["public"]["Enums"]["class_level"];
  trainer_profile_id: string;
  club_id: string;
  duration_minutes?: number;
  max_students?: number;
  price_per_student?: number;
  court_number?: number;
  objective?: string;
};

// Hook to fetch class templates
export const useClassTemplates = (clubId?: string) => {
  return useQuery({
    queryKey: ["class-templates", clubId],
    queryFn: async () => {
      let query = supabase
        .from("class_templates")
        .select(`
          *,
          group:class_groups(*),
          trainer_profile:profiles!trainer_profile_id(
            full_name,
            email
          ),
          club:clubs(name)
        `)
        .eq("is_active", true)
        .order("name");

      if (clubId) {
        query = query.eq("club_id", clubId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ClassTemplateWithGroup[];
    },
  });
};

// Hook to fetch a single class template
export const useClassTemplate = (id: string) => {
  return useQuery({
    queryKey: ["class-template", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_templates")
        .select(`
          *,
          group:class_groups(*),
          trainer_profile:profiles!trainer_profile_id(
            full_name,
            email
          ),
          club:clubs(name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as ClassTemplateWithGroup;
    },
    enabled: !!id,
  });
};

// Hook to create a class template
export const useCreateClassTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateClassTemplateData) => {
      const { data: result, error } = await supabase
        .from("class_templates")
        .insert([{
          ...data,
          created_by_profile_id: (await supabase.auth.getUser()).data.user?.id!
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-templates"] });
      toast({
        title: "Plantilla creada",
        description: "La plantilla de clase se ha creado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo crear la plantilla: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to update a class template
export const useUpdateClassTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateClassTemplateData> }) => {
      const { data: result, error } = await supabase
        .from("class_templates")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-templates"] });
      toast({
        title: "Plantilla actualizada",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la plantilla: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to delete a class template
export const useDeleteClassTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("class_templates")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-templates"] });
      toast({
        title: "Plantilla eliminada",
        description: "La plantilla se ha eliminado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la plantilla: " + error.message,
        variant: "destructive",
      });
    },
  });
};