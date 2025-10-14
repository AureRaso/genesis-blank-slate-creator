import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Calendar, List, Search, Filter, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClassCalendarView from "@/components/ClassCalendarView";
import ClassListView from "@/components/ClassListView";
import ClassFilters from "@/components/ClassFilters";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveClubs } from "@/hooks/useActiveClubs";
import { useClassGroups } from "@/hooks/useClassGroups";
import { ClassFiltersProvider, useClassFilters } from "@/contexts/ClassFiltersContext";
import { TrainerLegend } from "@/components/calendar/TrainerLegend";
import { FloatingCreateButton } from "@/components/FloatingCreateButton";
function ScheduledClassesContent() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [filteredCalendarClasses, setFilteredCalendarClasses] = useState([]);
  const {
    t
  } = useTranslation();
  const {
    profile
  } = useAuth();
  const {
    data: clubs
  } = useActiveClubs();
  const {
    filters,
    setFilters
  } = useClassFilters();

  // Get the current club based on user profile
  // If user has a club_id, use that club. Otherwise for admins, use the first available club
  const currentClub = profile?.club_id ? clubs?.find(c => c.id === profile.club_id) : clubs?.[0];

  // Only show multiple clubs if admin has NO specific club assigned
  const adminClubs = profile?.role === 'admin' && !profile?.club_id ? clubs : [];
  const {
    data: groups
  } = useClassGroups(currentClub?.id);
  if (!currentClub) {
    return <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              No tienes acceso a ningún club. Contacta con el administrador.
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen overflow-y-auto flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">{t('pages.scheduledClasses.title')}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
              {adminClubs && adminClubs.length > 1 ? `${t('pages.scheduledClasses.description')} todos tus clubes` : `${t('pages.scheduledClasses.description')} ${currentClub.name}`}
            </p>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            {/* View mode toggle */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              <Button variant={viewMode === 'calendar' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('calendar')}>
                <Calendar className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
                <List className="h-4 w-4" />
              </Button>
            </div>

            {(profile?.role === 'admin' || profile?.role === 'trainer') && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/dashboard/scheduled-classes/bulk/new')}
                  className="bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  <span className="hidden xl:inline">Creación Masiva</span>
                  <span className="xl:hidden">Masiva</span>
                </Button>

                <Button onClick={() => navigate('/dashboard/scheduled-classes/new')}>
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden xl:inline">{t('classes.createScheduledClasses')}</span>
                <span className="xl:hidden">Crear</span>
              </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <Tabs value={viewMode} onValueChange={value => setViewMode(value as 'calendar' | 'list')}>
        <TabsList className="hidden">
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-0">
          <ClassCalendarView
            clubId={adminClubs?.length ? undefined : currentClub?.id}
            clubIds={adminClubs?.length ? adminClubs.map(c => c.id) : undefined}
            filters={filters}
            viewModeToggle={viewMode}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <ClassListView
            clubId={adminClubs?.length ? undefined : currentClub?.id}
            clubIds={adminClubs?.length ? adminClubs.map(c => c.id) : undefined}
            filters={filters}
          />
        </TabsContent>
      </Tabs>

      {/* Floating Action Button - Only for admins and trainers on mobile */}
      {(profile?.role === 'admin' || profile?.role === 'trainer') && <FloatingCreateButton />}
    </div>;
}
export default function ScheduledClassesPage() {
  return <ClassFiltersProvider>
      <ScheduledClassesContent />
    </ClassFiltersProvider>;
}