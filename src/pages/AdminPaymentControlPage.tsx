import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Loader2, Wallet, FileText, ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertCircle, Search, Plus, Settings, Calendar, Banknote, CreditCard, Smartphone, RefreshCw, Filter, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  useAdminStudentPayments,
  useVerifyStudentPayment,
  useCreateExtraPayment,
  useGenerateMonthlyPayments,
  StudentPayment,
} from "@/hooks/useStudentPayments";
import { useStudentsWithAssignments } from "@/hooks/useRateAssignments";
import { usePaymentRates } from "@/hooks/usePaymentRates";

const ITEMS_PER_PAGE = 25;

// Short month names for chips
const MONTHS = [
  { value: "01", label: "Ene", fullLabel: "Enero" },
  { value: "02", label: "Feb", fullLabel: "Febrero" },
  { value: "03", label: "Mar", fullLabel: "Marzo" },
  { value: "04", label: "Abr", fullLabel: "Abril" },
  { value: "05", label: "May", fullLabel: "Mayo" },
  { value: "06", label: "Jun", fullLabel: "Junio" },
  { value: "07", label: "Jul", fullLabel: "Julio" },
  { value: "08", label: "Ago", fullLabel: "Agosto" },
  { value: "09", label: "Sep", fullLabel: "Septiembre" },
  { value: "10", label: "Oct", fullLabel: "Octubre" },
  { value: "11", label: "Nov", fullLabel: "Noviembre" },
  { value: "12", label: "Dic", fullLabel: "Diciembre" },
];

// Get current month value (01-12)
const getCurrentMonth = () => {
  const month = new Date().getMonth() + 1;
  return month.toString().padStart(2, '0');
};

// Get current year
const getCurrentYear = () => {
  return new Date().getFullYear().toString();
};

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

const PAYMENT_METHOD_CONFIG: Record<string, { label: string; icon: typeof Banknote }> = {
  efectivo: { label: "Efectivo", icon: Banknote },
  tarjeta: { label: "Tarjeta", icon: CreditCard },
  bizum: { label: "Bizum", icon: Smartphone },
};

