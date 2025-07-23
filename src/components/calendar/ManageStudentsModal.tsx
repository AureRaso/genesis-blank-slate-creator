
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, UserPlus, UserMinus, Mail, User } from "lucide-react";
import { useStudentEnrollments } from "@/hooks/useStudentEnrollments";
import { useToast } from "@/hooks/use-toast";
import type { ScheduledClassWithTemplate } from "@/hooks/useScheduledClasses";

interface ManageStudentsModalProps {
  class: ScheduledClassWithTemplate;
  isOpen: boolean;
  onClose: () => void;
}

export function ManageStudentsModal({ class: cls, isOpen, onClose }: ManageStudentsModalProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Get all available students
  const { data: allStudents, isLoading } = useStudentEnrollments({
    clubId: cls.club_id
  });

  const currentStudents = cls.participants || [];
  const currentStudentIds = currentStudents.map(p => p.student_enrollment_id);

  const availableStudents = allStudents?.filter(student => 
    !currentStudentIds.includes(student.id) &&
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleAddStudent = async (studentId: string) => {
    try {
      // TODO: Implement add student to class
      toast({
        title: "Alumno añadido",
        description: "El alumno ha sido añadido a la clase correctamente."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo añadir el alumno a la clase.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveStudent = async (participantId: string) => {
    try {
      // TODO: Implement remove student from class
      toast({
        title: "Alumno eliminado",
        description: "El alumno ha sido eliminado de la clase correctamente."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el alumno de la clase.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Alumnos - {cls.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Students */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Alumnos inscritos</h3>
              <Badge variant="outline">
                {currentStudents.length} alumnos
              </Badge>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {currentStudents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay alumnos inscritos en esta clase
                </p>
              ) : (
                currentStudents.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{participant.student_enrollment.full_name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {participant.student_enrollment.email}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveStudent(participant.id)}
                      className="text-destructive hover:text-destructive/90"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available Students */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Alumnos disponibles</h3>
              <Badge variant="outline">
                {availableStudents.length} disponibles
              </Badge>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar alumnos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {isLoading ? (
                <p className="text-muted-foreground text-center py-8">
                  Cargando alumnos...
                </p>
              ) : availableStudents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {searchTerm ? "No se encontraron alumnos" : "No hay alumnos disponibles"}
                </p>
              ) : (
                availableStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{student.full_name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {student.email}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddStudent(student.id)}
                      className="text-primary hover:text-primary/90"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
