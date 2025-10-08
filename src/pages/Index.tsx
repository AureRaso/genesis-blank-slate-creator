
import { useAuth } from "@/contexts/AuthContext";
import DashboardStats from "@/components/DashboardStats";
import QuickActions from "@/components/QuickActions";
import PlayerDashboard from "@/components/PlayerDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

const Index = () => {
  const { user, profile, isAdmin, loading } = useAuth();
  const { t } = useTranslation();
  const { leagues: leaguesEnabled, matches: matchesEnabled } = useFeatureFlags();

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
      {/* Stats Section */}
      <div>
        <DashboardStats />
      </div>

      {/* Quick Actions - Full width */}
      <div className="flex-1 min-h-0">
        <QuickActions />
      </div>
    </div>
  );
};

export default Index;
