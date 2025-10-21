import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useClubs } from '@/hooks/useClubs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, CreditCard, ExternalLink, Settings, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordChangeSection } from '@/components/PasswordChangeSection';
import { canChangePassword, getAuthProviderMessage } from '@/utils/authProviders';
import { useNavigate } from 'react-router-dom';

// Extended club interface with Stripe properties
interface ClubWithStripe {
  id: string;
  name: string;
  stripe_account_id?: string | null;
  stripe_account_status?: string | null;
  stripe_onboarding_completed?: boolean | null;
}

const SettingsPage = () => {
  const { profile, isAdmin, isPlayer, isTrainer, isGuardian, user } = useAuth();
  const { data: clubs } = useClubs();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [testStripeUrl, setTestStripeUrl] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    full_name: profile?.full_name || '',
    email: user?.email || '',
    phone: profile?.phone || '',
    level: profile?.level || '',
  });

  // Get the selected club or default to the first one
  const club = clubs && clubs.length > 0
    ? clubs.find(c => c.id === selectedClubId) as ClubWithStripe || clubs[0] as ClubWithStripe
    : null;

  // Get user's club name
  const userClub = clubs?.find(c => c.id === profile?.club_id);

  // Set default selected club when clubs load
  React.useEffect(() => {
    if (clubs && clubs.length > 0 && !selectedClubId) {
      setSelectedClubId(clubs[0].id);
    }
  }, [clubs, selectedClubId]);

  const handleConnectStripe = async () => {
    setLoading(true);
    try {
      if (!club?.id) {
        toast.error('Debes tener un club creado para conectar con Stripe');
        return;
      }

      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: { clubId: club.id }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió la URL de conexión');
      }
    } catch (error) {
      console.error('Error connecting to Stripe:', error);
      toast.error('Error al conectar con Stripe. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTestUrl = () => {
    if (testStripeUrl.trim()) {
      window.open(testStripeUrl.trim(), '_blank');
    } else {
      toast.error('Por favor introduce un enlace válido');
    }
  };

  const handleStripeLoginLink = async () => {
    setLoading(true);
    try {
      if (!club?.id) {
        toast.error('Debes tener un club creado para acceder al panel de Stripe');
        return;
      }

      const { data, error } = await supabase.functions.invoke('stripe-login-link', {
        body: { clubId: club.id }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No se pudo acceder al panel de Stripe');
      }
    } catch (error) {
      console.error('Error accessing Stripe dashboard:', error);
      toast.error('Error al acceder al panel de Stripe. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const isStripeConnected = club?.stripe_account_id && club?.stripe_onboarding_completed;

  // Update editedProfile when profile changes
  React.useEffect(() => {
    if (profile && user) {
      setEditedProfile({
        full_name: profile.full_name || '',
        email: user.email || '',
        phone: profile.phone || '',
        level: profile.level?.toString() || '',
      });
    }
  }, [profile, user]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editedProfile.full_name,
          phone: editedProfile.phone,
          level: parseFloat(editedProfile.level) || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile?.id);

      if (error) throw error;

      toast.success('Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Sesión cerrada correctamente');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Error al cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Player, Trainer and Guardian view - show profile information without admin features
  if (isPlayer || isTrainer || isGuardian) {
    return (
      <div className="min-h-screen overflow-y-auto flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6">
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Configuración
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Administra tu información personal
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Información Personal Card */}
          <Card className="border-0 shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl bg-white">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-800">
                  <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
                  Información Personal
                </CardTitle>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="w-full sm:w-auto">
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={() => setIsEditing(false)} variant="outline" size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm">
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={loading} size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm">
                      {loading ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-4 sm:space-y-5">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="full_name" className="text-xs sm:text-sm font-medium">
                    Nombre Completo
                  </Label>
                  {isEditing ? (
                    <Input
                      id="full_name"
                      value={editedProfile.full_name}
                      onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                      placeholder="Tu nombre completo"
                      className="text-sm h-9 sm:h-10"
                    />
                  ) : (
                    <p className="text-sm sm:text-base">{profile?.full_name || 'No especificado'}</p>
                  )}
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm font-medium">
                    Email
                  </Label>
                  <p className="text-sm sm:text-base text-muted-foreground truncate">{user?.email || 'No especificado'}</p>
                  <p className="text-xs text-muted-foreground">
                    El email no se puede cambiar desde aquí
                  </p>
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="phone" className="text-xs sm:text-sm font-medium">
                    Teléfono
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={editedProfile.phone}
                      onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                      placeholder="Tu número de teléfono"
                      className="text-sm h-9 sm:h-10"
                    />
                  ) : (
                    <p className="text-sm sm:text-base">{profile?.phone || 'No especificado'}</p>
                  )}
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="level" className="text-xs sm:text-sm font-medium">
                    Nivel de Juego (Playtomic)
                  </Label>
                  {isEditing ? (
                    <Input
                      id="level"
                      type="text"
                      inputMode="decimal"
                      value={editedProfile.level}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setEditedProfile({ ...editedProfile, level: value });
                        }
                      }}
                      placeholder="Ej: 3.5"
                      className="text-sm h-9 sm:h-10"
                    />
                  ) : (
                    <p className="text-sm sm:text-base">{profile?.level || 'No especificado'}</p>
                  )}
                  {isEditing && (
                    <p className="text-xs text-muted-foreground">
                      Introduce tu nivel entre 1.0 y 10.0
                    </p>
                  )}
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-xs sm:text-sm font-medium">
                    Club
                  </Label>
                  <p className="text-sm sm:text-base truncate">{userClub?.name || 'No asignado'}</p>
                  <p className="text-xs text-muted-foreground">
                    Contacta al administrador para cambiar de club
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Change Section */}
          <PasswordChangeSection
            canChangePassword={canChangePassword(user)}
            authProviderMessage={getAuthProviderMessage(user)}
          />
        </div>

        {/* Logout Section */}
        <div className="pt-4 border-t border-gray-200">
          <Button
            onClick={handleLogout}
            disabled={loading}
            variant="destructive"
            className="w-full sm:w-auto"
            size="default"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {loading ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </Button>
        </div>
      </div>
    );
  }

  // Admin view - full configuration
  return (
    <div className="min-h-screen overflow-y-auto flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6">
      <div className="space-y-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
          Configuración
        </h1>
        <p className="text-sm sm:text-base text-gray-500">
          Gestiona la configuración de tu club
        </p>
      </div>

      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-4 sm:mb-6 md:mb-8">

        <Tabs defaultValue="general" className="space-y-3 sm:space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general" className="text-xs sm:text-sm">General</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm">Pagos</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-3 sm:space-y-4 md:space-y-6">
            {!club ? (
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                    Club Requerido
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Necesitas crear un club antes de poder configurar los pagos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                  <Button
                    onClick={() => window.location.href = '/clubs/new'}
                    className="w-full text-sm"
                    size="sm"
                  >
                    Crear Club
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                    Conecta tu cuenta de Stripe
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Para poder cobrar a tus jugadores directamente en tu cuenta bancaria,
                    conecta tu Stripe con nuestra plataforma. Es rápido y seguro.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0 sm:pt-0">
                  <div className="space-y-3 sm:space-y-4 mb-3 sm:mb-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium mb-2 block">
                        Seleccionar Club:
                      </label>
                      <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                        <SelectTrigger className="text-xs sm:text-sm h-9 sm:h-10">
                          <SelectValue placeholder="Selecciona un club" />
                        </SelectTrigger>
                        <SelectContent>
                          {clubs?.map((clubOption) => (
                            <SelectItem key={clubOption.id} value={clubOption.id}>
                              {clubOption.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {club && (
                      <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-blue-800 text-xs sm:text-sm">
                          <strong>Club seleccionado:</strong> {club.name}
                        </p>
                      </div>
                    )}
                  </div>

                  {!isStripeConnected ? (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-2 sm:space-y-3">
                        <Label htmlFor="test-stripe-url" className="text-xs sm:text-sm font-medium">
                          Enlace de prueba de Stripe Connect (temporal)
                        </Label>
                        <Input
                          id="test-stripe-url"
                          type="url"
                          placeholder="https://connect.stripe.com/d/setup/s/..."
                          value={testStripeUrl}
                          onChange={(e) => setTestStripeUrl(e.target.value)}
                          className="w-full text-xs sm:text-sm h-9 sm:h-10"
                        />
                        <p className="text-xs text-muted-foreground">
                          Introduce aquí el enlace de configuración de prueba que te ha proporcionado Stripe para continuar con la configuración.
                        </p>
                      </div>

                      {testStripeUrl.trim() && (
                        <Button
                          onClick={handleUseTestUrl}
                          size="sm"
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-xs sm:text-sm"
                        >
                          <ExternalLink className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          Usar enlace de prueba
                        </Button>
                      )}

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            O usar configuración automática
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={handleConnectStripe}
                        disabled={loading}
                        size="sm"
                        variant="outline"
                        className="w-full text-xs sm:text-sm"
                      >
                        <CreditCard className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">{loading ? 'Conectando...' : 'Conectar con Stripe (requiere cuenta completa)'}</span>
                        <span className="sm:hidden">{loading ? 'Conectando...' : 'Conectar con Stripe'}</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2 p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                        <span className="text-green-800 font-medium text-xs sm:text-sm">
                          Tu cuenta Stripe está conectada correctamente
                        </span>
                      </div>

                      <Button
                        onClick={handleStripeLoginLink}
                        disabled={loading}
                        variant="outline"
                        className="w-full text-xs sm:text-sm"
                        size="sm"
                      >
                        <ExternalLink className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        {loading ? 'Accediendo...' : 'Revisar tu cuenta en Stripe'}
                      </Button>
                    </div>
                  )}

                  {club && (
                    <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-secondary/30 rounded-lg">
                      <h4 className="font-medium text-xs sm:text-sm mb-2">Estado de la cuenta:</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs sm:text-sm text-muted-foreground">Estado:</span>
                          <Badge variant={isStripeConnected ? "default" : "secondary"} className="text-xs">
                            {club.stripe_account_status || 'Desconectado'}
                          </Badge>
                        </div>
                        {club.stripe_account_id && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">ID de cuenta:</span>
                            <code className="text-xs bg-background px-2 py-1 rounded truncate max-w-[200px]">
                              {club.stripe_account_id}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="general" className="space-y-3 sm:space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Información Personal Card */}
              <Card className="border-0 shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl bg-white">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-800">
                      <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
                      Información Personal
                    </CardTitle>
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="w-full sm:w-auto">
                        Editar
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={() => setIsEditing(false)} variant="outline" size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm">
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveProfile} disabled={loading} size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm">
                          {loading ? 'Guardando...' : 'Guardar'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-4 sm:space-y-5">
                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="admin_full_name" className="text-xs sm:text-sm font-medium">
                        Nombre Completo
                      </Label>
                      {isEditing ? (
                        <Input
                          id="admin_full_name"
                          value={editedProfile.full_name}
                          onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                          placeholder="Tu nombre completo"
                          className="text-sm h-9 sm:h-10"
                        />
                      ) : (
                        <p className="text-sm sm:text-base">{profile?.full_name || 'No especificado'}</p>
                      )}
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="admin_email" className="text-xs sm:text-sm font-medium">
                        Email
                      </Label>
                      <p className="text-sm sm:text-base text-muted-foreground truncate">{user?.email || 'No especificado'}</p>
                      <p className="text-xs text-muted-foreground">
                        El email no se puede cambiar desde aquí
                      </p>
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="admin_phone" className="text-xs sm:text-sm font-medium">
                        Teléfono
                      </Label>
                      {isEditing ? (
                        <Input
                          id="admin_phone"
                          value={editedProfile.phone}
                          onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                          placeholder="Tu número de teléfono"
                          className="text-sm h-9 sm:h-10"
                        />
                      ) : (
                        <p className="text-sm sm:text-base">{profile?.phone || 'No especificado'}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Password Change Section */}
              <PasswordChangeSection
                canChangePassword={canChangePassword(user)}
                authProviderMessage={getAuthProviderMessage(user)}
              />
            </div>

            {/* Logout Section */}
            <div className="pt-4 border-t border-gray-200">
              <Button
                onClick={handleLogout}
                disabled={loading}
                variant="destructive"
                className="w-full sm:w-auto"
                size="default"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {loading ? 'Cerrando sesión...' : 'Cerrar sesión'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;