import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBulkEnrollToRecurringClass } from "@/hooks/useClassParticipants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Loader2, Check } from "lucide-react";

interface BulkEnrollStudentSearchProps {
  classId: string;
  clubId: string;
  className: string;
  classStartTime: string;
  onSuccess?: () => void;
}

const BulkEnrollStudentSearch = ({
  classId,
  clubId,
  className,
  classStartTime,
  onSuccess
}: BulkEnrollStudentSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const bulkEnrollMutation = useBulkEnrollToRecurringClass();

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
      const { data, error } = await supabase
        .from('student_enrollments')
        .select('*')
        .eq('club_id', clubId)
        .eq('status', 'active')
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clubId,
  });

  // Obtener alumnos ya inscritos en esta clase específica
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

  // Filtrar alumnos según búsqueda
  const filteredStudents = students?.filter(student => {
    const normalizedSearch = normalizeText(searchTerm);
    const normalizedName = normalizeText(student.full_name || '');
    const normalizedEmail = normalizeText(student.email || '');

    return normalizedName.includes(normalizedSearch) ||
           normalizedEmail.includes(normalizedSearch);
  }) || [];

  // Añadir alumno a toda la serie recurrente
  const handleAddStudent = async (studentEnrollmentId: string) => {
    setSelectedStudentId(studentEnrollmentId);

    try {
      await bulkEnrollMutation.mutateAsync({
        student_enrollment_id: studentEnrollmentId,
        club_id: clubId,
        class_name: className,
        class_start_time: classStartTime,
        payment_status: 'pending',
      });

      // Success - close dialog
      onSuccess?.();
    } catch (error) {
      console.error('Error enrolling student:', error);
    } finally {
      setSelectedStudentId(null);
    }
  };

  if (loadingStudents) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Buscar alumno por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-9 sm:h-10 text-sm"
        />
      </div>

      <div className="space-y-2 max-h-[50vh] sm:max-h-[400px] overflow-y-auto">
        {filteredStudents.length === 0 ? (
          <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
            {searchTerm ? 'No se encontraron alumnos' : 'No hay alumnos disponibles'}
          </p>
        ) : (
          filteredStudents.map((student) => {
            const isEnrolled = enrolledStudents?.includes(student.id);
            const isProcessing = selectedStudentId === student.id;

            return (
              <div
                key={student.id}
                className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <p className="font-medium text-sm flex-1 min-w-0 truncate">{student.full_name}</p>

                {isEnrolled ? (
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    <Check className="h-3 w-3 mr-1" />
                    Inscrito
                  </Badge>
                ) : (
                  <Button
                    size="icon"
                    variant="default"
                    onClick={() => handleAddStudent(student.id)}
                    disabled={isProcessing || bulkEnrollMutation.isPending}
                    className="h-9 w-9 bg-primary hover:bg-primary/90 flex-shrink-0"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="pt-3 sm:pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          <strong>Nota:</strong> El alumno será añadido a TODAS las clases de la serie recurrente "{className}".
        </p>
      </div>
    </div>
  );
};

export default BulkEnrollStudentSearch;
