
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ClubsList from "@/components/ClubsList";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Club } from "@/types/clubs";

const ClubsPage = () => {
  const navigate = useNavigate();
  const { isAdmin, isPlayer } = useAuth();

  const handleEditClub = (club: Club) => {
    navigate(`/dashboard/clubs/edit/${club.id}`);
  };

  const handleCreateNewClub = () => {
    navigate("/dashboard/clubs/new");
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">
            {isPlayer ? "Mi Club" : "Gestión de Clubs"}
          </h1>
        </div>
        {isAdmin && (
          <Button onClick={handleCreateNewClub} className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Club
          </Button>
        )}
      </div>

      {!isAdmin && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-playtomic-orange-dark">
              {isPlayer ? "Información de Solo Lectura" : "Acceso de Solo Lectura"}
            </CardTitle>
            <CardDescription className="text-playtomic-orange">
              {isPlayer
                ? "Aquí puedes ver la información de tu club."
                : "Solo los administradores pueden crear y editar clubs."
              }
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      <ClubsList onEditClub={handleEditClub} />
    </div>
  );
};

export default ClubsPage;
