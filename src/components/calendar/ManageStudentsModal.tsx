
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, UserPlus, UserMinus, Mail, User, Loader2 } from "lucide-react";
import { useStudentEnrollments } from "@/hooks/useStudentEnrollments";
import { useClassParticipants, useBulkUpdateClassParticipants } from "@/hooks/useClassParticipants";
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
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  
  // Get all available students and current participants
  const { data: allStudents, isLoading: studentsLoading } = useStudentEnrollments();
  const { data: currentParticipants, isLoading: participantsLoading } = useClassParticipants(cls.id);
  const bulkUpdateMutation = useBulkUpdateClassParticipants();

  // Filter students by club and search term
  const availableStudents = allStudents?.filter(student => 
    student.club_id === cls.club_id &&
    !currentParticipants?.some(p => p.student_enrollment_id === student.id) &&
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleStudentToggle = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleParticipantToggle = (participantId: string, checked: boolean) => {
    const newSelected = new Set(selectedParticipants);
    if (checked) {
      newSelected.add(participantId);
    } else {
      newSelected.delete(participantId);
    }
    setSelectedParticipants(newSelected);
  };

  const handleSaveChanges = async () => {
    const studentsToAdd = Array.from(selectedStudents);
    const participantsToRemove = Array.from(selectedParticipants);

    if (studentsToAdd.length === 0 && participantsToRemove.length === 0) {
      toast({
        title: "Sin cambios",
        description: "No hay cambios que guardar."
      });
      return;
    }

    try {
      await bulkUpdateMutation.mutateAsync({
        classId: cls.id,
        studentsToAdd,
        participantsToRemove
      });
      
      // Reset selections
      setSelectedStudents(new Set());
      setSelectedParticipants(new Set());
      
      // Close modal after successful update
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const isLoading = studentsLoading || participantsLoading;
  const isSaving = bulkUpdateMutation.isPending;

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
                {currentParticipants?.length || 0} alumnos
              </Badge>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {isLoading ? (
                <p className="text-muted-foreground text-center py-8">
                  Cargando alumnos...
                </p>
              ) : !currentParticipants || currentParticipants.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay alumnos inscritos en esta clase
                </p>
              ) : (
                currentParticipants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedParticipants.has(participant.id)}
                        onCheckedChange={(checked) => handleParticipantToggle(participant.id, !!checked)}
                        disabled={isSaving}
                      />
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
                    {selectedParticipants.has(participant.id) && (
                      <UserMinus className="h-4 w-4 text-destructive" />
                    )}
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
                disabled={isSaving}
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
                      <Checkbox
                        checked={selectedStudents.has(student.id)}
                        onCheckedChange={(checked) => handleStudentToggle(student.id, !!checked)}
                        disabled={isSaving}
                      />
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
                    {selectedStudents.has(student.id) && (
                      <UserPlus className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveChanges} 
            disabled={isSaving || (selectedStudents.size === 0 && selectedParticipants.size === 0)}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
