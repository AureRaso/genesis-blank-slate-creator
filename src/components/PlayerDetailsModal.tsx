import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Shirt, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SHIRT_SIZES = [
  { value: "XS", label: "XS" },
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
  { value: "XXL", label: "XXL" },
  { value: "3XL", label: "3XL" },
];

interface PlayerDetailsModalProps {
  profileId: string;
  currentBirthDate: string | null | undefined;
  currentShirtSize: string | null | undefined;
  onDetailsUpdated: () => void;
}

export const PlayerDetailsModal = ({
  profileId,
  currentBirthDate,
  currentShirtSize,
  onDetailsUpdated
}: PlayerDetailsModalProps) => {
  const [birthDate, setBirthDate] = useState(currentBirthDate || "");
  const [shirtSize, setShirtSize] = useState(currentShirtSize || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailsWereUpdated, setDetailsWereUpdated] = useState(false);
  const { toast } = useToast();

  // Check if details need update
  const needsDetailsUpdate = !currentBirthDate || !currentShirtSize;
  const showModal = needsDetailsUpdate && !detailsWereUpdated;

  const validateBirthDate = (date: string): boolean => {
    if (!date) return false;

    const birthDateObj = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDateObj.getFullYear();

    // Check if age is between 5 and 100 years
    return age >= 5 && age <= 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateBirthDate(birthDate)) {
      toast({
        title: "Fecha no valida",
        description: "Por favor, introduce una fecha de nacimiento valida (edad entre 5 y 100 anos)",
        variant: "destructive",
      });
      return;
    }

    if (!shirtSize) {
      toast({
        title: "Talla requerida",
        description: "Por favor, selecciona tu talla de camiseta",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          birth_date: birthDate,
          shirt_size: shirtSize
        })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "Datos guardados!",
        description: "Tu fecha de nacimiento y talla han sido guardados correctamente",
      });

      setDetailsWereUpdated(true);
      onDetailsUpdated();
    } catch (error) {
      console.error('Error updating player details:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los datos. Intentalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = validateBirthDate(birthDate) && shirtSize;

  if (!showModal) return null;

  return (
    <Dialog open={showModal} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        hideCloseButton
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertCircle className="h-6 w-6 text-amber-500" />
            Completa tu perfil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <Shirt className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-amber-900 mb-1">
                Necesitamos algunos datos adicionales
              </p>
              <p className="text-amber-700">
                Tu club requiere esta informacion para la gestion de equipaciones y organizacion de categorias.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="birthDate" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fecha de nacimiento
              </label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="shirtSize" className="text-sm font-medium flex items-center gap-2">
                <Shirt className="h-4 w-4" />
                Talla de camiseta
              </label>
              <Select value={shirtSize} onValueChange={setShirtSize}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona tu talla" />
                </SelectTrigger>
                <SelectContent>
                  {SHIRT_SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar y continuar"}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            No podras usar la aplicacion hasta completar este paso
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
