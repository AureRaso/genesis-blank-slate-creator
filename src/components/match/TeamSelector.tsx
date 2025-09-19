
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TeamSelectorProps {
  label: string;
  placeholder: string;
  teams: any[];
  selectedTeamId: string;
  onTeamChange: (teamId: string) => void;
}

const TeamSelector = ({ label, placeholder, teams, selectedTeamId, onTeamChange }: TeamSelectorProps) => {
  return (
    <div>
      <Label htmlFor="team">{label}</Label>
      <Select value={selectedTeamId} onValueChange={onTeamChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {teams.map((lt) => {
            const team = lt.teams;
            if (!team?.player1?.full_name || !team?.player2?.full_name) return null;
            
            const player1Name = team.player1.full_name;
            const player2Name = team.player2.full_name;
            
            return (
              <SelectItem key={lt.team_id} value={lt.team_id}>
                {team.name} ({player1Name} & {player2Name})
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TeamSelector;
