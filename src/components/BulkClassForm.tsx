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
import { MapPin, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminTrainers } from "@/hooks/useTrainers";
import { useActiveClubs } from "@/hooks/useActiveClubs";
import { useAuth } from "@/contexts/AuthContext";
import { StudentAssignmentStep } from "@/components/StudentAssignmentStep";
import { parseISO, addDays, format } from "date-fns";
import { es } from "date-fns/locale";

interface BulkClassFormProps {
  clubId?: string;
  onSuccess: () => void;
  onDataChange?: (data: BulkClassFormData) => void;
}

export interface BulkClassFormData {
  clubName?: string;
  selectedCourtNumbers: number[];
  selectedTrainerNames: string[];
  baseConfig: {
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
  };
  multiplicationConfig: {
    days_of_week: string[];
    time_slots: Array<{ start: string; end: string; interval: number }>;
  };
  generatedClasses: Array<{
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
    participant_ids?: string[];
    specific_date?: string; // Date in format YYYY-MM-DD for individual classes
  }>;
  step: 1 | 2 | 3 | 4;
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

export function BulkClassForm({ clubId: initialClubId, onSuccess, onDataChange }: BulkClassFormProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { data: allClubs = [] } = useActiveClubs();
  const { data: allTrainers = [] } = useAdminTrainers();

  const clubs = profile?.club_id
    ? allClubs.filter(club => club.id === profile.club_id)
    : allClubs;

  const [selectedClubId, setSelectedClubId] = useState<string>(
    initialClubId || profile?.club_id || ''
  );

  useEffect(() => {
    if (!selectedClubId && clubs.length > 0) {
      setSelectedClubId(clubs[0].id);
    }
  }, [clubs, selectedClubId]);

  const clubTrainers = allTrainers.filter(trainer =>
    selectedClubId && trainer.trainer_clubs?.some(tc => tc.club_id === selectedClubId)
  );

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

  const trainers = currentUserAsTrainer && !clubTrainers.some(t => t.profile_id === profile?.id)
    ? [currentUserAsTrainer, ...clubTrainers]
    : clubTrainers;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);

