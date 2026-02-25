import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, User, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { PrivateLessonRates, DurationRates } from "@/hooks/useTrainers";
import { CompanionInfo, useRecentCompanions } from "@/hooks/usePlayerPrivateLessons";
import CompanionSearch from "./CompanionSearch";

interface BookingStepPlayersProps {
  rates: PrivateLessonRates;
  durationMinutes: number;
  numPlayers: 1 | 2 | 3 | 4;
  onSelectNumPlayers: (n: 1 | 2 | 3 | 4) => void;
  companions: CompanionInfo[];
  onUpdateCompanion: (index: number, companion: CompanionInfo | null) => void;
  clubId: string;
  onContinue: () => void;
  onBack: () => void;
}

const PLAYER_OPTIONS: { value: 1 | 2 | 3 | 4; labelKey: string; fallback: string; icon: "solo" | "duo" | "trio" | "cuarteto" }[] = [
  { value: 1, labelKey: "privateLessonsBooking.players.solo", fallback: "Solo yo", icon: "solo" },
  { value: 2, labelKey: "privateLessonsBooking.players.duo", fallback: "Somos 2", icon: "duo" },
  { value: 3, labelKey: "privateLessonsBooking.players.trio", fallback: "Somos 3", icon: "trio" },
  { value: 4, labelKey: "privateLessonsBooking.players.cuarteto", fallback: "Somos 4", icon: "cuarteto" },
];

const PlayerIcon = ({ count, isSelected }: { count: number; isSelected: boolean }) => {
  const color = isSelected ? "text-primary" : "text-gray-400";
  switch (count) {
    case 1:
      return <UserRound className={`h-7 w-7 ${color}`} />;
    case 2:
      return (
        <div className="flex -space-x-2">
          <UserRound className={`h-6 w-6 ${color}`} />
          <UserRound className={`h-6 w-6 ${color}`} />
        </div>
      );
    case 3:
      return (
        <div className="flex -space-x-1.5">
          <UserRound className={`h-5 w-5 ${color}`} />
          <UserRound className={`h-5 w-5 ${color}`} />
          <UserRound className={`h-5 w-5 ${color}`} />
        </div>
      );
    case 4:
      return (
        <div className="flex -space-x-1.5">
          <UserRound className={`h-5 w-5 ${color}`} />
          <UserRound className={`h-5 w-5 ${color}`} />
          <UserRound className={`h-5 w-5 ${color}`} />
          <UserRound className={`h-5 w-5 ${color}`} />
        </div>
      );
    default:
      return <UserRound className={`h-7 w-7 ${color}`} />;
  }
};

function getPriceKey(numPlayers: number): keyof DurationRates {
  switch (numPlayers) {
    case 1: return "price_1_player";
    case 2: return "price_2_players";
    case 3: return "price_3_players";
    case 4: return "price_4_players";
    default: return "price_1_player";
  }
}

const BookingStepPlayers = ({
  rates,
  durationMinutes,
  numPlayers,
  onSelectNumPlayers,
  companions,
  onUpdateCompanion,
  clubId,
  onContinue,
  onBack,
}: BookingStepPlayersProps) => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { data: recentCompanions = [] } = useRecentCompanions(clubId);

  const durationKey = String(durationMinutes);
  const durationRates = rates[durationKey];

  const pricePerPerson = useMemo(() => {
    if (!durationRates) return null;
    const key = getPriceKey(numPlayers);
    return durationRates[key] ?? null;
  }, [durationRates, numPlayers]);

  // Check if the selected player count has a price configured
  const availablePlayerCounts = useMemo(() => {
    if (!durationRates) return [];
    const counts: (1 | 2 | 3 | 4)[] = [];
    if (durationRates.price_1_player != null) counts.push(1);
    if (durationRates.price_2_players != null) counts.push(2);
    if (durationRates.price_3_players != null) counts.push(3);
    if (durationRates.price_4_players != null) counts.push(4);
    return counts;
  }, [durationRates]);

  // Companions needed (numPlayers - 1, since player 1 is the booker)
  const companionsNeeded = numPlayers - 1;

  // Collect profile IDs already selected to prevent duplicates
  const selectedProfileIds = [
    ...(profile?.id ? [profile.id] : []),
    ...companions.filter((c) => c?.profile_id).map((c) => c.profile_id),
  ];

  // All companions filled?
  const allCompanionsFilled =
    companionsNeeded === 0 ||
    (companions.length >= companionsNeeded &&
      companions.slice(0, companionsNeeded).every((c) => c !== null && c.name));

  const canContinue = pricePerPerson != null && allCompanionsFilled;

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

      {/* Player count selection */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {t("privateLessonsBooking.howManyPlayers", "¿Cuántos jugáis?")}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {PLAYER_OPTIONS.map((option) => {
            const isAvailable = availablePlayerCounts.includes(option.value);
            const isSelected = numPlayers === option.value;

            return (
              <Card
                key={option.value}
                className={`p-3 cursor-pointer transition-all text-center ${
                  !isAvailable
                    ? "opacity-40 cursor-not-allowed bg-gray-50"
                    : isSelected
                      ? "border-primary bg-orange-50 ring-1 ring-primary"
                      : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => isAvailable && onSelectNumPlayers(option.value)}
              >
                <div className="flex justify-center mb-1">
                  <PlayerIcon count={option.value} isSelected={isSelected} />
                </div>
                <p className="text-sm font-medium">
                  {t(option.labelKey, option.fallback)}
                </p>
                {isAvailable && durationRates && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {durationRates[getPriceKey(option.value)]}€/pers
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Companions section */}
      {numPlayers > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {t("privateLessonsBooking.companions", "Jugadores")}
          </h3>
          <div className="space-y-2">
            {/* Current user (Jugador 1) */}
            <div className="flex items-center gap-2 p-2.5 bg-orange-50 border border-orange-200 rounded-xl">
              <User className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-primary font-semibold uppercase">
                  {t("privateLessonsBooking.you", "TÚ")}
                </p>
                <p className="text-sm font-medium truncate">
                  {profile?.full_name || "—"}
                </p>
              </div>
            </div>

            {/* Companion search fields */}
            {Array.from({ length: companionsNeeded }, (_, i) => (
              <CompanionSearch
                key={i}
                index={i}
                clubId={clubId}
                value={companions[i] || null}
                onChange={(c) => onUpdateCompanion(i, c)}
                excludeProfileIds={selectedProfileIds}
                recentCompanions={recentCompanions}
              />
            ))}
          </div>
        </div>
      )}

      {/* Price display */}
      {pricePerPerson != null && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-primary">{pricePerPerson}€</p>
          <p className="text-sm text-gray-500 mt-1">
            {t("privateLessonsBooking.pricePerPerson", "Precio por persona")} ·{" "}
            {numPlayers}{" "}
            {numPlayers === 1
              ? t("privateLessonsBooking.player", "jugador")
              : t("privateLessonsBooking.playersLabel", "jugadores")}
          </p>
        </div>
      )}

      {/* CTA */}
      <Button
        className="w-full bg-primary hover:bg-orange-600 text-white rounded-xl py-6 text-base font-semibold"
        disabled={!canContinue}
        onClick={onContinue}
      >
        {t("privateLessonsBooking.continue", "Continuar")} →
      </Button>
    </div>
  );
};

export default BookingStepPlayers;
