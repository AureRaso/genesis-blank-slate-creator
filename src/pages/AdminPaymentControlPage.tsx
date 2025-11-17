import { useAdminMonthlyPayments, useVerifyPayment } from "@/hooks/useAdminMonthlyPayments";
import { AdminPaymentCard } from "@/components/AdminPaymentCard";
import { Loader2, Wallet, FileText, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdminPaymentControlPage() {
  const { data: payments, isLoading } = useAdminMonthlyPayments();
  const verifyPayment = useVerifyPayment();
  const [activeTab, setActiveTab] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");

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
            Control de Pagos
          </h1>
          <p className="text-gray-600 mt-2">Gestiona los pagos mensuales de todos los estudiantes</p>
        </div>

        <Card className="p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No hay pagos registrados
          </h3>
          <p className="text-gray-500">
            Cuando los estudiantes se inscriban en clases mensuales, aquí podrás gestionar sus pagos.
          </p>
        </Card>
      </div>
    );
  }

  // Filter by search term
  const filteredPayments = payments.filter(payment => {
    const searchLower = searchTerm.toLowerCase();
    return (
      payment.student_enrollment.full_name.toLowerCase().includes(searchLower) ||
      payment.student_enrollment.email.toLowerCase().includes(searchLower) ||
      (payment.student_enrollment.phone?.toLowerCase().includes(searchLower))
    );
  });

  // Filter payments by status
  const pendingPayments = filteredPayments.filter(p => p.status === 'pendiente');
  const inReviewPayments = filteredPayments.filter(p => p.status === 'en_revision');
  const paidPayments = filteredPayments.filter(p => p.status === 'pagado');

  // Get summary statistics
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.total_amount, 0);
  const totalInReview = inReviewPayments.reduce((sum, p) => sum + p.total_amount, 0);
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.total_amount, 0);
  const totalExpected = payments.reduce((sum, p) => sum + p.total_amount, 0);

  const handleVerify = (paymentId: string, status: 'pagado' | 'pendiente', notes?: string) => {
    verifyPayment.mutate({ paymentId, status, notes });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Wallet className="h-8 w-8" />
          Control de Pagos
        </h1>
        <p className="text-gray-600 mt-2">Gestiona los pagos mensuales de todos los estudiantes</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total Esperado</p>
              <p className="text-2xl font-bold text-purple-900">{totalExpected.toFixed(2)} €</p>
              <p className="text-xs text-purple-600 mt-1">{payments.length} pagos</p>
            </div>
            <div className="h-12 w-12 bg-purple-200 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-700" />
            </div>
          </div>
        </Card>

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

      {/* Search Bar */}
      <div className="mb-6">
        <Input
          placeholder="Buscar por nombre, email o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Payments Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todos">
            Todos ({filteredPayments.length})
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
          {filteredPayments.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">
                {searchTerm ? 'No se encontraron pagos con ese criterio de búsqueda' : 'No hay pagos registrados'}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredPayments.map((payment) => (
                <AdminPaymentCard
                  key={payment.id}
                  payment={payment}
                  onVerify={handleVerify}
                  isLoading={verifyPayment.isPending}
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
                <AdminPaymentCard
                  key={payment.id}
                  payment={payment}
                  onVerify={handleVerify}
                  isLoading={verifyPayment.isPending}
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
                <AdminPaymentCard
                  key={payment.id}
                  payment={payment}
                  onVerify={handleVerify}
                  isLoading={verifyPayment.isPending}
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
                <AdminPaymentCard
                  key={payment.id}
                  payment={payment}
                  onVerify={handleVerify}
                  isLoading={verifyPayment.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
