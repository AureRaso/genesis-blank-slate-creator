import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, Clock, Users, MapPin, DollarSign, Edit3, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminTrainers } from "@/hooks/useTrainers";
import { useActiveClubs } from "@/hooks/useActiveClubs";
import { useAuth } from "@/contexts/AuthContext";

interface ImprovedBulkClassCreatorProps {
  clubId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface BaseClassConfig {
  name: string;
  level_from: number;
  level_to: number;
  duration_minutes: number;
  monthly_price: number;
  max_participants: number;
  start_date: string;
  end_date: string;
  first_class_date: string;
  first_class_time: string;
}

interface MultiplicationConfig {
  days_of_week: string[];
  time_slots: Array<{ start: string; end: string; interval: number }>;
}

interface GeneratedClass {
  id: string;
  name: string;
  trainer_profile_id: string;
  trainer_name: string;
  court_number: number;
  day_of_week: string;
  start_time: string;
  duration_minutes: number;
  monthly_price: number;
  max_participants: number;
  level_from: number;
  level_to: number;
  selected: boolean;
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

export function ImprovedBulkClassCreator({ clubId: initialClubId, onClose, onSuccess }: ImprovedBulkClassCreatorProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { data: allClubs = [] } = useActiveClubs();
  const { data: allTrainers = [] } = useAdminTrainers();

  // Filter clubs based on user's profile
  // If user has a specific club_id, only show that club
  // Otherwise, for admins without club_id, show all clubs they have access to
  const clubs = profile?.club_id
    ? allClubs.filter(club => club.id === profile.club_id)
    : allClubs;
  
  // Estado para el club seleccionado
  // Priority: initialClubId (passed from parent) > profile.club_id > first available club
  const [selectedClubId, setSelectedClubId] = useState<string>(
    initialClubId || profile?.club_id || ''
  );

  // Update selected club when clubs are loaded or profile changes
  useEffect(() => {
    if (!selectedClubId && clubs.length > 0) {
      setSelectedClubId(clubs[0].id);
    }
  }, [clubs, selectedClubId]);

  // Filter trainers by selected club
  const clubTrainers = allTrainers.filter(trainer =>
    selectedClubId && trainer.trainer_clubs?.some(tc => tc.club_id === selectedClubId)
  );

  // Check if current user can be a trainer
  // Include current user if they are admin or trainer and not already in the list
  const currentUserAsTrainer = profile && (profile.role === 'admin' || profile.role === 'trainer')
    ? {
        id: profile.id,
        profile_id: profile.id,
        specialty: null,
        photo_url: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: {
          id: profile.id,
          full_name: profile.full_name || 'Usuario actual',
          email: profile.email || ''
        },
        trainer_clubs: []
      }
    : null;

  // Combine trainers, adding current user if not already in the list
  const trainers = currentUserAsTrainer && !clubTrainers.some(t => t.profile_id === profile?.id)
    ? [currentUserAsTrainer, ...clubTrainers]
    : clubTrainers;
  
  // Debug logging - más detallado
  console.log('Selected Club ID:', selectedClubId);
  console.log('Trainers loaded:', trainers);
  console.log('Available clubs:', clubs);
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Selected configurations
  const [selectedCourtNumbers, setSelectedCourtNumbers] = useState<number[]>([]);
  const [selectedTrainerIds, setSelectedTrainerIds] = useState<string[]>([]);
  const [baseConfig, setBaseConfig] = useState<BaseClassConfig>({
    name: "",
    level_from: 1,
    level_to: 10,
    duration_minutes: 60,
    monthly_price: 50,
    max_participants: 4,
    start_date: "",
    end_date: "",
    first_class_date: "",
    first_class_time: "10:00"
  });
  
  const [multiplicationConfig, setMultiplicationConfig] = useState<MultiplicationConfig>({
    days_of_week: [],
    time_slots: []
  });
  
  const [generatedClasses, setGeneratedClasses] = useState<GeneratedClass[]>([]);

  const selectedClub = clubs.find(club => club.id === selectedClubId);
  const maxCourts = selectedClub?.court_count || 1;
  const availableCourts = Array.from({ length: maxCourts }, (_, i) => i + 1);

  // Generate classes based on configuration
  const generateClasses = (): GeneratedClass[] => {
    if (!baseConfig.first_class_time || selectedCourtNumbers.length === 0 || selectedTrainerIds.length === 0) {
      return [];
    }

    const classes: GeneratedClass[] = [];
    
    // Create base classes for first time slot
    selectedCourtNumbers.forEach((courtNumber, index) => {
      const trainerId = selectedTrainerIds[index % selectedTrainerIds.length];
      const trainer = trainers.find(t => t.profile_id === trainerId);
      
      classes.push({
        id: `base-${courtNumber}-${baseConfig.first_class_time}`,
        name: `${baseConfig.name} - Pista ${courtNumber}`,
        trainer_profile_id: trainerId,
        trainer_name: trainer?.profiles?.full_name || "Sin asignar",
        court_number: courtNumber,
        day_of_week: "lunes", // Default for first class
        start_time: baseConfig.first_class_time,
        duration_minutes: baseConfig.duration_minutes,
        monthly_price: baseConfig.monthly_price,
        max_participants: baseConfig.max_participants,
        level_from: baseConfig.level_from,
        level_to: baseConfig.level_to,
        selected: true
      });
    });

    // Multiply across time slots and days
    if (multiplicationConfig.days_of_week.length > 0 && multiplicationConfig.time_slots.length > 0) {
      const multipliedClasses: GeneratedClass[] = [];
      
      multiplicationConfig.days_of_week.forEach(day => {
        multiplicationConfig.time_slots.forEach(timeSlot => {
          const [startHour, startMin] = timeSlot.start.split(':').map(Number);
          const [endHour, endMin] = timeSlot.end.split(':').map(Number);
          
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          
          for (let time = startMinutes; time < endMinutes; time += timeSlot.interval) {
            const hour = Math.floor(time / 60);
            const min = time % 60;
            const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
            
            selectedCourtNumbers.forEach((courtNumber, index) => {
              const trainerId = selectedTrainerIds[index % selectedTrainerIds.length];
              const trainer = trainers.find(t => t.profile_id === trainerId);
              
              multipliedClasses.push({
                id: `${day}-${courtNumber}-${timeStr}`,
                name: `${baseConfig.name} - Pista ${courtNumber}`,
                trainer_profile_id: trainerId,
                trainer_name: trainer?.profiles?.full_name || "Sin asignar",
                court_number: courtNumber,
                day_of_week: day,
                start_time: timeStr,
                duration_minutes: baseConfig.duration_minutes,
                monthly_price: baseConfig.monthly_price,
                max_participants: baseConfig.max_participants,
                level_from: baseConfig.level_from,
                level_to: baseConfig.level_to,
                selected: true
              });
            });
          }
        });
      });
      
      return multipliedClasses;
    }
    
    return classes;
  };

  const handleCourtToggle = (courtNumber: number, checked: boolean) => {
    if (checked) {
      if (selectedCourtNumbers.length < selectedTrainerIds.length || selectedTrainerIds.length === 0) {
        setSelectedCourtNumbers(prev => [...prev, courtNumber].sort());
      } else {
        toast({
          title: "Límite alcanzado",
          description: "No puedes seleccionar más pistas que entrenadores disponibles",
          variant: "destructive",
        });
      }
    } else {
      setSelectedCourtNumbers(prev => prev.filter(n => n !== courtNumber));
    }
  };

  const handleTrainerToggle = (trainerId: string, checked: boolean) => {
    if (checked) {
      setSelectedTrainerIds(prev => [...prev, trainerId]);
    } else {
      setSelectedTrainerIds(prev => prev.filter(id => id !== trainerId));
      // If removing trainers, also limit courts
      if (selectedCourtNumbers.length > selectedTrainerIds.length - 1) {
        setSelectedCourtNumbers(prev => prev.slice(0, selectedTrainerIds.length - 1));
      }
    }
  };

  const addTimeSlot = () => {
    setMultiplicationConfig(prev => ({
      ...prev,
      time_slots: [...prev.time_slots, { start: "10:00", end: "22:00", interval: 60 }]
    }));
  };

  const updateTimeSlot = (index: number, updates: Partial<{ start: string; end: string; interval: number }>) => {
    setMultiplicationConfig(prev => ({
      ...prev,
      time_slots: prev.time_slots.map((slot, i) => i === index ? { ...slot, ...updates } : slot)
    }));
  };

  const removeTimeSlot = (index: number) => {
    setMultiplicationConfig(prev => ({
      ...prev,
      time_slots: prev.time_slots.filter((_, i) => i !== index)
    }));
  };

  const updateGeneratedClass = (id: string, updates: Partial<GeneratedClass>) => {
    setGeneratedClasses(prev => 
      prev.map(cls => cls.id === id ? { ...cls, ...updates } : cls)
    );
  };

  const toggleClassSelection = (id: string) => {
    setGeneratedClasses(prev => 
      prev.map(cls => cls.id === id ? { ...cls, selected: !cls.selected } : cls)
    );
  };

  const createClasses = async () => {
    const selectedClasses = generatedClasses.filter(cls => cls.selected);
    if (selectedClasses.length === 0) return;

    setIsCreating(true);
    setProgress(0);

    try {
      const classesToCreate = selectedClasses.map(cls => ({
        name: cls.name,
        level_from: cls.level_from,
        level_to: cls.level_to,
        duration_minutes: cls.duration_minutes,
        start_time: cls.start_time,
        days_of_week: [cls.day_of_week],
        start_date: baseConfig.start_date,
        end_date: baseConfig.end_date,
        recurrence_type: "weekly",
        trainer_profile_id: cls.trainer_profile_id,
        club_id: selectedClubId,
        court_number: cls.court_number,
        monthly_price: cls.monthly_price,
        max_participants: cls.max_participants
      }));

      const { data, error } = await supabase.functions.invoke('intelligent-bulk-create-classes', {
        body: {
          classes: classesToCreate,
          base_config: baseConfig
        }
      });

      if (error) throw error;

      setProgress(100);
      toast({
        title: "Clases creadas exitosamente",
        description: `Se crearon ${selectedClasses.length} clases programadas`,
      });

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Error creating classes:', error);
      toast({
        title: "Error al crear clases",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Auto-generate classes when configuration changes
  useMemo(() => {
    if (step === 2 || step === 3) {
      const newClasses = generateClasses();
      setGeneratedClasses(newClasses);
    }
  }, [baseConfig, multiplicationConfig, selectedCourtNumbers, selectedTrainerIds, step]);

  // STEP 1: Base Configuration
  if (step === 1) {
    return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Configuración Inteligente</h3>
            <p className="text-sm text-muted-foreground">
              Selecciona club, pistas, entrenadores y configuración base
            </p>
          </div>

          {/* Club Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Seleccionar Club
              </CardTitle>
              <CardDescription>
                Elige el club donde se crearán las clases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Courts Selection - Solo mostrar si hay club seleccionado */}
          {selectedClubId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Pistas Seleccionadas ({selectedCourtNumbers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3">
                  {Array.from({ length: clubs.find(c => c.id === selectedClubId)?.court_count || 8 }, (_, i) => i + 1).map((courtNumber) => (
                    <div key={courtNumber} className="flex items-center space-x-2">
                      <Checkbox
                        id={`court-${courtNumber}`}
                        checked={selectedCourtNumbers.includes(courtNumber)}
                        onCheckedChange={(checked) => handleCourtToggle(courtNumber, !!checked)}
                      />
                      <Label htmlFor={`court-${courtNumber}`} className="text-sm">
                        Pista {courtNumber}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trainers Selection - Solo mostrar si hay club seleccionado */}
          {selectedClubId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Entrenadores Seleccionados ({selectedTrainerIds.length})
                </CardTitle>
                <CardDescription>
                  Máximo: {selectedCourtNumbers.length} entrenadores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {trainers.map((trainer) => (
                    <div key={trainer.profile_id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`trainer-${trainer.profile_id}`}
                        checked={selectedTrainerIds.includes(trainer.profile_id)}
                        onCheckedChange={(checked) => handleTrainerToggle(trainer.profile_id, !!checked)}
                        disabled={!selectedTrainerIds.includes(trainer.profile_id) && selectedTrainerIds.length >= selectedCourtNumbers.length && selectedCourtNumbers.length > 0}
                      />
                      <Label htmlFor={`trainer-${trainer.profile_id}`} className="text-sm">
                        {trainer.profiles?.full_name || "Sin nombre"}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        {/* Base Class Config */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre base de las clases</Label>
            <Input
              id="name"
              value={baseConfig.name}
              onChange={(e) => setBaseConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Clase de Pádel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="first_time">Hora de la primera clase</Label>
            <Input
              id="first_time"
              type="time"
              value={baseConfig.first_class_time}
              onChange={(e) => setBaseConfig(prev => ({ ...prev, first_class_time: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duración (minutos)</Label>
            <Input
              id="duration"
              type="number"
              min="30"
              max="120"
              value={baseConfig.duration_minutes}
              onChange={(e) => setBaseConfig(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Precio mensual</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={baseConfig.monthly_price}
              onChange={(e) => setBaseConfig(prev => ({ ...prev, monthly_price: parseFloat(e.target.value) || 0 }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="participants">Máximo participantes</Label>
            <Input
              id="participants"
              type="number"
              min="1"
              max="8"
              value={baseConfig.max_participants}
              onChange={(e) => setBaseConfig(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 4 }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level_from">Nivel desde</Label>
            <Input
              id="level_from"
              type="number"
              min="1"
              max="10"
              value={baseConfig.level_from}
              onChange={(e) => setBaseConfig(prev => ({ ...prev, level_from: parseInt(e.target.value) || 1 }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Fecha de inicio</Label>
            <Input
              id="start_date"
              type="date"
              value={baseConfig.start_date}
              onChange={(e) => setBaseConfig(prev => ({ ...prev, start_date: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">Fecha de fin</Label>
            <Input
              id="end_date"
              type="date"
              value={baseConfig.end_date}
              onChange={(e) => setBaseConfig(prev => ({ ...prev, end_date: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={() => setStep(2)}
            disabled={
              !baseConfig.name || 
              selectedCourtNumbers.length === 0 || 
              selectedTrainerIds.length === 0 ||
              !baseConfig.start_date || 
              !baseConfig.end_date
            }
          >
            Siguiente: Multiplicar
          </Button>
        </div>
      </div>
    );
  }

  // STEP 2: Multiplication Configuration
  if (step === 2) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Multiplicación Inteligente</h3>
          <p className="text-sm text-muted-foreground">
            Define tramos horarios y días para generar múltiples clases
          </p>
        </div>

        {/* Generated base classes preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Clases Base Generadas</CardTitle>
            <CardDescription>
              {selectedCourtNumbers.length} clases en {selectedCourtNumbers.length} pistas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedCourtNumbers.map((courtNumber, index) => {
                const trainerId = selectedTrainerIds[index % selectedTrainerIds.length];
                const trainer = trainers.find(t => t.profile_id === trainerId);
                return (
                  <Badge key={courtNumber} variant="secondary" className="mr-2">
                    Pista {courtNumber} - {trainer?.profiles?.full_name || "Sin asignar"} - {baseConfig.first_class_time}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Time slots configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tramos Horarios</CardTitle>
            <Button variant="outline" size="sm" onClick={addTimeSlot}>
              Agregar Tramo
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {multiplicationConfig.time_slots.map((slot, index) => (
              <div key={index} className="grid grid-cols-4 gap-3 items-end">
                <div className="space-y-2">
                  <Label>Desde</Label>
                  <Input
                    type="time"
                    value={slot.start}
                    onChange={(e) => updateTimeSlot(index, { start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hasta</Label>
                  <Input
                    type="time"
                    value={slot.end}
                    onChange={(e) => updateTimeSlot(index, { end: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Intervalo</Label>
                  <Select
                    value={slot.interval.toString()}
                    onValueChange={(value) => updateTimeSlot(index, { interval: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="90">1.5 horas</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeTimeSlot(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Days selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Días de la Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {DAYS_OPTIONS.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={day.value}
                    checked={multiplicationConfig.days_of_week.includes(day.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setMultiplicationConfig(prev => ({
                          ...prev,
                          days_of_week: [...prev.days_of_week, day.value]
                        }));
                      } else {
                        setMultiplicationConfig(prev => ({
                          ...prev,
                          days_of_week: prev.days_of_week.filter(d => d !== day.value)
                        }));
                      }
                    }}
                  />
                  <Label htmlFor={day.value} className="text-sm">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preview of generated classes */}
        {generatedClasses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Vista Previa</CardTitle>
              <CardDescription>
                Se generarán {generatedClasses.length} clases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {generatedClasses.slice(0, 12).map((cls) => (
                  <Badge key={cls.id} variant="secondary" className="justify-start text-xs">
                    {cls.day_of_week} {cls.start_time} P{cls.court_number}
                  </Badge>
                ))}
                {generatedClasses.length > 12 && (
                  <Badge variant="outline">
                    +{generatedClasses.length - 12} más...
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
            disabled={generatedClasses.length === 0}
          >
            Editar Individualmente
          </Button>
        </div>
      </div>
    );
  }

  // STEP 3: Individual Editing
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Edición Individual</h3>
        <p className="text-sm text-muted-foreground">
          Modifica cada clase individualmente antes de crear
        </p>
      </div>

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

      <div className="rounded-md border max-h-96 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={generatedClasses.every(cls => cls.selected)}
                  onCheckedChange={(checked) => {
                    setGeneratedClasses(prev => 
                      prev.map(cls => ({ ...cls, selected: !!checked }))
                    );
                  }}
                />
              </TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Día</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Pista</TableHead>
              <TableHead>Entrenador</TableHead>
              <TableHead>Precio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {generatedClasses.map((cls) => (
              <TableRow key={cls.id}>
                <TableCell>
                  <Checkbox
                    checked={cls.selected}
                    onCheckedChange={() => toggleClassSelection(cls.id)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={cls.name}
                    onChange={(e) => updateGeneratedClass(cls.id, { name: e.target.value })}
                    className="min-w-[150px]"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={cls.day_of_week}
                    onValueChange={(value) => updateGeneratedClass(cls.id, { day_of_week: value })}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OPTIONS.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="time"
                    value={cls.start_time}
                    onChange={(e) => updateGeneratedClass(cls.id, { start_time: e.target.value })}
                    className="w-[120px]"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={cls.court_number.toString()}
                    onValueChange={(value) => updateGeneratedClass(cls.id, { court_number: parseInt(value) })}
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCourts.map((court) => (
                        <SelectItem key={court} value={court.toString()}>
                          {court}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={cls.trainer_profile_id}
                    onValueChange={(value) => {
                      const trainer = trainers.find(t => t.profile_id === value);
                      updateGeneratedClass(cls.id, { 
                        trainer_profile_id: value,
                        trainer_name: trainer?.profiles?.full_name || "Sin asignar"
                      });
                    }}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {trainers.map((trainer) => (
                        <SelectItem key={trainer.profile_id} value={trainer.profile_id}>
                          {trainer.profiles?.full_name || "Sin nombre"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={cls.monthly_price}
                    onChange={(e) => updateGeneratedClass(cls.id, { monthly_price: parseFloat(e.target.value) || 0 })}
                    className="w-[80px]"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep(2)} disabled={isCreating}>
            Anterior
          </Button>
          <Badge variant="secondary">
            {generatedClasses.filter(cls => cls.selected).length} clases seleccionadas
          </Badge>
        </div>
        <Button 
          onClick={createClasses} 
          disabled={isCreating || generatedClasses.filter(cls => cls.selected).length === 0}
        >
          {isCreating ? "Creando..." : `Crear ${generatedClasses.filter(cls => cls.selected).length} Clases`}
        </Button>
      </div>
    </div>
  );
}