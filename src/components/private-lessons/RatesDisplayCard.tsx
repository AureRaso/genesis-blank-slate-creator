import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DurationRates {
  price_1_player: number | null;
  price_2_players: number | null;
  price_3_players: number | null;
  price_4_players: number | null;
}

type PrivateLessonRates = Record<string, DurationRates>;

interface RatesDisplayCardProps {
  rates: PrivateLessonRates;
}

const DURATION_LABELS: Record<string, string> = {
  "60": "1h",
  "90": "1,5h",
  "120": "2h",
};

const RatesDisplayCard = ({ rates }: RatesDisplayCardProps) => {
  const { t } = useTranslation();

  const sortedDurations = Object.keys(rates).sort((a, b) => Number(a) - Number(b));

  if (sortedDurations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          <Lock className="h-4 w-4 mx-auto mb-2 opacity-50" />
          {t("privateLessons.rates.noRates", "No hay tarifas configuradas. El administrador debe definirlas.")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">
            {t("privateLessons.rates.title", "Tarifas")}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedDurations.map((dur) => {
            const r = rates[dur];
            return (
              <div key={dur} className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {DURATION_LABELS[dur] || `${dur} min`}
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span className="text-muted-foreground">1 {t("privateLessons.rates.player", "jug")}:</span>
                  <span className="font-medium">{r.price_1_player != null ? `${r.price_1_player}€` : "—"}</span>
                  <span className="text-muted-foreground">2 {t("privateLessons.rates.players", "jug")}:</span>
                  <span className="font-medium">{r.price_2_players != null ? `${r.price_2_players}€` : "—"}</span>
                  <span className="text-muted-foreground">3 {t("privateLessons.rates.players", "jug")}:</span>
                  <span className="font-medium">{r.price_3_players != null ? `${r.price_3_players}€` : "—"}</span>
                  <span className="text-muted-foreground">4 {t("privateLessons.rates.players", "jug")}:</span>
                  <span className="font-medium">{r.price_4_players != null ? `${r.price_4_players}€` : "—"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RatesDisplayCard;