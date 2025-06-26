
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateLeague, useUpdateLeague } from "@/hooks/useLeagues";
import { League } from "@/types/padel";
import { X } from "lucide-react";

interface LeagueFormProps {
  league?: League;
  onClose: () => void;
}

interface LeagueFormData {
  name: string;
  start_date: string;
  end_date: string;
  points_victory: number;
  points_defeat: number;
  points_per_set: boolean;
  registration_price: number;
  status: "upcoming" | "active" | "completed";
}

const LeagueForm = ({ league, onClose }: LeagueFormProps) => {
  const isEditing = !!league;
  const createLeague = useCreateLeague();
  const updateLeague = useUpdateLeague();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LeagueFormData>({
    defaultValues: league
      ? {
          name: league.name,
          start_date: league.start_date,
          end_date: league.end_date,
          points_victory: league.points_victory,
          points_defeat: league.points_defeat,
          points_per_set: league.points_per_set,
          registration_price: league.registration_price,
          status: league.status,
        }
      : {
          name: "",
          start_date: "",
          end_date: "",
          points_victory: 3,
          points_defeat: 0,
          points_per_set: false,
          registration_price: 0,
          status: "upcoming",
        },
  });

  const pointsPerSet = watch("points_per_set");

  const onSubmit = async (data: LeagueFormData) => {
    try {
      if (isEditing && league) {
        await updateLeague.mutateAsync({
          id: league.id,
          ...data,
        });
      } else {
        await createLeague.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error("Error submitting league form:", error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>{isEditing ? "Editar Liga" : "Crear Nueva Liga"}</CardTitle>
          <CardDescription>
            {isEditing
              ? "Modifica los detalles de la liga"
              : "Configura los detalles de tu nueva liga de pádel"}
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Liga</Label>
            <Input
              id="name"
              {...register("name", { required: "El nombre es obligatorio" })}
              placeholder="Liga de Pádel Primavera 2024"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Fecha de Inicio</Label>
              <Input
                id="start_date"
                type="date"
                {...register("start_date", { required: "La fecha de inicio es obligatoria" })}
              />
              {errors.start_date && (
                <p className="text-sm text-destructive">{errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Fecha de Fin</Label>
              <Input
                id="end_date"
                type="date"
                {...register("end_date", { required: "La fecha de fin es obligatoria" })}
              />
              {errors.end_date && (
                <p className="text-sm text-destructive">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="registration_price">Precio de Inscripción (€)</Label>
            <Input
              id="registration_price"
              type="number"
              min="0"
              step="0.01"
              {...register("registration_price", { 
                required: "El precio de inscripción es obligatorio",
                min: { value: 0, message: "El precio no puede ser negativo" }
              })}
              placeholder="0.00"
            />
            {errors.registration_price && (
              <p className="text-sm text-destructive">{errors.registration_price.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Establece el precio que cada jugador debe pagar para inscribirse en la liga
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Sistema de Puntuación</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="points_victory">Puntos por Victoria</Label>
                <Input
                  id="points_victory"
                  type="number"
                  min="0"
                  {...register("points_victory", { 
                    required: "Los puntos por victoria son obligatorios",
                    min: { value: 0, message: "Los puntos no pueden ser negativos" }
                  })}
                />
                {errors.points_victory && (
                  <p className="text-sm text-destructive">{errors.points_victory.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="points_defeat">Puntos por Derrota</Label>
                <Input
                  id="points_defeat"
                  type="number"
                  min="0"
                  {...register("points_defeat", { 
                    required: "Los puntos por derrota son obligatorios",
                    min: { value: 0, message: "Los puntos no pueden ser negativos" }
                  })}
                />
                {errors.points_defeat && (
                  <p className="text-sm text-destructive">{errors.points_defeat.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="points_per_set"
                checked={pointsPerSet}
                onCheckedChange={(checked) => setValue("points_per_set", checked)}
              />
              <Label htmlFor="points_per_set" className="text-sm">
                Punto extra por set ganado
              </Label>
            </div>

            {pointsPerSet && (
              <p className="text-sm text-muted-foreground">
                Los equipos recibirán un punto adicional por cada set ganado, independientemente del resultado final del partido.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado de la Liga</Label>
            <Select
              value={watch("status")}
              onValueChange={(value) => setValue("status", value as "upcoming" | "active" | "completed")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Próxima</SelectItem>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="completed">Completada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createLeague.isPending || updateLeague.isPending}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
            >
              {(createLeague.isPending || updateLeague.isPending) 
                ? "Guardando..." 
                : isEditing 
                  ? "Actualizar Liga" 
                  : "Crear Liga"
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LeagueForm;
