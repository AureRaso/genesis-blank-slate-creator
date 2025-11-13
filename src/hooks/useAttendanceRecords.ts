import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ============================================
// TYPES & INTERFACES
// ============================================

export interface AttendanceRecord {
  id: string;
  class_participant_id: string;
  programmed_class_id: string;
  class_date: string;

  // Confirmación previa
  had_confirmed_attendance: boolean;
  had_confirmed_absence: boolean;
  had_no_response: boolean;

  // Asistencia real
  actually_attended: boolean;
  marked_by_trainer: boolean;

  // Metadata
  recorded_by_profile_id: string | null;
  recorded_at: string;
  notes: string | null;

  created_at: string;
  updated_at: string;
}

export interface AttendanceRecordWithDetails extends AttendanceRecord {
  student_enrollment?: {
    full_name: string;
    email: string;
  };
  programmed_class?: {
    name: string;
    start_time: string;
  };
}

export interface RecordAttendanceInput {
  classId: string;
  classDate: string;
  participants: {
    participantId: string;
    actuallyAttended: boolean;
    notes?: string;
  }[];
}

export type IncidentType =
  | 'PERFECT'                      // Confirmó y vino ✅
  | 'NO_SHOW_CRITICAL'             // Confirmó pero NO vino 🚫
  | 'CAME_WITHOUT_CONFIRMATION'    // No confirmó pero vino ➕
  | 'EXPECTED_ABSENCE'             // No confirmó y no vino ⚪
  | 'CANCELLED_BUT_CAME'           // Canceló pero vino
  | 'NONE';

export interface AttendanceIncident {
  type: IncidentType;
  participantId: string;
  participantName: string;
  message: string;
  severity: 'success' | 'warning' | 'error' | 'info';
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Detecta el tipo de incidencia basado en confirmación previa vs asistencia real
 */
export function detectIncident(
  hadConfirmedAttendance: boolean,
  hadConfirmedAbsence: boolean,
  actuallyAttended: boolean
): IncidentType {
  // Confirmó asistencia
  if (hadConfirmedAttendance) {
    if (actuallyAttended) {
      return 'PERFECT';  // ✅ Todo perfecto
    } else {
      return 'NO_SHOW_CRITICAL';  // 🚫 No-show crítico
    }
  }

  // Confirmó ausencia
  if (hadConfirmedAbsence) {
    if (actuallyAttended) {
      return 'CANCELLED_BUT_CAME';  // Canceló pero vino
    } else {
      return 'EXPECTED_ABSENCE';  // Ausencia esperada
    }
  }

  // No respondió
  if (actuallyAttended) {
    return 'CAME_WITHOUT_CONFIRMATION';  // ➕ Vino sin confirmar
  } else {
    return 'EXPECTED_ABSENCE';  // ⚪ No vino y no había confirmado
  }
}

/**
 * Genera un mensaje descriptivo para cada tipo de incidencia
 */
export function getIncidentDetails(
  type: IncidentType,
  participantName: string
): { message: string; severity: 'success' | 'warning' | 'error' | 'info' } {
  switch (type) {
    case 'PERFECT':
      return {
        message: `${participantName}: Confirmó y vino`,
        severity: 'success'
      };
    case 'NO_SHOW_CRITICAL':
      return {
        message: `${participantName}: Confirmó pero NO VINO`,
        severity: 'error'
      };
    case 'CAME_WITHOUT_CONFIRMATION':
      return {
        message: `${participantName}: No confirmó pero vino`,
        severity: 'warning'
      };
    case 'CANCELLED_BUT_CAME':
      return {
        message: `${participantName}: Había cancelado pero vino`,
        severity: 'info'
      };
    case 'EXPECTED_ABSENCE':
      return {
        message: `${participantName}: No confirmó y no vino`,
        severity: 'info'
      };
    default:
      return {
        message: `${participantName}`,
        severity: 'info'
      };
  }
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook para obtener registros de asistencia de una clase en un rango de fechas
 */
export const useAttendanceRecords = (
  classId?: string,
  startDate?: string,
  endDate?: string
) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['attendance-records', classId, startDate, endDate],
    queryFn: async () => {
      if (!profile?.id) throw new Error('Usuario no autenticado');

      let query = supabase
        .from('class_attendance_records')
        .select(`
          *,
          student_enrollment:class_participants!class_participant_id(
            student_enrollment:student_enrollments!student_enrollment_id(
              full_name,
              email
            )
          ),
          programmed_class:programmed_classes!programmed_class_id(
            name,
            start_time
          )
        `)
        .order('class_date', { ascending: false })
        .order('recorded_at', { ascending: false });

      if (classId) {
        query = query.eq('programmed_class_id', classId);
      }

      if (startDate) {
        query = query.gte('class_date', startDate);
      }

      if (endDate) {
        query = query.lte('class_date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching attendance records:', error);
        throw error;
      }

      return data as any[];
    },
    enabled: !!profile?.id,
  });
};

