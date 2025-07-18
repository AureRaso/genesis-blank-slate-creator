import { useState } from "react";
import { Plus, Filter, Calendar, List } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import ScheduledClassForm from "@/components/ScheduledClassForm";
import ClassCalendarView from "@/components/ClassCalendarView";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveClubs } from "@/hooks/useActiveClubs";

export default function ScheduledClassesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  
  const { profile } = useAuth();
  const { data: clubs } = useActiveClubs();
  
  const currentClub = profile?.club_id ? clubs?.find(c => c.id === profile.club_id) : clubs?.[0];

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" size="sm">
              Todos los niveles
            </Button>
            <Button variant="outline" size="sm">
              Iniciación
            </Button>
            <Button variant="outline" size="sm">
              Intermedio
            </Button>
            <Button variant="outline" size="sm">
              Avanzado
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main content */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'calendar' | 'list')}>
        <TabsList className="hidden">
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-0">
          <ClassCalendarView clubId={currentClub.id} />
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Vista de Lista</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Vista de lista próximamente...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}