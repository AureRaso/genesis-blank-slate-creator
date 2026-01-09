import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AddSelfAsStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export const AddSelfAsStudentModal = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading
}: AddSelfAsStudentModalProps) => {
  const { profile } = useAuth();

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!isLoading) {
        onOpenChange(newOpen);
      }
    }}>
      <DialogContent className="sm:max-w-[450px]" onInteractOutside={(e) => {
        if (isLoading) {
          e.preventDefault();
        }
      }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <User className="h-6 w-6 text-playtomic-orange" />
            Crear mi perfil de alumno
          </DialogTitle>
          <DialogDescription>
            Crea tu propio perfil de alumno para poder inscribirte en clases junto con tus hijos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Información del perfil que se creará */}
          <div className="bg-slate-50 rounded-lg p-4 border">
            <p className="text-sm text-slate-600 mb-2">Se creará un perfil con tus datos:</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-playtomic-orange to-orange-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{profile?.full_name || 'Tu nombre'}</p>
                <p className="text-xs text-slate-500">Perfil de alumno</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-600">
            Una vez creado, podrás ver tus clases y gestionar tu asistencia desde el dashboard.
          </p>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-gradient-to-r from-playtomic-orange to-orange-600 hover:from-playtomic-orange/90 hover:to-orange-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Crear mi perfil
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
