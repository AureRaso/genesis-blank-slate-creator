/**
 * OwnerSettingsPage
 *
 * Página de configuración del owner.
 * Configuración de la cuenta, preferencias y ajustes del sistema.
 */

import { OwnerLayout } from "@/components/OwnerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { Settings, User, Bell, Shield, Palette, Database } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export const OwnerSettingsPage = () => {
  const { user, profile } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);

  const handleSaveNotifications = () => {
    toast({
      title: "Configuración guardada",
      description: "Tus preferencias de notificaciones han sido actualizadas",
    });
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Configuración</h1>
          <p className="text-slate-500 mt-1">
            Gestiona tu cuenta y preferencias del sistema
          </p>
        </div>

        {/* Información de la cuenta */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-playtomic-orange" />
              <CardTitle className="text-xl">Información de la Cuenta</CardTitle>
            </div>
            <CardDescription>
              Detalles de tu cuenta de owner
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-slate-50"
              />
              <p className="text-xs text-slate-500">
                Tu email no puede ser modificado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                type="text"
                defaultValue={profile?.full_name || ""}
                placeholder="Ingresa tu nombre completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Input
                id="role"
                type="text"
                value="Owner"
                disabled
                className="bg-slate-50"
              />
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button
                className="bg-playtomic-orange hover:bg-playtomic-orange/90"
                onClick={() =>
                  toast({
                    title: "Perfil actualizado",
                    description: "Tu información ha sido guardada correctamente",
                  })
                }
              >
                Guardar Cambios
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-xl">Notificaciones</CardTitle>
            </div>
            <CardDescription>
              Configura cómo quieres recibir notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="text-base">
                  Notificaciones por Email
                </Label>
                <p className="text-sm text-slate-500">
                  Recibe alertas importantes por correo electrónico
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-reports" className="text-base">
                  Reportes Semanales
                </Label>
                <p className="text-sm text-slate-500">
                  Resumen semanal de métricas y actividad
                </p>
              </div>
              <Switch
                id="weekly-reports"
                checked={weeklyReports}
                onCheckedChange={setWeeklyReports}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="system-alerts" className="text-base">
                  Alertas del Sistema
                </Label>
                <p className="text-sm text-slate-500">
                  Notificaciones sobre el estado del sistema
                </p>
              </div>
              <Switch
                id="system-alerts"
                checked={systemAlerts}
                onCheckedChange={setSystemAlerts}
              />
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSaveNotifications}
              >
                Guardar Preferencias
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Seguridad */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <CardTitle className="text-xl">Seguridad</CardTitle>
            </div>
            <CardDescription>
              Gestiona la seguridad de tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Cambiar Contraseña</Label>
              <p className="text-sm text-slate-500 mb-3">
                Para cambiar tu contraseña, usa la opción de recuperación en la página de inicio de sesión
              </p>
              <Button variant="outline">
                Solicitar Cambio de Contraseña
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Autenticación de Dos Factores</Label>
              <p className="text-sm text-slate-500 mb-3">
                Agrega una capa adicional de seguridad a tu cuenta
              </p>
              <Button variant="outline" disabled>
                Configurar 2FA (Próximamente)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Apariencia */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-xl">Apariencia</CardTitle>
            </div>
            <CardDescription>
              Personaliza la apariencia del panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tema</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button variant="outline" className="justify-start">
                  <span className="mr-2">☀️</span> Claro
                </Button>
                <Button variant="outline" className="justify-start" disabled>
                  <span className="mr-2">🌙</span> Oscuro
                </Button>
                <Button variant="outline" className="justify-start" disabled>
                  <span className="mr-2">🖥️</span> Sistema
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Temas oscuro y sistema disponibles próximamente
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Base de datos y respaldos */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-playtomic-orange" />
              <CardTitle className="text-xl">Base de Datos y Respaldos</CardTitle>
            </div>
            <CardDescription>
              Gestiona respaldos y exportaciones de datos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Exportar Datos</Label>
              <p className="text-sm text-slate-500 mb-3">
                Descarga una copia completa de todos los datos de la plataforma
              </p>
              <Button variant="outline">
                Exportar Base de Datos
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Respaldos Automáticos</Label>
              <p className="text-sm text-slate-500 mb-3">
                Los respaldos se realizan automáticamente cada 24 horas
              </p>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Shield className="h-4 w-4" />
                <span>Último respaldo: Hoy a las 03:00 AM</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zona de peligro */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-xl text-red-600">Zona de Peligro</CardTitle>
            <CardDescription>
              Acciones irreversibles que afectan a toda la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Restablecer Sistema</Label>
              <p className="text-sm text-slate-500 mb-3">
                Elimina TODOS los datos y restablece la plataforma a su estado inicial
              </p>
              <Button variant="destructive" disabled>
                Restablecer Sistema (Bloqueado)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
};

export default OwnerSettingsPage;
