import { useAdminMonthlyPayments, useVerifyPayment } from "@/hooks/useAdminMonthlyPayments";
import { AdminPaymentCard } from "@/components/AdminPaymentCard";
import { Loader2, Wallet, FileText, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const ITEMS_PER_PAGE = 50;

export default function AdminPaymentControlPage() {
  const { data: payments, isLoading } = useAdminMonthlyPayments();
  const verifyPayment = useVerifyPayment();
  const [activeTab, setActiveTab] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Get unique months and years from payments - MUST be called before any early returns
  const { availableMonths, availableYears } = useMemo(() => {
    if (!payments) return { availableMonths: [], availableYears: [] };

    const months = new Set<number>();
    const years = new Set<number>();

    payments.forEach(payment => {
      months.add(payment.month);
      years.add(payment.year);
    });

    return {
      availableMonths: Array.from(months).sort((a, b) => a - b),
      availableYears: Array.from(years).sort((a, b) => b - a), // Most recent first
    };
  }, [payments]);

  // Reset to page 1 when active tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

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

  // Filter by search term, month, and year
  const filteredPayments = payments.filter(payment => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      payment.student_enrollment.full_name.toLowerCase().includes(searchLower) ||
      payment.student_enrollment.email.toLowerCase().includes(searchLower) ||
      (payment.student_enrollment.phone?.toLowerCase().includes(searchLower));

    // Month filter
    const matchesMonth = selectedMonth === "all" || payment.month === parseInt(selectedMonth);

    // Year filter
    const matchesYear = selectedYear === "all" || payment.year === parseInt(selectedYear);

    return matchesSearch && matchesMonth && matchesYear;
  });

  // Filter payments by status
  const pendingPayments = filteredPayments.filter(p => p.status === 'pendiente');
  const inReviewPayments = filteredPayments.filter(p => p.status === 'en_revision');
  const paidPayments = filteredPayments.filter(p => p.status === 'pagado');

  // Get summary statistics
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.total_amount, 0);
  const totalInReview = inReviewPayments.reduce((sum, p) => sum + p.total_amount, 0);
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.total_amount, 0);
  const totalExpected = filteredPayments.reduce((sum, p) => sum + p.total_amount, 0);

  // Pagination logic
  const getPaginatedData = (data: typeof filteredPayments) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data: typeof filteredPayments) => {
    return Math.ceil(data.length / ITEMS_PER_PAGE);
  };

  const paginatedAll = getPaginatedData(filteredPayments);
  const paginatedPending = getPaginatedData(pendingPayments);
  const paginatedInReview = getPaginatedData(inReviewPayments);
  const paginatedPaid = getPaginatedData(paidPayments);

  const totalPagesAll = getTotalPages(filteredPayments);
  const totalPagesPending = getTotalPages(pendingPayments);
  const totalPagesInReview = getTotalPages(inReviewPayments);
  const totalPagesPaid = getTotalPages(paidPayments);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleVerify = (paymentId: string, status: 'pagado' | 'pendiente', notes?: string, rejectionReason?: string) => {
    verifyPayment.mutate({ paymentId, status, notes, rejectionReason });
  };

  const PaginationControls = ({ totalItems, totalPages, currentData }: { totalItems: number; totalPages: number; currentData: any[] }) => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

    return (
      <div className="flex items-center justify-between mt-6 px-4">
        <div className="text-sm text-gray-600">
          Mostrando {startItem} - {endItem} de {totalItems} pagos
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
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

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Buscar por nombre, email o teléfono..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            handleFilterChange();
          }}
          className="flex-1 md:max-w-md"
        />
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={(value) => {
            setSelectedMonth(value);
            handleFilterChange();
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los meses</SelectItem>
              {availableMonths.map((month) => (
                <SelectItem key={month} value={month.toString()}>
                  {MONTH_NAMES[month - 1]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={(value) => {
            setSelectedYear(value);
            handleFilterChange();
          }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filtrar por año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los años</SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedAll.map((payment) => (
                  <AdminPaymentCard
                    key={payment.id}
                    payment={payment}
                    onVerify={handleVerify}
                    isLoading={verifyPayment.isPending}
                  />
                ))}
              </div>
              <PaginationControls
                totalItems={filteredPayments.length}
                totalPages={totalPagesAll}
                currentData={paginatedAll}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="pendiente" className="space-y-4 mt-6">
          {pendingPayments.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No hay pagos pendientes</p>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedPending.map((payment) => (
                  <AdminPaymentCard
                    key={payment.id}
                    payment={payment}
                    onVerify={handleVerify}
                    isLoading={verifyPayment.isPending}
                  />
                ))}
              </div>
              <PaginationControls
                totalItems={pendingPayments.length}
                totalPages={totalPagesPending}
                currentData={paginatedPending}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="en_revision" className="space-y-4 mt-6">
          {inReviewPayments.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No hay pagos en revisión</p>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedInReview.map((payment) => (
                  <AdminPaymentCard
                    key={payment.id}
                    payment={payment}
                    onVerify={handleVerify}
                    isLoading={verifyPayment.isPending}
                  />
                ))}
              </div>
              <PaginationControls
                totalItems={inReviewPayments.length}
                totalPages={totalPagesInReview}
                currentData={paginatedInReview}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="pagado" className="space-y-4 mt-6">
          {paidPayments.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No hay pagos confirmados aún</p>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedPaid.map((payment) => (
                  <AdminPaymentCard
                    key={payment.id}
                    payment={payment}
                    onVerify={handleVerify}
                    isLoading={verifyPayment.isPending}
                  />
                ))}
              </div>
              <PaginationControls
                totalItems={paidPayments.length}
                totalPages={totalPagesPaid}
                currentData={paginatedPaid}
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
