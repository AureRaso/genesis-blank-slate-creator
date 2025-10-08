
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
  // Using only orange (primary) and neutral grays for brand consistency
  const clubStats = [
    {
      title: "Clubes Activos",
      value: activeClubs,
      icon: Building2,
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/20"
    }
  ];

  const leagueStats = leaguesEnabled ? [
    {
      title: "Ingresos Estimados",
      value: `€${totalRevenue}`,
      icon: Euro,
      color: "text-gray-700",
      bg: "bg-gray-50",
      border: "border-gray-200"
    }
  ] : [];

  const matchStats = matchesEnabled ? [
    {
      title: "Partidos Pendientes",
      value: pendingMatches,
      icon: Calendar,
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/20"
    }
  ] : [];

  const coreStats = [
    {
      title: "Jugadores Totales",
      value: totalPlayers,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/20"
    },
    {
      title: "Clases Programadas",
      value: totalProgrammedClasses,
      icon: GraduationCap,
      color: "text-gray-700",
      bg: "bg-gray-50",
      border: "border-gray-200"
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

  // Combine stats based on enabled features
  const stats = [...coreStats, ...clubStats, ...leagueStats, ...matchStats].slice(0, 4);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className={`${stat.bg} ${stat.border} hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-default group overflow-hidden relative`}
          >
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-xs font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg} ring-1 ring-white shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 pb-3">
              <div className="text-2xl font-bold text-gray-900 tracking-tight group-hover:scale-105 transition-transform duration-300 origin-left">
                {stat.value}
              </div>
              <div className="mt-1 h-0.5 w-8 rounded-full bg-gradient-to-r from-current to-transparent opacity-30 group-hover:w-12 transition-all duration-300" style={{ color: stat.color.replace('text-', '') }} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;
