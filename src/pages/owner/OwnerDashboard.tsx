/**
 * OwnerDashboard
 *
 * Panel de administración principal para owners del SaaS.
 *
 * IMPORTANTE: Esta es una página NUEVA que no afecta ninguna funcionalidad existente.
 * Solo accesible para usuarios con role = 'owner'
 */

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, GraduationCap, Calendar, UserCheck, DollarSign, Loader2, Activity } from "lucide-react";
import { useOwnerMetrics } from "@/hooks/useOwnerMetrics";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import OwnerLayout from "@/components/OwnerLayout";

export const OwnerDashboard = () => {
  const { profile } = useAuth();
  const { metrics, metricsLoading, clubs, clubsLoading, recentUsers, usersLoading } = useOwnerMetrics();

  // Función para formatear el rol
  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      owner: { label: "Owner", variant: "destructive" },
      admin: { label: "Admin", variant: "default" },
      club_admin: { label: "Club Admin", variant: "secondary" },
      trainer: { label: "Entrenador", variant: "outline" },
      player: { label: "Jugador", variant: "secondary" },
    };
    const config = roleConfig[role] || { label: role, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <OwnerLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Panel de Administración
        </h1>
        <p className="text-slate-600">
          Bienvenido, <span className="font-semibold">{profile?.full_name || profile?.email}</span>
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {/* Total Clubes */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Clubes
              </CardTitle>
              <Building2 className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            ) : (
              <div className="text-3xl font-bold text-slate-900">{metrics?.totalClubs || 0}</div>
            )}
            <p className="text-xs text-slate-500 mt-1">Clubes registrados</p>
          </CardContent>
        </Card>

        {/* Total Usuarios */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Usuarios
              </CardTitle>
              <Users className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            ) : (
              <div className="text-3xl font-bold text-slate-900">{metrics?.totalUsers || 0}</div>
            )}
            <p className="text-xs text-slate-500 mt-1">Usuarios activos</p>
          </CardContent>
        </Card>

        {/* Total Entrenadores */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                Entrenadores
              </CardTitle>
              <GraduationCap className="h-5 w-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            ) : (
              <div className="text-3xl font-bold text-slate-900">{metrics?.totalTrainers || 0}</div>
            )}
            <p className="text-xs text-slate-500 mt-1">Entrenadores activos</p>
          </CardContent>
        </Card>

        {/* Total Jugadores */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                Jugadores
              </CardTitle>
              <UserCheck className="h-5 w-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            ) : (
              <div className="text-3xl font-bold text-slate-900">{metrics?.totalPlayers || 0}</div>
            )}
            <p className="text-xs text-slate-500 mt-1">Jugadores registrados</p>
          </CardContent>
        </Card>

        {/* Clases Hoy */}
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                Clases Hoy
              </CardTitle>
              <Calendar className="h-5 w-5 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            ) : (
              <div className="text-3xl font-bold text-slate-900">{metrics?.classesToday || 0}</div>
            )}
            <p className="text-xs text-slate-500 mt-1">Clases programadas</p>
          </CardContent>
        </Card>

        {/* Enrollments Activos */}
        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                Enrollments
              </CardTitle>
              <Activity className="h-5 w-5 text-teal-500" />
            </div>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            ) : (
              <div className="text-3xl font-bold text-slate-900">{metrics?.activeEnrollments || 0}</div>
            )}
            <p className="text-xs text-slate-500 mt-1">Alumnos activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Clubes Activos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              Clubes Registrados
            </CardTitle>
            <CardDescription>
              Últimos clubes registrados en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clubsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : clubs && clubs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Registrado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clubs.map((club) => (
                    <TableRow key={club.id}>
                      <TableCell className="font-medium">{club.name}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDistanceToNow(new Date(club.created_at), { addSuffix: true, locale: es })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-slate-500 py-8">No hay clubes registrados</p>
            )}
          </CardContent>
        </Card>

        {/* Usuarios Recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              Usuarios Recientes
            </CardTitle>
            <CardDescription>
              Últimos usuarios registrados en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-500" />
              </div>
            ) : recentUsers && recentUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Registrado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name || "-"}</TableCell>
                      <TableCell className="text-sm text-slate-600">{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: es })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-slate-500 py-8">No hay usuarios registrados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Desglose de Usuarios por Rol */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-playtomic-orange" />
            Desglose de Usuarios por Rol
          </CardTitle>
          <CardDescription>
            Distribución de usuarios en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metricsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-playtomic-orange" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-slate-50 rounded-lg">
                <div className="text-4xl font-bold text-blue-600">{metrics?.totalAdmins || 0}</div>
                <p className="text-sm text-slate-600 mt-2">Administradores</p>
              </div>
              <div className="text-center p-6 bg-slate-50 rounded-lg">
                <div className="text-4xl font-bold text-orange-600">{metrics?.totalTrainers || 0}</div>
                <p className="text-sm text-slate-600 mt-2">Entrenadores</p>
              </div>
              <div className="text-center p-6 bg-slate-50 rounded-lg">
                <div className="text-4xl font-bold text-purple-600">{metrics?.totalPlayers || 0}</div>
                <p className="text-sm text-slate-600 mt-2">Jugadores</p>
              </div>
              <div className="text-center p-6 bg-slate-50 rounded-lg">
                <div className="text-4xl font-bold text-green-600">{metrics?.totalUsers || 0}</div>
                <p className="text-sm text-slate-600 mt-2">Total Usuarios</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer Note */}
      <div className="text-center text-sm text-slate-500 mt-8">
        <p>✅ Panel de Owner - Métricas en tiempo real activas</p>
        <p>Actualización automática cada 30 segundos</p>
      </div>
    </OwnerLayout>
  );
};

export default OwnerDashboard;
