import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProgrammedClasses } from "@/hooks/useProgrammedClasses";
import { useClassCapacity, useUserWaitlistPosition, useJoinWaitlist, useLeaveWaitlist } from "@/hooks/useWaitlist";
import { useCreateClassPayment } from "@/hooks/useClassPayment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, MapPin, CreditCard, Euro, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

interface PlayerProgrammedClassesProps {
  clubId?: string;
}

const PlayerProgrammedClasses = ({ clubId }: PlayerProgrammedClassesProps) => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const { data: programmedClasses, isLoading, error } = useProgrammedClasses(clubId);

  // Get user's student enrollment to filter classes where they are participants
  const userClasses = programmedClasses?.filter(programmedClass => {
    // This would need to be enhanced to check if the user is actually enrolled in the class
    // For now, we show all classes from the user's club
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('classes.availableClasses')}</h2>
        <p className="text-muted-foreground">
          {t('classes.availableClassesDescription')}
        </p>
      </div>

      {userClasses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('classes.noClassesAvailable')}</h3>
            <p className="text-muted-foreground">
              {t('classes.noClassesScheduled')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userClasses.map((programmedClass) => (
            <ProgrammedClassCard key={programmedClass.id} programmedClass={programmedClass} />
          ))}
        </div>
      )}
    </div>
  );
};

