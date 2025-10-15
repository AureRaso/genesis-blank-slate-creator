import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User, MapPin, Euro, CreditCard, CheckCircle, AlertCircle, XCircle, BookOpen } from "lucide-react";
import { useStudentClassParticipations, useStudentClassReservations } from "@/hooks/useStudentClasses";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateClassPayment, useCancelSubscription } from "@/hooks/useClassPayment";
import DebugStudentClasses from "@/components/DebugStudentClasses";

const StudentClassesPage = () => {
  const { profile } = useAuth();
  const { data: participations = [], isLoading: loadingParticipations } = useStudentClassParticipations();
  const { data: reservations = [], isLoading: loadingReservations } = useStudentClassReservations();

  const createPaymentMutation = useCreateClassPayment();
  const cancelSubscriptionMutation = useCancelSubscription();

  const handlePayClass = (participation: any) => {
    createPaymentMutation.mutate({
      classId: participation.class_id,
      className: participation.programmed_class.name,
      monthlyPrice: parseFloat(participation.programmed_class.monthly_price)
    });
  };

  const handleCancelSubscription = (subscription: any) => {
    if (confirm("¿Estás seguro de que quieres cancelar tu suscripción? Se mantendrá activa hasta el final del período actual.")) {
      cancelSubscriptionMutation.mutate({
        subscriptionId: subscription.id
      });
    }
  };

  const formatDaysOfWeek = (days: string[]) => {
    const dayMapping: { [key: string]: string } = {
      'lunes': 'L',
      'martes': 'M',
      'miercoles': 'X',
      'jueves': 'J',
      'viernes': 'V',
      'sabado': 'S',
      'domingo': 'D'
    };
    return days.map(day => dayMapping[day] || day.charAt(0).toUpperCase()).join(', ');
  };

  const formatTime = (time: string) => {
    // Remove seconds if present (HH:MM:SS -> HH:MM)
    return time.substring(0, 5);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pagado';
      case 'pending':
        return 'Pendiente';
      case 'overdue':
        return 'Vencido';
      default:
        return status;
    }
  };

  const getReservationStatusColor = (status: string) => {
    switch (status) {
      case 'reservado':
        return 'bg-blue-100 text-blue-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReservationStatusText = (status: string) => {
    switch (status) {
      case 'reservado':
        return 'Confirmado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getClassStatusIcon = (paymentStatus: string, verified: boolean) => {
    if (paymentStatus === 'paid' && verified) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (paymentStatus === 'pending') {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  if (loadingParticipations || loadingReservations) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6">
      {/* Header with Summary Cards - Responsive: stacked on mobile, inline on desktop */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Mis Pagos
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Gestiona tus suscripciones
          </p>
        </div>

          {/* Summary Cards - Responsive: full width on mobile, auto on desktop */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:flex">
            <Card className="shadow-md">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Activas</p>
                    <p className="text-xl sm:text-2xl font-bold text-black">
                      {participations.filter(p => p.status === 'active').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600" />
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pendientes</p>
                    <p className="text-xl sm:text-2xl font-bold text-black">
                      {participations.filter(p => p.payment_status === 'pending').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Debug Component - Remove in production */}
        <DebugStudentClasses />

        <Tabs defaultValue="classes" className="space-y-4 sm:space-y-6">
          <TabsContent value="classes">
            {participations.length === 0 ? (
              <Card>
                <CardContent className="py-8 sm:py-12 text-center">
                  <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">No tienes clases programadas</h3>
                  <p className="text-sm sm:text-base text-muted-foreground px-4">
                    Habla con tu profesor para que te asigne a una clase.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {participations.map((participation) => (
                <Card
                  key={participation.id}
                  className="border-0 shadow-lg rounded-xl sm:rounded-2xl transition-all duration-300 hover:shadow-xl sm:hover:scale-[1.02] bg-white border-l-4 border-l-gray-300"
                >
                  <CardContent className="p-4 sm:p-6 lg:p-8">
                    {/* Header Section - Responsive */}
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 sm:mb-2">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-slate-700 flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-semibold text-slate-700">
                            {formatDaysOfWeek(participation.programmed_class.days_of_week)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-slate-800 flex-shrink-0" />
                          <span className="text-sm sm:text-base lg:text-lg font-bold text-slate-800">
                            {formatTime(participation.programmed_class.start_time)} ({participation.programmed_class.duration_minutes} min)
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getPaymentStatusColor(participation.payment_status)}>
                          {getPaymentStatusText(participation.payment_status)}
                        </Badge>
                        {participation.payment_verified && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            ✓ Verificado
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Class Details */}
                    <div className="space-y-3 mb-4">
                      {/* Class Name */}
                      <h3 className="text-xl font-bold text-slate-800 leading-tight">
                        {participation.programmed_class.name}
                      </h3>

                      {/* Trainer Info */}
                      <div className="flex items-center gap-2 text-slate-600">
                        <div className="p-1 bg-primary/10 rounded">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-medium">
                          {participation.programmed_class.trainer?.full_name || 'Entrenador no asignado'}
                        </span>
                      </div>

                      {/* Additional Info */}
                      <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{participation.programmed_class.club.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Euro className="h-3.5 w-3.5" />
                          <span>€{participation.programmed_class.monthly_price}/mes</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Section with border */}
                    <div className="mt-6 pt-4 border-t border-slate-200/60 space-y-3">
                      {participation.payment_notes && (
                        <div className="p-3 bg-slate-100/50 rounded-lg">
                          <p className="text-sm text-slate-700"><strong>Notas:</strong> {participation.payment_notes}</p>
                        </div>
                      )}

                      {participation.subscription && (
                        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-blue-100 rounded">
                                <CreditCard className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="text-sm font-semibold text-blue-800">Suscripción</span>
                            </div>
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              {participation.subscription.status === 'active' ? 'Activa' :
                               participation.subscription.status === 'past_due' ? 'Pago Pendiente' :
                               participation.subscription.status === 'canceled' ? 'Cancelada' :
                               participation.subscription.status}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-blue-700">
                            <p><strong>Próximo cobro:</strong> {new Date(participation.subscription.current_period_end).toLocaleDateString()}</p>
                            {participation.subscription.cancel_at_period_end && (
                              <p className="text-orange-600"><strong>Se cancelará:</strong> Al final del período actual</p>
                            )}
                          </div>
                          {participation.subscription.status === 'active' && !participation.subscription.cancel_at_period_end && (
                            <div className="mt-3">
                              <Button
                                onClick={() => handleCancelSubscription(participation.subscription)}
                                disabled={cancelSubscriptionMutation.isPending}
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
                              >
                                {cancelSubscriptionMutation.isPending ? 'Cancelando...' : 'Cancelar Suscripción'}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {participation.payment_status === 'pending' && (
                        <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-amber-100 rounded">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                              </div>
                              <span className="text-sm font-semibold text-amber-800">
                                Inscripciones pausadas
                              </span>
                            </div>
                          </div>
                          <div className="mb-3">
                            <p className="text-xs text-amber-700 mb-2">
                              Estamos finalizando la configuración del sistema de pagos
                            </p>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-muted-foreground">
                              €{participation.programmed_class.monthly_price}/mes
                            </div>
                            <Button
                              disabled
                              size="sm"
                              className="bg-muted text-muted-foreground cursor-not-allowed"
                            >
                              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                              Suscribirse (En pausa)
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Disponible próximamente
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reservations">
            {reservations.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tienes reservas</h3>
                  <p className="text-muted-foreground">
                    Explora las clases disponibles para hacer una reserva.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reservations.map((reservation) => (
                <Card key={reservation.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-black" />
                        Clase {reservation.class_slots.day_of_week} - {formatTime(reservation.class_slots.start_time)}
                      </CardTitle>
                      <Badge className={getReservationStatusColor(reservation.status)}>
                        {getReservationStatusText(reservation.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{reservation.class_slots.trainer_name}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{reservation.class_slots.duration_minutes} minutos</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{reservation.class_slots.clubs.name}</span>
                        </div>
                        <div className="flex items-center">
                          <Euro className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>€{reservation.class_slots.price_per_player}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm"><strong>Objetivo:</strong> {reservation.class_slots.objective}</p>
                      <p className="text-sm"><strong>Nivel:</strong> {reservation.class_slots.level}</p>
                    </div>

                    {reservation.notes && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm"><strong>Notas:</strong> {reservation.notes}</p>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Reservado el {new Date(reservation.created_at).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
};

export default StudentClassesPage;