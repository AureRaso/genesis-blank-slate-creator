
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface DiscountFilterProps {
  withDiscountOnly: boolean;
  onChange: (value: boolean) => void;
}

export function DiscountFilter({ withDiscountOnly, onChange }: DiscountFilterProps) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="discount-filter"
            checked={withDiscountOnly}
            onCheckedChange={(checked) => onChange(!!checked)}
          />
          <Label htmlFor="discount-filter" className="text-sm font-medium">
            Solo clases con descuento
          </Label>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Mostrar solo clases donde al menos un alumno tenga descuento activo
        </p>
      </CardContent>
    </Card>
  );
}
