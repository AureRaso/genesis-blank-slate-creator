import { usePlayerMonthlyPayments, useMarkPaymentAsPaid } from "@/hooks/usePlayerMonthlyPayments";
import { MonthlyPaymentCard } from "@/components/MonthlyPaymentCard";
import { Loader2, Wallet, FileText } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function PlayerPaymentsPage() {
  const { data: payments, isLoading } = usePlayerMonthlyPayments();
  const markAsPaid = useMarkPaymentAsPaid();
  const [activeTab, setActiveTab] = useState<string>("todos");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="h-8 w-8" />
            Mis Pagos
          </h1>
          <p className="text-gray-600 mt-2">Gestiona los pagos de tus clases mensuales</p>
        </div>

        <Card className="p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No tienes pagos pendientes
          </h3>
          <p className="text-gray-500">
            Cuando te inscribas en clases mensuales, aquí podrás gestionar tus pagos.
          </p>
        </Card>
      </div>
    );
  }

  // Filter payments by status
  const pendingPayments = payments.filter(p => p.status === 'pendiente');
  const inReviewPayments = payments.filter(p => p.status === 'en_revision');
  const paidPayments = payments.filter(p => p.status === 'pagado');

  // Get summary statistics
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.total_amount, 0);
  const totalInReview = inReviewPayments.reduce((sum, p) => sum + p.total_amount, 0);
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.total_amount, 0);

  const handleMarkAsPaid = (paymentId: string, paymentMethod: string, notes?: string) => {
    markAsPaid.mutate({
      paymentId,
      paymentMethod: paymentMethod as 'efectivo' | 'bizum' | 'transferencia' | 'tarjeta',
      notes,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Wallet className="h-8 w-8" />
          Mis Pagos
        </h1>
        <p className="text-gray-600 mt-2">Gestiona los pagos de tus clases mensuales</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-900">{totalPending.toFixed(2)} €</p>
              <p className="text-xs text-yellow-600 mt-1">{pendingPayments.length} pagos</p>
            </div>
            <div className="h-12 w-12 bg-yellow-200 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-yellow-700" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">En Revisión</p>
              <p className="text-2xl font-bold text-blue-900">{totalInReview.toFixed(2)} €</p>
              <p className="text-xs text-blue-600 mt-1">{inReviewPayments.length} pagos</p>
            </div>
            <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-blue-700" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Pagados</p>
              <p className="text-2xl font-bold text-green-900">{totalPaid.toFixed(2)} €</p>
              <p className="text-xs text-green-600 mt-1">{paidPayments.length} pagos</p>
            </div>
            <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center">
              <Wallet className="h-6 w-6 text-green-700" />
            </div>
          </div>
        </Card>
      </div>

      {/* Payments Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todos">
            Todos ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="pendiente">
            Pendientes ({pendingPayments.length})
          </TabsTrigger>
          <TabsTrigger value="en_revision">
            En Revisión ({inReviewPayments.length})
          </TabsTrigger>
          <TabsTrigger value="pagado">
            Pagados ({paidPayments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4 mt-6">
          {payments.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No hay pagos registrados</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {payments.map((payment) => (
                <MonthlyPaymentCard
                  key={payment.id}
                  payment={payment}
                  onMarkAsPaid={handleMarkAsPaid}
                  isLoading={markAsPaid.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pendiente" className="space-y-4 mt-6">
          {pendingPayments.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No hay pagos pendientes</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingPayments.map((payment) => (
                <MonthlyPaymentCard
                  key={payment.id}
                  payment={payment}
                  onMarkAsPaid={handleMarkAsPaid}
                  isLoading={markAsPaid.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="en_revision" className="space-y-4 mt-6">
          {inReviewPayments.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No hay pagos en revisión</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {inReviewPayments.map((payment) => (
                <MonthlyPaymentCard
                  key={payment.id}
                  payment={payment}
                  onMarkAsPaid={handleMarkAsPaid}
                  isLoading={markAsPaid.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pagado" className="space-y-4 mt-6">
          {paidPayments.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No hay pagos confirmados aún</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {paidPayments.map((payment) => (
                <MonthlyPaymentCard
                  key={payment.id}
                  payment={payment}
                  onMarkAsPaid={handleMarkAsPaid}
                  isLoading={markAsPaid.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
