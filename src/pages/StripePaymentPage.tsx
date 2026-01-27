import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, CheckCircle2, AlertCircle, Building2, XCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useClubSubscriptionPlan } from "@/hooks/useClubSubscriptionPlan";

const StripePaymentPage = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener el plan de suscripción recomendado según número de jugadores
  const { playerCount, recommendedPlan, isLoading: planLoading, clubCount } = useClubSubscriptionPlan(profile?.club_id);
  const isSuperadmin = profile?.role === 'superadmin';

  // Obtener información del club
  const { data: club, isLoading: clubLoading } = useQuery({
    queryKey: ["club", profile?.club_id],
    queryFn: async () => {
      if (!profile?.club_id) return null;

      const { data, error } = await supabase
        .from("clubs")
        .select("*")
        .eq("id", profile.club_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.club_id,
  });

  // Obtener el estado de la suscripción actual (si existe)
  const { data: subscription, isLoading: subscriptionLoading, refetch: refetchSubscription } = useQuery({
    queryKey: ["subscription", profile?.club_id],
    queryFn: async () => {
      if (!profile?.club_id) return null;

      // Primero intentar obtener una suscripción activa
      const { data: activeData, error: activeError } = await supabase
        .from("club_subscriptions")
        .select("*")
        .eq("club_id", profile.club_id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Si hay una suscripción activa, retornarla
      if (activeData) return activeData;

      // Si no hay activa, buscar cualquier suscripción (para mostrar el historial)
      const { data, error } = await supabase
        .from("club_subscriptions")
        .select("*")
        .eq("club_id", profile.club_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 es "no rows returned"
      return data;
    },
    enabled: !!profile?.club_id,
  });

  const handleProceedToPayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Llamar a la Edge Function de Supabase para crear una sesión de Stripe Checkout
      const { data, error: functionError } = await supabase.functions.invoke(
        "create-stripe-checkout",
        {
          body: {
            club_id: profile?.club_id,
            user_id: profile?.id,
            success_url: `${window.location.origin}/dashboard/payment?success=true`,
            cancel_url: `${window.location.origin}/dashboard/payment?canceled=true`,
          },
        }
      );

      if (functionError) {
        console.error("Error al crear la sesión de pago:", functionError);
        throw new Error("No se pudo crear la sesión de pago");
      }

      // Redirigir a Stripe Checkout
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No se recibió la URL de pago");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.stripe_subscription_id) return;

    // Primer paso: Confirmación con advertencia
    const firstConfirmed = window.confirm(
      "⚠️ ADVERTENCIA: Estás a punto de cancelar tu suscripción.\n\n" +
      "• La suscripción se cancelará al final del período actual\n" +
      "• Perderás acceso a todas las funcionalidades premium\n" +
      "• Tus datos se conservarán por si deseas volver\n\n" +
      "¿Deseas continuar con la cancelación?"
    );

    if (!firstConfirmed) return;

    // Segundo paso: Solicitar motivo de cancelación
    let cancellationReason = "";
    let reasonValid = false;

    while (!reasonValid) {
      cancellationReason = window.prompt(
        "Por favor, indícanos el motivo de tu cancelación (mínimo 20 caracteres):\n\n" +
        "Esto nos ayudará a mejorar nuestro servicio."
      ) || "";

      if (cancellationReason === null || cancellationReason === "") {
        // Usuario canceló el prompt
        return;
      }

      if (cancellationReason.trim().length < 20) {
        alert("El motivo debe tener al menos 20 caracteres. Por favor, proporciona más detalles.");
      } else {
        reasonValid = true;
      }
    }

    try {
      setCancelLoading(true);
      setError(null);

      const { error: functionError } = await supabase.functions.invoke(
        "cancel-stripe-subscription",
        {
          body: {
            subscription_id: subscription.stripe_subscription_id,
            cancellation_reason: cancellationReason.trim(),
          },
        }
      );

      if (functionError) {
        console.error("Error al cancelar la suscripción:", functionError);
        throw new Error("No se pudo cancelar la suscripción");
      }

      // Refrescar los datos de la suscripción
      await refetchSubscription();

      alert("✅ Tu suscripción ha sido cancelada.\n\nSe mantendrá activa hasta el final del período actual.\n\nGracias por tu feedback.");
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Error al cancelar");
    } finally {
      setCancelLoading(false);
    }
  };

  // Manejar parámetros de URL (success/canceled)
  const urlParams = new URLSearchParams(window.location.search);
  const success = urlParams.get("success");
  const canceled = urlParams.get("canceled");

  if (clubLoading || subscriptionLoading || planLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Gestión de Pagos</h1>
        <p className="text-muted-foreground">
          Administra la suscripción mensual de tu club
        </p>
      </div>

      {/* Mensajes de éxito o cancelación */}
      {success && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ¡Pago completado con éxito! Tu suscripción ha sido activada.
          </AlertDescription>
        </Alert>
      )}

      {canceled && (
        <Alert className="mb-6 border-yellow-500 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            El pago fue cancelado. Puedes intentarlo nuevamente cuando estés listo.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6 border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información del Club */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información del Club
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Nombre del Club</p>
              <p className="font-semibold">{club?.name || "No disponible"}</p>
            </div>
            {club?.location && (
              <div>
                <p className="text-sm text-muted-foreground">Ubicación</p>
                <p className="font-semibold">{club.location}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estado de Suscripción */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Estado de Suscripción
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <p className="font-semibold capitalize">
                    {subscription.status === "active" ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Activa
                      </span>
                    ) : subscription.status === "canceled" ? (
                      <span className="text-red-600 flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        Cancelada
                      </span>
                    ) : subscription.status === "past_due" ? (
                      <span className="text-orange-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Pago Vencido
                      </span>
                    ) : (
                      <span className="text-yellow-600">Pendiente</span>
                    )}
                  </p>
                </div>

                {subscription.current_period_end && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {subscription.cancel_at_period_end ? "Activa hasta" : "Próxima renovación"}
                    </p>
                    <p className="font-semibold">
                      {format(new Date(subscription.current_period_end), "d 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                  </div>
                )}

                {subscription.cancel_at_period_end && (
                  <Alert className="border-yellow-500 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800 text-xs">
                      Tu suscripción se cancelará al final del período actual
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">
                  No tienes una suscripción activa
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Procede al pago para activar tu suscripción mensual
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plan de Suscripción */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Plan de Suscripción Mensual</CardTitle>
          <CardDescription>
            Acceso completo a todas las funcionalidades de PadeLock
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Info del plan según jugadores */}
            {recommendedPlan && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-primary">{recommendedPlan.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Hasta {recommendedPlan.max_players} jugadores
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">
                      {(recommendedPlan.price_monthly * 1.21).toFixed(2).replace('.', ',')} €
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {recommendedPlan.price_monthly.toFixed(2).replace('.', ',')} € + 21% IVA
                    </p>
                    <p className="text-sm text-muted-foreground">por mes</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {isSuperadmin && clubCount && clubCount > 1 ? (
                      <>Tus <span className="font-semibold">{clubCount}</span> clubes tienen <span className="font-semibold">{playerCount}</span> jugadores registrados en total</>
                    ) : (
                      <>Tu club tiene <span className="font-semibold">{playerCount}</span> jugadores registrados</>
                    )}
                  </span>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Incluye:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Gestión ilimitada de clases y alumnos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Control de asistencia en tiempo real</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Reportes y métricas avanzadas</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Soporte técnico prioritario</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Actualizaciones automáticas</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {/* Botón de pago - solo mostrar si no hay suscripción activa */}
          {(!subscription || subscription.status !== "active") && (
            <Button
              onClick={handleProceedToPayment}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Proceder al Pago
                </>
              )}
            </Button>
          )}

          {/* Botón de cancelación - solo mostrar si hay suscripción activa y no está ya programada para cancelarse */}
          {subscription?.status === "active" && !subscription.cancel_at_period_end && (
            <Button
              onClick={handleCancelSubscription}
              disabled={cancelLoading}
              variant="outline"
              className="w-full border-red-500 text-red-600 hover:bg-red-50"
              size="lg"
            >
              {cancelLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar Suscripción
                </>
              )}
            </Button>
          )}

          {/* Mensaje si la suscripción está activa */}
          {subscription?.status === "active" && !subscription.cancel_at_period_end && (
            <p className="text-xs text-center text-muted-foreground">
              Tu suscripción se renovará automáticamente cada mes
            </p>
          )}
        </CardFooter>
      </Card>

      {/* Información adicional */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Información sobre el pago</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            • El pago se procesa de forma segura a través de Stripe, una de las
            plataformas de pago más confiables del mundo.
          </p>
          <p>
            • Tu suscripción se renovará automáticamente cada mes. Puedes
            cancelarla en cualquier momento.
          </p>
          <p>
            • Aceptamos todas las tarjetas de crédito y débito principales.
          </p>
          <p>
            • Recibirás un recibo por correo electrónico después de cada pago.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StripePaymentPage;
