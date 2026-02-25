import { UserCheck, CalendarDays, DollarSign, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { Trainer } from "@/hooks/useTrainers";

interface TrainerStatsCardsProps {
  trainers: Trainer[];
}

const TrainerStatsCards = ({ trainers }: TrainerStatsCardsProps) => {
  const { t } = useTranslation();

  const activeCount = trainers.length;

  // Placeholder values - will be replaced with real data when backend is ready
  const weeklyClasses = 0;
  const weeklyIncome = 0;
  const avgOccupancy = 0;

  const stats = [
    {
      label: t('trainersPage.stats.activeTrainers'),
      value: activeCount.toString(),
      icon: UserCheck,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
    {
      label: t('trainersPage.stats.weeklyClasses'),
      value: weeklyClasses.toString(),
      icon: CalendarDays,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      label: t('trainersPage.stats.weeklyIncome'),
      value: `${weeklyIncome}\u20AC`,
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      label: t('trainersPage.stats.avgOccupancy'),
      value: `${avgOccupancy}%`,
      icon: BarChart3,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <div className={`${stat.bgColor} p-2 rounded-lg`}>
              <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
          <div className="mt-1 h-1 w-12 bg-playtomic-orange rounded-full" />
        </Card>
      ))}
    </div>
  );
};

export default TrainerStatsCards;
