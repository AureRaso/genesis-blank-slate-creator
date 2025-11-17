import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CreditCard, CheckCircle, AlertCircle, BookOpen } from "lucide-react";
import { MonthlyPaymentWithDetails } from "@/hooks/usePlayerMonthlyPayments";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface MonthlyPaymentCardProps {
  payment: MonthlyPaymentWithDetails;
  onMarkAsPaid: (paymentId: string, paymentMethod: string, notes?: string) => void;
  isLoading?: boolean;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const MonthlyPaymentCard = ({ payment, onMarkAsPaid, isLoading }: MonthlyPaymentCardProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [notes, setNotes] = useState("");

  const getStatusBadge = () => {
    switch (payment.status) {
      case 'pendiente':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'en_revision':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            En Revisión
          </Badge>
        );
      case 'pagado':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Pagado
          </Badge>
        );
    }
  };

  const handleConfirmPayment = () => {
    if (!paymentMethod) {
      return;
    }
    onMarkAsPaid(payment.id, paymentMethod, notes || undefined);
    setShowDialog(false);
    setPaymentMethod("");
    setNotes("");
  };

  return (
    <>
      <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex flex-col space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {MONTH_NAMES[payment.month - 1]} {payment.year}
              </h3>
              <p className="text-sm text-gray-500">{payment.student_enrollment.club?.name || 'Club'}</p>
            </div>
            {getStatusBadge()}
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <BookOpen className="w-4 h-4" />
              <span>{payment.total_classes} {payment.total_classes === 1 ? 'clase' : 'clases'}</span>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CreditCard className="w-4 h-4" />
              <span>{payment.price_per_class.toFixed(2)} € por clase</span>
            </div>
          </div>

          {/* Total Amount */}
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Total:</span>
              <span className="text-2xl font-bold text-gray-900">{payment.total_amount.toFixed(2)} €</span>
            </div>
          </div>

          {/* Classes List */}
          {payment.classes_details && payment.classes_details.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-sm font-medium text-gray-600 mb-2">Clases incluidas:</p>
              <ul className="space-y-1">
                {payment.classes_details.map((classDetail, index) => (
                  <li key={index} className="text-sm text-gray-500 flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>{classDetail.class_name}</span>
                    <span className="text-xs">
                      ({new Date(classDetail.class_date).toLocaleDateString('es-ES')} - {classDetail.start_time})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Payment Method (if set) */}
          {payment.payment_method && (
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-600">
                Método de pago: <span className="font-medium capitalize">{payment.payment_method}</span>
              </p>
            </div>
          )}

          {/* Action Button */}
          {payment.status === 'pendiente' && (
            <div className="pt-2">
              <Button
                onClick={() => setShowDialog(true)}
                disabled={isLoading}
                className="w-full"
              >
                Marcar como Pagado
              </Button>
            </div>
          )}

          {payment.status === 'en_revision' && (
            <div className="pt-2 bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-700">
                Tu pago está en revisión. Un profesor lo confirmará pronto.
              </p>
              {payment.marked_paid_at && (
                <p className="text-xs text-blue-600 mt-1">
                  Marcado como pagado el {new Date(payment.marked_paid_at).toLocaleDateString('es-ES')}
                </p>
              )}
            </div>
          )}

          {payment.status === 'pagado' && payment.verified_paid_at && (
            <div className="pt-2 bg-green-50 p-3 rounded-md">
              <p className="text-sm text-green-700">
                Pago confirmado el {new Date(payment.verified_paid_at).toLocaleDateString('es-ES')}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Payment Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pago</DialogTitle>
            <DialogDescription>
              Confirma que has realizado el pago de {payment.total_amount.toFixed(2)} € para {payment.total_classes} {payment.total_classes === 1 ? 'clase' : 'clases'} del mes de {MONTH_NAMES[payment.month - 1]}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment-method">Método de pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Selecciona el método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="bizum">Bizum</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Añade cualquier nota adicional sobre el pago..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={!paymentMethod || isLoading}
            >
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
