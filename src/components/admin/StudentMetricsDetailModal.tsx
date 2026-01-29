import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  X,
  Clock,
  Ban,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  User,
  Calendar,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { type StudentScoreWithDetails } from "@/hooks/useStudentScoring";
import { type BulkBehaviorMetric } from "@/hooks/useBulkBehaviorMetrics";
import { type StudentEnrollment } from "@/hooks/useStudentEnrollments";
import { ScoreBadge, getScoreCategoryColor } from "./ScoreBadge";

interface StudentMetricsDetailModalProps {
  student: StudentEnrollment | null;
  score: StudentScoreWithDetails | null;
  behavior: BulkBehaviorMetric | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentMetricsDetailModal = ({
  student,
  score,
  behavior,
  isOpen,
  onClose,
}: StudentMetricsDetailModalProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!student) return null;

  const hasNegativeStreak = score?.recent_streak_type === 'negative';
  const recentFailures = score?.recent_failures ?? 0;

  // Calculate rates
  const totalConfirmed = (score?.total_confirmed_attendance ?? 0) + (score?.total_confirmed_absence ?? 0);
  const fulfillmentRate = totalConfirmed > 0
    ? Math.round(((score?.actually_attended_when_confirmed ?? 0) / totalConfirmed) * 100)
    : 0;

  const totalClasses = score?.total_classes ?? 0;
  const classesExcludingCancelled = totalClasses - (score?.classes_cancelled_by_academy ?? 0);
  const communicationRate = classesExcludingCancelled > 0
    ? Math.round((totalConfirmed / classesExcludingCancelled) * 100)
    : 0;

  const handleViewFullScores = () => {
    onClose();
    navigate(`/dashboard/students/${student.id}/score`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{student.full_name}</p>
              <p className="text-sm text-muted-foreground font-normal">{student.email}</p>
            </div>
            {score && (
              <div className="flex flex-col items-center">
                <div className={`text-2xl font-bold ${score.score >= 75 ? 'text-green-600' : score.score >= 60 ? 'text-orange-500' : 'text-red-600'}`}>
                  {score.score}
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${getScoreCategoryColor(score.score_category)}`}
                >
                  {t(`playersPage.adminStudentsList.detailModal.category.${score.score_category}`)}
                </Badge>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Negative streak alert */}
          {hasNegativeStreak && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">
                    {t('playersPage.adminStudentsList.detailModal.negativeStreak')}
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    {t('playersPage.adminStudentsList.detailModal.negativeStreakDesc', { count: recentFailures })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main metrics grid */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">
                  {t('playersPage.adminStudentsList.detailModal.attendanceMetrics')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <MetricItem
                  icon={<Check className="h-4 w-4 text-green-600" />}
                  label={t('playersPage.adminStudentsList.detailModal.attended')}
                  value={score?.actually_attended_when_confirmed ?? 0}
                  color="text-green-600"
                />
                <MetricItem
                  icon={<X className="h-4 w-4 text-red-600" />}
                  label={t('playersPage.adminStudentsList.detailModal.noShows')}
                  value={score?.no_show_when_confirmed ?? 0}
                  color={score?.no_show_when_confirmed ? 'text-red-600' : 'text-gray-500'}
                />
                <MetricItem
                  icon={<Clock className="h-4 w-4 text-orange-500" />}
                  label={t('playersPage.adminStudentsList.detailModal.lateNotices')}
                  value={behavior?.late_notice_absences ?? 0}
                  color={behavior?.late_notice_absences ? 'text-orange-500' : 'text-gray-500'}
                />
                <MetricItem
                  icon={<UserPlus className="h-4 w-4 text-blue-500" />}
                  label={t('playersPage.adminStudentsList.detailModal.substituteAttendances')}
                  value={behavior?.substitute_attendances ?? 0}
                  color={behavior?.substitute_attendances ? 'text-blue-500' : 'text-gray-500'}
                />
                <MetricItem
                  icon={<Ban className="h-4 w-4 text-gray-400" />}
                  label={t('playersPage.adminStudentsList.detailModal.cancelledByAcademy')}
                  value={score?.classes_cancelled_by_academy ?? behavior?.club_cancelled_classes ?? 0}
                  color="text-gray-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Confirmations breakdown */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">
                  {t('playersPage.adminStudentsList.detailModal.confirmations')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <div className="text-lg font-semibold text-green-700">
                    {score?.total_confirmed_attendance ?? 0}
                  </div>
                  <div className="text-xs text-green-600">
                    {t('playersPage.adminStudentsList.detailModal.accepted')}
                  </div>
                </div>
                <div className="text-center p-2 bg-red-50 rounded-lg">
                  <div className="text-lg font-semibold text-red-700">
                    {score?.total_confirmed_absence ?? 0}
                  </div>
                  <div className="text-xs text-red-600">
                    {t('playersPage.adminStudentsList.detailModal.rejected')}
                  </div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-700">
                    {score?.total_no_response ?? 0}
                  </div>
                  <div className="text-xs text-gray-600">
                    {t('playersPage.adminStudentsList.detailModal.noResponse')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress rates */}
          {score && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm">
                      {t('playersPage.adminStudentsList.detailModal.fulfillmentRate')}
                    </span>
                    <span className="text-sm font-medium">{fulfillmentRate}%</span>
                  </div>
                  <Progress value={fulfillmentRate} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('playersPage.adminStudentsList.detailModal.fulfillmentRateDesc')}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm">
                      {t('playersPage.adminStudentsList.detailModal.communicationRate')}
                    </span>
                    <span className="text-sm font-medium">{communicationRate}%</span>
                  </div>
                  <Progress value={communicationRate} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('playersPage.adminStudentsList.detailModal.communicationRateDesc')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent trend */}
          {score?.recent_streak_type && (
            <div className="flex items-center justify-center gap-2 py-2">
              {score.recent_streak_type === 'positive' && (
                <>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">
                    {t('playersPage.adminStudentsList.detailModal.trendPositive')}
                  </span>
                </>
              )}
              {score.recent_streak_type === 'negative' && (
                <>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600 font-medium">
                    {t('playersPage.adminStudentsList.detailModal.trendNegative')}
                  </span>
                </>
              )}
              {score.recent_streak_type === 'neutral' && (
                <>
                  <Minus className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500 font-medium">
                    {t('playersPage.adminStudentsList.detailModal.trendNeutral')}
                  </span>
                </>
              )}
            </div>
          )}

          {/* View full scores button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleViewFullScores}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('playersPage.adminStudentsList.detailModal.viewFullScores')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: string;
}

const MetricItem = ({ icon, label, value, color = 'text-foreground' }: MetricItemProps) => (
  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
    {icon}
    <div className="flex-1 min-w-0">
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground truncate">{label}</div>
    </div>
  </div>
);