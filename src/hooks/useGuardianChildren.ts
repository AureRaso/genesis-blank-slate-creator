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
  clubId?: string; // Opcional para mantener compatibilidad con guardians que usan el club del guardian
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
        throw dependentsError;
      }

      if (!dependents || dependents.length === 0) {
        return [];
      }

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
        throw profilesError;
      }

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

      // Verificar que haya un club_id disponible (del guardian o del código ingresado)
      if (!childData.clubId && !profile?.club_id) {
        throw new Error('Debes proporcionar un código de club válido');
      }

      // Guardar el ID del guardian antes de crear el hijo
      const guardianId = user.id;

      // Guardar la sesión actual del guardian
      const { data: { session: guardianSession } } = await supabase.auth.getSession();

      if (!guardianSession) {
        throw new Error('No hay sesión activa del guardian');
      }

      // Verificar que realmente es un guardian (consultar directamente la DB)
      const { data: guardianProfile, error: guardianCheckError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', guardianId)
        .single();

      if (guardianCheckError || guardianProfile?.role !== 'guardian') {
        throw new Error('Solo los usuarios con rol guardian pueden añadir hijos');
      }

      // 1. Generar email único para el hijo
      // Normalizar el nombre: quitar tildes, caracteres especiales y espacios
      const normalizedName = childData.fullName
        .toLowerCase()
        .normalize('NFD') // Descompone caracteres acentuados (é -> e + ́)
        .replace(/[\u0300-\u036f]/g, '') // Elimina los diacríticos (tildes, acentos)
        .replace(/ñ/g, 'n') // Reemplazar ñ por n (por si acaso)
        .replace(/[^a-z0-9\s]/g, '') // Eliminar cualquier carácter que no sea letra, número o espacio
        .replace(/\s+/g, '.') // Reemplazar espacios por puntos
        .replace(/\.+/g, '.') // Eliminar puntos duplicados
        .replace(/^\.+|\.+$/g, ''); // Eliminar puntos al inicio y final

      const childEmail = `child.${normalizedName}.${Date.now()}@temp.padelock.com`;
      const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!'; // Contraseña temporal aleatoria

      // 2. Crear el usuario en auth.users usando signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: childEmail,
        password: tempPassword,
        options: {
          data: {
            full_name: childData.fullName,
            club_id: childData.clubId || profile.club_id,
            level: childData.level,
            role: 'player'
          },
          emailRedirectTo: undefined // No enviar email de confirmación
        }
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      // 3. Esperar a que el trigger handle_new_user cree el perfil (250ms debería ser suficiente)
      await new Promise(resolve => setTimeout(resolve, 250));

      // 4. Verificar que el perfil se creó
      const { data: newProfile, error: profileError} = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !newProfile) {
        throw new Error('El perfil del hijo no se creó correctamente');
      }

      // 5. IMPORTANTE: Restaurar la sesión del guardian ANTES de crear la relación
      // Esto es necesario porque las políticas RLS de account_dependents verifican auth.uid()
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: guardianSession.access_token,
        refresh_token: guardianSession.refresh_token
      });

      if (sessionError) {
        throw new Error('Error al restaurar la sesión del guardian');
      }

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
        // Si falla la relación, eliminar el perfil creado
        await supabase.from('profiles').delete().eq('id', newProfile.id);
        throw relationshipError;
      }

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
