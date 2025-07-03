
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Zap, UserPlus, LogIn, Mail, Lock, User } from "lucide-react";

export const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect to home if user is already authenticated
  useEffect(() => {
    if (user) {
      console.log('User is authenticated, redirecting to home...');
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: "Error al iniciar sesión",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente",
        });
        // Navigation will happen automatically via useEffect when user state updates
      }
    } catch (error) {
      console.error("Error signing in:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast({
          title: "Error al registrarse",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "¡Registro exitoso!",
          description: "Cuenta creada correctamente, redirigiendo...",
        });
        // Navigation will happen automatically via useEffect when user state updates
      }
    } catch (error) {
      console.error("Error signing up:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSession = async () => {
    try {
      localStorage.clear();
      await supabase.auth.signOut();
      toast({
        title: "Sesión limpiada",
        description: "Cache y sesión eliminados",
      });
      window.location.reload();
    } catch (error) {
      console.error("Error clearing session:", error);
      toast({
        title: "Error",
        description: "No se pudo limpiar la sesión",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header con logo y título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark p-4 rounded-full shadow-lg">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark bg-clip-text text-transparent">
            Padel Pro
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona tu club de pádel profesionalmente
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-semibold text-gray-800">
              Acceso al Sistema
            </CardTitle>
            <CardDescription className="text-gray-600">
              Inicia sesión o crea tu cuenta para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100">
                <TabsTrigger 
                  value="signin" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-playtomic-orange"
                >
                  <LogIn className="h-4 w-4" />
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-playtomic-orange"
                >
                  <UserPlus className="h-4 w-4" />
                  Registrarse
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-gray-700 font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="pl-10 h-12 border-gray-200 focus:border-playtomic-orange focus:ring-playtomic-orange"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-gray-700 font-medium">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Tu contraseña"
                        className="pl-10 h-12 border-gray-200 focus:border-playtomic-orange focus:ring-playtomic-orange"
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange text-white font-semibold shadow-lg transition-all duration-200 transform hover:scale-105" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Iniciando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        Iniciar Sesión
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-gray-700 font-medium">
                      Nombre Completo
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Tu nombre completo"
                        className="pl-10 h-12 border-gray-200 focus:border-playtomic-orange focus:ring-playtomic-orange"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-gray-700 font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="pl-10 h-12 border-gray-200 focus:border-playtomic-orange focus:ring-playtomic-orange"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-gray-700 font-medium">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Elige una contraseña segura"
                        className="pl-10 h-12 border-gray-200 focus:border-playtomic-orange focus:ring-playtomic-orange"
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange text-white font-semibold shadow-lg transition-all duration-200 transform hover:scale-105" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creando cuenta...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Crear Cuenta
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={handleClearSession}
                className="w-full text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              >
                Limpiar Sesión y Caché
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2024 Padel Pro. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