// Componente separado para cada tarjeta de clase con modal
const ProgrammedClassCard = ({ programmedClass }: { programmedClass: any }) => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const { data: capacity } = useClassCapacity(programmedClass.id);
  const { data: waitlistPosition } = useUserWaitlistPosition(programmedClass.id, profile?.id);
  const joinWaitlist = useJoinWaitlist();
  const leaveWaitlist = useLeaveWaitlist();
  const createClassPayment = useCreateClassPayment();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePayment = () => {
    if (programmedClass.monthly_price > 0) {
      createClassPayment.mutate({
        classId: programmedClass.id,
        className: programmedClass.name,
        monthlyPrice: programmedClass.monthly_price
      });
    } else {
      // Si es gratis, unirse directamente a la lista de espera
      handleJoinWaitlist();
    }
  };

  const handleJoinWaitlistWithPayment = () => {
    console.log('Joining waitlist with payment, monthly_price:', programmedClass.monthly_price);
    // Para clases de pago, siempre debe pagar primero (ya sea para cupo directo o lista de espera)
    if (programmedClass.monthly_price > 0) {
      console.log('Initiating payment for class:', programmedClass.name);
      createClassPayment.mutate({
        classId: programmedClass.id,
        className: programmedClass.name,
        monthlyPrice: programmedClass.monthly_price
      });
    } else {
      // Si es gratis, unirse directamente a la lista de espera
      handleJoinWaitlist();
    }
  };

  const handleJoinWaitlist = () => {
    if (profile?.id) {
      joinWaitlist.mutate({ classId: programmedClass.id, userId: profile.id });
    }
  };

  const handleLeaveWaitlist = () => {
    if (profile?.id) {
      leaveWaitlist.mutate({ classId: programmedClass.id, userId: profile.id });
    }
  };

  const formatDaysOfWeek = (days: string[]) => {
    const dayMapping: { [key: string]: string } = {
      'lunes': t('classes.mondayShort'),
      'martes': t('classes.tuesdayShort'),
      'miercoles': t('classes.wednesdayShort'),
      'jueves': t('classes.thursdayShort'),
      'viernes': t('classes.fridayShort'),
      'sabado': t('classes.saturdayShort'),
      'domingo': t('classes.sundayShort')
    };
    return days.map(day => dayMapping[day] || day.charAt(0).toUpperCase()).join(', ');
  };

  const getLevelDisplay = (programmedClass: any) => {
    if (programmedClass.custom_level) {
      return programmedClass.custom_level;
    }
    if (programmedClass.level_from && programmedClass.level_to) {
      return programmedClass.level_from === programmedClass.level_to 
        ? `Nivel ${programmedClass.level_from}`
        : `Niveles ${programmedClass.level_from}-${programmedClass.level_to}`;
    }
    return 'Sin nivel definido';
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setIsModalOpen(true)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="truncate">{programmedClass.name}</span>
            <Badge variant="secondary">
              {getLevelDisplay(programmedClass)}
            </Badge>
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {programmedClass.duration_minutes} {t('classes.minutes')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDaysOfWeek(programmedClass.days_of_week)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{programmedClass.start_time}</span>
          </div>

          {programmedClass.court_number && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{t('classes.court')} {programmedClass.court_number}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t('classes.period')}:</span>
            <span>{new Date(programmedClass.start_date).toLocaleDateString()} - {new Date(programmedClass.end_date).toLocaleDateString()}</span>
          </div>

          {programmedClass.trainer?.full_name && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{t('classes.teacher')}: {programmedClass.trainer.full_name}</span>
            </div>
          )}

          {/* Precio mensual */}
          {programmedClass.monthly_price !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <span>
                {programmedClass.monthly_price > 0 
                  ? `€${programmedClass.monthly_price}/mes`
                  : 'Gratis'
                }
              </span>
            </div>
          )}

          <ClassCapacityInfo 
            classId={programmedClass.id}
            programmedClass={programmedClass}
            capacity={capacity}
            waitlistPosition={waitlistPosition}
            onJoinWaitlist={handleJoinWaitlistWithPayment}
            onLeaveWaitlist={handleLeaveWaitlist}
            onPayment={handlePayment}
            joinPending={joinWaitlist.isPending}
            leavePending={leaveWaitlist.isPending}
            paymentPending={createClassPayment.isPending}
            showParticipants={true}
          />
        </CardContent>
      </Card>

      {/* Modal de detalles */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{programmedClass.name}</DialogTitle>
            <DialogDescription>
              {t('classes.classDetails')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">{t('classes.level')}</div>
                <div className="text-muted-foreground">{getLevelDisplay(programmedClass)}</div>
              </div>
              <div>
                <div className="font-medium">{t('classes.duration')}</div>
                <div className="text-muted-foreground">{programmedClass.duration_minutes} {t('classes.minutes')}</div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDaysOfWeek(programmedClass.days_of_week)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{programmedClass.start_time}</span>
              </div>
              {programmedClass.court_number && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{t('classes.court')} {programmedClass.court_number}</span>
                </div>
              )}
              {programmedClass.trainer?.full_name && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{t('classes.teacher')}: {programmedClass.trainer.full_name}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="font-medium">{t('classes.period')}</div>
              <div className="text-muted-foreground">
                {new Date(programmedClass.start_date).toLocaleDateString()} - {new Date(programmedClass.end_date).toLocaleDateString()}
              </div>
            </div>

            {/* Información de capacidad y botones de lista de espera */}
            <div className="space-y-3 pt-2 border-t">
              <ClassCapacityInfo 
                classId={programmedClass.id}
                programmedClass={programmedClass}
                capacity={capacity}
                waitlistPosition={waitlistPosition}
                onJoinWaitlist={handleJoinWaitlistWithPayment}
                onLeaveWaitlist={handleLeaveWaitlist}
                onPayment={handlePayment}
                joinPending={joinWaitlist.isPending}
                leavePending={leaveWaitlist.isPending}
                paymentPending={createClassPayment.isPending}
                isModal={true}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Componente simplificado para mostrar información de capacidad y botones
const ClassCapacityInfo = ({ 
  classId, 
  programmedClass,
  capacity, 
  waitlistPosition, 
  onJoinWaitlist, 
  onLeaveWaitlist, 
  onPayment,
  joinPending, 
  leavePending,
  paymentPending = false,
  isModal = false,
  showParticipants = false 
}: {
  classId: string;
  programmedClass?: any;
  capacity?: any;
  waitlistPosition?: any;
  onJoinWaitlist: () => void;
  onLeaveWaitlist: () => void;
  onPayment?: () => void;
  joinPending: boolean;
  leavePending: boolean;
  paymentPending?: boolean;
  isModal?: boolean;
  showParticipants?: boolean;
}) => {
  const { t } = useTranslation();
  const { profile } = useAuth();

  // Siempre obtener datos frescos de capacidad
  const { data: freshCapacity, isLoading: capacityLoading } = useClassCapacity(classId);
  
  if (!profile) return null;

  if (capacityLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2 text-sm">Cargando...</span>
      </div>
    );
  }

  // Usar datos frescos como prioridad
  const actualCapacity = freshCapacity || capacity || {
    currentParticipants: 0,
    maxParticipants: programmedClass?.max_participants || 8,
    availableSpots: programmedClass?.max_participants || 8,
    waitlistCount: 0,
    isFull: false
  };

  const monthlyPrice = programmedClass?.monthly_price || 0;
  const isPaymentRequired = monthlyPrice > 0;

  console.log('🔍 ClassCapacityInfo Debug:', {
    classId,
    className: programmedClass?.name,
    monthlyPrice,
    isPaymentRequired,
    actualCapacity,
    waitlistPosition: waitlistPosition?.position || null,
    freshCapacity,
    capacity
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Users className="h-4 w-4" />
        <span>
          {actualCapacity.currentParticipants}/{actualCapacity.maxParticipants} {t('classes.spots')}
        </span>
        {actualCapacity.waitlistCount > 0 && (
          <>
            <Clock className="h-4 w-4 ml-2" />
            <span>{actualCapacity.waitlistCount} {t('classes.waitlist')}</span>
          </>
        )}
      </div>

      {/* Mostrar participantes si showParticipants es true */}
      {showParticipants && actualCapacity.participants && actualCapacity.participants.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-muted-foreground mb-2">{t('classes.enrolledStudents')}:</p>
          <div className="space-y-1">
            {actualCapacity.participants
              .slice(0, 3)
              .map((participant: any) => (
                <div key={participant.id} className="text-xs bg-muted px-2 py-1 rounded">
                  {participant.student_enrollment?.full_name || t('classes.studentWithoutName')}
                </div>
              ))}
            {actualCapacity.participants.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{actualCapacity.participants.length - 3} más...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botones de acción para lista de espera */}
      <div className="pt-2">
        {waitlistPosition ? (
          <div className={`flex ${isModal ? 'flex-col' : 'items-center'} gap-2`}>
            <Badge variant="outline" className="flex items-center gap-1 w-fit">
              <Clock className="h-3 w-3" />
              {t('classes.positionInWaitlist')} {waitlistPosition.position}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={onLeaveWaitlist}
              disabled={leavePending}
              className={isModal ? 'w-full' : ''}
            >
              {leavePending ? t('common.loading') : t('classes.leaveWaitlist')}
            </Button>
          </div>
        ) : actualCapacity.isFull ? (
          <Button
            size="sm"
            onClick={() => {
              console.log('Botón de lista de espera clickeado - clase llena');
              console.log('Monthly price:', programmedClass?.monthly_price);
              console.log('onJoinWaitlist:', onJoinWaitlist);
              onJoinWaitlist();
            }}
            disabled={joinPending || paymentPending}
            className={isModal ? 'w-full' : ''}
            variant="outline"
          >
            {(joinPending || paymentPending) ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                {programmedClass?.monthly_price > 0 ? 'Procesando pago...' : 'Uniéndose...'}
              </>
            ) : (
              <>
                {programmedClass?.monthly_price > 0 ? (
                  <>
                    <CreditCard className="h-4 w-4 mr-1" />
                    Pagar €{programmedClass.monthly_price} - Lista de espera
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-1" />
                    {t('classes.joinWaitlist')}
                  </>
                )}
              </>
            )}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              {actualCapacity.availableSpots} plaza{actualCapacity.availableSpots !== 1 ? 's' : ''} disponible{actualCapacity.availableSpots !== 1 ? 's' : ''}
            </Badge>
            <Button
              size="sm"
              onClick={() => {
                console.log('Botón de reserva clickeado - cupos disponibles');
                console.log('Monthly price:', programmedClass?.monthly_price);
                console.log('onJoinWaitlist:', onJoinWaitlist);
                onJoinWaitlist();
              }}
              disabled={joinPending || paymentPending}
              className="text-xs flex items-center gap-1"
              variant={programmedClass?.monthly_price > 0 ? "default" : "outline"}
            >
               {(joinPending || paymentPending) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {programmedClass?.monthly_price > 0 ? 'Procesando pago...' : 'Reservando...'}
                </>
               ) : (
                <>
                  {programmedClass?.monthly_price > 0 ? (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Pagar €{programmedClass.monthly_price} - Reservar
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4" />
                      Reservar gratis
                    </>
                  )}
                </>
               )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerProgrammedClasses;