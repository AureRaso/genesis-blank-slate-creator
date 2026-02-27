
import { useState } from "react";
import { GraduationCap, Lightbulb, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TrainerForm from "@/components/TrainerForm";
import TrainersPrivateRatesTable from "@/components/TrainersPrivateRatesTable";
import TrainerWeeklySchedule from "@/components/TrainerWeeklySchedule";
import TrainerRateDialog from "@/components/TrainerRateDialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  Trainer,
  useAdminTrainers,
  usePrivateLessonInstructors,
  useRegisterAsPrivateLessonInstructor,
  useMyTrainerProfile,
} from "@/hooks/useTrainers";
import { useTranslation } from "react-i18next";

const TrainersPage = () => {
  const [showTrainerForm, setShowTrainerForm] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | undefined>();
  const [scheduleTrainer, setScheduleTrainer] = useState<Trainer | null>(null);
  const [rateDialogInstructor, setRateDialogInstructor] = useState<Trainer | null>(null);
  const { isAdmin, effectiveClubId, profile, isSuperAdmin, superAdminClubs } = useAuth();
  const { t } = useTranslation();
  const { data: trainers, isLoading, error } = useAdminTrainers(effectiveClubId);
  const { data: privateLessonInstructors = [] } = usePrivateLessonInstructors(effectiveClubId);
  const { data: myTrainerProfile } = useMyTrainerProfile();
  const registerAsInstructor = useRegisterAsPrivateLessonInstructor();

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

  const handleRegisterAsInstructor = () => {
    if (!profile) return;

    let clubIds: string[] = [];
    if (effectiveClubId) {
      clubIds = [effectiveClubId];
    } else if (isSuperAdmin && superAdminClubs.length > 0) {
      clubIds = superAdminClubs.map(c => c.id);
    } else if (profile.club_id) {
      clubIds = [profile.club_id];
    }

    if (clubIds.length === 0) return;

    registerAsInstructor.mutate({ profileId: profile.id, clubIds });
  };

  // Admin can register if they don't already have a trainer profile
  const canRegisterAsInstructor = isAdmin && !myTrainerProfile;

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

      {/* Private rates table (regular trainers) */}
      <TrainersPrivateRatesTable
        trainers={trainers || []}
        isLoading={isLoading}
        error={error}
        onEditTrainer={handleEditTrainer}
        onCreateTrainer={handleCreateNewTrainer}
        onViewSchedule={handleViewSchedule}
      />

      {/* Private lesson instructors (admins who registered) */}
      {privateLessonInstructors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-playtomic-orange" />
              {t('trainersPage.privateLessonInstructors.title', 'Instructores de Clases Particulares')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {privateLessonInstructors.map((instructor) => {
                const name = instructor.profiles?.full_name || 'Sin nombre';
                const rates = instructor.private_lesson_rates || {};
                const configuredDurations = Object.keys(rates).filter((k) => {
                  const r = rates[k];
                  return r && (r.price_1_player != null || r.price_2_players != null);
                });
                const isConfigured = configuredDurations.length > 0;

                return (
                  <div key={instructor.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-sm text-muted-foreground">
                        {isConfigured
                          ? t('trainersPage.privateLessonInstructors.ratesConfigured', 'Tarifas configuradas')
                          : t('trainersPage.privateLessonInstructors.ratesNotConfigured', 'Sin tarifas configuradas')
                        }
                      </p>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRateDialogInstructor(instructor)}
                      >
                        {t('trainersPage.privateLessonInstructors.editRates', 'Editar tarifas')}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Self-registration card for admin */}
      {canRegisterAsInstructor && (
        <Card className="border-dashed border-2 border-muted-foreground/25">
          <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
            <GraduationCap className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-medium">
              {t('trainersPage.selfRegister.title', 'Ofrecer clases particulares')}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {t('trainersPage.selfRegister.description', 'Regístrate como instructor de clases particulares para configurar tus tarifas y disponibilidad.')}
            </p>
            <Button
              onClick={handleRegisterAsInstructor}
              disabled={registerAsInstructor.isPending}
              className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark mt-2"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {registerAsInstructor.isPending
                ? t('trainersPage.selfRegister.registering', 'Registrando...')
                : t('trainersPage.selfRegister.button', 'Registrarme como instructor')
              }
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info tip banner - removed */}
      {false && trainers && trainers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            {t('trainersPage.privateRates.infoTip')}
          </p>
        </div>
      )}

      {/* Rate editing dialog for private lesson instructors */}
      {rateDialogInstructor && (
        <TrainerRateDialog
          trainer={rateDialogInstructor}
          open={!!rateDialogInstructor}
          onOpenChange={(open) => { if (!open) setRateDialogInstructor(null); }}
        />
      )}
    </div>
  );
};

export default TrainersPage;
