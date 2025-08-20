import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { StudentEnrollment, useUpdateStudentEnrollment } from "@/hooks/useStudentEnrollments";
import { Mail, Phone, Calendar, Euro, Clock, User, BookOpen, FileText } from "lucide-react";

interface StudentEditModalProps {
  student: StudentEnrollment | null;
  isOpen: boolean;
  onClose: () => void;
}

const StudentEditModal = ({ student, isOpen, onClose }: StudentEditModalProps) => {
  const [formData, setFormData] = useState({
    full_name: student?.full_name || "",
    email: student?.email || "",
    phone: student?.phone || "",
    level: student?.level || 3,
    weekly_days: student?.weekly_days || [],
    preferred_times: student?.preferred_times || [],
    enrollment_period: student?.enrollment_period || "",
    course: student?.course || "",
    discount_1: student?.discount_1 || 0,
    discount_2: student?.discount_2 || 0,
    first_payment: student?.first_payment || 0,
    payment_method: student?.payment_method || "",
    observations: student?.observations || "",
  });

  const updateMutation = useUpdateStudentEnrollment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    updateMutation.mutate(
      { id: student.id, data: formData },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handleWeeklyDayChange = (day: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      weekly_days: checked 
        ? [...prev.weekly_days, day]
        : prev.weekly_days.filter(d => d !== day)
    }));
  };

  const handlePreferredTimeChange = (time: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      preferred_times: checked 
        ? [...prev.preferred_times, time]
        : prev.preferred_times.filter(t => t !== time)
    }));
  };

  if (!student) return null;

  const weekDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const timeSlots = ["Mañana (9:00-12:00)", "Mediodía (12:00-15:00)", "Tarde (15:00-18:00)", "Noche (18:00-21:00)"];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Alumno
          </DialogTitle>
          <DialogDescription>
            Modifica los datos de {student.full_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos Personales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nombre Completo
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Teléfono
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Nivel</Label>
              <Select 
                value={formData.level.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, level: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                    <SelectItem key={level} value={level.toString()}>
                      Nivel {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Días de la Semana */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Días Disponibles
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {weekDays.map(day => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={formData.weekly_days.includes(day)}
                    onCheckedChange={(checked) => handleWeeklyDayChange(day, checked as boolean)}
                  />
                  <Label htmlFor={day} className="text-sm">{day}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Horarios Preferidos */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horarios Preferidos
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {timeSlots.map(time => (
                <div key={time} className="flex items-center space-x-2">
                  <Checkbox
                    id={time}
                    checked={formData.preferred_times.includes(time)}
                    onCheckedChange={(checked) => handlePreferredTimeChange(time, checked as boolean)}
                  />
                  <Label htmlFor={time} className="text-sm">{time}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Datos del Curso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="enrollment_period">Período de Inscripción</Label>
              <Select 
                value={formData.enrollment_period} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, enrollment_period: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="bimensual">Bimensual</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="course" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Curso
              </Label>
              <Input
                id="course"
                value={formData.course}
                onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
                placeholder="Ej: Curso de Iniciación"
              />
            </div>
          </div>

          {/* Datos de Pago */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_payment" className="flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Primer Pago (€)
              </Label>
              <Input
                id="first_payment"
                type="number"
                step="0.01"
                value={formData.first_payment}
                onChange={(e) => setFormData(prev => ({ ...prev, first_payment: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_1">Descuento 1 (%)</Label>
              <Input
                id="discount_1"
                type="number"
                step="0.01"
                value={formData.discount_1}
                onChange={(e) => setFormData(prev => ({ ...prev, discount_1: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_2">Descuento 2 (%)</Label>
              <Input
                id="discount_2"
                type="number"
                step="0.01"
                value={formData.discount_2}
                onChange={(e) => setFormData(prev => ({ ...prev, discount_2: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Método de Pago</Label>
            <Select 
              value={formData.payment_method} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona método de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="tarjeta">Tarjeta</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="bizum">Bizum</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observations" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Observaciones
            </Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
              placeholder="Notas adicionales sobre el alumno..."
              rows={3}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark"
            >
              {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StudentEditModal;