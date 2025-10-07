
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Calendar, TrendingUp, Euro, GraduationCap, Clock, Building2 } from "lucide-react";
import { useLeagues } from "@/hooks/useLeagues";
import { usePlayers } from "@/hooks/usePlayers";
import { useMatches } from "@/hooks/useMatches";
import { useClubs } from "@/hooks/useClubs";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useProgrammedClasses } from "@/hooks/useProgrammedClasses";
import { useTodayAttendance } from "@/hooks/useTodayAttendance";
import { useAuth } from "@/contexts/AuthContext";

const DashboardStats = () => {
  const { profile } = useAuth();
  const { data: leagues } = useLeagues();
  const { data: players } = usePlayers();
  const { data: matches } = useMatches();
  const { data: clubs } = useClubs();
  const { leagues: leaguesEnabled, matches: matchesEnabled } = useFeatureFlags();

  // Get real data for classes
  const { data: programmedClasses } = useProgrammedClasses(profile?.club_id);
  const { data: todayClasses } = useTodayAttendance();

  const activeLeagues = leagues?.filter(league => league.status === 'active').length || 0;

  // Filter clubs to show only those belonging to this admin
  const activeClubs = clubs?.filter(club => {
    if (club.status !== 'active') return false;
    // Check if admin created this club or is assigned to it
    return club.created_by_profile_id === profile?.id || club.id === profile?.club_id;
  }).length || 0;

  const totalRevenue = leagues?.reduce((sum, league) => sum + (league.registration_price || 0), 0) || 0;
  const pendingMatches = matches?.filter(match => match.status === 'pending').length || 0;
  const totalPlayers = players?.length || 0;
  const totalProgrammedClasses = programmedClasses?.length || 0;
  const totalTodayClasses = todayClasses?.length || 0;

  // Define different stats based on feature flags
  const clubStats = [
    {
      title: "Clubes Activos",
      value: activeClubs,
      icon: Building2,
      color: "text-playtomic-orange",
      bg: "bg-orange-50",
      border: "border-orange-200"
    }
  ];

  const leagueStats = leaguesEnabled ? [
    {
      title: "Ingresos Estimados",
      value: `€${totalRevenue}`,
      icon: Euro,
      color: "text-playtomic-green-dark",
      bg: "bg-green-50",
      border: "border-green-200"
    }
  ] : [];

  const matchStats = matchesEnabled ? [
    {
      title: "Partidos Pendientes",
      value: pendingMatches,
      icon: Calendar,
      color: "text-playtomic-orange-dark",
      bg: "bg-orange-50",
      border: "border-orange-200"
    }
  ] : [];

  const coreStats = [
    {
      title: "Jugadores Totales",
      value: totalPlayers,
      icon: Users,
      color: "text-playtomic-green",
      bg: "bg-green-50",
      border: "border-green-200"
    },
    {
      title: "Clases Programadas",
      value: totalProgrammedClasses,
      icon: GraduationCap,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200"
    },
    {
      title: "Entrenamientos Hoy",
      value: totalTodayClasses,
      icon: Clock,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200"
    }
  ];

  // Combine stats based on enabled features
  const stats = [...coreStats, ...clubStats, ...leagueStats, ...matchStats].slice(0, 4);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className={`${stat.bg} ${stat.border} hover:shadow-md transition-shadow`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-playtomic-gray-700">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;
