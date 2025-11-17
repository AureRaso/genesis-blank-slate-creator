import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, User, Mail, Phone, ChevronDown, ChevronUp } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const [isClassesOpen, setIsClassesOpen] = useState(false);

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
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        {/* Header: Student Info & Status */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {payment.student_enrollment.full_name}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="h-3 w-3 text-primary flex-shrink-0" />
              <span className="font-medium">
                {MONTH_NAMES[payment.month - 1]} {payment.year}
              </span>
            </div>
          </div>
          <Badge className={`${statusConfig.color} flex items-center gap-1 flex-shrink-0`}>
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Payment Summary - Más compacto */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Clases:</span>
            <span className="font-semibold text-gray-900">{payment.total_classes}</span>
          </div>
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Precio:</span>
            <span className="font-semibold text-gray-900">{payment.price_per_class.toFixed(2)}€</span>
          </div>
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Total:</span>
            <span className="font-semibold text-primary">{payment.total_amount.toFixed(2)}€</span>
          </div>
        </div>

        {/* Classes List - Collapsible */}
        <Collapsible open={isClassesOpen} onOpenChange={setIsClassesOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full flex items-center justify-between p-2 h-auto text-sm hover:bg-gray-50"
            >
              <span className="font-medium text-gray-700">
                Ver clases del mes ({payment.total_classes})
              </span>
              {isClassesOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="grid grid-cols-2 gap-2">
              {payment.classes_details.map((classDetail, index) => (
                <div
                  key={index}
                  className="p-2 bg-gray-50 border border-gray-200 rounded text-xs"
                >
                  <p className="font-medium text-gray-900 truncate mb-1">{classDetail.class_name}</p>
                  <div className="space-y-0.5 text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span>{new Date(classDetail.class_date).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span>{classDetail.start_time} ({classDetail.duration_minutes}min)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Payment Method & Notes */}
        {(payment.payment_method || payment.notes || payment.marked_paid_at) && (
          <div className="space-y-1 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
            {payment.payment_method && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Método:</span>
                <span className="font-medium text-gray-900">
                  {PAYMENT_METHOD_LABELS[payment.payment_method]}
                </span>
              </div>
            )}
            {payment.notes && (
              <div>
                <span className="text-gray-600">Notas: </span>
                <span className="text-gray-900">{payment.notes}</span>
              </div>
            )}
            {payment.marked_paid_at && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Marcado:</span>
                <span className="text-gray-900">
                  {new Date(payment.marked_paid_at).toLocaleDateString('es-ES')}
                </span>
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
          <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
            ✓ Verificado el {new Date(payment.verified_paid_at).toLocaleDateString('es-ES')}
          </div>
        )}
      </div>
    </Card>
  );
}
