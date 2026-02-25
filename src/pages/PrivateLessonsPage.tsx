import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useMyTrainerProfile } from "@/hooks/useTrainers";
import {
  useTrainerAvailability,
  useTrainerExceptions,
  useTrainerBookings,
  useTrainerProgrammedClassesForRange,
} from "@/hooks/usePrivateLessons";
import { startOfWeek, endOfWeek, addWeeks, format } from "date-fns";
import WeeklyLessonGrid from "@/components/private-lessons/WeeklyLessonGrid";
import AvailabilityForm from "@/components/private-lessons/AvailabilityForm";
import ExceptionsList from "@/components/private-lessons/ExceptionsList";
import PendingBookingsList from "@/components/private-lessons/PendingBookingsList";
import RatesDisplayCard from "@/components/private-lessons/RatesDisplayCard";

const PrivateLessonsPage = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { data: trainerProfile, isLoading: profileLoading } = useMyTrainerProfile();

  const trainerProfileId = profile?.id || "";
  const trainerClubId = trainerProfile?.trainer_clubs?.[0]?.club_id || "";

  // Broad date range for bookings (4 weeks forward + 1 back)
  const bookingRange = useMemo(() => {
    const start = startOfWeek(addWeeks(new Date(), -1), { weekStartsOn: 1 });
    const end = endOfWeek(addWeeks(new Date(), 4), { weekStartsOn: 1 });
    return {
      start: format(start, "yyyy-MM-dd"),
      end: format(end, "yyyy-MM-dd"),
    };
  }, []);

  const { data: availability = [], isLoading: availLoading } = useTrainerAvailability(
    trainerProfileId,
    trainerClubId
  );
  const { data: exceptions = [], isLoading: exLoading } = useTrainerExceptions(
    trainerProfileId,
    trainerClubId
  );
  const { data: bookings = [], isLoading: bookLoading } = useTrainerBookings(
    trainerProfileId,
    bookingRange.start,
    bookingRange.end
  );
  const { data: scheduledClasses = [], isLoading: scLoading } = useTrainerProgrammedClassesForRange(
    trainerProfileId,
    bookingRange.start,
    bookingRange.end
  );

  const rates = trainerProfile?.private_lesson_rates || {};

  const isLoading = profileLoading || availLoading || exLoading || bookLoading || scLoading;

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-playtomic-orange" />
          <h1 className="text-xl sm:text-2xl font-bold">
            {t("privateLessons.title", "Clases Particulares")}
          </h1>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange" />
        </div>
      </div>
    );
  }

  if (!trainerClubId) {
    return (
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-playtomic-orange" />
          <h1 className="text-xl sm:text-2xl font-bold">
            {t("privateLessons.title", "Clases Particulares")}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {t("privateLessons.noClub", "No tienes un club asignado. Contacta con tu administrador.")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <GraduationCap className="h-6 w-6 text-playtomic-orange" />
        <h1 className="text-xl sm:text-2xl font-bold">
          {t("privateLessons.title", "Clases Particulares")}
        </h1>
      </div>

      {/* Rates card (always visible, read-only) */}
      <RatesDisplayCard rates={rates} />

      {/* Tabs */}
      <Tabs defaultValue="week" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="week">
            {t("privateLessons.tabs.week", "Semana")}
          </TabsTrigger>
          <TabsTrigger value="availability">
            {t("privateLessons.tabs.availability", "Disponibilidad")}
          </TabsTrigger>
          <TabsTrigger value="exceptions">
            {t("privateLessons.tabs.exceptions", "Excepciones")}
          </TabsTrigger>
          <TabsTrigger value="requests">
            {t("privateLessons.tabs.requests", "Solicitudes")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="mt-4">
          <WeeklyLessonGrid
            availability={availability}
            exceptions={exceptions}
            bookings={bookings}
            scheduledClasses={scheduledClasses}
          />
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
          <AvailabilityForm
            availability={availability}
            trainerProfileId={trainerProfileId}
            clubId={trainerClubId}
          />
        </TabsContent>

        <TabsContent value="exceptions" className="mt-4">
          <ExceptionsList
            exceptions={exceptions}
            trainerProfileId={trainerProfileId}
            clubId={trainerClubId}
          />
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <PendingBookingsList bookings={bookings} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PrivateLessonsPage;