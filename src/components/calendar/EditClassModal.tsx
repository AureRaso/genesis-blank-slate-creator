
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
import { useTranslation } from "react-i18next";
import type { ScheduledClassWithTemplate } from "@/hooks/useScheduledClasses";

interface EditClassModalProps {
  class: ScheduledClassWithTemplate;
  isOpen: boolean;
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  { value: "lunes", label: "classes.monday" },
  { value: "martes", label: "classes.tuesday" },
  { value: "miércoles", label: "classes.wednesday" },
  { value: "jueves", label: "classes.thursday" },
  { value: "viernes", label: "classes.friday" },
  { value: "sábado", label: "classes.saturday" },
  { value: "domingo", label: "classes.sunday" }
];

const CUSTOM_LEVELS = [
  { value: "primera_alta", label: "classes.primeraAlta" },
  { value: "primera_media", label: "classes.primeraMedia" },
  { value: "primera_baja", label: "classes.primeraBaja" },
  { value: "segunda_alta", label: "classes.segundaAlta" },
  { value: "segunda_media", label: "classes.segundaMedia" },
  { value: "segunda_baja", label: "classes.segundaBaja" },
  { value: "tercera_alta", label: "classes.terceraAlta" },
  { value: "tercera_media", label: "classes.terceraMedia" },
  { value: "tercera_baja", label: "classes.terceraBaja" }
];

export function EditClassModal({ class: cls, isOpen, onClose }: EditClassModalProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
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
          <DialogTitle>{t('classes.editClass')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t('classes.className')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label>{t('classes.levelType')}</Label>
              <Select value={levelType} onValueChange={(value: 'numeric' | 'custom') => setLevelType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="numeric">{t('classes.numericLevel')}</SelectItem>
                  <SelectItem value="custom">{t('classes.customLevel')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {levelType === 'numeric' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="level_from">{t('classes.levelFrom')}</Label>
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
                  <Label htmlFor="level_to">{t('classes.levelTo')}</Label>
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
                <Label htmlFor="custom_level">{t('classes.customLevel')}</Label>
                <Select 
                  value={formData.custom_level} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, custom_level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('classes.selectLevel')} />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOM_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {t(level.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">{t('classes.duration')} ({t('classes.minutes')})</Label>
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
                <Label htmlFor="start_time">{t('classes.startTime')}</Label>
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
              <Label>{t('classes.daysOfWeek')}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.days_of_week.map(day => (
                  <Badge key={day} variant="default" className="flex items-center gap-1">
                    {t(DAYS_OF_WEEK.find(d => d.value === day)?.label || day)}
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
                  <SelectValue placeholder={t('classes.addDay')} />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.filter(day => !formData.days_of_week.includes(day.value)).map(day => (
                    <SelectItem key={day.value} value={day.value}>
                      {t(day.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">{t('classes.startDate')}</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_date">{t('classes.endDate')}</Label>
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
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={updateClassMutation.isPending}>
              {updateClassMutation.isPending ? t('classes.saving') : t('classes.saveChanges')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
