import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Calendar, User, Users, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface BookingStepPaymentProps {
  trainerName: string;
  clubName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  numPlayers: number;
  pricePerPerson: number;
  onSubmit: () => void;
  isSubmitting: boolean;
  onBack: () => void;
}

function formatDuration(m: number): string {
  if (m === 60) return "1 hora";
  if (m === 90) return "1.5 horas";
  if (m === 120) return "2 horas";
  return `${m} minutos`;
}

const BookingStepPayment = ({
  trainerName,
  clubName,
  date,
  startTime,
  endTime,
  durationMinutes,
  numPlayers,
  pricePerPerson,
  onSubmit,
  isSubmitting,
  onBack,
}: BookingStepPaymentProps) => {
  const { t } = useTranslation();
  const { getDateFnsLocale } = useLanguage();
  const dateFnsLocale = getDateFnsLocale();

  const formattedDate = useMemo(() => {
    try {
      const d = new Date(date + "T12:00:00");
      return format(d, "EEEE, d MMMM", { locale: dateFnsLocale });
    } catch {
      return date;
    }
  }, [date, dateFnsLocale]);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("privateLessonsBooking.back", "Atrás")}
      </button>

      {/* Big price */}
      <div className="text-center">
        <p className="text-4xl font-bold text-primary">{pricePerPerson}€</p>
        <p className="text-sm text-gray-500 mt-1">
          {t("privateLessonsBooking.pricePerPerson", "Precio por persona")} ·{" "}
          {numPlayers}{" "}
          {numPlayers === 1
            ? t("privateLessonsBooking.player", "jugador")
            : t("privateLessonsBooking.playersLabel", "jugadores")}
        </p>
      </div>

      {/* Payment info */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {t("privateLessonsBooking.paymentMethod", "Método de pago")}
        </h3>
        <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl bg-gray-50">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {t("privateLessonsBooking.payAtClub", "Pagar en academia")}
            </p>
            <p className="text-xs text-gray-500">
              {t(
                "privateLessonsBooking.payAtClubDesc",
                "Efectivo o TPV al llegar"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
        <h4 className="font-semibold text-gray-700 mb-2">
          {t("privateLessonsBooking.summary", "Resumen")}
        </h4>
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            {t("privateLessonsBooking.privateLesson", "Clase particular")} ·{" "}
            {formatDuration(durationMinutes)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <User className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            {t("privateLessonsBooking.trainerLabel", "Profesor")}:{" "}
            {trainerName}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="capitalize">
            {formattedDate} · {startTime} - {endTime}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Users className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            {numPlayers}{" "}
            {numPlayers === 1
              ? t("privateLessonsBooking.player", "jugador")
              : t("privateLessonsBooking.playersLabel", "jugadores")}
          </span>
        </div>
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">
              {t("privateLessonsBooking.yourPayment", "Tu pago")}:
            </span>
            <span className="text-lg font-bold text-green-600">
              {pricePerPerson}€
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <Button
        className="w-full bg-primary hover:bg-orange-600 text-white rounded-xl py-6 text-base font-semibold"
        disabled={isSubmitting}
        onClick={onSubmit}
      >
        {isSubmitting
          ? t("privateLessonsBooking.submitting", "Solicitando...")
          : t("privateLessonsBooking.requestBooking", "Solicitar reserva")} →
      </Button>
    </div>
  );
};

export default BookingStepPayment;
