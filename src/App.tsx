
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index";
import PlayersPage from "./pages/PlayersPage";
import LeaguesPage from "./pages/LeaguesPage";
import MatchesPage from "./pages/MatchesPage";
import StandingsPage from "./pages/StandingsPage";
import LeaguePlayersPage from "./pages/LeaguePlayersPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SidebarProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Index />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/players" element={
                <ProtectedRoute>
                  <AppLayout>
                    <PlayersPage />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/leagues" element={
                <ProtectedRoute>
                  <AppLayout>
                    <LeaguesPage />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/matches" element={
                <ProtectedRoute>
                  <AppLayout>
                    <MatchesPage />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/standings" element={
                <ProtectedRoute>
                  <AppLayout>
                    <StandingsPage />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/league-players" element={
                <ProtectedRoute>
                  <AppLayout>
                    <LeaguePlayersPage />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SidebarProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
