
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X, Plus, Lock, Calendar, CalendarDays } from "lucide-react";
import { useUpdateScheduledClass, useUpdateScheduledClassSeries, useSeriesClassCount, calculateDaysDifference } from "@/hooks/useScheduledClasses";
import { useClassParticipants } from "@/hooks/useProgrammedClasses";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { format, parseISO, addDays } from "date-fns";
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
  const updateSeriesMutation = useUpdateScheduledClassSeries();
  const { data: participants } = useClassParticipants(cls.id);
  const { data: seriesCount } = useSeriesClassCount(cls.id, isOpen);

  // Store original day to detect changes
  const originalDay = cls.days_of_week?.[0] || '';

  const [formData, setFormData] = useState({
    name: cls.name,
    level_from: cls.level_from || undefined,
    level_to: cls.level_to || undefined,
    custom_level: cls.custom_level || "",
    duration_minutes: cls.duration_minutes,
    start_time: cls.start_time,
    days_of_week: cls.days_of_week,
    start_date: cls.start_date,
    end_date: cls.end_date,
    is_open: cls.is_open ?? false
  });

  const [levelType, setLevelType] = useState<'numeric' | 'custom'>(
    cls.custom_level ? 'custom' : 'numeric'
  );

  // Update scope: 'single' = only this class, 'all' = all classes in series
  const [updateScope, setUpdateScope] = useState<'single' | 'all'>('single');

  // Check if day has changed
  const currentDay = formData.days_of_week?.[0] || '';
  const dayHasChanged = originalDay !== currentDay && currentDay !== '';

  // Auto-adjust dates when day changes (only for single class update)
  useEffect(() => {
    if (dayHasChanged && updateScope === 'single') {
      const daysDiff = calculateDaysDifference(originalDay, currentDay);
      if (daysDiff !== 0) {
        const newStartDate = addDays(parseISO(cls.start_date), daysDiff);
        const newEndDate = addDays(parseISO(cls.end_date), daysDiff);
        setFormData(prev => ({
          ...prev,
          start_date: format(newStartDate, 'yyyy-MM-dd'),
          end_date: format(newEndDate, 'yyyy-MM-dd')
        }));
      }
    }
  }, [currentDay, originalDay, dayHasChanged, updateScope, cls.start_date, cls.end_date]);

  // Calcular plazas disponibles
  const activeParticipants = participants?.filter((p: any) => p.status === 'active').length || 0;
  const maxParticipants = cls.max_participants || 0;
  const availableSpots = maxParticipants - activeParticipants;
  const hasSpots = availableSpots > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const updateData = {
        ...formData,
        level_from: levelType === 'numeric' ? formData.level_from : undefined,
        level_to: levelType === 'numeric' ? formData.level_to : undefined,
        custom_level: levelType === 'custom' ? formData.custom_level : undefined,
        is_open: formData.is_open
      };

      if (updateScope === 'single') {
        // Update only this class
        await updateClassMutation.mutateAsync({
          id: cls.id,
          data: updateData
        });
      } else {
        // Update all classes in the series
        // For series update, we don't include start_date/end_date in updateData
        // because each class will have its dates adjusted individually based on day change
        const { start_date, end_date, ...seriesUpdateData } = updateData;

        await updateSeriesMutation.mutateAsync({
          id: cls.id,
          data: seriesUpdateData,
          originalDay: dayHasChanged ? originalDay : undefined,
          newDay: dayHasChanged ? currentDay : undefined
        });
      }

      onClose();
    } catch (error) {
      console.error('Error updating class:', error);
    }
  };

  const isSubmitting = updateClassMutation.isPending || updateSeriesMutation.isPending;

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

            <div className="space-y-3 pt-4 border-t">
              <Label className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Clase Abierta para Reservas
              </Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {formData.is_open
                        ? "✓ Los jugadores pueden ver y reservar esta clase en 'Clases Disponibles'"
                        : "✗ Esta clase no aparecerá en 'Clases Disponibles' para los jugadores"}
                    </p>
                    {!hasSpots && (
                      <p className="text-sm text-orange-600 font-medium mt-2">
                        ⚠️ No hay plazas disponibles ({activeParticipants}/{maxParticipants} ocupadas)
                      </p>
                    )}
                    {hasSpots && formData.is_open && (
                      <p className="text-sm text-green-600 font-medium mt-2">
                        {availableSpots} plaza{availableSpots !== 1 ? 's' : ''} disponible{availableSpots !== 1 ? 's' : ''} para nuevos jugadores
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={formData.is_open}
                    onCheckedChange={(checked) => {
                      if (checked && !hasSpots) {
                        toast({
                          title: "No se puede abrir la clase",
                          description: "No hay plazas disponibles. La clase está completa.",
                          variant: "destructive",
                        });
                        return;
                      }
                      setFormData(prev => ({ ...prev, is_open: checked }));
                    }}
                    disabled={!hasSpots && !formData.is_open}
                  />
                </div>
              </div>
            </div>

            {/* Update scope selector - only show if there are multiple classes in series */}
            {seriesCount && seriesCount > 1 && (
              <div className="space-y-3 pt-4 border-t">
                <Label className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {t('classes.updateScope', '¿Qué clases quieres modificar?')}
                </Label>
                <RadioGroup
                  value={updateScope}
                  onValueChange={(value: 'single' | 'all') => setUpdateScope(value)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="single" id="scope-single" />
                    <Label htmlFor="scope-single" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{t('classes.updateSingle', 'Solo esta clase')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('classes.updateSingleDesc', 'Los cambios solo afectarán a esta clase específica')}
                      </p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="all" id="scope-all" />
                    <Label htmlFor="scope-all" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        <span>{t('classes.updateAll', 'Todas las clases de la serie')}</span>
                        <Badge variant="secondary" className="ml-2">
                          {seriesCount} {t('classes.classes', 'clases')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {dayHasChanged
                          ? t('classes.updateAllWithDayChange', 'Las fechas de todas las clases se ajustarán automáticamente al nuevo día')
                          : t('classes.updateAllDesc', 'Los cambios se aplicarán a todas las clases de esta serie')}
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('classes.saving') : t('classes.saveChanges')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
