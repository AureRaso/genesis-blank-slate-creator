import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Users, Euro, UserPlus, AlertCircle } from "lucide-react";
import { StudentEnrollment } from "@/hooks/useStudentEnrollments";
import { useProgrammedClasses } from "@/hooks/useProgrammedClasses";
import { useMyTrainerProfile } from "@/hooks/useTrainers";
import { useCreateClassParticipant } from "@/hooks/useClassParticipants";
import { toast } from "@/hooks/use-toast";

interface AssignStudentToClassModalProps {
  student: StudentEnrollment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AssignStudentToClassModal = ({ student, isOpen, onClose }: AssignStudentToClassModalProps) => {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [discount1, setDiscount1] = useState("");
  const [discount2, setDiscount2] = useState("");

  const { data: trainerProfile } = useMyTrainerProfile();
  const trainerClubId = trainerProfile?.trainer_clubs?.[0]?.club_id;
  
  const { data: classes = [] } = useProgrammedClasses(trainerClubId);
  const createParticipant = useCreateClassParticipant();

  // Filter active classes that have available spots
  const availableClasses = classes.filter(cls => {
    const participantCount = cls.participants?.length || 0;
    const maxParticipants = 8; // Default max participants since it's not in the type
    return cls.is_active && participantCount < maxParticipants;
  });

  const selectedClass = availableClasses.find(cls => cls.id === selectedClassId);

  const handleAssign = async () => {
    if (!student || !selectedClassId || !selectedClass) {
      toast({
        title: "Error",
        description: "Por favor selecciona una clase",
        variant: "destructive",
      });
      return;
    }

    const participantData = {
      class_id: selectedClassId,
      student_enrollment_id: student.id,
      status: "active",
      payment_status: paymentAmount ? "paid" : "pending",
      amount_paid: paymentAmount ? parseFloat(paymentAmount) : 0,
      total_amount_due: 0, // We'll set this to 0 for now since monthly_price is not available
      payment_method: paymentMethod || undefined,
      payment_notes: paymentNotes || undefined,
      discount_1: discount1 ? parseFloat(discount1) : undefined,
      discount_2: discount2 ? parseFloat(discount2) : undefined,
      payment_verified: !!paymentAmount,
    };

    try {
      await createParticipant.mutateAsync(participantData);
      toast({
        title: "Alumno asignado",
        description: `${student.full_name} ha sido asignado a la clase ${selectedClass.name}`,
      });
      onClose();
      // Reset form
      setSelectedClassId("");
      setPaymentAmount("");
      setPaymentMethod("");
      setPaymentNotes("");
      setDiscount1("");
      setDiscount2("");
    } catch (error) {
      console.error("Error assigning student:", error);
    }
  };

  const calculateFinalAmount = () => {
    const baseAmount = 0; // No monthly_price available, default to 0
    const disc1 = discount1 ? parseFloat(discount1) : 0;
    const disc2 = discount2 ? parseFloat(discount2) : 0;
    return Math.max(0, baseAmount - disc1 - disc2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
            Asignar Alumno a Clase
          </DialogTitle>
          <DialogDescription className="text-sm">
            Selecciona una clase para asignar a {student?.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Student Info */}
          {student && (
            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-base sm:text-lg">{student.full_name}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Nivel {student.level} • {student.email} • {student.phone}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <Badge variant="outline" className="text-xs">
                    {student.enrollment_period}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {student.weekly_days.join(", ")}
                  </Badge>
                  {student.course && (
                    <Badge variant="outline" className="text-xs">
                      {student.course}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Class Selection */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="class-select" className="text-sm">Seleccionar Clase</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="h-9 sm:h-10">
                <SelectValue placeholder="Elige una clase disponible" />
              </SelectTrigger>
              <SelectContent>
                {availableClasses.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <AlertCircle className="h-4 w-4 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm">No hay clases disponibles</p>
                  </div>
                ) : (
                  availableClasses.map((cls) => {
                    const participantCount = cls.participants?.length || 0;
                    const maxParticipants = 8; // Default value

                    return (
                      <SelectItem key={cls.id} value={cls.id}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm">{cls.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {participantCount}/{maxParticipants}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Class Details */}
          {selectedClass && (
            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-base sm:text-lg">{selectedClass.name}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Detalles de la clase seleccionada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{selectedClass.days_of_week.join(", ")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{selectedClass.start_time} ({selectedClass.duration_minutes} min)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span>{selectedClass.participants?.length || 0}/8 alumnos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Euro className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span>Precio por definir</span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <Badge variant="outline" className="text-xs">
                    {selectedClass.custom_level || `Nivel ${selectedClass.level_from}-${selectedClass.level_to}`}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Information */}
          {selectedClass && (
            <div className="space-y-3 sm:space-y-4">
              <Label className="text-sm sm:text-base font-medium">Información de Pago</Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="discount1" className="text-xs sm:text-sm">Descuento 1 (€)</Label>
                  <Input
                    id="discount1"
                    type="number"
                    step="0.01"
                    min="0"
                    value={discount1}
                    onChange={(e) => setDiscount1(e.target.value)}
                    placeholder="0.00"
                    className="h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="discount2" className="text-xs sm:text-sm">Descuento 2 (€)</Label>
                  <Input
                    id="discount2"
                    type="number"
                    step="0.01"
                    min="0"
                    value={discount2}
                    onChange={(e) => setDiscount2(e.target.value)}
                    placeholder="0.00"
                    className="h-9 sm:h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="payment-amount" className="text-xs sm:text-sm">Cantidad Pagada (€)</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="payment-method" className="text-xs sm:text-sm">Método de Pago</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="h-9 sm:h-10">
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="bizum">Bizum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="payment-notes" className="text-xs sm:text-sm">Notas de Pago (opcional)</Label>
                <Textarea
                  id="payment-notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Observaciones sobre el pago..."
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="h-9 sm:h-10 text-sm">
              Cancelar
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedClassId || createParticipant.isPending}
              className="bg-gradient-to-r from-primary to-primary/80 h-9 sm:h-10 text-sm"
            >
              {createParticipant.isPending ? "Asignando..." : "Asignar a Clase"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};