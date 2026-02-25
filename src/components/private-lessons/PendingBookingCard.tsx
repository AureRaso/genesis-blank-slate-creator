import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Clock, Users, MapPin, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PrivateLessonBooking, useRespondToBooking } from "@/hooks/usePrivateLessons";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface PendingBookingCardProps {
  booking: PrivateLessonBooking;
}

const PendingBookingCard = ({ booking }: PendingBookingCardProps) => {
  const { t } = useTranslation();
  const { getDateFnsLocale } = useLanguage();
  const dateFnsLocale = getDateFnsLocale();
  const respondMutation = useRespondToBooking();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const formatDate = (date: string) => {
    const [y, m, d] = date.split("-");
    return `${d}/${m}/${y}`;
  };

  const timeRemaining = booking.auto_cancel_at
    ? formatDistanceToNow(new Date(booking.auto_cancel_at), { locale: dateFnsLocale, addSuffix: false })
    : null;

  const isExpiringSoon = booking.auto_cancel_at
    ? new Date(booking.auto_cancel_at).getTime() - Date.now() < 30 * 60 * 1000
    : false;

  const handleConfirm = () => {
    respondMutation.mutate({
      bookingId: booking.id,
      action: "confirm",
    });
  };

  const handleReject = () => {
    respondMutation.mutate(
      { bookingId: booking.id, action: "reject", rejectionReason: rejectionReason || undefined },
      { onSuccess: () => setShowRejectDialog(false) }
    );
  };

  return (
    <>
      <Card className="border-amber-200">
        <CardContent className="p-4 space-y-3">
          {/* Header: name + time remaining */}
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-sm">{booking.booker_name}</h4>
              {booking.booker_phone && (
                <p className="text-xs text-muted-foreground">{booking.booker_phone}</p>
              )}
            </div>
            {timeRemaining && (
              <Badge variant="outline" className={isExpiringSoon ? "border-red-300 text-red-600" : "border-amber-300 text-amber-600"}>
                <Clock className="h-3 w-3 mr-1" />
                {timeRemaining}
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(booking.lesson_date)}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {booking.start_time.slice(0, 5)} — {booking.end_time.slice(0, 5)}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {booking.num_companions + 1} {booking.num_companions + 1 === 1 ? "jugador" : "jugadores"}
            </div>
            {booking.court_number && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {t("privateLessons.bookings.court", "Pista")} {booking.court_number}
              </div>
            )}
          </div>

          {/* Price */}
          {booking.total_price && (
            <div className="text-xs text-muted-foreground">
              {t("privateLessons.bookings.total", "Total")}: <span className="font-medium text-foreground">{booking.total_price}€</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleConfirm}
              disabled={respondMutation.isPending}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              {t("privateLessons.bookings.confirm", "Aceptar")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => setShowRejectDialog(true)}
              disabled={respondMutation.isPending}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              {t("privateLessons.bookings.reject", "Rechazar")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reject reason dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("privateLessons.bookings.rejectTitle", "Motivo del rechazo")}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder={t("privateLessons.bookings.rejectPlaceholder", "Opcional: indica el motivo...")}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={respondMutation.isPending}
            >
              {t("privateLessons.bookings.confirmReject", "Rechazar solicitud")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PendingBookingCard;