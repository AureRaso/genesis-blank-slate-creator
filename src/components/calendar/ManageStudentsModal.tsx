
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, UserPlus, UserMinus, Mail, User, Loader2, CreditCard, Banknote, CheckCircle } from "lucide-react";
import { useStudentEnrollments, useAdminStudentEnrollments } from "@/hooks/useStudentEnrollments";
import { useClassParticipants, useUpdateClassParticipant, useCreateClassParticipant } from "@/hooks/useClassParticipants";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { ScheduledClassWithTemplate } from "@/hooks/useScheduledClasses";

interface ManageStudentsModalProps {
  class: ScheduledClassWithTemplate;
  isOpen: boolean;
  onClose: () => void;
}

export function ManageStudentsModal({ class: cls, isOpen, onClose }: ManageStudentsModalProps) {
  console.log('🔵 ManageStudentsModal rendered - isOpen:', isOpen, 'class:', cls.name);
  
  const { toast } = useToast();
  const { profile, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [paymentData, setPaymentData] = useState<Record<string, {
    paymentMethod?: string;
    paymentStatus?: string;
    paymentNotes?: string;
  }>>({});
  
  console.log('🔵 User role check:', { isAdmin, profileRole: profile?.role, profileId: profile?.id });
  
  // Use appropriate hook based on user role - show ALL students for admin
  const { data: allStudents, isLoading: studentsLoading, error: studentsError } = isAdmin 
    ? useAdminStudentEnrollments() 
    : useStudentEnrollments();
  
  console.log('🔵 Hook results:', {
    allStudentsCount: allStudents?.length || 0,
    studentsError: studentsError?.message,
    studentsLoading,
    isAdmin,
    profileRole: profile?.role
  });
  
  const { data: currentParticipants, isLoading: participantsLoading } = useClassParticipants(cls.id);
  const updateMutation = useUpdateClassParticipant();
  const createMutation = useCreateClassParticipant();

  // Filter students by search term and exclude current participants
  const availableStudents = allStudents?.filter(student => 
    !currentParticipants?.some(p => p.student_enrollment_id === student.id) &&
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  console.log('🔵 Final filtering results:', {
    classClubId: cls.club_id,
    allStudentsCount: allStudents?.length || 0,
    currentParticipantsCount: currentParticipants?.length || 0,
    availableStudentsCount: availableStudents.length,
    firstFewStudents: allStudents?.slice(0, 3).map(s => ({ 
      id: s.id, 
      name: s.full_name, 
      club_id: s.club_id 
    })),
    currentParticipantsIds: currentParticipants?.map(p => p.student_enrollment_id),
    searchTerm
  });

  const handleStudentToggle = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
      // Initialize payment data for new student
      if (!paymentData[studentId]) {
        setPaymentData(prev => ({
          ...prev,
          [studentId]: {
            paymentMethod: '',
            paymentStatus: 'pending',
            paymentNotes: ''
          }
        }));
      }
    } else {
      newSelected.delete(studentId);
      // Remove payment data when student is deselected
      setPaymentData(prev => {
        const newData = { ...prev };
        delete newData[studentId];
        return newData;
      });
    }
    setSelectedStudents(newSelected);
  };

  const handlePaymentDataChange = (studentId: string, field: string, value: string) => {
    setPaymentData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
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
      // Add students to class
      for (const studentId of studentsToAdd) {
        const paymentInfo = paymentData[studentId] || {};
        await createMutation.mutateAsync({
          class_id: cls.id,
          student_enrollment_id: studentId,
          status: 'active',
          payment_method: paymentInfo.paymentMethod || '',
          payment_status: paymentInfo.paymentStatus || 'pending',
          payment_notes: paymentInfo.paymentNotes || ''
        });
      }

      // Remove participants from class
      for (const participantId of participantsToRemove) {
        await updateMutation.mutateAsync({
          id: participantId,
          data: { status: 'inactive' }
        });
      }

      toast({
        title: "Cambios guardados",
        description: `Se han ${studentsToAdd.length > 0 ? `añadido ${studentsToAdd.length} alumno(s)` : ''}${studentsToAdd.length > 0 && participantsToRemove.length > 0 ? ' y ' : ''}${participantsToRemove.length > 0 ? `eliminado ${participantsToRemove.length} alumno(s)` : ''} correctamente.`
      });
      
      // Reset selections
      setSelectedStudents(new Set());
      setSelectedParticipants(new Set());
      setPaymentData({});
      
      // Close modal after successful update
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error updating participants:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const isLoading = studentsLoading || participantsLoading;
  const isSaving = updateMutation.isPending || createMutation.isPending;

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
                        <div className="flex items-center gap-2 mt-1">
                          {participant.payment_status === 'paid' && (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Pagado
                            </Badge>
                          )}
                          {participant.payment_method && (
                            <Badge variant="outline" className="text-xs">
                              {participant.payment_method === 'efectivo' ? (
                                <Banknote className="h-3 w-3 mr-1" />
                              ) : (
                                <CreditCard className="h-3 w-3 mr-1" />
                              )}
                              {participant.payment_method}
                            </Badge>
                          )}
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
                  <div key={student.id} className="p-3 bg-muted rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
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

                    {/* Payment Information - Only show when student is selected */}
                    {selectedStudents.has(student.id) && (
                      <div className="ml-16 space-y-3 border-t pt-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`payment-method-${student.id}`} className="text-xs">
                              Método de pago
                            </Label>
                            <Select
                              value={paymentData[student.id]?.paymentMethod || ''}
                              onValueChange={(value) => handlePaymentDataChange(student.id, 'paymentMethod', value)}
                            >
                              <SelectTrigger id={`payment-method-${student.id}`} className="h-8 text-xs">
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="efectivo">
                                  <div className="flex items-center">
                                    <Banknote className="h-3 w-3 mr-2" />
                                    Efectivo
                                  </div>
                                </SelectItem>
                                <SelectItem value="tarjeta">
                                  <div className="flex items-center">
                                    <CreditCard className="h-3 w-3 mr-2" />
                                    Tarjeta
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor={`payment-status-${student.id}`} className="text-xs">
                              Estado del pago
                            </Label>
                            <Select
                              value={paymentData[student.id]?.paymentStatus || 'pending'}
                              onValueChange={(value) => handlePaymentDataChange(student.id, 'paymentStatus', value)}
                            >
                              <SelectTrigger id={`payment-status-${student.id}`} className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendiente</SelectItem>
                                <SelectItem value="paid">Pagado</SelectItem>
                                <SelectItem value="verified">Verificado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`payment-notes-${student.id}`} className="text-xs">
                            Notas (opcional)
                          </Label>
                          <Textarea
                            id={`payment-notes-${student.id}`}
                            placeholder="Información adicional sobre el pago..."
                            value={paymentData[student.id]?.paymentNotes || ''}
                            onChange={(e) => handlePaymentDataChange(student.id, 'paymentNotes', e.target.value)}
                            className="text-xs min-h-[60px]"
                          />
                        </div>
                      </div>
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
