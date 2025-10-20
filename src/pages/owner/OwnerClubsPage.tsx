/**
 * OwnerClubsPage
 *
 * Página de gestión de clubes para el owner.
 * Muestra lista de clubes con métricas detalladas, búsqueda y filtros.
 */

import { useState } from "react";
import { OwnerLayout } from "@/components/OwnerLayout";
import { useClubsManagement } from "@/hooks/useClubsManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, GraduationCap, Calendar, Search, TrendingUp, Award } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const OwnerClubsPage = () => {
  const { clubs, clubsLoading, stats, statsLoading } = useClubsManagement();
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar clubes por término de búsqueda
  const filteredClubs = clubs.filter((club) =>
    club.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClubSizeBadge = (studentCount: number) => {
    if (studentCount >= 50) {
      return <Badge className="bg-green-500">Grande</Badge>;
    } else if (studentCount >= 20) {
      return <Badge className="bg-blue-500">Mediano</Badge>;
    } else {
      return <Badge className="bg-slate-500">Pequeño</Badge>;
    }
  };

  const getLevelDistributionText = (levelDistribution: { beginner: number; intermediate: number; advanced: number }) => {
    return `${levelDistribution.beginner}B / ${levelDistribution.intermediate}I / ${levelDistribution.advanced}A`;
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestión de Clubes</h1>
          <p className="text-slate-500 mt-1">
            Administra todos los clubes de la plataforma y visualiza métricas clave
          </p>
        </div>

        {/* Estadísticas generales */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-playtomic-orange">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Clubes</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {stats?.totalClubs || 0}
                    </p>
                  </div>
                  <Building2 className="h-10 w-10 text-playtomic-orange/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Jugadores</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {stats?.totalStudentsAcrossClubs || 0}
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
                    <p className="text-sm font-medium text-slate-500">Total Entrenadores</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {stats?.totalTrainersAcrossClubs || 0}
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
                    <p className="text-sm font-medium text-slate-500">Media Jugadores</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {stats?.averageStudentsPerClub || 0}
                    </p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-purple-500/30" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Club más activo */}
        {stats?.mostActiveClub && (
          <Card className="bg-gradient-to-r from-playtomic-orange/10 to-orange-600/10 border-playtomic-orange/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-playtomic-orange" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Club Más Activo</p>
                  <p className="text-xl font-bold text-slate-800">
                    {stats.mostActiveClub.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {stats.mostActiveClub.studentCount} jugadores activos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Buscar Clubes</CardTitle>
            <CardDescription>
              Filtra clubes por nombre
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre del club..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de clubes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Todos los Clubes</CardTitle>
            <CardDescription>
              {filteredClubs.length} {filteredClubs.length === 1 ? "club encontrado" : "clubes encontrados"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clubsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange"></div>
                <span className="ml-3 text-slate-500">Cargando clubes...</span>
              </div>
            ) : filteredClubs.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                {searchTerm ? "No se encontraron clubes con ese nombre" : "No hay clubes registrados"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Club</TableHead>
                      <TableHead>Tamaño</TableHead>
                      <TableHead className="text-center">Jugadores</TableHead>
                      <TableHead className="text-center">Entrenadores</TableHead>
                      <TableHead className="text-center">Clases (30d)</TableHead>
                      <TableHead className="text-center">Nuevos Este Mes</TableHead>
                      <TableHead className="text-center">Distribución Nivel</TableHead>
                      <TableHead>Registrado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClubs.map((club) => (
                      <TableRow key={club.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-playtomic-orange" />
                            {club.name}
                          </div>
                        </TableCell>
                        <TableCell>{getClubSizeBadge(club.totalStudents)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="font-semibold">{club.totalStudents}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <GraduationCap className="h-4 w-4 text-green-500" />
                            <span className="font-semibold">{club.totalTrainers}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Calendar className="h-4 w-4 text-purple-500" />
                            <span className="font-semibold">{club.totalClasses}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {club.studentsThisMonth > 0 ? (
                            <Badge className="bg-green-500">+{club.studentsThisMonth}</Badge>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-xs text-slate-600">
                            {getLevelDistributionText(club.levelDistribution)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {formatDistanceToNow(new Date(club.created_at), {
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
                  Esta vista te permite demostrar a nuevos clubes la cantidad de jugadores,
                  distribución por niveles y actividad general de tu plataforma. Ideal para
                  presentaciones a inversores o nuevos clientes potenciales.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
};

export default OwnerClubsPage;
