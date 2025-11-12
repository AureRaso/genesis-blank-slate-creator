
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface WeekDaysFilterProps {
  selectedDays: string[];
  onDaysChange: (days: string[]) => void;
}

// IMPORTANT: Values must match the database format (without accents)
// Labels can have accents for display
const WEEK_DAYS = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miercoles", label: "Miércoles" },  // value without accent
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sabado", label: "Sábado" },  // value without accent
  { value: "domingo", label: "Domingo" }
];

export function WeekDaysFilter({ selectedDays, onDaysChange }: WeekDaysFilterProps) {
  const handleDayToggle = (day: string, checked: boolean) => {
    if (checked) {
      onDaysChange([...selectedDays, day]);
    } else {
      onDaysChange(selectedDays.filter(d => d !== day));
    }
  };

  return (
    <Card>
      <CardContent className="p-3">
        <Label className="text-sm font-medium mb-2 block">Días de la semana</Label>
        <div className="grid grid-cols-2 gap-1">
          {WEEK_DAYS.map((day) => (
            <div key={day.value} className="flex items-center space-x-2">
              <Checkbox
                id={day.value}
                checked={selectedDays.includes(day.value)}
                onCheckedChange={(checked) => handleDayToggle(day.value, !!checked)}
              />
              <Label htmlFor={day.value} className="text-xs">{day.label}</Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
