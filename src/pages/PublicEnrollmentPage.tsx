import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, MapPin, Users, Calendar, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EnrollmentTokenData {
  token: string;
  class_id: string;
  available_spots: number;
  expires_at: string;
  is_active: boolean;
  used_count: number;
}

interface ClassInfo {
  name: string;
  start_time: string;
  days_of_week: string[];
  max_participants: number;
  level_from?: number;
  level_to?: number;
  custom_level?: string;
  club_id: string;
  trainer_profile_id: string;
}

interface EnrollmentForm {
  full_name: string;
  email: string;
  phone: string;
  level: number;
  observations: string;
}

const PublicEnrollmentPage = () => {
  const { token } = useParams<{ token: string }>();
  const [tokenData, setTokenData] = useState<EnrollmentTokenData | null>(null);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<EnrollmentForm>({
    full_name: '',
    email: '',
    phone: '',
    level: 3,
    observations: ''
  });

  useEffect(() => {
    if (!token) return;
    fetchTokenData();
  }, [token]);

  const fetchTokenData = async () => {
    try {
      // Obtener información del token
      const { data: tokenInfo, error: tokenError } = await supabase
        .from('enrollment_tokens')
        .select('*')
        .eq('token', token)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (tokenError || !tokenInfo || tokenInfo.used_count >= tokenInfo.available_spots) {
        setError('Enlace de inscripción inválido o expirado');
        setLoading(false);
        return;
      }

      setTokenData(tokenInfo);

      // Obtener información de la clase
      const { data: classData, error: classError } = await supabase
        .from('programmed_classes')
        .select('*')
        .eq('id', tokenInfo.class_id)
        .single();

      if (classError || !classData) {
        setError('Error al cargar la información de la clase');
        setLoading(false);
        return;
      }

      setClassInfo(classData);
    } catch (err) {
      console.error('Error fetching token data:', err);
      setError('Error al cargar la información de inscripción');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenData || !classInfo) return;

    setSubmitting(true);
    try {
      // Crear inscripción del estudiante
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .insert({
          trainer_profile_id: classInfo.trainer_profile_id,
          club_id: classInfo.club_id,
          created_by_profile_id: classInfo.trainer_profile_id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          level: formData.level,
          weekly_days: classInfo.days_of_week,
          preferred_times: [classInfo.start_time],
          enrollment_period: 'mensual',
          observations: formData.observations,
          status: 'active'
        })
        .select()
        .single();

      if (enrollmentError) {
        console.error('Error creating enrollment:', enrollmentError);
        toast.error('Error al crear la inscripción');
        return;
      }

      // Obtener la siguiente posición en la lista de espera
      const { count: waitlistCount } = await supabase
        .from('waitlists')
        .select('*', { count: 'exact' })
        .eq('class_id', tokenData.class_id);

      // Agregar a lista de espera
      const { error: waitlistError } = await supabase
        .from('waitlists')
        .insert({
          user_id: enrollment.id,
          class_id: tokenData.class_id,
          status: 'waiting',
          position: (waitlistCount || 0) + 1
        });

      if (waitlistError) {
        console.error('Error adding to waitlist:', waitlistError);
        toast.error('Error al agregar a la lista de espera');
        return;
      }

      // Actualizar contador de uso del token
      await supabase
        .from('enrollment_tokens')
        .update({ used_count: tokenData.used_count + 1 })
        .eq('token', token);

      setSuccess(true);
      toast.success('¡Inscripción exitosa! Te hemos agregado a la lista de espera.');
      
    } catch (err) {
      console.error('Error submitting enrollment:', err);
      toast.error('Error al procesar la inscripción');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof EnrollmentForm, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatTime = (time: string) => time.substring(0, 5);
  const formatDays = (days: string[]) => days.join(', ');

  const getLevelDisplay = () => {
    if (classInfo?.custom_level) {
      return classInfo.custom_level;
    }
    if (classInfo?.level_from && classInfo?.level_to) {
      return `${classInfo.level_from} - ${classInfo.level_to}`;
    }
    return 'Todos los niveles';
  };

  const getRemainingTime = () => {
    if (!tokenData) return '';
    const now = new Date().getTime();
    const expiresAt = new Date(tokenData.expires_at).getTime();
    const timeLeft = expiresAt - now;
    
    if (timeLeft <= 0) return 'Expirado';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m restantes`;
    }
    return `${minutes}m restantes`;
  };

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Cargando información...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !tokenData || !classInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <Trophy className="h-12 w-12 mx-auto mb-2" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Enlace no válido</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-green-500 mb-4">
              <Trophy className="h-12 w-12 mx-auto mb-2" />
            </div>
            <h2 className="text-xl font-semibold mb-2">¡Inscripción Exitosa!</h2>
            <p className="text-muted-foreground mb-4">
              Te hemos agregado a la lista de espera para la clase "{classInfo.name}".
            </p>
            <p className="text-sm text-muted-foreground">
              El profesor revisará tu solicitud y te notificaremos cuando seas aceptado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-primary">
                  🎾 ¡Plaza Disponible!
                </CardTitle>
                <CardDescription>
                  Una oportunidad única para unirte a esta clase
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  {getRemainingTime()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {tokenData.available_spots - tokenData.used_count} plazas restantes
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{classInfo.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>Máximo {classInfo.max_participants} participantes</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span>{formatDays(classInfo.days_of_week)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>{formatTime(classInfo.start_time)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>Nivel: {getLevelDisplay()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {!showForm ? (
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-4">¿Quieres unirte a esta clase?</h3>
              <p className="text-muted-foreground mb-6">
                Completa tu inscripción y te agregaremos a la lista de espera. 
                El profesor revisará tu solicitud y te notificaremos cuando seas aceptado.
              </p>
              <Button 
                onClick={() => setShowForm(true)}
                className="w-full"
                size="lg"
              >
                Comenzar Inscripción
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Completa tu Inscripción</CardTitle>
              <CardDescription>
                Ingresa tus datos para unirte a la lista de espera
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Nombre Completo *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="level">Nivel de Juego (1-10) *</Label>
                    <Input
                      id="level"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.level}
                      onChange={(e) => handleInputChange('level', parseInt(e.target.value))}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="observations">Observaciones (opcional)</Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) => handleInputChange('observations', e.target.value)}
                    placeholder="Cuéntanos sobre tu experiencia en pádel, objetivos, etc."
                    rows={3}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    Volver
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? 'Procesando...' : 'Unirme a Lista de Espera'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PublicEnrollmentPage;