export default function AdminPaymentControlPage() {
  const { data: payments, isLoading } = useAdminStudentPayments();
  const { data: students } = useStudentsWithAssignments();
  const { data: rates } = usePaymentRates();
  const verifyPayment = useVerifyStudentPayment();
  const createExtraPayment = useCreateExtraPayment();
  const generateMonthlyPayments = useGenerateMonthlyPayments();

  const [activeTab, setActiveTab] = useState<string>("pendiente");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());

  // Filter states - default to current month/year
  const [filterMonth, setFilterMonth] = useState<string>(getCurrentMonth());
  const [filterYear, setFilterYear] = useState<string>(getCurrentYear());
  const [filterRateId, setFilterRateId] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all"); // all, normal, extra

  // Get available years from payments
  const availableYears = useMemo(() => {
    if (!payments || payments.length === 0) return [];
    const years = new Set<string>();
    payments.forEach(p => {
      if (p.period_start) {
        years.add(p.period_start.substring(0, 4));
      } else if (p.issue_date) {
        years.add(p.issue_date.substring(0, 4));
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [payments]);

  // Check if non-default filters are active (month/year defaults don't count)
  const hasNonDefaultFilters = filterRateId !== "all" || filterType !== "all";

  // Check if viewing different period than current
  const isViewingDifferentPeriod = filterMonth !== getCurrentMonth() || filterYear !== getCurrentYear();

  // Reset to current month
  const resetToCurrentMonth = () => {
    setFilterMonth(getCurrentMonth());
    setFilterYear(getCurrentYear());
    setCurrentPage(1);
  };

  // Clear additional filters (keep month/year)
  const clearAdditionalFilters = () => {
    setFilterRateId("all");
    setFilterType("all");
    setCurrentPage(1);
  };

  // Show all periods (remove month/year filter)
  const showAllPeriods = () => {
    setFilterMonth("all");
    setFilterYear("all");
    setCurrentPage(1);
  };

  // Verify Dialog state
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [dialogPayment, setDialogPayment] = useState<StudentPayment | null>(null);
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  // Extra Payment Dialog state
  const [isExtraPaymentDialogOpen, setIsExtraPaymentDialogOpen] = useState(false);
  const [extraPaymentStudentId, setExtraPaymentStudentId] = useState("");
  const [extraPaymentConcept, setExtraPaymentConcept] = useState("");
  const [extraPaymentAmount, setExtraPaymentAmount] = useState("");
  const [extraPaymentDescription, setExtraPaymentDescription] = useState("");

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

  // Filter payments by all criteria
  const filteredPayments = useMemo(() => {
    return (payments || []).filter(payment => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          payment.student_enrollment?.full_name?.toLowerCase().includes(searchLower) ||
          payment.student_enrollment?.email?.toLowerCase().includes(searchLower) ||
          payment.concept?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Month filter
      if (filterMonth !== "all") {
        const paymentMonth = payment.period_start
          ? payment.period_start.substring(5, 7)
          : payment.issue_date.substring(5, 7);
        if (paymentMonth !== filterMonth) return false;
      }

      // Year filter
      if (filterYear !== "all") {
        const paymentYear = payment.period_start
          ? payment.period_start.substring(0, 4)
          : payment.issue_date.substring(0, 4);
        if (paymentYear !== filterYear) return false;
      }

      // Rate filter
      if (filterRateId !== "all") {
        if (payment.payment_rate_id !== filterRateId) return false;
      }

      // Type filter (normal vs extra)
      if (filterType !== "all") {
        if (filterType === "extra" && !payment.is_extra_payment) return false;
        if (filterType === "normal" && payment.is_extra_payment) return false;
      }

      return true;
    });
  }, [payments, searchTerm, filterMonth, filterYear, filterRateId, filterType]);

  // Filter payments by status
  const pendingPayments = filteredPayments.filter(p => p.status === 'pendiente');
  const inReviewPayments = filteredPayments.filter(p => p.status === 'en_revision');
  const paidPayments = filteredPayments.filter(p => p.status === 'pagado');

  // Get summary statistics
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalInReview = inReviewPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpected = totalPending + totalInReview + totalPaid;

  // Pagination logic
  const getPaginatedData = (data: StudentPayment[]) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data: StudentPayment[]) => {
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

  const openVerifyDialog = (payment: StudentPayment, action: 'approve' | 'reject') => {
    setDialogPayment(payment);
    setDialogAction(action);
    setAdminNotes(payment.admin_notes || "");
    setIsVerifyDialogOpen(true);
  };

  const handleVerify = async () => {
    if (!dialogPayment || !dialogAction) return;

    await verifyPayment.mutateAsync({
      paymentId: dialogPayment.id,
      status: dialogAction === 'approve' ? 'pagado' : 'pendiente',
      adminNotes: adminNotes || undefined,
    });

    setIsVerifyDialogOpen(false);
    setDialogPayment(null);
    setDialogAction(null);
    setAdminNotes("");
  };

  const openExtraPaymentDialog = () => {
    setExtraPaymentStudentId("");
    setExtraPaymentConcept("");
    setExtraPaymentAmount("");
    setExtraPaymentDescription("");
    setIsExtraPaymentDialogOpen(true);
  };

  const handleCreateExtraPayment = async () => {
    if (!extraPaymentStudentId || !extraPaymentConcept || !extraPaymentAmount) return;

    await createExtraPayment.mutateAsync({
      student_enrollment_id: extraPaymentStudentId,
      concept: extraPaymentConcept,
      amount: parseFloat(extraPaymentAmount),
      description: extraPaymentDescription || undefined,
    });

    setIsExtraPaymentDialogOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' €';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES');
  };

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, currentData.length);

    return (
      <div className="flex items-center justify-between mt-4 px-4 pb-4">
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

  const PaymentRow = ({ payment }: { payment: StudentPayment }) => {
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
                {payment.student_enrollment?.full_name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{payment.student_enrollment?.full_name || 'Sin nombre'}</p>
              <p className="text-xs text-gray-500">{payment.concept}</p>
            </div>
          </div>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</span>
        </td>
        <td className="py-3 px-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>Vence: {formatDate(payment.due_date)}</span>
            </div>
            {payment.payment_method && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                {(() => {
                  const config = PAYMENT_METHOD_CONFIG[payment.payment_method];
                  const Icon = config?.icon || Banknote;
                  return (
                    <>
                      <Icon className="h-3 w-3" />
                      <span>{config?.label || payment.payment_method}</span>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </td>
        <td className="py-3 px-4">
          <Badge variant="outline" className={`${statusConfig.color} flex items-center gap-1 w-fit`}>
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
          {payment.is_extra_payment && (
            <Badge variant="secondary" className="ml-1 text-xs">Extra</Badge>
          )}
        </td>
        <td className="py-3 px-4 text-right">
          {payment.status === 'pendiente' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 hover:bg-primary/5 font-medium"
              onClick={() => openVerifyDialog(payment, 'approve')}
            >
              Marcar pagado
            </Button>
          )}
          {payment.status === 'en_revision' && (
            <div className="flex gap-1 justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                onClick={() => openVerifyDialog(payment, 'approve')}
              >
                Aprobar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => openVerifyDialog(payment, 'reject')}
              >
                Rechazar
              </Button>
            </div>
          )}
          {payment.status === 'pagado' && payment.admin_verified_at && (
            <span className="text-xs text-gray-500">
              Verificado {formatDate(payment.admin_verified_at)}
            </span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control de pagos</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona los pagos de todos los estudiantes</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline">
            <Link to="/dashboard/payment-rates">
              <Settings className="h-4 w-4 mr-2" />
              Tarifas
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => generateMonthlyPayments.mutate()}
            disabled={generateMonthlyPayments.isPending}
          >
            {generateMonthlyPayments.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Generar Pagos del Mes
          </Button>
          <Button onClick={openExtraPaymentDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Pago Extra
          </Button>
        </div>
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

      {/* Filters Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        {/* Year selector + Search row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Year chips */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400 hidden sm:block" />
            <div className="flex gap-1">
              {availableYears.length > 0 ? (
                <>
                  {availableYears.slice(0, 3).map(year => (
                    <button
                      key={year}
                      onClick={() => { setFilterYear(year); handleFilterChange(); }}
                      className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                        filterYear === year
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                  <button
                    onClick={showAllPeriods}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                      filterMonth === "all" && filterYear === "all"
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Todo
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setFilterYear(getCurrentYear()); handleFilterChange(); }}
                    className="px-3 py-1.5 text-sm font-medium rounded-full bg-primary text-white"
                  >
                    {getCurrentYear()}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar alumno o concepto..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleFilterChange();
              }}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Month chips - scrollable on mobile */}
        {filterYear !== "all" && (
          <div className="mb-4">
            <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {MONTHS.map(month => {
                const isSelected = filterMonth === month.value;
                const isCurrent = month.value === getCurrentMonth() && filterYear === getCurrentYear();
                return (
                  <button
                    key={month.value}
                    onClick={() => { setFilterMonth(month.value); handleFilterChange(); }}
                    className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                      isSelected
                        ? 'bg-primary text-white shadow-sm'
                        : isCurrent
                        ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <span className="sm:hidden">{month.label}</span>
                    <span className="hidden sm:inline">{month.fullLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Additional filters row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          <Filter className="h-4 w-4 text-gray-400" />

          {/* Rate filter */}
          <Select value={filterRateId} onValueChange={(v) => { setFilterRateId(v); handleFilterChange(); }}>
            <SelectTrigger className="w-[140px] h-8 text-sm bg-white">
              <SelectValue placeholder="Tarifa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las tarifas</SelectItem>
              {rates?.map(rate => (
                <SelectItem key={rate.id} value={rate.id}>
                  {rate.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type filter chips */}
          <div className="flex gap-1">
            {[
              { value: "all", label: "Todos" },
              { value: "normal", label: "Normales" },
              { value: "extra", label: "Extras" },
            ].map(type => (
              <button
                key={type.value}
                onClick={() => { setFilterType(type.value); handleFilterChange(); }}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                  filterType === type.value
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action buttons */}
          {isViewingDifferentPeriod && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToCurrentMonth}
              className="text-primary hover:text-primary/80 text-xs h-8"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Mes actual
            </Button>
          )}

          {hasNonDefaultFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAdditionalFilters}
              className="text-gray-500 hover:text-gray-700 text-xs h-8"
            >
              <X className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
          )}

          {/* Results count */}
          <span className="text-xs text-gray-500">
            {filteredPayments.length} pagos
          </span>
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
          {(!payments || payments.length === 0) ? (
            <div className="p-12 text-center">
              <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                No hay pagos registrados
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Asigna tarifas a los alumnos para empezar a gestionar sus pagos.
              </p>
              <Button asChild>
                <Link to="/dashboard/payment-rates/assign">
                  <Settings className="h-4 w-4 mr-2" />
                  Asignar Tarifas
                </Link>
              </Button>
            </div>
          ) : (
            <>
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
                      Importe
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detalles
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
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
            </>
          )}
        </div>
      </Tabs>

      {/* Verify Dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === 'approve' ? 'Confirmar Pago' : 'Rechazar Pago'}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === 'approve' && dialogPayment
                ? `Confirmar el pago de ${formatCurrency(dialogPayment.amount)} de ${dialogPayment.student_enrollment?.full_name}`
                : `El alumno será notificado del rechazo y deberá volver a marcar el pago.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adminNotes">
                Notas {dialogAction === 'approve' ? '(opcional)' : ''}
              </Label>
              <Textarea
                id="adminNotes"
                placeholder={dialogAction === 'approve'
                  ? "Añade notas sobre esta verificación..."
                  : "Indica el motivo del rechazo..."}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerifyDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleVerify}
              variant={dialogAction === 'approve' ? 'default' : 'destructive'}
              disabled={verifyPayment.isPending}
            >
              {verifyPayment.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {dialogAction === 'approve' ? 'Confirmar' : 'Rechazar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extra Payment Dialog */}
      <Dialog open={isExtraPaymentDialogOpen} onOpenChange={setIsExtraPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Pago Extra</DialogTitle>
            <DialogDescription>
              Crea un pago adicional para un alumno (ej: clase suelta, material, etc.)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Alumno *</Label>
              <Select value={extraPaymentStudentId} onValueChange={setExtraPaymentStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un alumno..." />
                </SelectTrigger>
                <SelectContent>
                  {students?.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="concept">Concepto *</Label>
              <Input
                id="concept"
                placeholder="Ej: Clase suelta, Material, Inscripción torneo..."
                value={extraPaymentConcept}
                onChange={(e) => setExtraPaymentConcept(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Importe (€) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={extraPaymentAmount}
                onChange={(e) => setExtraPaymentAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Añade detalles adicionales..."
                value={extraPaymentDescription}
                onChange={(e) => setExtraPaymentDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExtraPaymentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateExtraPayment}
              disabled={!extraPaymentStudentId || !extraPaymentConcept || !extraPaymentAmount || createExtraPayment.isPending}
            >
              {createExtraPayment.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Crear Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
