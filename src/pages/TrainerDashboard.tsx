import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Users, GraduationCap, Clock, TrendingUp, TrendingDown, Activity, UserPlus, CalendarPlus, Calendar, ChevronDown, ChevronUp, Check, X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMyTrainerProfile } from "@/hooks/useTrainers";
import { useProgrammedClasses } from "@/hooks/useProgrammedClasses";
import { useTodayAttendance } from "@/hooks/useTodayAttendance";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClassesWithAbsences } from "@/hooks/useClassesWithAbsences";
import { useSendWhatsAppNotification } from "@/hooks/useWhatsAppNotification";
import { useCurrentUserWhatsAppGroup, useAllWhatsAppGroups } from "@/hooks/useWhatsAppGroup";
import { usePendingWaitlistRequests, useApproveWaitlistRequest, useRejectWaitlistRequest } from "@/hooks/usePendingWaitlistRequests";
import { format } from "date-fns";
import SubstituteStudentSearch from "@/components/SubstituteStudentSearch";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { UserMinusIcon } from "@/components/icons/UserMinusIcon";
import { getWaitlistUrl } from "@/utils/url";
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

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
  const { profile } = useAuth();

  // Get trainer profile first (needed for club IDs)
  const {
    data: trainerProfile,
    isLoading: profileLoading
  } = useMyTrainerProfile();

  // Get trainer's club IDs (supports multi-club trainers)
  const trainerClubIds = trainerProfile?.trainer_clubs?.map(tc => tc.club_id) || [];
  // Keep first club for backward compatibility with hooks that don't support arrays yet
  const trainerClubId = trainerClubIds[0];

  // Fetch classes with absences (uses trainer's clubs for multi-club support)
  const { data: classesWithAbsences } = useClassesWithAbsences(undefined, trainerClubIds.length > 0 ? trainerClubIds : undefined);
  const { mutate: sendWhatsApp, isPending: isSendingWhatsApp } = useSendWhatsAppNotification();
  const { data: whatsappGroup } = useCurrentUserWhatsAppGroup();
  // WhatsApp groups still use profile.club_id (not modified per plan)
  const { data: allWhatsAppGroups } = useAllWhatsAppGroups(profile?.club_id);

  // Fetch pending waitlist requests (uses trainer's clubs for multi-club support)
  const { data: waitlistRequests } = usePendingWaitlistRequests(undefined, trainerClubIds.length > 0 ? trainerClubIds : undefined);
  const { mutate: approveRequest, isPending: isApproving } = useApproveWaitlistRequest();
  const { mutate: rejectRequest, isPending: isRejecting } = useRejectWaitlistRequest();

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

  const {
    data: myClasses,
    isLoading: classesLoading
  } = useProgrammedClasses(trainerClubId);

  const { data: todayClasses } = useTodayAttendance();

  // Get total students from trainer's clubs (supports multi-club)
  const { data: totalStudents } = useQuery({
    queryKey: ['club-total-students', trainerClubIds],
    queryFn: async () => {
      if (trainerClubIds.length === 0) return 0;

      // Get all student enrollments for trainer's club(s)
      let query = supabase
        .from('student_enrollments')
        .select('id', { count: 'exact' })
        .eq('status', 'active');

      if (trainerClubIds.length === 1) {
        query = query.eq('club_id', trainerClubIds[0]);
      } else {
        query = query.in('club_id', trainerClubIds);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching club students:', error);
        return 0;
      }

      return data?.length || 0;
    },
    enabled: trainerClubIds.length > 0
  });

  // Fetch recent activities
  const { data: recentActivities } = useQuery({
    queryKey: ['trainer-recent-activities', trainerProfile?.id, myClasses],
    queryFn: async () => {
      if (!trainerProfile?.id || !myClasses || myClasses.length === 0) return [];

      const activities: any[] = [];
      const classIds = myClasses.map(c => c.id);

      try {
        // New students enrolled (from trainer's classes)
        const { data: newStudents, error: studentsError } = await supabase
          .from('class_participants')
          .select('student_enrollment_id, created_at')
          .in('class_id', classIds)
          .order('created_at', { ascending: false })
          .limit(1);

        if (studentsError) console.error('Error fetching students:', studentsError);

        if (newStudents && newStudents.length > 0) {
          // Get student enrollment and profile info
          const { data: enrollment } = await supabase
            .from('student_enrollments')
            .select('profile_id')
            .eq('id', newStudents[0].student_enrollment_id)
            .single();

          if (enrollment) {
            const { data: studentProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', enrollment.profile_id)
              .single();

            activities.push({
              type: 'new_student',
              icon: UserPlus,
              title: t('trainerDashboard.activity.newStudentEnrolled'),
              description: t('trainerDashboard.activity.studentEnrolledIn', { name: studentProfile?.full_name || t('trainerDashboard.welcome.defaultName') }),
              timestamp: newStudents[0].created_at,
              color: 'primary'
            });
          }
        }

        // New classes created
        const { data: newClasses, error: classesError } = await supabase
          .from('programmed_classes')
          .select('id, name, created_at')
          .eq('trainer_profile_id', trainerProfile.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (classesError) console.error('Error fetching classes:', classesError);

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
      } catch (error) {
        console.error('Error fetching activities:', error);
      }

      // If no real activities, show example data
      if (activities.length === 0) {
        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

        return [
          {
            type: 'new_student',
            icon: UserPlus,
            title: t('trainerDashboard.activity.newStudentsEnrolled'),
            description: t('trainerDashboard.activity.newStudentsThisWeek', { count: 2 }),
            timestamp: twoHoursAgo.toISOString(),
            color: 'primary'
          },
          {
            type: 'new_class',
            icon: CalendarPlus,
            title: t('trainerDashboard.activity.classesScheduled'),
            description: t('trainerDashboard.activity.allClassesActive'),
            timestamp: twoHoursAgo.toISOString(),
            color: 'gray'
          }
        ];
      }

      return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    enabled: !!trainerProfile?.id && !!myClasses && myClasses.length > 0
  });

  // Fetch weekly summary stats
  const { data: weeklySummary } = useQuery({
    queryKey: ['trainer-weekly-summary', trainerProfile?.id, myClasses],
    queryFn: async () => {
      if (!trainerProfile?.id || !myClasses || myClasses.length === 0) return null;

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const classIds = myClasses.map(c => c.id);

      try {
        // New students this week vs last week (from trainer's classes)
        const { data: studentsThisWeek } = await supabase
          .from('class_participants')
          .select('id', { count: 'exact' })
          .in('class_id', classIds)
          .gte('created_at', oneWeekAgo.toISOString());

        const { data: studentsLastWeek } = await supabase
          .from('class_participants')
          .select('id', { count: 'exact' })
          .in('class_id', classIds)
          .gte('created_at', twoWeeksAgo.toISOString())
          .lt('created_at', oneWeekAgo.toISOString());

        // Classes this week vs last week
        const { data: classesThisWeek } = await supabase
          .from('programmed_classes')
          .select('id', { count: 'exact' })
          .eq('trainer_profile_id', trainerProfile.id)
          .gte('created_at', oneWeekAgo.toISOString());

        const { data: classesLastWeek } = await supabase
          .from('programmed_classes')
          .select('id', { count: 'exact' })
          .eq('trainer_profile_id', trainerProfile.id)
          .gte('created_at', twoWeeksAgo.toISOString())
          .lt('created_at', oneWeekAgo.toISOString());

        // Attendance rate this week
        const { data: attendanceData } = await supabase
          .from('class_attendance')
          .select('status, programmed_class_id')
          .gte('created_at', oneWeekAgo.toISOString());

        // Filter only trainer's classes
        const trainerClassIds = myClasses?.map(c => c.id) || [];
        const trainerAttendance = attendanceData?.filter(a => trainerClassIds.includes(a.programmed_class_id)) || [];

        const totalAttendance = trainerAttendance.length;
        const confirmedAttendance = trainerAttendance.filter(a => a.status === 'confirmed').length;
        const attendanceRate = totalAttendance > 0 ? Math.round((confirmedAttendance / totalAttendance) * 100) : 0;

        const studentsThisWeekCount = studentsThisWeek?.length || 0;
        const studentsLastWeekCount = studentsLastWeek?.length || 0;
        const studentsTrend = studentsLastWeekCount > 0
          ? Math.round(((studentsThisWeekCount - studentsLastWeekCount) / studentsLastWeekCount) * 100)
          : studentsThisWeekCount > 0 ? 100 : 0;

        const classesThisWeekCount = classesThisWeek?.length || 0;
        const classesLastWeekCount = classesLastWeek?.length || 0;
        const classesTrend = classesLastWeekCount > 0
          ? Math.round(((classesThisWeekCount - classesLastWeekCount) / classesLastWeekCount) * 100)
          : classesThisWeekCount > 0 ? 100 : 0;

        return {
          newStudents: studentsThisWeekCount,
          studentsTrend,
          newClasses: classesThisWeekCount,
          classesTrend,
          attendanceRate
        };
      } catch (error) {
        console.error('Error fetching weekly summary:', error);
        return null;
      }
    },
    enabled: !!trainerProfile?.id && !!myClasses
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

  if (profileLoading || classesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const totalProgrammedClasses = myClasses?.length || 0;
  const totalTodayClasses = todayClasses?.classes?.length || 0;
  const totalStudentsCount = totalStudents || 0;

  // Calculate average class size
  const totalParticipants = myClasses?.reduce((sum, c) => sum + (c.participants?.length || 0), 0) || 0;
  const avgClassSize = totalProgrammedClasses > 0 ? Math.round(totalParticipants / totalProgrammedClasses) : 0;

  // Top 3 stats for full width
  const topStats = [
    {
      title: t('trainerDashboard.stats.totalStudents'),
      value: totalStudentsCount,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/20"
    },
    {
      title: t('trainerDashboard.stats.scheduledClasses'),
      value: totalProgrammedClasses,
      icon: GraduationCap,
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/20"
    },
    {
      title: t('trainerDashboard.stats.todayTrainings'),
      value: totalTodayClasses,
      icon: Clock,
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/20"
    }
  ];

  // Quick actions - Temporalmente ocultado el botón de Alumnos
  const quickActions = [
    // {
    //   title: t('trainerDashboard.quickActions.students'),
    //   description: t('trainerDashboard.quickActions.manageStudents'),
    //   icon: Users,
    //   action: () => navigate("/dashboard/students")
    // },
    {
      title: t('trainerDashboard.quickActions.scheduleClasses'),
      description: t('trainerDashboard.quickActions.configureClasses'),
      icon: GraduationCap,
      action: () => navigate("/dashboard/scheduled-classes")
    },
    {
      title: t('trainerDashboard.quickActions.todayAttendance'),
      description: t('trainerDashboard.quickActions.viewAttendance'),
      icon: Clock,
      action: () => navigate("/dashboard/today-attendance")
    }
  ];

  // Filter quick actions for mobile (remove "Schedule Classes")
  const mobileQuickActions = quickActions.filter(action => action.title !== t('trainerDashboard.quickActions.scheduleClasses'));

  return (
    <div className="min-h-screen overflow-y-auto flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl p-4 sm:p-6 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#10172a]">
              {t('trainerDashboard.welcome.greeting', { name: profile?.full_name?.split(' ')[0] || t('trainerDashboard.welcome.defaultName') })} 👋
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {t('trainerDashboard.welcome.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Top 3 Stats Section - Hidden on mobile */}
      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {topStats.map((stat, index) => {
          const Icon = stat.icon;
          const isOrange = stat.color === 'text-primary';
          return (
            <div
              key={index}
              className="sm:hover:scale-[1.02] transition-all duration-300 cursor-default group relative p-4 sm:p-5 rounded-xl bg-white border border-gray-200 hover:border-primary/40 sm:hover:shadow-lg"
            >
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="flex flex-row items-center justify-between space-y-0 mb-2 sm:mb-3 relative z-10">
                <h3 className="text-xs sm:text-sm font-bold text-[#10172a]/70 group-hover:text-[#10172a] transition-colors">
                  {stat.title}
                </h3>
                <div className={`p-2 sm:p-2.5 rounded-xl ${isOrange ? 'bg-primary/10' : 'bg-gray-100'} group-hover:scale-110 transition-transform duration-300 shadow-sm flex-shrink-0`}>
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${isOrange ? 'text-primary' : 'text-[#10172a]'}`} />
                </div>
              </div>
              <div className="relative z-10">
                <div className="text-2xl sm:text-3xl font-bold text-[#10172a] tracking-tight group-hover:scale-105 transition-transform duration-300 origin-left">
                  {stat.value}
                </div>
                <div className={`mt-1.5 sm:mt-2 h-1 w-8 sm:w-10 rounded-full bg-gradient-to-r ${isOrange ? 'from-primary' : 'from-[#10172a]'} to-transparent opacity-40 group-hover:w-12 sm:group-hover:w-16 transition-all duration-300`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions - Full width on desktop */}
      <div className="hidden md:block">
        <div className="mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-bold text-[#10172a]">
            {t('trainerDashboard.quickActions.title')}
          </h3>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className="group relative rounded-xl bg-white hover:bg-primary/5 p-3 sm:p-4 lg:p-5 border border-gray-200 hover:border-primary/40 transition-all duration-300 sm:hover:scale-[1.02] sm:hover:shadow-lg text-left"
                >
                  {/* Decorative background element */}
                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors duration-300" />

                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 h-full">
                    <div className="p-2 sm:p-2.5 lg:p-3 rounded-xl bg-primary/10 flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-[#10172a] group-hover:text-primary transition-colors leading-tight">
                        {action.title}
                      </h3>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Quick Actions - Only visible on mobile, no title, no "Programar Clases" */}
      <div className="md:hidden">
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-3">
            {mobileQuickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className="group relative rounded-xl bg-white hover:bg-primary/5 p-3 sm:p-4 lg:p-5 border border-gray-200 hover:border-primary/40 transition-all duration-300 sm:hover:scale-[1.02] sm:hover:shadow-lg text-left"
                >
                  {/* Decorative background element */}
                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors duration-300" />

                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 h-full">
                    <div className="p-2 sm:p-2.5 lg:p-3 rounded-xl bg-primary/10 flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-[#10172a] group-hover:text-primary transition-colors leading-tight">
                        {action.title}
                      </h3>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity Backlog Section - Single column on desktop (notifications hidden), hidden on mobile */}
      <div className="hidden md:block">
        {/* Actividad Reciente */}
        <div>
          <div className="mb-3 sm:mb-4 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-[#10172a]">
              {t('trainerDashboard.activity.title')}
            </h3>
            {recentActivities && recentActivities.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllActivities(!showAllActivities)}
                className="text-xs text-primary hover:text-primary/80"
              >
                {showAllActivities ? (
                  <>
                    {t('trainerDashboard.activity.showLess')} <ChevronUp className="h-3 w-3 ml-1" />
                  </>
                ) : (
                  <>
                    {t('trainerDashboard.activity.showAll')} ({recentActivities.length}) <ChevronDown className="h-3 w-3 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="space-y-2 sm:space-y-3">
            {recentActivities && recentActivities.length > 0 ? (
              (showAllActivities ? recentActivities : recentActivities.slice(0, 3)).map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={`${activity.type}-${index}`}
                    className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/10"
                  >
                    <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 mt-0.5 flex-shrink-0">
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-[#10172a]">{activity.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5 sm:mt-1 line-clamp-2">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5 sm:mt-1">{getTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <p className="text-xs sm:text-sm">{t('trainerDashboard.activity.noActivity')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Unified Notifications Panel - Temporalmente oculto */}
        {false && <div>
          <div className="mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-bold text-[#10172a]">
              {t('trainerDashboard.notifications.title')}
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
                if (absentStudents.length > 0) {
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
                  <p className="text-sm">{t('trainerDashboard.notifications.noNotifications')}</p>
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
                              {t('trainerDashboard.notifications.locked')}
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
                          <p className="text-xs font-semibold text-gray-700 mb-1">{t('trainerDashboard.notifications.absences')}</p>
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
                          <p className="text-xs font-semibold text-gray-700 mb-1">{t('trainerDashboard.notifications.willAttend')}</p>
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
                          <p className="text-xs font-semibold text-gray-700 mb-1">{t('trainerDashboard.notifications.substitutes')}</p>
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
                      {t('trainerDashboard.notifications.addSubstitute')}
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
                          alert(t('trainerDashboard.notifications.noWhatsAppGroup'));
                          return;
                        }

                        console.log('📤 Enviando directamente al grupo único');
                        const today = format(new Date(), 'yyyy-MM-dd');
                        const waitlistUrl = getWaitlistUrl(classData.id, today);
                        const absentCount = classData.participants.filter(p => p.absence_confirmed).length;
                        const substituteCount = classData.participants.filter(p => p.is_substitute).length;
                        const availableSlots = absentCount - substituteCount;

                        sendWhatsApp({
                          groupChatId: whatsappGroup.group_chat_id,
                          className: classData.name,
                          classDate: today,
                          classTime: classData.start_time,
                          trainerName: classData.trainer?.full_name || t('trainerDashboard.notifications.teacher'),
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
                          {t('trainerDashboard.notifications.request')} {format(new Date(request.joined_at), 'HH:mm')}
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
        </div>}
      </div>

      {/* Mobile Notifications Panel - Temporalmente oculto */}
      {false && <div className="md:hidden">
        <div className="mb-3">
          <h3 className="text-base font-bold text-[#10172a]">
            {t('trainerDashboard.notifications.title')}
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
                if (absentStudents.length > 0) {
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
                  <p className="text-sm">{t('trainerDashboard.notifications.noNotifications')}</p>
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
                              {t('trainerDashboard.notifications.locked')}
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
                          <p className="text-xs font-semibold text-gray-700 mb-1">{t('trainerDashboard.notifications.absences')}</p>
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
                          <p className="text-xs font-semibold text-gray-700 mb-1">{t('trainerDashboard.notifications.willAttend')}</p>
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
                          <p className="text-xs font-semibold text-gray-700 mb-1">{t('trainerDashboard.notifications.substitutes')}</p>
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
                      {t('trainerDashboard.notifications.addSubstitute')}
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
                          alert(t('trainerDashboard.notifications.noWhatsAppGroup'));
                          return;
                        }

                        console.log('📤 Enviando directamente al grupo único');
                        const today = format(new Date(), 'yyyy-MM-dd');
                        const waitlistUrl = getWaitlistUrl(classData.id, today);
                        const absentCount = classData.participants.filter(p => p.absence_confirmed).length;
                        const substituteCount = classData.participants.filter(p => p.is_substitute).length;
                        const availableSlots = absentCount - substituteCount;

                        sendWhatsApp({
                          groupChatId: whatsappGroup.group_chat_id,
                          className: classData.name,
                          classDate: today,
                          classTime: classData.start_time,
                          trainerName: classData.trainer?.full_name || t('trainerDashboard.notifications.teacher'),
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
                          {t('trainerDashboard.notifications.request')} {format(new Date(request.joined_at), 'HH:mm')}
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
      </div>}

      {/* Substitute Search Sheet (Bottom Sheet for Mobile) */}
      <Sheet open={substituteDialog.open} onOpenChange={(open) => setSubstituteDialog({ ...substituteDialog, open })}>
        <SheetContent side="bottom" className="max-h-[80vh] h-auto rounded-t-[30px]">
          <SheetHeader>
            <SheetTitle>{t('trainerDashboard.dialogs.searchSubstitute')}</SheetTitle>
            <SheetDescription>
              {t('trainerDashboard.dialogs.searchSubstituteDesc')} <strong>{substituteDialog.className}</strong>
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
            <DialogTitle>{t('trainerDashboard.dialogs.selectWhatsAppGroup')}</DialogTitle>
            <DialogDescription>
              {t('trainerDashboard.dialogs.selectWhatsAppGroupDesc')} <strong>{whatsappGroupDialog.classData?.name}</strong>
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
                      <div className="text-xs text-muted-foreground mt-1">{t('trainerDashboard.dialogs.teacherGroup')}</div>
                    )}
                  </div>
                </Button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('trainerDashboard.dialogs.noWhatsAppGroups')}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainerDashboard;
