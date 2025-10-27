
import { useState } from "react";
import { Plus, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClassSlotForm from "@/components/ClassSlotForm";
import ClassSlotsList from "@/components/ClassSlotsList";
import ClassBooking from "@/components/ClassBooking";
import MyReservations from "@/components/MyReservations";
import ClubSelection from "@/components/ClubSelection";
import ClubClassesView from "@/components/ClubClassesView";
import AIClassCreatorModal from "@/components/AIClassCreatorModal";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayerReservationStatus } from "@/hooks/usePlayerReservationStatus";
import { ClassSlot } from "@/hooks/useClassSlots";

const ClassesPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingClassSlot, setEditingClassSlot] = useState<ClassSlot | undefined>();
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const { isAdmin, user } = useAuth();
  const { data: reservationStatus, isLoading: isLoadingStatus } = usePlayerReservationStatus();

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingClassSlot(undefined);
  };

  const handleEditClassSlot = (classSlot: ClassSlot) => {
    setEditingClassSlot(classSlot);
    setShowForm(true);
  };

  const handleCreateNew = () => {
    setEditingClassSlot(undefined);
    setShowForm(true);
  };

  const handleClubSelect = (clubId: string) => {
    setSelectedClubId(clubId);
  };

  const handleBackToClubSelection = () => {
    setSelectedClubId(null);
  };

  // Mostrar formulario de administrador
  if (showForm && isAdmin) {
    return (
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
        <ClassSlotForm classSlot={editingClassSlot} onClose={handleCloseForm} />
      </div>
    );
  }

  // Vista de administrador
  if (isAdmin) {
    // Check if user is ivan@gmail.com for AI features
    const isIvanUser = user?.email === 'ivan@gmail.com';

    return (
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark bg-clip-text text-transparent">
              Gestión de Clases
            </h1>
            <p className="text-muted-foreground">
              Crea y gestiona las clases de pádel para los jugadores
            </p>
          </div>
          <div className="flex gap-2">
            {isIvanUser && (
              <Button
                onClick={() => setShowAIModal(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Crear con IA
              </Button>
            )}
            <Button
              onClick={handleCreateNew}
              className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Clase
            </Button>
          </div>
        </div>
        <ClassSlotsList onEditClassSlot={handleEditClassSlot} />

        {/* AI Class Creator Modal - Only for ivan@gmail.com */}
        {isIvanUser && (
          <AIClassCreatorModal
            isOpen={showAIModal}
            onClose={() => setShowAIModal(false)}
          />
        )}
      </div>
    );
  }

  // Cargando estado de reservas del jugador
  if (isLoadingStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-playtomic-orange"></div>
      </div>
    );
  }

  // Vista de jugador - sin reservas previas
  if (!reservationStatus?.hasReservations) {
    // Si está viendo las clases de un club específico
    if (selectedClubId) {
      return (
        <ClubClassesView 
          clubId={selectedClubId} 
          onBack={handleBackToClubSelection}
        />
      );
    }

    // Mostrar selección de clubes
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark bg-clip-text text-transparent">
              Clases de Pádel
            </h1>
            <p className="text-muted-foreground">
              Encuentra y reserva clases de pádel
            </p>
          </div>
        </div>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-playtomic-orange-dark flex items-center space-x-2">
              <GraduationCap className="h-5 w-5" />
              <span>¡Bienvenido a las clases de pádel!</span>
            </CardTitle>
            <CardDescription className="text-playtomic-orange">
              Mejora tu juego con entrenadores profesionales. Selecciona un club para comenzar.
            </CardDescription>
          </CardHeader>
        </Card>

        <ClubSelection onClubSelect={handleClubSelect} />
      </div>
    );
  }

  // Vista de jugador - con reservas previas (vista estándar)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark bg-clip-text text-transparent">
            Clases de Pádel
          </h1>
          <p className="text-muted-foreground">
            Encuentra y reserva clases de pádel
          </p>
        </div>
      </div>

      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-playtomic-orange-dark flex items-center space-x-2">
            <GraduationCap className="h-5 w-5" />
            <span>Clases de Pádel</span>
          </CardTitle>
          <CardDescription className="text-playtomic-orange">
            Reserva tu plaza en las clases disponibles y mejora tu juego con entrenadores profesionales.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="available" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">Clases Disponibles</TabsTrigger>
          <TabsTrigger value="my-reservations">Mis Reservas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available" className="space-y-6">
          <ClassBooking />
        </TabsContent>
        
        <TabsContent value="my-reservations" className="space-y-6">
          <MyReservations />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClassesPage;
