import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Clock, Users, MapPin, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTrainers } from "@/hooks/useTrainers";

interface BulkClassCreatorProps {
  clubId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface BulkClassConfig {
  name: string;
  level_from: number;
  level_to: number;
  duration_minutes: number;
  trainer_profile_id: string;
  court_number: number;
  monthly_price: number;
  max_participants: number;
  start_date: string;
  end_date: string;
  recurrence_type: string;
  
  // Configuración masiva
  start_time: string;
  end_time: string;
  interval_minutes: number;
  days_of_week: string[];
}

interface ClassPreview {
  name: string;
  day: string;
  time: string;
  court: number;
}

const DAYS_OPTIONS = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miércoles", label: "Miércoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sábado", label: "Sábado" },
  { value: "domingo", label: "Domingo" }
];

export function BulkClassCreator({ clubId, onClose, onSuccess }: BulkClassCreatorProps) {
  const { toast } = useToast();
  const { data: trainers = [] } = useTrainers();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [config, setConfig] = useState<BulkClassConfig>({
    name: "",
    level_from: 1,
    level_to: 10,
    duration_minutes: 60,
    trainer_profile_id: "",
    court_number: 1,
    monthly_price: 50,
    max_participants: 4,
    start_date: "",
    end_date: "",
    recurrence_type: "weekly",
    start_time: "10:00",
    end_time: "22:00",
    interval_minutes: 60,
    days_of_week: []
  });

  // Generar vista previa de clases
  const generatePreview = (): ClassPreview[] => {
    if (!config.start_time || !config.end_time || config.days_of_week.length === 0) {
      return [];
    }

    const previews: ClassPreview[] = [];
    const [startHour, startMin] = config.start_time.split(':').map(Number);
    const [endHour, endMin] = config.end_time.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    for (const day of config.days_of_week) {
      for (let time = startMinutes; time < endMinutes; time += config.interval_minutes) {
        const hour = Math.floor(time / 60);
        const min = time % 60;
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        
        previews.push({
          name: `${config.name} - Pista ${config.court_number}`,
          day: day.charAt(0).toUpperCase() + day.slice(1),
          time: timeStr,
          court: config.court_number
        });
      }
    }
    
    return previews;
  };

  const preview = generatePreview();

  const handleDayToggle = (day: string, checked: boolean) => {
    if (checked) {
      setConfig(prev => ({
        ...prev,
        days_of_week: [...prev.days_of_week, day]
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        days_of_week: prev.days_of_week.filter(d => d !== day)
      }));
    }
  };

  const createClasses = async () => {
    if (preview.length === 0) return;

    setIsCreating(true);
    setProgress(0);

    try {
      const { data, error } = await supabase.functions.invoke('bulk-create-classes', {
        body: {
          config: {
            ...config,
            club_id: clubId
          },
          preview_count: preview.length
        }
      });

      if (error) throw error;

      setProgress(100);
      toast({
        title: "Clases creadas exitosamente",
        description: `Se crearon ${preview.length} clases programadas`,
      });

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Error creating bulk classes:', error);
      toast({
        title: "Error al crear clases",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (step === 1) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Configuración Base</h3>
          <p className="text-sm text-muted-foreground">
            Define los parámetros generales para todas las clases
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la clase</Label>
            <Input
              id="name"
              value={config.name}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Clase"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trainer">Entrenador</Label>
            <Select
              value={config.trainer_profile_id}
              onValueChange={(value) => setConfig(prev => ({ ...prev, trainer_profile_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar entrenador" />
              </SelectTrigger>
              <SelectContent>
                {trainers.map((trainer) => (
                  <SelectItem key={trainer.profile_id} value={trainer.profile_id}>
                    {trainer.profiles?.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="court">Número de pista</Label>
            <Input
              id="court"
              type="number"
              min="1"
              value={config.court_number}
              onChange={(e) => setConfig(prev => ({ ...prev, court_number: parseInt(e.target.value) || 1 }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duración (minutos)</Label>
            <Input
              id="duration"
              type="number"
              min="30"
              max="120"
              value={config.duration_minutes}
              onChange={(e) => setConfig(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Precio mensual</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={config.monthly_price}
              onChange={(e) => setConfig(prev => ({ ...prev, monthly_price: parseFloat(e.target.value) || 0 }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="participants">Máximo participantes</Label>
            <Input
              id="participants"
              type="number"
              min="1"
              max="8"
              value={config.max_participants}
              onChange={(e) => setConfig(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 4 }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Fecha de inicio</Label>
            <Input
              id="start_date"
              type="date"
              value={config.start_date}
              onChange={(e) => setConfig(prev => ({ ...prev, start_date: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">Fecha de fin</Label>
            <Input
              id="end_date"
              type="date"
              value={config.end_date}
              onChange={(e) => setConfig(prev => ({ ...prev, end_date: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={() => setStep(2)}
            disabled={!config.name || !config.trainer_profile_id || !config.start_date || !config.end_date}
          >
            Siguiente
          </Button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Configuración de Horarios</h3>
          <p className="text-sm text-muted-foreground">
            Define los horarios y días para la creación masiva
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_time">Hora de inicio</Label>
            <Input
              id="start_time"
              type="time"
              value={config.start_time}
              onChange={(e) => setConfig(prev => ({ ...prev, start_time: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_time">Hora de fin</Label>
            <Input
              id="end_time"
              type="time"
              value={config.end_time}
              onChange={(e) => setConfig(prev => ({ ...prev, end_time: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interval">Intervalo (minutos)</Label>
            <Select
              value={config.interval_minutes.toString()}
              onValueChange={(value) => setConfig(prev => ({ ...prev, interval_minutes: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1.5 horas</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Días de la semana</Label>
          <div className="grid grid-cols-4 gap-3">
            {DAYS_OPTIONS.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={day.value}
                  checked={config.days_of_week.includes(day.value)}
                  onCheckedChange={(checked) => handleDayToggle(day.value, !!checked)}
                />
                <Label htmlFor={day.value} className="text-sm">
                  {day.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {preview.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Vista Previa</CardTitle>
              <CardDescription>
                Se crearán {preview.length} clases programadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {preview.slice(0, 10).map((item, index) => (
                  <Badge key={index} variant="secondary" className="justify-start">
                    {item.day} {item.time}
                  </Badge>
                ))}
                {preview.length > 10 && (
                  <Badge variant="outline">
                    +{preview.length - 10} más...
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(1)}>
            Anterior
          </Button>
          <Button 
            onClick={() => setStep(3)}
            disabled={config.days_of_week.length === 0 || !config.start_time || !config.end_time}
          >
            Revisar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Confirmación</h3>
        <p className="text-sm text-muted-foreground">
          Revisa la configuración antes de crear las clases
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Configuración General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nombre:</span>
              <span>{config.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entrenador:</span>
              <span>{trainers.find(t => t.profile_id === config.trainer_profile_id)?.profiles?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duración:</span>
              <span>{config.duration_minutes} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Precio mensual:</span>
              <span>€{config.monthly_price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Período:</span>
              <span>{config.start_date} - {config.end_date}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horarios Masivos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Horario:</span>
              <span>{config.start_time} - {config.end_time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Intervalo:</span>
              <span>Cada {config.interval_minutes} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Días:</span>
              <span>{config.days_of_week.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total clases:</span>
              <span className="font-semibold">{preview.length}</span>
            </div>
          </CardContent>
        </Card>

        {isCreating && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Creando clases...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(2)} disabled={isCreating}>
          Anterior
        </Button>
        <Button onClick={createClasses} disabled={isCreating || preview.length === 0}>
          {isCreating ? "Creando..." : `Crear ${preview.length} Clases`}
        </Button>
      </div>
    </div>
  );
}