/**
 * Hook para verificar si ya se registró asistencia para una clase en una fecha
 */
export const useAttendanceRecordExists = (classId: string, classDate: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['attendance-record-exists', classId, classDate],
    queryFn: async () => {
      if (!profile?.id || !classId || !classDate) return false;

      const { data, error } = await supabase
        .from('class_attendance_records')
        .select('id')
        .eq('programmed_class_id', classId)
        .eq('class_date', classDate)
        .limit(1);

      if (error) {
        console.error('Error checking attendance record:', error);
        return false;
      }

      return (data?.length ?? 0) > 0;
    },
    enabled: !!profile?.id && !!classId && !!classDate,
  });
};

/**
 * Hook para registrar la asistencia real de múltiples participantes
 */
export const useRecordActualAttendance = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (input: RecordAttendanceInput) => {
      if (!profile?.id) throw new Error('Usuario no autenticado');

      console.log('📝 Recording actual attendance:', input);

      // Primero, obtener el estado de confirmaciones de cada participante
      const { data: participants, error: fetchError } = await supabase
        .from('class_participants')
        .select(`
          id,
          attendance_confirmed_for_date,
          absence_confirmed,
          student_enrollment:student_enrollments!student_enrollment_id(
            full_name,
            email
          )
        `)
        .eq('class_id', input.classId)
        .in('id', input.participants.map(p => p.participantId));

      if (fetchError) throw fetchError;

      // Crear registros de asistencia
      const records = input.participants.map(p => {
        const participant = participants?.find(pp => pp.id === p.participantId);

        const hadConfirmedAttendance = !!participant?.attendance_confirmed_for_date;
        const hadConfirmedAbsence = !!participant?.absence_confirmed;
        const hadNoResponse = !hadConfirmedAttendance && !hadConfirmedAbsence;

        return {
          class_participant_id: p.participantId,
          programmed_class_id: input.classId,
          class_date: input.classDate,
          had_confirmed_attendance: hadConfirmedAttendance,
          had_confirmed_absence: hadConfirmedAbsence,
          had_no_response: hadNoResponse,
          actually_attended: p.actuallyAttended,
          marked_by_trainer: true,
          recorded_by_profile_id: profile.id,
          notes: p.notes || null,
        };
      });

      // Insertar registros (con UPSERT para evitar duplicados)
      const { data, error } = await supabase
        .from('class_attendance_records')
        .upsert(records, {
          onConflict: 'class_participant_id,class_date',
          ignoreDuplicates: false
        })
        .select();

      if (error) throw error;

      console.log('✅ Attendance records created:', data);

      // Detectar incidencias
      const incidents: AttendanceIncident[] = [];

      data?.forEach((record: any) => {
        const participant = participants?.find(p => p.id === record.class_participant_id);
        const incidentType = detectIncident(
          record.had_confirmed_attendance,
          record.had_confirmed_absence,
          record.actually_attended
        );

        const details = getIncidentDetails(incidentType, participant?.student_enrollment?.full_name || 'Alumno');

        incidents.push({
          type: incidentType,
          participantId: record.class_participant_id,
          participantName: participant?.student_enrollment?.full_name || 'Alumno',
          message: details.message,
          severity: details.severity,
        });
      });

      return {
        records: data,
        incidents,
        participants,
      };
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-record-exists'] });
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });

      // Mostrar resumen de incidencias
      const criticalIncidents = data.incidents.filter(i => i.type === 'NO_SHOW_CRITICAL');
      const perfectCount = data.incidents.filter(i => i.type === 'PERFECT').length;

      if (criticalIncidents.length > 0) {
        toast.warning(
          `Asistencia registrada. ${criticalIncidents.length} no-show${criticalIncidents.length > 1 ? 's' : ''} crítico${criticalIncidents.length > 1 ? 's' : ''}`,
          {
            description: criticalIncidents.map(i => i.participantName).join(', '),
            duration: 6000,
          }
        );
      } else {
        toast.success(
          `✓ Asistencia registrada correctamente`,
          {
            description: `${perfectCount} alumno${perfectCount !== 1 ? 's' : ''} asistió como esperado`,
          }
        );
      }
    },
    onError: (error: any) => {
      console.error('❌ Error recording attendance:', error);
      toast.error('Error al registrar asistencia', {
        description: error.message,
      });
    },
  });
};

/**
 * Hook para eliminar un registro de asistencia (permitir corregir errores)
 */
export const useDeleteAttendanceRecord = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (recordId: string) => {
      if (!profile?.id) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('class_attendance_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-record-exists'] });
      toast.success('✓ Registro eliminado');
    },
    onError: (error: any) => {
      console.error('Error deleting attendance record:', error);
      toast.error('Error al eliminar registro');
    },
  });
};
