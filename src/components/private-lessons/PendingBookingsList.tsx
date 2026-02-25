import { useTranslation } from "react-i18next";
import { PrivateLessonBooking } from "@/hooks/usePrivateLessons";
import PendingBookingCard from "./PendingBookingCard";

interface PendingBookingsListProps {
  bookings: PrivateLessonBooking[];
}

const PendingBookingsList = ({ bookings }: PendingBookingsListProps) => {
  const { t } = useTranslation();

  const pendingBookings = bookings.filter((b) => b.status === "pending");

  if (pendingBookings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        {t("privateLessons.bookings.noPending", "No hay solicitudes pendientes.")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("privateLessons.bookings.pendingDescription", "Solicitudes de reserva pendientes de tu respuesta.")}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {pendingBookings.map((booking) => (
          <PendingBookingCard key={booking.id} booking={booking} />
        ))}
      </div>
    </div>
  );
};

export default PendingBookingsList;