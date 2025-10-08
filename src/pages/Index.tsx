
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
    <div className="h-[calc(100vh-5rem)] overflow-hidden flex flex-col gap-6 bg-[#10172a] p-6 rounded-xl">
      {/* Stats Section sin contenedores */}
      <div>
        <DashboardStats />
      </div>

      {/* Quick Actions y contenido adicional sin contenedores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2">
          <QuickActions />
        </div>

        {/* Panel de accesos rápidos sin contenedor */}
        <div className="h-full flex flex-col">
          <div className="mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-white/90">
              <Trophy className="h-4 w-4 text-primary" />
              Accesos Rápidos
            </h3>
          </div>
          <div className="space-y-2 flex-1 overflow-auto">
            <button
              className="flex items-center gap-3 w-full p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-primary/50 transition-all duration-200 group"
              onClick={() => navigate("/dashboard/today-attendance")}
            >
              <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-white/90">Clases de hoy</p>
              </div>
            </button>

            <button
              className="flex items-center gap-3 w-full p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 group"
              onClick={() => navigate("/dashboard/players")}
            >
              <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/15 transition-colors">
                <Users className="h-4 w-4 text-white/70" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-white/90">Jugadores</p>
              </div>
            </button>

            <button
              className="flex items-center gap-3 w-full p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-primary/50 transition-all duration-200 group"
              onClick={() => navigate("/dashboard/scheduled-classes")}
            >
              <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-white/90">Clases programadas</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
