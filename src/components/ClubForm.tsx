
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateClub, useUpdateClub } from "@/hooks/useClubs";
import { Club, CreateClubData, COURT_TYPES } from "@/types/clubs";
import { ArrowLeft, Building2 } from "lucide-react";
import { useFormPersistence } from "@/hooks/useFormPersistence";

interface ClubFormProps {
  club?: Club;
  onClose: () => void;
}

interface ClubFormData extends CreateClubData {}

const ClubForm = ({ club, onClose }: ClubFormProps) => {
  const isEditing = !!club;
  const createClub = useCreateClub();
  const updateClub = useUpdateClub();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ClubFormData>({
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      court_count: 1,
      court_types: [],
      description: "",
    },
  });

  // Persistencia del formulario solo para nuevos clubs
  const persistenceKey = `club-form-${isEditing ? club?.id : 'new'}`;
  const { clearPersistedData } = useFormPersistence({
    key: persistenceKey,
    watch,
    setValue,
  });

  // Cargar datos del club existente si estamos editando
  useEffect(() => {
    if (isEditing && club) {
      setValue("name", club.name);
      setValue("address", club.address);
      setValue("phone", club.phone);
      setValue("court_count", club.court_count);
      setValue("court_types", club.court_types);
      setValue("description", club.description || "");
    }
  }, [isEditing, club, setValue]);

  const courtTypes = watch("court_types");

  const handleCourtTypeChange = (courtType: string, checked: boolean) => {
    const current = courtTypes || [];
    if (checked) {
      setValue("court_types", [...current, courtType]);
    } else {
      setValue("court_types", current.filter(type => type !== courtType));
    }
  };

  const onSubmit = async (data: ClubFormData) => {
    try {
      if (isEditing && club) {
        await updateClub.mutateAsync({
          id: club.id,
          ...data,
        });
      } else {
        await createClub.mutateAsync(data);
      }
      // Limpiar datos persistidos después de envío exitoso
      clearPersistedData();
      onClose();
    } catch (error) {
      console.error("Error submitting club form:", error);
    }
  };

  const handleCancel = () => {
    // Limpiar datos persistidos al cancelar
    if (!isEditing) {
      clearPersistedData();
    }
    onClose();
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-black">
          {isEditing ? "Editar Club" : "Nuevo Club"}
        </h1>
      </div>

      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Club *</Label>
            <Input
              id="name"
              {...register("name", { required: "El nombre es obligatorio" })}
              placeholder="Club Pádel Central"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección Completa *</Label>
            <Textarea
              id="address"
              {...register("address", { required: "La dirección es obligatoria" })}
              placeholder="Calle Principal 123, 28001 Madrid, España"
              rows={3}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono de Contacto *</Label>
            <Input
              id="phone"
              {...register("phone", { required: "El teléfono es obligatorio" })}
              placeholder="+34 666 123 456"
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="court_count">Número de Pistas *</Label>
            <Input
              id="court_count"
              type="number"
              min="1"
              {...register("court_count", { 
                required: "El número de pistas es obligatorio",
                min: { value: 1, message: "Debe haber al menos 1 pista" }
              })}
            />
            {errors.court_count && (
              <p className="text-sm text-destructive">{errors.court_count.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tipo de Pistas *</Label>
            <div className="grid grid-cols-2 gap-3">
              {COURT_TYPES.map((courtType) => (
                <div key={courtType} className="flex items-center space-x-2">
                  <Checkbox
                    id={courtType}
                    checked={courtTypes?.includes(courtType) || false}
                    onCheckedChange={(checked) => 
                      handleCourtTypeChange(courtType, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={courtType} 
                    className="text-sm font-normal capitalize"
                  >
                    {courtType}
                  </Label>
                </div>
              ))}
            </div>
            {(!courtTypes || courtTypes.length === 0) && (
              <p className="text-sm text-destructive">Selecciona al menos un tipo de pista</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea
              id="description"
              {...register("description", {
                maxLength: { value: 200, message: "La descripción no puede exceder 200 caracteres" }
              })}
              placeholder="Describe las instalaciones, servicios, etc. (máximo 200 caracteres)"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {watch("description")?.length || 0}/200 caracteres
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createClub.isPending || updateClub.isPending || !courtTypes?.length}
              className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark"
            >
              {(createClub.isPending || updateClub.isPending) 
                ? "Guardando..." 
                : isEditing 
                  ? "Actualizar Club" 
                  : "Crear Club"
              }
            </Button>
          </div>
        </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubForm;
