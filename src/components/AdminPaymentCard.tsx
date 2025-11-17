import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, User, Mail, Phone } from "lucide-react";
import { MonthlyPaymentWithStudent } from "@/hooks/useAdminMonthlyPayments";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const STATUS_CONFIG = {
  pendiente: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: AlertCircle,
  },
  en_revision: {
    label: "En Revisión",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: Clock,
  },
  pagado: {
    label: "Pagado",
    color: "bg-green-100 text-green-800 border-green-300",
    icon: CheckCircle2,
  },
};

const PAYMENT_METHOD_LABELS = {
  efectivo: "Efectivo",
  bizum: "Bizum",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

interface AdminPaymentCardProps {
  payment: MonthlyPaymentWithStudent;
  onVerify: (paymentId: string, status: 'pagado' | 'pendiente', notes?: string) => void;
  isLoading?: boolean;
}

export function AdminPaymentCard({ payment, onVerify, isLoading }: AdminPaymentCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notes, setNotes] = useState(payment.notes || "");
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const statusConfig = STATUS_CONFIG[payment.status];
  const StatusIcon = statusConfig.icon;

  const handleVerify = () => {
    if (actionType === 'approve') {
      onVerify(payment.id, 'pagado', notes);
    } else if (actionType === 'reject') {
      onVerify(payment.id, 'pendiente', notes);
    }
    setIsDialogOpen(false);
    setActionType(null);
  };

  const openApproveDialog = () => {
    setActionType('approve');
    setIsDialogOpen(true);
  };

  const openRejectDialog = () => {
    setActionType('reject');
    setIsDialogOpen(true);
  };

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Header: Student Info */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                {payment.student_enrollment.full_name}
              </h3>
            </div>
            <div className="flex flex-col gap-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{payment.student_enrollment.email}</span>
              </div>
              {payment.student_enrollment.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{payment.student_enrollment.phone}</span>
                </div>
              )}
            </div>
          </div>
          <Badge className={`${statusConfig.color} flex items-center gap-1`}>
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Payment Period */}
        <div className="flex items-center gap-2 text-gray-700">
          <Calendar className="h-5 w-5 text-primary" />
          <span className="font-medium">
            {MONTH_NAMES[payment.month - 1]} {payment.year}
          </span>
        </div>

        {/* Payment Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500">Clases</p>
            <p className="text-lg font-semibold text-gray-900">{payment.total_classes}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Precio/Clase</p>
            <p className="text-lg font-semibold text-gray-900">{payment.price_per_class.toFixed(2)}€</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-semibold text-primary">{payment.total_amount.toFixed(2)}€</p>
          </div>
        </div>

        {/* Classes List */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Clases del mes:</p>
          <div className="space-y-2">
            {payment.classes_details.map((classDetail, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{classDetail.class_name}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(classDetail.class_date).toLocaleDateString('es-ES')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {classDetail.start_time} ({classDetail.duration_minutes} min)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method & Notes */}
        {(payment.payment_method || payment.notes) && (
          <div className="space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            {payment.payment_method && (
              <div>
                <p className="text-xs text-gray-600">Método de pago:</p>
                <p className="font-medium text-gray-900">
                  {PAYMENT_METHOD_LABELS[payment.payment_method]}
                </p>
              </div>
            )}
            {payment.notes && (
              <div>
                <p className="text-xs text-gray-600">Notas:</p>
                <p className="text-sm text-gray-900">{payment.notes}</p>
              </div>
            )}
            {payment.marked_paid_at && (
              <div>
                <p className="text-xs text-gray-600">Marcado como pagado:</p>
                <p className="text-sm text-gray-900">
                  {new Date(payment.marked_paid_at).toLocaleString('es-ES')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {(payment.status === 'pendiente' || payment.status === 'en_revision') && (
          <div className="flex gap-2 pt-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={openApproveDialog}
                  className="flex-1"
                  variant="default"
                  disabled={isLoading}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como Pagado
                </Button>
              </DialogTrigger>
              {payment.status === 'en_revision' && (
                <DialogTrigger asChild>
                  <Button
                    onClick={openRejectDialog}
                    className="flex-1"
                    variant="outline"
                    disabled={isLoading}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                </DialogTrigger>
              )}
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {actionType === 'approve' ? 'Confirmar Pago' : 'Rechazar Pago'}
                  </DialogTitle>
                  <DialogDescription>
                    {actionType === 'approve'
                      ? `Confirmar el pago de ${payment.total_amount.toFixed(2)}€ de ${payment.student_enrollment.full_name}`
                      : `Rechazar el pago y devolverlo a estado pendiente`}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas (opcional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Añade notas sobre esta verificación..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleVerify}
                    variant={actionType === 'approve' ? 'default' : 'destructive'}
                  >
                    {actionType === 'approve' ? 'Confirmar' : 'Rechazar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {payment.status === 'pagado' && payment.verified_paid_at && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
            <p className="text-green-800">
              ✓ Verificado el {new Date(payment.verified_paid_at).toLocaleString('es-ES')}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
