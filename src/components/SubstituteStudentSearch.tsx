import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SubstituteStudentSearchProps {
  classId: string;
  clubId: string;
  onSuccess?: () => void;
}

const SubstituteStudentSearch = ({ classId, clubId, onSuccess }: SubstituteStudentSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  // Buscar alumnos del club
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['club-students', clubId, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('student_enrollments')
        .select('*')
        .eq('club_id', clubId)
        .eq('status', 'active')
        .order('full_name', { ascending: true });

      if (searchTerm.trim()) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(20);

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
      return data;
    },
    onSuccess: (data) => {
      console.log('🔄 Invalidando queries...');
      // Invalidar con la misma key que usa useTodayAttendance
      queryClient.invalidateQueries({ queryKey: ['today-attendance', profile?.id, today] });
      queryClient.invalidateQueries({ queryKey: ['class-participants', classId] });
      console.log('✅ Queries invalidadas');

      toast({
        title: "Sustituto añadido y confirmado",
        description: "El alumno ha sido añadido a la clase y su asistencia ha sido confirmada",
      });
      setSearchTerm("");
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

  const filteredStudents = students?.filter(
    student => !enrolledStudents?.includes(student.id)
  ) || [];

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
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
          filteredStudents.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-slate-900 truncate">
                  {student.full_name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {student.email}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    Nivel {student.level}
                  </Badge>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => addSubstitute.mutate(student.id)}
                disabled={addSubstitute.isPending}
                className="ml-3 flex-shrink-0"
              >
                {addSubstitute.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Añadir
                  </>
                )}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SubstituteStudentSearch;
