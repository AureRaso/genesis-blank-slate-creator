
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import AppLayout from "@/components/AppLayout";
import AuthPage from "@/pages/AuthPage";
import Index from "@/pages/Index";
import LeaguesPage from "@/pages/LeaguesPage";
import MatchesPage from "@/pages/MatchesPage";
import ClassesPage from "@/pages/ClassesPage";
import PlayersPage from "@/pages/PlayersPage";
import ClubsPage from "@/pages/ClubsPage";
import ClubFormPage from "@/pages/ClubFormPage";
import NotFound from "@/pages/NotFound";
import TrainersPage from "@/pages/TrainersPage";
import TrainerDashboard from "@/pages/TrainerDashboard";
import TrainerStudentsPage from "@/pages/TrainerStudentsPage";
import LogoutPage from "@/pages/LogoutPage";
import StudentEnrollmentLink from "@/pages/StudentEnrollmentLink";
import ScheduledClassesPage from "@/pages/ScheduledClassesPage";
import PlayerScheduledClassesPage from "@/pages/PlayerScheduledClassesPage";
import StudentClassesPage from "@/pages/StudentClassesPage";
import WaitlistNotifications from "@/pages/WaitlistNotifications";
import PublicEnrollmentPage from "@/pages/PublicEnrollmentPage";
import ClassEnrollmentPage from "@/pages/ClassEnrollmentPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import PaymentCancelPage from "@/pages/PaymentCancelPage";
import PaymentControlPage from "@/pages/PaymentControlPage";
import SettingsPage from "@/pages/SettingsPage";
import LandingPage from "@/pages/LandingPage";
import CompleteProfile from "@/pages/CompleteProfile";
import AuthCallback from "@/pages/AuthCallback";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import TodayAttendancePage from "@/pages/TodayAttendancePage";
import WaitlistJoinPage from "@/pages/WaitlistJoinPage";
import GetIdsPage from "@/pages/GetIdsPage";
import CreateScheduledClassPage from "@/pages/CreateScheduledClassPage";
import CreateBulkClassesPage from "@/pages/CreateBulkClassesPage";
import OwnerProtectedRoute from "@/components/OwnerProtectedRoute";
import OwnerDashboard from "@/pages/owner/OwnerDashboard";
import OwnerMetricsPage from "@/pages/owner/OwnerMetricsPage";
import OwnerClubsPage from "@/pages/owner/OwnerClubsPage";
import OwnerUsersPage from "@/pages/owner/OwnerUsersPage";
import OwnerSystemPage from "@/pages/owner/OwnerSystemPage";
import OwnerSettingsPage from "@/pages/owner/OwnerSettingsPage";
import GuardianDashboard from "@/pages/GuardianDashboard";
import GuardianClassesDashboard from "@/pages/GuardianClassesDashboard";
import GuardianSetupPage from "@/pages/GuardianSetupPage";
import { GuardianRouter } from "@/components/GuardianRouter";
import MyChildrenPage from "@/pages/MyChildrenPage";
import ClearCachePage from "@/pages/ClearCachePage";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading, authError, retryAuth } = useAuth();

  console.log('ProtectedRoute - Auth state:', { user: user?.email, loading, authError });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error de Autenticación</h2>
          <p className="text-gray-600 mb-6">{authError}</p>
          <button
            onClick={retryAuth}
            className="bg-playtomic-orange hover:bg-playtomic-orange-dark text-white px-4 py-2 rounded-md transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

