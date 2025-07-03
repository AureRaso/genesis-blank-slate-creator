
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

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

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  console.log('ProtectedRoute - Auth state:', { user: user?.email, loading });

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

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

function App() {
  const { isAdmin, isCaptain, isTrainer, loading, user } = useAuth();

  console.log('App - Auth state:', { isAdmin, isCaptain, isTrainer, loading, user: user?.email });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange mx-auto mb-4"></div>
          <p className="text-muted-foreground">Inicializando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                {isTrainer ? (
                  // Rutas específicas para trainers
                  <>
                    <Route path="/" element={<TrainerDashboard />} />
                    <Route path="/dashboard" element={<TrainerDashboard />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </>
                ) : (
                  // Rutas para otros roles
                  <>
                    <Route path="/" element={<Index />} />
                    <Route path="/leagues" element={isAdmin ? <LeaguesPage /> : <Navigate to="/" replace />} />
                    <Route path="/matches" element={<MatchesPage />} />
                    <Route path="/classes" element={<ClassesPage />} />
                    <Route path="/players" element={<PlayersPage />} />
                    <Route path="/clubs" element={<ClubsPage />} />
                    <Route path="/trainers" element={<TrainersPage />} />
                    <Route path="*" element={<NotFound />} />
                  </>
                )}
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
