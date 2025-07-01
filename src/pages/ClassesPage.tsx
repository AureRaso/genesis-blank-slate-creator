
import { useState } from "react";
import { Plus, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClassSlotForm from "@/components/ClassSlotForm";
import ClassSlotsList from "@/components/ClassSlotsList";
import ClassBooking from "@/components/ClassBooking";
import MyReservations from "@/components/MyReservations";
import { useAuth } from "@/contexts/AuthContext";
import { ClassSlot } from "@/hooks/useClassSlots";

const ClassesPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingClassSlot, setEditingClassSlot] = useState<ClassSlot | undefined>();
  const { isAdmin } = useAuth();

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

  if (showForm && isAdmin) {
    return (
      <div className="space-y-6">
        <ClassSlotForm classSlot={editingClassSlot} onClose={handleCloseForm} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark bg-clip-text text-transparent">
            {isAdmin ? "Gestión de Clases" : "Clases de Pádel"}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "Crea y gestiona las clases de pádel para los jugadores" 
              : "Encuentra y reserva clases de pádel"}
          </p>
        </div>
        {isAdmin && (
          <Button 
            onClick={handleCreateNew}
            className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Clase
          </Button>
        )}
      </div>

      {!isAdmin && (
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
      )}

      {isAdmin ? (
        <ClassSlotsList onEditClassSlot={handleEditClassSlot} />
      ) : (
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
      )}
    </div>
  );
};

export default ClassesPage;
