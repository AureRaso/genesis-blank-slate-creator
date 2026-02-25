import { useTranslation } from "react-i18next";
import AvailabilityDayCard from "./AvailabilityDayCard";
import { PrivateLessonAvailability, useUpsertAvailability } from "@/hooks/usePrivateLessons";

interface AvailabilityFormProps {
  availability: PrivateLessonAvailability[];
  trainerProfileId: string;
  clubId: string;
}

const AvailabilityForm = ({ availability, trainerProfileId, clubId }: AvailabilityFormProps) => {
  const { t } = useTranslation();
  const upsertMutation = useUpsertAvailability();

  // Days: 1=Monday to 6=Saturday, 0=Sunday (shown last)
  const orderedDays = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("privateLessons.availability.description", "Configura las franjas horarias de mañana y tarde para cada día de la semana.")}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {orderedDays.map((dayOfWeek) => {
          const existing = availability.find((a) => a.day_of_week === dayOfWeek);
          return (
            <AvailabilityDayCard
              key={dayOfWeek}
              dayOfWeek={dayOfWeek}
              existing={existing}
              onSave={(data) => upsertMutation.mutate(data)}
              isSaving={upsertMutation.isPending}
              trainerProfileId={trainerProfileId}
              clubId={clubId}
            />
          );
        })}
      </div>
    </div>
  );
};

export default AvailabilityForm;