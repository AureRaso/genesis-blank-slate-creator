import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ClubForm from "@/components/ClubForm";
import { Club } from "@/types/clubs";
import { useClubs } from "@/hooks/useClubs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ClubFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: clubs } = useClubs();
  const [editingClub, setEditingClub] = useState<Club | undefined>();

  useEffect(() => {
    if (id && clubs) {
      const club = clubs.find(c => c.id === id);
      setEditingClub(club);
    }
  }, [id, clubs]);

  const handleClose = () => {
    navigate("/clubs");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={handleClose}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Clubs
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark bg-clip-text text-transparent">
            {id ? "Editar Club" : "Nuevo Club"}
          </h1>
          <p className="text-muted-foreground">
            {id ? "Modifica la información del club" : "Crea un nuevo club de pádel"}
          </p>
        </div>
      </div>
      
      <ClubForm club={editingClub} onClose={handleClose} />
    </div>
  );
};

export default ClubFormPage;