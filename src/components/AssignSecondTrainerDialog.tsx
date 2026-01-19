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
import { Settings, Users } from "lucide-react";
import { useTrainersByClubFixed } from "@/hooks/useTrainers";
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
  const [primaryTrainerId, setPrimaryTrainerId] = useState<string>("");
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>("none");
  const [maxParticipants, setMaxParticipants] = useState<number>(4);
  const [startTime, setStartTime] = useState<string>("09:00");
  const [applyToSeries, setApplyToSeries] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: trainers, isLoading: loadingTrainers } = useTrainersByClubFixed(
    classData?.club_id || ""
  );

  // Store the original trainer_profile_id to use as fallback
  const originalTrainerId = classData?.trainer_profile_id || "";

  // Reset state when dialog opens with new class data
  useEffect(() => {
    if (open && classData) {
      setPrimaryTrainerId(classData.trainer_profile_id || "");
      setSelectedTrainerId(classData.trainer_profile_id_2 || "none");
      setMaxParticipants(classData.max_participants || 4);
      setStartTime(classData.start_time?.slice(0, 5) || "09:00");
      setApplyToSeries(false);
    }
  }, [open, classData]);

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

  const handleSave = async () => {
    if (!classData) return;
    if (!startTime) {
      toast.error("Debes seleccionar una hora de inicio");
      return;
    }

    // Use the selected primary trainer, or fall back to the original if not changed
    // primaryTrainerId could be empty if user didn't change it, so use originalTrainerId
    const finalPrimaryTrainerId = primaryTrainerId || originalTrainerId;

    // Only show error if there's truly no trainer (neither selected nor original)
    if (!finalPrimaryTrainerId) {
      toast.error("Debes seleccionar un profesor titular");
      return;
    }

    setIsLoading(true);
    try {
      const newSecondTrainerId = selectedTrainerId === "none" ? null : selectedTrainerId;
      // Format time as HH:MM:SS for database
      const formattedStartTime = startTime.length === 5 ? `${startTime}:00` : startTime;

      const updateData = {
        trainer_profile_id: finalPrimaryTrainerId,
        trainer_profile_id_2: newSecondTrainerId,
        max_participants: maxParticipants,
        start_time: formattedStartTime,
      };

      if (applyToSeries) {
        // Update all classes in the series (same name, same club)
        // Series = all classes with the same name in the same club
        const { error } = await supabase
          .from("programmed_classes")
          .update(updateData)
          .eq("club_id", classData.club_id)
          .eq("name", classData.name)
          .eq("is_active", true);

        if (error) throw error;

        toast.success("Clase actualizada para toda la serie");
      } else {
        // Update only this specific class
        const { error } = await supabase
          .from("programmed_classes")
          .update(updateData)
          .eq("id", classData.id);

        if (error) throw error;

        toast.success("Clase actualizada correctamente");
      }

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["today-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["week-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["programmed-classes"] });

      onOpenChange(false);
    } catch (error) {
      console.error("Error updating second trainer:", error);
      toast.error("Error al actualizar el segundo profesor");
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
          <div className="space-y-2">
            <Label htmlFor="primary-trainer-select" className="text-sm font-medium">
              Cambiar profesor titular
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
