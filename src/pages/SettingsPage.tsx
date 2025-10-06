import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useClubs } from '@/hooks/useClubs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, CreditCard, ExternalLink, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Extended club interface with Stripe properties
interface ClubWithStripe {
  id: string;
  name: string;
  stripe_account_id?: string | null;
  stripe_account_status?: string | null;
  stripe_onboarding_completed?: boolean | null;
}

const SettingsPage = () => {
  const { profile, isAdmin, isPlayer, user } = useAuth();
  const { data: clubs } = useClubs();
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

  // Player view - show profile information
  if (isPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Mi Perfil
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestiona tu información personal
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Información Personal
                </CardTitle>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={loading} size="sm">
                      {loading ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm font-medium">
                    Nombre Completo
                  </Label>
                  {isEditing ? (
                    <Input
                      id="full_name"
                      value={editedProfile.full_name}
                      onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                      placeholder="Tu nombre completo"
                    />
                  ) : (
                    <p className="text-base">{profile?.full_name || 'No especificado'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <p className="text-base text-muted-foreground">{user?.email || 'No especificado'}</p>
                  <p className="text-xs text-muted-foreground">
                    El email no se puede cambiar desde aquí
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Teléfono
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={editedProfile.phone}
                      onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                      placeholder="Tu número de teléfono"
                    />
                  ) : (
                    <p className="text-base">{profile?.phone || 'No especificado'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level" className="text-sm font-medium">
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
                    />
                  ) : (
                    <p className="text-base">{profile?.level || 'No especificado'}</p>
                  )}
                  {isEditing && (
                    <p className="text-xs text-muted-foreground">
                      Introduce tu nivel entre 1.0 y 10.0
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Club
                  </Label>
                  <p className="text-base">{userClub?.name || 'No asignado'}</p>
                  <p className="text-xs text-muted-foreground">
                    Contacta al administrador para cambiar de club
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Rol
                  </Label>
                  <Badge variant="secondary" className="capitalize">
                    {profile?.role === 'player' ? 'Jugador' : profile?.role}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Non-admin, non-player users (trainers) - restricted access
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Acceso Limitado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                La configuración avanzada solo está disponible para administradores.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Configuración
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona la configuración de tu club
          </p>
        </div>

        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-6">
            {!club ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Club Requerido
                  </CardTitle>
                  <CardDescription>
                    Necesitas crear un club antes de poder configurar los pagos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => window.location.href = '/clubs/new'}
                    className="w-full"
                  >
                    Crear Club
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Conecta tu cuenta de Stripe
                  </CardTitle>
                  <CardDescription>
                    Para poder cobrar a tus jugadores directamente en tu cuenta bancaria, 
                    conecta tu Stripe con nuestra plataforma. Es rápido y seguro.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4 mb-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Seleccionar Club:
                      </label>
                      <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                        <SelectTrigger>
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
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-blue-800 text-sm">
                          <strong>Club seleccionado:</strong> {club.name}
                        </p>
                      </div>
                    )}
                  </div>

                  {!isStripeConnected ? (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label htmlFor="test-stripe-url" className="text-sm font-medium">
                          Enlace de prueba de Stripe Connect (temporal)
                        </Label>
                        <Input
                          id="test-stripe-url"
                          type="url"
                          placeholder="https://connect.stripe.com/d/setup/s/..."
                          value={testStripeUrl}
                          onChange={(e) => setTestStripeUrl(e.target.value)}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Introduce aquí el enlace de configuración de prueba que te ha proporcionado Stripe para continuar con la configuración.
                        </p>
                      </div>

                      {testStripeUrl.trim() && (
                        <Button 
                          onClick={handleUseTestUrl}
                          size="lg"
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          <ExternalLink className="mr-2 h-5 w-5" />
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
                        size="lg"
                        variant="outline"
                        className="w-full"
                      >
                        <CreditCard className="mr-2 h-5 w-5" />
                        {loading ? 'Conectando...' : 'Conectar con Stripe (requiere cuenta completa)'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-800 font-medium">
                          Tu cuenta Stripe está conectada correctamente
                        </span>
                      </div>
                      
                      <Button
                        onClick={handleStripeLoginLink}
                        disabled={loading}
                        variant="outline"
                        className="w-full"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {loading ? 'Accediendo...' : 'Revisar tu cuenta en Stripe'}
                      </Button>
                    </div>
                  )}

                  {club && (
                    <div className="mt-6 p-4 bg-secondary/30 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Estado de la cuenta:</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Estado:</span>
                          <Badge variant={isStripeConnected ? "default" : "secondary"}>
                            {club.stripe_account_status || 'Desconectado'}
                          </Badge>
                        </div>
                        {club.stripe_account_id && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">ID de cuenta:</span>
                            <code className="text-xs bg-background px-2 py-1 rounded">
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

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración General</CardTitle>
                <CardDescription>
                  Próximamente podrás configurar otros aspectos de tu club aquí.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Esta sección estará disponible en futuras actualizaciones.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;