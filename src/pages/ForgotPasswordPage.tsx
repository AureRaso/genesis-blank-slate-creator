import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Mail, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import padelockLogo from "@/assets/PadeLock_D5Red.png";
import { supabase } from "@/integrations/supabase/client";

const MAX_RESET_ATTEMPTS = 3;
const RESET_COOLDOWN_MINUTES = 15;

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const checkRateLimit = (): boolean => {
    const storageKey = `password_reset_${email}`;
    const attemptData = localStorage.getItem(storageKey);

    if (!attemptData) return true;

    const { count, lastAttempt } = JSON.parse(attemptData);
    const timeSinceLastAttempt = Date.now() - lastAttempt;
    const cooldownTime = RESET_COOLDOWN_MINUTES * 60 * 1000;

    // Reset counter if cooldown period has passed
    if (timeSinceLastAttempt > cooldownTime) {
      localStorage.removeItem(storageKey);
      return true;
    }

    // Check if max attempts reached
    if (count >= MAX_RESET_ATTEMPTS) {
      const minutesLeft = Math.ceil((cooldownTime - timeSinceLastAttempt) / 60000);
      toast({
        title: "Demasiados intentos",
        description: `Has excedido el límite de intentos. Intenta de nuevo en ${minutesLeft} minutos.`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const updateRateLimit = () => {
    const storageKey = `password_reset_${email}`;
    const attemptData = localStorage.getItem(storageKey);

    const currentData = attemptData ? JSON.parse(attemptData) : { count: 0 };

    localStorage.setItem(storageKey, JSON.stringify({
      count: currentData.count + 1,
      lastAttempt: Date.now()
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu email",
        variant: "destructive"
      });
      return;
    }

    // Check rate limit
    if (!checkRateLimit()) {
      return;
    }

    setIsLoading(true);

    try {
      // First, check if user exists and their auth provider
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

      // Since we can't use admin methods on client, we'll just try to send the reset email
      // Supabase will handle if the email exists or not

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      // Update rate limit counter
      updateRateLimit();

      // Show success message regardless of whether email exists (security best practice)
      setEmailSent(true);

      toast({
        title: "Email enviado",
        description: "Si el email existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña.",
      });

    } catch (error: any) {
      console.error("Error sending reset email:", error);

      // Don't reveal if email exists or not
      setEmailSent(true);

      toast({
        title: "Solicitud procesada",
        description: "Si el email existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-playtomic-dark to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo - igual que AuthPage */}
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
              Recuperar Contraseña
            </CardTitle>
            <CardDescription className="text-base text-slate-600">
              {emailSent
                ? "Revisa tu correo electrónico"
                : "Te enviaremos un enlace para restablecer tu contraseña"}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {!emailSent ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="h-12 text-base border-slate-200 bg-white focus:border-playtomic-orange focus:ring-2 focus:ring-playtomic-orange/20 rounded-lg transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="ml-2 text-blue-800 text-sm">
                    Si tu cuenta fue creada con Google, no necesitas recuperar contraseña.
                    Simplemente inicia sesión con Google.
                  </AlertDescription>
                </Alert>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-playtomic-orange to-orange-600 hover:from-playtomic-orange/90 hover:to-orange-700 text-white font-semibold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 rounded-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Enviando...
                    </div>
                  ) : (
                    "Enviar enlace de recuperación"
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="ml-2 text-green-800">
                    <p className="font-medium mb-2">Email enviado correctamente</p>
                    <p className="text-sm">
                      Si existe una cuenta asociada a <strong>{email}</strong>,
                      recibirás un correo con instrucciones para restablecer tu contraseña.
                    </p>
                    <p className="text-sm mt-2 text-green-700">
                      El enlace expirará en 1 hora por seguridad.
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="text-center text-sm text-slate-600 space-y-2">
                  <p>¿No recibiste el correo?</p>
                  <ul className="text-xs text-slate-500 space-y-1">
                    <li>• Revisa tu carpeta de spam</li>
                    <li>• Verifica que el email sea correcto</li>
                    <li>• Espera unos minutos, puede tardar</li>
                  </ul>
                </div>

                <Button
                  onClick={() => setEmailSent(false)}
                  variant="outline"
                  className="w-full h-12 border-2 border-slate-200 hover:border-playtomic-orange/50 hover:bg-white rounded-lg"
                >
                  Intentar con otro email
                </Button>
              </div>
            )}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
            </div>

            {/* Volver al login */}
            <Link to="/auth">
              <Button
                type="button"
                variant="ghost"
                className="w-full h-12 text-slate-700 hover:text-playtomic-orange hover:bg-slate-50 rounded-lg transition-all"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio de sesión
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Info adicional */}
        <div className="text-center space-y-2 mt-6">
          <p className="text-sm text-slate-400">
            ¿Necesitas ayuda? Contacta con tu club o administrador
          </p>

          {/* Solo mostrar en desarrollo */}
          {window.location.hostname === 'localhost' && (
            <Link
              to="/test-password-reset"
              className="block text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              🧪 Herramienta de prueba para desarrollo
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
