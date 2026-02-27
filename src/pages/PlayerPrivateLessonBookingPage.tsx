import { useState, useMemo, useEffect } from "react";
import { GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  useClubTrainersWithRates,
  useCreatePrivateLessonBooking,
  TrainerWithRates,
  CompanionInfo,
  CreateBookingInput,
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
  const { toast } = useToast();
  const { profile, effectiveClubId } = useAuth();
  const queryClient = useQueryClient();

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

  // Step 3: payment method
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"academia" | "stripe">("academia");
  const [isRedirectingToStripe, setIsRedirectingToStripe] = useState(false);

  // Stripe return handling
  const [stripeReturnBookingId, setStripeReturnBookingId] = useState<string | null>(null);

  // Query club Stripe config for online payment availability
  const { data: clubStripeConfig } = useQuery({
    queryKey: ["club-stripe-config", clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clubs")
        .select("enable_private_lesson_online_payment, stripe_onboarding_completed, stripe_account_id")
        .eq("id", clubId)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!clubId,
  });

  const onlinePaymentAvailable = !!(
    (clubStripeConfig as any)?.enable_private_lesson_online_payment &&
    clubStripeConfig?.stripe_onboarding_completed &&
    clubStripeConfig?.stripe_account_id
  );

  // Query booking details when returning from Stripe checkout
  const { data: stripeReturnBooking } = useQuery({
    queryKey: ["stripe-return-booking", stripeReturnBookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("private_lesson_bookings")
        .select("id, trainer_profile_id, club_id, lesson_date, start_time, end_time, duration_minutes, num_companions, price_per_person, companion_details, booker_name, payment_method")
        .eq("id", stripeReturnBookingId!)
        .single();
      if (error) throw error;

      const [{ data: trainerProfile }, { data: clubData }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", data.trainer_profile_id).single(),
        supabase.from("clubs").select("name").eq("id", data.club_id).single(),
      ]);

      return {
        ...data,
        trainer_name: trainerProfile?.full_name || "",
        club_name: clubData?.name || "",
      };
    },
    enabled: !!stripeReturnBookingId,
  });

  // Handle browser back button from Stripe (bfcache restore)
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setIsRedirectingToStripe(false);
        // Pay-first flow: no DB record exists, just clear stored data
        const pendingData = sessionStorage.getItem("pendingStripeBookingData");
        if (pendingData) {
          sessionStorage.removeItem("pendingStripeBookingData");
          toast({
            title: t("privateLessonsBooking.paymentCancelled", "Pago cancelado"),
            description: t("privateLessonsBooking.paymentCancelledDesc", "Puedes volver a intentarlo o elegir otro método de pago."),
            variant: "destructive",
          });
        }
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // Detect Stripe return via URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plPayment = params.get("pl_payment");
    const sessionId = params.get("session_id");
    const bookingId = params.get("booking_id");

    if (plPayment === "success" && (sessionId || bookingId)) {
      window.history.replaceState({}, "", window.location.pathname);

      if (sessionId && !bookingId) {
        // PAY-FIRST FLOW: Payment confirmed — now create the booking in DB
        const storedData = sessionStorage.getItem("pendingStripeBookingData");
        sessionStorage.removeItem("pendingStripeBookingData");

        if (!storedData) {
          toast({
            title: "Error",
            description: t("privateLessonsBooking.missingBookingData", "No se encontraron los datos de la reserva. Contacta con soporte."),
            variant: "destructive",
          });
          return;
        }

        const handlePayFirstReturn = async () => {
          try {
            const bookingPayload = JSON.parse(storedData) as CreateBookingInput;
            // Create the booking now that payment is confirmed
            const newBooking = await createBooking.mutateAsync(bookingPayload);

            if (newBooking?.id) {
              // Link Stripe payment to the newly created booking
              try {
                await supabase.functions.invoke("manage-private-lesson-payment", {
                  body: { bookingId: newBooking.id, action: "verify", checkoutSessionId: sessionId },
                });
              } catch (err) {
                console.error("Payment verify error:", err);
              }

              setStripeReturnBookingId(newBooking.id);
              queryClient.invalidateQueries({ queryKey: ["my-private-lesson-bookings"] });
              queryClient.invalidateQueries({ queryKey: ["private-lesson-bookings"] });
              queryClient.invalidateQueries({ queryKey: ["private-lesson-pending-count"] });

              // Send WhatsApp notification to trainer (fire-and-forget)
              supabase.functions.invoke("send-private-lesson-whatsapp", {
                body: { type: "new_booking", bookingId: newBooking.id },
              }).catch((err) => console.error("Trainer WhatsApp notification error:", err));
            }
          } catch (err) {
            console.error("Error creating booking after Stripe payment:", err);
            toast({
              title: "Error",
              description: t("privateLessonsBooking.postPaymentError", "Error al confirmar la reserva. Contacta con soporte indicando tu pago."),
              variant: "destructive",
            });
          }
        };
        handlePayFirstReturn();
      } else if (bookingId) {
        // LEGACY FLOW: booking already exists in DB
        const handleLegacyReturn = async () => {
          try {
            await supabase.functions.invoke("manage-private-lesson-payment", {
              body: { bookingId, action: "verify" },
            });
          } catch (err) {
            console.error("Payment verify error:", err);
          }
          setStripeReturnBookingId(bookingId);
          queryClient.invalidateQueries({ queryKey: ["my-private-lesson-bookings"] });
          queryClient.invalidateQueries({ queryKey: ["private-lesson-bookings"] });
          queryClient.invalidateQueries({ queryKey: ["private-lesson-pending-count"] });
          // Send WhatsApp notification to trainer (fire-and-forget)
          supabase.functions.invoke("send-private-lesson-whatsapp", {
            body: { type: "new_booking", bookingId },
          }).catch((err) => console.error("Trainer WhatsApp notification error:", err));
        };
        handleLegacyReturn();
      }
    } else if (plPayment === "cancel") {
      // Pay-first flow: no DB record exists, just clear stored data
      sessionStorage.removeItem("pendingStripeBookingData");
      toast({
        title: t("privateLessonsBooking.paymentCancelled", "Pago cancelado"),
        description: t("privateLessonsBooking.paymentCancelledDesc", "Puedes volver a intentarlo o elegir otro método de pago."),
        variant: "destructive",
      });
      window.history.replaceState({}, "", window.location.pathname);
    } else {
      // No Stripe return params — clear any stale pending data (e.g. user closed Stripe tab)
      sessionStorage.removeItem("pendingStripeBookingData");
    }
  }, []);

  // When Stripe return booking loads, jump to step 4
  useEffect(() => {
    if (stripeReturnBooking) {
      setStep(4);
    }
  }, [stripeReturnBooking]);

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

    const bookingPayload: CreateBookingInput = {
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
      payment_method: selectedPaymentMethod,
    };

    if (selectedPaymentMethod === "stripe") {
      // PAY-FIRST: Do NOT create DB record yet. Store data and redirect to Stripe.
      // The booking will only be created AFTER the payment is confirmed.
      setIsRedirectingToStripe(true);
      try {
        sessionStorage.setItem("pendingStripeBookingData", JSON.stringify(bookingPayload));

        const { data, error } = await supabase.functions.invoke("create-private-lesson-checkout", {
          body: {
            bookingData: {
              club_id: clubId,
              total_price: pricePerPerson * numPlayers,
              num_companions: numPlayers - 1,
              lesson_date: selectedSlot.date,
              start_time: selectedSlot.startTime + ":00",
              end_time: selectedSlot.endTime + ":00",
            },
          },
        });

        if (error) throw error;
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
        throw new Error("No checkout URL received");
      } catch (err: any) {
        setIsRedirectingToStripe(false);
        sessionStorage.removeItem("pendingStripeBookingData");
        toast({
          title: "Error",
          description: err.message || t("privateLessonsBooking.checkoutError", "Error al crear el pago. Inténtalo de nuevo."),
          variant: "destructive",
        });
        return;
      }
    }

    // Non-Stripe: create booking in DB immediately
    await createBooking.mutateAsync(bookingPayload);
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
          isSubmitting={createBooking.isPending || isRedirectingToStripe}
          onBack={() => setStep(2)}
          onlinePaymentAvailable={onlinePaymentAvailable}
          selectedPaymentMethod={selectedPaymentMethod}
          onPaymentMethodChange={setSelectedPaymentMethod}
        />
      )}

      {step === 4 && (stripeReturnBooking ? (
        <BookingConfirmation
          trainerName={stripeReturnBooking.trainer_name}
          clubName={stripeReturnBooking.club_name}
          date={stripeReturnBooking.lesson_date}
          startTime={stripeReturnBooking.start_time?.slice(0, 5) || ""}
          endTime={stripeReturnBooking.end_time?.slice(0, 5) || ""}
          durationMinutes={stripeReturnBooking.duration_minutes}
          numPlayers={(stripeReturnBooking.num_companions || 0) + 1}
          companions={(stripeReturnBooking.companion_details || []) as CompanionInfo[]}
          pricePerPerson={stripeReturnBooking.price_per_person || 0}
          bookerName={stripeReturnBooking.booker_name || profile?.full_name || ""}
          paymentMethod={(stripeReturnBooking.payment_method as "academia" | "stripe") || "academia"}
          onBackToHome={() => {
            setStep(1);
            setStripeReturnBookingId(null);
            if (onBackToMyClasses) {
              onBackToMyClasses();
            }
          }}
        />
      ) : selectedTrainer && selectedSlot ? (
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
          paymentMethod={selectedPaymentMethod}
          onBackToHome={() => {
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
      ) : null)}
    </div>
  );
};

export default PlayerPrivateLessonBookingPage;
