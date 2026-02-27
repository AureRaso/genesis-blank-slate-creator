import { useState } from "react";
import { Edit, CalendarDays, UserCheck, Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trainer } from "@/hooks/useTrainers";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import TrainerRateDialog from "@/components/TrainerRateDialog";

interface TrainersPrivateRatesTableProps {
  trainers: Trainer[];
  isLoading: boolean;
  error: Error | null;
  onEditTrainer: (trainer: Trainer) => void;
  onCreateTrainer: () => void;
  onViewSchedule: (trainer: Trainer) => void;
}

const getInitials = (name: string) => {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'PR';
};

const TrainersPrivateRatesTable = ({
  trainers,
  isLoading,
  error,
  onEditTrainer,
  onCreateTrainer,
  onViewSchedule,
}: TrainersPrivateRatesTableProps) => {
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
  const [rateDialogTrainer, setRateDialogTrainer] = useState<Trainer | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="h-10 w-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/6" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-red-600">{t('trainersPage.trainersList.errorLoading')}</p>
        </CardContent>
      </Card>
    );
  }

  if (!trainers || trainers.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('trainersPage.trainersList.noTrainers')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('trainersPage.trainersList.noTrainersHint')}
          </p>
          {isAdmin && (
            <Button onClick={onCreateTrainer} className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark">
              <Plus className="mr-2 h-4 w-4" />
              {t('trainersPage.trainersList.createFirstTrainer')}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const renderTrainerRow = (trainer: Trainer) => {
    const trainerName = trainer.profiles?.full_name || t('trainersPage.trainersList.fallback.nameNotAvailable');
    const trainerEmail = trainer.profiles?.email || t('trainersPage.trainersList.fallback.emailNotAvailable');
    const rates = trainer.private_lesson_rates || {};
    const configuredDurations = Object.keys(rates).filter((k) => {
      const r = rates[k];
      return r && (r.price_1_player != null || r.price_2_players != null || r.price_3_players != null || r.price_4_players != null);
    });
    const isConfigured = configuredDurations.length > 0;

    // Show the lowest 1-player price across all durations
    const ratePerClass = configuredDurations.reduce<number | null>((min, k) => {
      const p = rates[k]?.price_1_player;
      if (p == null) return min;
      return min == null ? p : Math.min(min, p);
    }, null);

    // Build duration label from configured durations
    const durationLabel = isConfigured
      ? configuredDurations
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => {
            const h = Number(k) / 60;
            return h === 1 ? '1h' : `${h.toLocaleString('es-ES', { maximumFractionDigits: 1 })}h`;
          })
          .join(' · ')
      : `1 ${t('trainersPage.privateRates.hour')}`;

    return { trainerName, trainerEmail, ratePerClass, durationLabel, isConfigured };
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-bold">
            {t('trainersPage.privateRates.title')}
          </CardTitle>
          {isAdmin && (
            <Button
              onClick={onCreateTrainer}
              className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark rounded-full px-5"
            >
              {t('trainersPage.privateRates.addTrainer')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="uppercase text-xs font-semibold tracking-wider">
                    {t('trainersPage.privateRates.columns.trainer')}
                  </TableHead>
                  <TableHead className="uppercase text-xs font-semibold tracking-wider">
                    {t('trainersPage.privateRates.columns.ratePerClass')}
                  </TableHead>
                  <TableHead className="uppercase text-xs font-semibold tracking-wider">
                    {t('trainersPage.privateRates.columns.duration')}
                  </TableHead>
                  <TableHead className="uppercase text-xs font-semibold tracking-wider">
                    {t('trainersPage.privateRates.columns.availability')}
                  </TableHead>
                  <TableHead className="uppercase text-xs font-semibold tracking-wider">
                    {t('trainersPage.privateRates.columns.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainers.map((trainer) => {
                  const { trainerName, trainerEmail, ratePerClass, durationLabel, isConfigured } = renderTrainerRow(trainer);

                  return (
                    <TableRow key={trainer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={trainer.photo_url || undefined} alt={trainerName} />
                            <AvatarFallback className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark text-white text-sm">
                              {getInitials(trainerName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{trainerName}</p>
                            <p className="text-sm text-muted-foreground">{trainerEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isConfigured ? (
                          <span className="font-semibold text-playtomic-orange">{ratePerClass}&euro;</span>
                        ) : (
                          <span className="text-muted-foreground">&mdash;</span>
                        )}
                      </TableCell>
                      <TableCell>{durationLabel}</TableCell>
                      <TableCell>
                        {isConfigured ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                            {t('trainersPage.privateRates.active')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            {t('trainersPage.privateRates.notConfigured')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEditTrainer(trainer)}
                              className="h-9 w-9"
                              title={t('trainersPage.privateRates.editInfo', 'Editar información')}
                            >
                              <Settings2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setRateDialogTrainer(trainer)}
                              className="h-9 w-9"
                              title={t('trainersPage.privateRates.editRates', 'Editar tarifas')}
                            >
                              <Edit className="h-4 w-4 text-playtomic-orange" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => onViewSchedule(trainer)}
                            title={t('trainersPage.privateRates.viewSchedule', 'Ver horario')}
                          >
                            <CalendarDays className="h-4 w-4 text-blue-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3">
            {trainers.map((trainer) => {
              const data = renderTrainerRow(trainer);

              return (
                <Card key={trainer.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={trainer.photo_url || undefined} alt={data.trainerName} />
                        <AvatarFallback className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark text-white text-sm">
                          {getInitials(data.trainerName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{data.trainerName}</p>
                        <p className="text-xs text-muted-foreground">{data.trainerEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => onEditTrainer(trainer)} className="h-8 w-8">
                          <Settings2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                      {isAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => setRateDialogTrainer(trainer)} className="h-8 w-8">
                          <Edit className="h-4 w-4 text-playtomic-orange" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewSchedule(trainer)}>
                        <CalendarDays className="h-4 w-4 text-blue-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        {t('trainersPage.privateRates.columns.ratePerClass')}
                      </p>
                      {data.isConfigured ? (
                        <p className="font-semibold text-playtomic-orange">{data.ratePerClass}&euro;</p>
                      ) : (
                        <p className="text-muted-foreground">&mdash;</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        {t('trainersPage.privateRates.columns.duration')}
                      </p>
                      <p>{data.durationLabel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        {t('trainersPage.privateRates.columns.availability')}
                      </p>
                      {data.isConfigured ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-xs mt-0.5">
                          {t('trainersPage.privateRates.active')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-xs mt-0.5">
                          {t('trainersPage.privateRates.notConfigured')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Rate editing dialog */}
      {rateDialogTrainer && (
        <TrainerRateDialog
          trainer={rateDialogTrainer}
          open={!!rateDialogTrainer}
          onOpenChange={(open) => { if (!open) setRateDialogTrainer(null); }}
        />
      )}
    </>
  );
};

export default TrainersPrivateRatesTable;