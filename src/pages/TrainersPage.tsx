
import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TrainerForm from "@/components/TrainerForm";
import TrainerStatsCards from "@/components/TrainerStatsCards";
import TrainersPrivateRatesTable from "@/components/TrainersPrivateRatesTable";
import TrainerWeeklySchedule from "@/components/TrainerWeeklySchedule";
import { useAuth } from "@/contexts/AuthContext";
import { Trainer, useAdminTrainers } from "@/hooks/useTrainers";
import { useTranslation } from "react-i18next";

const TrainersPage = () => {
  const [showTrainerForm, setShowTrainerForm] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | undefined>();
  const [scheduleTrainer, setScheduleTrainer] = useState<Trainer | null>(null);
  const { isAdmin, effectiveClubId } = useAuth();
  const { t } = useTranslation();
  const { data: trainers, isLoading, error } = useAdminTrainers(effectiveClubId);

  const handleCloseTrainerForm = () => {
    setShowTrainerForm(false);
    setEditingTrainer(undefined);
  };

  const handleEditTrainer = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setShowTrainerForm(true);
  };

  const handleCreateNewTrainer = () => {
    setEditingTrainer(undefined);
    setShowTrainerForm(true);
  };

  const handleViewSchedule = (trainer: Trainer) => {
    setScheduleTrainer(trainer);
  };

  const handleBackFromSchedule = () => {
    setScheduleTrainer(null);
  };

  if (showTrainerForm) {
    return (
      <div className="space-y-6">
        <TrainerForm trainer={editingTrainer} onClose={handleCloseTrainerForm} />
      </div>
    );
  }

  if (scheduleTrainer) {
    return (
      <TrainerWeeklySchedule
        trainer={scheduleTrainer}
        onBack={handleBackFromSchedule}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {!isAdmin && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-playtomic-orange-dark">{t('trainersPage.readOnlyAccess.title')}</CardTitle>
            <CardDescription className="text-playtomic-orange">
              {t('trainersPage.readOnlyAccess.description')}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats cards */}
      <TrainerStatsCards trainers={trainers || []} />

      {/* Private rates table */}
      <TrainersPrivateRatesTable
        trainers={trainers || []}
        isLoading={isLoading}
        error={error}
        onEditTrainer={handleEditTrainer}
        onCreateTrainer={handleCreateNewTrainer}
        onViewSchedule={handleViewSchedule}
      />

      {/* Info tip banner */}
      {trainers && trainers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            {t('trainersPage.privateRates.infoTip')}
          </p>
        </div>
      )}
    </div>
  );
};

export default TrainersPage;