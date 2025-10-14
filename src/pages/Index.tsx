
import { useAuth } from "@/contexts/AuthContext";
import DashboardStats from "@/components/DashboardStats";
import QuickActions from "@/components/QuickActions";
import PlayerDashboard from "@/components/PlayerDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Users, GraduationCap, UserCheck, Calendar, UserPlus, CalendarPlus, Bell, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, profile, isAdmin, loading } = useAuth();
  const { t } = useTranslation();
  const { leagues: leaguesEnabled, matches: matchesEnabled } = useFeatureFlags();
  const [showAllActivities, setShowAllActivities] = useState(false);

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
      {/* Stats Section */}
      <div>
        <DashboardStats />
      </div>

      {/* Quick Actions - Full width */}
      <div>
        <QuickActions />
      </div>

      {/* Activity Backlog Section - Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
            {profile?.role === 'admin' ? (
              <>
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
              </>
            ) : (
              <>
                <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 mt-0.5 flex-shrink-0">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-[#10172a]">Clase completada</p>
                    <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">Clase de nivel intermedio - 8 asistentes</p>
                    <p className="text-xs text-gray-400 mt-0.5 sm:mt-1">Hace 1 hora</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 mt-0.5 flex-shrink-0">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-[#10172a]">Nuevo alumno inscrito</p>
                    <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">María González se inscribió en tus clases</p>
                    <p className="text-xs text-gray-400 mt-0.5 sm:mt-1">Hace 3 horas</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Resumen Semanal / Próximas Clases */}
        <div>
          <div className="mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-bold text-[#10172a]">
              {profile?.role === 'admin' ? 'Resumen Semanal' : 'Próximas Clases'}
            </h3>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {profile?.role === 'admin' ? (
              <>
                {weeklySummary ? (
                  <>
                    <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 mt-0.5 flex-shrink-0">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-[#10172a]">Nuevos Jugadores</p>
                        <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">{weeklySummary.newPlayers} jugadores esta semana</p>
                        <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                          {weeklySummary.playersTrend >= 0 ? (
                            <>
                              <TrendingUp className="h-3 w-3 text-green-600 flex-shrink-0" />
                              <p className="text-xs text-green-600">+{weeklySummary.playersTrend}% vs semana anterior</p>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-3 w-3 text-red-600 flex-shrink-0" />
                              <p className="text-xs text-red-600">{weeklySummary.playersTrend}% vs semana anterior</p>
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
              </>
            ) : (
              <>
                <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 mt-0.5 flex-shrink-0">
                    <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-[#10172a]">Clase nivel avanzado</p>
                    <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">Hoy a las 18:00 - Pista 2</p>
                    <p className="text-xs text-gray-400 mt-0.5 sm:mt-1">6/8 alumnos confirmados</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 mt-0.5 flex-shrink-0">
                    <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-[#10172a]">Clase nivel intermedio</p>
                    <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">Mañana a las 10:00 - Pista 1</p>
                    <p className="text-xs text-gray-400 mt-0.5 sm:mt-1">8/8 alumnos confirmados</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 mt-0.5 flex-shrink-0">
                    <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-[#10172a]">Clase principiantes</p>
                    <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">Mañana a las 16:00 - Pista 3</p>
                    <p className="text-xs text-gray-400 mt-0.5 sm:mt-1">4/8 alumnos confirmados</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
