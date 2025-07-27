import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTrainerColor } from "@/utils/trainerColors";
import type { ScheduledClassWithTemplate } from "@/hooks/useScheduledClasses";

interface TrainerLegendProps {
  classes: ScheduledClassWithTemplate[];
}

export function TrainerLegend({ classes }: TrainerLegendProps) {
  // Get unique trainers from classes
  const uniqueTrainers = classes.reduce((acc, cls) => {
    if (cls.trainer && cls.trainer_profile_id) {
      acc.set(cls.trainer_profile_id, cls.trainer.full_name);
    }
    return acc;
  }, new Map<string, string>());

  // Don't show legend if no trainers or only one trainer
  if (uniqueTrainers.size <= 1) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Profesores</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
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
      </CardContent>
    </Card>
  );
}