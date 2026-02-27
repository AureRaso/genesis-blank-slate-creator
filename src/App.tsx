
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Capacitor } from '@capacitor/core';

import { useAuth } from "@/contexts/AuthContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { usePWA } from "@/hooks/usePWA";
import AppLayout from "@/components/AppLayout";
import AuthPage from "@/pages/AuthPage";
import Index from "@/pages/Index";
import LeaguesPage from "@/pages/LeaguesPage";
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
import WeekAttendancePage from "@/pages/WeekAttendancePage";
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
import OwnerAbsencesWaitlistPage from "@/pages/owner/OwnerAbsencesWaitlistPage";
import OwnerClassesAnalyticsPage from "@/pages/owner/OwnerClassesAnalyticsPage";
import OwnerHoldedPage from "@/pages/owner/OwnerHoldedPage";
import OwnerClubReportPage from "@/pages/owner/OwnerClubReportPage";
import GuardianDashboard from "@/pages/GuardianDashboard";
import GuardianClassesDashboard from "@/pages/GuardianClassesDashboard";
import GuardianSetupPage from "@/pages/GuardianSetupPage";
import { GuardianRouter } from "@/components/GuardianRouter";
import MyChildrenPage from "@/pages/MyChildrenPage";
import ClearCachePage from "@/pages/ClearCachePage";
import PromotionsPage from "@/pages/PromotionsPage";
import TestReminderPage from "@/pages/TestReminderPage";
import HistorialPage from "@/pages/HistorialPage";
import LopiviReportPage from "@/pages/LopiviReportPage";
import WhatsAppReportsConfigPage from "@/pages/WhatsAppReportsConfigPage";
import TrainerReportsPage from "@/pages/TrainerReportsPage";
import StudentScoresPage from "@/pages/StudentScoresPage";
import StudentScoreDetailPage from "@/pages/StudentScoreDetailPage";
import StripePaymentPage from "@/pages/StripePaymentPage";
import SubscriptionBlockedPage from "@/pages/SubscriptionBlockedPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import TestPasswordResetPage from "@/pages/TestPasswordResetPage";
import PlayerPaymentsPage from "@/pages/PlayerPaymentsPage";
import AdminPaymentControlPage from "@/pages/AdminPaymentControlPage";
import EjerciciosPage from "@/pages/EjerciciosPage";
import PaymentRatesPage from "@/pages/PaymentRatesPage";
import PaymentRateDetailPage from "@/pages/PaymentRateDetailPage";
import AssignRatesPage from "@/pages/AssignRatesPage";
import BonoTemplatesPage from "@/pages/BonoTemplatesPage";
import AssignBonosPage from "@/pages/AssignBonosPage";
import BonoControlPage from "@/pages/BonoControlPage";
import PrivateLessonsPage from "@/pages/PrivateLessonsPage";
import PlayerPrivateLessonBookingPage from "@/pages/PlayerPrivateLessonBookingPage";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading, authError, retryAuth } = useAuth();

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
  const { leagues: leaguesEnabled } = useFeatureFlags();

  // Registrar PWA y manejar actualizaciones automáticas
  usePWA();

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
              <Route path="/" element={Capacitor.isNativePlatform() ? <Navigate to="/auth" replace /> : <LandingPage />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/test-password-reset" element={<TestPasswordResetPage />} />
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
              <Route path="/test-reminder" element={<TestReminderPage />} />
              <Route path="/lopivi-report" element={
                <ProtectedRoute>
                  <LopiviReportPage />
                </ProtectedRoute>
              } />
              <Route path="/payment-success" element={<PaymentSuccessPage />} />
              <Route path="/payment-cancel" element={<PaymentCancelPage />} />
              <Route path="/subscription-blocked" element={<SubscriptionBlockedPage />} />

        {/* ============================================ */}
        {/* RUTAS DE OWNER - COMPLETAMENTE NUEVAS */}
        {/* NO AFECTAN ninguna funcionalidad existente */}
        {/* ============================================ */}
        <Route path="/owner" element={<OwnerProtectedRoute />}>
          <Route index element={<OwnerDashboard />} />
          <Route path="metrics" element={<OwnerMetricsPage />} />
          <Route path="clubs" element={<OwnerClubsPage />} />
          <Route path="users" element={<OwnerUsersPage />} />
          <Route path="classes-analytics" element={<OwnerClassesAnalyticsPage />} />
          <Route path="absences-waitlist" element={<OwnerAbsencesWaitlistPage />} />
          <Route path="holded" element={<OwnerHoldedPage />} />
          <Route path="club-report" element={<OwnerClubReportPage />} />
          <Route path="system" element={<OwnerSystemPage />} />
          <Route path="settings" element={<OwnerSettingsPage />} />
          <Route path="whatsapp-reports" element={<WhatsAppReportsConfigPage />} />
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
                    <Route path="/today-attendance" element={<WeekAttendancePage />} />
                    <Route path="/trainer-reports" element={<TrainerReportsPage />} />
                    <Route path="/student-scores" element={<StudentScoresPage />} />
                    <Route path="/students/:studentEnrollmentId/score" element={<StudentScoreDetailPage />} />
                    <Route path="/waitlist-notifications" element={<WaitlistNotifications />} />
                    <Route path="/monthly-payments" element={<AdminPaymentControlPage />} />
                    <Route path="/ejercicios" element={<EjerciciosPage />} />
                    <Route path="/private-lessons" element={<PrivateLessonsPage />} />
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
                    <Route path="/my-payments" element={<PlayerPaymentsPage />} />
                    <Route path="/historial" element={<HistorialPage />} />
                    {leaguesEnabled && <Route path="/leagues" element={<LeaguesPage />} />}
                    <Route path="/classes" element={<ClassesPage />} />
                    <Route path="/players" element={<PlayersPage />} />
                     <Route path="/clubs" element={<ClubsPage />} />
                     <Route path="/clubs/new" element={<ClubFormPage />} />
                     <Route path="/clubs/edit/:id" element={<ClubFormPage />} />
                     <Route path="/trainers" element={<TrainersPage />} />
                     <Route path="/promotions" element={<PromotionsPage />} />
                     <Route path="/payment-control" element={<PaymentControlPage />} />
                     <Route path="/payment" element={<StripePaymentPage />} />
                     <Route path="/scheduled-classes" element={
                       (isPlayer || isGuardian) ? <PlayerScheduledClassesPage /> : <ScheduledClassesPage />
                     } />
                     <Route path="/scheduled-classes/new" element={<CreateScheduledClassPage />} />
                     <Route path="/scheduled-classes/bulk/new" element={<CreateBulkClassesPage />} />
                     {isAdmin && <Route path="/today-attendance" element={<WeekAttendancePage />} />}
                     {isAdmin && <Route path="/trainer-reports" element={<TrainerReportsPage />} />}
                     {isAdmin && <Route path="/student-scores" element={<StudentScoresPage />} />}
                     {isAdmin && <Route path="/students/:studentEnrollmentId/score" element={<StudentScoreDetailPage />} />}
                     {isAdmin && <Route path="/monthly-payments" element={<AdminPaymentControlPage />} />}
                     {isAdmin && <Route path="/payment-rates" element={<PaymentRatesPage />} />}
                     {isAdmin && <Route path="/payment-rates/:rateId" element={<PaymentRateDetailPage />} />}
                     {isAdmin && <Route path="/payment-rates/assign" element={<AssignRatesPage />} />}
                     {isAdmin && <Route path="/bono-templates" element={<BonoTemplatesPage />} />}
                     {isAdmin && <Route path="/bono-templates/assign" element={<AssignBonosPage />} />}
                     {isAdmin && <Route path="/bono-control" element={<BonoControlPage />} />}
                     {(isAdmin || isTrainer) && <Route path="/ejercicios" element={<EjerciciosPage />} />}
                     {isAdmin && <Route path="/private-lessons" element={<PrivateLessonsPage />} />}
                     <Route path="/private-lesson-booking" element={<PlayerPrivateLessonBookingPage />} />
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
