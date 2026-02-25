import { useState, useMemo } from "react";
import { GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  useClubTrainersWithRates,
  useCreatePrivateLessonBooking,
  TrainerWithRates,
  CompanionInfo,
} from "@/hooks/usePlayerPrivateLessons";
import { ComputedSlot } from "@/hooks/usePrivateLessons";
import { DurationRates } from "@/hooks/useTrainers";
import BookingStepTrainer from "@/components/private-lessons/player/BookingStepTrainer";
import BookingStepPlayers from "@/components/private-lessons/player/BookingStepPlayers";
import BookingStepPayment from "@/components/private-lessons/player/BookingStepPayment";
import BookingConfirmation from "@/components/private-lessons/player/BookingConfirmation";

type Step = 1 | 2 | 3 | 4;

interface PlayerPrivateLessonBookingPageProps {
  embedded?: boolean;
  onBackToMyClasses?: () => void;
}

function getPriceKey(numPlayers: number): keyof DurationRates {
  switch (numPlayers) {
    case 1:
      return "price_1_player";
    case 2:
      return "price_2_players";
    case 3:
      return "price_3_players";
    case 4:
      return "price_4_players";
    default:
      return "price_1_player";
  }
}

/**
 * Fallback: get club_id from student_enrollments when profile.club_id is not set.
 */
const usePlayerClubId = (profileClubId: string | undefined, email: string | undefined) => {
  return useQuery({
    queryKey: ["player-club-id-fallback", email],
    queryFn: async () => {
      if (!email) return null;
      const { data, error } = await supabase
        .from("student_enrollments")
        .select("club_id")
        .eq("email", email)
        .eq("status", "activo")
        .limit(1)
        .single();
      if (error) return null;
      return data?.club_id || null;
    },
    enabled: !profileClubId && !!email,
  });
};

