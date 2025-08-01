
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useUpdateScheduledClass } from "@/hooks/useScheduledClasses";
import { useToast } from "@/hooks/use-toast";
import type { ScheduledClassWithTemplate } from "@/hooks/useScheduledClasses";

interface EditClassModalProps {
  class: ScheduledClassWithTemplate;
  isOpen: boolean;
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miércoles", label: "Miércoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sábado", label: "Sábado" },
  { value: "domingo", label: "Domingo" }
];

const CUSTOM_LEVELS = [
  { value: "primera_alta", label: "Primera Alta" },
  { value: "primera_media", label: "Primera Media" },
  { value: "primera_baja", label: "Primera Baja" },
  { value: "segunda_alta", label: "Segunda Alta" },
  { value: "segunda_media", label: "Segunda Media" },
  { value: "segunda_baja", label: "Segunda Baja" },
  { value: "tercera_alta", label: "Tercera Alta" },
  { value: "tercera_media", label: "Tercera Media" },
  { value: "tercera_baja", label: "Tercera Baja" }
];

export function EditClassModal({ class: cls, isOpen, onClose }: EditClassModalProps) {
  const { toast } = useToast();
  const updateClassMutation = useUpdateScheduledClass();
  
  const [formData, setFormData] = useState({
    name: cls.name,
    level_from: cls.level_from || undefined,
    level_to: cls.level_to || undefined,
    custom_level: cls.custom_level || "",
    duration_minutes: cls.duration_minutes,
    start_time: cls.start_time,
    days_of_week: cls.days_of_week,
    start_date: cls.start_date,
    end_date: cls.end_date
  });

  const [levelType, setLevelType] = useState<'numeric' | 'custom'>(
    cls.custom_level ? 'custom' : 'numeric'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const updateData = {
        ...formData,
        level_from: levelType === 'numeric' ? formData.level_from : undefined,
        level_to: levelType === 'numeric' ? formData.level_to : undefined,
        custom_level: levelType === 'custom' ? formData.custom_level : undefined
      };

      await updateClassMutation.mutateAsync({
        id: cls.id,
        data: updateData
      });

      onClose();
    } catch (error) {
      console.error('Error updating class:', error);
    }
  };

  const addDay = (day: string) => {
    if (!formData.days_of_week.includes(day)) {
      setFormData(prev => ({
        ...prev,
        days_of_week: [...prev.days_of_week, day]
      }));
    }
  };

  const removeDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.filter(d => d !== day)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Clase</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre de la clase</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label>Tipo de nivel</Label>
              <Select value={levelType} onValueChange={(value: 'numeric' | 'custom') => setLevelType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="numeric">Nivel numérico</SelectItem>
                  <SelectItem value="custom">Nivel personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {levelType === 'numeric' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="level_from">Nivel desde</Label>
                  <Input
                    id="level_from"
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={formData.level_from || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      level_from: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="level_to">Nivel hasta</Label>
                  <Input
                    id="level_to"
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={formData.level_to || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      level_to: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                  />
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="custom_level">Nivel personalizado</Label>
                <Select 
                  value={formData.custom_level} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, custom_level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOM_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duración (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  max="180"
                  step="15"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    duration_minutes: parseInt(e.target.value) 
                  }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="start_time">Hora de inicio</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Días de la semana</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.days_of_week.map(day => (
                  <Badge key={day} variant="default" className="flex items-center gap-1">
                    {DAYS_OF_WEEK.find(d => d.value === day)?.label || day}
                    <button
                      type="button"
                      onClick={() => removeDay(day)}
                      className="hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Select onValueChange={addDay}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Añadir día" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.filter(day => !formData.days_of_week.includes(day.value)).map(day => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Fecha de inicio</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_date">Fecha de fin</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateClassMutation.isPending}>
              {updateClassMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
