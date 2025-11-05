import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, GraduationCap, Clock, TrendingUp, TrendingDown, Activity, UserPlus, CalendarPlus, Calendar, ChevronDown, ChevronUp, Check, X, Send } from "lucide-react";
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
import { useCurrentUserWhatsAppGroup } from "@/hooks/useWhatsAppGroup";
import { format } from "date-fns";

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const { profile } = useAuth();

  // Fetch classes with absences
  const { data: classesWithAbsences } = useClassesWithAbsences(profile?.club_id);
  const { mutate: sendWhatsApp, isPending: isSendingWhatsApp } = useSendWhatsAppNotification();
  const { data: whatsappGroup } = useCurrentUserWhatsAppGroup();

  const {
    data: trainerProfile,
    isLoading: profileLoading
  } = useMyTrainerProfile();

  // Get trainer's club ID
  const trainerClubId = trainerProfile?.trainer_clubs?.[0]?.club_id;

  const {
    data: myClasses,
    isLoading: classesLoading
  } = useProgrammedClasses(trainerClubId);

  const { data: todayClasses } = useTodayAttendance();

  // Get total students from the club
  const { data: totalStudents } = useQuery({
    queryKey: ['club-total-students', trainerClubId],
    queryFn: async () => {
      if (!trainerClubId) return 0;

      // Get all student enrollments for this club
      const { data, error } = await supabase
        .from('student_enrollments')
        .select('id', { count: 'exact' })
        .eq('club_id', trainerClubId)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching club students:', error);
        return 0;
      }

      return data?.length || 0;
    },
    enabled: !!trainerClubId
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
              title: 'Nuevo alumno inscrito',
              description: `${studentProfile?.full_name || 'Un alumno'} se inscribió en tus clases`,
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
            title: 'Nueva clase programada',
            description: `Se creó la clase "${newClasses[0].name}"`,
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
            title: 'Nuevos alumnos inscritos',
            description: '2 alumnos nuevos esta semana',
            timestamp: twoHoursAgo.toISOString(),
            color: 'primary'
          },
          {
            type: 'new_class',
            icon: CalendarPlus,
            title: 'Clases programadas',
            description: 'Todas tus clases están activas',
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

    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return past.toLocaleDateString();
  };

  if (profileLoading || classesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  const totalProgrammedClasses = myClasses?.length || 0;
  const totalTodayClasses = todayClasses?.length || 0;
  const totalStudentsCount = totalStudents || 0;

  // Calculate average class size
  const totalParticipants = myClasses?.reduce((sum, c) => sum + (c.participants?.length || 0), 0) || 0;
  const avgClassSize = totalProgrammedClasses > 0 ? Math.round(totalParticipants / totalProgrammedClasses) : 0;

  // Top 3 stats for full width
  const topStats = [
    {
      title: "Alumnos Totales",
      value: totalStudentsCount,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/20"
    },
    {
      title: "Clases Programadas",
      value: totalProgrammedClasses,
      icon: GraduationCap,
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/20"
    },
    {
      title: "Entrenamientos Hoy",
      value: totalTodayClasses,
      icon: Clock,
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/20"
    }
  ];

  // Quick actions
  const quickActions = [
    {
      title: "Alumnos",
      description: "Gestionar alumnos",
      icon: Users,
      action: () => navigate("/dashboard/students")
    },
    {
      title: "Programar Clases",
      description: "Configurar clases",
      icon: GraduationCap,
      action: () => navigate("/dashboard/scheduled-classes")
    },
    {
      title: "Asistencia Hoy",
      description: "Ver asistencia",
      icon: Clock,
      action: () => navigate("/dashboard/today-attendance")
    }
  ];

  // Filter quick actions for mobile (remove "Programar Clases")
  const mobileQuickActions = quickActions.filter(action => action.title !== "Programar Clases");

  return (
    <div className="min-h-screen overflow-y-auto flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6">
      {/* Welcome message - Hidden on mobile */}
      <div className="hidden md:block mb-2">
        <h1 className="text-xl font-bold text-[#10172a]">
          Hola, {profile?.full_name?.split(' ')[0] || 'Entrenador'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Bienvenido a tu panel de control
        </p>
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
            Acciones Rápidas
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

      {/* Activity Backlog Section - Two columns on desktop, hidden on mobile */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Actividad Reciente */}
        <div>
          <div className="mb-3 sm:mb-4 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-[#10172a]">
              Actividad Reciente
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
                    Ver menos <ChevronUp className="h-3 w-3 ml-1" />
                  </>
                ) : (
                  <>
                    Ver todas ({recentActivities.length}) <ChevronDown className="h-3 w-3 ml-1" />
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
                <p className="text-xs sm:text-sm">No hay actividades recientes</p>
              </div>
            )}
          </div>
        </div>

        {/* Resumen Semanal */}
        <div>
          <div className="mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-bold text-[#10172a]">
              Resumen Semanal
            </h3>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {weeklySummary ? (
              <>
                <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 mt-0.5 flex-shrink-0">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-[#10172a]">Nuevos Alumnos</p>
                    <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">{weeklySummary.newStudents} alumnos esta semana</p>
                    <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                      {weeklySummary.studentsTrend >= 0 ? (
                        <>
                          <TrendingUp className="h-3 w-3 text-green-600 flex-shrink-0" />
                          <p className="text-xs text-green-600">+{weeklySummary.studentsTrend}% vs semana anterior</p>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3 text-red-600 flex-shrink-0" />
                          <p className="text-xs text-red-600">{weeklySummary.studentsTrend}% vs semana anterior</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 mt-0.5 flex-shrink-0">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-[#10172a]">Clases Creadas</p>
                    <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">{weeklySummary.newClasses} clases esta semana</p>
                    <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                      {weeklySummary.classesTrend >= 0 ? (
                        <>
                          <TrendingUp className="h-3 w-3 text-green-600 flex-shrink-0" />
                          <p className="text-xs text-green-600">+{weeklySummary.classesTrend}% vs semana anterior</p>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3 text-red-600 flex-shrink-0" />
                          <p className="text-xs text-red-600">{weeklySummary.classesTrend}% vs semana anterior</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 mt-0.5 flex-shrink-0">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-[#10172a]">Tasa de Asistencia</p>
                    <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">{weeklySummary.attendanceRate}% de asistencia esta semana</p>
                    <p className="text-xs text-gray-400 mt-0.5 sm:mt-1">
                      {weeklySummary.attendanceRate >= 80 ? 'Excelente participación' :
                       weeklySummary.attendanceRate >= 60 ? 'Buena participación' :
                       'Mejorar comunicación con alumnos'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <p className="text-xs sm:text-sm">Cargando estadísticas semanales...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Classes with Absences Section - Only visible on mobile */}
      <div className="md:hidden">
        <div className="mb-3">
          <h3 className="text-base font-bold text-[#10172a]">
            Clases con ausencias
          </h3>
        </div>
        <div className="space-y-3">
          {classesWithAbsences && classesWithAbsences.length > 0 ? (
            classesWithAbsences.map((classData) => {
              const isExpanded = expandedClass === classData.id;
              const absentStudents = classData.participants.filter(p => p.absence_confirmed);
              const presentStudents = classData.participants.filter(p => !p.absence_confirmed && !p.is_substitute);
              const substituteStudents = classData.participants.filter(p => p.is_substitute);

              return (
                <div
                  key={classData.id}
                  className="flex flex-col gap-3 p-4 rounded-lg bg-white border border-gray-200"
                >
                  {/* Class Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-orange-100 flex-shrink-0">
                        <GraduationCap className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#10172a]">
                          {classData.name}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {classData.start_time.substring(0, 5)} · {classData.trainer?.full_name}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs bg-red-50 border-red-200 text-red-700">
                            {classData.absenceCount} {classData.absenceCount === 1 ? 'ausencia' : 'ausencias'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {classData.totalParticipants} alumnos
                          </Badge>
                        </div>
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

                  {/* Send Notification Button */}
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!whatsappGroup?.group_chat_id) {
                        alert('No hay grupo de WhatsApp configurado');
                        return;
                      }

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
                    }}
                    disabled={isSendingWhatsApp || !whatsappGroup}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Send className="h-3 w-3 mr-2" />
                    Enviar Notificación WhatsApp
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No hay clases con ausencias hoy</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboard;
