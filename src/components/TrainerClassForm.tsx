
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar } from "lucide-react";
import { useCreateClassSlot, useUpdateClassSlot, ClassSlot } from "@/hooks/useClassSlots";
import { Trainer } from "@/hooks/useTrainers";
import { useEffect } from "react";

const formSchema = z.object({
  club_id: z.string().min(1, "Selecciona un club"),
  court_number: z.number().min(1, "Selecciona una pista"),
  objective: z.string().min(1, "Introduce el objetivo de la clase"),
  level: z.enum(["iniciacion", "intermedio", "avanzado"]),
  day_of_week: z.enum(["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]),
  start_time: z.string().min(1, "Introduce la hora de inicio"),
  duration_minutes: z.number().min(30, "Duración mínima 30 minutos"),
  price_per_player: z.number().min(1, "Introduce el precio por jugador"),
  max_players: z.number().min(1, "Mínimo 1 jugador").max(4, "Máximo 4 jugadores"),
});

type FormData = z.infer<typeof formSchema>;

interface TrainerClassFormProps {
  onClose: () => void;
  trainerProfile?: Trainer;
  editingClass?: ClassSlot;
}

const TrainerClassForm = ({ onClose, trainerProfile, editingClass }: TrainerClassFormProps) => {
  const createMutation = useCreateClassSlot();
  const updateMutation = useUpdateClassSlot();

  // Get club data from trainer profile
  const trainerClub = trainerProfile?.trainer_clubs?.[0];
  const clubId = trainerClub?.club_id || "";
  const clubName = trainerClub?.clubs?.name || "Club no asignado";
  const trainerName = trainerProfile?.profiles?.full_name || "Profesor";

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      club_id: clubId,
      court_number: 1,
      objective: "",
      level: "iniciacion",
      day_of_week: "lunes",
      start_time: "",
      duration_minutes: 60,
      price_per_player: 15,
      max_players: 4,
    },
  });

  // Set form values when editing
  useEffect(() => {
    if (editingClass) {
      form.reset({
        club_id: editingClass.club_id,
        court_number: editingClass.court_number,
        objective: editingClass.objective,
        level: editingClass.level,
        day_of_week: editingClass.day_of_week,
        start_time: editingClass.start_time,
        duration_minutes: editingClass.duration_minutes,
        price_per_player: editingClass.price_per_player,
        max_players: editingClass.max_players,
      });
    }
  }, [editingClass, form]);

  const onSubmit = (data: FormData) => {
    const submitData = {
      club_id: data.club_id,
      court_number: data.court_number,
      trainer_name: trainerName,
      trainer_id: trainerProfile?.id,
      objective: data.objective,
      level: data.level,
      day_of_week: data.day_of_week,
      start_time: data.start_time,
      duration_minutes: data.duration_minutes,
      price_per_player: data.price_per_player,
      max_players: data.max_players,
      repeat_weekly: true,
      is_active: true,
    };

    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, ...submitData }, {
        onSuccess: () => onClose(),
      });
    } else {
      createMutation.mutate(submitData, {
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
          {editingClass ? 'Editar Clase' : 'Nueva Clase'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>{editingClass ? 'Modificar Clase' : 'Programar Clase'}</span>
          </CardTitle>
          <CardDescription>
            {editingClass ? 'Modifica los detalles de tu clase' : 'Crea una nueva clase de pádel en tu club asignado'}
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un club" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {trainerClub && (
                            <SelectItem key={trainerClub.clubs.id} value={trainerClub.clubs.id}>
                              {clubName}
                            </SelectItem>
                          )}
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
                      <FormLabel>Número de Pista</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="10"
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
                  name="objective"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Objetivo de la Clase</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Técnica de saque, Juego de red..." {...field} />
                      </FormControl>
                      <FormMessage />
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
                            <SelectValue />
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
                      <FormLabel>Día de la Semana</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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
                      <FormLabel>Hora de Inicio</FormLabel>
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
                          min="30" 
                          max="180"
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
                      <FormLabel>Precio por Jugador (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          step="0.5"
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
                      <FormLabel>Máximo de Jugadores</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="4"
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
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
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingClass ? 'Actualizar Clase' : 'Crear Clase'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainerClassForm;
