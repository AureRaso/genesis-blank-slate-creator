
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import AuthPage from "@/pages/AuthPage";
import Index from "@/pages/Index";
import LeaguesPage from "@/pages/LeaguesPage";
import MatchesPage from "@/pages/MatchesPage";
import ClassesPage from "@/pages/ClassesPage";
import PlayersPage from "@/pages/PlayersPage";
import ClubsPage from "@/pages/ClubsPage";
import NotFound from "@/pages/NotFound";
import TrainersPage from "@/pages/TrainersPage";
import TrainerDashboard from "@/pages/TrainerDashboard";

const queryClient = new QueryClient();

function App() {
  const { isAdmin, isCaptain, isTrainer, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange"></div>
      </div>
    );
  }

  // Redireccionar según el rol del usuario
  if (isTrainer) {
    return (
      <Router>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<TrainerDashboard />} />
                    <Route path="/dashboard" element={<TrainerDashboard />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </QueryClientProvider>
      </Router>
    );
  }

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/leagues" element={isAdmin ? <LeaguesPage /> : <Navigate to="/" replace />} />
                  <Route path="/matches" element={<MatchesPage />} />
                  <Route path="/classes" element={<ClassesPage />} />
                  <Route path="/players" element={<PlayersPage />} />
                  <Route path="/clubs" element={<ClubsPage />} />
                  <Route path="/trainers" element={<TrainersPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </QueryClientProvider>
    </Router>
  );
}

export default App;

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};
