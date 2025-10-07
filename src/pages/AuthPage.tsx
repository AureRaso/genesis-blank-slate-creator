import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { UserPlus, LogIn, Mail, Lock, User, Target, CheckCircle2 } from "lucide-react";
import ClubSelector from "@/components/ClubSelector";
import Footer from "@/components/Footer";
import padelockLogo from "@/assets/PadeLock_D5Red.png";

export const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [level, setLevel] = useState("");
  const [selectedClubId, setSelectedClubId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const {
    signIn,
    signInWithGoogle,
    signUp,
    user,
    profile
  } = useAuth();
  const navigate = useNavigate();

  // Redirect to home if user is already authenticated
  useEffect(() => {
    if (user && profile) {
      console.log('User is authenticated, checking profile completion...');

      // Only check profile completion for players
      if (profile.role === 'player' && (!profile.club_id || !profile.level)) {
        console.log('Player profile incomplete, redirecting to complete-profile');
        navigate("/complete-profile", { replace: true });
        return;
      }

      const redirectUrl = localStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectUrl, {
          replace: true
        });
      } else {
        navigate("/dashboard", {
          replace: true
        });
      }
    }
  }, [user, profile, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: "Error al iniciar sesión",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente"
        });
      }
    } catch (error) {
      console.error("Error signing in:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Error al iniciar sesión con Google",
          description: error.message,
          variant: "destructive"
        });
      }
      // El redirect lo maneja automáticamente Supabase
    } catch (error) {
      console.error("Error signing in with Google:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('AuthPage - handleSignUp called with:', {
      email,
      fullName,
      level,
      selectedClubId,
      passwordLength: password.length
    });

    // Validaciones
    if (!email || !confirmEmail || !password || !confirmPassword || !fullName || !level) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive"
      });
      return;
    }

    if (email !== confirmEmail) {
      toast({
        title: "Error",
        description: "Los emails no coinciden",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive"
      });
      return;
    }

    const numLevel = parseFloat(level);
    console.log('🔍 DEBUG - Level validation:', {
      levelString: level,
      levelNumber: numLevel,
      isNaN: isNaN(numLevel),
      isValid: !isNaN(numLevel) && numLevel >= 1.0 && numLevel <= 10.0
    });

    if (isNaN(numLevel) || numLevel < 1.0 || numLevel > 10.0) {
      toast({
        title: "Error",
        description: "El nivel debe ser un número entre 1.0 y 10.0",
        variant: "destructive"
      });
      return;
    }

    if (!selectedClubId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un club para completar el registro.",
        variant: "destructive"
      });
      return;
    }

    console.log('🔍 DEBUG - About to call signUp with:', {
      email,
      fullName,
      selectedClubId,
      numLevel,
      numLevelType: typeof numLevel
    });

    setIsLoading(true);
    try {
      const { error } = await signUp(email, password, fullName, selectedClubId, numLevel);
      console.log('🔍 DEBUG - signUp completed with error:', error);
      if (error) {
        toast({
          title: "Error al registrarse",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "¡Registro exitoso!",
          description: "Cuenta creada correctamente, redirigiendo..."
        });
      }
    } catch (error) {
      console.error("Error signing up:", error);
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
    <div className="min-h-screen lg:h-screen w-full bg-gradient-to-br from-slate-900 via-playtomic-dark to-slate-900 flex items-center justify-center p-4 py-6 relative overflow-x-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-playtomic-orange/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-playtomic-orange/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-playtomic-orange/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="w-full lg:h-full max-w-7xl flex flex-col lg:flex-row items-stretch gap-8 relative z-10 py-8 lg:py-0">
        {/* Panel izquierdo - Branding */}
        <div className="flex-1 flex flex-col justify-center text-center lg:text-left space-y-6 lg:space-y-8">
          {/* Logo */}
          <div className="flex justify-center lg:justify-start">
            <img
              src={padelockLogo}
              alt="PadeLock Logo"
              className="h-24 lg:h-32 xl:h-40 w-auto drop-shadow-2xl"
            />
          </div>

          {/* Hero text */}
          <div className="space-y-3 lg:space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
              Gestiona tu academia
              <span className="block bg-gradient-to-r from-playtomic-orange to-orange-400 bg-clip-text text-transparent">
                con éxito
              </span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-lg mx-auto lg:mx-0">
              La plataforma completa para administrar tu club, profesores y alumnos de manera profesional.
            </p>
          </div>

          {/* Features - Hidden on mobile to save space */}
          <div className="hidden lg:flex lg:flex-col space-y-4 max-w-lg">
            {[
              "Gestión completa de alumnos y matrículas",
              "Programación inteligente de clases",
              "Sistema de pagos integrado con Stripe",
              "Reportes y estadísticas en tiempo real"
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3 text-slate-200">
                <div className="mt-1 flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-playtomic-orange" />
                </div>
                <span className="text-base">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel derecho - Forms */}
<div className="flex-1 w-full max-w-md mx-auto lg:mx-0 flex flex-col justify-center">
  <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-2xl overflow-y-auto border border-white/20 max-h-[90vh] lg:max-h-[85vh]">
    <CardHeader className="text-center space-y-3 pb-8 pt-12 px-8">
      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
        Acceso al Sistema
      </CardTitle>
      <CardDescription className="text-base text-slate-600">
        Gestiona tu club de pádel de forma profesional
      </CardDescription>
    </CardHeader>
    
    <CardContent className="px-6 pb-8">
      <Tabs defaultValue="signin" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-slate-100/80 p-1 rounded-xl">
          <TabsTrigger
            value="signin"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-playtomic-orange rounded-lg transition-all duration-200 font-semibold"
          >
            <LogIn className="h-4 w-4" />
            <span>Iniciar Sesión</span>
          </TabsTrigger>
          <TabsTrigger
            value="signup"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-playtomic-orange rounded-lg transition-all duration-200 font-semibold"
          >
            <UserPlus className="h-4 w-4" />
            <span>Registrarse</span>
          </TabsTrigger>
        </TabsList>

        {/* Formulario de Inicio de Sesión */}
        <TabsContent value="signin" className="space-y-6 mt-2">
          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="signin-email" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="h-12 text-base border-slate-200 bg-white focus:border-playtomic-orange focus:ring-2 focus:ring-playtomic-orange/20 rounded-lg transition-all"
                  required
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="signin-password" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Contraseña
                </Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  className="h-12 text-base border-slate-200 bg-white focus:border-playtomic-orange focus:ring-2 focus:ring-playtomic-orange/20 rounded-lg transition-all"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-playtomic-orange to-orange-600 hover:from-playtomic-orange/90 hover:to-orange-700 text-white font-semibold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Iniciando Sesión...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Iniciar Sesión
                </div>
              )}
            </Button>

            {/* Divider mejorado */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-slate-500 font-medium">O continúa con</span>
              </div>
            </div>

            {/* Google Sign In Button mejorado */}
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full h-12 border-2 border-slate-200 hover:border-playtomic-orange/50 hover:bg-white text-slate-700 font-medium rounded-lg transition-all duration-200 hover:shadow-md"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </Button>
          </form>
        </TabsContent>

        {/* Formulario de Registro */}
        <TabsContent value="signup" className="space-y-6 mt-2">
          <form onSubmit={handleSignUp} className="space-y-6">
            {/* Nombre completo */}
            <div className="space-y-3">
              <Label htmlFor="signup-name" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <User className="h-4 w-4" />
                Nombre y Apellidos
              </Label>
              <Input
                id="signup-name"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Juan Pérez García"
                className="h-12 text-base border-slate-200 bg-white focus:border-playtomic-orange focus:ring-2 focus:ring-playtomic-orange/20 rounded-lg transition-all"
                required
              />
            </div>

            {/* Email y confirmación */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-3">
                <Label htmlFor="signup-email" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="h-12 text-base border-slate-200 bg-white focus:border-playtomic-orange focus:ring-2 focus:ring-playtomic-orange/20 rounded-lg transition-all"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="signup-confirm-email" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Confirmar Email
                </Label>
                <Input
                  id="signup-confirm-email"
                  type="email"
                  value={confirmEmail}
                  onChange={e => setConfirmEmail(e.target.value)}
                  placeholder="Confirma tu email"
                  className="h-12 text-base border-slate-200 bg-white focus:border-playtomic-orange focus:ring-2 focus:ring-playtomic-orange/20 rounded-lg transition-all"
                  required
                />
              </div>
            </div>

            {/* Contraseñas */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-3">
                <Label htmlFor="signup-password" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Contraseña
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="h-12 text-base border-slate-200 bg-white focus:border-playtomic-orange focus:ring-2 focus:ring-playtomic-orange/20 rounded-lg transition-all"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="signup-confirm-password" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirmar Contraseña
                </Label>
                <Input
                  id="signup-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className="h-12 text-base border-slate-200 bg-white focus:border-playtomic-orange focus:ring-2 focus:ring-playtomic-orange/20 rounded-lg transition-all"
                  required
                />
              </div>
            </div>

            {/* Club selector */}
            <div className="space-y-3">
              <ClubSelector
                value={selectedClubId}
                onValueChange={value => {
                  console.log('🔧 ClubSelector - Value changed to:', value);
                  setSelectedClubId(value);
                }}
                label="Club"
                placeholder="Selecciona tu club"
                required
              />
            </div>

            {/* Nivel de juego */}
            <div className="space-y-3">
              <Label htmlFor="signup-level" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Nivel de Juego (Playtomic)
              </Label>
              <Input
                id="signup-level"
                type="text"
                inputMode="decimal"
                value={level}
                onChange={e => {
                  const value = e.target.value;
                  // Allow only numbers and one decimal point
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setLevel(value);
                  }
                }}
                placeholder="Ej: 3.5"
                className="h-12 text-base border-slate-200 bg-white focus:border-playtomic-orange focus:ring-2 focus:ring-playtomic-orange/20 rounded-lg transition-all"
                required
              />
              <p className="text-xs text-slate-500">
                Introduce tu nivel Playtomic (1.0 - 10.0)
              </p>
            </div>

            {/* Checkbox de términos y condiciones */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-1 w-4 h-4 text-playtomic-orange bg-white border-slate-300 rounded focus:ring-playtomic-orange focus:ring-2"
                />
                <label htmlFor="terms" className="text-sm text-slate-700 leading-tight">
                  Acepto los{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-playtomic-orange hover:text-orange-600 font-medium underline">
                    Términos y Condiciones
                  </a>{' '}
                  y la{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-playtomic-orange hover:text-orange-600 font-medium underline">
                    Política de Privacidad
                  </a>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-playtomic-orange to-orange-600 hover:from-playtomic-orange/90 hover:to-orange-700 text-white font-semibold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 rounded-lg mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creando Cuenta...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Crear Cuenta
                </div>
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>

  {/* Footer */}
  <div className="mt-6 flex-shrink-0">
    <Footer />
  </div>
</div>
      </div>
    </div>
  );
};

export default AuthPage;
