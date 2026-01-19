import { useState } from "react";
import { Wallet, Clock, CheckCircle2, AlertCircle, Loader2, Calendar, Euro, CreditCard, Banknote, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useMyPayments, useMarkPaymentAsPaid, StudentPayment } from "@/hooks/useStudentPayments";

const STATUS_CONFIG = {
  pendiente: {
    label: "Pendiente",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: AlertCircle,
  },
  en_revision: {
    label: "En Revisión",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Clock,
  },
  pagado: {
    label: "Pagado",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
};

const PAYMENT_METHOD_CONFIG = {
  efectivo: { label: "Efectivo", icon: Banknote },
  tarjeta: { label: "Tarjeta", icon: CreditCard },
  bizum: { label: "Bizum", icon: Smartphone },
};

export default function PlayerPaymentsPage() {
  const { data: payments, isLoading } = useMyPayments();
  const markAsPaid = useMarkPaymentAsPaid();

  const [activeTab, setActiveTab] = useState<string>("pendiente");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<StudentPayment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'bizum' | ''>('');
  const [studentNotes, setStudentNotes] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter payments
  const pendingPayments = payments?.filter(p => p.status === 'pendiente') || [];
  const inReviewPayments = payments?.filter(p => p.status === 'en_revision') || [];
  const paidPayments = payments?.filter(p => p.status === 'pagado') || [];

  // Calculate totals
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleOpenPayDialog = (payment: StudentPayment) => {
    setSelectedPayment(payment);
    setPaymentMethod('');
    setStudentNotes('');
    setIsDialogOpen(true);
  };

  const handleMarkAsPaid = async () => {
    if (!selectedPayment || !paymentMethod) return;

    await markAsPaid.mutateAsync({
      paymentId: selectedPayment.id,
      paymentMethod,
      studentNotes: studentNotes || undefined,
    });

    setIsDialogOpen(false);
    setSelectedPayment(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' €';
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueBadge = (dueDate: string) => {
    const days = getDaysUntilDue(dueDate);

    if (days < 0) {
      return <Badge variant="destructive">Vencido hace {Math.abs(days)} días</Badge>;
    } else if (days === 0) {
      return <Badge variant="destructive">Vence hoy</Badge>;
    } else if (days <= 7) {
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Vence en {days} días</Badge>;
    } else {
      return <Badge variant="secondary">Vence en {days} días</Badge>;
    }
  };

  const PaymentCard = ({ payment }: { payment: StudentPayment }) => {
    const statusConfig = STATUS_CONFIG[payment.status];
    const StatusIcon = statusConfig.icon;

    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{payment.concept}</h3>
              {payment.description && (
                <p className="text-sm text-gray-500">{payment.description}</p>
              )}
            </div>
            <Badge className={statusConfig.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Amount */}
          <div className="flex items-center gap-2">
            <Euro className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(payment.amount)}
            </span>
          </div>

          {/* Dates */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Emitido: {new Date(payment.issue_date).toLocaleDateString('es-ES')}</span>
            </div>
            <span className="hidden sm:inline text-gray-300">•</span>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Vence: {new Date(payment.due_date).toLocaleDateString('es-ES')}</span>
            </div>
          </div>

          {/* Due badge for pending */}
          {payment.status === 'pendiente' && (
            <div>{getDueBadge(payment.due_date)}</div>
          )}

          {/* Payment method for paid/in review */}
          {payment.payment_method && (
            <div className="flex items-center gap-2 text-sm">
              {(() => {
                const methodConfig = PAYMENT_METHOD_CONFIG[payment.payment_method];
                const MethodIcon = methodConfig.icon;
                return (
                  <>
                    <MethodIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Método: {methodConfig.label}</span>
                  </>
                );
              })()}
            </div>
          )}

          {/* Actions */}
          {payment.status === 'pendiente' && (
            <Button
              onClick={() => handleOpenPayDialog(payment)}
              className="w-full mt-2"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              He pagado
            </Button>
          )}

          {payment.status === 'en_revision' && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <Clock className="h-4 w-4 inline mr-2" />
              Pendiente de verificación por el administrador
            </div>
          )}

          {payment.status === 'pagado' && payment.admin_verified_at && (
            <div className="p-3 bg-emerald-50 rounded-lg text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 inline mr-2" />
              Verificado el {new Date(payment.admin_verified_at).toLocaleDateString('es-ES')}
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Wallet className="h-6 w-6" />
          Mis Pagos
        </h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona los pagos de tus clases</p>
      </div>

      {/* Summary Card */}
      {totalPending > 0 && (
        <Card className="p-4 mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700">Total pendiente de pago</p>
              <p className="text-2xl font-bold text-amber-900">{formatCurrency(totalPending)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="pendiente" className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            Pendientes ({pendingPayments.length})
          </TabsTrigger>
          <TabsTrigger value="en_revision" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            En Revisión ({inReviewPayments.length})
          </TabsTrigger>
          <TabsTrigger value="pagado" className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Pagados ({paidPayments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendiente" className="space-y-4">
          {pendingPayments.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <CheckCircle2 className="h-12 w-12 text-emerald-300 mx-auto mb-4" />
              <p className="text-gray-500">No tienes pagos pendientes</p>
            </Card>
          ) : (
            pendingPayments.map(payment => (
              <PaymentCard key={payment.id} payment={payment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="en_revision" className="space-y-4">
          {inReviewPayments.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay pagos en revisión</p>
            </Card>
          ) : (
            inReviewPayments.map(payment => (
              <PaymentCard key={payment.id} payment={payment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="pagado" className="space-y-4">
          {paidPayments.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay pagos realizados aún</p>
            </Card>
          ) : (
            paidPayments.map(payment => (
              <PaymentCard key={payment.id} payment={payment} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Mark as Paid Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pago</DialogTitle>
            <DialogDescription>
              Indica cómo has realizado el pago de {selectedPayment && formatCurrency(selectedPayment.amount)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Método de pago *</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v: 'efectivo' | 'tarjeta' | 'bizum') => setPaymentMethod(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Efectivo
                    </div>
                  </SelectItem>
                  <SelectItem value="tarjeta">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Tarjeta
                    </div>
                  </SelectItem>
                  <SelectItem value="bizum">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Bizum
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                placeholder="Añade cualquier información adicional..."
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleMarkAsPaid}
              disabled={!paymentMethod || markAsPaid.isPending}
            >
              {markAsPaid.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
