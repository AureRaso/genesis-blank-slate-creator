import { useState } from "react";
import { Plus, Building2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClubForm from "@/components/ClubForm";
import ClubsList from "@/components/ClubsList";
import TrainerForm from "@/components/TrainerForm";
import TrainersList from "@/components/TrainersList";
import { useAuth } from "@/contexts/AuthContext";
import { Club } from "@/types/clubs";
import { Trainer } from "@/hooks/useTrainers";

const ClubsPage = () => {
  const [showClubForm, setShowClubForm] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | undefined>();
  const [showTrainerForm, setShowTrainerForm] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | undefined>();
  const { isAdmin } = useAuth();

  const handleCloseClubForm = () => {
    setShowClubForm(false);
    setEditingClub(undefined);
  };

  const handleEditClub = (club: Club) => {
    setEditingClub(club);
    setShowClubForm(true);
  };

  const handleCreateNewClub = () => {
    setEditingClub(undefined);
    setShowClubForm(true);
  };

  const handleCloseTrainerForm = () => {
    setShowTrainerForm(false);
    setEditingTrainer(undefined);
  };

  const handleEditTrainer = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setShowTrainerForm(true);
  };

  const handleCreateNewTrainer = () => {
    setEditingTrainer(undefined);
    setShowTrainerForm(true);
  };

  if (showClubForm) {
    return (
      <div className="space-y-6">
        <ClubForm club={editingClub} onClose={handleCloseClubForm} />
      </div>
    );
  }

  if (showTrainerForm) {
    return (
      <div className="space-y-6">
        <TrainerForm trainer={editingTrainer} onClose={handleCloseTrainerForm} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark bg-clip-text text-transparent">
          Gestión de Clubs
        </h1>
        <p className="text-muted-foreground">
          Administra los clubs y profesores para las clases de pádel
        </p>
      </div>

      {!isAdmin && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-playtomic-orange-dark">Acceso de Solo Lectura</CardTitle>
            <CardDescription className="text-playtomic-orange">
              Solo los administradores pueden crear y editar clubs y profesores.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Tabs defaultValue="clubs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clubs">Clubs</TabsTrigger>
          <TabsTrigger value="trainers">Profesores</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clubs" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Clubs Registrados</h2>
              <p className="text-muted-foreground">Gestiona tus clubs de pádel</p>
            </div>
            {isAdmin && (
              <Button onClick={handleCreateNewClub} className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Club
              </Button>
            )}
          </div>
          <ClubsList onEditClub={handleEditClub} />
        </TabsContent>
        
        <TabsContent value="trainers" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Profesores</h2>
              <p className="text-muted-foreground">Gestiona los profesores de tus clubs</p>
            </div>
            {isAdmin && (
              <Button onClick={handleCreateNewTrainer} className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark">
                <UserCheck className="mr-2 h-4 w-4" />
                Nuevo Profesor
              </Button>
            )}
          </div>
          <TrainersList onEditTrainer={handleEditTrainer} onCreateTrainer={handleCreateNewTrainer} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubsPage;