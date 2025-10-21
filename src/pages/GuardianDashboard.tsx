import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGuardianChildren } from '@/hooks/useGuardianChildren';
import { AddChildModal } from '@/components/AddChildModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Calendar, Target, Building2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const GuardianDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { children, isLoading, addChild, isAddingChild } = useGuardianChildren();
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [justAddedFirstChild, setJustAddedFirstChild] = useState(false);

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

  const handleAddChild = (data: any) => {
    const wasFirstChild = children.length === 0;
    addChild(data, {
      onSuccess: () => {
        setIsAddChildModalOpen(false);
        if (wasFirstChild) {
          setJustAddedFirstChild(true);
        }
      }
    });
  };

  // Redirigir al dashboard después de añadir el primer hijo
  useEffect(() => {
    if (justAddedFirstChild && children.length > 0) {
      // Esperar un momento para que el toast se muestre
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    }
  }, [justAddedFirstChild, children.length, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Users className="h-8 w-8 text-playtomic-orange" />
              Mis Hijos
            </h1>
            <p className="text-slate-600 mt-1">
              Bienvenido/a, {profile?.full_name}
            </p>
          </div>

          <Button
            onClick={() => setIsAddChildModalOpen(true)}
            className="bg-gradient-to-r from-playtomic-orange to-orange-600 hover:from-playtomic-orange/90 hover:to-orange-700 shadow-lg"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Añadir Hijo/a
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-playtomic-orange" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && children.length === 0 && (
          <Card className="border-2 border-dashed border-slate-300">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-16 w-16 text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                No tienes hijos añadidos
              </h3>
              <p className="text-slate-500 text-center max-w-md mb-6">
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
        )}

        {/* Children List */}
        {!isLoading && children.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => {
              const age = calculateAge(child.birth_date);

              return (
                <Card
                  key={child.id}
                  className="hover:shadow-xl transition-all duration-300 border-2 hover:border-playtomic-orange/30"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                          {child.full_name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {child.email}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {child.relationship_type === 'child' ? 'Hijo/a' : 'Otro'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Edad */}
                    {age !== null && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="h-4 w-4 text-playtomic-orange" />
                        <span>{age} años</span>
                      </div>
                    )}

                    {/* Club */}
                    {child.club && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Building2 className="h-4 w-4 text-playtomic-orange" />
                        <span>{child.club.name}</span>
                      </div>
                    )}

                    {/* Nivel */}
                    {child.level && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Target className="h-4 w-4 text-playtomic-orange" />
                        <span>Nivel {child.level}</span>
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        className="flex-1 hover:bg-playtomic-orange hover:text-white transition-colors"
                        onClick={() => {
                          // TODO: Navegar a las clases del hijo
                          console.log('Ver clases de:', child.id);
                        }}
                      >
                        Ver Clases
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 hover:bg-slate-900 hover:text-white transition-colors"
                        onClick={() => {
                          // TODO: Gestionar el perfil del hijo
                          console.log('Gestionar:', child.id);
                        }}
                      >
                        Gestionar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Stats Summary */}
        {!isLoading && children.length > 0 && (
          <Card className="bg-gradient-to-r from-playtomic-orange/10 to-orange-100/10 border-playtomic-orange/20">
            <CardContent className="py-6">
              <div className="flex items-center justify-center gap-8 text-center">
                <div>
                  <p className="text-3xl font-bold text-playtomic-orange">
                    {children.length}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {children.length === 1 ? 'Hijo/a registrado/a' : 'Hijos/as registrados/as'}
                  </p>
                </div>
                <div className="h-12 w-px bg-slate-300"></div>
                <div>
                  <p className="text-3xl font-bold text-playtomic-orange">
                    {children.filter(c => c.club).length}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Con club asignado
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Child Modal */}
      <AddChildModal
        open={isAddChildModalOpen}
        onOpenChange={setIsAddChildModalOpen}
        onAddChild={handleAddChild}
        isLoading={isAddingChild}
      />
    </div>
  );
};

export default GuardianDashboard;
