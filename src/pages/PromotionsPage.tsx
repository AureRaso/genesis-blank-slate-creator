import { useState } from "react";
import { Plus, Tag, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PromotionModal from "@/components/PromotionModal";
import { usePromotionsByClub, useDeletePromotion } from "@/hooks/usePromotions";
import { Promotion } from "@/types/promotions";
import { useAuth } from "@/contexts/AuthContext";

const PromotionsPage = () => {
  const { isAdmin, profile } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [promotionToDelete, setPromotionToDelete] = useState<string | null>(null);

  // Everyone (including admins) see only their club's promotions
  const { data: clubPromotions, isLoading } = usePromotionsByClub(profile?.club_id);
  const promotions = clubPromotions;

  const deleteMutation = useDeletePromotion();

  const handleCreateNew = () => {
    setSelectedPromotion(null);
    setIsModalOpen(true);
  };

  const handleEdit = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setPromotionToDelete(id);
  };

  const confirmDelete = () => {
    if (promotionToDelete) {
      deleteMutation.mutate(promotionToDelete);
      setPromotionToDelete(null);
    }
  };

  const handleOpenLink = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Promociones</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? "Gestiona las promociones y descuentos de tus clubs"
              : "Descuentos y ofertas exclusivas para ti"
            }
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={handleCreateNew}
            className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Promoción
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Cargando promociones...</div>
        </div>
      ) : promotions && promotions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.map((promotion) => (
            <Card key={promotion.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-playtomic-orange" />
                    <CardTitle className="text-lg">{promotion.brand_name}</CardTitle>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(promotion)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(promotion.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <CardDescription className="flex items-center gap-2">
                  {promotion.clubs?.name || "Club no disponible"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {promotion.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {promotion.description}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    {promotion.discount_code}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenLink(promotion.link)}
                  className="w-full"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ir a la promoción
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No hay promociones disponibles
            </p>
            {isAdmin && (
              <Button
                onClick={handleCreateNew}
                variant="outline"
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear Primera Promoción
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <PromotionModal
        promotion={selectedPromotion}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPromotion(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!promotionToDelete} onOpenChange={() => setPromotionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La promoción será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PromotionsPage;
