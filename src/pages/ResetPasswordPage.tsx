import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import padelockLogo from "@/assets/PadeLock_D5Red.png";
import { supabase } from "@/integrations/supabase/client";

export const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a valid recovery token in the URL
    const checkRecoveryToken = async () => {
      try {
        // Get the hash from URL (Supabase sends token in URL hash)
        const fullUrl = window.location.href;
        const hash = window.location.hash;

        console.log('🔍 Reset Password - Full URL:', fullUrl);
        console.log('🔍 Reset Password - Hash:', hash);

        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        console.log('🔍 Reset Password - Parsed params:', {
          hasAccessToken: !!accessToken,
          accessTokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : null,
          type,
          allHashParams: Array.from(hashParams.entries())
        });

        // Check if we have a hash at all
        if (!hash || hash.length < 10) {
          console.error('❌ No hash found in URL');
          toast({
            title: "Enlace incompleto",
            description: "Este enlace no contiene la información necesaria. Por favor, copia el enlace completo del email, incluyendo todo lo que viene después del símbolo #",
            variant: "destructive"
          });
          setTimeout(() => navigate('/forgot-password'), 3000);
          return;
        }

        // Verify it's a recovery token
        if (type !== 'recovery') {
          console.error('❌ Invalid token type:', type);
          toast({
            title: "Enlace inválido",
            description: type ? `Tipo de enlace incorrecto: ${type}. Se esperaba un enlace de recuperación de contraseña.` : "Este enlace no contiene un token de recuperación válido. Asegúrate de copiar el enlace completo del email.",
            variant: "destructive"
          });
          setTimeout(() => navigate('/forgot-password'), 3000);
          return;
        }

        if (!accessToken) {
          console.error('❌ No access token found');
          toast({
            title: "Enlace inválido",
            description: "Este enlace de recuperación ha expirado o no es válido. Por favor, solicita uno nuevo.",
            variant: "destructive"
          });
          setTimeout(() => navigate('/forgot-password'), 3000);
          return;
        }

        // Verify the session is valid
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);

        if (error || !user) {
          console.error('❌ Invalid session:', error);
          toast({
            title: "Sesión inválida",
            description: "Este enlace ha expirado. Solicita uno nuevo.",
            variant: "destructive"
          });
          setTimeout(() => navigate('/forgot-password'), 2000);
          return;
        }

        console.log('✅ Valid recovery token for user:', user.email);
        setIsValidToken(true);

      } catch (error) {
        console.error('Error validating recovery token:', error);
        toast({
          title: "Error",
          description: "Ocurrió un error al validar el enlace.",
          variant: "destructive"
        });
        setTimeout(() => navigate('/auth'), 2000);
      } finally {
        setIsValidating(false);
      }
    };

    checkRecoveryToken();
  }, [navigate]);

  const validatePassword = (password: string): boolean => {
    if (password.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive"
      });
      return;
    }

    if (!validatePassword(newPassword)) {
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "¡Contraseña actualizada!",
        description: "Tu contraseña ha sido restablecida correctamente.",
      });

      // Clear the hash from URL
      window.history.replaceState(null, '', window.location.pathname);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 2000);

    } catch (error: any) {
      console.error("Error updating password:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la contraseña. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating token
  if (isValidating) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-playtomic-dark to-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-playtomic-orange mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-playtomic-orange/20 mx-auto"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Validando enlace...</h2>
            <p className="text-slate-300 text-sm">Por favor espera</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!isValidToken) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-playtomic-dark to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-2xl">
          <CardContent className="pt-6">
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="ml-2 text-red-800">
                <p className="font-medium mb-2">Enlace inválido o expirado</p>
                <p className="text-sm">
                  Este enlace de recuperación no es válido o ha expirado.
                  Por favor, solicita uno nuevo.
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-playtomic-dark to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-playtomic-orange/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-playtomic-orange/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-playtomic-orange/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src={padelockLogo}
            alt="PadeLock Logo"
            className="h-24 w-auto drop-shadow-2xl"
          />
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-2xl border border-white/20">
          <CardHeader className="text-center space-y-3 pb-6 pt-8 px-8">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Nueva Contraseña
            </CardTitle>
            <CardDescription className="text-base text-slate-600">
              Ingresa tu nueva contraseña
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Alert className="bg-blue-50 border-blue-200">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <AlertDescription className="ml-2 text-blue-800 text-sm">
                  Tu contraseña debe tener al menos 6 caracteres.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="new-password" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Nueva Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      placeholder="Mínimo 6 caracteres"
                      className="h-12 text-base border-slate-200 bg-white focus:border-playtomic-orange focus:ring-2 focus:ring-playtomic-orange/20 rounded-lg transition-all pr-10"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="confirm-password" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Confirmar Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      placeholder="Repite tu contraseña"
                      className={`h-12 text-base bg-white focus:ring-2 rounded-lg transition-all pr-10 ${
                        passwordError
                          ? 'border-2 border-red-500 focus:border-red-500 focus:ring-red-200'
                          : 'border-slate-200 focus:border-playtomic-orange focus:ring-playtomic-orange/20'
                      }`}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-sm font-medium text-red-600 flex items-center gap-1.5">
                      <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                      {passwordError}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-playtomic-orange to-orange-600 hover:from-playtomic-orange/90 hover:to-orange-700 text-white font-semibold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Actualizando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Restablecer Contraseña
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-400 mt-6">
          Después de cambiar tu contraseña, serás redirigido al inicio de sesión
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
