/**
 * PÁGINA DE PRUEBA - Solo para desarrollo
 * Esta página ayuda a probar el flujo de reset de contraseña
 * sin necesitar configurar Supabase correctamente
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle2, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const TestPasswordResetPage = () => {
  const [emailLink, setEmailLink] = useState("");
  const [convertedLink, setConvertedLink] = useState("");

  const handleConvert = () => {
    if (!emailLink) {
      toast({
        title: "Error",
        description: "Por favor ingresa el enlace del email",
        variant: "destructive"
      });
      return;
    }

    try {
      // Convertir la URL de producción a localhost
      const converted = emailLink.replace(
        /https:\/\/(www\.)?padelock\.com/gi,
        'http://localhost:8080'
      );

      setConvertedLink(converted);

      toast({
        title: "¡Convertido!",
        description: "Ahora puedes copiar el enlace de localhost",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo convertir el enlace",
        variant: "destructive"
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(convertedLink);
    toast({
      title: "¡Copiado!",
      description: "Enlace copiado al portapapeles. Pégalo en tu navegador.",
    });
  };

  const handleOpenInBrowser = () => {
    if (convertedLink) {
      window.location.href = convertedLink;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-playtomic-dark to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-slate-900">
              🧪 Herramienta de Prueba - Password Reset
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="ml-2 text-blue-800 text-sm">
                <p className="font-medium mb-2">¿Para qué sirve esto?</p>
                <p>Esta herramienta convierte los enlaces de recuperación de contraseña de producción (padelock.com) a localhost para que puedas probarlos en desarrollo.</p>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-link" className="text-sm font-semibold text-slate-700">
                  1. Pega el enlace que recibiste por email
                </Label>
                <Input
                  id="email-link"
                  type="text"
                  value={emailLink}
                  onChange={(e) => setEmailLink(e.target.value)}
                  placeholder="https://www.padelock.com/#access_token=..."
                  className="font-mono text-xs"
                />
              </div>

              <Button
                onClick={handleConvert}
                className="w-full bg-gradient-to-r from-playtomic-orange to-orange-600 hover:from-playtomic-orange/90 hover:to-orange-700"
              >
                Convertir a Localhost
              </Button>

              {convertedLink && (
                <div className="space-y-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium text-green-900">
                        2. Enlace convertido correctamente
                      </p>
                      <div className="p-3 bg-white border border-green-300 rounded font-mono text-xs break-all">
                        {convertedLink}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      className="flex-1 border-green-300 hover:bg-green-50"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </Button>
                    <Button
                      onClick={handleOpenInBrowser}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      Abrir Ahora
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Alert className="bg-amber-50 border-amber-200">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="ml-2 text-amber-800 text-sm">
                <p className="font-medium mb-2">Instrucciones:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Ve a /forgot-password y solicita un reset de contraseña</li>
                  <li>Revisa tu email y copia el enlace completo</li>
                  <li>Pégalo arriba y haz click en "Convertir a Localhost"</li>
                  <li>Haz click en "Abrir Ahora" o copia el enlace y pégalo en el navegador</li>
                  <li>Serás redirigido a /reset-password para cambiar tu contraseña</li>
                </ol>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="text-center">
          <a
            href="/auth"
            className="text-sm text-white hover:text-playtomic-orange transition-colors"
          >
            ← Volver al login
          </a>
        </div>
      </div>
    </div>
  );
};

export default TestPasswordResetPage;
