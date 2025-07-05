import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Mail, Lock, User, Eye, EyeOff, Zap, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ClubSelector from "@/components/ClubSelector";

const AuthPage = () => {
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedClubId, setSelectedClubId] = useState("");

  console.log('AuthPage - Current selectedClubId:', selectedClubId);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    
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
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('AuthPage - handleSignup called with:', { 
      signupEmail, 
      signupFullName, 
      selectedClubId,
      passwordLength: signupPassword.length 
    });
    
    if (!signupEmail || !signupPassword || !signupFullName) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      });
      return;
    }

    if (!selectedClubId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un club para completar el registro.",
        variant: "destructive",
      });
      return;
    }

    if (signupPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (signupPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupFullName, selectedClubId);
    
    if (error) {
      toast({
        title: "Error al registrarse",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "¡Registro exitoso!",
        description: "Verifica tu email para activar tu cuenta",
      });
    }
    setLoading(false);
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, text: "" };
    if (password.length < 6) return { strength: 1, text: "Débil", color: "text-red-500" };
    if (password.length < 8) return { strength: 2, text: "Media", color: "text-yellow-500" };
    return { strength: 3, text: "Fuerte", color: "text-green-500" };
  };

  const passwordStrength = getPasswordStrength(signupPassword);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Background decorative elements - now cover full screen */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-green-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-blue-400/30 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-6 h-6 bg-green-400/30 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/6 w-3 h-3 bg-purple-400/20 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-1/4 left-3/4 w-5 h-5 bg-yellow-400/25 rounded-full animate-pulse delay-700"></div>
      </div>

      {/* Main content container - centered and full height */}
      <div className="w-full max-w-lg relative z-10 flex flex-col justify-center min-h-screen py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <Zap className="h-3 w-3 text-yellow-800" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            PadelApp
          </h1>
          <p className="text-gray-600 text-lg">Tu plataforma de gestión de pádel</p>
          <div className="flex items-center justify-center mt-4 space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
              <span>Partidos</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
              <span>Ligas</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
              <span>Estadísticas</span>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/50 backdrop-blur-sm p-1 rounded-2xl">
            <TabsTrigger 
              value="login" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300"
            >
              Iniciar Sesión
            </TabsTrigger>
            <TabsTrigger 
              value="signup"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300"
            >
              Registrarse
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-6">
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-800">¡Bienvenido de vuelta!</CardTitle>
                <CardDescription className="text-gray-600">
                  Ingresa tus credenciales para continuar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-gray-700 font-medium">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="pl-12 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all duration-300 bg-white/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-gray-700 font-medium">Contraseña</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Tu contraseña"
                        className="pl-12 pr-12 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all duration-300 bg-white/50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Iniciando sesión...
                      </>
                    ) : (
                      <>
                        <Trophy className="h-5 w-5 mr-2" />
                        Iniciar Sesión
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup" className="space-y-6">
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-800">¡Únete a PadelApp!</CardTitle>
                <CardDescription className="text-gray-600">
                  Crea tu cuenta y comienza a jugar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-gray-700 font-medium">Nombre Completo</Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="signup-name"
                        type="text"
                        value={signupFullName}
                        onChange={(e) => setSignupFullName(e.target.value)}
                        placeholder="Tu nombre completo"
                        className="pl-12 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all duration-300 bg-white/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-gray-700 font-medium">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="signup-email"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="pl-12 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all duration-300 bg-white/50"
                        required
                      />
                    </div>
                  </div>

                  <ClubSelector
                    value={selectedClubId}
                    onValueChange={(value) => {
                      console.log('AuthPage - Club selected:', value);
                      setSelectedClubId(value);
                    }}
                    label="Selecciona tu club"
                    placeholder="Elige el club al que quieres unirte"
                    required
                  />

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-gray-700 font-medium">Contraseña</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="pl-12 pr-12 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all duration-300 bg-white/50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {signupPassword && (
                      <div className="flex items-center mt-2">
                        <div className="flex space-x-1 mr-2">
                          {[1, 2, 3].map((level) => (
                            <div
                              key={level}
                              className={`h-2 w-6 rounded-full transition-colors ${
                                passwordStrength.strength >= level 
                                  ? level === 1 ? 'bg-red-500' : level === 2 ? 'bg-yellow-500' : 'bg-green-500'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`text-xs font-medium ${passwordStrength.color}`}>
                          {passwordStrength.text}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-gray-700 font-medium">Confirmar Contraseña</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite tu contraseña"
                        className="pl-12 pr-12 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all duration-300 bg-white/50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {confirmPassword && signupPassword !== confirmPassword && (
                      <p className="text-red-500 text-xs">Las contraseñas no coinciden</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creando cuenta...
                      </>
                    ) : (
                      <>
                        <User className="h-5 w-5 mr-2" />
                        Crear Cuenta
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Al registrarte, aceptas nuestros términos y condiciones</p>
          <p className="mt-2">© 2024 PadelApp. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
