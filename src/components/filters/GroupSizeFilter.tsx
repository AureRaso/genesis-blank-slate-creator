
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface GroupSizeFilterProps {
  minSize?: number;
  maxSize?: number;
  onMinChange: (value: number | undefined) => void;
  onMaxChange: (value: number | undefined) => void;
}

export function GroupSizeFilter({ minSize, maxSize, onMinChange, onMaxChange }: GroupSizeFilterProps) {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : parseInt(e.target.value);
    onMinChange(value);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : parseInt(e.target.value);
    onMaxChange(value);
  };

  return (
    <Card>
      <CardContent className="p-3">
        <Label className="text-sm font-medium mb-2 block">Tamaño de grupo</Label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label htmlFor="min-size" className="text-xs text-muted-foreground">Mín.</Label>
            <Input
              id="min-size"
              type="number"
              min="1"
              max="8"
              value={minSize || ""}
              onChange={handleMinChange}
              placeholder="1"
              className="h-8"
            />
          </div>
          <span className="text-muted-foreground">-</span>
          <div className="flex-1">
            <Label htmlFor="max-size" className="text-xs text-muted-foreground">Máx.</Label>
            <Input
              id="max-size"
              type="number"
              min="1"
              max="8"
              value={maxSize || ""}
              onChange={handleMaxChange}
              placeholder="8"
              className="h-8"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
