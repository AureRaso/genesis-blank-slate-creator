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
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>("none");
  const [maxParticipants, setMaxParticipants] = useState<number>(4);
  const [applyToSeries, setApplyToSeries] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: trainers, isLoading: loadingTrainers } = useTrainersByClubFixed(
    classData?.club_id || ""
  );

  // Reset state when dialog opens with new class data
  useEffect(() => {
    if (open && classData) {
      setSelectedTrainerId(classData.trainer_profile_id_2 || "none");
      setMaxParticipants(classData.max_participants || 4);
      setApplyToSeries(false);
    }
  }, [open, classData]);

  // Filter out the primary trainer from the list
  const availableTrainers = trainers?.filter(
    (trainer) => trainer.profile_id !== classData?.trainer_profile_id
  );

  const handleSave = async () => {
    if (!classData) return;

    setIsLoading(true);
    try {
      const newTrainerId = selectedTrainerId === "none" ? null : selectedTrainerId;
      const updateData = {
        trainer_profile_id_2: newTrainerId,
        max_participants: maxParticipants,
      };

      if (applyToSeries) {
        // Update all classes in the series (same name, same start_time, same club)
        const { error } = await supabase
          .from("programmed_classes")
          .update(updateData)
          .eq("club_id", classData.club_id)
          .eq("name", classData.name)
          .eq("start_time", classData.start_time)
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
            <br />
            Profesor principal: <span className="font-medium">{classData.trainer?.full_name || "Sin asignar"}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="trainer-select" className="text-sm font-medium">
              Segundo profesor
            </Label>
            <Select
              value={selectedTrainerId}
              onValueChange={setSelectedTrainerId}
              disabled={loadingTrainers || isLoading}
            >
              <SelectTrigger id="trainer-select">
                <SelectValue placeholder="Seleccionar profesor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">Sin segundo profesor</span>
                </SelectItem>
                {availableTrainers?.map((trainer) => (
                  <SelectItem key={trainer.profile_id} value={trainer.profile_id}>
                    {trainer.profiles?.full_name || trainer.profile_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-participants" className="text-sm font-medium">
              Máximo de participantes
            </Label>
            <Input
              id="max-participants"
              type="number"
              min={1}
              max={20}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              disabled={isLoading}
              className="w-24"
            />
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
