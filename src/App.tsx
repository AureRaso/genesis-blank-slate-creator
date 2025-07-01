
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import AuthPage from "@/components/auth/AuthPage";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "@/pages/Index";
import PlayersPage from "@/pages/PlayersPage";
import LeaguesPage from "@/pages/LeaguesPage";
import ClubsPage from "@/pages/ClubsPage";
import ClassesPage from "@/pages/ClassesPage";
import MatchesPage from "@/pages/MatchesPage";
import StandingsPage from "@/pages/StandingsPage";
import LeaguePlayersPage from "@/pages/LeaguePlayersPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/players" element={<PlayersPage />} />
                          <Route path="/clubs" element={<ClubsPage />} />
                          <Route path="/classes" element={<ClassesPage />} />
                          <Route path="/leagues" element={<LeaguesPage />} />
                          <Route path="/matches" element={<MatchesPage />} />
                          <Route path="/standings" element={<StandingsPage />} />
                          <Route path="/league-players" element={<LeaguePlayersPage />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </SidebarProvider>
        </Router>
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
