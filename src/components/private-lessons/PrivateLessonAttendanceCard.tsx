import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, MapPin, GraduationCap, User } from "lucide-react";
import { PrivateLessonBookingWithTrainer } from "@/hooks/usePrivateLessons";

interface PrivateLessonAttendanceCardProps {
  booking: PrivateLessonBookingWithTrainer;
}

const PrivateLessonAttendanceCard = ({ booking }: PrivateLessonAttendanceCardProps) => {
  const totalPlayers = booking.num_companions + 1;
  const companions = booking.companion_details || [];

  return (
    <Card className="border-indigo-200 bg-indigo-50/30">
      <CardHeader className="p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-indigo-600 flex-shrink-0" />
              <CardTitle className="text-base sm:text-xl truncate">Clase Particular</CardTitle>
              <Badge
                variant={booking.status === "confirmed" ? "default" : "secondary"}
                className={
                  booking.status === "confirmed"
                    ? "bg-green-100 text-green-700 border-green-200 text-xs"
                    : "bg-amber-100 text-amber-700 border-amber-200 text-xs"
                }
              >
                {booking.status === "confirmed" ? "Confirmada" : "Pendiente"}
              </Badge>
            </div>
            <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)} ({booking.duration_minutes} min)
                </span>
              </span>
              {booking.trainer?.full_name && (
                <span className="truncate">
                  Profesor: {booking.trainer.full_name}
                </span>
              )}
              {booking.court_number && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  Pista {booking.court_number}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="border-indigo-300 text-indigo-600 text-xs">
              <Users className="h-3 w-3 mr-1" />
              {totalPlayers} {totalPlayers === 1 ? "jugador" : "jugadores"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
        <div className="space-y-1.5">
          {/* Booker */}
          <div className="flex items-center gap-2 text-sm">
            <User className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
            <span className="font-medium">{booking.booker_name}</span>
          </div>
          {/* Companions */}
          {companions.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
              <span>{c.name}</span>
            </div>
          ))}
        </div>
        {booking.price_per_person && (
          <div className="mt-3 pt-2 border-t border-indigo-100 text-xs text-muted-foreground">
            {booking.price_per_person}€/persona · Total: {booking.total_price}€
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrivateLessonAttendanceCard;
