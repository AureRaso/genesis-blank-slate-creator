
import { useAuth } from "@/contexts/AuthContext";
import DashboardStats from "@/components/DashboardStats";
import QuickActions from "@/components/QuickActions";
import PlayerDashboard from "@/components/PlayerDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Calendar, AlertTriangle, GraduationCap, UserCheck, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const Index = () => {
  const { user, profile, isAdmin, loading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { leagues: leaguesEnabled, matches: matchesEnabled } = useFeatureFlags();
  const { data: recentActivities, isLoading: activitiesLoading } = useRecentActivity();

  console.log('Index page - Auth state:', { user: user?.email, profile, isAdmin, loading });

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
    <div className="space-y-8">
      {/* Header Section con gradiente sutil */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/3 to-background p-8 border border-primary/10">
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {t('pages.dashboard.title')}
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                {t('pages.dashboard.description')}, <span className="font-medium text-foreground">{profile?.full_name || user?.email}</span>
              </p>
            </div>
            <Badge
              className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm font-semibold hover:bg-primary/15 transition-colors"
              variant="outline"
            >
              {t('userMenu.admin')}
            </Badge>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-0" />
      </div>

      {/* Stats Section con animación de hover mejorada */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Estadísticas Generales
        </h2>
        <DashboardStats />
      </div>

      {/* Quick Actions y contenido adicional */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <QuickActions />
        </div>

        {/* Panel de actividad reciente */}
        <Card className="border-primary/10 hover:border-primary/20 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Resumen Rápido
            </CardTitle>
            <CardDescription>
              Información relevante de hoy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div className="p-2 rounded-full bg-primary/10">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Clases de hoy</p>
                <p className="text-xs text-muted-foreground truncate">Revisa la asistencia</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard/today-attendance")}
                className="text-primary hover:text-primary hover:bg-primary/10"
              >
                Ver
              </Button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
              <div className="p-2 rounded-full bg-green-100">
                <Users className="h-4 w-4 text-green-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Jugadores</p>
                <p className="text-xs text-muted-foreground truncate">Gestionar jugadores</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard/players")}
                className="text-green-700 hover:text-green-800 hover:bg-green-100"
              >
                Ver
              </Button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <div className="p-2 rounded-full bg-blue-100">
                <Calendar className="h-4 w-4 text-blue-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Clases programadas</p>
                <p className="text-xs text-muted-foreground truncate">Ver calendario</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard/scheduled-classes")}
                className="text-blue-700 hover:text-blue-800 hover:bg-blue-100"
              >
                Ver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
