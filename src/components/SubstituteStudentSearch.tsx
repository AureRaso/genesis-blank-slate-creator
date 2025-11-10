import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Loader2, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SubstituteStudentSearchProps {
  classId: string;
  clubId: string;
  className?: string;
  classTime?: string;
  classDate?: string;
  onSuccess?: () => void;
}

const SubstituteStudentSearch = ({ classId, clubId, className, classTime, classDate, onSuccess }: SubstituteStudentSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  // Function to normalize text (remove accents)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Buscar alumnos del club
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['club-students', clubId],
    queryFn: async () => {
      let query = supabase
        .from('student_enrollments')
        .select('*')
        .eq('club_id', clubId)
        .eq('status', 'active')
        .order('full_name', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!clubId,
  });

  // Obtener alumnos ya inscritos en esta clase
  const { data: enrolledStudents } = useQuery({
    queryKey: ['class-participants', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_participants')
        .select('student_enrollment_id')
        .eq('class_id', classId);

      if (error) throw error;
      return data?.map(p => p.student_enrollment_id) || [];
    },
    enabled: !!classId,
  });

  // Añadir alumno como sustituto
  const addSubstitute = useMutation({
    mutationFn: async (studentEnrollmentId: string) => {
      const today = new Date().toISOString().split('T')[0];

      console.log('➕ DEBUG - Añadiendo sustituto:', {
        classId,
        studentEnrollmentId,
        today,
        is_substitute: true
      });

      // 1. Añadir el sustituto
      const { data, error } = await supabase
        .from('class_participants')
        .insert({
          class_id: classId,
          student_enrollment_id: studentEnrollmentId,
          is_substitute: true,
          attendance_confirmed_for_date: today,
          attendance_confirmed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error al añadir sustituto:', error);
        throw error;
      }

      console.log('✅ Sustituto añadido:', data);

      // 2. Rechazar todas las solicitudes de waitlist pendientes para esta clase y fecha
      console.log('🔄 Rechazando solicitudes de waitlist pendientes para class_id:', classId, 'date:', today);

      const { data: rejectedRequests, error: rejectError } = await supabase
        .from('class_waitlist')
        .update({
          status: 'rejected',
          rejected_by: profile?.id,
          rejected_at: new Date().toISOString()
        })
        .eq('class_id', classId)
        .eq('class_date', today)
        .eq('status', 'pending')
        .select();

      if (rejectError) {
        console.error('⚠️ Error al rechazar solicitudes de waitlist:', rejectError);
        // No lanzamos error porque el sustituto ya se añadió exitosamente
      } else {
        console.log('✅ Solicitudes de waitlist rechazadas:', rejectedRequests?.length || 0);
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('🔄 Invalidando queries...');
      // Invalidar con la misma key que usa useTodayAttendance
      queryClient.invalidateQueries({ queryKey: ['today-attendance', profile?.id, today] });
      queryClient.invalidateQueries({ queryKey: ['class-participants', classId] });
      // Invalidar waitlist queries para actualizar notificaciones de jugadores
      queryClient.invalidateQueries({ queryKey: ['my-waitlist-requests'] });
      queryClient.invalidateQueries({ queryKey: ['class-waitlist'] });
      console.log('✅ Queries invalidadas');

      toast({
        title: "Sustituto añadido y confirmado",
        description: "El alumno ha sido añadido a la clase. Las solicitudes pendientes de lista de espera han sido rechazadas automáticamente.",
      });
      setSearchTerm("");
      setSelectedStudentId(null);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo añadir el sustituto",
        variant: "destructive",
      });
    },
  });

  const filteredStudents = students?.filter(student => {
    // Filter out already enrolled students
    if (enrolledStudents?.includes(student.id)) return false;

    // Apply search filter with normalization
    if (searchTerm.trim()) {
      const normalizedSearch = normalizeText(searchTerm);
      return normalizeText(student.full_name).includes(normalizedSearch) ||
        normalizeText(student.email).includes(normalizedSearch);
    }

    return true;
  }) || [];

  return (
    <div className="flex flex-col min-h-0">
      {/* Search Input */}
      <div className="relative mb-4 flex-shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results - Scrollable */}
      <div className="overflow-y-auto space-y-2 mb-4 max-h-[50vh]">
        {loadingStudents ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            {searchTerm.trim()
              ? "No se encontraron alumnos con ese criterio"
              : "Escribe para buscar alumnos disponibles"}
          </div>
        ) : (
          filteredStudents.map((student) => {
            const isSelected = selectedStudentId === student.id;
            return (
              <div
                key={student.id}
                onClick={() => setSelectedStudentId(student.id)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-white border border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-slate-900 truncate">
                    {student.full_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      Nivel {student.level}
                    </Badge>
                  </div>
                </div>
                {isSelected && (
                  <div className="ml-3 flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Fixed Bottom Button */}
      <div className="flex-shrink-0 bg-white border-t pt-4 -mx-6 px-6 -mb-6 pb-6">
        <Button
          size="lg"
          onClick={() => selectedStudentId && addSubstitute.mutate(selectedStudentId)}
          disabled={!selectedStudentId || addSubstitute.isPending}
          className="w-full"
        >
          {addSubstitute.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Añadiendo...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Añadir sustituto
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SubstituteStudentSearch;