  const [selectedCourtNumbers, setSelectedCourtNumbers] = useState<number[]>([]);
  const [selectedTrainerIds, setSelectedTrainerIds] = useState<string[]>([]);
  const [baseConfig, setBaseConfig] = useState({
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

  const [multiplicationConfig, setMultiplicationConfig] = useState({
    days_of_week: [] as string[],
    time_slots: [] as Array<{ start: string; end: string; interval: number }>
  });

  const [generatedClasses, setGeneratedClasses] = useState<BulkClassFormData['generatedClasses']>([]);

  const selectedClub = clubs.find(club => club.id === selectedClubId);
  const maxCourts = selectedClub?.court_count || 1;
  const availableCourts = Array.from({ length: maxCourts }, (_, i) => i + 1);

  // Helper function to get specific dates based on day of week
  const getSpecificDates = (startDateStr: string, endDateStr: string, dayOfWeekStr: string): string[] => {
    if (!startDateStr || !endDateStr) return [];

    const dayMap: Record<string, number> = {
      'domingo': 0, 'lunes': 1, 'martes': 2, 'miércoles': 3,
      'jueves': 4, 'viernes': 5, 'sábado': 6
    };

    const targetDay = dayMap[dayOfWeekStr.toLowerCase()];
    if (targetDay === undefined) return [];

    const dates: string[] = [];
    const startDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);
    let currentDate = startDate;

    while (currentDate <= endDate) {
      if (currentDate.getDay() === targetDay) {
        dates.push(format(currentDate, 'yyyy-MM-dd'));
      }
      currentDate = addDays(currentDate, 1);
    }

    return dates;
  };

  const generateClasses = (): BulkClassFormData['generatedClasses'] => {
    if (!baseConfig.first_class_time || selectedCourtNumbers.length === 0 || selectedTrainerIds.length === 0) {
      return [];
    }

    const classes: BulkClassFormData['generatedClasses'] = [];

    selectedCourtNumbers.forEach((courtNumber, index) => {
      const trainerId = selectedTrainerIds[index % selectedTrainerIds.length];
      const trainer = trainers.find(t => t.profile_id === trainerId);

      classes.push({
        id: `base-${courtNumber}-${baseConfig.first_class_time}`,
        name: `${baseConfig.name} - Pista ${courtNumber}`,
        trainer_profile_id: trainerId,
        trainer_name: trainer?.profiles?.full_name || "Sin asignar",
        court_number: courtNumber,
        day_of_week: "lunes",
        start_time: baseConfig.first_class_time,
        duration_minutes: baseConfig.duration_minutes,
        monthly_price: baseConfig.monthly_price,
        max_participants: baseConfig.max_participants,
        level_from: baseConfig.level_from,
        level_to: baseConfig.level_to,
        selected: true
      });
    });

    if (multiplicationConfig.days_of_week.length > 0 && multiplicationConfig.time_slots.length > 0) {
      const multipliedClasses: BulkClassFormData['generatedClasses'] = [];

      multiplicationConfig.days_of_week.forEach(day => {
        // Get all specific dates for this day of week within the period
        const specificDates = getSpecificDates(baseConfig.start_date, baseConfig.end_date, day);

        multiplicationConfig.time_slots.forEach(timeSlot => {
          const [startHour, startMin] = timeSlot.start.split(':').map(Number);
          const [endHour, endMin] = timeSlot.end.split(':').map(Number);

          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;

          for (let time = startMinutes; time < endMinutes; time += timeSlot.interval) {
            const hour = Math.floor(time / 60);
            const min = time % 60;
            const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

            // For each specific date
            specificDates.forEach(specificDate => {
              selectedCourtNumbers.forEach((courtNumber, index) => {
                const trainerId = selectedTrainerIds[index % selectedTrainerIds.length];
                const trainer = trainers.find(t => t.profile_id === trainerId);

                multipliedClasses.push({
                  id: `${specificDate}-${courtNumber}-${timeStr}`,
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
                  selected: true,
                  specific_date: specificDate // Add specific date field
                });
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

  // Validation: Check if time slots intervals are compatible with class duration
  const timeSlotsValidation = useMemo(() => {
    const duration = baseConfig.duration_minutes;
    const incompatibleSlots = multiplicationConfig.time_slots.filter(slot => {
      // The interval must be a multiple of the duration, or the duration must be a multiple of the interval
      return slot.interval % duration !== 0 && duration % slot.interval !== 0;
    });

    return {
      isValid: incompatibleSlots.length === 0,
      incompatibleSlots
    };
  }, [baseConfig.duration_minutes, multiplicationConfig.time_slots]);

  const removeTimeSlot = (index: number) => {
    setMultiplicationConfig(prev => ({
      ...prev,
      time_slots: prev.time_slots.filter((_, i) => i !== index)
    }));
  };

  const updateGeneratedClass = (id: string, updates: Partial<BulkClassFormData['generatedClasses'][0]>) => {
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
        // Use specific_date for both start and end to create single-day classes
        start_date: cls.specific_date || baseConfig.start_date,
        end_date: cls.specific_date || baseConfig.end_date,
        recurrence_type: cls.specific_date ? "once" : "weekly",
        trainer_profile_id: cls.trainer_profile_id,
        club_id: selectedClubId,
        court_number: cls.court_number,
        monthly_price: cls.monthly_price,
        max_participants: cls.max_participants,
        participant_ids: cls.participant_ids || []
      }));

      console.log('🔵 Classes to create:', classesToCreate);
      console.log('🔵 Total classes to create:', classesToCreate.length);
      console.log('🔵 Class details:', classesToCreate.map(c => ({
        name: c.name,
        date: c.start_date,
        day: c.days_of_week[0],
        time: c.start_time,
        court: c.court_number,
        type: c.recurrence_type
      })));
      console.log('🔵 Participants summary:', classesToCreate.map(c => ({
        name: c.name,
        date: c.start_date,
        participants: c.participant_ids?.length || 0
      })));

      const { data, error } = await supabase.functions.invoke('intelligent-bulk-create-classes', {
        body: {
          classes: classesToCreate,
          base_config: baseConfig
        }
      });

      console.log('🔵 Edge function response:', data);

      if (data?.failed_classes && data.failed_classes.length > 0) {
        console.error('🔴 Failed classes:', data.failed_classes);
        data.failed_classes.forEach((fc: any) => {
          console.error(`  ❌ ${fc.class_name}: ${fc.error}`);
        });
      }

      if (error) throw error;

      if (data?.failed_classes && data.failed_classes.length > 0 && data.successful_classes.length === 0) {
        throw new Error(`Todas las clases fallaron. Primer error: ${data.failed_classes[0].error}`);
      }

      setProgress(100);
      const totalParticipants = selectedClasses.reduce((sum, cls) => sum + (cls.participant_ids?.length || 0), 0);
      toast({
        title: "Clases creadas exitosamente",
        description: `Se crearon ${selectedClasses.length} clases programadas${totalParticipants > 0 ? ` con ${totalParticipants} alumnos asignados` : ''}`,
      });

      setTimeout(() => {
        onSuccess();
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

  // Auto-generate classes and notify parent
  useMemo(() => {
    if (step === 2 || step === 3) {
      const newClasses = generateClasses();
      setGeneratedClasses(newClasses);
    }
  }, [baseConfig, multiplicationConfig, selectedCourtNumbers, selectedTrainerIds, step]);

  // Notify parent of data changes
  useEffect(() => {
    if (onDataChange) {
      const selectedTrainerNames = selectedTrainerIds
        .map(id => trainers.find(t => t.profile_id === id)?.profiles?.full_name || "Sin nombre")
        .filter(Boolean);

      onDataChange({
        clubName: selectedClub?.name,
        selectedCourtNumbers,
        selectedTrainerNames,
        baseConfig,
        multiplicationConfig,
        generatedClasses,
        step
      });
    }
  }, [selectedClubId, selectedCourtNumbers, selectedTrainerIds, baseConfig, multiplicationConfig, generatedClasses, step]);

  // STEP 1: Base Configuration
  if (step === 1) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">Configuración Inteligente</h3>
            </div>
            {/* Step indicator */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                1
              </div>
              <div className={`h-[2px] w-6 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                2
              </div>
              <div className={`h-[2px] w-6 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                3
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Club
              </Label>
              <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre base de las clases</Label>
              <Input
                id="name"
                value={baseConfig.name}
                onChange={(e) => setBaseConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Clase de Pádel"
              />
            </div>
          </div>

          {selectedClubId && (
            <>
              {/* Section: Pistas y Entrenadores */}
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">RECURSOS</h4>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-base">
                      <MapPin className="h-4 w-4" />
                      Pistas ({selectedCourtNumbers.length})
                    </Label>
                    <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-muted/30">
                      {Array.from({ length: clubs.find(c => c.id === selectedClubId)?.court_count || 8 }, (_, i) => i + 1).map((courtNumber) => (
                        <div key={courtNumber} className="flex items-center space-x-2">
                          <Checkbox
                            id={`court-${courtNumber}`}
                            checked={selectedCourtNumbers.includes(courtNumber)}
                            onCheckedChange={(checked) => handleCourtToggle(courtNumber, !!checked)}
                          />
                          <Label htmlFor={`court-${courtNumber}`} className="text-sm cursor-pointer">
                            Pista {courtNumber}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-base">
                        Entrenadores ({selectedTrainerIds.length})
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Máximo: {selectedCourtNumbers.length} entrenadores
                      </p>
                    </div>
                    <div className="space-y-2 p-4 border rounded-lg bg-muted/30 max-h-48 overflow-y-auto">
                      {trainers.map((trainer) => (
                        <div key={trainer.profile_id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`trainer-${trainer.profile_id}`}
                            checked={selectedTrainerIds.includes(trainer.profile_id)}
                            onCheckedChange={(checked) => handleTrainerToggle(trainer.profile_id, !!checked)}
                            disabled={!selectedTrainerIds.includes(trainer.profile_id) && selectedTrainerIds.length >= selectedCourtNumbers.length && selectedCourtNumbers.length > 0}
                          />
                          <Label htmlFor={`trainer-${trainer.profile_id}`} className="text-sm cursor-pointer">
                            {trainer.profiles?.full_name || "Sin nombre"}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Configuración de Clase */}
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">CONFIGURACIÓN DE CLASE</h4>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duración (min)</Label>
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
                    <Label htmlFor="participants">Max. participantes</Label>
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
                    <Label htmlFor="price">Precio mensual (€)</Label>
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
                    <Label>Nivel de juego</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="level_from"
                        type="number"
                        min="1"
                        max="10"
                        step="0.5"
                        value={baseConfig.level_from}
                        onChange={(e) => setBaseConfig(prev => ({ ...prev, level_from: parseFloat(e.target.value) || 1 }))}
                        className="w-16"
                      />
                      <span className="text-sm text-muted-foreground">-</span>
                      <Input
                        id="level_to"
                        type="number"
                        min="1"
                        max="10"
                        step="0.5"
                        value={baseConfig.level_to}
                        onChange={(e) => setBaseConfig(prev => ({ ...prev, level_to: parseFloat(e.target.value) || 10 }))}
                        className="w-16"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Periodo */}
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">PERIODO Y HORARIO</h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Fecha inicio</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={baseConfig.start_date}
                      onChange={(e) => setBaseConfig(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">Fecha fin</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={baseConfig.end_date}
                      onChange={(e) => setBaseConfig(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="first_time">Primera clase</Label>
                    <Input
                      id="first_time"
                      type="time"
                      value={baseConfig.first_class_time}
                      onChange={(e) => setBaseConfig(prev => ({ ...prev, first_class_time: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end">
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
        </CardContent>
      </Card>
    );
  }

  // STEP 2: Multiplication Configuration
  if (step === 2) {
    const hasTimeSlots = multiplicationConfig.time_slots.length > 0;

    return (
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">Multiplicación Inteligente</h3>
              <p className="text-sm text-muted-foreground">
                Define los tramos horarios y días para generar tus clases
              </p>
            </div>
            {/* Step indicator */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                1
              </div>
              <div className={`h-[2px] w-6 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                2
              </div>
              <div className={`h-[2px] w-6 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                3
              </div>
              <div className={`h-[2px] w-6 ${step >= 4 ? 'bg-primary' : 'bg-muted'}`}></div>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${step >= 4 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                4
              </div>
            </div>
          </div>

          {/* TRAMOS HORARIOS - Elemento Principal */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="text-base font-semibold">Tramos Horarios</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasTimeSlots
                    ? `${multiplicationConfig.time_slots.length} tramo${multiplicationConfig.time_slots.length > 1 ? 's' : ''} configurado${multiplicationConfig.time_slots.length > 1 ? 's' : ''}`
                    : 'Añade al menos un tramo para continuar'}
                </p>
              </div>
              <Button
                onClick={addTimeSlot}
                className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange"
              >
                <span className="text-lg mr-2">+</span> Añadir Tramo
              </Button>
            </div>

            {/* Empty State */}
            {!hasTimeSlots && (
              <Card className="border-dashed border-2 bg-muted/30">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <Clock className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">¡Añade tu primer tramo horario!</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                    Los tramos horarios definen cuándo se crearán las clases. Por ejemplo: de 10:00 a 14:00 con intervalos de 1 hora creará 4 clases.
                  </p>
                  <Button
                    onClick={addTimeSlot}
                    size="lg"
                    className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange"
                  >
                    <span className="text-xl mr-2">+</span> Añadir Primer Tramo
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Time Slots List */}
            {hasTimeSlots && (
              <div className="space-y-3">
                {multiplicationConfig.time_slots.map((slot, index) => {
                  const isIncompatible = !timeSlotsValidation.isValid &&
                    timeSlotsValidation.incompatibleSlots.some(s =>
                      s.start === slot.start && s.end === slot.end && s.interval === slot.interval
                    );

                  return (
                    <Card key={index} className={`${isIncompatible ? 'border-destructive' : 'border-primary/20'} shadow-sm hover:shadow-md transition-shadow`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium">Tramo {index + 1}</p>
                              <p className="text-xs text-muted-foreground">
                                {slot.start && slot.end ? `${slot.start} - ${slot.end}` : 'Sin configurar'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTimeSlot(index)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Desde</Label>
                            <Input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateTimeSlot(index, { start: e.target.value })}
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Hasta</Label>
                            <Input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateTimeSlot(index, { end: e.target.value })}
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Intervalo</Label>
                            <Select
                              value={slot.interval.toString()}
                              onValueChange={(value) => updateTimeSlot(index, { interval: parseInt(value) })}
                            >
                              <SelectTrigger className={`h-9 ${isIncompatible ? "border-destructive" : ""}`}>
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
                        </div>

                        {isIncompatible && (
                          <div className="mt-3 p-2 bg-destructive/10 border border-destructive/30 rounded-md">
                            <p className="text-xs text-destructive font-medium">
                              ⚠️ El intervalo de {slot.interval} min no es compatible con la duración de {baseConfig.duration_minutes} min
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Días de la Semana */}
          <div className="space-y-4">
            <div className="border-b pb-3">
              <h4 className="text-base font-semibold">Días de la Semana</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Selecciona los días en los que se crearán las clases
              </p>
            </div>
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
                  <Label htmlFor={day.value} className="text-sm cursor-pointer">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/*{generatedClasses.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Vista previa</Label>
              <p className="text-xs text-muted-foreground">
                Se generarán {generatedClasses.length} clases
              </p>
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
            </div>
          )}*/}

          {/* Validación y mensajes */}
          {!timeSlotsValidation.isValid && hasTimeSlots && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Hay intervalos incompatibles con la duración de la clase ({baseConfig.duration_minutes} min).
                Por favor, ajusta los intervalos para que sean múltiplos de la duración o viceversa.
              </p>
            </div>
          )}

          {!hasTimeSlots && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 font-medium">
                ℹ️ Debes añadir al menos un tramo horario para continuar
              </p>
            </div>
          )}

          {/* Preview de clases generadas */}
          {hasTimeSlots && timeSlotsValidation.isValid && generatedClasses.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">
                ✓ Se generarán <span className="font-bold">{generatedClasses.length} clases</span> con la configuración actual
              </p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={() => setStep(1)}>
              Anterior
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!hasTimeSlots || generatedClasses.length === 0 || !timeSlotsValidation.isValid}
              className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar: Editar Clases
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // STEP 3: Individual Editing
  if (step === 3) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">Edición Individual</h3>
              <p className="text-sm text-muted-foreground">
                Modifica cada clase individualmente antes de crear
              </p>
            </div>
            {/* Step indicator */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              1
            </div>
            <div className={`h-[2px] w-6 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              2
            </div>
            <div className={`h-[2px] w-6 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              3
            </div>
            <div className={`h-[2px] w-6 ${step >= 4 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${step >= 4 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              4
            </div>
          </div>
        </div>

        {isCreating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Creando clases...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
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
            onClick={() => setStep(4)}
            disabled={generatedClasses.filter(cls => cls.selected).length === 0}
          >
            Siguiente: Asignar Alumnos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
  }

  // Step 4: Student Assignment
  if (step === 4) {
    const handleAssignmentChange = (classId: string, participantIds: string[]) => {
      setGeneratedClasses(prev =>
        prev.map(cls =>
          cls.id === classId ? { ...cls, participant_ids: participantIds } : cls
        )
      );
    };

    return (
      <StudentAssignmentStep
        classes={generatedClasses.filter(cls => cls.selected)}
        clubId={selectedClubId}
        onAssignmentChange={handleAssignmentChange}
        onNext={createClasses}
        onBack={() => setStep(3)}
      />
    );
  }
}
