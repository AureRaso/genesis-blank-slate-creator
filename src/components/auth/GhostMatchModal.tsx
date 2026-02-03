import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, X } from "lucide-react";
import { GhostMatchResult } from "@/hooks/useGhostMatch";

interface GhostMatchModalProps {
  open: boolean;
  match: GhostMatchResult;
  loading?: boolean;
  onConfirm: () => void;
  onReject: () => void;
}

const GhostMatchModal: React.FC<GhostMatchModalProps> = ({
  open,
  match,
  loading = false,
  onConfirm,
  onReject,
}) => {
  const classSummary = match.className
    ? `${match.className} - ${match.classTime || ''}${match.classDays?.length ? ` (${match.classDays.join(', ')})` : ''}`
    : null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center">
            ¡Te hemos encontrado!
          </DialogTitle>
          <DialogDescription className="text-center">
            La academia te tiene pre-registrado como alumno
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-blue-50 rounded-lg space-y-2">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">{match.clubName}</span> te tiene registrado como:
            </p>
            <p className="text-lg font-medium text-blue-900">
              {match.fullName}
            </p>
            {classSummary && (
              <p className="text-sm text-blue-700">
                Clase: {classSummary}
              </p>
            )}
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Si confirmas, se vincularán tus datos de clase, asistencia y pagos a tu cuenta.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {loading ? "Vinculando..." : "Sí, soy yo"}
          </Button>
          <Button
            variant="outline"
            onClick={onReject}
            disabled={loading}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            No soy yo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GhostMatchModal;