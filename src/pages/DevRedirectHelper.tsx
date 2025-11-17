/**
 * Página auxiliar que se muestra cuando llegas desde un enlace de email
 * en producción pero quieres probar en localhost
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, ExternalLink, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const DevRedirectHelper = () => {
  const [currentUrl, setCurrentUrl] = useState("");
  const [localhostUrl, setLocalhostUrl] = useState("");

  useEffect(() => {
    const fullUrl = window.location.href;
    setCurrentUrl(fullUrl);

    // Convertir a localhost
    const converted = fullUrl.replace(
      /https:\/\/(www\.)?padelock\.com/gi,
      'http://localhost:8080'
    );
    setLocalhostUrl(converted);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(localhostUrl);
    toast({
      title: "¡Copiado!",
      description: "Enlace de localhost copiado. Ábrelo en una nueva pestaña.",
    });
  };

  const handleOpen = () => {
    window.open(localhostUrl, '_blank');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-playtomic-dark to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-slate-900">
              🔧 Modo Desarrollo Detectado
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="ml-2 text-blue-800 text-sm">
                <p className="font-medium mb-2">¡Has llegado desde un enlace de email!</p>
                <p>Estás en la URL de producción (padelock.com) pero probablemente quieres probar en localhost.</p>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-lg">
                <p className="text-xs text-slate-600 mb-2 font-semibold">URL actual (Producción):</p>
                <p className="font-mono text-xs break-all text-slate-700">{currentUrl}</p>
              </div>

              <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                <p className="text-xs text-green-800 mb-2 font-semibold">URL convertida (Localhost):</p>
                <p className="font-mono text-xs break-all text-green-900">{localhostUrl}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleCopy}
                variant="outline"
                className="border-blue-300 hover:bg-blue-50"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar URL
              </Button>
              <Button
                onClick={handleOpen}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir en Localhost
              </Button>
            </div>

            <Alert className="bg-amber-50 border-amber-200">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="ml-2 text-amber-800 text-sm">
                <p className="font-medium mb-2">Instrucciones:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Asegúrate de tener el servidor de desarrollo corriendo en localhost:8080</li>
                  <li>Haz click en "Abrir en Localhost" o copia la URL y pégala en una nueva pestaña</li>
                  <li>Serás redirigido a /reset-password en localhost con el token válido</li>
                  <li>Podrás cambiar tu contraseña normalmente</li>
                </ol>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-slate-400">
            Esta página solo aparece cuando detectamos que vienes desde un enlace de email
          </p>
        </div>
      </div>
    </div>
  );
};

export default DevRedirectHelper;
