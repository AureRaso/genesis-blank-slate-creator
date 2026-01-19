import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, User } from 'lucide-react';
import { AddChildData } from '@/hooks/useGuardianChildren';
import ClubCodeInput from '@/components/ClubCodeInput';

interface AddChildModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddChild: (data: AddChildData) => void;
  isLoading: boolean;
  mode?: 'setup' | 'add'; // 'setup' pide código de club (primera vez), 'add' usa el club del guardian (por defecto)
}

export const AddChildModal = ({
  open,
  onOpenChange,
  onAddChild,
  isLoading,
  mode = 'add' // Por defecto, no pedir código de club
}: AddChildModalProps) => {
  const [fullName, setFullName] = useState('');
  const [clubCode, setClubCode] = useState('');
  const [selectedClubId, setSelectedClubId] = useState('');
  const [clubError, setClubError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Solo validar código de club en modo 'setup'
    if (mode === 'setup' && !selectedClubId) {
      setClubError('Debes ingresar un código de club válido');
      return;
    }

    onAddChild({
      fullName,
      clubId: mode === 'setup' ? selectedClubId : undefined, // Solo enviar clubId en modo setup
    });

    // NO resetear el formulario aquí - se reseteará cuando el modal se cierre
  };

  // Resetear formulario cuando el modal se cierra
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isLoading) {
      // Solo resetear si no está cargando
      setFullName('');
      setClubCode('');
      setSelectedClubId('');
      setClubError('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px]" onInteractOutside={(e) => {
        // Prevenir cerrar el modal haciendo clic fuera mientras está cargando
        if (isLoading) {
          e.preventDefault();
        }
      }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <UserPlus className="h-6 w-6 text-playtomic-orange" />
            Añadir Hijo/a
          </DialogTitle>
          <DialogDescription>
            {mode === 'setup'
              ? 'Crea un perfil para tu hijo/a. Necesitarás el código del club proporcionado por su entrenador.'
              : 'Crea un perfil para tu hijo/a. Se añadirá al mismo club que tus otros hijos.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Nombre completo */}
          <div className="space-y-2">
            <Label htmlFor="child-name" className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Nombre y Apellidos *
            </Label>
            <Input
              id="child-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej: María García López"
              className="h-12"
              required
              disabled={isLoading}
            />
          </div>

          {/* Código de club - Solo en modo setup */}
          {mode === 'setup' && (
            <div className="space-y-2">
              <ClubCodeInput
                value={clubCode}
                onValueChange={(code, clubId, clubName) => {
                  setClubCode(code);
                  setSelectedClubId(clubId || '');
                  if (clubError) setClubError('');
                }}
                label="Código de Club"
                placeholder="ABC"
                required
                error={clubError}
              />
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
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
                  Añadir Hijo/a
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
