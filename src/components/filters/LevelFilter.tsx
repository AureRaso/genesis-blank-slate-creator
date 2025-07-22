
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface LevelFilterProps {
  levelFrom?: number;
  levelTo?: number;
  customLevels: string[];
  onLevelFromChange: (value: number | undefined) => void;
  onLevelToChange: (value: number | undefined) => void;
  onCustomLevelsChange: (levels: string[]) => void;
}

const CUSTOM_LEVELS = [
  "Primera Alta", "Primera Media", "Primera Baja",
  "Segunda Alta", "Segunda Media", "Segunda Baja", 
  "Tercera Alta", "Tercera Media", "Tercera Baja"
];

export function LevelFilter({ 
  levelFrom, 
  levelTo, 
  customLevels, 
  onLevelFromChange, 
  onLevelToChange, 
  onCustomLevelsChange 
}: LevelFilterProps) {
  const handleLevelFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
    onLevelFromChange(value);
  };

  const handleLevelToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
    onLevelToChange(value);
  };

  const handleCustomLevelToggle = (level: string, checked: boolean) => {
    if (checked) {
      onCustomLevelsChange([...customLevels, level]);
    } else {
      onCustomLevelsChange(customLevels.filter(l => l !== level));
    }
  };

  return (
    <Card>
      <CardContent className="p-3 space-y-3">
        <Label className="text-sm font-medium">Nivel</Label>
        
        {/* Nivel numérico */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Nivel numérico (1.0 - 10.0)</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                type="number"
                min="1.0"
                max="10.0"
                step="0.1"
                value={levelFrom || ""}
                onChange={handleLevelFromChange}
                placeholder="Desde"
                className="h-8"
              />
            </div>
            <span className="text-muted-foreground">-</span>
            <div className="flex-1">
              <Input
                type="number"
                min="1.0"
                max="10.0"
                step="0.1"
                value={levelTo || ""}
                onChange={handleLevelToChange}
                placeholder="Hasta"
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Niveles personalizados */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Niveles personalizados</Label>
          <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
            {CUSTOM_LEVELS.map((level) => (
              <div key={level} className="flex items-center space-x-2">
                <Checkbox
                  id={level}
                  checked={customLevels.includes(level)}
                  onCheckedChange={(checked) => handleCustomLevelToggle(level, !!checked)}
                />
                <Label htmlFor={level} className="text-xs">{level}</Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
