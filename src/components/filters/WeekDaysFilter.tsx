
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface WeekDaysFilterProps {
  selectedDays: string[];
  onDaysChange: (days: string[]) => void;
}

const WEEK_DAYS = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miércoles", label: "Miércoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sábado", label: "Sábado" },
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
