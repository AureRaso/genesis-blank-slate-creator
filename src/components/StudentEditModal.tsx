import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  StudentEnrollment,
  useUpdateStudentEnrollment,
  useStudentClubEnrollments,
  useAddStudentToClub,
  useRemoveStudentFromClub
} from "@/hooks/useStudentEnrollments";
import { User, Building2, Users, Loader2 } from "lucide-react";
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

  // ============================================
  // MULTI-CLUB FEATURE - START
  // Fecha: 2024-01
  // Descripción: Permite a superadmins compartir alumnos entre clubes
  // Para revertir: Eliminar todo el código marcado con MULTI-CLUB y restaurar el original
  // ============================================

  // Estado para gestionar los clubes adicionales seleccionados
  const [selectedAdditionalClubs, setSelectedAdditionalClubs] = useState<Set<string>>(new Set());
  const [isProcessingMultiClub, setIsProcessingMultiClub] = useState(false);

  // Hook para obtener las inscripciones actuales del alumno
  const { data: currentEnrollments, isLoading: loadingEnrollments } = useStudentClubEnrollments(student?.email || '');

  // Hooks para añadir/eliminar de clubes
  const addToClubMutation = useAddStudentToClub();
  const removeFromClubMutation = useRemoveStudentFromClub();

  // Clubes donde el alumno ya está inscrito (excluyendo el club actual de esta inscripción)
  const enrolledClubIds = new Set(currentEnrollments?.map(e => e.club_id) || []);

  // Clubes disponibles para añadir (excluyendo donde ya está inscrito)
  const availableClubsToAdd = superAdminClubs.filter(
    club => club.id !== student?.club_id && !enrolledClubIds.has(club.id)
  );

  // Inscripciones en otros clubes (para mostrar y permitir eliminar)
  const otherClubEnrollments = currentEnrollments?.filter(
    e => e.club_id !== student?.club_id
  ) || [];

  // Sincronizar estado cuando cambian las inscripciones
  useEffect(() => {
    setSelectedAdditionalClubs(new Set());
  }, [currentEnrollments]);

  // ============================================
  // MULTI-CLUB FEATURE - END
  // ============================================

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

  // ============================================
  // MULTI-CLUB FEATURE - START
  // ============================================

  // Handler para toggle de club adicional
  const handleAdditionalClubToggle = (clubId: string, checked: boolean) => {
    setSelectedAdditionalClubs(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(clubId);
      } else {
        newSet.delete(clubId);
      }
      return newSet;
    });
  };

  // Handler para procesar cambios de multi-club
  const handleMultiClubChanges = async () => {
    if (!student || selectedAdditionalClubs.size === 0) return;

    setIsProcessingMultiClub(true);
    try {
      // Añadir a los clubes seleccionados
      for (const clubId of selectedAdditionalClubs) {
        await addToClubMutation.mutateAsync({
          sourceEnrollment: student,
          targetClubId: clubId,
        });
      }
      setSelectedAdditionalClubs(new Set());
    } catch (error) {
      console.error('Error adding student to clubs:', error);
    } finally {
      setIsProcessingMultiClub(false);
    }
  };

  // Handler para eliminar de un club
  const handleRemoveFromClub = async (enrollmentId: string) => {
    try {
      await removeFromClubMutation.mutateAsync({ enrollmentId });
    } catch (error) {
      console.error('Error removing student from club:', error);
    }
  };

  // ============================================
  // MULTI-CLUB FEATURE - END
  // ============================================

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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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

          {/* ============================================ */}
          {/* MULTI-CLUB FEATURE - UI START */}
          {/* ============================================ */}
          {showClubSelector && (
            <>
              <Separator className="my-4" />

              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-base font-medium">
                  <Users className="h-4 w-4" />
                  Compartir con otros clubes
                </Label>
                <p className="text-sm text-muted-foreground">
                  Permite que este alumno esté inscrito en múltiples clubes simultáneamente.
                </p>

                {/* Inscripciones actuales en otros clubes */}
                {otherClubEnrollments.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Inscrito en:</Label>
                    <div className="flex flex-wrap gap-2">
                      {otherClubEnrollments.map(enrollment => (
                        <Badge
                          key={enrollment.id}
                          variant="secondary"
                          className="flex items-center gap-1 pr-1"
                        >
                          <span>{(enrollment.clubs as any)?.name || 'Club'}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                            onClick={() => handleRemoveFromClub(enrollment.id)}
                            disabled={removeFromClubMutation.isPending}
                          >
                            ×
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clubes disponibles para añadir */}
                {loadingEnrollments ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando...
                  </div>
                ) : availableClubsToAdd.length > 0 ? (
                  <div className="space-y-3">
                    <Label className="text-sm text-muted-foreground">Añadir a:</Label>
                    <div className="space-y-2">
                      {availableClubsToAdd.map(club => (
                        <div key={club.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`club-${club.id}`}
                            checked={selectedAdditionalClubs.has(club.id)}
                            onCheckedChange={(checked) =>
                              handleAdditionalClubToggle(club.id, checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`club-${club.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {club.name}
                          </label>
                        </div>
                      ))}
                    </div>

                    {selectedAdditionalClubs.size > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleMultiClubChanges}
                        disabled={isProcessingMultiClub}
                        className="w-full"
                      >
                        {isProcessingMultiClub ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Añadiendo...
                          </>
                        ) : (
                          <>
                            <Users className="h-4 w-4 mr-2" />
                            Añadir a {selectedAdditionalClubs.size} club{selectedAdditionalClubs.size > 1 ? 'es' : ''}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ) : otherClubEnrollments.length > 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    El alumno ya está inscrito en todos los clubes disponibles.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No hay otros clubes disponibles para añadir.
                  </p>
                )}
              </div>
            </>
          )}
          {/* ============================================ */}
          {/* MULTI-CLUB FEATURE - UI END */}
          {/* ============================================ */}

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