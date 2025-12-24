import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateEjercicio, useUpdateEjercicio } from "@/hooks/useEjercicios";
import EditorPista from "./EditorPista";
import {
  Ejercicio,
  CATEGORIAS,
  NIVELES,
  INTENSIDADES,
  JUGADORES_OPTIONS,
  CategoriaEjercicio,
  NivelEjercicio,
  IntensidadEjercicio,
  PosicionJugador,
  Movimiento
} from "@/types/ejercicios";

interface EjercicioModalProps {
  ejercicio: Ejercicio | null;
  isOpen: boolean;
  onClose: () => void;
  viewOnly?: boolean;
}

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  categoria: z.enum(['Volea', 'Bandeja', 'Defensa', 'Táctica', 'Calentamiento', 'Remate', 'Saque', 'Globo', 'Dejada', 'Víbora', 'Ataque', 'Transiciones']),
  nivel: z.enum(['Iniciación', 'Intermedio', 'Avanzado']),
  duracion: z.number().min(1, "La duración debe ser mayor a 0"),
  jugadores: z.number().min(2).max(4),
  intensidad: z.enum(['Baja', 'Media', 'Alta']),
  objetivo: z.string().min(1, "El objetivo es obligatorio"),
  descripcion: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const EjercicioModal = ({ ejercicio, isOpen, onClose, viewOnly = false }: EjercicioModalProps) => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const createMutation = useCreateEjercicio();
  const updateMutation = useUpdateEjercicio();

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [posiciones, setPosiciones] = useState<PosicionJugador[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      categoria: 'Volea',
      nivel: 'Iniciación',
      duracion: 15,
      jugadores: 2,
      intensidad: 'Media',
      objetivo: '',
      descripcion: '',
    },
  });

  // Cargar datos cuando se edita
  useEffect(() => {
    if (ejercicio) {
      form.reset({
        nombre: ejercicio.nombre,
        categoria: ejercicio.categoria,
        nivel: ejercicio.nivel,
        duracion: ejercicio.duracion,
        jugadores: ejercicio.jugadores,
        intensidad: ejercicio.intensidad,
        objetivo: ejercicio.objetivo,
        descripcion: ejercicio.descripcion || '',
      });
      setTags(ejercicio.tags || []);
      setPosiciones(ejercicio.posiciones || []);
      setMovimientos(ejercicio.movimientos || []);
    } else {
      form.reset({
        nombre: '',
        categoria: 'Volea',
        nivel: 'Iniciación',
        duracion: 15,
        jugadores: 2,
        intensidad: 'Media',
        objetivo: '',
        descripcion: '',
      });
      setTags([]);
      setPosiciones([]);
      setMovimientos([]);
    }
  }, [ejercicio, form]);

  // Manejar tags
  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!profile?.club_id) return;

    const ejercicioData = {
      ...data,
      club_id: profile.club_id,
      tags,
      posiciones,
      movimientos,
    };

    try {
      if (ejercicio) {
        await updateMutation.mutateAsync({ id: ejercicio.id, ...ejercicioData });
      } else {
        await createMutation.mutateAsync(ejercicioData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving ejercicio:', error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {viewOnly
              ? ejercicio?.nombre
              : ejercicio
                ? t('ejerciciosPage.modal.editTitle', 'Editar Ejercicio')
                : t('ejerciciosPage.modal.newTitle', 'Nuevo Ejercicio')
            }
          </DialogTitle>
          <DialogDescription>
            {viewOnly
              ? t('ejerciciosPage.modal.viewDescription', 'Detalles del ejercicio')
              : ejercicio
                ? t('ejerciciosPage.modal.editDescription', 'Modifica los datos del ejercicio')
                : t('ejerciciosPage.modal.newDescription', 'Crea un nuevo ejercicio para tu biblioteca')
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Columna izquierda - Formulario */}
              <div className="space-y-4">
                {/* Nombre */}
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('ejerciciosPage.form.nombre', 'Nombre del ejercicio')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('ejerciciosPage.form.nombrePlaceholder', 'Ej: Volea cruzada en red')}
                          {...field}
                          disabled={viewOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Categoría y Nivel */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('ejerciciosPage.form.categoria', 'Categoría')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={viewOnly}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIAS.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {t(`ejerciciosPage.categories.${cat.toLowerCase()}`, cat)}
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
                    name="nivel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('ejerciciosPage.form.nivel', 'Nivel')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={viewOnly}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {NIVELES.map((niv) => (
                              <SelectItem key={niv} value={niv}>
                                {t(`ejerciciosPage.levels.${niv.toLowerCase()}`, niv)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Duración, Jugadores, Intensidad */}
                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="duracion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('ejerciciosPage.form.duracion', 'Duración (min)')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            disabled={viewOnly}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jugadores"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('ejerciciosPage.form.jugadores', 'Jugadores')}</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(parseInt(v))}
                          value={field.value.toString()}
                          disabled={viewOnly}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {JUGADORES_OPTIONS.map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}
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
                    name="intensidad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('ejerciciosPage.form.intensidad', 'Intensidad')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={viewOnly}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INTENSIDADES.map((int) => (
                              <SelectItem key={int} value={int}>
                                {t(`ejerciciosPage.intensities.${int.toLowerCase()}`, int)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Objetivo */}
                <FormField
                  control={form.control}
                  name="objetivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('ejerciciosPage.form.objetivo', 'Objetivo')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('ejerciciosPage.form.objetivoPlaceholder', 'Ej: Mejorar precisión y timing')}
                          {...field}
                          disabled={viewOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Descripción */}
                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('ejerciciosPage.form.descripcion', 'Descripción (opcional)')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('ejerciciosPage.form.descripcionPlaceholder', 'Describe el ejercicio en detalle...')}
                          rows={3}
                          {...field}
                          disabled={viewOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tags */}
                <div>
                  <FormLabel>{t('ejerciciosPage.form.tags', 'Etiquetas')}</FormLabel>
                  {!viewOnly && (
                    <div className="flex gap-2 mt-1.5">
                      <Input
                        placeholder={t('ejerciciosPage.form.tagsPlaceholder', 'Añadir etiqueta...')}
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" onClick={handleAddTag}>
                        {t('ejerciciosPage.form.addTag', 'Añadir')}
                      </Button>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {tag}
                        {!viewOnly && (
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleRemoveTag(tag)}
                          />
                        )}
                      </Badge>
                    ))}
                    {tags.length === 0 && (
                      <span className="text-sm text-muted-foreground">
                        {t('ejerciciosPage.form.noTags', 'Sin etiquetas')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Columna derecha - Editor de pista */}
              <div>
                <EditorPista
                  posiciones={posiciones}
                  movimientos={movimientos}
                  onPosicionesChange={setPosiciones}
                  onMovimientosChange={setMovimientos}
                  readonly={viewOnly}
                />
              </div>
            </div>

            {/* Botones */}
            {!viewOnly && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  {t('common.cancel', 'Cancelar')}
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark"
                >
                  {isLoading
                    ? t('common.saving', 'Guardando...')
                    : ejercicio
                      ? t('ejerciciosPage.modal.saveChanges', 'Guardar Cambios')
                      : t('ejerciciosPage.modal.createExercise', 'Crear Ejercicio')
                  }
                </Button>
              </div>
            )}

            {viewOnly && (
              <div className="flex justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  {t('common.close', 'Cerrar')}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EjercicioModal;
