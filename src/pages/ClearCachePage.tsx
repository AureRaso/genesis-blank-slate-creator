import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import padelockLogo from "@/assets/PadeLock_D5Red.png";

/**
 * Página de emergencia para limpiar completamente la caché y sesión del usuario.
 * Útil cuando un usuario tiene problemas de pantalla en blanco o sesión corrupta.
 *
 * URL: /clear-cache
 */
export const ClearCachePage = () => {
  const [isClearing, setIsClearing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [steps, setSteps] = useState<Array<{ name: string; status: 'pending' | 'loading' | 'complete' | 'error' }>>([
    { name: 'Cerrar sesión de Supabase', status: 'pending' },
    { name: 'Limpiar localStorage', status: 'pending' },
    { name: 'Limpiar sessionStorage', status: 'pending' },
    { name: 'Limpiar cookies', status: 'pending' },
    { name: 'Limpiar cache del navegador', status: 'pending' },
  ]);
  const navigate = useNavigate();

  const updateStep = (index: number, status: 'pending' | 'loading' | 'complete' | 'error') => {
    setSteps(prev => prev.map((step, i) => i === index ? { ...step, status } : step));
  };

  const clearEverything = async () => {
    setIsClearing(true);

    try {
      // Paso 1: Cerrar sesión de Supabase
      updateStep(0, 'loading');
      await supabase.auth.signOut();
      await new Promise(resolve => setTimeout(resolve, 500));
      updateStep(0, 'complete');

      // Paso 2: Limpiar localStorage
      updateStep(1, 'loading');
      localStorage.clear();
      await new Promise(resolve => setTimeout(resolve, 300));
      updateStep(1, 'complete');

      // Paso 3: Limpiar sessionStorage
      updateStep(2, 'loading');
      sessionStorage.clear();
      await new Promise(resolve => setTimeout(resolve, 300));
      updateStep(2, 'complete');

      // Paso 4: Limpiar cookies
      updateStep(3, 'loading');
      // Eliminar todas las cookies del dominio
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      await new Promise(resolve => setTimeout(resolve, 300));
      updateStep(3, 'complete');

      // Paso 5: Limpiar cache del navegador (si está disponible)
      updateStep(4, 'loading');
      try {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        updateStep(4, 'complete');
      } catch (error) {
        console.error('Error clearing cache:', error);
        updateStep(4, 'complete'); // Marcamos como completo aunque falle, no es crítico
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      setIsComplete(true);

      // Redirigir después de 2 segundos
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (error) {
      console.error('Error during cleanup:', error);
      // Incluso si hay error, intentamos redirigir
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  };

  const handleManualClear = () => {
    clearEverything();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-playtomic-dark to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex justify-center">
              <img
                src={padelockLogo}
                alt="PadeLock Logo"
                className="h-20 w-auto drop-shadow-lg"
              />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                Limpieza Completa de Sesión
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Esta herramienta eliminará completamente toda la información almacenada en tu navegador
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {!isClearing && !isComplete && (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">Esto eliminará:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Tu sesión actual (tendrás que volver a iniciar sesión)</li>
                        <li>Todos los datos guardados en tu navegador</li>
                        <li>Preferencias y configuraciones temporales</li>
                        <li>Caché de la aplicación</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Usa esta herramienta si experimentas:
                  </p>
                  <ul className="text-sm text-slate-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-playtomic-orange mt-1">•</span>
                      <span>Pantallas en blanco al cargar la aplicación</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-playtomic-orange mt-1">•</span>
                      <span>Problemas para iniciar sesión o cambiar de cuenta</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-playtomic-orange mt-1">•</span>
                      <span>Errores persistentes que no se solucionan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-playtomic-orange mt-1">•</span>
                      <span>La aplicación se comporta de manera extraña</span>
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={handleManualClear}
                  className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  Limpiar Todo y Reiniciar
                </Button>
              </>
            )}

            {isClearing && !isComplete && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <Loader2 className="h-12 w-12 animate-spin text-playtomic-orange mx-auto mb-3" />
                  <p className="text-lg font-semibold text-slate-900">Limpiando...</p>
                  <p className="text-sm text-slate-600">No cierres esta ventana</p>
                </div>

                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        step.status === 'complete'
                          ? 'bg-green-50 border border-green-200'
                          : step.status === 'loading'
                          ? 'bg-blue-50 border border-blue-200'
                          : step.status === 'error'
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-slate-50 border border-slate-200'
                      }`}
                    >
                      {step.status === 'complete' && (
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      )}
                      {step.status === 'loading' && (
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
                      )}
                      {step.status === 'error' && (
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      )}
                      {step.status === 'pending' && (
                        <div className="h-5 w-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          step.status === 'complete'
                            ? 'text-green-800'
                            : step.status === 'loading'
                            ? 'text-blue-800'
                            : step.status === 'error'
                            ? 'text-red-800'
                            : 'text-slate-600'
                        }`}
                      >
                        {step.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isComplete && (
              <div className="text-center space-y-4 py-8">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-4">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    ¡Limpieza Completada!
                  </h3>
                  <p className="text-slate-600">
                    Redirigiendo a la página de inicio de sesión...
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-slate-300">
            ¿Sigues teniendo problemas?{' '}
            <a href="mailto:soporte@padelock.com" className="text-playtomic-orange hover:text-orange-400 underline">
              Contacta con soporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClearCachePage;
