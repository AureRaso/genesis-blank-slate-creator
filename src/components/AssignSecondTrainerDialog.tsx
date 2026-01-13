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
import { UserPlus, Users } from "lucide-react";
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
  const [applyToSeries, setApplyToSeries] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: trainers, isLoading: loadingTrainers } = useTrainersByClubFixed(
    classData?.club_id || ""
  );

  // Debug: log trainers data
  console.log("AssignSecondTrainerDialog - club_id:", classData?.club_id);
  console.log("AssignSecondTrainerDialog - trainers:", trainers);
  console.log("AssignSecondTrainerDialog - loadingTrainers:", loadingTrainers);

  // Reset state when dialog opens with new class data
  useEffect(() => {
    if (open && classData) {
      setSelectedTrainerId(classData.trainer_profile_id_2 || "none");
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

      if (applyToSeries) {
        // Update all classes in the series (same name, same start_time, same club)
        const { error } = await supabase
          .from("programmed_classes")
          .update({ trainer_profile_id_2: newTrainerId })
          .eq("club_id", classData.club_id)
          .eq("name", classData.name)
          .eq("start_time", classData.start_time)
          .eq("is_active", true);

        if (error) throw error;

        toast.success(
          newTrainerId
            ? "Segundo profesor asignado a toda la serie"
            : "Segundo profesor eliminado de toda la serie"
        );
      } else {
        // Update only this specific class
        const { error } = await supabase
          .from("programmed_classes")
          .update({ trainer_profile_id_2: newTrainerId })
          .eq("id", classData.id);

        if (error) throw error;

        toast.success(
          newTrainerId
            ? "Segundo profesor asignado correctamente"
            : "Segundo profesor eliminado correctamente"
        );
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
            <UserPlus className="h-5 w-5 text-blue-600" />
            Asignar Segundo Profesor
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
