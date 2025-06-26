
import { useState } from "react";
import { ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCreateMatchResult } from "@/hooks/useMatchResults";

interface MatchResultFormProps {
  match: any;
  onClose: () => void;
}

const MatchResultForm = ({ match, onClose }: MatchResultFormProps) => {
  const [formData, setFormData] = useState({
    team1_set1: '',
    team1_set2: '',
    team1_set3: '',
    team2_set1: '',
    team2_set2: '',
    team2_set3: '',
    winner_team_id: '',
    has_third_set: false,
  });

  const createResult = useCreateMatchResult();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.team1_set1 || !formData.team1_set2 || !formData.team2_set1 || !formData.team2_set2 || !formData.winner_team_id) {
      return;
    }

    const resultData = {
      match_id: match.id,
      team1_set1: parseInt(formData.team1_set1),
      team1_set2: parseInt(formData.team1_set2),
      team1_set3: formData.has_third_set ? parseInt(formData.team1_set3) : null,
      team2_set1: parseInt(formData.team2_set1),
      team2_set2: parseInt(formData.team2_set2),
      team2_set3: formData.has_third_set ? parseInt(formData.team2_set3) : null,
      winner_team_id: formData.winner_team_id,
    };

    createResult.mutate(resultData, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const handleThirdSetToggle = (hasThirdSet: boolean) => {
    setFormData(prev => ({
      ...prev,
      has_third_set: hasThirdSet,
      team1_set3: hasThirdSet ? prev.team1_set3 : '',
      team2_set3: hasThirdSet ? prev.team2_set3 : '',
    }));
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle className="flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-green-600" />
              Registrar Resultado
            </CardTitle>
            <CardDescription>
              {match.team1?.name} vs {match.team2?.name}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Set 1 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Set 1</Label>
            <div className="grid grid-cols-3 gap-4 items-center">
              <div>
                <Label htmlFor="team1_set1" className="text-sm">{match.team1?.name}</Label>
                <Input
                  id="team1_set1"
                  type="number"
                  min="0"
                  max="7"
                  value={formData.team1_set1}
                  onChange={(e) => setFormData(prev => ({ ...prev, team1_set1: e.target.value }))}
                  required
                />
              </div>
              <div className="text-center text-lg font-semibold text-gray-500">-</div>
              <div>
                <Label htmlFor="team2_set1" className="text-sm">{match.team2?.name}</Label>
                <Input
                  id="team2_set1"
                  type="number"
                  min="0"
                  max="7"
                  value={formData.team2_set1}
                  onChange={(e) => setFormData(prev => ({ ...prev, team2_set1: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Set 2 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Set 2</Label>
            <div className="grid grid-cols-3 gap-4 items-center">
              <div>
                <Label htmlFor="team1_set2" className="text-sm">{match.team1?.name}</Label>
                <Input
                  id="team1_set2"
                  type="number"
                  min="0"
                  max="7"
                  value={formData.team1_set2}
                  onChange={(e) => setFormData(prev => ({ ...prev, team1_set2: e.target.value }))}
                  required
                />
              </div>
              <div className="text-center text-lg font-semibold text-gray-500">-</div>
              <div>
                <Label htmlFor="team2_set2" className="text-sm">{match.team2?.name}</Label>
                <Input
                  id="team2_set2"
                  type="number"
                  min="0"
                  max="7"
                  value={formData.team2_set2}
                  onChange={(e) => setFormData(prev => ({ ...prev, team2_set2: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Third Set Toggle */}
          <div className="space-y-3">
            <Label className="text-base font-medium">¿Hubo tercer set?</Label>
            <RadioGroup
              value={formData.has_third_set.toString()}
              onValueChange={(value) => handleThirdSetToggle(value === 'true')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="no-third-set" />
                <Label htmlFor="no-third-set">No</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="yes-third-set" />
                <Label htmlFor="yes-third-set">Sí</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Set 3 - Only show if third set is enabled */}
          {formData.has_third_set && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Set 3</Label>
              <div className="grid grid-cols-3 gap-4 items-center">
                <div>
                  <Label htmlFor="team1_set3" className="text-sm">{match.team1?.name}</Label>
                  <Input
                    id="team1_set3"
                    type="number"
                    min="0"
                    max="7"
                    value={formData.team1_set3}
                    onChange={(e) => setFormData(prev => ({ ...prev, team1_set3: e.target.value }))}
                    required={formData.has_third_set}
                  />
                </div>
                <div className="text-center text-lg font-semibold text-gray-500">-</div>
                <div>
                  <Label htmlFor="team2_set3" className="text-sm">{match.team2?.name}</Label>
                  <Input
                    id="team2_set3"
                    type="number"
                    min="0"
                    max="7"
                    value={formData.team2_set3}
                    onChange={(e) => setFormData(prev => ({ ...prev, team2_set3: e.target.value }))}
                    required={formData.has_third_set}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Winner Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Equipo Ganador</Label>
            <RadioGroup
              value={formData.winner_team_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, winner_team_id: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={match.team1_id} id="team1-winner" />
                <Label htmlFor="team1-winner">{match.team1?.name}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={match.team2_id} id="team2-winner" />
                <Label htmlFor="team2-winner">{match.team2?.name}</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createResult.isPending}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
            >
              {createResult.isPending ? 'Guardando...' : 'Guardar Resultado'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MatchResultForm;
