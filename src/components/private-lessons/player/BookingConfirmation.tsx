import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  User,
  Users,
  Clock,
  CalendarPlus,
  Share2,
  CreditCard,
  Info,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { CompanionInfo } from "@/hooks/usePlayerPrivateLessons";

interface BookingConfirmationProps {
  trainerName: string;
  clubName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  numPlayers: number;
  companions: CompanionInfo[];
  pricePerPerson: number;
  bookerName: string;
  paymentMethod?: "academia" | "stripe";
  onBackToHome?: () => void;
}

function formatDuration(m: number): string {
  if (m === 60) return "1 hora";
  if (m === 90) return "1.5 horas";
  if (m === 120) return "2 horas";
  return `${m} min`;
}

function generateICS(props: {
  date: string;
  startTime: string;
  endTime: string;
  trainerName: string;
  clubName: string;
  durationMinutes: number;
}): string {
  const { date, startTime, endTime, trainerName, clubName } = props;
  const dtStart = `${date.replace(/-/g, "")}T${startTime.replace(":", "")}00`;
  const dtEnd = `${date.replace(/-/g, "")}T${endTime.replace(":", "")}00`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PadeLock//Private Lesson//ES",
    "BEGIN:VEVENT",
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:Clase particular con ${trainerName}`,
    `LOCATION:${clubName}`,
    `DESCRIPTION:Clase particular de padel con ${trainerName} en ${clubName}`,
    "STATUS:TENTATIVE",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

const BookingConfirmation = ({
  trainerName,
  clubName,
  date,
  startTime,
  endTime,
  durationMinutes,
  numPlayers,
  companions,
  pricePerPerson,
  bookerName,
  paymentMethod = "academia",
  onBackToHome,
}: BookingConfirmationProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const handleAddToCalendar = () => {
    const icsContent = generateICS({
      date,
      startTime,
      endTime,
      trainerName,
      clubName,
      durationMinutes,
    });
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clase-particular-${date}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShareWhatsApp = () => {
    const playerNames = [bookerName, ...companions.map((c) => c.name)].join(", ");
    const text = [
      `Clase particular de padel`,
      `${formattedDate} · ${startTime} - ${endTime}`,
      `Profesor: ${trainerName}`,
      `Club: ${clubName}`,
      `Jugadores: ${playerNames}`,
      `Precio: ${pricePerPerson}€/persona`,
      ``,
      `Pendiente de confirmacion del entrenador`,
    ].join("\n");

    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  const paymentLabel = paymentMethod === "stripe"
    ? `${pricePerPerson}€ · ${t("privateLessonsBooking.cardPaymentPreauthorized", "Pago con tarjeta (pre-autorizado)")}`
    : `${pricePerPerson}€ · ${t("privateLessonsBooking.pendingPayAtClub", "Se paga en academia al confirmar")}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-3">
          <Clock className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold">
          {t("privateLessonsBooking.pendingTitle", "Reserva pendiente")}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {t(
            "privateLessonsBooking.pendingSubtitle",
            "El entrenador debe confirmar tu clase"
          )}
        </p>
      </div>

      {/* Details */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium capitalize">{formattedDate}</p>
            <p className="text-xs text-gray-500">
              {startTime} - {endTime} · {formatDuration(durationMinutes)}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm">{clubName}</p>
        </div>

        <div className="flex items-start gap-3">
          <User className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm">
            {trainerName} ·{" "}
            <span className="text-gray-500">
              {t("privateLessonsBooking.trainerLabel", "Profesor")}
            </span>
          </p>
        </div>

        <div className="flex items-start gap-3">
          <Users className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm">
              {numPlayers}{" "}
              {numPlayers === 1
                ? t("privateLessonsBooking.player", "jugador")
                : t("privateLessonsBooking.playersLabel", "jugadores")}
            </p>
            <p className="text-xs text-gray-500">
              {bookerName}
              {companions.length > 0 && ` · ${companions.map((c) => c.name).join(" · ")}`}
            </p>
          </div>
        </div>

        <div className="border-t pt-2">
          <p className="text-sm text-gray-600">{paymentLabel}</p>
        </div>
      </div>

      {/* Stripe hold info banner */}
      {paymentMethod === "stripe" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            {t(
              "privateLessonsBooking.holdInfo",
              "Se ha realizado una pre-autorización en tu tarjeta. El cargo solo se completará si el entrenador confirma la clase. Si rechaza o no responde, el importe se liberará automáticamente."
            )}
          </p>
        </div>
      )}

      {/* Pending banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
        <p className="text-sm text-amber-700 font-medium">
          {t(
            "privateLessonsBooking.pendingBanner",
            "Pendiente de confirmacion · Te notificaremos cuando el entrenador acepte"
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full rounded-xl py-5 text-sm font-medium"
          onClick={handleAddToCalendar}
        >
          <CalendarPlus className="h-4 w-4 mr-2" />
          {t("privateLessonsBooking.addToCalendar", "Añadir al calendario")}
        </Button>

        <Button
          variant="outline"
          className="w-full rounded-xl py-5 text-sm font-medium text-green-700 border-green-200 hover:bg-green-50"
          onClick={handleShareWhatsApp}
        >
          <Share2 className="h-4 w-4 mr-2" />
          {t("privateLessonsBooking.shareWhatsApp", "Compartir por WhatsApp")}
        </Button>

        <Button
          variant="ghost"
          className="w-full rounded-xl py-5 text-sm text-gray-500"
          onClick={() => {
            if (onBackToHome) {
              onBackToHome();
            } else {
              navigate("/dashboard");
            }
          }}
        >
          {t("privateLessonsBooking.backToHome", "Volver al inicio")}
        </Button>
      </div>
    </div>
  );
};

export default BookingConfirmation;
