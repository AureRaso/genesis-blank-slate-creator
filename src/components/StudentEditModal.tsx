import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudentEnrollment, useUpdateStudentEnrollment } from "@/hooks/useStudentEnrollments";
import { User, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SuperAdminClub {
  id: string;
  name: string;
}

interface StudentEditModalProps {
  student: StudentEnrollment | null;
  isOpen: boolean;
  onClose: () => void;
  isSuperAdmin?: boolean;
  superAdminClubs?: SuperAdminClub[];
}

const StudentEditModal = ({ student, isOpen, onClose, isSuperAdmin = false, superAdminClubs = [] }: StudentEditModalProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    full_name: student?.full_name || "",
    club_id: student?.club_id || "",
  });

  const showClubSelector = isSuperAdmin && superAdminClubs.length > 1;

  // Reset form data when student changes
  useEffect(() => {
    if (student) {
      setFormData({
        full_name: student.full_name || "",
        club_id: student.club_id || "",
      });
    }
  }, [student]);

  const updateMutation = useUpdateStudentEnrollment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    updateMutation.mutate(
      { id: student.id, data: formData },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('playersPage.studentEditModal.title', 'Editar Alumno')}
          </DialogTitle>
          <DialogDescription>
            {t('playersPage.studentEditModal.description', 'Modifica los datos de {{name}}', { name: student.full_name })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="full_name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('playersPage.studentEditModal.fullName', 'Nombre Completo')}
            </Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              required
            />
          </div>

          {/* Club Selector - Solo para superadmin con múltiples clubes */}
          {showClubSelector && (
            <div className="space-y-2">
              <Label htmlFor="club_id" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {t('playersPage.studentEditModal.club', 'Club')}
              </Label>
              <Select
                value={formData.club_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, club_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('playersPage.studentEditModal.selectClub', 'Selecciona un club')} />
                </SelectTrigger>
                <SelectContent>
                  {superAdminClubs.map(club => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel', 'Cancelar')}
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark"
            >
              {updateMutation.isPending
                ? t('common.saving', 'Guardando...')
                : t('common.save', 'Guardar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StudentEditModal;