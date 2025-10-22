import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, ArrowRight, Loader2, PartyPopper } from 'lucide-react';
import { useGuardianChildren, GuardianChild } from '@/hooks/useGuardianChildren';
import { AddChildModal } from '@/components/AddChildModal';
import { useAuth } from '@/contexts/AuthContext';
import padelockLogo from '@/assets/PadeLock_D5Red.png';

const GuardianSetupPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { children, isLoading, addChild, isAddingChild } = useGuardianChildren();
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [hasAddedAtLeastOne, setHasAddedAtLeastOne] = useState(false);

  // Check if user should be on this page
  // Only redirect if role is explicitly NOT guardian (don't redirect on undefined/null during loading)
  useEffect(() => {
    if (profile && profile.role && profile.role !== 'guardian' && profile.role !== 'player') {
      // Not a guardian or player (child), redirect to dashboard
      // We allow 'player' temporarily because when adding a child, the session might switch briefly
      navigate('/dashboard', { replace: true });
    }
  }, [profile?.role, navigate]); // Only depend on role, not full profile object

  // Update the flag when children are added
  useEffect(() => {
    if (children.length > 0) {
      setHasAddedAtLeastOne(true);
    }
  }, [children]);

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

  const handleFinishSetup = () => {
    // Siempre usar recarga completa para asegurar que la sesión del guardian está activa
    // Esto evita problemas de estado cacheado después de crear hijos
    console.log('🔄 Navigating to dashboard with full page reload...');
    window.location.href = '/dashboard';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-playtomic-dark to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-playtomic-orange animate-spin" />
          <p className="text-white text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-playtomic-dark to-slate-900 p-4 sm:p-6 lg:p-8">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-playtomic-orange/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-playtomic-orange/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <img
            src={padelockLogo}
            alt="PadeLock Logo"
            className="h-20 sm:h-24 lg:h-28 w-auto mx-auto mb-6 drop-shadow-2xl"
          />
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            ¡Bienvenido a PadeLock!
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto">
            Añade el perfil de tus hijos para poder inscribirles en clases y gestionar su asistencia
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Add Child Button */}
          <div className="text-center">
            <Button
              onClick={() => setIsAddChildModalOpen(true)}
              size="lg"
              className="bg-gradient-to-r from-playtomic-orange to-orange-600 hover:from-playtomic-orange/90 hover:to-orange-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Añadir Hijo/a
            </Button>
          </div>

          {/* Children List */}
          {children.length === 0 ? (
            <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
              <CardContent className="py-12 text-center">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-slate-800">
                  No has añadido ningún hijo todavía
                </h3>
                <p className="text-base text-muted-foreground px-4">
                  Haz clic en "Añadir Hijo/a" para empezar
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Success Message - Más compacto */}
              <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white max-w-2xl mx-auto">
                <CardContent className="py-4 px-6 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <PartyPopper className="h-8 w-8 flex-shrink-0" />
                    <div className="text-left">
                      <h3 className="text-lg font-bold">
                        ¡Perfecto! Has añadido {children.length} {children.length === 1 ? 'hijo' : 'hijos'}
                      </h3>
                      <p className="text-sm text-white/90">
                        Puedes añadir más o continuar al dashboard
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Children Cards - Más compactas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-w-6xl mx-auto">
                {children.map((child) => {
                  const age = calculateAge(child.birth_date);

                  return (
                    <Card
                      key={child.id}
                      className="border-0 shadow-md bg-white/95 backdrop-blur-xl border-l-4 border-l-playtomic-orange hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-playtomic-orange to-orange-600 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-white" />
                          </div>
                          <h4 className="text-base font-bold text-slate-800 mb-1 truncate">
                            {child.full_name}
                          </h4>
                          {age !== null && (
                            <p className="text-xs text-muted-foreground mb-0.5">
                              {age} años
                            </p>
                          )}
                          {child.level && (
                            <p className="text-xs text-muted-foreground">
                              Nivel {child.level}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            {hasAddedAtLeastOne && (
              <Button
                onClick={handleFinishSetup}
                size="lg"
                className="bg-white text-slate-900 hover:bg-white/90 hover:scale-105 font-semibold shadow-lg transition-all duration-200"
              >
                No añadir más hijos
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            )}
          </div>

          {/* Skip Option */}
          {!hasAddedAtLeastOne && (
            <div className="text-center pt-4">
              <button
                onClick={handleFinishSetup}
                className="text-slate-300 hover:text-white text-sm underline transition-colors"
              >
                Omitir por ahora (puedes añadir hijos más tarde)
              </button>
            </div>
          )}
        </div>
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

export default GuardianSetupPage;
