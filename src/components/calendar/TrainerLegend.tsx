import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { getTrainerColor, getClassColor } from "@/utils/trainerColors";
import { useAuth } from "@/contexts/AuthContext";
import type { ScheduledClassWithTemplate } from "@/hooks/useScheduledClasses";

interface TrainerLegendProps {
  classes: ScheduledClassWithTemplate[];
}

export function TrainerLegend({ classes }: TrainerLegendProps) {
  const { t } = useTranslation();
  const { isAdmin, profile } = useAuth();
  
  // Get unique trainers from classes
  const uniqueTrainers = classes.reduce((acc, cls) => {
    if (cls.trainer && cls.trainer_profile_id) {
      acc.set(cls.trainer_profile_id, cls.trainer.full_name);
    }
    return acc;
  }, new Map<string, string>());

  // For admins, also check if they have created any classes
  const hasAdminClasses = isAdmin && classes.some(cls => cls.created_by === profile?.id);

  // Don't show legend if no trainers or only one trainer and no admin classes
  if (uniqueTrainers.size <= 1 && !hasAdminClasses) {
    return null;
  }

  return (
    <Card className="h-fit">{/* Remove mb-4 to align with filters */}
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Leyenda de colores</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Admin's own classes */}
          {hasAdminClasses && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Mis clases</div>
              <Badge
                className="bg-admin-class text-admin-class-foreground border-admin-class-border"
                variant="outline"
              >
                Clases creadas por mí
              </Badge>
            </div>
          )}
          
          {/* Trainer classes */}
          {uniqueTrainers.size > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Clases de profesores</div>
              <div className="flex flex-wrap gap-2">
                {Array.from(uniqueTrainers.entries()).map(([trainerId, trainerName]) => (
                  <Badge
                    key={trainerId}
                    className={getTrainerColor(trainerId)}
                    variant="outline"
                  >
                    {trainerName}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}