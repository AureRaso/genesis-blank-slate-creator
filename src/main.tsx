
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/contexts/LanguageContext";
import App from './App.tsx'
import './index.css'
import './i18n'

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <SidebarProvider>
          <App />
          <Toaster />
        </SidebarProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);
