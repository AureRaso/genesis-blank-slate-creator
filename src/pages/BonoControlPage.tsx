import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Search, Ticket, Package, AlertTriangle, Ban, X, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useStudentBonos, useCancelBono, useBonoUsageHistory, StudentBono, BonoUsage } from "@/hooks/useStudentBonos";
import { useBonoTemplates } from "@/hooks/useBonoTemplates";
import { useClubs } from "@/hooks/useClubs";
import { formatCurrency } from "@/lib/currency";

const STATUS_COLORS: Record<string, string> = {
  activo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  agotado: "bg-gray-100 text-gray-500 border-gray-200",
  expirado: "bg-red-50 text-red-600 border-red-200",
  cancelado: "bg-gray-50 text-gray-400 border-gray-200",
};

export default function BonoControlPage() {
  const { t, i18n } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBonoId, setSelectedBonoId] = useState<string | undefined>(undefined);
  const [cancelBonoId, setCancelBonoId] = useState<string | null>(null);

  const { data: bonos, isLoading } = useStudentBonos(undefined, statusFilter);
  const { data: templates } = useBonoTemplates();
  const { data: usageHistory } = useBonoUsageHistory(selectedBonoId);
  const { data: clubs } = useClubs();
  const cancelBono = useCancelBono();

  const clubCurrency = clubs?.[0]?.currency || 'EUR';
  const dateLocale = i18n.language === "en" ? "en-US" : i18n.language === "it" ? "it-IT" : "es-ES";

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      activo: t("bonoControl.status.active"),
      agotado: t("bonoControl.status.used"),
      expirado: t("bonoControl.status.expired"),
      cancelado: t("bonoControl.status.cancelled"),
    };
    return labels[status] || status;
  };

  // Summary stats
  const stats = useMemo(() => {
    if (!bonos) return { active: 0, totalRemaining: 0, lowClasses: 0, totalValue: 0 };

    const activeBonos = bonos.filter(b => b.status === 'activo');
    const totalRemaining = activeBonos.reduce((sum, b) => sum + b.remaining_classes, 0);
    const lowClasses = activeBonos.filter(b => b.remaining_classes <= 2).length;
    const totalValue = activeBonos.reduce((sum, b) => sum + b.price_paid, 0);

    return {
      active: activeBonos.length,
      totalRemaining,
      lowClasses,
      totalValue,
    };
  }, [bonos]);

  // Filtered bonos
  const filteredBonos = useMemo(() => {
    if (!bonos) return [];

    return bonos.filter(bono => {
      // Template filter
      if (templateFilter !== "all" && bono.bono_template_id !== templateFilter) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const name = bono.student_enrollment?.full_name?.toLowerCase() || "";
        const email = bono.student_enrollment?.email?.toLowerCase() || "";
        const templateName = bono.bono_template?.name?.toLowerCase() || "";
        if (!name.includes(search) && !email.includes(search) && !templateName.includes(search)) {
          return false;
        }
      }

      return true;
    });
  }, [bonos, templateFilter, searchTerm]);

  const getProgressPercent = (bono: StudentBono) => {
    if (bono.total_classes === 0) return 0;
    return Math.round((bono.remaining_classes / bono.total_classes) * 100);
  };

  const getProgressColor = (bono: StudentBono) => {
    const percent = getProgressPercent(bono);
    if (percent <= 20) return "text-red-600";
    if (percent <= 50) return "text-amber-600";
    return "text-emerald-600";
  };

  const formatExpiryDate = (expiresAt: string | null) => {
    if (!expiresAt) return t("bonoControl.noExpiry");
    return new Date(expiresAt).toLocaleDateString(dateLocale);
  };

  const handleCancel = async () => {
    if (!cancelBonoId) return;
    await cancelBono.mutateAsync(cancelBonoId);
    setCancelBonoId(null);
  };

  const hasActiveFilters = statusFilter !== "all" || templateFilter !== "all" || searchTerm !== "";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("bonoControl.title")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("bonoControl.subtitle")}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <Ticket className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("bonoControl.summary.activeBonos")}</p>
              <p className="text-xl font-bold">{stats.active}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("bonoControl.summary.remainingClasses")}</p>
              <p className="text-xl font-bold">{stats.totalRemaining}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("bonoControl.summary.lowClasses")}</p>
              <p className="text-xl font-bold">{stats.lowClasses}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Ticket className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("bonoControl.summary.totalValue")}</p>
              <p className="text-xl font-bold">{formatCurrency(stats.totalValue, clubCurrency)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t("bonoControl.filters.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("bonoControl.filters.allStatuses")}</SelectItem>
            <SelectItem value="activo">{t("bonoControl.status.active")}</SelectItem>
            <SelectItem value="agotado">{t("bonoControl.status.used")}</SelectItem>
            <SelectItem value="expirado">{t("bonoControl.status.expired")}</SelectItem>
            <SelectItem value="cancelado">{t("bonoControl.status.cancelled")}</SelectItem>
          </SelectContent>
        </Select>

        {templates && templates.length > 0 && (
          <Select value={templateFilter} onValueChange={setTemplateFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("bonoControl.filters.allTemplates")}</SelectItem>
              {templates.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setStatusFilter("all"); setTemplateFilter("all"); setSearchTerm(""); }}
            className="text-gray-500"
          >
            <X className="h-3 w-3 mr-1" />
            {t("bonoControl.filters.clear")}
          </Button>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {t("bonoControl.filters.showing", { count: filteredBonos.length })}
      </p>

      {/* Table */}
      {filteredBonos.length > 0 ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("bonoControl.table.student")}</TableHead>
                <TableHead>{t("bonoControl.table.bono")}</TableHead>
                <TableHead className="text-center">{t("bonoControl.table.remaining")}</TableHead>
                <TableHead className="text-center">{t("bonoControl.table.progress")}</TableHead>
                <TableHead>{t("bonoControl.table.purchased")}</TableHead>
                <TableHead>{t("bonoControl.table.expires")}</TableHead>
                <TableHead className="text-center">{t("bonoControl.table.status")}</TableHead>
                <TableHead className="text-right">{t("bonoControl.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBonos.map((bono) => {
                const percent = getProgressPercent(bono);
                const colorClass = getProgressColor(bono);

                return (
                  <TableRow key={bono.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{bono.student_enrollment?.full_name || "-"}</p>
                        <p className="text-xs text-gray-500">{bono.student_enrollment?.email || ""}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{bono.bono_template?.name || "-"}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(bono.price_paid, clubCurrency)}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-semibold ${colorClass}`}>
                        {bono.remaining_classes}
                      </span>
                      <span className="text-gray-400">/{bono.total_classes}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="w-20 mx-auto relative">
                        <Progress value={percent} className="h-2" />
                        <div
                          className={`absolute inset-0 h-2 rounded-full ${
                            percent <= 20 ? "bg-red-500" : percent <= 50 ? "bg-amber-500" : "bg-emerald-500"
                          } transition-all`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(bono.purchased_at).toLocaleDateString(dateLocale)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatExpiryDate(bono.expires_at)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={STATUS_COLORS[bono.status] || STATUS_COLORS.cancelado}>
                        {getStatusLabel(bono.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedBonoId(bono.id)}
                          title={t("bonoControl.actions.viewHistory")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {bono.status === 'activo' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCancelBonoId(bono.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title={t("bonoControl.actions.cancel")}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="p-12 text-center border-dashed">
          <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {t("bonoControl.empty.title")}
          </h3>
          <p className="text-gray-500 text-sm">
            {t("bonoControl.empty.description")}
          </p>
        </Card>
      )}

      {/* Usage History Dialog */}
      <Dialog open={!!selectedBonoId} onOpenChange={(open) => { if (!open) setSelectedBonoId(undefined); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("bonoControl.historyDialog.title")}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {usageHistory && usageHistory.length > 0 ? (
              <div className="space-y-3">
                {usageHistory.map((usage: BonoUsage) => (
                  <div
                    key={usage.id}
                    className={`p-3 rounded-lg border ${usage.reverted_at ? "bg-gray-50 border-gray-200" : "bg-white border-gray-100"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <p className="font-medium">
                          {usage.class_date
                            ? new Date(usage.class_date).toLocaleDateString(dateLocale)
                            : new Date(usage.used_at).toLocaleDateString(dateLocale)}
                        </p>
                        {usage.class_name && (
                          <p className="text-gray-700 text-xs">{usage.class_name}</p>
                        )}
                        <p className="text-gray-500 text-xs">
                          {new Date(usage.used_at).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                          {usage.enrollment_type && (
                            <span className="ml-1">
                              · {usage.enrollment_type === 'substitute' ? t("bonoControl.historyDialog.substitute") : t("bonoControl.historyDialog.fixed")}
                            </span>
                          )}
                        </p>
                      </div>
                      {usage.reverted_at ? (
                        <Badge variant="outline" className="text-gray-500">
                          {t("bonoControl.historyDialog.reverted")}
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          -1 {t("bonoControl.historyDialog.class")}
                        </Badge>
                      )}
                    </div>
                    {usage.reverted_reason && (
                      <p className="text-xs text-gray-400 mt-1">{usage.reverted_reason}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t("bonoControl.historyDialog.noUsages")}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelBonoId} onOpenChange={(open) => { if (!open) setCancelBonoId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bonoControl.cancelDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bonoControl.cancelDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("bonoControl.cancelDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelBono.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("bonoControl.cancelDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
