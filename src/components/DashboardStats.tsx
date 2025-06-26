
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Calendar, TrendingUp, Euro } from "lucide-react";
import { useLeagues } from "@/hooks/useLeagues";
import { usePlayers } from "@/hooks/usePlayers";
import { useMatches } from "@/hooks/useMatches";

const DashboardStats = () => {
  const { data: leagues } = useLeagues();
  const { data: players } = usePlayers();
  const { data: matches } = useMatches();

  const activeLeagues = leagues?.filter(league => league.status === 'active').length || 0;
  const totalRevenue = leagues?.reduce((sum, league) => sum + (league.registration_price || 0), 0) || 0;
  const pendingMatches = matches?.filter(match => match.status === 'pending').length || 0;
  const totalPlayers = players?.length || 0;

  const stats = [
    {
      title: "Ligas Activas",
      value: activeLeagues,
      icon: Trophy,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      border: "border-yellow-200"
    },
    {
      title: "Jugadores Totales",
      value: totalPlayers,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200"
    },
    {
      title: "Partidos Pendientes",
      value: pendingMatches,
      icon: Calendar,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200"
    },
    {
      title: "Ingresos Estimados",
      value: `€${totalRevenue}`,
      icon: Euro,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className={`${stat.bg} ${stat.border} hover:shadow-md transition-shadow`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center pt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-muted-foreground">
                  {index % 2 === 0 ? "+12%" : "+8%"} vs mes anterior
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;
