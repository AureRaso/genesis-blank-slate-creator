
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, UserCheck, Info } from "lucide-react";
import { useClubs } from "@/hooks/useClubs";
import { useCreateTrainer, useUpdateTrainer, Trainer } from "@/hooks/useTrainers";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  full_name: z.string().min(1, "Introduce el nombre completo"),
  email: z.string().email("Email inválido"),
  club_id: z.string().min(1, "Selecciona un club"),
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
      full_name: trainer?.profiles?.full_name || "",
      email: trainer?.profiles?.email || "",
      club_id: trainer?.trainer_clubs?.[0]?.clubs?.id || "",
      specialty: trainer?.specialty || "",
      photo_url: trainer?.photo_url || "",
      is_active: trainer?.is_active ?? true,
    },
  });

  const onSubmit = (data: FormData) => {
    if (trainer) {
      updateMutation.mutate({ 
        id: trainer.id,
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
        club_id: data.club_id,
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

      {!trainer && (
        <Alert className="border-orange-200 bg-orange-50">
          <Info className="h-4 w-4 text-playtomic-orange" />
          <AlertDescription className="text-playtomic-orange-dark">
            <strong>Importante:</strong> Al crear un nuevo profesor se generará automáticamente una cuenta de usuario con contraseña temporal. 
            La contraseña se mostrará una vez creado para que puedas compartirla con el profesor.
          </AlertDescription>
        </Alert>
      )}

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
                      {!trainer && (
                        <FormDescription>
                          Se creará automáticamente una cuenta de usuario con este email
                        </FormDescription>
                      )}
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
                name="club_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club Asignado</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        disabled={!!trainer}
                      >
                        <option value="">Selecciona un club</option>
                        {clubs?.map((club) => (
                          <option key={club.id} value={club.id}>
                            {club.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormDescription>
                      Selecciona el club donde podrá dar clases este profesor
                    </FormDescription>
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
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {trainer ? 'Actualizando...' : 'Creando...'}
                    </div>
                  ) : (
                    <>{trainer ? 'Actualizar' : 'Crear'} Profesor</>
                  )}
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
