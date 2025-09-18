import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useChangePassword = () => {
  const [loading, setLoading] = useState(false);

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    try {
      // Validate new password length
      if (newPassword.length < 6) {
        toast.error('La nueva contraseña debe tener al menos 6 caracteres');
        return { success: false };
      }

      // Update password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Error changing password:', error);
        toast.error('Error al cambiar la contraseña: ' + error.message);
        return { success: false };
      }

      toast.success('Contraseña actualizada correctamente');
      return { success: true };
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Error inesperado al cambiar la contraseña');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { changePassword, loading };
};