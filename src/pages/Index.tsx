
import { useState } from "react";
import { Users, Trophy, Calendar, TrendingUp, Award, Target, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeams } from "@/hooks/useTeams";
import { useLeagues } from "@/hooks/useLeagues";
import { useMatches } from "@/hooks/useMatches";
import PlayersList from "@/components/PlayersList";
import TeamsList from "@/components/TeamsList";
import LeaguesList from "@/components/LeaguesList";
import MatchesPage from "@/pages/MatchesPage";
import StandingsPage from "@/pages/StandingsPage";
import LeagueRegistrationWithPayment from "@/components/LeagueRegistrationWithPayment";
import LeaguePlayersPage from "@/pages/LeaguePlayersPage";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showLeaguePlayers, setShowLeaguePlayers] = useState(false);
  const { user, isAdmin } = useAuth();

  const { data: players } = usePlayers();
  const { data: teams } = useTeams();
  const { data: leagues } = useLeagues();
  const { data: allMatches } = useMatches();

  const activeLeagues = leagues?.filter(league => league.status === 'active') || [];
  const completedMatches = allMatches?.filter(match => match.status === 'completed') || [];
  const pendingMatches = allMatches?.filter(match => match.status === 'pending') || [];

  const stats = [
    {
      title: "Jugadores Registrados",
      value: players?.length || 0,
      icon: Users,
      description: "Total de jugadores en el sistema",
      color: "from-blue-500 to-cyan-600"
    },
    {
      title: "Equipos Formados",
      value: teams?.length || 0,
      icon: Trophy,
      description: "Parejas registradas",
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "Ligas Activas",
      value: activeLeagues.length,
      icon: Award,
      description: "Competiciones en curso",
      color: "from-purple-500 to-violet-600"
    },
    {
      title: "Partidos Completados",
      value: completedMatches.length,
      icon: Target,
      description: "Encuentros finalizados",
      color: "from-orange-500 to-red-600"
    }
  ];

  const handleEditLeague = () => {
    setActiveTab("leagues");
  };

  if (showLeaguePlayers) {
    return <LeaguePlayersPage onBack={() => setShowLeaguePlayers(false)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            ¡Bienvenido, {user?.email}!
          </h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Panel de administración" : "Dashboard del jugador"}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="players">Jugadores</TabsTrigger>
          <TabsTrigger value="teams">Equipos</TabsTrigger>
          <TabsTrigger value="leagues">Ligas</TabsTrigger>
          <TabsTrigger value="registration">Inscripciones</TabsTrigger>
          <TabsTrigger value="matches">Partidos</TabsTrigger>
          <TabsTrigger value="standings">Clasificaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`h-8 w-8 rounded-full bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Partidos Próximos
                </CardTitle>
                <CardDescription>
                  {pendingMatches.length} partidos pendientes de jugar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setActiveTab("matches")}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                >
                  Ver Partidos
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Clasificaciones
                </CardTitle>
                <CardDescription>
                  Consulta las tablas de posiciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setActiveTab("standings")}
                  variant="outline"
                  className="w-full"
                >
                  Ver Clasificaciones
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Inscripciones
                </CardTitle>
                <CardDescription>
                  {isAdmin ? "Gestionar inscripciones" : "Inscribirse en ligas"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAdmin ? (
                  <Button 
                    onClick={() => setShowLeaguePlayers(true)}
                    variant="outline"
                    className="w-full"
                  >
                    Gestionar Inscripciones
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setActiveTab("registration")}
                    variant="outline"
                    className="w-full"
                  >
                    Ver Ligas Disponibles
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>
                Últimos movimientos en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeLeagues.length > 0 ? (
                  activeLeagues.slice(0, 3).map((league) => (
                    <div key={league.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <Award className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <p className="font-medium">{league.name}</p>
                        <p className="text-sm text-muted-foreground">Liga activa</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No hay actividad reciente
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players">
          <PlayersList />
        </TabsContent>

        <TabsContent value="teams">
          <TeamsList />
        </TabsContent>

        <TabsContent value="leagues">
          <LeaguesList onEditLeague={handleEditLeague} />
        </TabsContent>

        <TabsContent value="registration">
          <LeagueRegistrationWithPayment />
        </TabsContent>

        <TabsContent value="matches">
          <MatchesPage />
        </TabsContent>

        <TabsContent value="standings">
          <StandingsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
