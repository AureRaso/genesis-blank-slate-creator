import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Euro,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BarChart3,
  History,
  User,
  Search,
  X,
  PieChart,
  ChevronLeft,
  ChevronRight,
  UserMinus,
  Trash2,
  Unlink,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  usePaymentRate,
  useRateStudents,
  useRateStats,
  useRatePaymentHistory,
  useRateAllAssignments,
  useUnlinkRateAssignment,
  useDeleteRateAssignment,
  RateDetailStudent,
} from "@/hooks/usePaymentRateDetail";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  activa: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pausada: "bg-amber-50 text-amber-700 border-amber-200",
  finalizada: "bg-gray-50 text-gray-500 border-gray-200",
};

const MONTH_KEYS = [
  { value: "01", key: "jan" },
  { value: "02", key: "feb" },
  { value: "03", key: "mar" },
  { value: "04", key: "apr" },
  { value: "05", key: "may" },
  { value: "06", key: "jun" },
  { value: "07", key: "jul" },
  { value: "08", key: "aug" },
  { value: "09", key: "sep" },
  { value: "10", key: "oct" },
  { value: "11", key: "nov" },
  { value: "12", key: "dec" },
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

export default function PaymentRateDetailPage() {
  const { t } = useTranslation();
  const { rateId } = useParams<{ rateId: string }>();

  // Helper functions for translations
  const getPeriodicityLabel = (periodicity: string) => {
    const labels: Record<string, string> = {
      mensual: t("paymentRates.periodicity.monthly"),
      trimestral: t("paymentRates.periodicity.quarterly"),
      semestral: t("paymentRates.periodicity.semiannual"),
      anual: t("paymentRates.periodicity.annual"),
    };
    return labels[periodicity] || periodicity;
  };

  const getRateTypeLabel = (rateType: string) => {
    const labels: Record<string, string> = {
      fija: t("paymentRates.rateTypes.fixed"),
      por_clase: t("paymentRates.rateTypes.perClass"),
    };
    return labels[rateType] || rateType;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      activa: t("paymentRates.status.active"),
      pausada: t("paymentRates.status.paused"),
      finalizada: t("paymentRates.status.finished"),
    };
    return labels[status] || status;
  };

  const getMonthFullLabel = (monthValue: string) => {
    const monthKey = MONTH_KEYS.find(m => m.value === monthValue)?.key || "jan";
    return t(`months.${monthKey}.full`);
  };

  const getMonthShortLabel = (monthValue: string) => {
    const monthKey = MONTH_KEYS.find(m => m.value === monthValue)?.key || "jan";
    return t(`months.${monthKey}.short`);
  };

  // Filter states
  const [studentSearch, setStudentSearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>("all");
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<string>("all");
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Multi-select state for students
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  // Payment history filter states - default to current month/year
  const [historyFilterMonth, setHistoryFilterMonth] = useState<string>(getCurrentMonth());
  const [historyFilterYear, setHistoryFilterYear] = useState<string>(getCurrentYear());

  // Unlink rate confirmation dialog state
  const [studentToUnlink, setStudentToUnlink] = useState<RateDetailStudent | null>(null);

  // Delete rate confirmation dialog states (two-step confirmation)
  const [studentToDelete, setStudentToDelete] = useState<RateDetailStudent | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  // Bulk action states
  const [showBulkUnlinkDialog, setShowBulkUnlinkDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkDeleteConfirmation, setShowBulkDeleteConfirmation] = useState(false);
  const [bulkDeleteConfirmationText, setBulkDeleteConfirmationText] = useState("");
  const [isBulkActionPending, setIsBulkActionPending] = useState(false);

  const { data: rate, isLoading: isLoadingRate } = usePaymentRate(rateId);
  const { data: students, isLoading: isLoadingStudents } = useRateStudents(rateId);
  const { data: stats, isLoading: isLoadingStats } = useRateStats(rateId);
  const { data: paymentHistory, isLoading: isLoadingHistory } = useRatePaymentHistory(rateId);
  const { data: allAssignments } = useRateAllAssignments(rateId);
  const unlinkRateAssignment = useUnlinkRateAssignment(rateId);
  const deleteRateAssignment = useDeleteRateAssignment(rateId);

  const isLoading = isLoadingRate || isLoadingStats;

  // Filtered students
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!studentSearch.trim()) return students;
    const search = studentSearch.toLowerCase();
    return students.filter(s =>
      s.full_name?.toLowerCase().includes(search) ||
      s.email?.toLowerCase().includes(search) ||
      s.phone?.includes(search)
    );
  }, [students, studentSearch]);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    if (!allAssignments) return [];
    let filtered = allAssignments;

    if (assignmentStatusFilter !== "all") {
      filtered = filtered.filter(a => a.status === assignmentStatusFilter);
    }

    if (assignmentSearch.trim()) {
      const search = assignmentSearch.toLowerCase();
      filtered = filtered.filter(a =>
        a.student_enrollment?.full_name?.toLowerCase().includes(search) ||
        a.student_enrollment?.email?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [allAssignments, assignmentStatusFilter, assignmentSearch]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' €';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPrice = () => {
    if (!rate) return "-";
    if (rate.rate_type === "fija" && rate.fixed_price) {
      return `${rate.fixed_price.toFixed(2)} €`;
    }
    if (rate.rate_type === "por_clase" && rate.price_per_class) {
      return `${rate.price_per_class.toFixed(2)} € ${t("paymentRates.detail.perClassSuffix")}`;
    }
    return "-";
  };

  // Format phone number for WhatsApp link
  const formatPhoneForWhatsApp = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length > 9) {
      return digits;
    }
    return `34${digits}`;
  };

  // Handle unlink rate assignment confirmation (soft action)
  const handleConfirmUnlink = async () => {
    if (!studentToUnlink) return;

    try {
      await unlinkRateAssignment.mutateAsync(studentToUnlink.assignment_id);
      toast.success(t('paymentRates.detail.students.unlinkSuccess', { name: studentToUnlink.full_name }));
      setStudentToUnlink(null);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  // Handle first step of delete (open second confirmation dialog)
  const handleOpenDeleteConfirmation = () => {
    if (!studentToDelete) return;
    setShowDeleteConfirmation(true);
  };

  // Handle final delete confirmation (hard delete)
  const handleConfirmDelete = async () => {
    if (!studentToDelete || deleteConfirmationText !== 'ELIMINAR') return;

    try {
      await deleteRateAssignment.mutateAsync(studentToDelete.assignment_id);
      toast.success(t('paymentRates.detail.students.deleteSuccess', { name: studentToDelete.full_name }));
      setStudentToDelete(null);
      setShowDeleteConfirmation(false);
      setDeleteConfirmationText("");
    } catch (error) {
      // Error is handled in the hook
    }
  };

  // Reset delete state when closing dialogs
  const handleCloseDeleteDialog = () => {
    setStudentToDelete(null);
    setShowDeleteConfirmation(false);
    setDeleteConfirmationText("");
  };

  // Multi-select helper functions
  const filteredSelectionState = useMemo(() => {
    if (filteredStudents.length === 0) return { allSelected: false, someSelected: false, selectedCount: 0 };

    const selectedInFiltered = filteredStudents.filter(s => selectedStudents.has(s.id));
    const selectedCount = selectedInFiltered.length;
    const allSelected = selectedCount === filteredStudents.length;
    const someSelected = selectedCount > 0 && !allSelected;

    return { allSelected, someSelected, selectedCount };
  }, [filteredStudents, selectedStudents]);

  const handleSelectAll = (checked: boolean) => {
    const newSelected = new Set(selectedStudents);

    if (checked) {
      filteredStudents.forEach(s => newSelected.add(s.id));
    } else {
      filteredStudents.forEach(s => newSelected.delete(s.id));
    }

    setSelectedStudents(newSelected);
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  // Get selected students data
  const selectedStudentsData = useMemo(() => {
    if (!students) return [];
    return students.filter(s => selectedStudents.has(s.id));
  }, [students, selectedStudents]);

  // Bulk unlink handler
  const handleBulkUnlink = async () => {
    if (selectedStudentsData.length === 0) return;

    setIsBulkActionPending(true);
    try {
      for (const student of selectedStudentsData) {
        await unlinkRateAssignment.mutateAsync(student.assignment_id);
      }
      toast.success(t('paymentRates.detail.students.bulkUnlinkSuccess', { count: selectedStudentsData.length }));
      setSelectedStudents(new Set());
      setShowBulkUnlinkDialog(false);
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsBulkActionPending(false);
    }
  };

  // Bulk delete handler (first step)
  const handleOpenBulkDeleteConfirmation = () => {
    setShowBulkDeleteConfirmation(true);
  };

  // Bulk delete handler (final)
  const handleBulkDelete = async () => {
    if (selectedStudentsData.length === 0 || bulkDeleteConfirmationText !== 'ELIMINAR') return;

    setIsBulkActionPending(true);
    try {
      for (const student of selectedStudentsData) {
        await deleteRateAssignment.mutateAsync(student.assignment_id);
      }
      toast.success(t('paymentRates.detail.students.bulkDeleteSuccess', { count: selectedStudentsData.length }));
      setSelectedStudents(new Set());
      setShowBulkDeleteDialog(false);
      setShowBulkDeleteConfirmation(false);
      setBulkDeleteConfirmationText("");
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsBulkActionPending(false);
    }
  };

  // Reset bulk delete state
  const handleCloseBulkDeleteDialog = () => {
    setShowBulkDeleteDialog(false);
    setShowBulkDeleteConfirmation(false);
    setBulkDeleteConfirmationText("");
  };

  // Calculate collection rate
  const collectionRate = stats && stats.total_amount_billed > 0
    ? Math.round((stats.total_amount_paid / stats.total_amount_billed) * 100)
    : 0;

  // Get max amount for chart scaling
  const maxHistoryAmount = paymentHistory && paymentHistory.length > 0
    ? Math.max(...paymentHistory.map(h => h.total_amount))
    : 0;

  // Get available years from payment history
  const availableHistoryYears = useMemo(() => {
    if (!paymentHistory || paymentHistory.length === 0) return [];
    const years = new Set<string>();
    paymentHistory.forEach(p => {
      years.add(p.year.toString());
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [paymentHistory]);

  // Filter payment history by month/year
  const filteredPaymentHistory = useMemo(() => {
    if (!paymentHistory) return [];
    return paymentHistory.filter(month => {
      // Year filter
      if (historyFilterYear !== "all") {
        if (month.year.toString() !== historyFilterYear) return false;
      }
      // Month filter
      if (historyFilterMonth !== "all") {
        const monthIndex = MONTH_KEYS.findIndex(m => {
          const fullLabel = t(`months.${m.key}.full`).toLowerCase();
          return fullLabel.startsWith(month.month.toLowerCase().substring(0, 3));
        });
        const monthValue = (monthIndex + 1).toString().padStart(2, '0');
        if (monthValue !== historyFilterMonth) return false;
      }
      return true;
    });
  }, [paymentHistory, historyFilterMonth, historyFilterYear, t]);

  // Calculate totals for payment history (filtered)
  const historyTotals = useMemo(() => {
    if (!filteredPaymentHistory || filteredPaymentHistory.length === 0) return { paid: 0, pending: 0, inReview: 0, total: 0 };
    return filteredPaymentHistory.reduce((acc, month) => ({
      paid: acc.paid + month.paid_count,
      pending: acc.pending + month.pending_count,
      inReview: acc.inReview + month.in_review_count,
      total: acc.total + month.payment_count,
    }), { paid: 0, pending: 0, inReview: 0, total: 0 });
  }, [filteredPaymentHistory]);

  // Check if viewing different period than current
  const isViewingDifferentPeriod = historyFilterMonth !== getCurrentMonth() || historyFilterYear !== getCurrentYear();

  // Reset to current month
  const resetToCurrentMonth = () => {
    setHistoryFilterMonth(getCurrentMonth());
    setHistoryFilterYear(getCurrentYear());
  };

  // Month navigation functions for history
  const goToPreviousHistoryMonth = () => {
    let month = parseInt(historyFilterMonth);
    let year = parseInt(historyFilterYear);

    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }

    setHistoryFilterMonth(month.toString().padStart(2, '0'));
    setHistoryFilterYear(year.toString());
  };

  const goToNextHistoryMonth = () => {
    let month = parseInt(historyFilterMonth);
    let year = parseInt(historyFilterYear);

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }

    setHistoryFilterMonth(month.toString().padStart(2, '0'));
    setHistoryFilterYear(year.toString());
  };

  // Get the label for current selected month in history
  const getCurrentHistoryMonthLabel = () => {
    return `${getMonthFullLabel(historyFilterMonth)} ${historyFilterYear}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!rate) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">{t("paymentRates.detail.rateNotFound")}</h3>
          <p className="text-gray-500 text-sm mb-4">{t("paymentRates.detail.rateNotFoundDesc")}</p>
          <Button asChild>
            <Link to="/dashboard/payment-rates">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("paymentRates.detail.backToRates")}
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 px-3 sm:px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-3 sm:mb-4 -ml-2">
          <Link to="/dashboard/payment-rates">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{t("paymentRates.detail.backToRates")}</span>
            <span className="sm:hidden">{t("paymentRates.detail.back")}</span>
          </Link>
        </Button>

        {/* Mobile header */}
        <div className="sm:hidden flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{rate.name}</h1>
              <Badge className={rate.is_active
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-gray-50 text-gray-500 border-gray-200"
              }>
                {rate.is_active ? t("paymentRates.status.active") : t("paymentRates.status.inactive")}
              </Badge>
            </div>
            {rate.description && (
              <p className="text-gray-500 text-sm">{rate.description}</p>
            )}
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{formatPrice()}</p>
            <p className="text-xs text-gray-500">
              {getRateTypeLabel(rate.rate_type)} · {getPeriodicityLabel(rate.periodicity)}
            </p>
          </div>
        </div>

        {/* Desktop header - name and price on same row */}
        <div className="hidden sm:flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{rate.name}</h1>
              <Badge className={rate.is_active
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-gray-50 text-gray-500 border-gray-200"
              }>
                {rate.is_active ? t("paymentRates.status.active") : t("paymentRates.status.inactive")}
              </Badge>
            </div>
            {rate.description && (
              <p className="text-gray-500 text-sm">{rate.description}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-bold text-gray-900">{formatPrice()}</p>
            <p className="text-sm text-gray-500">
              {getRateTypeLabel(rate.rate_type)} · {getPeriodicityLabel(rate.periodicity)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-blue-600 mb-1">{t("paymentRates.detail.stats.activeStudents")}</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-900">{stats?.active_students || 0}</p>
              <p className="text-xs text-blue-500 mt-1 truncate">{t("paymentRates.detail.stats.ofTotal", { total: stats?.total_assigned_students || 0 })}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 ml-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-gradient-to-br from-violet-50 to-white border-violet-100">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-violet-600 mb-1">{t("paymentRates.detail.stats.totalBilled")}</p>
              <p className="text-xl sm:text-2xl font-bold text-violet-900 truncate">{formatCurrency(stats?.total_amount_billed || 0)}</p>
              <p className="text-xs text-violet-500 mt-1">{stats?.total_payments_generated || 0} {t("paymentRates.detail.stats.payments")}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 ml-2">
              <Euro className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-emerald-600 mb-1">{t("paymentRates.detail.stats.totalCollected")}</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-900 truncate">{formatCurrency(stats?.total_amount_paid || 0)}</p>
              <p className="text-xs text-emerald-500 mt-1">{collectionRate}{t("paymentRates.detail.stats.collectionRate")}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 ml-2">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-amber-600 mb-1">{t("paymentRates.detail.stats.pending")}</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-900 truncate">{formatCurrency(stats?.total_amount_pending || 0)}</p>
              <p className="text-xs text-amber-500 mt-1 truncate">
                {stats?.average_payment_time_days
                  ? t("paymentRates.detail.stats.avgDays", { days: stats.average_payment_time_days })
                  : t("paymentRates.detail.stats.noData")}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 ml-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Rate Details Card - Hidden on mobile, collapsed view */}
      <Card className="p-3 sm:p-4 mb-4 sm:mb-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
          <Calendar className="h-4 w-4" />
          {t("paymentRates.detail.config.title")}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm">{t("paymentRates.detail.config.billingDay")}</p>
            <p className="font-medium">{t("paymentRates.detail.config.dayPrefix")} {rate.billing_day}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs sm:text-sm">{t("paymentRates.detail.config.daysToPayLabel")}</p>
            <p className="font-medium">{rate.due_days} {t("paymentRates.detail.config.days")}</p>
          </div>
          <div className="hidden sm:block">
            <p className="text-gray-500 text-xs sm:text-sm">{t("paymentRates.detail.config.reminder")}</p>
            <p className="font-medium">{rate.grace_days} {t("paymentRates.detail.config.daysBefore")}</p>
          </div>
          <div className="hidden sm:block">
            <p className="text-gray-500 text-xs sm:text-sm">{t("paymentRates.detail.config.created")}</p>
            <p className="font-medium">{formatDate(rate.created_at)}</p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="students" className="w-full">
        <TabsList className="mb-4 w-full sm:w-auto flex">
          <TabsTrigger value="students" className="flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>{t('paymentRates.detail.tabs.students')}</span>
            <span className="text-xs">({students?.length || 0})</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
            <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('paymentRates.detail.tabs.paymentHistory')}</span>
            <span className="sm:hidden">{t('paymentRates.detail.tabs.payments')}</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
            <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>{t('paymentRates.detail.tabs.history')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            {/* Search Filter and Bulk Actions */}
            <div className="p-3 sm:p-4 border-b border-gray-100">
              <div className="flex flex-col gap-3">
                {/* Search bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t('paymentRates.detail.students.searchPlaceholder')}
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                {/* Selection bar and bulk actions */}
                {filteredStudents.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={
                            filteredSelectionState.allSelected
                              ? true
                              : filteredSelectionState.someSelected
                              ? "indeterminate"
                              : false
                          }
                          onCheckedChange={handleSelectAll}
                        />
                        <span className="text-sm text-gray-600">
                          {filteredSelectionState.selectedCount > 0
                            ? t('paymentRates.detail.students.selectedCount', { count: filteredSelectionState.selectedCount })
                            : t('paymentRates.detail.students.selectAll')}
                        </span>
                      </div>
                    </div>

                    {/* Bulk action buttons - show when any selected */}
                    {selectedStudents.size > 0 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowBulkUnlinkDialog(true)}
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                        >
                          <Unlink className="h-4 w-4 mr-1" />
                          {t('paymentRates.detail.students.bulkUnlink')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowBulkDeleteDialog(true)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {t('paymentRates.detail.students.bulkDelete')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedStudents(new Set())}
                          className="text-gray-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {studentSearch && (
                  <p className="text-xs text-gray-500">
                    {t('paymentRates.detail.students.ofStudents', { count: filteredStudents.length, total: students?.length || 0 })}
                  </p>
                )}
              </div>
            </div>

            {isLoadingStudents ? (
              <div className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
              </div>
            ) : filteredStudents.length > 0 ? (
              <>
                {/* Mobile list view */}
                <div className="sm:hidden divide-y divide-gray-100">
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="p-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedStudents.has(student.id)}
                          onCheckedChange={(checked) =>
                            handleSelectStudent(student.id, checked as boolean)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{student.full_name}</p>
                          <p className="text-xs text-gray-400">
                            {t('paymentRates.detail.students.since')} {formatDate(student.assignment_start_date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {student.phone && (
                            <a
                              href={`https://wa.me/${formatPhoneForWhatsApp(student.phone)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors border border-green-200"
                              title={t('paymentRates.detail.students.openWhatsApp')}
                            >
                              <WhatsAppIcon className="h-4 w-4" />
                            </a>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setStudentToUnlink(student)}
                            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            title={t('paymentRates.detail.students.unlinkStudent')}
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setStudentToDelete(student)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title={t('paymentRates.detail.students.deleteStudent')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table view */}
                <Table className="hidden sm:table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>{t('paymentRates.detail.students.student')}</TableHead>
                      <TableHead>{t('paymentRates.detail.students.email')}</TableHead>
                      <TableHead>{t('paymentRates.detail.students.phone')}</TableHead>
                      <TableHead>{t('paymentRates.detail.students.since')}</TableHead>
                      <TableHead className="text-right">{t('paymentRates.detail.students.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id} className={selectedStudents.has(student.id) ? "bg-primary/5" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.has(student.id)}
                            onCheckedChange={(checked) =>
                              handleSelectStudent(student.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{student.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">{student.email}</TableCell>
                        <TableCell>
                          {student.phone ? (
                            <a
                              href={`https://wa.me/${formatPhoneForWhatsApp(student.phone)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 transition-all duration-200 text-xs font-medium border border-green-200 hover:border-green-300 hover:shadow-sm w-fit"
                              title={t('paymentRates.detail.students.openWhatsApp')}
                            >
                              <WhatsAppIcon className="h-3.5 w-3.5" />
                              <span>{student.phone}</span>
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(student.assignment_start_date)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setStudentToUnlink(student)}
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              title={t('paymentRates.detail.students.unlinkStudent')}
                            >
                              <Unlink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setStudentToDelete(student)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title={t('paymentRates.detail.students.deleteStudent')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            ) : (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {studentSearch ? t('paymentRates.detail.students.noStudentsFound') : t('paymentRates.detail.students.noActiveStudents')}
                </p>
                {!studentSearch && (
                  <Button asChild variant="outline" className="mt-4">
                    <Link to="/dashboard/payment-rates/assign">
                      {t('paymentRates.detail.students.assignStudents')}
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history">
          {isLoadingHistory ? (
            <Card className="p-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            </Card>
          ) : paymentHistory && paymentHistory.length > 0 ? (
            <div className="space-y-4">
              {/* Month Navigation */}
              <Card className="p-3 sm:p-4">
                {/* Month navigation - full width on mobile */}
                <div className="flex items-center justify-between gap-2 sm:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousHistoryMonth}
                    className="h-10 w-10 p-0"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  <div className="text-base font-semibold text-gray-900 text-center flex-1">
                    {getCurrentHistoryMonthLabel()}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextHistoryMonth}
                    className="h-10 w-10 p-0"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>

                {/* Mes actual button - mobile */}
                {isViewingDifferentPeriod && (
                  <div className="mt-3 sm:hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetToCurrentMonth}
                      className="text-primary hover:text-white hover:bg-primary text-sm h-8 w-full"
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      {t('paymentRates.detail.paymentHistory.goToCurrentMonth')}
                    </Button>
                  </div>
                )}

                {/* Desktop view */}
                <div className="hidden sm:flex items-center gap-3">
                  {/* Month navigation */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousHistoryMonth}
                      className="h-9 px-2"
                      title={t('paymentRates.detail.paymentHistory.previousMonth')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="px-3 py-1.5 text-sm font-medium min-w-[140px] text-center">
                      {getCurrentHistoryMonthLabel()}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextHistoryMonth}
                      className="h-9 px-2"
                      title={t('paymentRates.detail.paymentHistory.nextMonth')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Current month button */}
                  {isViewingDifferentPeriod && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetToCurrentMonth}
                      className="text-primary hover:text-white hover:bg-primary text-sm h-9"
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      {t('paymentRates.detail.paymentHistory.currentMonth')}
                    </Button>
                  )}

                  {/* Results count */}
                  <span className="text-xs text-gray-500 ml-auto">
                    {filteredPaymentHistory.length} {t('paymentRates.detail.paymentHistory.period', { count: filteredPaymentHistory.length })}
                  </span>
                </div>

                {/* Mobile results count */}
                <div className="mt-3 text-xs text-gray-500 sm:hidden text-center">
                  {filteredPaymentHistory.length} {t('paymentRates.detail.paymentHistory.periodFound', { count: filteredPaymentHistory.length })}
                </div>
              </Card>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-3 sm:p-4 text-center bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-600">{t('paymentRates.detail.paymentHistory.paid')}</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{historyTotals.paid}</p>
                  <p className="text-xs text-emerald-500 mt-1">
                    {historyTotals.total > 0 ? Math.round((historyTotals.paid / historyTotals.total) * 100) : 0}%
                  </p>
                </Card>
                <Card className="p-3 sm:p-4 text-center bg-gradient-to-br from-amber-50 to-white border-amber-100">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-600">{t('paymentRates.detail.paymentHistory.pending')}</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-amber-700">{historyTotals.pending}</p>
                  <p className="text-xs text-amber-500 mt-1">
                    {historyTotals.total > 0 ? Math.round((historyTotals.pending / historyTotals.total) * 100) : 0}%
                  </p>
                </Card>
                <Card className="p-3 sm:p-4 text-center bg-gradient-to-br from-blue-50 to-white border-blue-100">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">{t('paymentRates.detail.paymentHistory.inReview')}</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-700">{historyTotals.inReview}</p>
                  <p className="text-xs text-blue-500 mt-1">
                    {historyTotals.total > 0 ? Math.round((historyTotals.inReview / historyTotals.total) * 100) : 0}%
                  </p>
                </Card>
              </div>

              {/* Chart Card */}
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {t('paymentRates.detail.paymentHistory.billingEvolution')}
                </h3>

                {/* Modern Bar Chart */}
                <div className="space-y-2 mb-6">
                  {filteredPaymentHistory.slice().reverse().map((month, index) => {
                    const paidPercent = month.payment_count > 0 ? (month.paid_count / month.payment_count) * 100 : 0;
                    const pendingPercent = month.payment_count > 0 ? (month.pending_count / month.payment_count) * 100 : 0;
                    const reviewPercent = month.payment_count > 0 ? (month.in_review_count / month.payment_count) * 100 : 0;

                    return (
                      <div key={index} className="group">
                        {/* Mobile view */}
                        <div className="sm:hidden">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700">{month.month} {month.year}</span>
                            <span className="text-sm font-semibold text-gray-900">{formatCurrency(month.total_amount)}</span>
                          </div>
                          <div className="h-6 bg-gray-100 rounded-lg overflow-hidden flex">
                            {paidPercent > 0 && (
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                                style={{ width: `${paidPercent}%` }}
                              />
                            )}
                            {pendingPercent > 0 && (
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                                style={{ width: `${pendingPercent}%` }}
                              />
                            )}
                            {reviewPercent > 0 && (
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                                style={{ width: `${reviewPercent}%` }}
                              />
                            )}
                          </div>
                          <div className="flex gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              {month.paid_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              {month.pending_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              {month.in_review_count}
                            </span>
                          </div>
                        </div>

                        {/* Desktop view */}
                        <div className="hidden sm:flex items-center gap-4 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="w-24 text-sm font-medium text-gray-700">
                            {month.month} {month.year}
                          </div>
                          <div className="flex-1 h-10 bg-gray-100 rounded-lg overflow-hidden flex relative">
                            {paidPercent > 0 && (
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 flex items-center justify-center transition-all duration-500"
                                style={{ width: `${paidPercent}%` }}
                              >
                                {paidPercent > 15 && (
                                  <span className="text-xs font-medium text-white">{month.paid_count}</span>
                                )}
                              </div>
                            )}
                            {pendingPercent > 0 && (
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 flex items-center justify-center transition-all duration-500"
                                style={{ width: `${pendingPercent}%` }}
                              >
                                {pendingPercent > 15 && (
                                  <span className="text-xs font-medium text-white">{month.pending_count}</span>
                                )}
                              </div>
                            )}
                            {reviewPercent > 0 && (
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 flex items-center justify-center transition-all duration-500"
                                style={{ width: `${reviewPercent}%` }}
                              >
                                {reviewPercent > 15 && (
                                  <span className="text-xs font-medium text-white">{month.in_review_count}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="w-28 text-right">
                            <span className="text-sm font-semibold text-gray-900">{formatCurrency(month.total_amount)}</span>
                          </div>
                          <div className="w-20 text-right text-xs text-gray-500">
                            {month.payment_count} {t('paymentRates.detail.stats.payments')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
                    <span className="text-xs sm:text-sm text-gray-600">{t('paymentRates.detail.paymentHistory.paid')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-400" />
                    <span className="text-xs sm:text-sm text-gray-600">{t('paymentRates.detail.paymentHistory.pending')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-400" />
                    <span className="text-xs sm:text-sm text-gray-600">{t('paymentRates.detail.paymentHistory.inReview')}</span>
                  </div>
                </div>
              </Card>

              {/* Collection Rate Visualization */}
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" />
                  {t('paymentRates.detail.paymentHistory.globalCollectionRate')}
                </h3>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Circular Progress */}
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        fill="none"
                        stroke="#f3f4f6"
                        strokeWidth="12"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${collectionRate * 2.83} 283`}
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl sm:text-4xl font-bold text-gray-900">{collectionRate}%</span>
                      <span className="text-xs text-gray-500">{t('paymentRates.detail.paymentHistory.collected')}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm text-emerald-700">{t('paymentRates.detail.paymentHistory.collectedAmount')}</span>
                      </div>
                      <span className="font-semibold text-emerald-700">{formatCurrency(stats?.total_amount_paid || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm text-amber-700">{t('paymentRates.detail.paymentHistory.pendingAmount')}</span>
                      </div>
                      <span className="font-semibold text-amber-700">{formatCurrency(stats?.total_amount_pending || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Euro className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-700">{t('paymentRates.detail.paymentHistory.totalBilled')}</span>
                      </div>
                      <span className="font-semibold text-gray-700">{formatCurrency(stats?.total_amount_billed || 0)}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Detail Table */}
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    {t('paymentRates.detail.paymentHistory.monthDetail')}
                  </h3>
                </div>
                {/* Mobile list view */}
                <div className="sm:hidden divide-y divide-gray-100">
                  {filteredPaymentHistory.map((month, index) => (
                    <div key={index} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{month.month} {month.year}</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(month.total_amount)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-gray-600">{month.paid_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-gray-600">{month.pending_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-gray-600">{month.in_review_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop table view */}
                <Table className="hidden sm:table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('paymentRates.detail.paymentHistory.period')}</TableHead>
                      <TableHead className="text-right">{t('paymentRates.detail.paymentHistory.totalAmount')}</TableHead>
                      <TableHead className="text-center">{t('paymentRates.detail.paymentHistory.totalPayments')}</TableHead>
                      <TableHead className="text-center">{t('paymentRates.detail.paymentHistory.paid')}</TableHead>
                      <TableHead className="text-center">{t('paymentRates.detail.paymentHistory.pending')}</TableHead>
                      <TableHead className="text-center">{t('paymentRates.detail.paymentHistory.inReview')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPaymentHistory.map((month, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{month.month} {month.year}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(month.total_amount)}</TableCell>
                        <TableCell className="text-center">{month.payment_count}</TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-sm">
                            {month.paid_count}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-sm">
                            {month.pending_count}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-sm">
                            {month.in_review_count}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('paymentRates.detail.paymentHistory.noPaymentHistory')}</p>
            </Card>
          )}
        </TabsContent>

        {/* Assignments History Tab */}
        <TabsContent value="assignments">
          <Card>
            {/* Filters */}
            <div className="p-3 sm:p-4 border-b border-gray-100 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t('paymentRates.detail.assignments.searchPlaceholder')}
                    value={assignmentSearch}
                    onChange={(e) => setAssignmentSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Select value={assignmentStatusFilter} onValueChange={setAssignmentStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] h-9">
                    <SelectValue placeholder={t('paymentRates.detail.assignments.statusPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('paymentRates.detail.assignments.allStatuses')}</SelectItem>
                    <SelectItem value="activa">{t('paymentRates.detail.assignments.active')}</SelectItem>
                    <SelectItem value="pausada">{t('paymentRates.detail.assignments.paused')}</SelectItem>
                    <SelectItem value="finalizada">{t('paymentRates.detail.assignments.finished')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(assignmentSearch || assignmentStatusFilter !== "all") && (
                <p className="text-xs text-gray-500">
                  {t('paymentRates.detail.assignments.ofAssignments', { count: filteredAssignments.length, total: allAssignments?.length || 0 })}
                </p>
              )}
            </div>

            {filteredAssignments.length > 0 ? (
              <>
                {/* Mobile list view */}
                <div className="sm:hidden divide-y divide-gray-100">
                  {filteredAssignments.map((assignment) => {
                    const statusColor = STATUS_COLORS[assignment.status] || STATUS_COLORS.finalizada;
                    const statusLabel = getStatusLabel(assignment.status);
                    return (
                      <div key={assignment.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900">
                              {assignment.student_enrollment?.full_name || t('paymentRates.detail.assignments.noName')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {t('paymentRates.detail.assignments.from')} {formatDate(assignment.start_date)}
                            </p>
                            {assignment.end_date && (
                              <p className="text-xs text-gray-500">
                                {t('paymentRates.detail.assignments.until')} {formatDate(assignment.end_date)}
                              </p>
                            )}
                          </div>
                          <Badge className={statusColor}>
                            {statusLabel}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table view */}
                <Table className="hidden sm:table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('paymentRates.detail.assignments.student')}</TableHead>
                      <TableHead>{t('paymentRates.detail.assignments.status')}</TableHead>
                      <TableHead>{t('paymentRates.detail.assignments.startDate')}</TableHead>
                      <TableHead>{t('paymentRates.detail.assignments.endDate')}</TableHead>
                      <TableHead>{t('paymentRates.detail.assignments.assigned')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssignments.map((assignment) => {
                      const statusColor = STATUS_COLORS[assignment.status] || STATUS_COLORS.finalizada;
                      const statusLabel = getStatusLabel(assignment.status);
                      return (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <span className="font-medium">
                              {assignment.student_enrollment?.full_name || t('paymentRates.detail.assignments.noName')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColor}>
                              {statusLabel}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(assignment.start_date)}</TableCell>
                          <TableCell>
                            {assignment.end_date ? formatDate(assignment.end_date) : '-'}
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {formatDate(assignment.created_at)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </>
            ) : (
              <div className="p-8 text-center">
                <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {assignmentSearch || assignmentStatusFilter !== "all"
                    ? t('paymentRates.detail.assignments.noAssignmentsFound')
                    : t('paymentRates.detail.assignments.noAssignmentHistory')}
                </p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Unlink Student Confirmation Dialog (soft action - amber) */}
      <AlertDialog open={!!studentToUnlink} onOpenChange={(open) => !open && setStudentToUnlink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('paymentRates.detail.students.unlinkDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('paymentRates.detail.students.unlinkDialog.description', { name: studentToUnlink?.full_name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmUnlink();
              }}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={unlinkRateAssignment.isPending}
            >
              {unlinkRateAssignment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t('paymentRates.detail.students.unlinkDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Student First Confirmation Dialog (hard delete - red) */}
      <AlertDialog open={!!studentToDelete && !showDeleteConfirmation} onOpenChange={(open) => !open && handleCloseDeleteDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">{t('paymentRates.detail.students.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{t('paymentRates.detail.students.deleteDialog.description', { name: studentToDelete?.full_name })}</p>
              <p className="text-red-600 font-medium">{t('paymentRates.detail.students.deleteDialog.warning')}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleOpenDeleteConfirmation();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('paymentRates.detail.students.deleteDialog.continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Student Second Confirmation Dialog (requires typing ELIMINAR) */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={(open) => !open && handleCloseDeleteDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">{t('paymentRates.detail.students.deleteConfirmDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{t('paymentRates.detail.students.deleteConfirmDialog.description', { name: studentToDelete?.full_name })}</p>
              <p className="text-sm text-gray-600">{t('paymentRates.detail.students.deleteConfirmDialog.typeInstruction')}</p>
              <Input
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value.toUpperCase())}
                placeholder="ELIMINAR"
                className="font-mono text-center tracking-widest"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowDeleteConfirmation(false); setDeleteConfirmationText(""); }}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteConfirmationText !== 'ELIMINAR' || deleteRateAssignment.isPending}
            >
              {deleteRateAssignment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t('paymentRates.detail.students.deleteConfirmDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Unlink Confirmation Dialog */}
      <AlertDialog open={showBulkUnlinkDialog} onOpenChange={(open) => !open && setShowBulkUnlinkDialog(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('paymentRates.detail.students.bulkUnlinkDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('paymentRates.detail.students.bulkUnlinkDialog.description', { count: selectedStudents.size })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleBulkUnlink();
              }}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={isBulkActionPending}
            >
              {isBulkActionPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t('paymentRates.detail.students.bulkUnlinkDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete First Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog && !showBulkDeleteConfirmation} onOpenChange={(open) => !open && handleCloseBulkDeleteDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">{t('paymentRates.detail.students.bulkDeleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{t('paymentRates.detail.students.bulkDeleteDialog.description', { count: selectedStudents.size })}</p>
              <p className="text-red-600 font-medium">{t('paymentRates.detail.students.bulkDeleteDialog.warning')}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleOpenBulkDeleteConfirmation();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('paymentRates.detail.students.bulkDeleteDialog.continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Second Confirmation Dialog (requires typing ELIMINAR) */}
      <AlertDialog open={showBulkDeleteConfirmation} onOpenChange={(open) => !open && handleCloseBulkDeleteDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">{t('paymentRates.detail.students.bulkDeleteConfirmDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{t('paymentRates.detail.students.bulkDeleteConfirmDialog.description', { count: selectedStudents.size })}</p>
              <p className="text-sm text-gray-600">{t('paymentRates.detail.students.bulkDeleteConfirmDialog.typeInstruction')}</p>
              <Input
                value={bulkDeleteConfirmationText}
                onChange={(e) => setBulkDeleteConfirmationText(e.target.value.toUpperCase())}
                placeholder="ELIMINAR"
                className="font-mono text-center tracking-widest"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowBulkDeleteConfirmation(false); setBulkDeleteConfirmationText(""); }}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleBulkDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={bulkDeleteConfirmationText !== 'ELIMINAR' || isBulkActionPending}
            >
              {isBulkActionPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t('paymentRates.detail.students.bulkDeleteConfirmDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
