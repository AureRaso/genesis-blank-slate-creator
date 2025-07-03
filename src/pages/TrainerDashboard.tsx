
import { useState } from "react";
import { Calendar, Plus, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useMyTrainerProfile } from "@/hooks/useTrainers";
import { useMyClassSlots } from "@/hooks/useClassSlots";
import TrainerClassForm from "@/components/TrainerClassForm";

const TrainerDashboard = () => {
  const [showClassForm, setShowClassForm] = useState(false);
  const { data: trainerProfile, isLoading: profileLoading } = useMyTrainerProfile();
  const { data: myClasses, isLoading: classesLoading } = useMyClassSlots();

  const handleCloseClassForm = () => {
    setShowClassForm(false);
  };

  const handleCreateNewClass = () => {
    setShowClassForm(true);
  };

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (showClassForm) {
    return (
      <div className="space-y-6">
        <TrainerClassForm onClose={handleCloseClassForm} trainerProfile={trainerProfile} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark bg-clip-text text-transparent">
          Panel del Profesor
        </h1>
        <p className="text-muted-foreground">
          Bienvenido, {trainerProfile?.full_name}
        </p>
      </div>

      {/* Club asignado */}
      {trainerProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Mi Club</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">
              {trainerProfile.clubs?.name || 'Club no asignado'}
            </Badge>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Mi Calendario</TabsTrigger>
          <TabsTrigger value="create">Nueva Clase</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Mis Clases</h2>
              <p className="text-muted-foreground">Calendario de clases programadas</p>
            </div>
            <Button onClick={handleCreateNewClass} className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Clase
            </Button>
          </div>

          {classesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !myClasses || myClasses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay clases programadas</h3>
                <p className="text-muted-foreground mb-4">
                  Crea tu primera clase para comenzar
                </p>
                <Button onClick={handleCreateNewClass} className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primera Clase
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myClasses.map((classSlot) => (
                <Card key={classSlot.id} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{classSlot.objective}</CardTitle>
                    <CardDescription>
                      {classSlot.clubs?.name} - Pista {classSlot.court_number}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {classSlot.day_of_week}
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      {classSlot.start_time} ({classSlot.duration_minutes} min)
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      {classSlot.class_reservations?.length || 0} / {classSlot.max_players} alumnos
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <Badge variant="outline" className="text-xs">
                        {classSlot.level}
                      </Badge>
                      <span className="text-sm font-medium">
                        {classSlot.price_per_player}€/persona
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="create" className="space-y-6">
          <TrainerClassForm onClose={handleCloseClassForm} trainerProfile={trainerProfile} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrainerDashboard;