const PlayerPrivateLessonBookingPage = ({ embedded = false, onBackToMyClasses }: PlayerPrivateLessonBookingPageProps) => {
  const { t } = useTranslation();
  const { profile, effectiveClubId } = useAuth();

  // Fallback: if profile.club_id is missing, look it up from student_enrollments
  const directClubId = effectiveClubId || profile?.club_id;
  const { data: fallbackClubId } = usePlayerClubId(directClubId, profile?.email);
  const clubId = directClubId || fallbackClubId || "";

  const { data: trainers = [], isLoading } = useClubTrainersWithRates(clubId);
  const createBooking = useCreatePrivateLessonBooking();

  // Step machine
  const [step, setStep] = useState<Step>(1);

  // Step 1 data
  const [selectedTrainerId, setSelectedTrainerId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<ComputedSlot | null>(null);

  // Step 2 data
  const [numPlayers, setNumPlayers] = useState<1 | 2 | 3 | 4>(1);
  const [companions, setCompanions] = useState<(CompanionInfo | null)[]>([
    null,
    null,
    null,
  ]);

  // Step 3: payment is always "academia" (no bono for private lessons)

  const selectedTrainer = useMemo(
    () => trainers.find((tr) => tr.profile_id === selectedTrainerId),
    [trainers, selectedTrainerId]
  );

  // Compute price
  const pricePerPerson = useMemo(() => {
    if (!selectedTrainer || !selectedSlot) return 0;
    const durationKey = String(selectedSlot.durationMinutes);
    const durationRates =
      selectedTrainer.private_lesson_rates[durationKey];
    if (!durationRates) return 0;
    return durationRates[getPriceKey(numPlayers)] ?? 0;
  }, [selectedTrainer, selectedSlot, numPlayers]);

  // Handlers
  const handleSelectTrainer = (trainer: TrainerWithRates) => {
    setSelectedTrainerId(trainer.profile_id);
    // Reset downstream
    setSelectedSlot(null);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSelectSlot = (slot: ComputedSlot) => {
    setSelectedSlot(slot);
  };

  const handleSelectNumPlayers = (n: 1 | 2 | 3 | 4) => {
    setNumPlayers(n);
    // Reset companions if reducing count
    if (n < numPlayers) {
      setCompanions([null, null, null]);
    }
  };

  const handleUpdateCompanion = (
    index: number,
    companion: CompanionInfo | null
  ) => {
    setCompanions((prev) => {
      const next = [...prev];
      next[index] = companion;
      return next;
    });
  };

  const handleSubmitBooking = async () => {
    if (!selectedSlot || !selectedTrainer) return;

    const validCompanions = companions
      .slice(0, numPlayers - 1)
      .filter((c): c is CompanionInfo => c !== null);

    await createBooking.mutateAsync({
      trainer_profile_id: selectedTrainer.profile_id,
      club_id: clubId,
      lesson_date: selectedSlot.date,
      start_time: selectedSlot.startTime + ":00",
      end_time: selectedSlot.endTime + ":00",
      duration_minutes: selectedSlot.durationMinutes,
      num_companions: numPlayers - 1,
      price_per_person: pricePerPerson,
      total_price: pricePerPerson * numPlayers,
      companion_details: validCompanions,
    });

    setStep(4);
  };

  if (isLoading) {
    return (
      <div className={embedded ? "space-y-4" : "space-y-4 p-4"}>
        {!embedded && (
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">
              {t("privateLessonsBooking.title", "Clases Particulares")}
            </h1>
          </div>
        )}
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (trainers.length === 0) {
    return (
      <div className={embedded ? "space-y-4" : "space-y-4 p-4"}>
        {!embedded && (
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">
              {t("privateLessonsBooking.title", "Clases Particulares")}
            </h1>
          </div>
        )}
        <p className="text-sm text-gray-500 text-center py-12">
          {t(
            "privateLessonsBooking.noTrainers",
            "No hay profesores disponibles para clases particulares en tu club."
          )}
        </p>
      </div>
    );
  }

  return (
    <div className={embedded ? "max-w-md mx-auto pb-8" : "max-w-md mx-auto p-4 pb-8"}>
      {/* Header */}
      {!embedded && (
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">
            {t("privateLessonsBooking.title", "Clases Particulares")}
          </h1>
        </div>
      )}

      {/* Progress bar */}
      {step < 4 && (
        <div className="w-full h-1 bg-gray-200 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      )}

      {/* Steps */}
      {step === 1 && (
        <BookingStepTrainer
          trainers={trainers}
          selectedTrainerId={selectedTrainerId}
          onSelectTrainer={handleSelectTrainer}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          selectedSlot={selectedSlot}
          onSelectSlot={handleSelectSlot}
          onContinue={() => setStep(2)}
          clubId={clubId}
        />
      )}

      {step === 2 && selectedTrainer && selectedSlot && (
        <BookingStepPlayers
          rates={selectedTrainer.private_lesson_rates}
          durationMinutes={selectedSlot.durationMinutes}
          numPlayers={numPlayers}
          onSelectNumPlayers={handleSelectNumPlayers}
          companions={companions.filter(
            (c): c is CompanionInfo => c !== null
          )}
          onUpdateCompanion={handleUpdateCompanion}
          clubId={clubId}
          onContinue={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && selectedTrainer && selectedSlot && (
        <BookingStepPayment
          trainerName={selectedTrainer.full_name}
          clubName={selectedTrainer.club_name}
          date={selectedSlot.date}
          startTime={selectedSlot.startTime}
          endTime={selectedSlot.endTime}
          durationMinutes={selectedSlot.durationMinutes}
          numPlayers={numPlayers}
          pricePerPerson={pricePerPerson}
          onSubmit={handleSubmitBooking}
          isSubmitting={createBooking.isPending}
          onBack={() => setStep(2)}
        />
      )}

      {step === 4 && selectedTrainer && selectedSlot && (
        <BookingConfirmation
          trainerName={selectedTrainer.full_name}
          clubName={selectedTrainer.club_name}
          date={selectedSlot.date}
          startTime={selectedSlot.startTime}
          endTime={selectedSlot.endTime}
          durationMinutes={selectedSlot.durationMinutes}
          numPlayers={numPlayers}
          companions={companions
            .slice(0, numPlayers - 1)
            .filter((c): c is CompanionInfo => c !== null)}
          pricePerPerson={pricePerPerson}
          bookerName={profile?.full_name || ""}
          onBackToHome={() => {
            // Reset the wizard and switch to "Mis clases" tab
            setStep(1);
            setSelectedTrainerId("");
            setSelectedDate("");
            setSelectedSlot(null);
            setNumPlayers(1);
            setCompanions([null, null, null]);
            if (onBackToMyClasses) {
              onBackToMyClasses();
            }
          }}
        />
      )}
    </div>
  );
};

export default PlayerPrivateLessonBookingPage;
