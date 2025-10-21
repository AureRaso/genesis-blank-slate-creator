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
import { UserPlus, User, Target } from 'lucide-react';
import { AddChildData } from '@/hooks/useGuardianChildren';

interface AddChildModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddChild: (data: AddChildData) => void;
  isLoading: boolean;
}

export const AddChildModal = ({
  open,
  onOpenChange,
  onAddChild,
  isLoading
}: AddChildModalProps) => {
  const [fullName, setFullName] = useState('');
  const [level, setLevel] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numLevel = parseFloat(level);
    if (isNaN(numLevel) || numLevel < 1.0 || numLevel > 10.0) {
      return;
    }

    onAddChild({
      fullName,
      level: numLevel,
    });

    // Reset form
    setFullName('');
    setLevel('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <UserPlus className="h-6 w-6 text-playtomic-orange" />
            Añadir Hijo/a
          </DialogTitle>
          <DialogDescription>
            Crea un perfil para tu hijo/a. El club será asignado automáticamente.
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
            />
          </div>

          {/* Nivel */}
          <div className="space-y-2">
            <Label htmlFor="child-level" className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Nivel de Juego (Playtomic) *
            </Label>
            <Input
              id="child-level"
              type="text"
              inputMode="decimal"
              value={level}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setLevel(value);
                }
              }}
              placeholder="Ej: 2.5"
              className="h-12"
              required
            />
            <p className="text-xs text-slate-500">
              Nivel aproximado de tu hijo/a (1.0 - 10.0)
            </p>
          </div>

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