function App() {
  const { isAdmin, isPlayer, isTrainer, isOwner, isGuardian, profile, loading, user, authError, retryAuth } = useAuth();
  const { leagues: leaguesEnabled, matches: matchesEnabled } = useFeatureFlags();

  console.log('App - Auth state:', { isAdmin, isPlayer, isTrainer, isOwner, isGuardian, loading, user: user?.email, authError });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange mx-auto mb-4"></div>
          <p className="text-muted-foreground">Inicializando PadelLock...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error de Aplicación</h2>
          <p className="text-gray-600 mb-6">{authError}</p>
          <button
            onClick={retryAuth}
            className="bg-playtomic-orange hover:bg-playtomic-orange-dark text-white px-4 py-2 rounded-md transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
        <Routes>
              <Route path="/" element={<AuthCallback />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/clear-cache" element={<ClearCachePage />} />
              <Route path="/complete-profile" element={
                <ProtectedRoute>
                  <CompleteProfile />
                </ProtectedRoute>
              } />
              <Route path="/logout" element={<LogoutPage />} />
              <Route path="/student-enrollment/:token" element={<StudentEnrollmentLink />} />
              <Route path="/enrollment/:token" element={<PublicEnrollmentPage />} />
              <Route path="/enroll/:token" element={<ClassEnrollmentPage />} />
              <Route path="/waitlist/:classId/:date" element={<WaitlistJoinPage />} />
              <Route path="/get-ids" element={<GetIdsPage />} />
              <Route path="/payment-success" element={<PaymentSuccessPage />} />
              <Route path="/payment-cancel" element={<PaymentCancelPage />} />

        {/* ============================================ */}
        {/* RUTAS DE OWNER - COMPLETAMENTE NUEVAS */}
        {/* NO AFECTAN ninguna funcionalidad existente */}
        {/* ============================================ */}
        <Route path="/owner" element={<OwnerProtectedRoute />}>
          <Route index element={<OwnerDashboard />} />
          <Route path="metrics" element={<OwnerMetricsPage />} />
          <Route path="clubs" element={<OwnerClubsPage />} />
          <Route path="users" element={<OwnerUsersPage />} />
          <Route path="system" element={<OwnerSystemPage />} />
          <Route path="settings" element={<OwnerSettingsPage />} />
        </Route>

        {/* ============================================ */}
        {/* RUTAS DE GUARDIAN - PARA PADRES/TUTORES */}
        {/* ============================================ */}
        {/* Ruta de setup inicial para guardians (agregar hijos después del registro) */}
        <Route path="/guardian/setup" element={
          <ProtectedRoute>
            <GuardianSetupPage />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            {/* REDIRECCIÓN AUTOMÁTICA SOLO PARA OWNERS */}
            {isOwner ? (
              <Navigate to="/owner" replace />
            ) : (
            <AppLayout>
              <Routes>
                {isTrainer ? (
                  // Rutas específicas para trainers - ahora incluye clases programadas
                  <>
                    <Route path="/" element={<TrainerDashboard />} />
                    <Route path="/dashboard" element={<TrainerDashboard />} />
                    <Route path="/students" element={<TrainerStudentsPage />} />
                    <Route path="/scheduled-classes" element={<ScheduledClassesPage />} />
                    <Route path="/scheduled-classes/new" element={<CreateScheduledClassPage />} />
                    <Route path="/scheduled-classes/bulk/new" element={<CreateBulkClassesPage />} />
                    <Route path="/today-attendance" element={<TodayAttendancePage />} />
                    <Route path="/waitlist-notifications" element={<WaitlistNotifications />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </>
                ) : (
                  // Rutas para otros roles (admin y player) con feature flags
                  <>
                    <Route path="/" element={<Index />} />
                    <Route path="/dashboard" element={<Index />} />
                    <Route path="/my-classes" element={<StudentClassesPage />} />
                    <Route path="/my-children" element={<MyChildrenPage />} />
                    {leaguesEnabled && <Route path="/leagues" element={<LeaguesPage />} />}
                    {matchesEnabled && <Route path="/matches" element={<MatchesPage />} />}
                    <Route path="/classes" element={<ClassesPage />} />
                    <Route path="/players" element={<PlayersPage />} />
                     <Route path="/clubs" element={<ClubsPage />} />
                     <Route path="/clubs/new" element={<ClubFormPage />} />
                     <Route path="/clubs/edit/:id" element={<ClubFormPage />} />
                     <Route path="/trainers" element={<TrainersPage />} />
                     <Route path="/payment-control" element={<PaymentControlPage />} />
                     <Route path="/scheduled-classes" element={
                       (isPlayer || isGuardian) ? <PlayerScheduledClassesPage /> : <ScheduledClassesPage />
                     } />
                     <Route path="/scheduled-classes/new" element={<CreateScheduledClassPage />} />
                     <Route path="/scheduled-classes/bulk/new" element={<CreateBulkClassesPage />} />
                     {isAdmin && <Route path="/today-attendance" element={<TodayAttendancePage />} />}
                     <Route path="/settings" element={<SettingsPage />} />
                     <Route path="*" element={<NotFound />} />
                  </>
                )}
              </Routes>
            </AppLayout>
            )}
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
