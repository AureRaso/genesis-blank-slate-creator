import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGuardianChildren } from '@/hooks/useGuardianChildren';
import { useGuardianChildrenClasses } from '@/hooks/useGuardianChildrenClasses';
import { AddChildModal } from '@/components/AddChildModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Calendar, Clock, User, MapPin, Euro, CreditCard, CheckCircle, AlertCircle, BookOpen, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const GuardianClassesDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { children, isLoading: loadingChildren, addChild, isAddingChild } = useGuardianChildren();
  const { data: classes = [], isLoading: loadingClasses } = useGuardianChildrenClasses();
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);

  const handleAddChild = (data: any) => {
    addChild(data, {
      onSuccess: () => {
        setIsAddChildModalOpen(false);
      }
    });
  };

  const formatDaysOfWeek = (days: string[]) => {
    const dayMapping: { [key: string]: string } = {
      'lunes': 'L',
      'martes': 'M',
      'miercoles': 'X',
      'jueves': 'J',
      'viernes': 'V',
      'sabado': 'S',
      'domingo': 'D'
    };
    return days.map(day => dayMapping[day] || day.charAt(0).toUpperCase()).join(', ');
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pagado';
      case 'pending':
        return 'Pendiente';
      case 'overdue':
        return 'Vencido';
      default:
        return status;
    }
  };

  const isLoading = loadingChildren || loadingClasses;

  // Estado vacío: cuando no hay hijos
  if (!isLoading && children.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
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
          </div>

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

          <AddChildModal
            open={isAddChildModalOpen}
            onOpenChange={setIsAddChildModalOpen}
            onAddChild={handleAddChild}
            isLoading={isAddingChild}
          />
        </div>
      </div>
    );
  }

  // Dashboard principal: muestra las clases de los hijos
  return (
    <div className="min-h-screen overflow-y-auto flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Clases de mis Hijos
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Gestiona las suscripciones de tus hijos
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => navigate('/guardian/manage')}
            variant="outline"
            className="border-playtomic-orange text-playtomic-orange hover:bg-playtomic-orange hover:text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            Gestionar Hijos
          </Button>
          <Button
            onClick={() => setIsAddChildModalOpen(true)}
            className="bg-gradient-to-r from-playtomic-orange to-orange-600 hover:from-playtomic-orange/90 hover:to-orange-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Añadir Hijo/a
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:flex">
        <Card className="shadow-md">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-playtomic-orange" />
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Hijos</p>
                <p className="text-xl sm:text-2xl font-bold text-black">
                  {children.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Clases Activas</p>
                <p className="text-xl sm:text-2xl font-bold text-black">
                  {classes.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600" />
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pendientes</p>
                <p className="text-xl sm:text-2xl font-bold text-black">
                  {classes.filter(c => c.payment_status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
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
      )}

      {/* Classes List */}
      {!isLoading && classes.length === 0 && (
        <Card>
          <CardContent className="py-8 sm:py-12 text-center">
            <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">
              Tus hijos no tienen clases programadas
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground px-4">
              Habla con el profesor para que les asigne a una clase.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && classes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {classes.map((participation) => (
            <Card
              key={participation.id}
              className="border-0 shadow-lg rounded-xl sm:rounded-2xl transition-all duration-300 hover:shadow-xl sm:hover:scale-[1.02] bg-white border-l-4 border-l-playtomic-orange"
            >
              <CardContent className="p-4 sm:p-6 lg:p-8">
                {/* Child Name Badge */}
                <div className="mb-3">
                  <Badge className="bg-playtomic-orange text-white">
                    {participation.child_name}
                  </Badge>
                </div>

                {/* Header Section */}
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 sm:mb-2">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-slate-700 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-slate-700">
                        {formatDaysOfWeek(participation.programmed_class.days_of_week)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-slate-800 flex-shrink-0" />
                      <span className="text-sm sm:text-base lg:text-lg font-bold text-slate-800">
                        {formatTime(participation.programmed_class.start_time)} ({participation.programmed_class.duration_minutes} min)
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getPaymentStatusColor(participation.payment_status)}>
                      {getPaymentStatusText(participation.payment_status)}
                    </Badge>
                    {participation.payment_verified && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        ✓ Verificado
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Class Details */}
                <div className="space-y-3 mb-4">
                  <h3 className="text-xl font-bold text-slate-800 leading-tight">
                    {participation.programmed_class.name}
                  </h3>

                  <div className="flex items-center gap-2 text-slate-600">
                    <div className="p-1 bg-primary/10 rounded">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">
                      {participation.programmed_class.trainer?.full_name || 'Entrenador no asignado'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{participation.programmed_class.club.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Euro className="h-3.5 w-3.5" />
                      <span>€{participation.programmed_class.monthly_price}/mes</span>
                    </div>
                  </div>
                </div>

                {/* Subscription Info */}
                {participation.subscription && (
                  <div className="mt-6 pt-4 border-t border-slate-200/60">
                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-blue-100 rounded">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-sm font-semibold text-blue-800">Suscripción</span>
                        </div>
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          {participation.subscription.status === 'active' ? 'Activa' :
                           participation.subscription.status === 'past_due' ? 'Pago Pendiente' :
                           participation.subscription.status === 'canceled' ? 'Cancelada' :
                           participation.subscription.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-blue-700">
                        <p><strong>Próximo cobro:</strong> {new Date(participation.subscription.current_period_end).toLocaleDateString()}</p>
                        {participation.subscription.cancel_at_period_end && (
                          <p className="text-orange-600"><strong>Se cancelará:</strong> Al final del período actual</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Notes */}
                {participation.payment_notes && (
                  <div className="mt-4 p-3 bg-slate-100/50 rounded-lg">
                    <p className="text-sm text-slate-700"><strong>Notas:</strong> {participation.payment_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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

export default GuardianClassesDashboard;
