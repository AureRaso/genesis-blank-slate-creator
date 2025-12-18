
import { Plus, Users, Calendar, GraduationCap, UserCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useTranslation } from "react-i18next";

interface QuickActionsProps {
  showTitle?: boolean;
  hideScheduleClass?: boolean;
}

const QuickActions = ({ showTitle = true, hideScheduleClass = false }: QuickActionsProps) => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { leagues: leaguesEnabled } = useFeatureFlags();
  const { t } = useTranslation();

  const adminActions = [
    ...(leaguesEnabled ? [{
      title: t('adminDashboard.quickActions.createLeague'),
      description: t('adminDashboard.quickActions.createLeagueDesc'),
      icon: Plus,
      action: () => navigate("/dashboard/leagues"),
      key: "createLeague"
    }] : []),
    {
      title: t('adminDashboard.quickActions.players'),
      description: t('adminDashboard.quickActions.playersDesc'),
      icon: Users,
      action: () => navigate("/dashboard/players"),
      key: "players"
    },
    {
      title: t('adminDashboard.quickActions.trainers'),
      description: t('adminDashboard.quickActions.trainersDesc'),
      icon: UserCheck,
      action: () => navigate("/dashboard/trainers"),
      key: "trainers"
    },
    {
      title: t('adminDashboard.quickActions.scheduleClasses'),
      description: t('adminDashboard.quickActions.scheduleClassesDesc'),
      icon: GraduationCap,
      action: () => navigate("/dashboard/scheduled-classes"),
      key: "scheduleClasses"
    }
  ];

  const playerActions = [
    ...(leaguesEnabled ? [{
      title: t('adminDashboard.quickActions.createLeague'),
      description: t('adminDashboard.quickActions.createLeagueDesc'),
      icon: Plus,
      action: () => navigate("/dashboard/leagues"),
      key: "createLeague"
    }] : []),
    {
      title: t('adminDashboard.quickActions.viewPlayers'),
      description: t('adminDashboard.quickActions.viewPlayersDesc'),
      icon: Users,
      action: () => navigate("/dashboard/players"),
      key: "viewPlayers"
    },
    {
      title: t('adminDashboard.quickActions.myClasses'),
      description: t('adminDashboard.quickActions.myClassesDesc'),
      icon: GraduationCap,
      action: () => navigate("/dashboard/scheduled-classes"),
      key: "myClasses"
    }
  ];

  let actions = isAdmin ? adminActions : playerActions;

  // Filter out "Programar Clases" if hideScheduleClass is true
  if (hideScheduleClass) {
    actions = actions.filter(action => action.key !== "scheduleClasses");
  }

  return (
    <div className="h-full flex flex-col">
      {showTitle && (
        <div className="mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-bold text-[#10172a]">
            {t('adminDashboard.quickActions.title')}
          </h3>
        </div>
      )}
      <div className="flex-1">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.action}
                className="group relative rounded-xl bg-white hover:bg-primary/5 p-3 sm:p-4 lg:p-5 border border-gray-200 hover:border-primary/40 transition-all duration-300 sm:hover:scale-[1.02] sm:hover:shadow-lg text-left"
              >
                {/* Decorative background element */}
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors duration-300" />

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 h-full">
                  <div className="p-2 sm:p-2.5 lg:p-3 rounded-xl bg-primary/10 flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-[#10172a] group-hover:text-primary transition-colors leading-tight">
                      {action.title}
                    </h3>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
