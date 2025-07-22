
import { Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface StudentNameFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function StudentNameFilter({ value, onChange }: StudentNameFilterProps) {
  return (
    <Card>
      <CardContent className="p-3">
        <Label className="text-sm font-medium mb-2 block">Buscar alumno</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nombre o email del alumno..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-10 h-8"
          />
        </div>
      </CardContent>
    </Card>
  );
}
