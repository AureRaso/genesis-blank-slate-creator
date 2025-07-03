import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { useClubs } from "@/hooks/useClubs";
import { useCreateClassSlot, useUpdateClassSlot, ClassSlot, CreateClassSlotData } from "@/hooks/useClassSlots";
import { useTrainersByClub } from "@/hooks/useTrainers";

const formSchema = z.object({
  club_id: z.string().min(1, "Selecciona un club"),
  court_number: z.number().min(1, "Selecciona una pista"),
  trainer_id: z.string().min(1, "Selecciona un entrenador"),
  objective: z.string().min(1, "Describe el objetivo de la clase"),
  level: z.enum(['iniciacion', 'intermedio', 'avanzado']),
  day_of_week: z.enum(['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']),
  start_time: z.string().min(1, "Selecciona la hora de inicio"),
  duration_minutes: z.number().min(30, "La duración mínima es 30 minutos"),
  price_per_player: z.number().min(0, "El precio no puede ser negativo"),
  max_players: z.number().min(1, "Debe haber al menos 1 jugador"),
  repeat_weekly: z.boolean(),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface ClassSlotFormProps {
  classSlot?: ClassSlot;
  onClose: () => void;
}

const ClassSlotForm = ({ classSlot, onClose }: ClassSlotFormProps) => {
  const [selectedClub, setSelectedClub] = useState<string>(classSlot?.club_id || "");
  const { data: clubs } = useClubs();
  const { data: trainers } = useTrainersByClub(selectedClub);
  const createMutation = useCreateClassSlot();
  const updateMutation = useUpdateClassSlot();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      club_id: classSlot?.club_id || "",
      court_number: classSlot?.court_number || 1,
      trainer_id: classSlot?.trainer_id || "",
      objective: classSlot?.objective || "",
      level: classSlot?.level || 'intermedio',
      day_of_week: classSlot?.day_of_week || 'lunes',
      start_time: classSlot?.start_time || "18:00",
      duration_minutes: classSlot?.duration_minutes || 60,
      price_per_player: classSlot?.price_per_player || 15,
      max_players: classSlot?.max_players || 4,
      repeat_weekly: classSlot?.repeat_weekly ?? true,
      is_active: classSlot?.is_active ?? true,
    },
  });

  const selectedClubData = clubs?.find(club => club.id === selectedClub);

  const onSubmit = (data: FormData) => {
    if (classSlot) {
      updateMutation.mutate({ id: classSlot.id, ...data }, {
        onSuccess: () => onClose(),
      });
    } else {
      // Buscar el nombre del entrenador para compatibilidad
      const selectedTrainer = trainers?.find(t => t.id === data.trainer_id);
      
      const createData: CreateClassSlotData = {
        club_id: data.club_id,
        court_number: data.court_number,
        trainer_name: selectedTrainer?.full_name || "Entrenador",
        trainer_id: data.trainer_id,
        objective: data.objective,
        level: data.level,
        day_of_week: data.day_of_week,
        start_time: data.start_time,
        duration_minutes: data.duration_minutes,
        price_per_player: data.price_per_player,
        max_players: data.max_players,
        repeat_weekly: data.repeat_weekly,
        is_active: data.is_active,
      };
      
      createMutation.mutate(createData, {
        onSuccess: () => onClose(),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-playtomic-orange">
          {classSlot ? 'Editar Clase' : 'Crear Nueva Clase'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la Clase</CardTitle>
          <CardDescription>
            Configura los detalles de la clase de pádel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="club_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Club</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedClub(value);
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un club" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clubs?.map((club) => (
                            <SelectItem key={club.id} value={club.id}>
                              {club.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="court_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pista</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una pista" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedClubData && Array.from({ length: selectedClubData.court_count }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              Pista {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trainer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entrenador</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un entrenador" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {trainers?.map((trainer) => (
                             <SelectItem key={trainer.id} value={trainer.id}>
                               {trainer.full_name}
                             </SelectItem>
                           ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      {selectedClub && (!trainers || trainers.length === 0) && (
                        <p className="text-sm text-destructive">
                          Debes añadir al menos un profesor para poder crear clases
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nivel</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el nivel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="iniciacion">Iniciación</SelectItem>
                          <SelectItem value="intermedio">Intermedio</SelectItem>
                          <SelectItem value="avanzado">Avanzado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="day_of_week"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Día de la semana</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el día" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="lunes">Lunes</SelectItem>
                          <SelectItem value="martes">Martes</SelectItem>
                          <SelectItem value="miercoles">Miércoles</SelectItem>
                          <SelectItem value="jueves">Jueves</SelectItem>
                          <SelectItem value="viernes">Viernes</SelectItem>
                          <SelectItem value="sabado">Sábado</SelectItem>
                          <SelectItem value="domingo">Domingo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de inicio</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración (minutos)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price_per_player"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio por jugador (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_players"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Máximo de jugadores</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="objective"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objetivo de la clase</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Mejorar volea, Partido táctico..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-6">
                <FormField
                  control={form.control}
                  name="repeat_weekly"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Repetir semanalmente</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Clase activa</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange"
                  disabled={createMutation.isPending || updateMutation.isPending || (selectedClub && (!trainers || trainers.length === 0))}
                >
                  {classSlot ? 'Actualizar' : 'Crear'} Clase
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassSlotForm;
