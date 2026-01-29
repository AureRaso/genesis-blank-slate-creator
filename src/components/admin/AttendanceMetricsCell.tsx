import { Check, X, Clock, Ban } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { type StudentScoreWithDetails } from "@/hooks/useStudentScoring";
import { type BulkBehaviorMetric } from "@/hooks/useBulkBehaviorMetrics";

interface AttendanceMetricsCellProps {
  score?: StudentScoreWithDetails | null;
  behavior?: BulkBehaviorMetric | null;
}

export const AttendanceMetricsCell = ({ score, behavior }: AttendanceMetricsCellProps) => {
  const { t } = useTranslation();

  if (!score && !behavior) {
    return (
      <span className="text-xs text-muted-foreground">
        {t('playersPage.adminStudentsList.attendance.noData')}
      </span>
    );
  }

  const attended = score?.actually_attended_when_confirmed ?? 0;
  const noShows = score?.no_show_when_confirmed ?? 0;
  const lateNotices = behavior?.late_notice_absences ?? 0;
  const cancelledByAcademy = score?.classes_cancelled_by_academy ?? behavior?.club_cancelled_classes ?? 0;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 text-sm">
        {/* Attended */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-0.5 text-green-600 font-medium cursor-default">
              <Check className="h-3.5 w-3.5" />
              <span>{attended}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {t('playersPage.adminStudentsList.attendance.attended')}
          </TooltipContent>
        </Tooltip>

        {/* No-shows */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`flex items-center gap-0.5 font-medium cursor-default ${noShows > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              <X className="h-3.5 w-3.5" />
              <span>{noShows}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {t('playersPage.adminStudentsList.attendance.noShows')}
          </TooltipContent>
        </Tooltip>

        {/* Late notices */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`flex items-center gap-0.5 font-medium cursor-default ${lateNotices > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
              <Clock className="h-3.5 w-3.5" />
              <span>{lateNotices}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {t('playersPage.adminStudentsList.attendance.lateNotice')}
          </TooltipContent>
        </Tooltip>

        {/* Cancelled by academy - only show if > 0 */}
        {cancelledByAcademy > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-0.5 text-gray-400 font-medium cursor-default">
                <Ban className="h-3.5 w-3.5" />
                <span>{cancelledByAcademy}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {t('playersPage.adminStudentsList.attendance.cancelledByAcademy')}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};