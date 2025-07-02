
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, UserCheck } from "lucide-react";
import { useClubs } from "@/hooks/useClubs";
import { useCreateTrainer, useUpdateTrainer, Trainer } from "@/hooks/useTrainers";

const formSchema = z.object({
  full_name: z.string().min(1, "Introduce el nombre completo"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  club_ids: z.array(z.string()).min(1, "Selecciona al menos un club"),
  specialty: z.string().optional(),
  photo_url: z.string().url("URL inválida").optional().or(z.literal("")),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface TrainerFormProps {
  trainer?: Trainer;
  onClose: () => void;
}

const TrainerForm = ({ trainer, onClose }: TrainerFormProps) => {
  const { data: clubs } = useClubs();
  const createMutation = useCreateTrainer();
  const updateMutation = useUpdateTrainer();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: trainer?.full_name || "",
      email: trainer?.email || "",
      phone: trainer?.phone || "",
      club_ids: trainer?.club_id ? [trainer.club_id] : [],
      specialty: trainer?.specialty || "",
      photo_url: trainer?.photo_url || "",
      is_active: trainer?.is_active ?? true,
    },
  });

  const onSubmit = (data: FormData) => {
    if (trainer) {
      updateMutation.mutate({ 
        id: trainer.id,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || "",
        club_id: data.club_ids[0], // Use first selected club
        specialty: data.specialty,
        photo_url: data.photo_url || undefined,
        is_active: data.is_active,
      }, {
        onSuccess: () => onClose(),
      });
    } else {
      const createData = {
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || "",
        club_id: data.club_ids[0], // Use first selected club
        specialty: data.specialty,
        photo_url: data.photo_url,
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
          {trainer ? 'Editar Profesor' : 'Nuevo Profesor'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5" />
            <span>Datos del Profesor</span>
          </CardTitle>
          <CardDescription>
            {trainer ? 'Edita la información del profesor' : 'Crea un nuevo profesor en el sistema'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan Pérez García" {...field} disabled={!!trainer} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="juan@example.com" {...field} disabled={!!trainer} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+34 666 123 456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especialidad (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Iniciación, Técnica avanzada..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="photo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de la foto (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="club_ids"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Clubs Asignados</FormLabel>
                      <FormDescription>
                        Selecciona los clubs donde podrá dar clases este profesor
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {clubs?.map((club) => (
                        <FormField
                          key={club.id}
                          control={form.control}
                          name="club_ids"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={club.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(club.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, club.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== club.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {club.name}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
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
                      <FormLabel>Profesor activo</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {trainer ? 'Actualizar' : 'Crear'} Profesor
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainerForm;
