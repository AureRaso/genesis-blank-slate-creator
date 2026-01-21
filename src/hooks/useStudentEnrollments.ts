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
  // Club information
  club_name?: string;
  club_status?: string;
  // Trainer information (who created the enrollment)
  trainer_name?: string;
  // Trainers who teach classes to this student
  class_trainer_ids?: string[];
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

      let query = supabase.from("student_enrollments").select(`
        *,
        clubs(name, status)
      `)
      .neq("status", "inactive"); // Filter out archived students

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
          // Get ALL students from the trainer's assigned clubs, not just those they created
          query = query.in("club_id", clubIds);
        } else {
          // If trainer has no assigned clubs, return empty array
          return [];
        }
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform data to include club information
      const studentsWithClubs = (data || []).map(student => ({
        ...student,
        club_name: student.clubs?.name || 'Club desconocido',
        club_status: student.clubs?.status || null,
      }));

      return studentsWithClubs as StudentEnrollment[];
    },
  });
};

export const useAdminStudentEnrollments = (clubId?: string) => {
  return useQuery({
    queryKey: ["admin-student-enrollments", clubId],
    queryFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Usuario no autenticado');

      // Get user profile to check role
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single();

      if (profileError) throw profileError;

      let clubIds: string[] = [];

      // If clubId is provided directly (e.g., from superadmin selector), use it
      if (clubId) {
        clubIds = [clubId];
      } else if (userProfile.role === 'superadmin') {
        // Superadmin with no specific club selected - get ALL their assigned clubs
        const { data: superadminClubs, error: superadminClubsError } = await supabase
          .from('admin_clubs')
          .select('club_id')
          .eq('admin_profile_id', userData.user.id);

        if (superadminClubsError) throw superadminClubsError;

        if (!superadminClubs || superadminClubs.length === 0) {
          return [];
        }

        clubIds = superadminClubs.map(ac => ac.club_id);
      } else {
        // Regular admin - get clubs created by this admin (original behavior)
        const { data: adminClubs, error: clubsError } = await supabase
          .from('clubs')
          .select('id')
          .eq('created_by_profile_id', userData.user.id);

        if (clubsError) throw clubsError;

        if (!adminClubs || adminClubs.length === 0) {
          return [];
        }

        clubIds = adminClubs.map(club => club.id);
      }

      // Get trainers associated with these clubs
      const { data: trainerClubsData, error: trainerClubsError } = await supabase
        .from('trainer_clubs')
        .select('trainer_profile_id')
        .in('club_id', clubIds);

      if (trainerClubsError) throw trainerClubsError;

      const trainerProfileIds = trainerClubsData ? [...new Set(trainerClubsData.map(tc => tc.trainer_profile_id))] : [];

      // Build query to get ALL student enrollments from admin's clubs
      // This includes:
      // 1. Students created by trainers assigned to admin's clubs
      // 2. Students created directly by the admin
      // 3. Students who self-registered via enrollment links
      let studentsQuery = supabase
        .from('student_enrollments')
        .select(`
          *,
          clubs(name, status),
          trainer:profiles!trainer_profile_id(id, full_name)
        `)
        .in('club_id', clubIds)
        .neq("status", "inactive"); // Filter out archived students

      const { data: students, error: studentsError } = await studentsQuery
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;

      // Get profile data for students to get phone numbers
      const emails = (students || []).map(s => s.email).filter(Boolean);
      let profilePhones: Record<string, string> = {};

      if (emails.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('email, phone')
          .in('email', emails);

        if (profiles) {
          profilePhones = profiles.reduce((acc, p) => {
            if (p.email && p.phone) {
              acc[p.email] = p.phone;
            }
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Get class participations to find which trainers teach each student
      const studentIds = (students || []).map(s => s.id);
      let studentClassTrainers: Record<string, string[]> = {};

      if (studentIds.length > 0) {
        const { data: classParticipants } = await supabase
          .from('class_participants')
          .select(`
            student_enrollment_id,
            programmed_class:programmed_classes(
              trainer_profile_id,
              trainer_profile_id_2
            )
          `)
          .in('student_enrollment_id', studentIds);

        if (classParticipants) {
          // Group trainer_profile_ids by student_enrollment_id
          classParticipants.forEach(cp => {
            const studentId = cp.student_enrollment_id;
            if (!studentClassTrainers[studentId]) {
              studentClassTrainers[studentId] = [];
            }
            // Add primary trainer
            if (cp.programmed_class?.trainer_profile_id) {
              if (!studentClassTrainers[studentId].includes(cp.programmed_class.trainer_profile_id)) {
                studentClassTrainers[studentId].push(cp.programmed_class.trainer_profile_id);
              }
            }
            // Add secondary trainer if exists
            if (cp.programmed_class?.trainer_profile_id_2) {
              if (!studentClassTrainers[studentId].includes(cp.programmed_class.trainer_profile_id_2)) {
                studentClassTrainers[studentId].push(cp.programmed_class.trainer_profile_id_2);
              }
            }
          });
        }
      }

      // Transform data to include club, trainer information, and class trainer ids
      const studentsWithInfo = (students || []).map(student => ({
        ...student,
        // Use phone from enrollment, fallback to phone from profiles
        phone: student.phone || profilePhones[student.email] || '',
        club_name: student.clubs?.name || 'Club desconocido',
        club_status: student.clubs?.status || null,
        trainer_name: student.trainer?.full_name || null,
        class_trainer_ids: studentClassTrainers[student.id] || [],
      }));

      return studentsWithInfo as StudentEnrollment[];
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
      console.log("🔵 Attempting to create student user account for:", enrollmentData.email);
      const { data: createUserResponse, error: createUserError } = await supabase.functions.invoke('create-student-user', {
        body: {
          email: enrollmentData.email,
          full_name: enrollmentData.full_name,
          club_id: clubId
        }
      });

      if (createUserError) {
        console.error("❌ Error creating student user:", createUserError);
        toast({
          title: "Advertencia",
          description: "La inscripción se creó pero hubo un problema al crear la cuenta de usuario. El alumno puede que no pueda acceder al sistema.",
          variant: "destructive",
          duration: 8000,
        });
      } else {
        console.log("✅ Student user created successfully:", createUserResponse);
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
      console.log("🔵 Starting enrollment completion for:", studentData.email);

      // Verificar que tenemos email y contraseña
      if (!studentData.email || !studentData.password) {
        throw new Error("Email y contraseña son requeridos");
      }

      // 1. Crear cuenta de usuario con Supabase Auth
      console.log("🔵 Creating user account with Supabase Auth...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: studentData.email,
        password: studentData.password,
        options: {
          data: {
            full_name: studentData.full_name,
            role: 'player'
          }
        }
      });

      if (authError) {
        console.error("❌ Error creating user account:", authError);
        throw new Error(`No se pudo crear la cuenta: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error("No se pudo crear el usuario");
      }

      console.log("✅ User account created:", authData.user.id);

      // 2. Obtener información del formulario de inscripción
      const { data: enrollmentForm, error: formError } = await supabase
        .from('enrollment_forms')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (formError) {
        console.error("❌ Error fetching enrollment form:", formError);
        throw new Error("Formulario de inscripción no válido o expirado");
      }

      console.log("✅ Enrollment form found:", enrollmentForm);

      // 3. Crear student_enrollment
      console.log("🔵 Creating student enrollment...");
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .insert({
          trainer_profile_id: enrollmentForm.trainer_profile_id,
          club_id: enrollmentForm.club_id,
          created_by_profile_id: enrollmentForm.trainer_profile_id,
          full_name: studentData.full_name,
          email: studentData.email,
          phone: studentData.phone,
          level: studentData.level,
          weekly_days: studentData.weekly_days || [],
          preferred_times: studentData.preferred_times || [],
          enrollment_period: studentData.enrollment_period || 'mensual',
          observations: studentData.observations,
          status: 'active'
        })
        .select()
        .single();

      if (enrollmentError) {
        console.error("❌ Error creating enrollment:", enrollmentError);
        throw new Error(`No se pudo crear la inscripción: ${enrollmentError.message}`);
      }

      console.log("✅ Enrollment created:", enrollmentData);

      // 4. Marcar formulario como completado
      const { error: updateError } = await supabase
        .from('enrollment_forms')
        .update({
          status: 'completed',
          student_data: { ...studentData, password: undefined, confirm_password: undefined },
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('token', token);

      if (updateError) {
        console.error("⚠️ Warning: Could not update enrollment form:", updateError);
      }

      console.log("✅ Enrollment process completed successfully");

      return {
        ...enrollmentData,
        user_id: authData.user.id,
        email: studentData.email
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["student-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["enrollment-forms"] });
      // Don't show toast here, let the component handle it with credentials
      return data;
    },
    onError: (error: any) => {
      toast({
        title: "Error al completar inscripción",
        description: error.message || "Ha ocurrido un error al procesar tu inscripción",
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
      console.log('🔄 useUpdateStudentEnrollment - Updating enrollment:', { id, data });

      // 1. Update student_enrollments table
      const { error: enrollmentError } = await supabase
        .from("student_enrollments")
        .update(data)
        .eq('id', id);

      if (enrollmentError) {
        console.error('❌ Error updating student_enrollments:', enrollmentError);
        throw enrollmentError;
      }

      console.log('✅ student_enrollments updated');

      // 2. If updating level or club_id, also update the profiles table
      if (data.level !== undefined || data.club_id !== undefined) {
        console.log('🔄 Also updating profile...', { level: data.level, club_id: data.club_id });

        // Get the student_profile_id from student_enrollments
        const { data: enrollment, error: getError } = await supabase
          .from("student_enrollments")
          .select('student_profile_id, email')
          .eq('id', id)
          .single();

        if (getError) {
          console.error('❌ Error getting enrollment:', getError);
          throw getError;
        }

        // Use student_profile_id if available, otherwise try to find by email
        let profileId = enrollment.student_profile_id;

        if (!profileId && enrollment.email) {
          console.log('📧 No student_profile_id, trying to find profile by email:', enrollment.email);
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select('id')
            .eq('email', enrollment.email)
            .single();

          if (profileError) {
            console.error('❌ Error getting profile by email:', profileError);
          } else if (profile) {
            profileId = profile.id;
          }
        }

        if (profileId) {
          console.log('👤 Updating profile for user_id:', profileId);

          // Build update object with only the fields that changed
          const profileUpdate: { level?: number; club_id?: string } = {};
          if (data.level !== undefined) profileUpdate.level = data.level;
          if (data.club_id !== undefined) profileUpdate.club_id = data.club_id;

          const { error: updateProfileError } = await supabase
            .from("profiles")
            .update(profileUpdate)
            .eq('id', profileId);

          if (updateProfileError) {
            console.error('❌ Error updating profile:', updateProfileError);
            // Don't throw, enrollment was already updated
          } else {
            console.log('✅ Profile updated successfully');
          }
        } else {
          console.log('⚠️ No profile found to update');
        }
      }
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

// Interface for class trainers (used in filter dropdown)
export interface ClassTrainer {
  profile_id: string;
  full_name: string;
}

// Hook to get unique trainers who teach classes in the club(s)
// Uses class_participants to bypass potential RLS restrictions on programmed_classes
export const useClassTrainers = (clubId?: string) => {
  return useQuery({
    queryKey: ["class-trainers", clubId],
    queryFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Usuario no autenticado');

      // Get user profile to check role
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single();

      if (profileError) throw profileError;

      let clubIds: string[] = [];

      // If clubId is provided directly (e.g., from superadmin selector), use it
      if (clubId) {
        clubIds = [clubId];
      } else if (userProfile.role === 'superadmin') {
        // Superadmin with no specific club selected - get ALL their assigned clubs
        const { data: superadminClubs, error: superadminClubsError } = await supabase
          .from('admin_clubs')
          .select('club_id')
          .eq('admin_profile_id', userData.user.id);

        if (superadminClubsError) throw superadminClubsError;

        if (!superadminClubs || superadminClubs.length === 0) {
          return [];
        }

        clubIds = superadminClubs.map(ac => ac.club_id);
      } else {
        // Regular admin - get clubs created by this admin
        const { data: adminClubs, error: clubsError } = await supabase
          .from('clubs')
          .select('id')
          .eq('created_by_profile_id', userData.user.id);

        if (clubsError) throw clubsError;

        if (!adminClubs || adminClubs.length === 0) {
          return [];
        }

        clubIds = adminClubs.map(club => club.id);
      }

      // Strategy: Get trainers through class_participants which has more permissive RLS
      // This gets all trainer_profile_ids from classes that have at least one enrolled student
      const { data: classParticipants, error: participantsError } = await supabase
        .from('class_participants')
        .select(`
          programmed_class:programmed_classes(
            trainer_profile_id,
            trainer_profile_id_2,
            club_id,
            is_active
          )
        `);

      if (participantsError) {
        console.error('useClassTrainers - Error via class_participants:', participantsError);
        // Fallback to direct query if class_participants fails
      }

      // Collect trainer IDs from class_participants results, filtering by club in code
      const trainerIdsFromParticipants = new Set<string>();
      if (classParticipants) {
        classParticipants.forEach(cp => {
          const pc = cp.programmed_class;
          // Filter by club_id and is_active in code since we can't filter on nested fields
          if (pc && pc.is_active && clubIds.includes(pc.club_id)) {
            if (pc.trainer_profile_id) trainerIdsFromParticipants.add(pc.trainer_profile_id);
            if (pc.trainer_profile_id_2) trainerIdsFromParticipants.add(pc.trainer_profile_id_2);
          }
        });
      }

      // Also try direct query to programmed_classes (may return fewer results due to RLS)
      const { data: classes, error: classesError } = await supabase
        .from('programmed_classes')
        .select('trainer_profile_id, trainer_profile_id_2')
        .in('club_id', clubIds)
        .eq('is_active', true);

      if (classesError) {
        console.error('useClassTrainers - Error direct query:', classesError);
      }

      // Collect trainer IDs from direct query
      const trainerIdsFromClasses = new Set<string>();
      if (classes) {
        classes.forEach(cls => {
          if (cls.trainer_profile_id) trainerIdsFromClasses.add(cls.trainer_profile_id);
          if (cls.trainer_profile_id_2) trainerIdsFromClasses.add(cls.trainer_profile_id_2);
        });
      }

      // Merge both sets - use whichever returned more results, or merge all
      const allTrainerIds = new Set([...trainerIdsFromParticipants, ...trainerIdsFromClasses]);

      if (allTrainerIds.size === 0) {
        return [];
      }

      // Get profile info for these trainers
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', Array.from(allTrainerIds));

      if (profilesError) throw profilesError;

      // Transform to ClassTrainer format
      const trainers: ClassTrainer[] = (profiles || []).map(p => ({
        profile_id: p.id,
        full_name: p.full_name || 'Sin nombre',
      }));

      // Sort alphabetically by name
      trainers.sort((a, b) => a.full_name.localeCompare(b.full_name, 'es', { sensitivity: 'base' }));

      return trainers;
    },
  });
};