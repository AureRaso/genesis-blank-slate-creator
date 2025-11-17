
import { useAuth } from "@/contexts/AuthContext";
import DashboardStats from "@/components/DashboardStats";
import QuickActions from "@/components/QuickActions";
import PlayerDashboard from "@/components/PlayerDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle, Users, GraduationCap, UserCheck, Calendar, UserPlus, CalendarPlus, Bell, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Activity, Check, X, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClassesWithAbsences } from "@/hooks/useClassesWithAbsences";
import { useSendWhatsAppNotification } from "@/hooks/useWhatsAppNotification";
import { useCurrentUserWhatsAppGroup, useAllWhatsAppGroups } from "@/hooks/useWhatsAppGroup";
import { usePendingWaitlistRequests, useApproveWaitlistRequest, useRejectWaitlistRequest } from "@/hooks/usePendingWaitlistRequests";
import { useAdminMonthlyPayments, useVerifyPayment } from "@/hooks/useAdminMonthlyPayments";
import { format } from "date-fns";
import SubstituteStudentSearch from "@/components/SubstituteStudentSearch";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { UserMinusIcon } from "@/components/icons/UserMinusIcon";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Index = () => {
  const { user, profile, isAdmin, loading } = useAuth();
  const { t } = useTranslation();
  const { leagues: leaguesEnabled, matches: matchesEnabled } = useFeatureFlags();
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [substituteDialog, setSubstituteDialog] = useState<{
    open: boolean;
    classId: string;
    className: string;
    classTime: string;
    classDate: string;
  }>({
    open: false,
    classId: '',
    className: '',
    classTime: '',
    classDate: ''
  });
  const [whatsappGroupDialog, setWhatsappGroupDialog] = useState<{
    open: boolean;
    classData: {
      id: string;
      name: string;
      start_time: string;
      participants: Array<{ absence_confirmed: boolean; is_substitute: boolean }>;
    } | null;
  }>({
    open: false,
    classData: null
  });
  const [notificationSentClasses, setNotificationSentClasses] = useState<Set<string>>(new Set());
  const [processedRequests, setProcessedRequests] = useState<Map<string, 'approved' | 'rejected'>>(new Map());

  // Fetch classes with absences
  const { data: classesWithAbsences } = useClassesWithAbsences(profile?.club_id);
  const { mutate: sendWhatsApp, isPending: isSendingWhatsApp } = useSendWhatsAppNotification();
  const { data: whatsappGroup } = useCurrentUserWhatsAppGroup();
  const { data: allWhatsAppGroups } = useAllWhatsAppGroups(profile?.club_id);

  // Fetch pending waitlist requests
  const { data: waitlistRequests } = usePendingWaitlistRequests(profile?.club_id);
  const { mutate: approveRequest, isPending: isApproving } = useApproveWaitlistRequest();
  const { mutate: rejectRequest, isPending: isRejecting } = useRejectWaitlistRequest();

  // Fetch payments in review for admin
  const { data: allPayments } = useAdminMonthlyPayments();
  const { mutate: verifyPayment, isPending: isVerifyingPayment } = useVerifyPayment();
  const paymentsInReview = allPayments?.filter(p => p.status === 'en_revision') || [];

  // Filtrar solicitudes que no deben mostrarse (más de 1h después del inicio de clase)
  const filteredWaitlistRequests = waitlistRequests?.filter((request) => {
    const classStartTime = request.programmed_class.start_time;
    const [hours, minutes] = classStartTime.split(':').map(Number);
    const classStartDate = new Date();
    classStartDate.setHours(hours, minutes, 0, 0);

    const oneHourAfterStart = new Date(classStartDate.getTime() + 60 * 60 * 1000);
    const now = new Date();

    return now < oneHourAfterStart;
  });

  console.log('Index page - Auth state:', { user: user?.email, profile, isAdmin, loading });

  // Fetch recent activities for admin
  const { data: recentActivities } = useQuery({
    queryKey: ['admin-recent-activities', profile?.club_id],
    queryFn: async () => {
      if (!profile?.club_id) return [];

      const activities: any[] = [];

      try {
        // 1. Nuevo jugador registrado
        const { data: newPlayers, error: playersError } = await supabase
          .from('profiles')
          .select('id, full_name, created_at')
          .eq('club_id', profile.club_id)
          .eq('role', 'player')
          .order('created_at', { ascending: false })
          .limit(1);

        if (playersError) console.error('Error fetching players:', playersError);

        if (newPlayers && newPlayers.length > 0) {
          activities.push({
            type: 'new_player',
            icon: UserPlus,
            title: 'Nuevo jugador registrado',
            description: `${newPlayers[0].full_name} se registró en el club`,
            timestamp: newPlayers[0].created_at,
            color: 'primary'
          });
        }

        // 4. Nueva clase programada
        const { data: newClasses, error: classesError } = await supabase
          .from('programmed_classes')
          .select('id, name, created_at')
          .eq('club_id', profile.club_id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (classesError) console.error('Error fetching classes:', classesError);

        if (newClasses && newClasses.length > 0) {
          activities.push({
            type: 'new_class',
            icon: CalendarPlus,
            title: 'Nueva clase programada',
            description: `Se creó la clase "${newClasses[0].name}"`,
            timestamp: newClasses[0].created_at,
            color: 'gray'
          });
        }

        // 12. Nuevo entrenador añadido
        const { data: newTrainers, error: trainersError } = await supabase
          .from('profiles')
          .select('id, full_name, created_at')
          .eq('club_id', profile.club_id)
          .eq('role', 'trainer')
          .order('created_at', { ascending: false })
          .limit(1);

        if (trainersError) console.error('Error fetching trainers:', trainersError);

        if (newTrainers && newTrainers.length > 0) {
          activities.push({
            type: 'new_trainer',
            icon: UserCheck,
            title: 'Nuevo entrenador añadido',
            description: `${newTrainers[0].full_name} se unió como entrenador`,
            timestamp: newTrainers[0].created_at,
            color: 'primary'
          });
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      }

      console.log('Activities found:', activities);

      // If no real activities, show some example data
      if (activities.length === 0) {
        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        return [
          {
            type: 'new_player',
            icon: UserPlus,
            title: 'Nuevos jugadores registrados',
            description: '3 jugadores se registraron esta semana',
            timestamp: twoHoursAgo.toISOString(),
            color: 'primary'
          },
          {
            type: 'new_class',
            icon: CalendarPlus,
            title: 'Clases programadas actualizadas',
            description: 'Se añadieron 5 nuevas clases para noviembre',
            timestamp: yesterday.toISOString(),
            color: 'gray'
          },
          {
            type: 'new_trainer',
            icon: UserCheck,
            title: 'Nuevo entrenador añadido',
            description: 'Juan Pérez se unió como entrenador',
            timestamp: yesterday.toISOString(),
            color: 'primary'
          }
        ];
      }

      // Sort by timestamp
      return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    enabled: isAdmin && !!profile?.club_id
  });

  // Fetch weekly summary stats for admin
  const { data: weeklySummary } = useQuery({
    queryKey: ['admin-weekly-summary', profile?.club_id],
    queryFn: async () => {
      if (!profile?.club_id) return null;

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      try {
        // New players this week vs last week
        const { data: playersThisWeek } = await supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('club_id', profile.club_id)
          .eq('role', 'player')
          .gte('created_at', oneWeekAgo.toISOString());

        const { data: playersLastWeek } = await supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('club_id', profile.club_id)
          .eq('role', 'player')
          .gte('created_at', twoWeeksAgo.toISOString())
          .lt('created_at', oneWeekAgo.toISOString());

        // Classes this week vs last week
        const { data: classesThisWeek } = await supabase
          .from('programmed_classes')
          .select('id', { count: 'exact' })
          .eq('club_id', profile.club_id)
          .gte('created_at', oneWeekAgo.toISOString());

        const { data: classesLastWeek } = await supabase
          .from('programmed_classes')
          .select('id', { count: 'exact' })
          .eq('club_id', profile.club_id)
          .gte('created_at', twoWeeksAgo.toISOString())
          .lt('created_at', oneWeekAgo.toISOString());

        // Attendance rate this week
        const { data: attendanceData } = await supabase
          .from('class_attendance')
          .select('status')
          .gte('created_at', oneWeekAgo.toISOString());

        const totalAttendance = attendanceData?.length || 0;
        const confirmedAttendance = attendanceData?.filter(a => a.status === 'confirmed').length || 0;
        const attendanceRate = totalAttendance > 0 ? Math.round((confirmedAttendance / totalAttendance) * 100) : 0;

        const playersThisWeekCount = playersThisWeek?.length || 0;
        const playersLastWeekCount = playersLastWeek?.length || 0;
        const playersTrend = playersLastWeekCount > 0
          ? Math.round(((playersThisWeekCount - playersLastWeekCount) / playersLastWeekCount) * 100)
          : playersThisWeekCount > 0 ? 100 : 0;

        const classesThisWeekCount = classesThisWeek?.length || 0;
        const classesLastWeekCount = classesLastWeek?.length || 0;
        const classesTrend = classesLastWeekCount > 0
          ? Math.round(((classesThisWeekCount - classesLastWeekCount) / classesLastWeekCount) * 100)
          : classesThisWeekCount > 0 ? 100 : 0;

        return {
          newPlayers: playersThisWeekCount,
          playersTrend,
          newClasses: classesThisWeekCount,
          classesTrend,
          attendanceRate
        };
      } catch (error) {
        console.error('Error fetching weekly summary:', error);
        return null;
      }
    },
    enabled: isAdmin && !!profile?.club_id
  });

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return past.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // If user is authenticated but no profile exists yet, show a basic welcome
  if (user && !profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bienvenido</h1>
          <p className="text-muted-foreground">
            Hola, {user.email}
            <Badge className="ml-2" variant="outline">
              Usuario
            </Badge>
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Perfil</CardTitle>
            <CardDescription>
              Tu cuenta está activa pero necesitas completar tu perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Contacta con el administrador para configurar tu rol y permisos.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si es jugador sin club asignado, mostrar aviso
  if (profile?.role === 'player' && !profile.club_id) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bienvenido, {profile.full_name}</h1>
          <p className="text-muted-foreground">
            <Badge className="ml-2" variant="secondary">
              Jugador
            </Badge>
          </p>
        </div>
        
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Club no asignado
            </CardTitle>
            <CardDescription className="text-amber-700">
              Necesitas estar asociado a un club para acceder a todas las funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-800">
              Contacta con el administrador del sistema para que te asigne a un club. 
              Una vez asignado, podrás ver las ligas, clases y entrenadores de tu club.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si es jugador con club, mostrar el dashboard de jugador
  if (!isAdmin) {
    return <PlayerDashboard />;
  }

  // Dashboard de administrador
  return (
    <div className="min-h-screen overflow-y-auto flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl p-4 sm:p-6 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <Home className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#10172a]">
              ¡Hola, {profile?.full_name?.split(' ')[0] || 'Admin'}! 👋
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Bienvenido a tu panel de administración
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section - Hidden on mobile */}
      <div className="hidden md:block">
        <DashboardStats />
      </div>

      {/* Quick Actions - Full width on desktop */}
      <div className="hidden md:block">
        <QuickActions />
      </div>

      {/* Mobile Quick Actions - Only visible on mobile, no title, no "Programar Clases" */}
      <div className="md:hidden">
        <QuickActions showTitle={false} hideScheduleClass={true} />
      </div>

      {/* Activity Backlog Section - Two columns on desktop, hidden on mobile */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Pagos en Revisión */}
        <div>
          <div className="mb-3 sm:mb-4 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-[#10172a] flex items-center gap-2">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Pagos en Revisión
            </h3>
            {paymentsInReview && paymentsInReview.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {paymentsInReview.length}
              </Badge>
            )}
          </div>
          <div className="space-y-2 sm:space-y-3">
            {profile?.role === 'admin' ? (
              <>
                {paymentsInReview && paymentsInReview.length > 0 ? (
                  paymentsInReview.slice(0, showAllActivities ? undefined : 3).map((payment) => {
                    const monthNames = [
                      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                    ];

                    return (
                      <div
                        key={payment.id}
                        className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-blue-50 border border-blue-200"
                      >
                        <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 mt-0.5 flex-shrink-0">
                          <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-[#10172a]">
                            {payment.student_enrollment.full_name}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">
                            {monthNames[payment.month - 1]} {payment.year} • {payment.total_classes} clases • {payment.total_amount.toFixed(2)}€
                          </p>
                          {payment.payment_method && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Método: {payment.payment_method}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 mt-0.5 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => verifyPayment({
                              paymentId: payment.id,
                              status: 'pagado'
                            })}
                            disabled={isVerifyingPayment}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => verifyPayment({
                              paymentId: payment.id,
                              status: 'pendiente'
                            })}
                            disabled={isVerifyingPayment}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <p className="text-xs sm:text-sm">No hay pagos en revisión</p>
                  </div>
                )}
                {paymentsInReview && paymentsInReview.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllActivities(!showAllActivities)}
                    className="w-full text-xs text-primary hover:text-primary/80"
                  >
                    {showAllActivities ? (
                      <>
                        Ver menos <ChevronUp className="h-3 w-3 ml-1" />
                      </>
                    ) : (
                      <>
                        Ver todos ({paymentsInReview.length}) <ChevronDown className="h-3 w-3 ml-1" />
                      </>
                    )}
                  </Button>
                )}
              </>
            ) : null}
          </div>
        </div>

        {/* Unified Notifications Panel */}
        <div>
          <div className="mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-bold text-[#10172a]">
              Notificaciones de hoy
            </h3>
          </div>
        <div className="space-y-3">
          {(() => {
            // Combinar ausencias y solicitudes de lista de espera en un solo array
            const notifications: Array<{
              type: 'absence' | 'waitlist';
              timestamp: string;
              data: any;
            }> = [];

            // Agregar clases con ausencias
            if (classesWithAbsences && classesWithAbsences.length > 0) {
              classesWithAbsences.forEach((classData) => {
                const absentStudents = classData.participants.filter((p: any) => p.absence_confirmed);
                const maxParticipants = classData.max_participants || 8;
                const confirmedParticipants = classData.participants.filter((p: any) => !p.absence_confirmed);

                // Solo mostrar si hay ausencias Y no están todos los puestos cubiertos
                if (absentStudents.length > 0 && confirmedParticipants.length < maxParticipants) {
                  // Usar la hora de la clase como timestamp
                  const classDateTime = `${format(new Date(), 'yyyy-MM-dd')}T${classData.start_time}`;
                  notifications.push({
                    type: 'absence',
                    timestamp: classDateTime,
                    data: classData
                  });
                }
              });
            }

            // Agregar solicitudes de lista de espera
            if (filteredWaitlistRequests && filteredWaitlistRequests.length > 0) {
              filteredWaitlistRequests.forEach((request) => {
                notifications.push({
                  type: 'waitlist',
                  timestamp: request.joined_at,
                  data: request
                });
              });
            }

            // Ordenar por timestamp (más reciente primero)
            notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            if (notifications.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No hay notificaciones pendientes</p>
                </div>
              );
            }

            return notifications.map((notification, index) => {
              if (notification.type === 'absence') {
                const classData = notification.data;
                const isExpanded = expandedClass === classData.id;
                const absentStudents = classData.participants.filter((p: any) => p.absence_confirmed);
                const presentStudents = classData.participants.filter((p: any) => !p.absence_confirmed && !p.is_substitute);
                const substituteStudents = classData.participants.filter((p: any) => p.is_substitute);

                // Verificar si han pasado 20 minutos desde el inicio de la clase
                const classStartTime = classData.start_time;
                const [hours, minutes] = classStartTime.split(':').map(Number);
                const classStartDate = new Date();
                classStartDate.setHours(hours, minutes, 0, 0);
                const twentyMinutesAfterStart = new Date(classStartDate.getTime() + 20 * 60 * 1000);
                const now = new Date();
                const isLocked = now >= twentyMinutesAfterStart;

                return (
                  <div
                    key={`absence-${classData.id}`}
                  className={`flex flex-col gap-3 p-4 rounded-lg border ${isLocked ? 'bg-gray-50 border-gray-300 opacity-75' : 'bg-white border-gray-200'}`}
                >
                  {/* Class Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0">
                        <UserMinusIcon className={`h-8 w-8 ${isLocked ? 'text-gray-400' : 'text-red-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[#10172a]">
                            {classData.name}
                          </p>
                          {isLocked && (
                            <Badge variant="outline" className="text-[10px] bg-gray-200 text-gray-700 border-gray-300">
                              Bloqueada
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {classData.start_time.substring(0, 5)} · {classData.trainer?.full_name}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedClass(isExpanded ? null : classData.id)}
                      className="ml-2"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Expanded Student List */}
                  {isExpanded && (
                    <div className="space-y-2 pt-2 border-t">
                      {/* Absent Students */}
                      {absentStudents.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">Ausencias:</p>
                          {absentStudents.map((participant) => (
                            <div key={participant.id} className="flex items-center gap-2 text-xs py-1">
                              <X className="h-3 w-3 text-red-600 flex-shrink-0" />
                              <span className="text-gray-700">{participant.student_enrollment?.full_name}</span>
                              {participant.absence_locked && (
                                <Badge variant="outline" className="text-[10px] bg-gray-100">
                                  Bloqueada
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Present Students */}
                      {presentStudents.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">Asistirán:</p>
                          {presentStudents.map((participant) => (
                            <div key={participant.id} className="flex items-center gap-2 text-xs py-1">
                              <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                              <span className="text-gray-700">{participant.student_enrollment?.full_name}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Substitute Students */}
                      {substituteStudents.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">Sustitutos:</p>
                          {substituteStudents.map((participant) => (
                            <div key={participant.id} className="flex items-center gap-2 text-xs py-1">
                              <UserPlus className="h-3 w-3 text-blue-600 flex-shrink-0" />
                              <span className="text-gray-700">{participant.student_enrollment?.full_name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const today = format(new Date(), 'yyyy-MM-dd');
                        setSubstituteDialog({
                          open: true,
                          classId: classData.id,
                          className: classData.name,
                          classTime: classData.start_time.substring(0, 5),
                          classDate: today
                        });
                      }}
                      disabled={isLocked}
                      className="flex-1"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Añadir sustituto
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        console.log('📱 WhatsApp groups available:', allWhatsAppGroups?.length);

                        // Si hay más de un grupo, mostrar diálogo de selección
                        if (allWhatsAppGroups && allWhatsAppGroups.length > 1) {
                          console.log('📋 Mostrando diálogo de selección de grupo');
                          setWhatsappGroupDialog({
                            open: true,
                            classData: classData
                          });
                          return;
                        }

                        // Si solo hay un grupo o ninguno, usar el grupo actual
                        if (!whatsappGroup?.group_chat_id) {
                          alert('No hay grupo de WhatsApp configurado');
                          return;
                        }

                        console.log('📤 Enviando directamente al grupo único');
                        const today = format(new Date(), 'yyyy-MM-dd');
                        const waitlistUrl = `${window.location.origin}/waitlist/${classData.id}/${today}`;
                        const absentCount = classData.participants.filter(p => p.absence_confirmed).length;
                        const substituteCount = classData.participants.filter(p => p.is_substitute).length;
                        const availableSlots = absentCount - substituteCount;

                        sendWhatsApp({
                          groupChatId: whatsappGroup.group_chat_id,
                          className: classData.name,
                          classDate: today,
                          classTime: classData.start_time,
                          trainerName: classData.trainer?.full_name || 'Profesor',
                          waitlistUrl,
                          availableSlots,
                          classId: classData.id,
                          notificationType: 'absence'
                        });

                        // Marcar la clase como notificada
                        setNotificationSentClasses(prev => new Set(prev).add(classData.id));
                      }}
                      disabled={isLocked || isSendingWhatsApp || !whatsappGroup || notificationSentClasses.has(classData.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <WhatsAppIcon className="h-3 w-3 mr-1" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
              );
              } else if (notification.type === 'waitlist') {
                // Waitlist request card
                const request = notification.data;
                const requestStatus = processedRequests.get(request.id);
                const borderClass = requestStatus === 'approved'
                  ? 'border-green-500 border-2'
                  : requestStatus === 'rejected'
                  ? 'border-red-500 border-2'
                  : 'border-gray-200';

                return (
                  <div
                    key={`waitlist-${request.id}`}
                    className={`flex items-center justify-between p-4 rounded-lg bg-white border ${borderClass} transition-all duration-300`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-blue-100 flex-shrink-0">
                        <Bell className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#10172a]">
                          {request.user_profile.full_name}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {request.programmed_class.name} · {request.programmed_class.start_time.substring(0, 5)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Solicitud: {format(new Date(request.joined_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 border-green-200 hover:bg-green-50"
                        onClick={() => {
                          setProcessedRequests(prev => new Map(prev).set(request.id, 'approved'));
                          approveRequest({
                            waitlistId: request.id,
                            classId: request.class_id,
                            userId: request.user_id
                          });
                        }}
                        disabled={isApproving || isRejecting}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          setProcessedRequests(prev => new Map(prev).set(request.id, 'rejected'));
                          rejectRequest({ waitlistId: request.id });
                        }}
                        disabled={isApproving || isRejecting}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                );
              }
              return null;
            });
          })()}
        </div>
        </div>
      </div>

      {/* Mobile Notifications Panel - Only visible on mobile */}
      <div className="md:hidden">
        <div className="mb-3">
          <h3 className="text-base font-bold text-[#10172a]">
            Notificaciones de hoy
          </h3>
        </div>
        <div className="space-y-3">
          {(() => {
            // Combinar ausencias y solicitudes de lista de espera en un solo array
            const notifications: Array<{
              type: 'absence' | 'waitlist';
              timestamp: string;
              data: any;
            }> = [];

            // Agregar clases con ausencias
            if (classesWithAbsences && classesWithAbsences.length > 0) {
              classesWithAbsences.forEach((classData) => {
                const absentStudents = classData.participants.filter((p: any) => p.absence_confirmed);
                const maxParticipants = classData.max_participants || 8;
                const confirmedParticipants = classData.participants.filter((p: any) => !p.absence_confirmed);

                // Solo mostrar si hay ausencias Y no están todos los puestos cubiertos
                if (absentStudents.length > 0 && confirmedParticipants.length < maxParticipants) {
                  // Usar la hora de la clase como timestamp
                  const classDateTime = `${format(new Date(), 'yyyy-MM-dd')}T${classData.start_time}`;
                  notifications.push({
                    type: 'absence',
                    timestamp: classDateTime,
                    data: classData
                  });
                }
              });
            }

            // Agregar solicitudes de lista de espera
            if (filteredWaitlistRequests && filteredWaitlistRequests.length > 0) {
              filteredWaitlistRequests.forEach((request) => {
                notifications.push({
                  type: 'waitlist',
                  timestamp: request.joined_at,
                  data: request
                });
              });
            }

            // Ordenar por timestamp (más reciente primero)
            notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            if (notifications.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No hay notificaciones pendientes</p>
                </div>
              );
            }

            return notifications.map((notification, index) => {
              if (notification.type === 'absence') {
                const classData = notification.data;
                const isExpanded = expandedClass === classData.id;
                const absentStudents = classData.participants.filter((p: any) => p.absence_confirmed);
                const presentStudents = classData.participants.filter((p: any) => !p.absence_confirmed && !p.is_substitute);
                const substituteStudents = classData.participants.filter((p: any) => p.is_substitute);

                // Verificar si han pasado 20 minutos desde el inicio de la clase
                const classStartTime = classData.start_time;
                const [hours, minutes] = classStartTime.split(':').map(Number);
                const classStartDate = new Date();
                classStartDate.setHours(hours, minutes, 0, 0);
                const twentyMinutesAfterStart = new Date(classStartDate.getTime() + 20 * 60 * 1000);
                const now = new Date();
                const isLocked = now >= twentyMinutesAfterStart;

                return (
                  <div
                    key={`absence-mobile-${classData.id}`}
                    className={`flex flex-col gap-3 p-4 rounded-lg border ${isLocked ? 'bg-gray-50 border-gray-300 opacity-75' : 'bg-white border-gray-200'}`}
                  >
                    {/* Class Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex-shrink-0">
                          <UserMinusIcon className={`h-8 w-8 ${isLocked ? 'text-gray-400' : 'text-red-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[#10172a]">
                              {classData.name}
                            </p>
                            {isLocked && (
                              <Badge variant="outline" className="text-[10px] bg-gray-200 text-gray-700 border-gray-300">
                                Bloqueada
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {classData.start_time.substring(0, 5)} · {classData.trainer?.full_name}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedClass(isExpanded ? null : classData.id)}
                        className="ml-2"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Expanded Student List */}
                    {isExpanded && (
                      <div className="space-y-2 pt-2 border-t">
                        {/* Absent Students */}
                        {absentStudents.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-1">Ausencias:</p>
                            {absentStudents.map((participant) => (
                              <div key={participant.id} className="flex items-center gap-2 text-xs py-1">
                                <X className="h-3 w-3 text-red-600 flex-shrink-0" />
                                <span className="text-gray-700">{participant.student_enrollment?.full_name}</span>
                                {participant.absence_locked && (
                                  <Badge variant="outline" className="text-[10px] bg-gray-100">
                                    Bloqueada
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Present Students */}
                        {presentStudents.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-1">Asistirán:</p>
                            {presentStudents.map((participant) => (
                              <div key={participant.id} className="flex items-center gap-2 text-xs py-1">
                                <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                                <span className="text-gray-700">{participant.student_enrollment?.full_name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Substitute Students */}
                        {substituteStudents.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-1">Sustitutos:</p>
                            {substituteStudents.map((participant) => (
                              <div key={participant.id} className="flex items-center gap-2 text-xs py-1">
                                <UserPlus className="h-3 w-3 text-blue-600 flex-shrink-0" />
                                <span className="text-gray-700">{participant.student_enrollment?.full_name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const today = format(new Date(), 'yyyy-MM-dd');
                          setSubstituteDialog({
                            open: true,
                            classId: classData.id,
                            className: classData.name,
                            classTime: classData.start_time.substring(0, 5),
                            classDate: today
                          });
                        }}
                        disabled={isLocked}
                        className="flex-1"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Añadir sustituto
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          console.log('📱 WhatsApp groups available:', allWhatsAppGroups?.length);

                          // Si hay más de un grupo, mostrar diálogo de selección
                          if (allWhatsAppGroups && allWhatsAppGroups.length > 1) {
                            console.log('📋 Mostrando diálogo de selección de grupo');
                            setWhatsappGroupDialog({
                              open: true,
                              classData: classData
                            });
                            return;
                          }

                          // Si solo hay un grupo o ninguno, usar el grupo actual
                          if (!whatsappGroup?.group_chat_id) {
                            alert('No hay grupo de WhatsApp configurado');
                            return;
                          }

                          console.log('📤 Enviando directamente al grupo único');
                          const today = format(new Date(), 'yyyy-MM-dd');
                          const waitlistUrl = `${window.location.origin}/waitlist/${classData.id}/${today}`;
                          const absentCount = classData.participants.filter(p => p.absence_confirmed).length;
                          const substituteCount = classData.participants.filter(p => p.is_substitute).length;
                          const availableSlots = absentCount - substituteCount;

                          sendWhatsApp({
                            groupChatId: whatsappGroup.group_chat_id,
                            className: classData.name,
                            classDate: today,
                            classTime: classData.start_time,
                            trainerName: classData.trainer?.full_name || 'Profesor',
                            waitlistUrl,
                            availableSlots,
                            classId: classData.id,
                            notificationType: 'absence'
                          });

                          // Marcar la clase como notificada
                          setNotificationSentClasses(prev => new Set(prev).add(classData.id));
                        }}
                        disabled={isLocked || isSendingWhatsApp || !whatsappGroup || notificationSentClasses.has(classData.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <WhatsAppIcon className="h-3 w-3 mr-1" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                );
              } else if (notification.type === 'waitlist') {
                // Waitlist request card
                const request = notification.data;
                const requestStatus = processedRequests.get(request.id);
                const borderClass = requestStatus === 'approved'
                  ? 'border-green-500 border-2'
                  : requestStatus === 'rejected'
                  ? 'border-red-500 border-2'
                  : 'border-gray-200';

                return (
                  <div
                    key={`waitlist-mobile-${request.id}`}
                    className={`flex items-center justify-between p-4 rounded-lg bg-white border ${borderClass} transition-all duration-300`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-blue-100 flex-shrink-0">
                        <Bell className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#10172a]">
                          {request.user_profile.full_name}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {request.programmed_class.name} · {request.programmed_class.start_time.substring(0, 5)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Solicitud: {format(new Date(request.joined_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 border-green-200 hover:bg-green-50"
                        onClick={() => {
                          setProcessedRequests(prev => new Map(prev).set(request.id, 'approved'));
                          approveRequest({
                            waitlistId: request.id,
                            classId: request.class_id,
                            userId: request.user_id
                          });
                        }}
                        disabled={isApproving || isRejecting}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          setProcessedRequests(prev => new Map(prev).set(request.id, 'rejected'));
                          rejectRequest({ waitlistId: request.id });
                        }}
                        disabled={isApproving || isRejecting}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                );
              }
              return null;
            });
          })()}
        </div>
      </div>

      {/* Substitute Search Sheet (Bottom Sheet for Mobile) */}
      <Sheet open={substituteDialog.open} onOpenChange={(open) => setSubstituteDialog({ ...substituteDialog, open })}>
        <SheetContent side="bottom" className="max-h-[80vh] h-auto rounded-t-[30px]">
          <SheetHeader>
            <SheetTitle>Buscar Sustituto</SheetTitle>
            <SheetDescription>
              Busca y añade un alumno sustituto para la clase <strong>{substituteDialog.className}</strong>
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto max-h-[calc(80vh-120px)]">
            {profile?.club_id && (
              <SubstituteStudentSearch
                classId={substituteDialog.classId}
                clubId={profile.club_id}
                className={substituteDialog.className}
                classTime={substituteDialog.classTime}
                classDate={substituteDialog.classDate}
                onSuccess={() => setSubstituteDialog({ open: false, classId: '', className: '', classTime: '', classDate: '' })}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* WhatsApp Group Selection Dialog */}
      <Dialog open={whatsappGroupDialog.open} onOpenChange={(open) => setWhatsappGroupDialog({ ...whatsappGroupDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar Grupo de WhatsApp</DialogTitle>
            <DialogDescription>
              Elige el grupo al que quieres enviar la notificación de ausencia para la clase <strong>{whatsappGroupDialog.classData?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {allWhatsAppGroups && allWhatsAppGroups.length > 0 ? (
              allWhatsAppGroups.map((group) => (
                <Button
                  key={group.id}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => {
                    if (!whatsappGroupDialog.classData) return;

                    const today = format(new Date(), 'yyyy-MM-dd');
                    const waitlistUrl = `${window.location.origin}/waitlist/${whatsappGroupDialog.classData.id}/${today}`;
                    const absentCount = whatsappGroupDialog.classData.participants.filter(p => p.absence_confirmed).length;
                    const substituteCount = whatsappGroupDialog.classData.participants.filter(p => p.is_substitute).length;
                    const availableSlots = absentCount - substituteCount;

                    console.log('📤 Enviando notificación al grupo:', group.group_name);

                    sendWhatsApp({
                      groupChatId: group.group_chat_id,
                      className: whatsappGroupDialog.classData.name,
                      classDate: today,
                      classTime: whatsappGroupDialog.classData.start_time,
                      trainerName: 'Profesor',
                      waitlistUrl,
                      availableSlots,
                      classId: whatsappGroupDialog.classData.id,
                      notificationType: 'absence'
                    });

                    // Marcar la clase como notificada
                    setNotificationSentClasses(prev => new Set(prev).add(whatsappGroupDialog.classData.id));

                    // Cerrar el diálogo
                    setWhatsappGroupDialog({ open: false, classData: null });
                  }}
                >
                  <div>
                    <div className="font-semibold">{group.group_name}</div>
                    {group.trainer_profile_id && (
                      <div className="text-xs text-muted-foreground mt-1">Grupo del profesor</div>
                    )}
                  </div>
                </Button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay grupos de WhatsApp configurados
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
