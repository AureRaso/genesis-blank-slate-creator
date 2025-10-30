import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function TestReminderPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const sendReminder = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('📤 Invocando función de recordatorio...');

      const { data, error: functionError } = await supabase.functions.invoke(
        'daily-attendance-reminder',
        {
          body: {}
        }
      );

      if (functionError) {
        console.error('❌ Error:', functionError);
        setError(functionError.message);
      } else {
        console.log('✅ Respuesta:', data);
        setResult(data);
      }
    } catch (err: any) {
      console.error('❌ Exception:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Test: Recordatorio Diario de Asistencia</CardTitle>
          <CardDescription>
            Esta página te permite probar el envío del recordatorio diario manualmente.
            <br />
            Se enviará un mensaje a todos los grupos de WhatsApp activos en el sistema.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={sendReminder}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Enviando recordatorios...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Enviar Recordatorios Ahora
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold text-green-900">
                    ✅ Recordatorios enviados exitosamente!
                  </div>
                  <div className="text-sm text-green-800">
                    <p>📊 Grupos totales: {result.totalGroups}</p>
                    <p>✅ Enviados: {result.successCount}</p>
                    <p>❌ Fallos: {result.failureCount}</p>
                  </div>

                  {result.results && result.results.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="font-medium text-sm">Detalle por grupo:</div>
                      <div className="space-y-1">
                        {result.results.map((r: any, idx: number) => (
                          <div
                            key={idx}
                            className={`text-xs p-2 rounded ${
                              r.success
                                ? 'bg-green-100 text-green-900'
                                : 'bg-red-100 text-red-900'
                            }`}
                          >
                            <div className="font-medium">{r.groupName}</div>
                            {r.success ? (
                              <div className="text-green-600">✓ Enviado (ID: {r.messageId})</div>
                            ) : (
                              <div className="text-red-600">✗ Error: {r.error}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
            <p><strong>Nota:</strong> Este botón invoca la Edge Function que:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Busca todos los grupos de WhatsApp activos</li>
              <li>Genera un mensaje personalizado con la fecha de hoy</li>
              <li>Envía el recordatorio a cada grupo</li>
              <li>Retorna un resumen de éxitos y fallos</li>
            </ul>
            <p className="mt-4">
              <strong>Mensaje que se envía:</strong>
            </p>
            <div className="bg-muted p-3 rounded text-xs whitespace-pre-line">
              {`🎾 ¡Buenos días!

📅 Hoy es *[fecha actual]*

⏰ *Recordatorio de asistencia*

Por favor, confirma tu asistencia a las clases de hoy entrando en la aplicación:
👉 https://genesis-blank-slate-creator.lovable.app

✅ Confirmar asistencia
❌ Notificar ausencia

Es importante que confirmes lo antes posible para que podamos organizar mejor las clases.

¡Nos vemos en la pista! 🎾`}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
