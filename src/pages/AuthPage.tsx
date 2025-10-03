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

      // Check if profile is complete (has club_id and level)
      if (!profile.club_id || !profile.level) {
        console.log('Profile incomplete, redirecting to complete-profile');
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

    setIsLoading(true);
    try {
      const { error } = await signUp(email, password, fullName, selectedClubId);
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
              Gestiona tu academia de
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
        <div className="flex-1 w-full max-w-md mx-auto lg:mx-0 flex flex-col">
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl flex flex-col lg:h-full lg:max-h-full overflow-hidden">
            <CardHeader className="text-center space-y-2 pb-6 flex-shrink-0">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-playtomic-dark to-slate-700 bg-clip-text text-transparent">
                Acceso al Sistema
              </CardTitle>
              <CardDescription className="text-base text-slate-600">
                Inicia sesión o crea tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 flex-1 lg:overflow-y-auto">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-slate-100 p-1">
                  <TabsTrigger
                    value="signin"
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-playtomic-orange data-[state=active]:shadow-sm rounded-md transition-all"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="font-semibold">Iniciar Sesión</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-playtomic-orange data-[state=active]:shadow-sm rounded-md transition-all"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="font-semibold">Registrarse</span>
                  </TabsTrigger>
                </TabsList>

                {/* Formulario de Inicio de Sesión */}
                <TabsContent value="signin" className="space-y-5 mt-6">
                  <form onSubmit={handleSignIn} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-sm font-semibold text-slate-700">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                        <Input
                          id="signin-email"
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="tu@email.com"
                          className="pl-11 h-12 text-base border-slate-200 focus:border-playtomic-orange focus:ring-playtomic-orange/20 focus:ring-2"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-sm font-semibold text-slate-700">
                        Contraseña
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                        <Input
                          id="signin-password"
                          type="password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="Tu contraseña"
                          className="pl-11 h-12 text-base border-slate-200 focus:border-playtomic-orange focus:ring-playtomic-orange/20 focus:ring-2"
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-playtomic-orange to-orange-600 hover:from-playtomic-orange/90 hover:to-orange-700 text-white font-semibold text-base shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02]"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Iniciando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <LogIn className="h-5 w-5" />
                          Iniciar Sesión
                        </div>
                      )}
                    </Button>

                    {/* Divider */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-slate-500">O continúa con</span>
                      </div>
                    </div>

                    {/* Google Sign In Button */}
                    <Button
                      type="button"
                      onClick={handleGoogleSignIn}
                      variant="outline"
                      className="w-full h-12 border-2 border-slate-200 hover:border-playtomic-orange hover:bg-slate-50 transition-all duration-200"
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
                <TabsContent value="signup" className="space-y-4 mt-6">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    {/* Nombre completo */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-sm font-semibold text-slate-700">
                        Nombre y Apellidos
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                        <Input
                          id="signup-name"
                          type="text"
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          placeholder="Juan Pérez García"
                          className="pl-11 h-12 text-base border-slate-200 focus:border-playtomic-orange focus:ring-playtomic-orange/20 focus:ring-2"
                          required
                        />
                      </div>
                    </div>

                    {/* Email y confirmación en grid */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-sm font-semibold text-slate-700">
                          Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                          <Input
                            id="signup-email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            className="pl-11 h-12 text-base border-slate-200 focus:border-playtomic-orange focus:ring-playtomic-orange/20 focus:ring-2"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm-email" className="text-sm font-semibold text-slate-700">
                          Confirmar Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                          <Input
                            id="signup-confirm-email"
                            type="email"
                            value={confirmEmail}
                            onChange={e => setConfirmEmail(e.target.value)}
                            placeholder="Confirma tu email"
                            className="pl-11 h-12 text-base border-slate-200 focus:border-playtomic-orange focus:ring-playtomic-orange/20 focus:ring-2"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contraseñas en grid */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-sm font-semibold text-slate-700">
                          Contraseña
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                          <Input
                            id="signup-password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="pl-11 h-12 text-base border-slate-200 focus:border-playtomic-orange focus:ring-playtomic-orange/20 focus:ring-2"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm-password" className="text-sm font-semibold text-slate-700">
                          Confirmar Contraseña
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                          <Input
                            id="signup-confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Repite tu contraseña"
                            className="pl-11 h-12 text-base border-slate-200 focus:border-playtomic-orange focus:ring-playtomic-orange/20 focus:ring-2"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Club selector */}
                    <div className="space-y-2">
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
                    <div className="space-y-2">
                      <Label htmlFor="signup-level" className="text-sm font-semibold text-slate-700">
                        Nivel de Juego (Playtomic)
                      </Label>
                      <div className="relative">
                        <Target className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                        <Input
                          id="signup-level"
                          type="number"
                          step="0.1"
                          min="1.0"
                          max="10.0"
                          value={level}
                          onChange={e => setLevel(e.target.value)}
                          placeholder="Ej: 3.5"
                          className="pl-11 h-12 text-base border-slate-200 focus:border-playtomic-orange focus:ring-playtomic-orange/20 focus:ring-2"
                          required
                        />
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <span>Introduce tu nivel Playtomic (1.0 - 10.0)</span>
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-playtomic-orange to-orange-600 hover:from-playtomic-orange/90 hover:to-orange-700 text-white font-semibold text-base shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] mt-6"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Creando cuenta...
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
          <div className="text-center mt-4 text-sm text-slate-400 flex-shrink-0">
            <p>© 2025 PadeLock. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
