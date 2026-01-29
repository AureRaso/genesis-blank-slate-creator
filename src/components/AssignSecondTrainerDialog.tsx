import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Users, Building2, AlertTriangle } from "lucide-react";
import { useTrainersByClubFixed } from "@/hooks/useTrainers";
import { useAdminClubs } from "@/hooks/useClubs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ClassData {
  id: string;
  name: string;
  club_id: string;
  start_time: string;
  trainer_profile_id: string;
  trainer_profile_id_2?: string | null;
  trainer?: { full_name: string } | null;
  trainer_2?: { full_name: string } | null;
  max_participants?: number;
}

interface AssignSecondTrainerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData: ClassData | null;
}

const AssignSecondTrainerDialog = ({
  open,
  onOpenChange,
  classData,
}: AssignSecondTrainerDialogProps) => {
  const { isSuperAdmin } = useAuth();
  const [primaryTrainerId, setPrimaryTrainerId] = useState<string>("");
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>("none");
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [maxParticipants, setMaxParticipants] = useState<number>(4);
  const [startTime, setStartTime] = useState<string>("09:00");
  const [applyToSeries, setApplyToSeries] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  // Get clubs for superadmin
  const { data: clubs, isLoading: loadingClubs } = useAdminClubs();

  // Use selectedClubId for trainers (allows dynamic switching when club changes)
  const { data: trainers, isLoading: loadingTrainers } = useTrainersByClubFixed(
    selectedClubId || classData?.club_id || ""
  );

  // Store the original values for comparison
  const originalTrainerId = classData?.trainer_profile_id || "";
  const originalClubId = classData?.club_id || "";

  // Check if club has changed
  const clubChanged = selectedClubId !== originalClubId;

  // Reset state when dialog opens with new class data
  useEffect(() => {
    if (open && classData) {
      setPrimaryTrainerId(classData.trainer_profile_id || "");
      setSelectedTrainerId(classData.trainer_profile_id_2 || "none");
      setSelectedClubId(classData.club_id || "");
      setMaxParticipants(classData.max_participants || 4);
      setStartTime(classData.start_time?.slice(0, 5) || "09:00");
      setApplyToSeries(false);
    }
  }, [open, classData]);

  // When club changes, reset trainer selections (trainers are club-specific)
  const handleClubChange = (newClubId: string) => {
    setSelectedClubId(newClubId);
    // Reset trainers since they belong to a different club now
    setPrimaryTrainerId("");
    setSelectedTrainerId("none");
  };

  // Filter out the primary trainer from the second trainer list
  const availableSecondTrainers = trainers?.filter(
    (trainer) => trainer.profile_id !== primaryTrainerId
  );

  // Handle primary trainer change - clear second trainer if it's the same
  const handlePrimaryTrainerChange = (newPrimaryId: string) => {
    setPrimaryTrainerId(newPrimaryId);
    // If the new primary trainer was the second trainer, clear it
    if (selectedTrainerId === newPrimaryId) {
      setSelectedTrainerId("none");
    }
  };

  // Helper function to find all classes in a series based on:
  // - Same club_id, name, start_time, trainer_profile_id
  // - At least 1 common participant (not substitute)
  const findSeriesClasses = async (classId: string): Promise<string[]> => {
    console.log('[SERIES-DIALOG] Finding series for class:', classId);

    // 1. Get the source class details
    const { data: sourceClass, error: fetchError } = await supabase
      .from("programmed_classes")
      .select('id, club_id, name, start_time, trainer_profile_id')
      .eq("id", classId)
      .single();

    if (fetchError || !sourceClass) {
      console.error("[SERIES-DIALOG] Error fetching class:", fetchError);
      return [classId];
    }

    console.log('[SERIES-DIALOG] Source class:', sourceClass);

    // 2. Get non-substitute participants of the source class
    const { data: sourceParticipants, error: participantsError } = await supabase
      .from('class_participants')
      .select('student_enrollment_id')
      .eq('class_id', classId)
      .eq('status', 'active')
      .or('is_substitute.eq.false,is_substitute.is.null');

    if (participantsError) {
      console.error("[SERIES-DIALOG] Error fetching participants:", participantsError);
      return [classId];
    }

    const sourceParticipantIds = sourceParticipants?.map(p => p.student_enrollment_id) || [];
    console.log('[SERIES-DIALOG] Source participants:', sourceParticipantIds.length);

    // If class has no non-substitute participants, return only this class
    if (sourceParticipantIds.length === 0) {
      console.log('[SERIES-DIALOG] No non-substitute participants, returning only source class');
      return [classId];
    }

    // 3. Find candidate classes with same club + name + time + trainer
    const { data: candidateClasses, error: candidatesError } = await supabase
      .from('programmed_classes')
      .select('id')
      .eq('club_id', sourceClass.club_id)
      .eq('name', sourceClass.name)
      .eq('start_time', sourceClass.start_time)
      .eq('trainer_profile_id', sourceClass.trainer_profile_id)
      .eq('is_active', true);

    if (candidatesError || !candidateClasses) {
      console.error("[SERIES-DIALOG] Error fetching candidates:", candidatesError);
      return [classId];
    }

    console.log('[SERIES-DIALOG] Candidates with same club+name+time+trainer:', candidateClasses.length);

    // 4. Filter candidates: keep only those with at least 1 common participant
    const seriesClassIds: string[] = [];

    for (const candidate of candidateClasses) {
      const { data: candidateParticipants } = await supabase
        .from('class_participants')
        .select('student_enrollment_id')
        .eq('class_id', candidate.id)
        .eq('status', 'active')
        .or('is_substitute.eq.false,is_substitute.is.null');

      const candidateParticipantIds = candidateParticipants?.map(p => p.student_enrollment_id) || [];

      const hasCommonParticipant = candidateParticipantIds.some(id =>
        sourceParticipantIds.includes(id)
      );

      console.log('[SERIES-DIALOG] Candidate', candidate.id, '- common:', hasCommonParticipant);

      if (hasCommonParticipant) {
        seriesClassIds.push(candidate.id);
      }
    }

    if (seriesClassIds.length === 0) {
      return [classId];
    }

    console.log('[SERIES-DIALOG] Final series classes:', seriesClassIds.length);
    return seriesClassIds;
  };

  const handleSave = async () => {
    if (!classData) return;
    if (!startTime) {
      toast.error("Debes seleccionar una hora de inicio");
      return;
    }

    // Use the selected primary trainer, or fall back to the original if not changed
    // But if club changed, trainer MUST be selected (can't use original from different club)
    const finalPrimaryTrainerId = clubChanged ? primaryTrainerId : (primaryTrainerId || originalTrainerId);

    // Validate trainer selection
    if (!finalPrimaryTrainerId) {
      toast.error(clubChanged
        ? "Debes seleccionar un profesor del nuevo club"
        : "Debes seleccionar un profesor titular"
      );
      return;
    }

    // If club changed, validate that trainer belongs to the new club
    if (clubChanged) {
      const trainerBelongsToNewClub = trainers?.some(t => t.profile_id === finalPrimaryTrainerId);
      if (!trainerBelongsToNewClub) {
        toast.error("El profesor seleccionado no pertenece al club destino");
        return;
      }
    }

    setIsLoading(true);
    try {
      const newSecondTrainerId = selectedTrainerId === "none" ? null : selectedTrainerId;
      // Format time as HH:MM:SS for database
      const formattedStartTime = startTime.length === 5 ? `${startTime}:00` : startTime;

      // Build update data with only changed fields for series update
      const originalStartTime = classData.start_time?.slice(0, 5) || "";
      const startTimeChanged = startTime !== originalStartTime;

      if (applyToSeries) {
        // Find all classes in the series using participant-based logic
        const seriesClassIds = await findSeriesClasses(classData.id);

        console.log('[SERIES-DIALOG] Updating', seriesClassIds.length, 'classes');

        // Only include fields that actually changed to avoid overwriting other classes
        const changedFields: Record<string, string | number | null> = {};

        // Add club_id if changed (superadmin only)
        if (clubChanged) {
          changedFields.club_id = selectedClubId;
        }
        if (finalPrimaryTrainerId !== classData.trainer_profile_id) {
          changedFields.trainer_profile_id = finalPrimaryTrainerId;
        }
        if (newSecondTrainerId !== (classData.trainer_profile_id_2 || null)) {
          changedFields.trainer_profile_id_2 = newSecondTrainerId;
        }
        if (maxParticipants !== classData.max_participants) {
          changedFields.max_participants = maxParticipants;
        }
        if (startTimeChanged) {
          changedFields.start_time = formattedStartTime;
        }

        console.log('[SERIES-DIALOG] Changed fields:', changedFields);

        if (Object.keys(changedFields).length === 0) {
          toast.info("No hay cambios que guardar");
          onOpenChange(false);
          return;
        }

        // Update all classes in the series
        const { error } = await supabase
          .from("programmed_classes")
          .update(changedFields)
          .in("id", seriesClassIds);

        if (error) throw error;

        const clubChangeMsg = clubChanged ? " y movidas al nuevo club" : "";
        toast.success(`${seriesClassIds.length} clase${seriesClassIds.length > 1 ? 's' : ''} actualizada${seriesClassIds.length > 1 ? 's' : ''}${clubChangeMsg}`);
      } else {
        // Update only this specific class - send all fields
        const updateData: Record<string, string | number | null> = {
          trainer_profile_id: finalPrimaryTrainerId,
          trainer_profile_id_2: newSecondTrainerId,
          max_participants: maxParticipants,
          start_time: formattedStartTime,
        };

        // Add club_id if changed (superadmin only)
        if (clubChanged) {
          updateData.club_id = selectedClubId;
        }

        const { error } = await supabase
          .from("programmed_classes")
          .update(updateData)
          .eq("id", classData.id);

        if (error) throw error;

        const clubChangeMsg = clubChanged ? " y movida al nuevo club" : "";
        toast.success(`Clase actualizada correctamente${clubChangeMsg}`);
      }

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["today-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["week-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["programmed-classes"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-classes"] });

      onOpenChange(false);
    } catch (error) {
      console.error("Error updating class:", error);
      toast.error("Error al actualizar la clase");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!classData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Editar Clase
          </DialogTitle>
          <DialogDescription>
            Clase: <span className="font-medium">{classData.name}</span> ({classData.start_time?.slice(0, 5)})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Club selector - only visible for superadmin */}
          {isSuperAdmin && clubs && clubs.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="club-select" className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Cambiar de club
              </Label>
              <Select
                value={selectedClubId}
                onValueChange={handleClubChange}
                disabled={loadingClubs || isLoading}
              >
                <SelectTrigger id="club-select">
                  <SelectValue placeholder="Seleccionar club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Warning when club changes */}
              {clubChanged && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Atención:</strong> Al cambiar de club, debes seleccionar un nuevo profesor del club destino.
                    Los participantes actuales se mantendrán aunque pertenezcan al club original.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="primary-trainer-select" className="text-sm font-medium">
              {clubChanged ? "Seleccionar profesor del nuevo club" : "Cambiar profesor titular"}
            </Label>
            <Select
              value={primaryTrainerId}
              onValueChange={handlePrimaryTrainerChange}
              disabled={loadingTrainers || isLoading}
            >
              <SelectTrigger id="primary-trainer-select">
                <SelectValue placeholder="Seleccionar profesor titular" />
              </SelectTrigger>
              <SelectContent>
                {trainers?.map((trainer) => (
                  <SelectItem key={trainer.profile_id} value={trainer.profile_id}>
                    {trainer.profiles?.full_name || trainer.profile_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="second-trainer-select" className="text-sm font-medium">
              Segundo profesor
            </Label>
            <Select
              value={selectedTrainerId}
              onValueChange={setSelectedTrainerId}
              disabled={loadingTrainers || isLoading}
            >
              <SelectTrigger id="second-trainer-select">
                <SelectValue placeholder="Seleccionar profesor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">Sin segundo profesor</span>
                </SelectItem>
                {availableSecondTrainers?.map((trainer) => (
                  <SelectItem key={trainer.profile_id} value={trainer.profile_id}>
                    {trainer.profiles?.full_name || trainer.profile_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time" className="text-sm font-medium">
                Hora de inicio
              </Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isLoading}
                className="w-28"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-participants" className="text-sm font-medium">
                Máx. participantes
              </Label>
              <Input
                id="max-participants"
                type="number"
                min={1}
                max={20}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                disabled={isLoading}
                className="w-20"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="apply-series"
              checked={applyToSeries}
              onCheckedChange={(checked) => setApplyToSeries(checked === true)}
              disabled={isLoading}
            />
            <Label
              htmlFor="apply-series"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Aplicar a toda la serie de clases
              </div>
            </Label>
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            Si marcas esta opción, se actualizarán todas las clases con el mismo nombre y horario.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || loadingTrainers}
          >
            {isLoading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignSecondTrainerDialog;
