import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Target, CheckCircle2, Phone } from "lucide-react";
import ClubCodeInput from "@/components/ClubCodeInput";
import { supabase } from "@/integrations/supabase/client";
import padelockLogo from "@/assets/PadeLock_D5Red.png";

export const CompleteProfile = () => {
  const [level, setLevel] = useState("5"); // Nivel por defecto: 5
  const [phone, setPhone] = useState("");
  const [clubCode, setClubCode] = useState("");
  const [selectedClubId, setSelectedClubId] = useState("");
  const [selectedClubName, setSelectedClubName] = useState<string | null>(null);
  const [clubError, setClubError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  console.log('🔧 CompleteProfile - Component rendering:', {
    user: user?.id,
    profile: profile?.id,
    profileRole: profile?.role,
    profileClubId: profile?.club_id,
    profileLevel: profile?.level,
    selectedClubId,
    level
  });

  // Redirect if not authenticated
  useEffect(() => {
    console.log('🔧 CompleteProfile - Auth check:', { hasUser: !!user });
    if (!user) {
      console.log('🔧 CompleteProfile - No user, redirecting to auth');
      navigate("/auth", { replace: true });
    }
  }, [user, navigate]);

  // Redirect if profile is already complete or user is not a player
  useEffect(() => {
    console.log('🔧 CompleteProfile - Profile check:', {
      hasProfile: !!profile,
      role: profile?.role,
      clubId: profile?.club_id,
      level: profile?.level
    });

    if (profile) {
      // Only players need to complete profile with club and level
      if (profile.role !== 'player') {
        console.log('🔧 CompleteProfile - User is not a player, redirecting to dashboard');
        navigate("/dashboard", { replace: true });
        return;
      }

      if (profile.club_id && profile.level) {
        console.log('🔧 CompleteProfile - Player profile already complete, redirecting to dashboard');
        navigate("/dashboard", { replace: true });
      }
    }
  }, [profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🔧 CompleteProfile - Form submitted:', { level, phone, selectedClubId });

    // Validations
    if (!phone || !selectedClubId) {
      console.log('🔧 CompleteProfile - Validation failed: missing fields');
      if (!selectedClubId) {
        setClubError("Debes ingresar un código de club válido");
      }
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive"
      });
      return;
    }

    // Nivel por defecto: 5 (siempre)
    const numLevel = 5;

    console.log('🔧 CompleteProfile - Validation passed, updating profile...');
    setIsLoading(true);

    try {
      console.log('🔧 CompleteProfile - Updating profile with:', {
        club_id: selectedClubId,
        level: numLevel,
        phone: phone,
        user_id: user!.id
      });

      // Update the profile with club_id, level, and phone
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          club_id: selectedClubId,
          level: numLevel,
          phone: phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user!.id);

      if (profileError) {
        console.error('🔧 CompleteProfile - Error updating profile:', profileError);
        toast({
          title: "Error",
          description: "No se pudo actualizar el perfil: " + profileError.message,
          variant: "destructive"
        });
        return;
      }

      console.log('🔧 CompleteProfile - Profile updated successfully');

      // Create student_enrollment if it doesn't exist
      console.log('🔧 CompleteProfile - Checking for existing student enrollment...');
      console.log('🔧 CompleteProfile - User email:', user!.email);

      // First check if enrollment already exists
      const { data: existingEnrollment, error: checkError } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('email', user!.email!)
        .maybeSingle();

      console.log('🔧 CompleteProfile - Existing enrollment check:', {
        existingEnrollment,
        checkError,
        hasExisting: !!existingEnrollment
      });

      if (!existingEnrollment) {
        // First, try to get a trainer from the selected club
        console.log('🔧 CompleteProfile - Finding trainer for club:', selectedClubId);

        // Try to find trainer assigned to this club via trainer_clubs
        const { data: trainerClubs } = await supabase
          .from('trainer_clubs')
          .select('trainer_profile_id')
          .eq('club_id', selectedClubId)
          .limit(1);

        let trainerId: string | null = null;

        if (trainerClubs && trainerClubs.length > 0) {
          trainerId = trainerClubs[0].trainer_profile_id;
          console.log('🔧 CompleteProfile - Found trainer via trainer_clubs:', trainerId);
        } else {
          // Fallback: try to find any trainer with this club_id
          const { data: trainers } = await supabase
            .from('profiles')
            .select('id')
            .eq('club_id', selectedClubId)
            .eq('role', 'trainer')
            .limit(1);

          if (trainers && trainers.length > 0) {
            trainerId = trainers[0].id;
            console.log('🔧 CompleteProfile - Found trainer via profiles:', trainerId);
          } else {
            // Last fallback: use an admin
            const { data: admins } = await supabase
              .from('profiles')
              .select('id')
              .eq('role', 'admin')
              .limit(1);

            if (admins && admins.length > 0) {
              trainerId = admins[0].id;
              console.log('🔧 CompleteProfile - Using admin as fallback:', trainerId);
            }
          }
        }

        if (!trainerId) {
          console.error('🔧 CompleteProfile - No trainer or admin found');
          toast({
            title: "Error",
            description: "No se encontró un entrenador o administrador. Contacta con soporte.",
            variant: "destructive"
          });
          return;
        }

        console.log('🔧 CompleteProfile - Using trainer/admin:', trainerId);

        const enrollmentData = {
          trainer_profile_id: trainerId,
          created_by_profile_id: user!.id,
          email: user!.email!,
          full_name: user!.user_metadata?.full_name || user!.email!,
          phone: user!.user_metadata?.phone || '',
          level: numLevel,
          club_id: selectedClubId,
          status: 'active'
        };

        console.log('🔧 CompleteProfile - Creating enrollment with data:', enrollmentData);

        const { data: insertedData, error: enrollmentError } = await supabase
          .from('student_enrollments')
          .insert(enrollmentData)
          .select();

        console.log('🔧 CompleteProfile - Enrollment insert result:', {
          insertedData,
          enrollmentError
        });

        if (enrollmentError) {
          console.error('🔧 CompleteProfile - Error creating enrollment:', enrollmentError);
          console.error('🔧 CompleteProfile - Error details:', {
            message: enrollmentError.message,
            details: enrollmentError.details,
            hint: enrollmentError.hint,
            code: enrollmentError.code
          });
          // Don't fail the whole process if enrollment fails, just log it
          toast({
            title: "Advertencia",
            description: "Perfil actualizado pero hubo un problema al crear el enrollment: " + enrollmentError.message,
            variant: "destructive"
          });
        } else {
          console.log('🔧 CompleteProfile - ✅ Student enrollment created successfully:', insertedData);
        }
      } else {
        console.log('🔧 CompleteProfile - Student enrollment already exists, skipping creation');
      }

      toast({
        title: "¡Perfil completado!",
        description: "Tu perfil ha sido actualizado correctamente"
      });

      // Wait a moment for the profile to update in the context
      console.log('🔧 CompleteProfile - Waiting before redirect...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Force a page reload to ensure fresh data
      console.log('🔧 CompleteProfile - Redirecting to dashboard...');
      window.location.href = "/dashboard";
    } catch (error: any) {
      console.error('🔧 CompleteProfile - Exception in handleSubmit:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-playtomic-dark to-slate-900 flex items-center justify-center p-4 py-6 relative overflow-x-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-playtomic-orange/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-playtomic-orange/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-playtomic-orange/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src={padelockLogo}
            alt="PadeLock Logo"
            className="h-20 lg:h-24 w-auto drop-shadow-2xl"
          />
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          <CardHeader className="text-center space-y-3 pb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-playtomic-orange/20 to-playtomic-orange/30 flex items-center justify-center shadow-xl mb-2">
              <CheckCircle2 className="h-8 w-8 text-playtomic-orange" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-playtomic-dark to-slate-700 bg-clip-text text-transparent">
              Completa tu Perfil
            </CardTitle>
            <CardDescription className="text-base text-slate-600">
              Solo necesitamos algunos datos más para personalizar tu experiencia
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User info display */}
              <div className="bg-gradient-to-r from-playtomic-orange/10 to-orange-600/10 rounded-xl p-4 border border-playtomic-orange/20">
                <div className="flex items-center gap-3">
                  {user?.user_metadata?.avatar_url && (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Profile"
                      className="w-12 h-12 rounded-full border-2 border-playtomic-orange"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">
                      {user?.user_metadata?.full_name || user?.email}
                    </p>
                    <p className="text-sm text-slate-600">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                  Teléfono *
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+34 600 00 00 00"
                    className="pl-11 h-12 text-base border-slate-200 focus:border-playtomic-orange focus:ring-playtomic-orange/20 focus:ring-2"
                    required
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Introduce tu número de teléfono de contacto
                </p>
              </div>

              {/* Mensaje informativo sobre el nivel */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Nivel de juego
                    </p>
                    <p className="text-sm text-blue-800">
                      Tu nivel inicial se establecerá en <strong>5 (intermedio)</strong>. Podrás ajustarlo más adelante desde tu perfil o tu entrenador podrá modificarlo según tu progreso.
                    </p>
                  </div>
                </div>
              </div>

              {/* Club code input */}
              <div className="space-y-2">
                <ClubCodeInput
                  value={clubCode}
                  onValueChange={(code, clubId, clubName) => {
                    console.log('🔧 ClubCodeInput - Value changed:', { code, clubId, clubName });
                    setClubCode(code);
                    setSelectedClubId(clubId || "");
                    setSelectedClubName(clubName);
                    if (clubError) setClubError("");
                  }}
                  label="Código de Club"
                  placeholder="ABC"
                  required
                  error={clubError}
                />
                <p className="text-xs text-slate-500">
                  Ingresa el código de 3 letras que te proporcionó tu entrenador
                </p>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-playtomic-orange to-orange-600 hover:from-playtomic-orange/90 hover:to-orange-700 text-white font-semibold text-base shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] mt-8"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Guardando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Completar Perfil
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-slate-400">
          <p>© 2025 PadeLock. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
