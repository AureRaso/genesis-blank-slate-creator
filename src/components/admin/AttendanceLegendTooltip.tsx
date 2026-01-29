import { HelpCircle, Check, X, Clock, Ban } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

export const AttendanceLegendTooltip = () => {
  const { t } = useTranslation();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs p-3">
          <div className="space-y-2 text-xs">
            <p className="font-medium text-sm mb-2">
              {t('playersPage.adminStudentsList.attendance.legendTitle')}
            </p>
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
              <span>{t('playersPage.adminStudentsList.attendance.attended')}</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
              <span>{t('playersPage.adminStudentsList.attendance.noShows')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
              <span>{t('playersPage.adminStudentsList.attendance.lateNotice')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Ban className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span>{t('playersPage.adminStudentsList.attendance.cancelledByAcademy')}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};