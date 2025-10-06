import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface ConfirmAbsenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason?: string) => void;
  className?: string;
  isLoading?: boolean;
}

const ConfirmAbsenceDialog = ({
  open,
  onOpenChange,
  onConfirm,
  className,
  isLoading = false,
}: ConfirmAbsenceDialogProps) => {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
    setReason(""); // Reset reason after confirm
  };

  const handleCancel = () => {
    setReason(""); // Reset reason when canceling
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Ausencia
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que no vas a asistir a esta clase?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="absence-reason" className="text-sm font-medium">
              Motivo (opcional)
            </Label>
            <Textarea
              id="absence-reason"
              placeholder="Ej: Lesión, trabajo, enfermedad, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
              rows={3}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Puedes dejar este campo vacío si prefieres no especificar el motivo
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Confirmando..." : "Confirmar Ausencia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmAbsenceDialog;
