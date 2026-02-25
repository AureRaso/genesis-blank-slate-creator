
import { useAuth } from "@/contexts/AuthContext";
import DashboardStats from "@/components/DashboardStats";
import QuickActions from "@/components/QuickActions";
import PlayerDashboard from "@/components/PlayerDashboard";
import { getWaitlistUrl } from "@/utils/url";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle, Users, GraduationCap, UserCheck, Calendar, UserPlus, CalendarPlus, Bell, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Activity, Check, X, Wallet, Loader2, Circle, Clock, Ban } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useStudentBehaviorMetrics } from "@/hooks/useStudentBehaviorMetrics";
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

// Component to display student behavior metrics (compact version for dashboard)
const StudentMetricsCompact = ({ studentEnrollmentId }: { studentEnrollmentId: string }) => {
  const PLACEHOLDER_CLASS_ID = "00000000-0000-0000-0000-000000000000";
  const { t } = useTranslation();

  const { data: metrics, isLoading } = useStudentBehaviorMetrics(
    studentEnrollmentId,
    PLACEHOLDER_CLASS_ID
  );
  if (isLoading) {
    return (
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>{t('common.loadingHistory')}</span>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="mt-2 pt-2 border-t border-gray-200">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-semibold text-gray-700">📊 {t('common.history')}:</span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
        <div className="flex items-center gap-1">
          <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
          <span className="text-gray-600">{t('common.attended')}:</span>
          <span className="font-semibold">{metrics.attended_count}</span>
        </div>

        <div className="flex items-center gap-1">
          <X className="h-3 w-3 text-red-600 flex-shrink-0" />
          <span className="text-gray-600">{t('common.noShow')}:</span>
          <span className="font-semibold text-red-700">{metrics.no_show_count}</span>
        </div>

        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-orange-500 flex-shrink-0" />
          <span className="text-gray-600">{t('common.late')}:</span>
          <span className="font-semibold">{metrics.late_notice_absences}</span>
        </div>

        {metrics.substitute_attendances > 0 && (
          <div className="flex items-center gap-1">
            <UserPlus className="h-3 w-3 text-blue-500 flex-shrink-0" />
            <span className="text-gray-600">{t('common.substitute')}:</span>
            <span className="font-semibold">{metrics.substitute_attendances}</span>
          </div>
        )}

        {metrics.club_cancelled_classes > 0 && (
          <div className="flex items-center gap-1">
            <Ban className="h-3 w-3 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600">{t('common.cancelled')}:</span>
            <span className="font-semibold">{metrics.club_cancelled_classes}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Index = () => {
  const { user, profile, isAdmin, loading, effectiveClubId, isSuperAdmin, superAdminClubs } = useAuth();
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

  // For superadmin without specific club selected, use all their clubs
  const superAdminClubIds = isSuperAdmin && !effectiveClubId && superAdminClubs.length > 0
    ? superAdminClubs.map(c => c.id)
    : undefined;

  // Fetch classes with absences
  const { data: classesWithAbsences } = useClassesWithAbsences(effectiveClubId, superAdminClubIds);
  const { mutate: sendWhatsApp, isPending: isSendingWhatsApp } = useSendWhatsAppNotification();
  const { data: whatsappGroup } = useCurrentUserWhatsAppGroup();
  const { data: allWhatsAppGroups } = useAllWhatsAppGroups(effectiveClubId, superAdminClubIds);

  // Fetch pending waitlist requests
  const { data: waitlistRequests } = usePendingWaitlistRequests(effectiveClubId, superAdminClubIds);
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

  // Fetch recent activities for admin
  const { data: recentActivities } = useQuery({
    queryKey: ['admin-recent-activities', effectiveClubId],
    queryFn: async () => {
      if (!effectiveClubId) return [];

      const activities: any[] = [];

      try {
        // 1. Nuevo jugador registrado
        const { data: newPlayers, error: playersError } = await supabase
          .from('profiles')
          .select('id, full_name, created_at')
          .eq('club_id', effectiveClubId)
          .eq('role', 'player')
          .order('created_at', { ascending: false })
          .limit(1);

        if (playersError) throw playersError;

        if (newPlayers && newPlayers.length > 0) {
          activities.push({
            type: 'new_player',
            icon: UserPlus,
            title: t('adminDashboard.newPlayerRegistered'),
            description: t('adminDashboard.playerRegisteredInClub', { name: newPlayers[0].full_name }),
            timestamp: newPlayers[0].created_at,
            color: 'primary'
          });
        }

        // 4. Nueva clase programada
        const { data: newClasses, error: classesError } = await supabase
          .from('programmed_classes')
          .select('id, name, created_at')
          .eq('club_id', effectiveClubId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (classesError) throw classesError;

        if (newClasses && newClasses.length > 0) {
          activities.push({
            type: 'new_class',
            icon: CalendarPlus,
            title: t('trainerDashboard.activity.newClassScheduled'),
            description: t('trainerDashboard.activity.classCreated', { name: newClasses[0].name }),
            timestamp: newClasses[0].created_at,
            color: 'gray'
          });
        }

        // 12. Nuevo entrenador añadido
        const { data: newTrainers, error: trainersError } = await supabase
          .from('profiles')
          .select('id, full_name, created_at')
          .eq('club_id', effectiveClubId)
          .eq('role', 'trainer')
          .order('created_at', { ascending: false })
          .limit(1);

        if (trainersError) throw trainersError;

        if (newTrainers && newTrainers.length > 0) {
          activities.push({
            type: 'new_trainer',
            icon: UserCheck,
            title: t('adminDashboard.activity.newTrainerAdded'),
            description: t('adminDashboard.activity.trainerJoined', { name: newTrainers[0].full_name }),
            timestamp: newTrainers[0].created_at,
            color: 'primary'
          });
        }
      } catch (error) {
        // Activities fetching failed silently
      }

      // If no real activities, show some example data
      if (activities.length === 0) {
        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        return [
          {
            type: 'new_player',
            icon: UserPlus,
            title: t('adminDashboard.activity.newPlayersRegistered'),
            description: t('adminDashboard.activity.playersThisWeek', { count: 3 }),
            timestamp: twoHoursAgo.toISOString(),
            color: 'primary'
          },
          {
            type: 'new_class',
            icon: CalendarPlus,
            title: t('adminDashboard.activity.classesUpdated'),
            description: t('adminDashboard.activity.newClassesAdded', { count: 5 }),
            timestamp: yesterday.toISOString(),
            color: 'gray'
          },
          {
            type: 'new_trainer',
            icon: UserCheck,
            title: t('adminDashboard.activity.newTrainerAdded'),
            description: t('adminDashboard.activity.trainerJoined', { name: 'Juan Pérez' }),
            timestamp: yesterday.toISOString(),
            color: 'primary'
          }
        ];
      }

      // Sort by timestamp
      return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    enabled: isAdmin && !!effectiveClubId
  });

  // Fetch weekly summary stats for admin
  const { data: weeklySummary } = useQuery({
    queryKey: ['admin-weekly-summary', effectiveClubId],
    queryFn: async () => {
      if (!effectiveClubId) return null;

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      try {
        // New players this week vs last week
        const { data: playersThisWeek } = await supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('club_id', effectiveClubId)
          .eq('role', 'player')
          .gte('created_at', oneWeekAgo.toISOString());

        const { data: playersLastWeek } = await supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('club_id', effectiveClubId)
          .eq('role', 'player')
          .gte('created_at', twoWeeksAgo.toISOString())
          .lt('created_at', oneWeekAgo.toISOString());

        // Classes this week vs last week
        const { data: classesThisWeek } = await supabase
          .from('programmed_classes')
          .select('id', { count: 'exact' })
          .eq('club_id', effectiveClubId)
          .gte('created_at', oneWeekAgo.toISOString());

        const { data: classesLastWeek } = await supabase
          .from('programmed_classes')
          .select('id', { count: 'exact' })
          .eq('club_id', effectiveClubId)
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
        return null;
      }
    },
    enabled: isAdmin && !!effectiveClubId
  });

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return t('common.timeAgo.minutes', { count: diffMins });
    if (diffHours < 24) return t('common.timeAgo.hours', { count: diffHours });
    if (diffDays === 1) return t('common.timeAgo.yesterday');
    if (diffDays < 7) return t('common.timeAgo.days', { count: diffDays });
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
          <h1 className="text-3xl font-bold">{t('adminDashboard.noProfile.welcome')}</h1>
          <p className="text-muted-foreground">
            {t('adminDashboard.noProfile.hello')} {user.email}
            <Badge className="ml-2" variant="outline">
              {t('adminDashboard.noProfile.user')}
            </Badge>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('adminDashboard.noProfile.title')}</CardTitle>
            <CardDescription>
              {t('adminDashboard.noProfile.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('adminDashboard.noProfile.contactAdmin')}
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
          <h1 className="text-3xl font-bold">{t('adminDashboard.playerNoClub.welcome')} {profile.full_name}</h1>
          <p className="text-muted-foreground">
            <Badge className="ml-2" variant="secondary">
              {t('adminDashboard.playerNoClub.player')}
            </Badge>
          </p>
        </div>

        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {t('adminDashboard.playerNoClub.title')}
            </CardTitle>
            <CardDescription className="text-amber-700">
              {t('adminDashboard.playerNoClub.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-800">
              {t('adminDashboard.playerNoClub.contactAdmin')}
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
              {t('adminDashboard.welcome.greeting', { name: profile?.full_name?.split(' ')[0] || t('adminDashboard.welcome.defaultName') })} 👋
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {t('adminDashboard.welcome.subtitle')}
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
              {t('adminDashboard.payments.title')}
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
                    const monthKeys = [
                      'january', 'february', 'march', 'april', 'may', 'june',
                      'july', 'august', 'september', 'october', 'november', 'december'
                    ];
                    const monthName = t(`adminDashboard.months.${monthKeys[payment.month - 1]}`);

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
                            {monthName} {payment.year} • {payment.total_classes} {t('adminDashboard.payments.classes')} • {payment.total_amount.toFixed(2)}€
                          </p>
                          {payment.payment_method && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {t('adminDashboard.payments.method')} {payment.payment_method}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 mt-0.5 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              verifyPayment({
                                paymentId: payment.id,
                                status: 'pagado'
                              });
                            }}
                            disabled={isVerifyingPayment}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              verifyPayment({
                                paymentId: payment.id,
                                status: 'pendiente',
                                rejectionReason: t('adminDashboard.payments.rejected')
                              });
                            }}
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
                    <p className="text-xs sm:text-sm">{t('adminDashboard.payments.noPayments')}</p>
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
                        {t('adminDashboard.payments.showLess')} <ChevronUp className="h-3 w-3 ml-1" />
                      </>
                    ) : (
                      <>
                        {t('adminDashboard.payments.showAll')} ({paymentsInReview.length}) <ChevronDown className="h-3 w-3 ml-1" />
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
              {t('adminDashboard.notifications.title')}
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
                  <p className="text-sm">{t('adminDashboard.notifications.noNotifications')}</p>
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
                              {t('adminDashboard.notifications.locked')}
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
                          <p className="text-xs font-semibold text-gray-700 mb-1">{t('adminDashboard.notifications.absences')}</p>
                          {absentStudents.map((participant) => (
                            <div key={participant.id} className="flex items-center gap-2 text-xs py-1">
                              <X className="h-3 w-3 text-red-600 flex-shrink-0" />
                              <span className="text-gray-700">{participant.student_enrollment?.full_name}</span>
                              {participant.absence_locked && (
                                <Badge variant="outline" className="text-[10px] bg-gray-100">
                                  {t('adminDashboard.notifications.locked')}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Present Students */}
                      {presentStudents.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">{t('adminDashboard.notifications.willAttend')}</p>
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
                          <p className="text-xs font-semibold text-gray-700 mb-1">{t('adminDashboard.notifications.substitutes')}</p>
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
                      {t('adminDashboard.notifications.addSubstitute')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        // Si hay más de un grupo, mostrar diálogo de selección
                        if (allWhatsAppGroups && allWhatsAppGroups.length > 1) {
                          setWhatsappGroupDialog({
                            open: true,
                            classData: classData
                          });
                          return;
                        }

                        // Si solo hay un grupo o ninguno, usar el grupo actual
                        if (!whatsappGroup?.group_chat_id) {
                          alert(t('adminDashboard.notifications.noWhatsAppGroup'));
                          return;
                        }

                        const today = format(new Date(), 'yyyy-MM-dd');
                        const waitlistUrl = getWaitlistUrl(classData.id, today);
                        const maxParticipants = classData.max_participants || 8;
                        const attendingCount = classData.participants.filter(p => p.student_enrollment && !p.absence_confirmed).length;
                        const availableSlots = maxParticipants - attendingCount;

                        sendWhatsApp({
                          groupChatId: whatsappGroup.group_chat_id,
                          className: classData.name,
                          classDate: today,
                          classTime: classData.start_time,
                          trainerName: classData.trainer?.full_name || t('adminDashboard.notifications.teacher'),
                          waitlistUrl,
                          availableSlots,
                          classId: classData.id,
                          notificationType: 'absence',
                          language: classData.club_language || 'es'
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
                          {t('adminDashboard.notifications.request')} {format(new Date(request.joined_at), 'HH:mm')}
                        </p>
                        {/* Historial de asistencia del alumno */}
                        <StudentMetricsCompact studentEnrollmentId={request.student_enrollment_id} />
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
            {t('adminDashboard.notifications.title')}
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
                  <p className="text-sm">{t('adminDashboard.notifications.noNotifications')}</p>
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
                            <p className="text-xs font-semibold text-gray-700 mb-1">{t('adminDashboard.notifications.absences')}</p>
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
                            <p className="text-xs font-semibold text-gray-700 mb-1">{t('adminDashboard.notifications.willAttend')}</p>
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
                            <p className="text-xs font-semibold text-gray-700 mb-1">{t('adminDashboard.notifications.substitutes')}</p>
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
                          // Si hay más de un grupo, mostrar diálogo de selección
                          if (allWhatsAppGroups && allWhatsAppGroups.length > 1) {
                            setWhatsappGroupDialog({
                              open: true,
                              classData: classData
                            });
                            return;
                          }

                          // Si solo hay un grupo o ninguno, usar el grupo actual
                          if (!whatsappGroup?.group_chat_id) {
                            alert(t('adminDashboard.notifications.noWhatsAppGroup'));
                            return;
                          }

                          const today = format(new Date(), 'yyyy-MM-dd');
                          const waitlistUrl = `${window.location.origin}/waitlist/${classData.id}/${today}`;
                          const maxParticipants = classData.max_participants || 8;
                          const attendingCount = classData.participants.filter(p => p.student_enrollment && !p.absence_confirmed).length;
                          const availableSlots = maxParticipants - attendingCount;

                          sendWhatsApp({
                            groupChatId: whatsappGroup.group_chat_id,
                            className: classData.name,
                            classDate: today,
                            classTime: classData.start_time,
                            trainerName: classData.trainer?.full_name || t('adminDashboard.notifications.teacher'),
                            waitlistUrl,
                            availableSlots,
                            classId: classData.id,
                            notificationType: 'absence',
                            language: classData.club_language || 'es'
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
                    className={`flex flex-col p-4 rounded-lg bg-white border ${borderClass} transition-all duration-300`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
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
                            {t('adminDashboard.notifications.request')} {format(new Date(request.joined_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
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
                    {/* Historial de asistencia del alumno */}
                    <StudentMetricsCompact studentEnrollmentId={request.student_enrollment_id} />
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
            <SheetTitle>{t('adminDashboard.dialogs.searchSubstitute')}</SheetTitle>
            <SheetDescription>
              {t('adminDashboard.dialogs.searchSubstituteDesc')} <strong>{substituteDialog.className}</strong>
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto max-h-[calc(80vh-120px)]">
            {effectiveClubId && (
              <SubstituteStudentSearch
                classId={substituteDialog.classId}
                clubId={effectiveClubId}
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
            <DialogTitle>{t('adminDashboard.dialogs.selectWhatsAppGroup')}</DialogTitle>
            <DialogDescription>
              {t('adminDashboard.dialogs.selectWhatsAppGroupDesc')} <strong>{whatsappGroupDialog.classData?.name}</strong>
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
                    const waitlistUrl = getWaitlistUrl(whatsappGroupDialog.classData.id, today);
                    const maxParticipants = whatsappGroupDialog.classData.max_participants || 8;
                    const attendingCount = whatsappGroupDialog.classData.participants.filter(p => p.student_enrollment && !p.absence_confirmed).length;
                    const availableSlots = maxParticipants - attendingCount;

                    sendWhatsApp({
                      groupChatId: group.group_chat_id,
                      className: whatsappGroupDialog.classData.name,
                      classDate: today,
                      classTime: whatsappGroupDialog.classData.start_time,
                      trainerName: 'Profesor',
                      waitlistUrl,
                      availableSlots,
                      classId: whatsappGroupDialog.classData.id,
                      notificationType: 'absence',
                      language: whatsappGroupDialog.classData.club_language || 'es'
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
                      <div className="text-xs text-muted-foreground mt-1">{t('adminDashboard.dialogs.teacherGroup')}</div>
                    )}
                  </div>
                </Button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('adminDashboard.dialogs.noWhatsAppGroups')}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
