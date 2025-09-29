import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User, MapPin, Euro, CreditCard, CheckCircle, AlertCircle, XCircle, BookOpen } from "lucide-react";
import { useStudentClassParticipations, useStudentClassReservations } from "@/hooks/useStudentClasses";
import { useAuth } from "@/contexts/AuthContext";

const StudentClassesPage = () => {
  const { profile } = useAuth();
  const { data: participations = [], isLoading: loadingParticipations } = useStudentClassParticipations();
  const { data: reservations = [], isLoading: loadingReservations } = useStudentClassReservations();

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
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center">
            <BookOpen className="h-8 w-8 mr-3 text-blue-600" />
            Mis Clases
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus inscripciones, pagos y reservas de clases
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Clases Activas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {participations.filter(p => p.status === 'active').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pagos Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {participations.filter(p => p.payment_status === 'pending').length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reservas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {reservations.filter(r => r.status === 'reservado').length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="classes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="classes">Clases Programadas</TabsTrigger>
            <TabsTrigger value="reservations">Reservas de Clases</TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="space-y-4">
            {participations.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tienes clases programadas</h3>
                  <p className="text-muted-foreground">
                    Habla con tu profesor para que te asigne a una clase o explora las clases disponibles.
                  </p>
                </CardContent>
              </Card>
            ) : (
              participations.map((participation) => (
                <Card key={participation.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        {getClassStatusIcon(participation.payment_status, participation.payment_verified)}
                        <span className="ml-2">{participation.programmed_class.name}</span>
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPaymentStatusColor(participation.payment_status)}>
                          {getPaymentStatusText(participation.payment_status)}
                        </Badge>
                        {participation.payment_verified && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Verificado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{formatDaysOfWeek(participation.programmed_class.days_of_week)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{participation.programmed_class.start_time} ({participation.programmed_class.duration_minutes} min)</span>
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{participation.programmed_class.trainer?.full_name || 'Entrenador no asignado'}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{participation.programmed_class.club.name}</span>
                        </div>
                        <div className="flex items-center">
                          <Euro className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>€{participation.programmed_class.monthly_price}/mes</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(participation.programmed_class.start_date).toLocaleDateString()} - {new Date(participation.programmed_class.end_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {participation.payment_notes && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm"><strong>Notas de pago:</strong> {participation.payment_notes}</p>
                      </div>
                    )}

                    {participation.payment_status === 'pending' && (
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                          <span className="text-sm font-medium text-yellow-800">
                            Pago pendiente - Contacta con tu profesor
                          </span>
                        </div>
                        {participation.payment_method && (
                          <Badge variant="outline">
                            {participation.payment_method}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="reservations" className="space-y-4">
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
              reservations.map((reservation) => (
                <Card key={reservation.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                        Clase {reservation.class_slots.day_of_week} - {reservation.class_slots.start_time}
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
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentClassesPage;