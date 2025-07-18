
import { useState } from "react";
import { Plus, Calendar, List } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import ScheduledClassForm from "@/components/ScheduledClassForm";
import ClassCalendarView from "@/components/ClassCalendarView";
import ClassListView from "@/components/ClassListView";
import ClassFilters from "@/components/ClassFilters";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveClubs } from "@/hooks/useActiveClubs";
import { useClassGroups } from "@/hooks/useClassGroups";
import { ClassFiltersProvider, useClassFilters } from "@/contexts/ClassFiltersContext";

function ScheduledClassesContent() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  
  const { profile } = useAuth();
  const { data: clubs } = useActiveClubs();
  const { filters, setFilters } = useClassFilters();
  
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
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clases Programadas</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona y programa clases recurrentes para {currentClub.name}
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
                Nueva Clase
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <ScheduledClassForm
                onClose={handleCloseForm}
                clubId={currentClub.id}
                trainerProfileId={profile?.id || ""}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <ClassFilters
        filters={filters}
        onFiltersChange={setFilters}
        groups={groups}
        trainers={[]} // TODO: Add trainers data when available
      />

      {/* Main content */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'calendar' | 'list')}>
        <TabsList className="hidden">
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-0">
          <ClassCalendarView clubId={currentClub.id} filters={filters} />
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <ClassListView clubId={currentClub.id} filters={filters} />
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
