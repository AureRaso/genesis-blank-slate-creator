
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ScheduleSelectorProps {
  scheduledDate: string;
  scheduledTime: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}

const ScheduleSelector = ({ scheduledDate, scheduledTime, onDateChange, onTimeChange }: ScheduleSelectorProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="date">Fecha (opcional)</Label>
        <Input
          id="date"
          type="date"
          value={scheduledDate}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="time">Hora (opcional)</Label>
        <Input
          id="time"
          type="time"
          value={scheduledTime}
          onChange={(e) => onTimeChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default ScheduleSelector;
