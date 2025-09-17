import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface StudentEnrollment {
  id: string;
  trainer_profile_id: string;
  club_id: string;
  created_by_profile_id: string;
  full_name: string;
  email: string;
  phone: string;
  level: number;
  weekly_days: string[];
  preferred_times: string[];
  enrollment_period: string;
  enrollment_date?: string;
  expected_end_date?: string;
  course?: string;
  discount_1?: number;
  discount_2?: number;
  first_payment?: number;
  payment_method?: string;
  observations?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentForm {
  id: string;
  token: string;
  trainer_profile_id: string;
  club_id: string;
  student_data?: any;
  expires_at: string;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CreateStudentEnrollmentData {
  full_name: string;
  email: string;
  phone: string;
  level: number;
  weekly_days: string[];
  preferred_times: string[];
  enrollment_period: string;
  club_id: string;
  enrollment_date?: string;
  expected_end_date?: string;
  course?: string;
  discount_1?: number;
  discount_2?: number;
  first_payment?: number;
  payment_method?: string;
  observations?: string;
}

export const useStudentEnrollments = () => {
  return useQuery({
    queryKey: ["student-enrollments"],
    queryFn: async () => {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error("No authenticated user");

      // Get the user's profile to check if they're a trainer
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", profile.user.id)
        .single();

      if (profileError) throw profileError;

      let query = supabase.from("student_enrollments").select("*");

      // If user is a trainer, get all students from their assigned clubs
      if (userProfile.role === 'trainer') {
        // Get trainer's club assignments
        const { data: trainerClubs, error: clubsError } = await supabase
          .from("trainer_clubs")
          .select("club_id")
          .eq("trainer_profile_id", profile.user.id);

        if (clubsError) throw clubsError;

        const clubIds = trainerClubs.map(tc => tc.club_id);
        
        if (clubIds.length > 0) {
          query = query.in("club_id", clubIds);
        } else {
          // If trainer has no assigned clubs, return empty array
          return [];
        }
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data as StudentEnrollment[];
    },
  });
};

export const useAdminStudentEnrollments = (clubId?: string) => {
  return useQuery({
    queryKey: ["admin-student-enrollments", clubId],
    queryFn: async () => {
      console.log('Fetching admin student enrollments...');
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Usuario no autenticado');

      // First, get clubs created by this admin
      let clubQuery = supabase
        .from('clubs')
        .select('id')
        .eq('created_by_profile_id', userData.user.id);

      // If clubId is provided, filter by it
      if (clubId) {
        clubQuery = clubQuery.eq('id', clubId);
      }

      const { data: adminClubs, error: clubsError } = await clubQuery;

      if (clubsError) throw clubsError;
      
      if (!adminClubs || adminClubs.length === 0) {
        return [];
      }

      const clubIds = adminClubs.map(club => club.id);

      // Get trainers associated with these clubs
      const { data: trainerClubsData, error: trainerClubsError } = await supabase
        .from('trainer_clubs')
        .select('trainer_profile_id')
        .in('club_id', clubIds);

      if (trainerClubsError) throw trainerClubsError;

      const trainerProfileIds = trainerClubsData ? [...new Set(trainerClubsData.map(tc => tc.trainer_profile_id))] : [];

      // Build query to get all student enrollments from:
      // 1. Students created by trainers assigned to admin's clubs
      // 2. Students created directly by the admin in their clubs
      let studentsQuery = supabase
        .from('student_enrollments')
        .select('*');

      // Create conditions for both cases
      if (trainerProfileIds.length > 0) {
        // Include students created by trainers OR created directly by admin
        studentsQuery = studentsQuery.or(`trainer_profile_id.in.(${trainerProfileIds.join(',')}),created_by_profile_id.eq.${userData.user.id}`);
      } else {
        // Only include students created directly by admin
        studentsQuery = studentsQuery.eq('created_by_profile_id', userData.user.id);
      }

      // Filter by admin's clubs
      studentsQuery = studentsQuery.in('club_id', clubIds);

      // If specific clubId is provided, filter further
      if (clubId) {
        studentsQuery = studentsQuery.eq('club_id', clubId);
      }

      const { data: students, error: studentsError } = await studentsQuery
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;

      console.log('Admin student enrollments fetched:', students);
      return students as StudentEnrollment[];
    },
  });
};

export const useCreateStudentEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enrollmentData: CreateStudentEnrollmentData) => {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error("No authenticated user");

      // Get trainer's club assignment if not provided in enrollmentData
      let clubId = enrollmentData.club_id;
      
      if (!clubId) {
        const { data: trainerClubs, error: clubsError } = await supabase
          .from("trainer_clubs")
          .select("club_id")
          .eq("trainer_profile_id", profile.user.id)
          .limit(1)
          .single();

        if (clubsError) throw clubsError;
        clubId = trainerClubs.club_id;
      }

      // First create the student user account
      try {
        const { data: createUserResponse, error: createUserError } = await supabase.functions.invoke('create-student-user', {
          body: {
            email: enrollmentData.email,
            full_name: enrollmentData.full_name,
            club_id: clubId
          }
        });

        if (createUserError) {
          console.error("Error creating student user:", createUserError);
          throw new Error("Error al crear la cuenta del alumno");
        }

        console.log("Student user created:", createUserResponse);
      } catch (userCreationError: any) {
        console.error("User creation failed:", userCreationError);
        // Continue with enrollment creation even if user creation fails
        // The user might already exist or there might be other issues
      }

      // Then create the enrollment
      const { data, error } = await supabase
        .from("student_enrollments")
        .insert({
          ...enrollmentData,
          club_id: clubId,
          trainer_profile_id: profile.user.id,
          created_by_profile_id: profile.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["student-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-student-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast({
        title: "Inscripción creada",
        description: `${data.full_name} ha sido inscrito correctamente. Puede acceder con su email y contraseña: 123456`,
        duration: 8000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useCreateEnrollmentForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ club_id }: { club_id: string }) => {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from("enrollment_forms")
        .insert({
          trainer_profile_id: profile.user.id,
          club_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as EnrollmentForm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment-forms"] });
      toast({
        title: "Enlace creado",
        description: "Se ha generado un enlace único para el alumno",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useEnrollmentFormByToken = (token: string) => {
  return useQuery({
    queryKey: ["enrollment-form", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollment_forms")
        .select("*")
        .eq("token", token)
        .eq("status", "pending")
        .single();

      if (error) throw error;
      return data as EnrollmentForm;
    },
    enabled: !!token,
  });
};

export const useCompleteEnrollmentForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ token, studentData }: { token: string; studentData: any }) => {
      // First get the enrollment form data
      const { data: formData, error: formError } = await supabase
        .from("enrollment_forms")
        .select("*")
        .eq("token", token)
        .single();

      if (formError) throw formError;

      // Create the actual enrollment with the club from the enrollment form
      const { data, error } = await supabase
        .from("student_enrollments")
        .insert({
          ...studentData,
          trainer_profile_id: formData.trainer_profile_id,
          club_id: formData.club_id, // Always use the club from the enrollment form
          created_by_profile_id: formData.trainer_profile_id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update the enrollment form status
      await supabase
        .from("enrollment_forms")
        .update({
          status: "completed",
          student_data: studentData,
          completed_at: new Date().toISOString(),
        })
        .eq("token", token);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["enrollment-forms"] });
      toast({
        title: "Inscripción completada",
        description: "Tu inscripción ha sido enviada correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteStudentEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("student_enrollments")
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-student-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast({
        title: "Alumno eliminado",
        description: "La inscripción del alumno ha sido eliminada correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la inscripción del alumno: " + error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateStudentEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateStudentEnrollmentData> }) => {
      const { error } = await supabase
        .from("student_enrollments")
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-student-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast({
        title: "Alumno actualizado",
        description: "Los datos del alumno han sido actualizados correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar los datos del alumno: " + error.message,
        variant: "destructive",
      });
    },
  });
};