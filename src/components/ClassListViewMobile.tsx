import { format, parseISO } from "date-fns";
import { Clock, Users, MoreVertical, Eye, Trash2, Edit } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ScheduledClassWithTemplate } from "@/hooks/useScheduledClasses";

interface ClassListViewMobileProps {
  classes: ScheduledClassWithTemplate[];
  isAdmin: boolean;
  isTrainer: boolean;
  onViewDetails: (cls: ScheduledClassWithTemplate) => void;
  onEdit?: (cls: ScheduledClassWithTemplate) => void;
  onManageStudents?: (cls: ScheduledClassWithTemplate) => void;
  getLevelDisplay: (cls: ScheduledClassWithTemplate) => string;
  getLevelColor: (cls: ScheduledClassWithTemplate) => string;
}

export function ClassListViewMobile({
  classes,
  isAdmin,
  isTrainer,
  onViewDetails,
  onEdit,
  onManageStudents,
  getLevelDisplay,
  getLevelColor
}: ClassListViewMobileProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {classes.map(cls => {
        const enrolledCount = cls.participants?.length || 0;
        return (
          <Card key={cls.id} className="p-3 sm:p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base truncate">{cls.name}</h3>
                  {cls.club && <p className="text-xs text-muted-foreground truncate">{cls.club.name}</p>}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border shadow-md z-50">
                    {(isAdmin || isTrainer) ? (
                      <>
                        <DropdownMenuItem onClick={() => onEdit?.(cls)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onManageStudents?.(cls)}>
                          <Users className="h-4 w-4 mr-2" />
                          Gestionar alumnos
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('classes.cancelClass')}
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem onClick={() => onViewDetails(cls)}>
                        <Eye className="h-4 w-4 mr-2" />
                        {t('classes.viewDetails')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={`${getLevelColor(cls)} text-xs`}>
                  {getLevelDisplay(cls)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{cls.start_time.slice(0, 5)} ({cls.duration_minutes}min)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{enrolledCount} alumnos</span>
                </div>
                <div className="col-span-2 text-muted-foreground truncate">
                  {cls.days_of_week.join(', ')}
                </div>
                <div className="col-span-2 text-muted-foreground">
                  {format(parseISO(cls.start_date), "dd/MM/yy")} - {format(parseISO(cls.end_date), "dd/MM/yy")}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
