import { useState } from "react";
import { Plus, Calendar, List } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import ScheduledClassForm from "@/components/ScheduledClassForm";
import ClassCalendarView from "@/components/ClassCalendarView";
import ClassListView from "@/components/ClassListView";
import ClassFilters from "@/components/ClassFilters";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveClubs } from "@/hooks/useActiveClubs";
import { useClassGroups } from "@/hooks/useClassGroups";
import { ClassFiltersProvider, useClassFilters } from "@/contexts/ClassFiltersContext";
import { TrainerLegend } from "@/components/calendar/TrainerLegend";

function ScheduledClassesContent() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [filteredCalendarClasses, setFilteredCalendarClasses] = useState([]);
  
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { data: clubs } = useActiveClubs();
  const { filters, setFilters } = useClassFilters();
  
  // For admins, get all their clubs. For players, get their specific club
  const adminClubs = profile?.role === 'admin' ? clubs : [];
  const currentClub = profile?.club_id ? clubs?.find(c => c.id === profile.club_id) : clubs?.[0];
  const { data: groups } = useClassGroups(currentClub?.id);

  const handleCloseForm = () => {
    setShowCreateForm(false);
  };

  if (!currentClub) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              No tienes acceso a ningún club. Contacta con el administrador.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-0 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('pages.scheduledClasses.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {profile?.role === 'admin' && adminClubs && adminClubs.length > 1
              ? `${t('pages.scheduledClasses.description')} todos tus clubes`
              : `${t('pages.scheduledClasses.description')} ${currentClub.name}`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('classes.createScheduledClasses')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="sr-only">
                <DialogTitle>{t('classes.createScheduledClasses')}</DialogTitle>
                <DialogDescription>
                  Formulario para crear una nueva clase programada con horarios recurrentes y asignación de alumnos.
                </DialogDescription>
              </DialogHeader>
              <ScheduledClassForm
                onClose={handleCloseForm}
                clubId={currentClub.id}
                trainerProfileId={profile?.id || ""}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros y leyenda solo en modo calendario */}
      {viewMode === 'calendar' && (
        <>
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-start gap-4">
              <div className="w-full max-w-lg">
                <ClassFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  groups={groups}
                  trainers={[]} // TODO: Add trainers data when available
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Filtros solo en modo listado */}
      {viewMode === 'list' && (
        <ClassFilters
          filters={filters}
          onFiltersChange={setFilters}
          groups={groups}
          trainers={[]} // TODO: Add trainers data when available
        />
      )}

      {/* Main content */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'calendar' | 'list')}>
        <TabsList className="hidden">
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-0">
          <ClassCalendarView
            clubId={profile?.role === 'admin' ? undefined : currentClub.id}
            clubIds={profile?.role === 'admin' ? adminClubs?.map(c => c.id) : undefined}
            filters={filters}
            onFilteredClassesChange={setFilteredCalendarClasses}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <ClassListView
            clubId={profile?.role === 'admin' ? undefined : currentClub.id}
            clubIds={profile?.role === 'admin' ? adminClubs?.map(c => c.id) : undefined}
            filters={filters}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ScheduledClassesPage() {
  return (
    <ClassFiltersProvider>
      <ScheduledClassesContent />
    </ClassFiltersProvider>
  );
}
