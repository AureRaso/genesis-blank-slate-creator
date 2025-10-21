import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { GuardianChild } from '@/hooks/useGuardianChildren';

interface EditChildModalProps {
  child: GuardianChild | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditChild: (childId: string, data: { fullName: string; level: number }) => void;
  isLoading: boolean;
}

export const EditChildModal = ({
  child,
  open,
  onOpenChange,
  onEditChild,
  isLoading
}: EditChildModalProps) => {
  const [fullName, setFullName] = useState('');
  const [level, setLevel] = useState('1');

  useEffect(() => {
    if (child) {
      setFullName(child.full_name || '');
      setLevel(child.level?.toString() || '1');
    }
  }, [child]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (child && fullName.trim()) {
      onEditChild(child.id, {
        fullName: fullName.trim(),
        level: parseInt(level)
      });
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Hijo/a</DialogTitle>
          <DialogDescription>
            Modifica el nombre y nivel de tu hijo/a
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo *</Label>
            <Input
              id="fullName"
              placeholder="Ej: María García"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">Nivel *</Label>
            <Select value={level} onValueChange={setLevel} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Nivel 1 - Iniciación</SelectItem>
                <SelectItem value="2">Nivel 2 - Básico</SelectItem>
                <SelectItem value="3">Nivel 3 - Intermedio</SelectItem>
                <SelectItem value="4">Nivel 4 - Avanzado</SelectItem>
                <SelectItem value="5">Nivel 5 - Experto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !fullName.trim()}
              className="bg-gradient-to-r from-playtomic-orange to-orange-600 hover:from-playtomic-orange/90 hover:to-orange-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
