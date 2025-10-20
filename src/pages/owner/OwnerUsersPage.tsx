/**
 * OwnerUsersPage
 *
 * Página de gestión de usuarios para el owner.
 * Muestra lista de todos los usuarios con filtros por rol, búsqueda y estadísticas.
 */

import { useState } from "react";
import { OwnerLayout } from "@/components/OwnerLayout";
import { useUsersManagement } from "@/hooks/useUsersManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, GraduationCap, UserCog, Crown, Search, TrendingUp, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const OwnerUsersPage = () => {
  const { users, usersLoading, stats, statsLoading } = useUsersManagement();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Filtrar usuarios por término de búsqueda y rol
  const filteredUsers = users
    .filter((user) => {
      const matchesSearch =
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "player":
        return <Badge className="bg-blue-500">Jugador</Badge>;
      case "trainer":
        return <Badge className="bg-green-500">Entrenador</Badge>;
      case "admin":
      case "club_admin":
        return <Badge className="bg-purple-500">Admin</Badge>;
      case "owner":
        return <Badge className="bg-playtomic-orange">Owner</Badge>;
      default:
        return <Badge className="bg-slate-500">{role}</Badge>;
    }
  };

  const getRoleIcon = (iconClass: string) => {
    return <div className={iconClass} />;
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestión de Usuarios</h1>
          <p className="text-slate-500 mt-1">
            Administra todos los usuarios de la plataforma por rol y club
          </p>
        </div>

        {/* Estadísticas generales */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-2/3 mb-2"></div>
                    <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="border-l-4 border-l-slate-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Usuarios</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {stats?.totalUsers || 0}
                    </p>
                  </div>
                  <Users className="h-10 w-10 text-slate-600/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Jugadores</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {stats?.totalPlayers || 0}
                    </p>
                  </div>
                  <Users className="h-10 w-10 text-blue-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Entrenadores</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {stats?.totalTrainers || 0}
                    </p>
                  </div>
                  <GraduationCap className="h-10 w-10 text-green-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Admins</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {stats?.totalAdmins || 0}
                    </p>
                  </div>
                  <UserCog className="h-10 w-10 text-purple-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-playtomic-orange">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Owners</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {stats?.totalOwners || 0}
                    </p>
                  </div>
                  <Crown className="h-10 w-10 text-playtomic-orange/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Nuevos (Mes)</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {stats?.newUsersThisMonth || 0}
                    </p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-emerald-500/30" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Filtrar Usuarios</CardTitle>
            <CardDescription>
              Busca por nombre o email y filtra por rol
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtro por rol */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="player">Jugadores</SelectItem>
                  <SelectItem value="trainer">Entrenadores</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="club_admin">Club Admins</SelectItem>
                  <SelectItem value="owner">Owners</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de usuarios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Todos los Usuarios</CardTitle>
            <CardDescription>
              {filteredUsers.length} {filteredUsers.length === 1 ? "usuario encontrado" : "usuarios encontrados"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange"></div>
                <span className="ml-3 text-slate-500">Cargando usuarios...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                {searchTerm || roleFilter !== "all"
                  ? "No se encontraron usuarios con esos filtros"
                  : "No hay usuarios registrados"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Club</TableHead>
                      <TableHead className="text-center">Nivel</TableHead>
                      <TableHead>Registrado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.full_name || <span className="text-slate-400">Sin nombre</span>}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          {user.club_name ? (
                            <span className="text-slate-700">{user.club_name}</span>
                          ) : (
                            <span className="text-slate-400">Sin club</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {user.level ? (
                            <Badge variant="outline" className="font-semibold">
                              {user.level}
                            </Badge>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {formatDistanceToNow(new Date(user.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nota comercial */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="text-blue-600 mt-0.5">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Uso Comercial</p>
                <p>
                  Esta vista te permite demostrar el crecimiento de usuarios, distribución por roles
                  y actividad en la plataforma. Perfecto para presentaciones a inversores mostrando
                  la tracción y engagement de tu SaaS.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
};

export default OwnerUsersPage;
