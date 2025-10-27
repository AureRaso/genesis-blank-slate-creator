import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Sparkles, Loader2, CheckCircle2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useClubs } from "@/hooks/useClubs";
import { useTrainersByClub } from "@/hooks/useTrainers";
import { useAIClassCreator, useIntelligentBulkCreateClasses, ParsedClass } from "@/hooks/useAIClassCreator";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface AIClassCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TrainerOption {
  id: string;
  profile_id: string;
  full_name: string;
  email: string;
}

const AIClassCreatorModal = ({ isOpen, onClose }: AIClassCreatorModalProps) => {
  const [inputText, setInputText] = useState("");
  const [selectedClub, setSelectedClub] = useState<string>("");
  const [parsedData, setParsedData] = useState<ParsedClass | null>(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>("");
  const [availableTrainers, setAvailableTrainers] = useState<TrainerOption[]>([]);

  const { data: clubs } = useClubs();
  const { data: trainers } = useTrainersByClub(selectedClub);
  const aiMutation = useAIClassCreator();
  const bulkCreateMutation = useIntelligentBulkCreateClasses();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch admin and trainers for the selected club
  useEffect(() => {
    const fetchAvailableTrainers = async () => {
      if (!selectedClub) {
        setAvailableTrainers([]);
        return;
      }

      try {
        const trainerOptions: TrainerOption[] = [];

        // 1. Get the admin/owner of the club
        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select(`
            created_by_profile_id,
            profiles:created_by_profile_id (
              id,
              full_name,
              email
            )
          `)
          .eq('id', selectedClub)
          .single();

        if (clubData && clubData.profiles) {
          trainerOptions.push({
            id: `admin_${clubData.created_by_profile_id}`,
            profile_id: clubData.created_by_profile_id,
            full_name: `${clubData.profiles.full_name} (Admin)`,
            email: clubData.profiles.email,
          });
        }

        // 2. Add trainers from trainer_clubs
        if (trainers && trainers.length > 0) {
          trainers.forEach(trainer => {
            if (trainer.profiles) {
              trainerOptions.push({
                id: trainer.id,
                profile_id: trainer.profile_id,
                full_name: trainer.profiles.full_name,
                email: trainer.profiles.email,
              });
            }
          });
        }

        setAvailableTrainers(trainerOptions);
      } catch (error) {
        console.error('Error fetching trainers:', error);
        setAvailableTrainers([]);
      }
    };

    fetchAvailableTrainers();
  }, [selectedClub, trainers]);

  const handlePreview = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Escribe una descripción de las clases a crear",
        variant: "destructive",
      });
      return;
    }

    if (!selectedClub) {
      toast({
        title: "Error",
        description: "Selecciona un club",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await aiMutation.mutateAsync({
        natural_language_input: inputText,
        club_id: selectedClub,
      });

      if (result.success && result.parsed_data) {
        setParsedData(result.parsed_data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar la solicitud",
        variant: "destructive",
      });
    }
  };

  const handleConfirmCreate = async () => {
    if (!parsedData || !selectedClub || !selectedTrainerId) {
      toast({
        title: "Error",
        description: "Faltan datos para crear las clases",
        variant: "destructive",
      });
      return;
    }

    const selectedTrainer = availableTrainers.find(t => t.id === selectedTrainerId);
    if (!selectedTrainer) {
      toast({
        title: "Error",
        description: "Selecciona un entrenador válido",
        variant: "destructive",
      });
      return;
    }

    // Calculate dates
    const today = new Date();
    const startDate = parsedData.start_date || today.toISOString().split('T')[0];

    // For staggered times (one-time classes), end date should be same as start date
    // For recurring classes, default to 3 months
    let endDate = parsedData.end_date;
    if (!endDate) {
      if (parsedData.staggered_times && parsedData.count > 1) {
        // One-time classes: same day
        endDate = startDate;
      } else {
        // Recurring classes: 3 months
        const end = new Date(startDate);
        end.setMonth(end.getMonth() + 3);
        endDate = end.toISOString().split('T')[0];
      }
    }

    // Map level to level_from and level_to
    const levelMap = {
      'iniciacion': { from: 1, to: 3 },
      'intermedio': { from: 4, to: 6 },
      'avanzado': { from: 7, to: 10 }
    };

    // Default to all levels (1-10) if no specific level is mentioned
    const levelRange = parsedData.level ? levelMap[parsedData.level] : { from: 1, to: 10 };

    // Search for participant enrollments if participant names were mentioned
    let participantIds: string[] = [];
    if (parsedData.participant_names && parsedData.participant_names.length > 0) {
      try {
        console.log('🔍 Searching for participants:', parsedData.participant_names);

        // First get all enrollments for this club
        const { data: enrollments, error: enrollError } = await supabase
          .from('student_enrollments')
          .select('id, student_profile_id')
          .eq('club_id', selectedClub);

        if (enrollError) {
          console.error('❌ Error fetching enrollments:', enrollError);
          toast({
            title: "Error",
            description: "No se pudieron buscar los participantes en este club",
            variant: "destructive",
          });
        } else if (enrollments && enrollments.length > 0) {
          // Get profile IDs and filter out any null/undefined values
          const profileIds = enrollments
            .map(e => e.student_profile_id)
            .filter(id => id != null && id !== 'null');

          if (profileIds.length === 0) {
            console.warn('⚠️ No valid profile IDs found in enrollments');
            toast({
              title: "Sin perfiles válidos",
              description: "No hay estudiantes con perfiles válidos en este club",
              variant: "destructive",
            });
          } else {
            // Now fetch profiles separately
            const { data: profiles, error: profilesError } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .in('id', profileIds);

          if (profilesError) {
            console.error('❌ Error fetching profiles:', profilesError);
          } else if (profiles) {
            console.log(`✅ Found ${profiles.length} student profiles in club`);

            // DEBUG: Show all available profiles
            const profilesList = profiles.map(p => `${p.full_name} (${p.email})`).join(', ');
            console.log('📋 Available student profiles:', profilesList);

            // Match participants by name (case-insensitive)
            parsedData.participant_names.forEach(nameToFind => {
              const normalizedSearch = nameToFind.toLowerCase().trim();
              console.log(`\n🔎 Searching for: "${normalizedSearch}"`);

              // Find profile
              const foundProfile = profiles.find(profile => {
                const fullName = profile.full_name?.toLowerCase() || '';
                const email = profile.email?.toLowerCase() || '';
                return fullName.includes(normalizedSearch) || email.includes(normalizedSearch);
              });

              console.log(`Match result for "${nameToFind}":`, foundProfile ? `FOUND - ${foundProfile.full_name}` : 'NOT FOUND');

              if (foundProfile) {
                // Find the enrollment ID for this profile
                const enrollment = enrollments.find(e => e.student_profile_id === foundProfile.id);
                if (enrollment) {
                  participantIds.push(enrollment.id);
                  console.log(`✅ Found participant: ${foundProfile.full_name} (enrollment: ${enrollment.id})`);
                  toast({
                    title: "Participante encontrado",
                    description: `${foundProfile.full_name} será asignado a las clases`,
                  });
                }
              } else {
                console.warn(`⚠️ Participant not found: ${nameToFind}`);
                toast({
                  title: "Participante no encontrado",
                  description: `No se encontró "${nameToFind}" en este club. La clase se creará sin este participante.`,
                  variant: "destructive",
                });
              }
            });
          }
          }
        } else {
          console.warn('⚠️ No student enrollments found in this club');
          toast({
            title: "Sin estudiantes",
            description: "No hay estudiantes inscritos en este club",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('❌ Error searching for participants:', error);
        toast({
          title: "Error",
          description: "Error al buscar participantes: " + (error instanceof Error ? error.message : 'Error desconocido'),
          variant: "destructive",
        });
      }
    }

    // Create classes array
    let classes = [];

    if (parsedData.staggered_times && parsedData.count > 1) {
      // Create multiple ONE-TIME classes with staggered start times (consecutive)
      const [startHour, startMin] = parsedData.start_time.split(':').map(Number);

      // Calculate the next occurrence of the specified day
      const targetDay = parsedData.days_of_week[0]; // e.g., "jueves"
      const dayMap: { [key: string]: number } = {
        'domingo': 0, 'lunes': 1, 'martes': 2, 'miercoles': 3,
        'jueves': 4, 'viernes': 5, 'sabado': 6
      };

      const targetDayNum = dayMap[targetDay.toLowerCase()];
      const startDateObj = new Date(startDate);
      const currentDayNum = startDateObj.getDay();

      // Calculate days until next occurrence
      let daysUntilTarget = targetDayNum - currentDayNum;
      if (daysUntilTarget < 0) daysUntilTarget += 7; // Next week
      if (daysUntilTarget === 0 && new Date() > startDateObj) daysUntilTarget = 7; // Already passed today

      const nextOccurrence = new Date(startDateObj);
      nextOccurrence.setDate(startDateObj.getDate() + daysUntilTarget);
      const specificDate = nextOccurrence.toISOString().split('T')[0];

      for (let i = 0; i < parsedData.count; i++) {
        const classStartMinutes = startHour * 60 + startMin + (i * parsedData.duration_minutes);
        const classStartHour = Math.floor(classStartMinutes / 60);
        const classStartMinute = classStartMinutes % 60;
        const classStartTime = `${String(classStartHour).padStart(2, '0')}:${String(classStartMinute).padStart(2, '0')}`;

        classes.push({
          name: `Clase ${targetDay.charAt(0).toUpperCase() + targetDay.slice(1)} - ${classStartTime}`,
          level_from: levelRange.from,
          level_to: levelRange.to,
          duration_minutes: parsedData.duration_minutes,
          start_time: classStartTime,
          days_of_week: [targetDay],
          start_date: specificDate,
          end_date: specificDate, // Same day = one-time class
          recurrence_type: 'once', // One-time occurrence
          trainer_profile_id: selectedTrainer.profile_id,
          club_id: selectedClub,
          court_number: parsedData.court_number || 1,
          monthly_price: parsedData.monthly_price || 60,
          max_participants: parsedData.max_participants || 4,
          participant_ids: participantIds.length > 0 ? participantIds : undefined,
        });
      }
    } else {
      // Create classes normally (one class per day of week)
      classes = parsedData.days_of_week.map((day, index) => ({
        name: `Clase ${day.charAt(0).toUpperCase() + day.slice(1)} - ${parsedData.start_time}`,
        level_from: levelRange.from,
        level_to: levelRange.to,
        duration_minutes: parsedData.duration_minutes,
        start_time: parsedData.start_time,
        days_of_week: [day],
        start_date: startDate,
        end_date: endDate,
        recurrence_type: 'weekly',
        trainer_profile_id: selectedTrainer.profile_id,
        club_id: selectedClub,
        court_number: parsedData.court_number || 1,
        monthly_price: parsedData.monthly_price || 60,
        max_participants: parsedData.max_participants || 4,
        participant_ids: participantIds.length > 0 ? participantIds : undefined,
      }));
    }

    try {
      const result = await bulkCreateMutation.mutateAsync({
        classes,
        base_config: {
          name: `Clases creadas con IA`,
          start_date: startDate,
          end_date: endDate,
          duration_minutes: parsedData.duration_minutes,
        },
      });

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        });

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['class-slots'] });
        queryClient.invalidateQueries({ queryKey: ['my-class-slots'] });

        // Reset and close
        handleReset();
        onClose();
      } else {
        toast({
          title: "Advertencia",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear las clases",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setInputText("");
    setParsedData(null);
    setSelectedTrainerId("");
  };

  const selectedClubData = clubs?.find(club => club.id === selectedClub);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-playtomic-orange" />
            Crear Clases con IA
          </DialogTitle>
          <DialogDescription>
            Describe en lenguaje natural las clases que quieres crear y la IA las procesará automáticamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Club Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Club</label>
            <Select value={selectedClub} onValueChange={setSelectedClub}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un club" />
              </SelectTrigger>
              <SelectContent>
                {clubs?.map((club) => (
                  <SelectItem key={club.id} value={club.id}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Natural Language Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Describe las clases</label>
            <Textarea
              placeholder="Ejemplo: 3 clases los lunes de 10:00 a 11:00 con sergio y fran, nivel intermedio"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Puedes especificar: número de clases, días, horarios, duración, participantes, nivel, pista, precio, etc.
            </p>
          </div>

          {/* Preview Button */}
          <Button
            onClick={handlePreview}
            disabled={!inputText.trim() || !selectedClub || aiMutation.isPending}
            className="w-full bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange"
          >
            {aiMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando con IA...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Previsualizar con IA
              </>
            )}
          </Button>

          {/* Error Display */}
          {aiMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {aiMutation.error instanceof Error ? aiMutation.error.message : "Error al procesar"}
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Data */}
          {parsedData && (
            <Card className="border-2 border-playtomic-orange/30 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Vista Previa
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  Revisa la información antes de crear las clases
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Días</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {parsedData.days_of_week.map((day) => (
                        <Badge key={day} variant="secondary">
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {parsedData.staggered_times ? 'Horario Primera Clase' : 'Horario'}
                    </p>
                    <p className="text-lg font-semibold">
                      {parsedData.start_time}
                      {parsedData.end_time && ` - ${parsedData.end_time}`}
                    </p>
                    {parsedData.staggered_times && parsedData.count > 1 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Se crearán {parsedData.count} clases consecutivas
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Duración</p>
                    <p className="text-lg font-semibold">{parsedData.duration_minutes} minutos</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nivel</p>
                    <p className="text-lg font-semibold capitalize">
                      {parsedData.level || "Intermedio"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pista</p>
                    <p className="text-lg font-semibold">Pista {parsedData.court_number || 1}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Máx. Participantes</p>
                    <p className="text-lg font-semibold">{parsedData.max_participants || 4}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Precio Mensual</p>
                    <p className="text-lg font-semibold">{parsedData.monthly_price || 60}€</p>
                  </div>

                  {parsedData.participant_names.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Participantes Mencionados</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {parsedData.participant_names.map((name, i) => (
                          <Badge key={i} variant="outline">
                            {name}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ✨ La IA buscará y asignará automáticamente estos participantes si existen en el club
                      </p>
                    </div>
                  )}
                </div>

                {/* Trainer Selection */}
                <div className="space-y-2 pt-4 border-t">
                  <label className="text-sm font-medium">Entrenador</label>
                  <Select value={selectedTrainerId} onValueChange={setSelectedTrainerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un entrenador" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTrainers.map((trainer) => (
                        <SelectItem key={trainer.id} value={trainer.id}>
                          {trainer.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedClub && availableTrainers.length === 0 && (
                    <p className="text-sm text-destructive">
                      No hay entrenadores disponibles para este club
                    </p>
                  )}
                </div>

                {/* Confirm Button */}
                <Button
                  onClick={handleConfirmCreate}
                  disabled={!selectedTrainerId || bulkCreateMutation.isPending || availableTrainers.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {bulkCreateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando clases...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirmar y Crear {parsedData.staggered_times && parsedData.count > 1
                        ? `${parsedData.count * parsedData.days_of_week.length} Clase(s)`
                        : `${parsedData.days_of_week.length} Clase(s)`}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIClassCreatorModal;
