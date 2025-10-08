
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
    <div className="h-[calc(100vh-5rem)] overflow-hidden flex flex-col gap-6">
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
          <div className="mb-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-[#10172a]">
              <Trophy className="h-5 w-5 text-primary" />
              Accesos Rápidos
            </h3>
          </div>
          <div className="space-y-3 flex-1 overflow-auto">
            <button
              className="flex items-center gap-3 w-full p-4 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 group shadow-sm hover:shadow-md"
              onClick={() => navigate("/dashboard/today-attendance")}
            >
              <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-base font-bold text-[#10172a]">Clases de hoy</p>
              </div>
            </button>

            <button
              className="flex items-center gap-3 w-full p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 group shadow-sm hover:shadow-md"
              onClick={() => navigate("/dashboard/players")}
            >
              <div className="p-2.5 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                <Users className="h-5 w-5 text-[#10172a]" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-base font-bold text-[#10172a]">Jugadores</p>
              </div>
            </button>

            <button
              className="flex items-center gap-3 w-full p-4 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 group shadow-sm hover:shadow-md"
              onClick={() => navigate("/dashboard/scheduled-classes")}
            >
              <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-base font-bold text-[#10172a]">Clases programadas</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
