import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, CreditCard, Settings, Users, ClipboardCheck, Tag, Plus, History, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useHasPromotions } from "@/hooks/usePromotions";
import { useClub } from "@/hooks/useClub";
import { useTranslation } from "react-i18next";

const MobileTabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isPlayer, isTrainer, isGuardian, isAdmin, profile, effectiveClubId } = useAuth();
  const { t } = useTranslation();

  // Fetch club data for feature flags
  const { data: club } = useClub(effectiveClubId);

  // Check if club has promotions
  const { data: hasPromotions = false } = useHasPromotions(profile?.club_id);

  // Tabs for players
  const playerTabs = [
    {
      name: t('sidebar.home'),
      path: "/dashboard",
      icon: Home,
    },
    {
      name: t('sidebar.payments'),
      path: "/dashboard/my-payments",
      icon: Wallet,
    },
    {
      name: t('sidebar.history'),
      path: "/dashboard/historial",
      icon: History,
    },
    ...(isGuardian ? [{
      name: t('sidebar.profiles'),
      path: "/dashboard/my-children",
      icon: Users,
    }] : []),
    ...(hasPromotions ? [{
      name: t('sidebar.promotions'),
      path: "/dashboard/promotions",
      icon: Tag,
    }] : []),
  ];

  // Tabs for trainers (same as admin)
  const trainerTabs = [
    {
      name: t('sidebar.dashboard'),
      path: "/dashboard",
      icon: Home,
    },
    {
      name: t('sidebar.createClass'),
      action: () => {
        // Navegar directamente a la página de crear clase
        navigate("/dashboard/scheduled-classes/new");
      },
      icon: Plus,
    },
    {
      name: t('sidebar.attendance'),
      path: "/dashboard/today-attendance",
      icon: ClipboardCheck,
    },
    ...(club?.enable_monthly_payments ? [{
      name: t('sidebar.payments'),
      path: "/dashboard/monthly-payments",
      icon: Wallet,
    }] : []),
  ];

  // Tabs for admins
  const adminTabs = [
    {
      name: t('sidebar.dashboard'),
      path: "/dashboard",
      icon: Home,
    },
    {
      name: t('sidebar.createClass'),
      action: () => {
        // Navegar directamente a la página de crear clase
        navigate("/dashboard/scheduled-classes/new");
      },
      icon: Plus,
    },
    {
      name: t('sidebar.attendance'),
      path: "/dashboard/today-attendance",
      icon: ClipboardCheck,
    },
    ...(club?.enable_monthly_payments ? [{
      name: t('sidebar.payments'),
      path: "/dashboard/monthly-payments",
      icon: Wallet,
    }] : []),
  ];

  // Guardians use the same tabs as players
  const tabs = isAdmin ? adminTabs : isTrainer ? trainerTabs : playerTabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden w-full overflow-hidden">
      <div className="relative shadow-lg" style={{ backgroundColor: '#121726' }}>
        <div className="flex items-center justify-around h-20 px-4">
          {tabs.map((tab: any, index) => {
            // Check if tab is active
            let isActive = false;
            if (tab.path) {
              isActive = location.pathname === tab.path;
            } else if (tab.action) {
              // For action-based tabs, check if we're on the create class page
              isActive = location.pathname === "/dashboard/scheduled-classes/new";
            }
            const Icon = tab.icon;

            const content = (
              <>
                {/* Active background circle */}
                <div className="relative flex items-center justify-center w-12 h-12">
                  {isActive && (
                    <div className="absolute inset-0 bg-white/10 rounded-full transition-all duration-300" />
                  )}

                  {/* Icon */}
                  <Icon
                    className={cn(
                      "relative z-10 transition-all duration-300 ease-out",
                      isActive
                        ? "h-6 w-6 text-white drop-shadow-sm"
                        : "h-5 w-5 text-white/60"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-[10px] font-medium transition-all duration-300 mt-0.5",
                    isActive
                      ? "text-white"
                      : "text-white/60"
                  )}
                >
                  {tab.name}
                </span>
              </>
            );

            // Si tiene action, usar button; si tiene path, usar Link
            if (tab.action) {
              return (
                <button
                  key={index}
                  onClick={tab.action}
                  className={cn(
                    "relative flex flex-col items-center justify-center transition-all duration-300 ease-out",
                    "active:scale-95"
                  )}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  "relative flex flex-col items-center justify-center transition-all duration-300 ease-out",
                  "active:scale-95"
                )}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileTabBar;
