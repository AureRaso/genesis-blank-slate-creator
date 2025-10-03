import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { useWindowVisibility } from "@/hooks/useWindowVisibility";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, UserPlus, Link, Copy, User, Calendar, Loader2 } from "lucide-react";
import { useCreateStudentEnrollment, useCreateEnrollmentForm, useCompleteEnrollmentForm } from "@/hooks/useStudentEnrollments";
import { useAdminClubs } from "@/hooks/useClubs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const enrollmentSchema = z.object({
  full_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  confirm_email: z.string().email("Email inválido").optional(),
  phone: z.string().min(9, "Teléfono inválido"),
  level: z.number().min(1.0, "El nivel debe ser mínimo 1.0").max(10.0, "El nivel debe ser máximo 10.0"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
  confirm_password: z.string().optional(),
  weekly_days: z.array(z.string()).optional(),
  preferred_times: z.array(z.string()).optional(),
  enrollment_period: z.string().optional(),
  enrollment_date: z.string().optional(),
  expected_end_date: z.string().optional(),
  course: z.string().optional(),
  discount_1: z.number().optional(),
  discount_2: z.number().optional(),
  first_payment: z.number().optional(),
  payment_method: z.string().optional(),
  observations: z.string().optional(),
}).refine((data) => {
  // Verificar que los emails coincidan si está en modo player
  if (data.confirm_email) {
    return data.email === data.confirm_email;
  }
  return true;
}, {
  message: "Los emails no coinciden",
  path: ["confirm_email"],
}).refine((data) => {
  // Verificar que las contraseñas coincidan
  if (data.password || data.confirm_password) {
    return data.password === data.confirm_password;
  }
  return true;
}, {
  message: "Las contraseñas no coinciden",
  path: ["confirm_password"],
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

interface StudentEnrollmentFormProps {
  onClose: () => void;
  trainerProfile?: any;
  isPlayerMode?: boolean;
  onSuccess?: (email?: string) => void;
  enrollmentToken?: string;
}

const DAYS_OF_WEEK = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miercoles", label: "Miércoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
];

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
];

