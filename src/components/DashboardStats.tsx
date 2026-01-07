
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
import { useTranslation } from "react-i18next";

const DashboardStats = () => {
  const { profile, effectiveClubId } = useAuth();
  const { t } = useTranslation();
  // Pass effectiveClubId to hooks for superadmin filtering support
  const { data: leagues } = useLeagues(effectiveClubId);
  const { data: players } = usePlayers(effectiveClubId);
  const { data: matches } = useMatches(undefined, effectiveClubId);
  const { data: clubs } = useClubs(effectiveClubId);
  const { leagues: leaguesEnabled, matches: matchesEnabled } = useFeatureFlags();

  // Get real data for classes - use effectiveClubId for superadmin support
  const { data: programmedClasses } = useProgrammedClasses(effectiveClubId);
  const { data: todayClasses } = useTodayAttendance();

  // Players are already filtered by effectiveClubId via the hook
  const clubPlayers = players;

  const activeLeagues = leagues?.filter(league => league.status === 'active').length || 0;

  // Clubs are already filtered by effectiveClubId via the hook
  const activeClubs = clubs?.filter(club => club.status === 'active').length || 0;

  const totalRevenue = leagues?.reduce((sum, league) => sum + (league.registration_price || 0), 0) || 0;
  const pendingMatches = matches?.filter(match => match.status === 'pending').length || 0;
  const totalPlayers = clubPlayers?.length || 0;
  const totalProgrammedClasses = programmedClasses?.length || 0;
  const totalTodayClasses = todayClasses?.classes?.length || 0;

  // Define different stats based on feature flags
  // Using only orange (primary) and neutral grays for brand consistency
  const clubStats = [
    {
      title: t('adminDashboard.stats.activeClubs'),
      value: activeClubs,
      icon: Building2,
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/20"
    }
  ];

  const leagueStats = leaguesEnabled ? [
    {
      title: t('adminDashboard.stats.estimatedRevenue'),
      value: `€${totalRevenue}`,
      icon: Euro,
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/20"
    }
  ] : [];

  const matchStats = matchesEnabled ? [
    {
      title: t('adminDashboard.stats.pendingMatches'),
      value: pendingMatches,
      icon: Calendar,
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/20"
    }
  ] : [];

  const coreStats = [
    {
      title: t('adminDashboard.stats.totalPlayers'),
      value: totalPlayers,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/20"
    },
    {
      title: t('adminDashboard.stats.scheduledClasses'),
      value: totalProgrammedClasses,
      icon: GraduationCap,
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/20"
    },
    {
      title: t('adminDashboard.stats.todayTrainings'),
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isOrange = stat.color === 'text-primary';
        return (
          <div
            key={index}
            className="sm:hover:scale-[1.02] transition-all duration-300 cursor-default group relative p-4 sm:p-5 rounded-xl bg-white border border-gray-200 hover:border-primary/40 sm:hover:shadow-lg"
          >
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="flex flex-row items-center justify-between space-y-0 mb-2 sm:mb-3 relative z-10">
              <h3 className="text-xs sm:text-sm font-bold text-[#10172a]/70 group-hover:text-[#10172a] transition-colors">
                {stat.title}
              </h3>
              <div className={`p-2 sm:p-2.5 rounded-xl ${isOrange ? 'bg-primary/10' : 'bg-gray-100'} group-hover:scale-110 transition-transform duration-300 shadow-sm flex-shrink-0`}>
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${isOrange ? 'text-primary' : 'text-[#10172a]'}`} />
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-2xl sm:text-3xl font-bold text-[#10172a] tracking-tight group-hover:scale-105 transition-transform duration-300 origin-left">
                {stat.value}
              </div>
              <div className={`mt-1.5 sm:mt-2 h-1 w-8 sm:w-10 rounded-full bg-gradient-to-r ${isOrange ? 'from-primary' : 'from-[#10172a]'} to-transparent opacity-40 group-hover:w-12 sm:group-hover:w-16 transition-all duration-300`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;
