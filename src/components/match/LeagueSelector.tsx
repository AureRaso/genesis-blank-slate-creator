
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LeagueSelectorProps {
  leagues: any[];
  selectedLeagueId: string;
  onLeagueChange: (leagueId: string) => void;
}

const LeagueSelector = ({ leagues, selectedLeagueId, onLeagueChange }: LeagueSelectorProps) => {
  return (
    <div>
      <Label htmlFor="league">Liga</Label>
      <Select value={selectedLeagueId} onValueChange={onLeagueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona una liga activa..." />
        </SelectTrigger>
        <SelectContent>
          {leagues.map((league) => (
            <SelectItem key={league.id} value={league.id}>
              {league.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LeagueSelector;