const StudentEnrollmentForm = ({ onClose, trainerProfile, isPlayerMode = false, onSuccess, enrollmentToken }: StudentEnrollmentFormProps) => {
  const [enrollmentMode, setEnrollmentMode] = useState<"teacher" | "link" | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const isWindowVisible = useWindowVisibility();

  const { isAdmin } = useAuth();
  const { data: adminClubs, isLoading: clubsLoading } = useAdminClubs();

  const createEnrollmentMutation = useCreateStudentEnrollment();
  const createLinkMutation = useCreateEnrollmentForm();
  const completeEnrollmentMutation = useCompleteEnrollmentForm();

  // Override onSuccess behavior 
  const enhancedCreateEnrollmentMutation = {
    ...createEnrollmentMutation,
    mutate: (data: any) => {
      createEnrollmentMutation.mutate(data, {
        onSuccess: (result) => {
          if (onSuccess) {
            onSuccess();
          }
        }
      });
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      weekly_days: [],
      preferred_times: [],
      level: 3.0,
    },
  });

  // Persistencia del formulario
  const persistenceKey = `student-enrollment-form-${trainerProfile?.id || 'unknown'}`;
  const { clearPersistedData } = useFormPersistence({
    key: persistenceKey,
    watch,
    setValue,
    exclude: ['weekly_days', 'preferred_times'] // Arrays pueden causar problemas, los manejamos separadamente
  });

  // Persistir arrays separadamente
  useEffect(() => {
    const savedMode = localStorage.getItem(`${persistenceKey}-mode`);
    const savedDays = localStorage.getItem(`${persistenceKey}-days`);
    const savedTimes = localStorage.getItem(`${persistenceKey}-times`);
    
    if (savedMode && !isPlayerMode) {
      setEnrollmentMode(savedMode as "teacher" | "link");
    }
    
    if (savedDays) {
      try {
        const days = JSON.parse(savedDays);
        setValue('weekly_days', days);
      } catch (e) {
        console.error('Error parsing saved days:', e);
      }
    }
    
    if (savedTimes) {
      try {
        const times = JSON.parse(savedTimes);
        setValue('preferred_times', times);
      } catch (e) {
        console.error('Error parsing saved times:', e);
      }
    }
  }, [setValue, persistenceKey, isPlayerMode]);

  // Guardar estado cuando cambie (solo cuando la ventana es visible)
  useEffect(() => {
    if (!isPlayerMode && enrollmentMode && isWindowVisible) {
      localStorage.setItem(`${persistenceKey}-mode`, enrollmentMode);
    }
  }, [enrollmentMode, persistenceKey, isPlayerMode, isWindowVisible]);

  useEffect(() => {
    if (!isWindowVisible) return; // Don't persist when window is not visible
    
    const subscription = watch((data) => {
      if (data.weekly_days) {
        localStorage.setItem(`${persistenceKey}-days`, JSON.stringify(data.weekly_days));
      }
      if (data.preferred_times) {
        localStorage.setItem(`${persistenceKey}-times`, JSON.stringify(data.preferred_times));
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, persistenceKey, isWindowVisible]);

  const watchedDays = watch("weekly_days");
  const watchedTimes = watch("preferred_times");

  const handleDayChange = (day: string, checked: boolean) => {
    const currentDays = watchedDays || [];
    if (checked) {
      setValue("weekly_days", [...currentDays, day]);
    } else {
      setValue("weekly_days", currentDays.filter(d => d !== day));
    }
  };

  const handleTimeChange = (time: string, checked: boolean) => {
    const currentTimes = watchedTimes || [];
    if (checked) {
      setValue("preferred_times", [...currentTimes, time]);
    } else {
      setValue("preferred_times", currentTimes.filter(t => t !== time));
    }
  };

  const onSubmit = (data: EnrollmentFormData) => {
    // Si es modo player (usuario anónimo con token), usar completeEnrollmentMutation
    if (isPlayerMode && enrollmentToken) {
      // Validar que tenga contraseña en modo player
      if (!data.password) {
        toast({
          title: "Error",
          description: "La contraseña es requerida",
          variant: "destructive",
        });
        return;
      }

      completeEnrollmentMutation.mutate({
        token: enrollmentToken,
        studentData: data
      }, {
        onSuccess: () => {
          if (onSuccess) {
            onSuccess(data.email);
          }
          // Limpiar datos persistidos después del envío exitoso
          clearPersistedData();
          localStorage.removeItem(`${persistenceKey}-mode`);
          localStorage.removeItem(`${persistenceKey}-days`);
          localStorage.removeItem(`${persistenceKey}-times`);
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      });
      return;
    }

    // En modo teacher/admin, se usa el club seleccionado
    let clubId;

    if (isPlayerMode && trainerProfile?.club_id) {
      clubId = trainerProfile.club_id;
    } else if (!isPlayerMode && isAdmin && selectedClubId) {
      clubId = selectedClubId;
    } else if (!isPlayerMode && trainerProfile?.trainer_clubs?.[0]?.club_id) {
      clubId = trainerProfile.trainer_clubs[0].club_id;
    }

    if (!clubId) {
      toast({
        title: "Error",
        description: isAdmin ? "Selecciona un club" : "No se pudo determinar el club",
        variant: "destructive",
      });
      return;
    }

    enhancedCreateEnrollmentMutation.mutate({
      ...data,
      club_id: clubId,
    } as any);

    // Limpiar datos persistidos después del envío exitoso
    clearPersistedData();
    localStorage.removeItem(`${persistenceKey}-mode`);
    localStorage.removeItem(`${persistenceKey}-days`);
    localStorage.removeItem(`${persistenceKey}-times`);
  };

  const handleCancel = () => {
    // Limpiar datos persistidos al cancelar
    clearPersistedData();
    localStorage.removeItem(`${persistenceKey}-mode`);
    localStorage.removeItem(`${persistenceKey}-days`);
    localStorage.removeItem(`${persistenceKey}-times`);
    onClose();
  };

  const handleCreateLink = async () => {
    let clubId;
    
    if (isAdmin && selectedClubId) {
      clubId = selectedClubId;
    } else if (trainerProfile?.trainer_clubs?.[0]?.club_id) {
      clubId = trainerProfile.trainer_clubs[0].club_id;
    }
    
    if (!clubId) {
      toast({
        title: "Error",
        description: isAdmin ? "Selecciona un club" : "No se pudo determinar el club del profesor",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createLinkMutation.mutateAsync({ club_id: clubId });
      const link = `${window.location.origin}/student-enrollment/${result.token}`;
      setGeneratedLink(link);
    } catch (error) {
      console.error("Error creating link:", error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast({
      title: "Enlace copiado",
      description: "El enlace ha sido copiado al portapapeles",
    });
  };

  if (!enrollmentMode && !isPlayerMode) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Nueva Inscripción de Alumno</CardTitle>
              <CardDescription>Elige cómo completar la inscripción</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Club selector for admins */}
          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="club-select">Selecciona el club</Label>
              <Select value={selectedClubId} onValueChange={setSelectedClubId} disabled={clubsLoading}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder={clubsLoading ? "Cargando clubes..." : "Selecciona un club"} />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {adminClubs?.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={() => setEnrollmentMode("teacher")}
            className="w-full h-auto p-6 flex flex-col items-center space-y-2"
            variant="outline"
            disabled={isAdmin && !selectedClubId}
          >
            <UserPlus className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold">Rellenar yo mismo</div>
              <div className="text-sm text-muted-foreground">Completo todos los datos del alumno</div>
            </div>
          </Button>

          <Button
            onClick={() => setEnrollmentMode("link")}
            className="w-full h-auto p-6 flex flex-col items-center space-y-2"
            variant="outline"
            disabled={isAdmin && !selectedClubId}
          >
            <Link className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold">Enviar enlace al alumno</div>
              <div className="text-sm text-muted-foreground">El alumno completa sus propios datos</div>
            </div>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (enrollmentMode === "link" && !generatedLink) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => {
              localStorage.removeItem(`${persistenceKey}-mode`);
              setEnrollmentMode(null);
            }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Generar Enlace de Inscripción</CardTitle>
              <CardDescription>Crea un enlace único para que el alumno complete su inscripción</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show selected club info for admins */}
          {isAdmin && selectedClubId && adminClubs && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Generando enlace para el club: <span className="font-medium">{adminClubs.find(c => c.id === selectedClubId)?.name}</span>
              </p>
            </div>
          )}
          
          <Button onClick={handleCreateLink} disabled={createLinkMutation.isPending} className="w-full">
            {createLinkMutation.isPending ? "Generando..." : "Generar Enlace"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (enrollmentMode === "link" && generatedLink) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Enlace Generado</CardTitle>
              <CardDescription>Comparte este enlace con el alumno</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Enlace de inscripción:</p>
            <p className="break-all font-mono text-sm">{generatedLink}</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={copyToClipboard} className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Copiar Enlace
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            El enlace expira en 7 días. El alumno podrá completar su inscripción usando este enlace.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
      <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={isPlayerMode ? handleCancel : () => {
              localStorage.removeItem(`${persistenceKey}-mode`);
              setEnrollmentMode(null);
            }} className="hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          <div className="flex-1">
            <CardTitle className="text-xl">
              {isPlayerMode ? "Completar Inscripción" : "Nueva Inscripción de Alumno"}
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {isPlayerMode
                ? "Completa tus datos para inscribirte en la escuela de pádel"
                : "Completa todos los datos del alumno"
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Data Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b">
              <div className="w-8 h-8 rounded-full bg-playtomic-orange/20 flex items-center justify-center">
                <User className="h-4 w-4 text-playtomic-orange" />
              </div>
              <h3 className="text-base font-semibold">Datos Personales</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium">Nombre y Apellidos *</Label>
                <Input
                  id="full_name"
                  {...register("full_name")}
                  placeholder="Juan Pérez García"
                  className="h-11"
                />
                {errors.full_name && (
                  <p className="text-sm text-red-600">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="correo@ejemplo.com"
                  className="h-11"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {isPlayerMode && (
                <div className="space-y-2">
                  <Label htmlFor="confirm_email" className="text-sm font-medium">Confirmar Email *</Label>
                  <Input
                    id="confirm_email"
                    type="email"
                    {...register("confirm_email")}
                    placeholder="correo@ejemplo.com"
                    className="h-11"
                  />
                  {errors.confirm_email && (
                    <p className="text-sm text-red-600">{errors.confirm_email.message}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Teléfono *</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="612 345 678"
                  className="h-11"
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="level" className="text-sm font-medium">Nivel de Juego *</Label>
                <Input
                  id="level"
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="10.0"
                  {...register("level", { valueAsNumber: true })}
                  placeholder="3.0"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Introduce tu nivel en Playtomic (1.0 - 10.0)
                </p>
                {errors.level && (
                  <p className="text-sm text-red-600">{errors.level.message}</p>
                )}
              </div>

              {isPlayerMode && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Contraseña *</Label>
                    <Input
                      id="password"
                      type="password"
                      {...register("password")}
                      placeholder="Mínimo 6 caracteres"
                      className="h-11"
                    />
                    {errors.password && (
                      <p className="text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password" className="text-sm font-medium">Confirmar Contraseña *</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      {...register("confirm_password")}
                      placeholder="Repite tu contraseña"
                      className="h-11"
                    />
                    {errors.confirm_password && (
                      <p className="text-sm text-red-600">{errors.confirm_password.message}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Schedule Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b">
              <div className="w-8 h-8 rounded-full bg-playtomic-orange/20 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-playtomic-orange" />
              </div>
              <h3 className="text-base font-semibold">Disponibilidad</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Días de la semana {!isPlayerMode && '(opcional)'}</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2 p-3 rounded-lg border hover:border-playtomic-orange/50 transition-colors">
                      <Checkbox
                        id={day.value}
                        checked={watchedDays?.includes(day.value) || false}
                        onCheckedChange={(checked) => handleDayChange(day.value, checked as boolean)}
                        className="data-[state=checked]:bg-playtomic-orange data-[state=checked]:border-playtomic-orange"
                      />
                      <Label htmlFor={day.value} className="text-sm font-normal cursor-pointer">{day.label}</Label>
                    </div>
                  ))}
                </div>
                {errors.weekly_days && (
                  <p className="text-sm text-red-600 mt-2">{errors.weekly_days.message}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Horarios preferidos {!isPlayerMode && '(opcional)'}</Label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-3">
                  {TIME_SLOTS.map((time) => (
                    <div key={time} className="flex items-center space-x-2 p-2 rounded-lg border hover:border-playtomic-orange/50 transition-colors">
                      <Checkbox
                        id={time}
                        checked={watchedTimes?.includes(time) || false}
                        onCheckedChange={(checked) => handleTimeChange(time, checked as boolean)}
                        className="data-[state=checked]:bg-playtomic-orange data-[state=checked]:border-playtomic-orange"
                      />
                      <Label htmlFor={time} className="text-sm font-normal cursor-pointer">{time}</Label>
                    </div>
                  ))}
                </div>
                {errors.preferred_times && (
                  <p className="text-sm text-red-600 mt-2">{errors.preferred_times.message}</p>
                )}
              </div>
            </div>

            {!isPlayerMode && (
              <div className="space-y-2">
                <Label htmlFor="enrollment_period">Período de Inscripción (opcional)</Label>
                <Select onValueChange={(value) => setValue("enrollment_period", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="bimensual">Bimensual</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
                {errors.enrollment_period && (
                  <p className="text-sm text-red-600">{errors.enrollment_period.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Teacher-only fields */}
          {!isPlayerMode && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Información Adicional (Solo Profesor)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="enrollment_date">Fecha de Alta</Label>
                  <Input
                    id="enrollment_date"
                    type="date"
                    {...register("enrollment_date")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_end_date">Fecha Prevista de Baja</Label>
                  <Input
                    id="expected_end_date"
                    type="date"
                    {...register("expected_end_date")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course">Curso</Label>
                  <Input
                    id="course"
                    {...register("course")}
                    placeholder="Nombre del curso"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="first_payment">Primera Cuota (€)</Label>
                  <Input
                    id="first_payment"
                    type="number"
                    step="0.01"
                    {...register("first_payment", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_1">Descuento 1 (€)</Label>
                  <Input
                    id="discount_1"
                    type="number"
                    step="0.01"
                    {...register("discount_1", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_2">Descuento 2 (€)</Label>
                  <Input
                    id="discount_2"
                    type="number"
                    step="0.01"
                    {...register("discount_2", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">Forma de Pago</Label>
                  <Select onValueChange={(value) => setValue("payment_method", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona forma de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="bizum">Bizum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="observations">Observaciones</Label>
                  <Textarea
                    id="observations"
                    {...register("observations")}
                    placeholder="Observaciones adicionales..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleCancel} className="sm:w-auto w-full h-11">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPlayerMode ? completeEnrollmentMutation.isPending : createEnrollmentMutation.isPending}
              className="sm:w-auto w-full h-11 bg-gradient-to-r from-playtomic-orange to-orange-600 hover:from-playtomic-orange/90 hover:to-orange-700 text-white shadow-lg"
            >
              {isPlayerMode
                ? (completeEnrollmentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : "Enviar Inscripción")
                : (createEnrollmentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : "Guardar Inscripción")
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default StudentEnrollmentForm;