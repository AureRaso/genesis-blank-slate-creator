
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar } from "lucide-react";
import { useCreateClassSlot } from "@/hooks/useClassSlots";
import { Trainer } from "@/hooks/useTrainers";

const formSchema = z.object({
  club_id: z.string().min(1, "Selecciona un club"),
  court_number: z.number().min(1, "Selecciona una pista"),
  objective: z.string().min(1, "Introduce el objetivo de la clase"),
  level: z.enum(["iniciacion", "intermedio", "avanzado"]),
  day_of_week: z.enum(["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]),
  start_time: z.string().min(1, "Introduce la hora de inicio"),
  duration_minutes: z.number().min(30, "Duración mínima 30 minutos"),
  price_per_player: z.number().min(1, "Introduce el precio por jugador"),
  max_players: z.number().min(1, "Mínimo 1 jugador").max(8, "Máximo 8 jugadores"),
});

type FormData = z.infer<typeof formSchema>;

interface TrainerClassFormProps {
  onClose: () => void;
  trainerProfile?: Trainer;
}

const TrainerClassForm = ({ onClose, trainerProfile }: TrainerClassFormProps) => {
  const createMutation = useCreateClassSlot();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      club_id: "",
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

  const onSubmit = (data: FormData) => {
    const submitData = {
      ...data,
      trainer_name: trainerProfile?.profiles?.full_name || "Profesor",
      trainer_id: trainerProfile?.id,
      repeat_weekly: true,
      is_active: true,
    };

    createMutation.mutate(submitData, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-playtomic-orange">
          Nueva Clase
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Programar Clase</span>
          </CardTitle>
          <CardDescription>
            Crea una nueva clase de pádel en uno de tus clubs asignados
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
                          {trainerProfile?.trainer_clubs?.map((tc) => (
                            <SelectItem key={tc.club_id} value={tc.club_id}>
                              {tc.clubs?.name}
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
                    <FormItem>
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
                          max="8"
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
                  disabled={createMutation.isPending}
                >
                  Crear Clase
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
