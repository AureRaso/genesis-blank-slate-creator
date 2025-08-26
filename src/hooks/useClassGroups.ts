import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type ClassGroup = Database["public"]["Tables"]["class_groups"]["Row"];
type GroupMember = Database["public"]["Tables"]["group_members"]["Row"];

export type ClassGroupWithMembers = ClassGroup & {
  members: (GroupMember & {
    student_enrollment: {
      id: string;
      full_name: string;
      email: string;
      level: number;
    };
  })[];
};

export type CreateClassGroupData = {
  name: string;
  level: Database["public"]["Enums"]["class_level"];
  description?: string;
  club_id: string;
};

export type CreateGroupMemberData = {
  group_id: string;
  student_enrollment_id: string;
};

// Hook to fetch class groups
export const useClassGroups = (clubId?: string) => {
  return useQuery({
    queryKey: ["class-groups", clubId],
    queryFn: async () => {
      let query = supabase
        .from("class_groups")
        .select(`
          *,
          members:group_members(
            *,
            student_enrollment:student_enrollments(
              id,
              full_name,
              email,
              level
            )
          )
        `)
        .eq("is_active", true)
        .order("name");

      if (clubId) {
        query = query.eq("club_id", clubId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ClassGroupWithMembers[];
    },
  });
};

// Hook to fetch class groups for admin (groups from clubs they created)
export const useAdminClassGroups = () => {
  return useQuery({
    queryKey: ["admin-class-groups"],
    queryFn: async () => {
      console.log('Fetching admin class groups...');
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Usuario no autenticado');

      // First, get clubs created by this admin
      const { data: adminClubs, error: clubsError } = await supabase
        .from('clubs')
        .select('id')
        .eq('created_by_profile_id', userData.user.id);

      if (clubsError) throw clubsError;
      
      if (!adminClubs || adminClubs.length === 0) {
        return [];
      }

      const clubIds = adminClubs.map(club => club.id);

      // Get class groups from these clubs
      const { data: groups, error: groupsError } = await supabase
        .from("class_groups")
        .select(`
          *,
          members:group_members(
            *,
            student_enrollment:student_enrollments(
              id,
              full_name,
              email,
              level
            )
          )
        `)
        .in("club_id", clubIds)
        .eq("is_active", true)
        .order("name");

      if (groupsError) throw groupsError;

      console.log('Admin class groups fetched:', groups);
      return groups as ClassGroupWithMembers[];
    },
  });
};

// Hook to create a class group
export const useCreateClassGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateClassGroupData) => {
      const { data: result, error } = await supabase
        .from("class_groups")
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
      queryClient.invalidateQueries({ queryKey: ["class-groups"] });
      queryClient.invalidateQueries({ queryKey: ["admin-class-groups"] });
      toast({
        title: "Grupo creado",
        description: "El grupo se ha creado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo crear el grupo: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to update a class group
export const useUpdateClassGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateClassGroupData> }) => {
      const { data: result, error } = await supabase
        .from("class_groups")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-groups"] });
      toast({
        title: "Grupo actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el grupo: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to delete a class group
export const useDeleteClassGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("class_groups")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-groups"] });
      toast({
        title: "Grupo eliminado",
        description: "El grupo se ha eliminado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el grupo: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to add student to group
export const useAddGroupMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateGroupMemberData) => {
      const { data: result, error } = await supabase
        .from("group_members")
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-groups"] });
      toast({
        title: "Alumno agregado",
        description: "El alumno se ha agregado al grupo correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo agregar el alumno al grupo: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to remove student from group
export const useRemoveGroupMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ groupId, studentId }: { groupId: string; studentId: string }) => {
      const { error } = await supabase
        .from("group_members")
        .update({ is_active: false })
        .eq("group_id", groupId)
        .eq("student_enrollment_id", studentId);

      if (error) throw error;
      return { groupId, studentId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-groups"] });
      toast({
        title: "Alumno removido",
        description: "El alumno se ha removido del grupo correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo remover el alumno del grupo: " + error.message,
        variant: "destructive",
      });
    },
  });
};