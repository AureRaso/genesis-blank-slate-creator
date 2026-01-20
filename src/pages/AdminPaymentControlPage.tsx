import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

const STATUS_COLORS = {
  pendiente: "bg-amber-50 text-amber-700 border-amber-200",
  en_revision: "bg-blue-50 text-blue-700 border-blue-200",
  pagado: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const STATUS_ICONS = {
  pendiente: AlertCircle,
  en_revision: Clock,
  pagado: CheckCircle2,
};

const PAYMENT_METHOD_ICONS: Record<string, typeof Banknote> = {
  efectivo: Banknote,
  tarjeta: CreditCard,
  bizum: Smartphone,
};

export default function AdminPaymentControlPage() {
  const { t, i18n } = useTranslation();
  const { data: payments, isLoading } = useAdminStudentPayments();
  const { data: students } = useStudentsWithAssignments();
  const { data: rates } = usePaymentRates();
  const verifyPayment = useVerifyStudentPayment();
  const createExtraPayment = useCreateExtraPayment();
  const generateMonthlyPayments = useGenerateMonthlyPayments();

  // Get locale for date formatting
  const dateLocale = i18n.language === "en" ? "en-US" : i18n.language === "it" ? "it-IT" : "es-ES";

  // Helper functions for translations
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pendiente: t("paymentControl.status.pending"),
      en_revision: t("paymentControl.status.inReview"),
      pagado: t("paymentControl.status.paid"),
    };
    return labels[status] || status;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      efectivo: t("paymentControl.paymentMethods.cash"),
      tarjeta: t("paymentControl.paymentMethods.card"),
      bizum: t("paymentControl.paymentMethods.bizum"),
    };
    return labels[method] || method;
  };

  // Get month label based on current language
  const getMonthLabel = (monthValue: string, full: boolean = true) => {
    const monthKey = {
      "01": "jan", "02": "feb", "03": "mar", "04": "apr",
      "05": "may", "06": "jun", "07": "jul", "08": "aug",
      "09": "sep", "10": "oct", "11": "nov", "12": "dec",
    }[monthValue];
    if (!monthKey) return monthValue;
    return full ? t(`months.${monthKey}.full`) : t(`months.${monthKey}.short`);
  };

  const [activeTab, setActiveTab] = useState<string>("pendiente");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());

  // Filter states - default to current month/year
  const [filterMonth, setFilterMonth] = useState<string>(getCurrentMonth());
  const [filterYear, setFilterYear] = useState<string>(getCurrentYear());
  const [filterRateId, setFilterRateId] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all"); // all, normal, extra
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Month navigation functions
  const goToPreviousMonth = () => {
    let month = parseInt(filterMonth);
    let year = parseInt(filterYear);

    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }

    setFilterMonth(month.toString().padStart(2, '0'));
    setFilterYear(year.toString());
    handleFilterChange();
  };

  const goToNextMonth = () => {
    let month = parseInt(filterMonth);
    let year = parseInt(filterYear);

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }

    setFilterMonth(month.toString().padStart(2, '0'));
    setFilterYear(year.toString());
    handleFilterChange();
  };

  // Get the label for current selected month
  const getCurrentMonthLabel = () => {
    if (filterMonth === "all" || filterYear === "all") return t("paymentControl.filters.all");
    return `${getMonthLabel(filterMonth)} ${filterYear}`;
  };

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
  const [extraPaymentStudentSearch, setExtraPaymentStudentSearch] = useState("");
  const [extraPaymentConcept, setExtraPaymentConcept] = useState("");
  const [extraPaymentAmount, setExtraPaymentAmount] = useState("");
  const [extraPaymentDescription, setExtraPaymentDescription] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // Reset to page 1 when active tab changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedPayments(new Set());
  }, [activeTab]);

  // Filter payments by all criteria - MUST be before any early returns
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

  // Filter students for extra payment search
  const filteredStudents = useMemo(() => {
    if (!students || !extraPaymentStudentSearch.trim()) return students || [];
    const searchLower = extraPaymentStudentSearch.toLowerCase();
    return students.filter(s =>
      s.full_name?.toLowerCase().includes(searchLower) ||
      s.email?.toLowerCase().includes(searchLower)
    );
  }, [students, extraPaymentStudentSearch]);

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
    setExtraPaymentStudentSearch("");
    setExtraPaymentConcept("");
    setExtraPaymentAmount("");
    setExtraPaymentDescription("");
    setShowStudentDropdown(false);
    setIsExtraPaymentDialogOpen(true);
  };

  const handleSelectStudent = (student: { id: string; full_name: string }) => {
    setExtraPaymentStudentId(student.id);
    setExtraPaymentStudentSearch(student.full_name);
    setShowStudentDropdown(false);
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
    return new Date(dateStr).toLocaleDateString(dateLocale);
  };

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, currentData.length);

    return (
      <div className="flex items-center justify-between mt-4 px-4 pb-4">
        <div className="text-sm text-gray-500">
          {t("paymentControl.table.showing", { start: startItem, end: endItem, total: currentData.length })}
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
            {t("paymentControl.table.pageOf", { current: currentPage, total: totalPages })}
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
    const statusColor = STATUS_COLORS[payment.status];
    const StatusIcon = STATUS_ICONS[payment.status];
    const isSelected = selectedPayments.has(payment.id);

    return (
      <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
        <td className="py-3 px-4 hidden sm:table-cell">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => handleSelectPayment(payment.id, checked as boolean)}
          />
        </td>
        <td className="py-3 px-2 sm:px-4">
          <div>
            <p className="font-medium text-gray-900 text-sm sm:text-base">{payment.student_enrollment?.full_name || t("paymentControl.table.noName")}</p>
            <p className="text-xs text-gray-500">{payment.concept}</p>
          </div>
        </td>
        <td className="py-3 px-2 sm:px-4 text-center">
          <span className="font-semibold text-gray-900 text-sm sm:text-base">{formatCurrency(payment.amount)}</span>
        </td>
        <td className="py-3 px-4 hidden md:table-cell">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{t("paymentControl.table.dueDate")} {formatDate(payment.due_date)}</span>
            </div>
            {payment.payment_method && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                {(() => {
                  const Icon = PAYMENT_METHOD_ICONS[payment.payment_method] || Banknote;
                  return (
                    <>
                      <Icon className="h-3 w-3" />
                      <span>{getPaymentMethodLabel(payment.payment_method)}</span>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </td>
        <td className="py-3 px-4 hidden lg:table-cell">
          <Badge variant="outline" className={`${statusColor} flex items-center gap-1 w-fit`}>
            <StatusIcon className="h-3 w-3" />
            {getStatusLabel(payment.status)}
          </Badge>
          {payment.is_extra_payment && (
            <Badge variant="secondary" className="ml-1 text-xs">{t("paymentControl.filters.extra")}</Badge>
          )}
        </td>
        <td className="py-3 px-2 sm:px-4 text-center">
          {payment.status === 'pendiente' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-white hover:bg-primary font-medium text-xs sm:text-sm px-2 sm:px-3"
              onClick={() => openVerifyDialog(payment, 'approve')}
            >
              <span className="hidden sm:inline">{t("paymentControl.table.markAsPaid")}</span>
              <span className="sm:hidden">{t("paymentControl.table.paid")}</span>
            </Button>
          )}
          {payment.status === 'en_revision' && (
            <div className="flex gap-1 justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-emerald-600 hover:text-white hover:bg-emerald-600 text-xs sm:text-sm px-2 sm:px-3"
                onClick={() => openVerifyDialog(payment, 'approve')}
              >
                <span className="hidden sm:inline">{t("paymentControl.table.approve")}</span>
                <CheckCircle2 className="h-4 w-4 sm:hidden" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-white hover:bg-red-600 text-xs sm:text-sm px-2 sm:px-3"
                onClick={() => openVerifyDialog(payment, 'reject')}
              >
                <span className="hidden sm:inline">{t("paymentControl.table.reject")}</span>
                <X className="h-4 w-4 sm:hidden" />
              </Button>
            </div>
          )}
          {payment.status === 'pagado' && payment.admin_verified_at && (
            <span className="text-xs text-gray-500">
              <span className="hidden sm:inline">{t("paymentControl.table.verified")} {formatDate(payment.admin_verified_at)}</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500 sm:hidden mx-auto" />
            </span>
          )}
        </td>
      </tr>
    );
  };

  // Loading state - must be after all hooks
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("paymentControl.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">{t("paymentControl.subtitle")}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline">
            <Link to="/dashboard/payment-rates">
              <Settings className="h-4 w-4 mr-2" />
              {t("paymentControl.rates")}
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
            {t("paymentControl.generateMonthlyPayments")}
          </Button>
          <Button onClick={openExtraPaymentDialog}>
            <Plus className="h-4 w-4 mr-2" />
            {t("paymentControl.extraPayment")}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-gradient-to-br from-violet-50 to-white border-violet-100">
          <p className="text-xs font-medium text-violet-600 mb-1">{t("paymentControl.summary.totalExpected")}</p>
          <p className="text-xl font-bold text-violet-900">{formatCurrency(totalExpected)}</p>
          <p className="text-xs text-violet-500 mt-1">{filteredPayments.length} {t("paymentControl.summary.payments")}</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-amber-600 mb-1">{t("paymentControl.summary.pending")}</p>
              <p className="text-xl font-bold text-amber-900">{formatCurrency(totalPending)}</p>
              <p className="text-xs text-amber-500 mt-1">{pendingPayments.length} {t("paymentControl.summary.payments")}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <FileText className="h-4 w-4 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600 mb-1">{t("paymentControl.summary.inReview")}</p>
              <p className="text-xl font-bold text-blue-900">{formatCurrency(totalInReview)}</p>
              <p className="text-xs text-blue-500 mt-1">{inReviewPayments.length} {t("paymentControl.summary.payments")}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600 mb-1">{t("paymentControl.summary.paid")}</p>
              <p className="text-xl font-bold text-emerald-900">{formatCurrency(totalPaid)}</p>
              <p className="text-xs text-emerald-500 mt-1">{paidPayments.length} {t("paymentControl.summary.payments")}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        {/* Month navigation - full width on mobile */}
        <div className="flex items-center justify-between gap-2 mb-3 sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
            className="h-10 w-10 p-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="text-base font-semibold text-gray-900 text-center flex-1">
            {getCurrentMonthLabel()}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
            className="h-10 w-10 p-0"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Mes actual button - mobile */}
        {isViewingDifferentPeriod && (
          <div className="mb-3 sm:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToCurrentMonth}
              className="text-primary hover:text-white hover:bg-primary text-sm h-8 w-full"
            >
              <Calendar className="h-4 w-4 mr-1" />
              {t("paymentControl.filters.goToCurrentMonth")}
            </Button>
          </div>
        )}

        {/* Main filter row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search input */}
          <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("paymentControl.filters.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleFilterChange();
              }}
              className="pl-9 h-9"
            />
          </div>

          {/* Filter toggle button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`h-9 gap-2 ${isFilterPanelOpen ? 'bg-gray-100' : ''}`}
          >
            <Filter className="h-4 w-4" />
            {t("paymentControl.filters.filters")}
            {(filterRateId !== "all" || filterType !== "all") && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>

          {/* Month navigation - desktop only */}
          <div className="hidden sm:flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="h-9 px-2"
              title={t("paymentControl.filters.previousMonth")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="px-3 py-1.5 text-sm font-medium min-w-[120px] text-center">
              {getCurrentMonthLabel()}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="h-9 px-2"
              title={t("paymentControl.filters.nextMonth")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Mes actual button - desktop only */}
          {isViewingDifferentPeriod && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToCurrentMonth}
              className="hidden sm:flex text-primary hover:text-white hover:bg-primary text-sm h-9"
            >
              <Calendar className="h-4 w-4 mr-1" />
              {t("paymentControl.filters.currentMonth")}
            </Button>
          )}

          {/* Results count */}
          <span className="text-xs text-gray-500 ml-auto hidden sm:block">
            {filteredPayments.length} {t("paymentControl.summary.payments")}
          </span>
        </div>

        {/* Collapsible filter panel */}
        {isFilterPanelOpen && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
            {/* Year chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500 font-medium w-16">{t("paymentControl.filters.year")}</span>
              <div className="flex gap-1 flex-wrap">
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
                      {t("paymentControl.filters.all")}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setFilterYear(getCurrentYear()); handleFilterChange(); }}
                    className="px-3 py-1.5 text-sm font-medium rounded-full bg-primary text-white"
                  >
                    {getCurrentYear()}
                  </button>
                )}
              </div>
            </div>

            {/* Month chips */}
            {filterYear !== "all" && (
              <div className="flex flex-wrap items-start gap-2">
                <span className="text-sm text-gray-500 font-medium w-16 pt-1.5">{t("paymentControl.filters.month")}</span>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {MONTHS.map(month => {
                    const isSelected = filterMonth === month.value;
                    const isCurrent = month.value === getCurrentMonth() && filterYear === getCurrentYear();
                    return (
                      <button
                        key={month.value}
                        onClick={() => { setFilterMonth(month.value); handleFilterChange(); }}
                        className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                          isSelected
                            ? 'bg-primary text-white shadow-sm'
                            : isCurrent
                            ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                        }`}
                      >
                        <span className="sm:hidden">{getMonthLabel(month.value, false)}</span>
                        <span className="hidden sm:inline">{getMonthLabel(month.value, true)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rate filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500 font-medium w-16">{t("paymentControl.filters.rate")}</span>
              <Select value={filterRateId} onValueChange={(v) => { setFilterRateId(v); handleFilterChange(); }}>
                <SelectTrigger className="w-[180px] h-9 text-sm bg-white">
                  <SelectValue placeholder={t("paymentControl.filters.rate")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("paymentControl.filters.allRates")}</SelectItem>
                  {rates?.map(rate => (
                    <SelectItem key={rate.id} value={rate.id}>
                      {rate.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type filter chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500 font-medium w-16">{t("paymentControl.filters.type")}</span>
              <div className="flex gap-1">
                {[
                  { value: "all", label: t("paymentControl.filters.allTypes") },
                  { value: "normal", label: t("paymentControl.filters.normal") },
                  { value: "extra", label: t("paymentControl.filters.extra") },
                ].map(type => (
                  <button
                    key={type.value}
                    onClick={() => { setFilterType(type.value); handleFilterChange(); }}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                      filterType === type.value
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear filters button */}
            {hasNonDefaultFilters && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAdditionalFilters}
                  className="text-gray-500 hover:text-gray-700 text-sm h-8"
                >
                  <X className="h-4 w-4 mr-1" />
                  {t("paymentControl.filters.clearFilters")}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Mobile results count */}
        <div className="mt-3 text-xs text-gray-500 sm:hidden">
          {filteredPayments.length} {t("paymentControl.filters.paymentsFound")}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent border-b border-gray-200 w-full justify-start rounded-none h-auto p-0 mb-0">
          <TabsTrigger
            value="pendiente"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 font-medium"
          >
            {t("paymentControl.tabs.pending")} ({pendingPayments.length})
          </TabsTrigger>
          <TabsTrigger
            value="en_revision"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 font-medium"
          >
            {t("paymentControl.tabs.inReview")} ({inReviewPayments.length})
          </TabsTrigger>
          <TabsTrigger
            value="pagado"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 font-medium"
          >
            {t("paymentControl.tabs.paid")} ({paidPayments.length})
          </TabsTrigger>
        </TabsList>

        {/* Table Content */}
        <div className="bg-white rounded-lg border border-gray-200 mt-4 overflow-hidden">
          {(!payments || payments.length === 0) ? (
            <div className="p-12 text-center">
              <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {t("paymentControl.table.noPaymentsRegistered")}
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                {t("paymentControl.table.assignRatesToStart")}
              </p>
              <Button asChild>
                <Link to="/dashboard/payment-rates/assign">
                  <Settings className="h-4 w-4 mr-2" />
                  {t("paymentControl.table.assignRates")}
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="py-3 px-4 text-left w-12 hidden sm:table-cell">
                      <Checkbox
                        checked={paginatedData.length > 0 && paginatedData.every(p => selectedPayments.has(p.id))}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("paymentControl.table.student")}
                    </th>
                    <th className="py-3 px-2 sm:px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("paymentControl.table.amount")}
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      {t("paymentControl.table.details")}
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      {t("paymentControl.table.status")}
                    </th>
                    <th className="py-3 px-2 sm:px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("paymentControl.table.action")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        {searchTerm ? t("paymentControl.table.noPaymentsFound") : t("paymentControl.table.noPaymentsInCategory")}
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
              {dialogAction === 'approve' ? t("paymentControl.verifyDialog.confirmPayment") : t("paymentControl.verifyDialog.rejectPayment")}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === 'approve' && dialogPayment
                ? t("paymentControl.verifyDialog.confirmPaymentDesc", { amount: formatCurrency(dialogPayment.amount), name: dialogPayment.student_enrollment?.full_name })
                : t("paymentControl.verifyDialog.rejectPaymentDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adminNotes">
                {t("paymentControl.verifyDialog.notes")} {dialogAction === 'approve' ? t("paymentControl.verifyDialog.notesOptional") : ''}
              </Label>
              <Textarea
                id="adminNotes"
                placeholder={dialogAction === 'approve'
                  ? t("paymentControl.verifyDialog.notesPlaceholderApprove")
                  : t("paymentControl.verifyDialog.notesPlaceholderReject")}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerifyDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleVerify}
              variant={dialogAction === 'approve' ? 'default' : 'destructive'}
              disabled={verifyPayment.isPending}
            >
              {verifyPayment.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {dialogAction === 'approve' ? t("paymentControl.verifyDialog.confirm") : t("paymentControl.verifyDialog.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extra Payment Dialog */}
      <Dialog open={isExtraPaymentDialogOpen} onOpenChange={setIsExtraPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("paymentControl.extraPaymentDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("paymentControl.extraPaymentDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("paymentControl.extraPaymentDialog.student")} *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("paymentControl.extraPaymentDialog.studentSearchPlaceholder")}
                  value={extraPaymentStudentSearch}
                  onChange={(e) => {
                    setExtraPaymentStudentSearch(e.target.value);
                    setExtraPaymentStudentId("");
                    setShowStudentDropdown(true);
                  }}
                  onFocus={() => setShowStudentDropdown(true)}
                  className="pl-9"
                />
                {showStudentDropdown && extraPaymentStudentSearch && !extraPaymentStudentId && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredStudents.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        {t("paymentControl.extraPaymentDialog.noStudentsFound")}
                      </div>
                    ) : (
                      filteredStudents.slice(0, 10).map(student => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => handleSelectStudent(student)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        >
                          <span className="font-medium">{student.full_name}</span>
                          {student.email && (
                            <span className="text-gray-500 ml-2 text-xs">{student.email}</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
                {extraPaymentStudentId && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {extraPaymentStudentSearch}
                      <button
                        type="button"
                        onClick={() => {
                          setExtraPaymentStudentId("");
                          setExtraPaymentStudentSearch("");
                        }}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="concept">{t("paymentControl.extraPaymentDialog.concept")} *</Label>
              <Input
                id="concept"
                placeholder={t("paymentControl.extraPaymentDialog.conceptPlaceholder")}
                value={extraPaymentConcept}
                onChange={(e) => setExtraPaymentConcept(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">{t("paymentControl.extraPaymentDialog.amount")} *</Label>
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
              <Label htmlFor="description">{t("paymentControl.extraPaymentDialog.descriptionLabel")}</Label>
              <Textarea
                id="description"
                placeholder={t("paymentControl.extraPaymentDialog.descriptionPlaceholder")}
                value={extraPaymentDescription}
                onChange={(e) => setExtraPaymentDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExtraPaymentDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleCreateExtraPayment}
              disabled={!extraPaymentStudentId || !extraPaymentConcept || !extraPaymentAmount || createExtraPayment.isPending}
            >
              {createExtraPayment.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("paymentControl.extraPaymentDialog.createPayment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
