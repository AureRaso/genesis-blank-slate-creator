
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

  // Determinar si hay filtros numéricos activos
  const hasNumericFilters = levelFrom !== undefined || levelTo !== undefined;
  // Determinar si hay filtros categóricos activos
  const hasCategoricFilters = customLevels.length > 0;

  const handleLevelFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
    onLevelFromChange(value);
    
    // Si se activa filtro numérico, limpiar categóricos
    if (value !== undefined && hasCategoricFilters) {
      onCustomLevelsChange([]);
    }
  };

  const handleLevelToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
    onLevelToChange(value);
    
    // Si se activa filtro numérico, limpiar categóricos
    if (value !== undefined && hasCategoricFilters) {
      onCustomLevelsChange([]);
    }
  };

  const handleCustomLevelToggle = (level: string, checked: boolean) => {
    let newLevels;
    if (checked) {
      newLevels = [...customLevels, level];
      // Si se activa filtro categórico, limpiar numéricos
      if (hasNumericFilters) {
        onLevelFromChange(undefined);
        onLevelToChange(undefined);
      }
    } else {
      newLevels = customLevels.filter(l => l !== level);
    }
    onCustomLevelsChange(newLevels);
  };

  return (
    <Card>
      <CardContent className="p-3 space-y-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium">Filtrar por Nivel</Label>
          <p className="text-xs text-muted-foreground">
            Selecciona un método de filtrado: por puntuación o por categoría. Solo uno puede estar activo a la vez.
          </p>
        </div>
        
        {/* 🟦 Sección A: Nivel por puntuación (Playtomic) */}
        <div className={`space-y-2 p-3 rounded-lg border ${hasCategoricFilters ? 'bg-muted/30 opacity-60' : 'bg-background'}`}>
          <Label className="text-sm font-medium text-blue-600">🟦 Nivel por puntuación (Playtomic)</Label>
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
                disabled={hasCategoricFilters}
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
                disabled={hasCategoricFilters}
              />
            </div>
          </div>
        </div>

        {/* 🟨 Sección B: Nivel categórico */}
        <div className={`space-y-2 p-3 rounded-lg border ${hasNumericFilters ? 'bg-muted/30 opacity-60' : 'bg-background'}`}>
          <Label className="text-sm font-medium text-yellow-600">🟨 Nivel categórico</Label>
          <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
            {CUSTOM_LEVELS.map((level) => (
              <div key={level} className="flex items-center space-x-2">
                <Checkbox
                  id={level}
                  checked={customLevels.includes(level)}
                  onCheckedChange={(checked) => handleCustomLevelToggle(level, !!checked)}
                  disabled={hasNumericFilters}
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
