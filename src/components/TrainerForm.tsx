
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, UserCheck } from "lucide-react";
import { useClubs, useAdminClubs } from "@/hooks/useClubs";
import { useCreateTrainer, useUpdateTrainer, Trainer } from "@/hooks/useTrainers";

const createFormSchema = z.object({
  full_name: z.string().min(1, "Introduce el nombre completo"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "Introduce el teléfono"),
  club_id: z.string().min(1, "Selecciona un club"),
  specialty: z.string().optional(),
  photo_url: z.string().url("URL inválida").optional().or(z.literal("")),
  is_active: z.boolean(),
});

const editFormSchema = z.object({
  specialty: z.string().optional(),
  photo_url: z.string().url("URL inválida").optional().or(z.literal("")),
  is_active: z.boolean(),
});

type CreateFormData = z.infer<typeof createFormSchema>;
type EditFormData = z.infer<typeof editFormSchema>;

interface TrainerFormProps {
  trainer?: Trainer;
  onClose: () => void;
}

const TrainerForm = ({ trainer, onClose }: TrainerFormProps) => {
  const { data: clubs } = useAdminClubs();
  const createMutation = useCreateTrainer();
  const updateMutation = useUpdateTrainer();

  const isEditing = !!trainer;

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      club_id: "",
      specialty: "",
      photo_url: "",
      is_active: true,
    },
  });

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      specialty: trainer?.specialty || "",
      photo_url: trainer?.photo_url || "",
      is_active: trainer?.is_active ?? true,
    },
  });

  const onCreateSubmit = (data: CreateFormData) => {
    // Ensure all required fields are present
    const submitData = {
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      club_id: data.club_id,
      specialty: data.specialty,
      photo_url: data.photo_url,
      is_active: data.is_active,
    };

    createMutation.mutate(submitData, {
      onSuccess: () => onClose(),
    });
  };

  const onEditSubmit = (data: EditFormData) => {
    if (!trainer) return;
    
    updateMutation.mutate({ 
      id: trainer.id,
      ...data,
    }, {
      onSuccess: () => onClose(),
    });
  };

  if (isEditing) {
    return (
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-black">
            Editar Profesor
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5" />
              <span>Datos del Profesor</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900">Información del perfil</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Nombre: {trainer.profiles?.full_name || 'No disponible'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Email: {trainer.profiles?.email || 'No disponible'}
                    </p>
                  </div>

                  <FormField
                    control={editForm.control}
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

                  {/*<FormField
                    control={editForm.control}
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
                  />*/}

                  <FormField
                    control={editForm.control}
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
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Actualizando...
                      </div>
                    ) : (
                      'Actualizar Profesor'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-black">
          Nuevo Profesor
        </h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5" />
            <span>Datos del Profesor</span>
          </CardTitle>
          <CardDescription>
            Crea un nuevo profesor en el sistema. Se creará automáticamente un usuario con contraseña temporal: 123456
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
              <div className="space-y-6">
                <FormField
                  control={createForm.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan Pérez García" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="juan@example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Este será el email de acceso al sistema
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="600 123 456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
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

                {/*<FormField
                  control={createForm.control}
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
                />*/}

                <FormField
                  control={createForm.control}
                  name="club_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Club Asignado</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full p-2 border border-gray-300 rounded-md"
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
                  control={createForm.control}
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
                  {createMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creando...
                    </div>
                  ) : (
                    'Crear Profesor'
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
