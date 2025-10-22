import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Calendar, Target, Building2, Loader2, CheckCircle, AlertCircle, Edit } from 'lucide-react';
import { useGuardianChildren, GuardianChild } from '@/hooks/useGuardianChildren';
import { AddChildModal } from '@/components/AddChildModal';
import { EditChildModal } from '@/components/EditChildModal';

const MyChildrenPage = () => {
  const { children, isLoading, addChild, isAddingChild, editChild, isEditingChild } = useGuardianChildren();
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<GuardianChild | null>(null);

  const handleAddChild = (data: any) => {
    addChild(data, {
      onSuccess: () => {
        // Cerrar el modal inmediatamente
        setIsAddChildModalOpen(false);

        // Recargar la página INMEDIATAMENTE para mantener la sesión del guardian
        // La sesión del guardian ya fue restaurada en el hook
        console.log('🔄 Reloading page to restore guardian session...');
        window.location.reload();
      }
    });
  };

  const handleEditChild = (childId: string, data: { fullName: string; level: number }) => {
    editChild({ childId, data }, {
      onSuccess: () => {
        setEditingChild(null);
      }
    });
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen overflow-y-auto flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6">
      {/* Header with Summary Cards */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Mis Hijos
          </h1>
        </div>

        {/* Action Button */}
        <div className="flex gap-2">
          <Button
            onClick={() => setIsAddChildModalOpen(true)}
            className="bg-gradient-to-r from-playtomic-orange to-orange-600 hover:from-playtomic-orange/90 hover:to-orange-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Añadir Hijo/a
          </Button>
        </div>
      </div>

      {/* Children List */}
      {children.length === 0 ? (
        <Card>
          <CardContent className="py-8 sm:py-12 text-center">
            <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">
              No tienes hijos añadidos
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground px-4 mb-6">
              Añade el perfil de tus hijos para poder inscribirles en clases y gestionar su asistencia
            </p>
            <Button
              onClick={() => setIsAddChildModalOpen(true)}
              className="bg-gradient-to-r from-playtomic-orange to-orange-600 hover:from-playtomic-orange/90 hover:to-orange-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Añadir Primer Hijo/a
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {children.map((child) => {
            const age = calculateAge(child.birth_date);

            return (
              <Card
                key={child.id}
                className="border-0 shadow-lg rounded-xl sm:rounded-2xl transition-all duration-300 hover:shadow-xl sm:hover:scale-[1.02] bg-white border-l-4 border-l-playtomic-orange"
              >
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  {/* Header Section */}
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-slate-800 leading-tight mb-2">
                        {child.full_name}
                      </h3>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {child.relationship_type === 'child' ? 'Hijo/a' : 'Otro'}
                    </Badge>
                  </div>

                  {/* Child Details */}
                  <div className="space-y-3 mb-4">
                    {/* Age */}
                    {age !== null && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <div className="p-1 bg-primary/10 rounded">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{age} años</span>
                      </div>
                    )}

                    {/* Level */}
                    {child.level && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <div className="p-1 bg-primary/10 rounded">
                          <Target className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-medium">Nivel {child.level}</span>
                      </div>
                    )}

                    {/* Club */}
                    {child.club && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <div className="p-1 bg-primary/10 rounded">
                          <Building2 className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{child.club.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Section */}
                  <div className="mt-6 pt-4 border-t border-slate-200/60">
                    <Button
                      variant="outline"
                      className="w-full hover:bg-slate-900 hover:text-white transition-colors"
                      onClick={() => setEditingChild(child)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Child Modal */}
      <AddChildModal
        open={isAddChildModalOpen}
        onOpenChange={setIsAddChildModalOpen}
        onAddChild={handleAddChild}
        isLoading={isAddingChild}
      />

      {/* Edit Child Modal */}
      <EditChildModal
        child={editingChild}
        open={!!editingChild}
        onOpenChange={(open) => !open && setEditingChild(null)}
        onEditChild={handleEditChild}
        isLoading={isEditingChild}
      />
    </div>
  );
};

export default MyChildrenPage;
