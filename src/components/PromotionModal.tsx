import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreatePromotion, useUpdatePromotion } from "@/hooks/usePromotions";
import { useAdminClubs } from "@/hooks/useClubs";
import { Promotion } from "@/types/promotions";
import { Tag, FileText, Link2, Building2, Percent } from "lucide-react";

interface PromotionModalProps {
  promotion?: Promotion | null;
  isOpen: boolean;
  onClose: () => void;
}

const PromotionModal = ({ promotion, isOpen, onClose }: PromotionModalProps) => {
  const [formData, setFormData] = useState({
    club_id: "",
    brand_name: "",
    description: "",
    discount_code: "",
    link: "",
  });

  const { data: clubs, isLoading: clubsLoading } = useAdminClubs();
  const createMutation = useCreatePromotion();
  const updateMutation = useUpdatePromotion();

  useEffect(() => {
    if (promotion) {
      setFormData({
        club_id: promotion.club_id,
        brand_name: promotion.brand_name,
        description: promotion.description || "",
        discount_code: promotion.discount_code,
        link: promotion.link,
      });
    } else {
      setFormData({
        club_id: "",
        brand_name: "",
        description: "",
        discount_code: "",
        link: "",
      });
    }
  }, [promotion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (promotion) {
      // Update existing promotion
      updateMutation.mutate(
        {
          id: promotion.id,
          brand_name: formData.brand_name,
          description: formData.description || undefined,
          discount_code: formData.discount_code,
          link: formData.link,
        },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    } else {
      // Create new promotion
      createMutation.mutate(
        {
          club_id: formData.club_id,
          brand_name: formData.brand_name,
          description: formData.description || undefined,
          discount_code: formData.discount_code,
          link: formData.link,
        },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {promotion ? "Editar Promoción" : "Nueva Promoción"}
          </DialogTitle>
          <DialogDescription>
            {promotion
              ? `Modifica los datos de la promoción de ${promotion.brand_name}`
              : "Añade una nueva promoción para tu club"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Club Selection - Only for new promotions */}
          {!promotion && (
            <div className="space-y-2">
              <Label htmlFor="club_id" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Club
              </Label>
              <Select
                value={formData.club_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, club_id: value }))}
                disabled={clubsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs?.map(club => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Brand Name */}
          <div className="space-y-2">
            <Label htmlFor="brand_name" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Nombre de Marca
            </Label>
            <Input
              id="brand_name"
              value={formData.brand_name}
              onChange={(e) => setFormData(prev => ({ ...prev, brand_name: e.target.value }))}
              placeholder="Ej: Nike, Adidas, Head..."
              required
            />
          </div>

          {/* Discount Code */}
          <div className="space-y-2">
            <Label htmlFor="discount_code" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Código de Descuento
            </Label>
            <Input
              id="discount_code"
              value={formData.discount_code}
              onChange={(e) => setFormData(prev => ({ ...prev, discount_code: e.target.value }))}
              placeholder="Ej: PADEL20, VERANO2024..."
              required
            />
          </div>

          {/* Link */}
          <div className="space-y-2">
            <Label htmlFor="link" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Enlace
            </Label>
            <Input
              id="link"
              type="url"
              value={formData.link}
              onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
              placeholder="https://ejemplo.com/promo"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Descripción (Opcional)
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detalles sobre la promoción, condiciones, etc..."
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark"
            >
              {isSubmitting
                ? "Guardando..."
                : promotion
                  ? "Guardar Cambios"
                  : "Crear Promoción"
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionModal;
