import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface GuardianChild {
  id: string;
  full_name: string;
  email: string;
  level: number | null;
  club_id: string | null;
  relationship_type: string;
  birth_date: string | null;
  created_at: string;
  club?: {
    name: string;
  };
}

export interface AddChildData {
  fullName: string;
  level: number;
}

export const useGuardianChildren = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Query para obtener los hijos del guardian
  const {
    data: children,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['guardian-children', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('No user authenticated');
      }

      console.log('🔍 Fetching children for guardian:', user.id);

      // Verificar auth.uid()
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log('🔍 Auth UID:', authUser?.id);
      console.log('🔍 User ID match:', user.id === authUser?.id);

      // Obtener las relaciones de dependientes
      const { data: dependents, error: dependentsError } = await supabase
        .from('account_dependents')
        .select(`
          dependent_profile_id,
          relationship_type,
          birth_date,
          created_at
        `)
        .eq('guardian_profile_id', user.id)
        .order('created_at', { ascending: false });

      if (dependentsError) {
        console.error('❌ Error fetching dependents:', dependentsError);
        console.error('❌ Error code:', dependentsError.code);
        console.error('❌ Error message:', dependentsError.message);
        console.error('❌ Error details:', dependentsError.details);
        throw dependentsError;
      }

      console.log('✅ Dependents query successful. Count:', dependents?.length || 0);

      if (!dependents || dependents.length === 0) {
        console.log('⚠️ No children found for guardian');
        return [];
      }

      console.log('✅ Found dependents:', dependents);

      // Obtener los perfiles completos de los hijos
      const childrenIds = dependents.map(d => d.dependent_profile_id);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          level,
          club_id,
          club:clubs!profiles_club_id_fkey (
            name
          )
        `)
        .in('id', childrenIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Found profiles:', profiles);

      // Combinar datos
      const children: GuardianChild[] = profiles.map(profile => {
        const dependent = dependents.find(d => d.dependent_profile_id === profile.id)!;
        return {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          level: profile.level,
          club_id: profile.club_id,
          relationship_type: dependent.relationship_type,
          birth_date: dependent.birth_date,
          created_at: dependent.created_at,
          club: Array.isArray(profile.club) ? profile.club[0] : profile.club
        };
      });

      console.log('Processed children:', children);
      return children;
    },
    enabled: !!user?.id,
  });

  // Mutation para añadir un hijo
  const addChildMutation = useMutation({
    mutationFn: async (childData: AddChildData) => {
      if (!user?.id) {
        throw new Error('No user authenticated');
      }

      if (!profile?.club_id) {
        throw new Error('El guardian no tiene un club asignado');
      }

      console.log('🔍 Adding child:', childData);
      console.log('🔍 Current user:', user.email, 'ID:', user.id);
      console.log('🔍 Current profile role:', profile?.role);

      // Guardar el ID del guardian antes de crear el hijo
      const guardianId = user.id;

      // Guardar la sesión actual del guardian
      const { data: { session: guardianSession } } = await supabase.auth.getSession();

      if (!guardianSession) {
        throw new Error('No hay sesión activa del guardian');
      }

      console.log('💾 Guardian session saved:', guardianSession.user.email);

      // Verificar que realmente es un guardian (consultar directamente la DB)
      const { data: guardianProfile, error: guardianCheckError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', guardianId)
        .single();

      if (guardianCheckError || guardianProfile?.role !== 'guardian') {
        console.error('⚠️ WARNING: Current user is not a guardian! Role:', guardianProfile?.role);
        throw new Error('Solo los usuarios con rol guardian pueden añadir hijos');
      }

      console.log('✅ Guardian role verified:', guardianProfile.role);

      // 1. Generar email único para el hijo
      const childEmail = `child.${childData.fullName.toLowerCase().replace(/\s/g, '.')}.${Date.now()}@temp.padelock.com`;
      const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!'; // Contraseña temporal aleatoria

      // 2. Crear el usuario en auth.users usando signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: childEmail,
        password: tempPassword,
        options: {
          data: {
            full_name: childData.fullName,
            club_id: profile.club_id,
            level: childData.level,
            role: 'player'
          },
          emailRedirectTo: undefined // No enviar email de confirmación
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      console.log('✅ Created auth user:', authData.user.id);

      // 3. Esperar a que el trigger handle_new_user cree el perfil (250ms debería ser suficiente)
      await new Promise(resolve => setTimeout(resolve, 250));

      // 4. Verificar que el perfil se creó
      const { data: newProfile, error: profileError} = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !newProfile) {
        console.error('❌ Error fetching created profile:', profileError);
        throw new Error('El perfil del hijo no se creó correctamente');
      }

      console.log('✅ Created child profile:', newProfile.full_name);

      // 5. IMPORTANTE: Restaurar la sesión del guardian ANTES de crear la relación
      // Esto es necesario porque las políticas RLS de account_dependents verifican auth.uid()
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: guardianSession.access_token,
        refresh_token: guardianSession.refresh_token
      });

      if (sessionError) {
        console.error('❌ Error restoring guardian session:', sessionError);
        throw new Error('Error al restaurar la sesión del guardian');
      }

      console.log('✅ Guardian session restored');

      // Pequeña espera para que la sesión se propague
      await new Promise(resolve => setTimeout(resolve, 100));

      // 6. Ahora crear la relación en account_dependents (con la sesión del guardian activa)
      const { data: relationship, error: relationshipError } = await supabase
        .from('account_dependents')
        .insert({
          guardian_profile_id: guardianId,
          dependent_profile_id: newProfile.id,
          relationship_type: 'child',
          birth_date: null
        })
        .select()
        .single();

      if (relationshipError) {
        console.error('❌ Error creating relationship:', relationshipError);
        // Si falla la relación, eliminar el perfil creado
        await supabase.from('profiles').delete().eq('id', newProfile.id);
        throw relationshipError;
      }

      console.log('✅ Created relationship successfully - ready to reload');

      return { profile: newProfile, relationship };
    },
    onSuccess: () => {
      // Invalidar y refetch la lista de hijos
      queryClient.invalidateQueries({ queryKey: ['guardian-children'] });
      toast({
        title: '¡Hijo añadido!',
        description: 'El perfil del hijo se ha creado correctamente.',
      });
    },
    onError: (error: any) => {
      console.error('Error adding child:', error);
      toast({
        title: 'Error al añadir hijo',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    },
  });

  // Mutation para editar un hijo
  const editChildMutation = useMutation({
    mutationFn: async ({ childId, data }: { childId: string; data: { fullName: string; level: number } }) => {
      if (!user?.id) {
        throw new Error('No user authenticated');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          level: data.level
        })
        .eq('id', childId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardian-children'] });
      toast({
        title: '¡Cambios guardados!',
        description: 'Los datos del hijo se han actualizado correctamente.',
      });
    },
    onError: (error: any) => {
      console.error('Error editing child:', error);
      toast({
        title: 'Error al editar hijo',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    },
  });

  // Mutation para eliminar un hijo (solo la relación, no el perfil)
  const removeChildMutation = useMutation({
    mutationFn: async (childId: string) => {
      if (!user?.id) {
        throw new Error('No user authenticated');
      }

      const { error } = await supabase
        .from('account_dependents')
        .delete()
        .eq('guardian_profile_id', user.id)
        .eq('dependent_profile_id', childId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardian-children'] });
      toast({
        title: 'Hijo eliminado',
        description: 'El hijo ha sido eliminado de tu lista.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error al eliminar hijo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    children: children || [],
    isLoading,
    error,
    refetch,
    addChild: addChildMutation.mutate,
    isAddingChild: addChildMutation.isPending,
    editChild: editChildMutation.mutate,
    isEditingChild: editChildMutation.isPending,
    removeChild: removeChildMutation.mutate,
    isRemovingChild: removeChildMutation.isPending,
  };
};
