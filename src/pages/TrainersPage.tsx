
import { useState } from "react";
import { Plus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TrainerForm from "@/components/TrainerForm";
import TrainersList from "@/components/TrainersList";
import { useAuth } from "@/contexts/AuthContext";
import { Trainer } from "@/hooks/useTrainers";

const TrainersPage = () => {
  const [showTrainerForm, setShowTrainerForm] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | undefined>();
  const { isAdmin } = useAuth();

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

  if (showTrainerForm) {
    return (
      <div className="space-y-6">
        <TrainerForm trainer={editingTrainer} onClose={handleCloseTrainerForm} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-black">
          Gestión de Profesores
        </h1>
        {isAdmin && (
          <Button onClick={handleCreateNewTrainer} className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Profesor
          </Button>
        )}
      </div>

      {!isAdmin && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-playtomic-orange-dark">Acceso de Solo Lectura</CardTitle>
            <CardDescription className="text-playtomic-orange">
              Solo los administradores pueden crear y editar profesores.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      
      <TrainersList onEditTrainer={handleEditTrainer} onCreateTrainer={handleCreateNewTrainer} />
    </div>
  );
};

export default TrainersPage;
