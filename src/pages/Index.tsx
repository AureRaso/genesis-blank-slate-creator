
import { useAuth } from "@/contexts/AuthContext";
import DashboardStats from "@/components/DashboardStats";
import QuickActions from "@/components/QuickActions";
import PlayerDashboard from "@/components/PlayerDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Calendar, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { user, profile, isAdmin, loading } = useAuth();
  const { t } = useTranslation();

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
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('pages.dashboard.title')}</h1>
          <p className="text-muted-foreground">
            {t('pages.dashboard.description')}, {user?.email}
            <Badge className="ml-2" variant="default">
              {t('userMenu.admin')}
            </Badge>
          </p>
        </div>

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              Últimas actualizaciones en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <Users className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Nuevo jugador registrado</p>
                  <p className="text-xs text-muted-foreground">Hace 2 horas</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Partido programado</p>
                  <p className="text-xs text-muted-foreground">Hace 5 horas</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Liga actualizada</p>
                  <p className="text-xs text-muted-foreground">Hace 1 día</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
