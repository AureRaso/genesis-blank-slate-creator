import { useTranslation } from "react-i18next";
import { Ticket, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMyBonos, StudentBono } from "@/hooks/useStudentBonos";
import { useClubs } from "@/hooks/useClubs";
import { formatCurrency } from "@/lib/currency";

const STATUS_COLORS: Record<string, string> = {
  activo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  agotado: "bg-gray-50 text-gray-500 border-gray-200",
  expirado: "bg-red-50 text-red-700 border-red-200",
  cancelado: "bg-gray-50 text-gray-400 border-gray-200",
};

export default function PlayerBonosTab() {
  const { t, i18n } = useTranslation();
  const { data: bonos, isLoading } = useMyBonos();
  const { data: clubs } = useClubs();

  const clubCurrency = clubs?.[0]?.currency || 'EUR';
  const dateLocale = i18n.language === "en" ? "en-US" : i18n.language === "it" ? "it-IT" : "es-ES";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeBonos = bonos?.filter(b => b.status === 'activo') || [];
  const inactiveBonos = bonos?.filter(b => b.status !== 'activo') || [];

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      activo: t("myBonos.status.active"),
      agotado: t("myBonos.status.used"),
      expirado: t("myBonos.status.expired"),
      cancelado: t("myBonos.status.cancelled"),
    };
    return labels[status] || status;
  };

  const getProgressPercent = (bono: StudentBono) => {
    if (bono.total_classes === 0) return 0;
    return Math.round((bono.remaining_classes / bono.total_classes) * 100);
  };

  const getProgressColor = (bono: StudentBono) => {
    const percent = getProgressPercent(bono);
    if (percent <= 20) return "bg-red-500";
    if (percent <= 50) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const formatExpiryDate = (expiresAt: string | null) => {
    if (!expiresAt) return t("myBonos.noExpiry");
    const expDate = new Date(expiresAt);
    const now = new Date();
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return t("myBonos.expired");
    if (diffDays === 0) return t("myBonos.expiresToday");
    if (diffDays <= 7) return t("myBonos.expiresInDays", { days: diffDays });
    return expDate.toLocaleDateString(dateLocale);
  };

  const BonoCard = ({ bono }: { bono: StudentBono }) => {
    const percent = getProgressPercent(bono);
    const progressColor = getProgressColor(bono);

    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                {bono.bono_template?.name || t("myBonos.unknownPack")}
              </h3>
              <p className="text-sm text-gray-500">
                {formatCurrency(bono.price_paid, clubCurrency)}
              </p>
            </div>
            <Badge className={STATUS_COLORS[bono.status] || STATUS_COLORS.cancelado}>
              {getStatusLabel(bono.status)}
            </Badge>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {t("myBonos.classesRemaining")}
              </span>
              <span className="font-semibold">
                {bono.remaining_classes} / {bono.total_classes}
              </span>
            </div>
            <div className="relative">
              <Progress value={percent} className="h-3" />
              <div
                className={`absolute inset-0 h-3 rounded-full ${progressColor} transition-all`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 text-sm text-gray-500">
            <span>{t("myBonos.purchased")}: {new Date(bono.purchased_at).toLocaleDateString(dateLocale)}</span>
            {bono.expires_at && (
              <>
                <span className="hidden sm:inline text-gray-300">•</span>
                <span>
                  {t("myBonos.expires")}: {formatExpiryDate(bono.expires_at)}
                </span>
              </>
            )}
          </div>
        </div>
      </Card>
    );
  };

  if (!bonos || bonos.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed">
        <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          {t("myBonos.empty.title")}
        </h3>
        <p className="text-gray-500 text-sm">
          {t("myBonos.empty.description")}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Bonos */}
      {activeBonos.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("myBonos.activeBonos")} ({activeBonos.length})
          </h2>
          {activeBonos.map(bono => (
            <BonoCard key={bono.id} bono={bono} />
          ))}
        </div>
      )}

      {/* Inactive Bonos */}
      {inactiveBonos.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-500">
            {t("myBonos.pastBonos")} ({inactiveBonos.length})
          </h2>
          {inactiveBonos.map(bono => (
            <BonoCard key={bono.id} bono={bono} />
          ))}
        </div>
      )}
    </div>
  );
}
