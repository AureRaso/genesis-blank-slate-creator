import { Users, BookOpen, CalendarX, Euro, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useTrainerStats } from "@/hooks/useTrainerStats";
import { useTranslation } from "react-i18next";

interface TrainerStatsPanelProps {
  trainerProfileId: string;
  clubId: string;
  enabled: boolean;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) => (
  <div className="flex items-center gap-3 rounded-lg border bg-white p-3">
    <div className={`rounded-md p-2 ${color}`}>
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold leading-none mt-0.5">{value}</p>
    </div>
  </div>
);

const TrainerStatsPanel = ({
  trainerProfileId,
  clubId,
  enabled,
}: TrainerStatsPanelProps) => {
  const { stats, isLoading } = useTrainerStats(trainerProfileId, clubId, enabled);
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2">
      {/* Group classes */}
      <StatCard
        icon={BookOpen}
        label={t("trainersPage.trainerStats.groupClasses", "Clases grupales")}
        value={stats.groupClasses.total}
        color="bg-blue-50 text-blue-600"
      />
      <StatCard
        icon={CheckCircle2}
        label={t("trainersPage.trainerStats.activeClasses", "Activas")}
        value={stats.groupClasses.active}
        color="bg-emerald-50 text-emerald-600"
      />
      <StatCard
        icon={Users}
        label={t("trainersPage.trainerStats.totalStudents", "Alumnos inscritos")}
        value={stats.groupClasses.totalStudents}
        color="bg-violet-50 text-violet-600"
      />
      <StatCard
        icon={CalendarX}
        label={t("trainersPage.trainerStats.cancellations", "Cancelaciones")}
        value={stats.cancellations}
        color="bg-red-50 text-red-600"
      />

      {/* Private lessons */}
      <StatCard
        icon={Clock}
        label={t("trainersPage.trainerStats.privateLessons", "C. Particulares")}
        value={stats.privateLessons.total}
        color="bg-orange-50 text-orange-600"
      />
      <StatCard
        icon={CheckCircle2}
        label={t("trainersPage.trainerStats.confirmed", "Confirmadas")}
        value={stats.privateLessons.confirmed}
        color="bg-emerald-50 text-emerald-600"
      />
      <StatCard
        icon={XCircle}
        label={t("trainersPage.trainerStats.cancelledRejected", "Cancel./Rechaz.")}
        value={stats.privateLessons.cancelled}
        color="bg-amber-50 text-amber-600"
      />
      <StatCard
        icon={Euro}
        label={t("trainersPage.trainerStats.revenue", "Ingresos")}
        value={`${stats.privateLessons.totalRevenue.toFixed(0)}\u20AC`}
        color="bg-green-50 text-green-700"
      />
    </div>
  );
};

export default TrainerStatsPanel;
