import { useAdminMonthlyPayments, useVerifyPayment } from "@/hooks/useAdminMonthlyPayments";
import { Loader2, Wallet, FileText, TrendingUp, ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MonthlyPaymentWithStudent } from "@/hooks/useAdminMonthlyPayments";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const ITEMS_PER_PAGE = 50;

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

export default function AdminPaymentControlPage() {
  const { data: payments, isLoading } = useAdminMonthlyPayments();
  const verifyPayment = useVerifyPayment();
  const [activeTab, setActiveTab] = useState<string>("pendiente");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogPayment, setDialogPayment] = useState<MonthlyPaymentWithStudent | null>(null);
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Get unique months and years from payments
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
      availableYears: Array.from(years).sort((a, b) => b - a),
    };
  }, [payments]);

  // Reset to page 1 when active tab changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedPayments(new Set());
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
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Control de pagos</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona los pagos mensuales de todos los estudiantes</p>
        </div>

        <Card className="p-12 text-center border-dashed">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No hay pagos registrados
          </h3>
          <p className="text-gray-500 text-sm">
            Cuando los estudiantes se inscriban en clases mensuales, aquí podrás gestionar sus pagos.
          </p>
        </Card>
      </div>
    );
  }

  // Filter by search term, month, and year
  const filteredPayments = payments.filter(payment => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      payment.student_enrollment.full_name.toLowerCase().includes(searchLower) ||
      payment.student_enrollment.email.toLowerCase().includes(searchLower) ||
      (payment.student_enrollment.phone?.toLowerCase().includes(searchLower));

    const matchesMonth = selectedMonth === "all" || payment.month === parseInt(selectedMonth);
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
  const totalExpected = totalPending + totalInReview + totalPaid;

  // Pagination logic
  const getPaginatedData = (data: typeof filteredPayments) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data: typeof filteredPayments) => {
    return Math.ceil(data.length / ITEMS_PER_PAGE);
  };

  const getCurrentTabData = () => {
    switch (activeTab) {
      case "pendiente": return pendingPayments;
      case "en_revision": return inReviewPayments;
      case "pagado": return paidPayments;
      default: return pendingPayments;
    }
  };

  const currentData = getCurrentTabData();
  const paginatedData = getPaginatedData(currentData);
  const totalPages = getTotalPages(currentData);

  const handleFilterChange = () => {
    setCurrentPage(1);
    setSelectedPayments(new Set());
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = paginatedData.map(p => p.id);
      setSelectedPayments(new Set(allIds));
    } else {
      setSelectedPayments(new Set());
    }
  };

  const handleSelectPayment = (paymentId: string, checked: boolean) => {
    const newSelected = new Set(selectedPayments);
    if (checked) {
      newSelected.add(paymentId);
    } else {
      newSelected.delete(paymentId);
    }
    setSelectedPayments(newSelected);
  };

  const openDialog = (payment: MonthlyPaymentWithStudent, action: 'approve' | 'reject') => {
    setDialogPayment(payment);
    setDialogAction(action);
    setNotes(payment.notes || "");
    setRejectionReason("");
    setIsDialogOpen(true);
  };

  const handleVerify = () => {
    if (!dialogPayment || !dialogAction) return;

    if (dialogAction === 'approve') {
      verifyPayment.mutate({ paymentId: dialogPayment.id, status: 'pagado', notes });
    } else {
      verifyPayment.mutate({ paymentId: dialogPayment.id, status: 'pendiente', notes, rejectionReason });
    }
    setIsDialogOpen(false);
    setDialogPayment(null);
    setDialogAction(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' €';
  };

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, currentData.length);

    return (
      <div className="flex items-center justify-between mt-4 px-2">
        <div className="text-sm text-gray-500">
          Mostrando {startItem} - {endItem} de {currentData.length}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600 min-w-[80px] text-center">
            {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const PaymentRow = ({ payment }: { payment: MonthlyPaymentWithStudent }) => {
    const statusConfig = STATUS_CONFIG[payment.status];
    const StatusIcon = statusConfig.icon;
    const isSelected = selectedPayments.has(payment.id);

    return (
      <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
        <td className="py-3 px-4">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => handleSelectPayment(payment.id, checked as boolean)}
          />
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {payment.student_enrollment.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{payment.student_enrollment.full_name}</p>
              <p className="text-xs text-gray-500">{payment.total_classes} clases · {payment.price_per_class.toFixed(0)} € / clase</p>
            </div>
          </div>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="font-semibold text-gray-900">{formatCurrency(payment.total_amount)}</span>
        </td>
        <td className="py-3 px-4">
          <Badge variant="outline" className={`${statusConfig.color} flex items-center gap-1 w-fit`}>
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </td>
        <td className="py-3 px-4 text-right">
          {payment.status !== 'pagado' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 hover:bg-primary/5 font-medium"
              onClick={() => openDialog(payment, 'approve')}
            >
              Marcar como pagado
            </Button>
          )}
          {payment.status === 'pagado' && payment.verified_paid_at && (
            <span className="text-xs text-gray-500">
              Verificado {new Date(payment.verified_paid_at).toLocaleDateString('es-ES')}
            </span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Control de pagos</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona los pagos mensuales de todos los estudiantes</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-gradient-to-br from-violet-50 to-white border-violet-100">
          <p className="text-xs font-medium text-violet-600 mb-1">Total Esperado</p>
          <p className="text-xl font-bold text-violet-900">{formatCurrency(totalExpected)}</p>
          <p className="text-xs text-violet-500 mt-1">{filteredPayments.length} pagos</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-amber-600 mb-1">Pendientes</p>
              <p className="text-xl font-bold text-amber-900">{formatCurrency(totalPending)}</p>
              <p className="text-xs text-amber-500 mt-1">{pendingPayments.length} pagos</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <FileText className="h-4 w-4 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600 mb-1">En Revisión</p>
              <p className="text-xl font-bold text-blue-900">{formatCurrency(totalInReview)}</p>
              <p className="text-xs text-blue-500 mt-1">{inReviewPayments.length} pagos</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600 mb-1">Pagados</p>
              <p className="text-xl font-bold text-emerald-900">{formatCurrency(totalPaid)}</p>
              <p className="text-xs text-emerald-500 mt-1">{paidPayments.length} pagos</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleFilterChange();
            }}
            className="pl-9 bg-white"
          />
          {searchTerm && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              ({filteredPayments.length})
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={(value) => {
            setSelectedMonth(value);
            handleFilterChange();
          }}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="Todos los meses" />
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
            <SelectTrigger className="w-[130px] bg-white">
              <SelectValue placeholder="Todos los años" />
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent border-b border-gray-200 w-full justify-start rounded-none h-auto p-0 mb-0">
          <TabsTrigger
            value="pendiente"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 font-medium"
          >
            Pendientes ({pendingPayments.length})
          </TabsTrigger>
          <TabsTrigger
            value="en_revision"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 font-medium"
          >
            En Revisión ({inReviewPayments.length})
          </TabsTrigger>
          <TabsTrigger
            value="pagado"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 font-medium"
          >
            Pagados ({paidPayments.length})
          </TabsTrigger>
        </TabsList>

        {/* Table Content */}
        <div className="bg-white rounded-lg border border-gray-200 mt-4 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="py-3 px-4 text-left w-12">
                  <Checkbox
                    checked={paginatedData.length > 0 && paginatedData.every(p => selectedPayments.has(p.id))}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alumno
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    {searchTerm ? 'No se encontraron pagos con ese criterio de búsqueda' : 'No hay pagos en esta categoría'}
                  </td>
                </tr>
              ) : (
                paginatedData.map((payment) => (
                  <PaymentRow key={payment.id} payment={payment} />
                ))
              )}
            </tbody>
          </table>
          <PaginationControls />
        </div>
      </Tabs>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === 'approve' ? 'Confirmar Pago' : 'Rechazar Pago'}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === 'approve' && dialogPayment
                ? `Confirmar el pago de ${formatCurrency(dialogPayment.total_amount)} de ${dialogPayment.student_enrollment.full_name}`
                : `El alumno será notificado del rechazo y deberá volver a marcar el pago.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {dialogAction === 'reject' && (
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">
                  Motivo del rechazo <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Ej: El comprobante no coincide con el monto, imagen borrosa, datos incorrectos..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">
                  Este motivo será visible para el alumno
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">
                Notas {dialogAction === 'approve' ? '(opcional)' : 'internas (opcional)'}
              </Label>
              <Textarea
                id="notes"
                placeholder={dialogAction === 'approve'
                  ? "Añade notas sobre esta verificación..."
                  : "Notas internas solo visibles para administradores..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleVerify}
              variant={dialogAction === 'approve' ? 'default' : 'destructive'}
              disabled={dialogAction === 'reject' && !rejectionReason.trim()}
            >
              {dialogAction === 'approve' ? 'Confirmar' : 'Rechazar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
