/**
 * Hooks para manejar confirmaciones de asistencia/ausencia por fecha específica
 * Usa la tabla class_attendance_confirmations para registros independientes por sesión
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para confirmar asistencia a una clase específica en una fecha específica
 */
export const useConfirmAttendance = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      classParticipantId,
      scheduledDate,
    }: {
      classParticipantId: string;
      scheduledDate: string;
    }) => {
      console.log('🟢 Confirming attendance for:', { classParticipantId, scheduledDate });

      // Usar la función RPC para asegurar que existe el registro
      const { data: recordId, error: rpcError } = await supabase.rpc('ensure_attendance_record', {
        p_class_participant_id: classParticipantId,
        p_scheduled_date: scheduledDate,
      });

      if (rpcError) throw rpcError;

      // Actualizar el registro
      const { data, error } = await supabase
        .from('class_attendance_confirmations')
        .update({
          attendance_confirmed: true,
          attendance_confirmed_at: new Date().toISOString(),
          // Limpiar ausencia si existe
          absence_confirmed: false,
          absence_reason: null,
          absence_confirmed_at: null,
        })
        .eq('id', recordId)
        .select()
        .single();

      if (error) throw error;
      console.log('🟢 Attendance confirmed:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-class-attendance', profile?.id] });
      toast.success('✓ Asistencia confirmada correctamente');
    },
    onError: (error: any) => {
      console.error('Error confirming attendance:', error);
      toast.error('Error al confirmar asistencia');
    },
  });
};

/**
 * Hook para cancelar confirmación de asistencia
 */
export const useCancelAttendanceConfirmation = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      classParticipantId,
      scheduledDate,
    }: {
      classParticipantId: string;
      scheduledDate: string;
    }) => {
      console.log('❌ Canceling attendance confirmation for:', { classParticipantId, scheduledDate });

      // Buscar el registro
      const { data: record, error: fetchError } = await supabase
        .from('class_attendance_confirmations')
        .select('id')
        .eq('class_participant_id', classParticipantId)
        .eq('scheduled_date', scheduledDate)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!record) {
        console.log('⚠️ No attendance record found to cancel');
        return null;
      }

      // Actualizar el registro
      const { data, error } = await supabase
        .from('class_attendance_confirmations')
        .update({
          attendance_confirmed: false,
          attendance_confirmed_at: null,
        })
        .eq('id', record.id)
        .select()
        .single();

      if (error) throw error;
      console.log('✓ Attendance confirmation canceled:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-class-attendance', profile?.id] });
      toast.success('Confirmación de asistencia cancelada');
    },
    onError: (error: any) => {
      console.error('Error canceling attendance confirmation:', error);
      toast.error('Error al cancelar confirmación');
    },
  });
};

/**
 * Hook para confirmar ausencia (no asistencia)
 */
export const useConfirmAbsence = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      classParticipantId,
      scheduledDate,
      reason,
    }: {
      classParticipantId: string;
      scheduledDate: string;
      reason?: string;
    }) => {
      console.log('🔴 Confirming absence for:', { classParticipantId, scheduledDate, reason });

      // Usar la función RPC para asegurar que existe el registro
      const { data: recordId, error: rpcError } = await supabase.rpc('ensure_attendance_record', {
        p_class_participant_id: classParticipantId,
        p_scheduled_date: scheduledDate,
      });

      if (rpcError) throw rpcError;

      // Actualizar el registro
      const { data, error } = await supabase
        .from('class_attendance_confirmations')
        .update({
          absence_confirmed: true,
          absence_reason: reason || null,
          absence_confirmed_at: new Date().toISOString(),
          // Limpiar confirmación de asistencia si existe
          attendance_confirmed: false,
          attendance_confirmed_at: null,
        })
        .eq('id', recordId)
        .select()
        .single();

      if (error) throw error;
      console.log('🔴 Absence confirmed:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-class-attendance', profile?.id] });
      toast.success('Ausencia confirmada');
    },
    onError: (error: any) => {
      console.error('Error confirming absence:', error);
      toast.error('Error al confirmar ausencia');
    },
  });
};

/**
 * Hook para cancelar ausencia confirmada
 */
export const useCancelAbsence = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      classParticipantId,
      scheduledDate,
    }: {
      classParticipantId: string;
      scheduledDate: string;
    }) => {
      console.log('✓ Canceling absence for:', { classParticipantId, scheduledDate });

      // Buscar el registro
      const { data: record, error: fetchError } = await supabase
        .from('class_attendance_confirmations')
        .select('id')
        .eq('class_participant_id', classParticipantId)
        .eq('scheduled_date', scheduledDate)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!record) {
        console.log('⚠️ No attendance record found to cancel absence');
        return null;
      }

      // Actualizar el registro
      const { data, error } = await supabase
        .from('class_attendance_confirmations')
        .update({
          absence_confirmed: false,
          absence_reason: null,
          absence_confirmed_at: null,
        })
        .eq('id', record.id)
        .select()
        .single();

      if (error) throw error;
      console.log('✓ Absence canceled:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcoming-class-attendance', profile?.id] });
      toast.success('Ausencia cancelada');
    },
    onError: (error: any) => {
      console.error('Error canceling absence:', error);
      toast.error('Error al cancelar ausencia');
    },
  });
};
