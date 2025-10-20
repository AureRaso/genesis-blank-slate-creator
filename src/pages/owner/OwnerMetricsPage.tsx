/**
 * OwnerMetricsPage
 *
 * Página de métricas avanzadas con gráficos profesionales para demostración comercial.
 * Incluye KPIs, tendencias y visualizaciones interactivas usando Recharts.
 */

import { useState } from "react";
import { OwnerLayout } from "@/components/OwnerLayout";
import { useAdvancedMetricsWithCharts } from "@/hooks/useAdvancedMetricsWithCharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Users, Building2, Calendar, Activity, GraduationCap } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type TimeRange = 3 | 6 | 12;

export const OwnerMetricsPage = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>(6);

  const {
    growthMetrics,
    growthLoading,
    engagementMetrics,
    engagementLoading,
    clubMetrics,
    clubLoading,
    userDistribution,
    userLoading,
  } = useAdvancedMetricsWithCharts(timeRange);

  const getTrendColor = (value: number | undefined) => {
    if (!value) return "text-slate-500";
    return value >= 0 ? "text-green-600" : "text-red-600";
  };

  const getTrendIcon = (value: number | undefined) => {
    if (!value) return null;
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4" />
    ) : (
      <TrendingDown className="h-4 w-4" />
    );
  };

  // Colores para gráficos
  const COLORS = {
    primary: "#FF5722", // playtomic-orange
    secondary: "#3B82F6", // blue-500
    tertiary: "#10B981", // green-500
    quaternary: "#8B5CF6", // purple-500
    quinary: "#F59E0B", // amber-500
  };

  const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.tertiary, COLORS.quaternary];

  // Datos para gráfico de roles
  const roleData = userDistribution
    ? [
        { name: "Jugadores", value: userDistribution.byRole.players, color: COLORS.secondary },
        { name: "Entrenadores", value: userDistribution.byRole.trainers, color: COLORS.tertiary },
        { name: "Admins", value: userDistribution.byRole.admins, color: COLORS.quaternary },
        { name: "Owners", value: userDistribution.byRole.owners, color: COLORS.primary },
      ]
    : [];

  // Datos para gráfico de niveles
  const levelData = userDistribution
    ? [
        { name: "Principiante", value: userDistribution.byLevel.beginner, fill: COLORS.secondary },
        { name: "Intermedio", value: userDistribution.byLevel.intermediate, fill: COLORS.tertiary },
        { name: "Avanzado", value: userDistribution.byLevel.advanced, fill: COLORS.primary },
      ]
    : [];

  // Datos para gráfico de tamaño de clubes
  const clubSizeData = clubMetrics
    ? [
        { name: "Pequeños (<20)", value: clubMetrics.clubsBySize.small, fill: COLORS.secondary },
        { name: "Medianos (20-50)", value: clubMetrics.clubsBySize.medium, fill: COLORS.tertiary },
        { name: "Grandes (50+)", value: clubMetrics.clubsBySize.large, fill: COLORS.primary },
      ]
    : [];

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Métricas Avanzadas</h1>
          <p className="text-slate-500 mt-1">
            Análisis profesional de rendimiento y crecimiento de la plataforma
          </p>
        </div>

        {/* KPIs de Crecimiento */}
        {growthLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-playtomic-orange">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Nuevos Usuarios</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {growthMetrics?.currentMonth.newUsers || 0}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`flex items-center gap-1 text-sm font-semibold ${getTrendColor(growthMetrics?.growth.usersGrowth)}`}>
                        {getTrendIcon(growthMetrics?.growth.usersGrowth)}
                        {Math.abs(growthMetrics?.growth.usersGrowth || 0)}%
                      </span>
                      <span className="text-xs text-slate-500">
                        vs mes anterior ({growthMetrics?.lastMonth.newUsers || 0})
                      </span>
                    </div>
                  </div>
                  <Users className="h-10 w-10 text-playtomic-orange/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Nuevos Clubes</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {growthMetrics?.currentMonth.newClubs || 0}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`flex items-center gap-1 text-sm font-semibold ${getTrendColor(growthMetrics?.growth.clubsGrowth)}`}>
                        {getTrendIcon(growthMetrics?.growth.clubsGrowth)}
                        {Math.abs(growthMetrics?.growth.clubsGrowth || 0)}%
                      </span>
                      <span className="text-xs text-slate-500">
                        vs mes anterior ({growthMetrics?.lastMonth.newClubs || 0})
                      </span>
                    </div>
                  </div>
                  <Building2 className="h-10 w-10 text-blue-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Nuevas Clases</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {growthMetrics?.currentMonth.newClasses || 0}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`flex items-center gap-1 text-sm font-semibold ${getTrendColor(growthMetrics?.growth.classesGrowth)}`}>
                        {getTrendIcon(growthMetrics?.growth.classesGrowth)}
                        {Math.abs(growthMetrics?.growth.classesGrowth || 0)}%
                      </span>
                      <span className="text-xs text-slate-500">
                        vs mes anterior ({growthMetrics?.lastMonth.newClasses || 0})
                      </span>
                    </div>
                  </div>
                  <Calendar className="h-10 w-10 text-green-500/30" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráfico de Tendencia Mensual */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Tendencia de Crecimiento (Últimos {timeRange} Meses)</CardTitle>
                <CardDescription>
                  Evolución de usuarios, clubes y clases programadas mensuales
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={timeRange === 3 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(3)}
                  className={timeRange === 3 ? "bg-playtomic-orange hover:bg-orange-600" : ""}
                >
                  3M
                </Button>
                <Button
                  variant={timeRange === 6 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(6)}
                  className={timeRange === 6 ? "bg-playtomic-orange hover:bg-orange-600" : ""}
                >
                  6M
                </Button>
                <Button
                  variant={timeRange === 12 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(12)}
                  className={timeRange === 12 ? "bg-playtomic-orange hover:bg-orange-600" : ""}
                >
                  12M
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {growthLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={growthMetrics?.monthlyTrend || []}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorClubs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorClasses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.tertiary} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS.tertiary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke={COLORS.primary}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                    name="Usuarios"
                  />
                  <Area
                    type="monotone"
                    dataKey="clubs"
                    stroke={COLORS.secondary}
                    fillOpacity={1}
                    fill="url(#colorClubs)"
                    name="Clubes"
                  />
                  <Area
                    type="monotone"
                    dataKey="classes"
                    stroke={COLORS.tertiary}
                    fillOpacity={1}
                    fill="url(#colorClasses)"
                    name="Clases"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Engagement y Actividad */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Actividad Semanal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Actividad Semanal</CardTitle>
              <CardDescription>Clases y participantes por semana</CardDescription>
            </CardHeader>
            <CardContent>
              {engagementLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={engagementMetrics?.weeklyActivity || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="week" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="classes" fill={COLORS.primary} name="Clases" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="participants" fill={COLORS.secondary} name="Participantes" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Distribución de Usuarios por Rol */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Distribución por Rol</CardTitle>
              <CardDescription>Porcentaje de usuarios por rol</CardDescription>
            </CardHeader>
            <CardContent>
              {userLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Distribución de Usuarios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Por Rol */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                Distribución por Rol
              </CardTitle>
              <CardDescription>Tipos de usuarios en la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              {userLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-slate-900">Jugadores</span>
                    <span className="text-xl font-bold text-blue-600">
                      {userDistribution?.byRole.players || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-slate-900">Entrenadores</span>
                    <span className="text-xl font-bold text-green-600">
                      {userDistribution?.byRole.trainers || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium text-slate-900">Administradores</span>
                    <span className="text-xl font-bold text-purple-600">
                      {userDistribution?.byRole.admins || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium text-slate-900">Owners</span>
                    <span className="text-xl font-bold text-orange-600">
                      {userDistribution?.byRole.owners || 0}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Por Nivel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-500" />
                Distribución por Nivel
              </CardTitle>
              <CardDescription>Niveles de los jugadores activos</CardDescription>
            </CardHeader>
            <CardContent>
              {userLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">Principiantes</p>
                      <p className="text-xs text-slate-500">Niveles 1.0-3.9</p>
                    </div>
                    <span className="text-xl font-bold text-green-600">
                      {userDistribution?.byLevel.beginner || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">Intermedios</p>
                      <p className="text-xs text-slate-500">Niveles 4.0-6.9</p>
                    </div>
                    <span className="text-xl font-bold text-blue-600">
                      {userDistribution?.byLevel.intermediate || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">Avanzados</p>
                      <p className="text-xs text-slate-500">Niveles 7.0+</p>
                    </div>
                    <span className="text-xl font-bold text-orange-600">
                      {userDistribution?.byLevel.advanced || 0}
                    </span>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-600">Total Activos</p>
                      <p className="text-xl font-bold text-playtomic-orange">
                        {userDistribution?.totalActive || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Clubes y Distribución por tamaño */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribución de Clubes por Tamaño */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                Distribución de Clubes
              </CardTitle>
              <CardDescription>Clasificación por número de jugadores</CardDescription>
            </CardHeader>
            <CardContent>
              {clubLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-900">Pequeños (&lt; 20)</p>
                      <p className="text-sm text-slate-600">Ideal para empezar</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {clubMetrics?.clubsBySize.small || 0}
                      </p>
                      <p className="text-xs text-slate-500">clubes</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-900">Medianos (20-50)</p>
                      <p className="text-sm text-slate-600">En crecimiento</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {clubMetrics?.clubsBySize.medium || 0}
                      </p>
                      <p className="text-xs text-slate-500">clubes</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-900">Grandes (&gt; 50)</p>
                      <p className="text-sm text-slate-600">Consolidados</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">
                        {clubMetrics?.clubsBySize.large || 0}
                      </p>
                      <p className="text-xs text-slate-500">clubes</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-600">Total Activos</p>
                      <p className="text-xl font-bold text-playtomic-orange">
                        {clubMetrics?.activeClubs || 0} / {clubMetrics?.totalClubs || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top 5 Clubes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <svg className="h-5 w-5 text-playtomic-orange" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Top 5 Clubes
              </CardTitle>
              <CardDescription>Por número de jugadores activos</CardDescription>
            </CardHeader>
            <CardContent>
              {clubLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange"></div>
                </div>
              ) : clubMetrics?.topClubs && clubMetrics.topClubs.length > 0 ? (
                <div className="space-y-3">
                  {clubMetrics.topClubs.map((club, index) => (
                    <div key={club.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-slate-400' :
                        index === 2 ? 'bg-orange-600' : 'bg-slate-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{club.name}</p>
                        <p className="text-xs text-slate-500">{club.classesCount} clases programadas</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-playtomic-orange">{club.studentsCount}</p>
                        <p className="text-xs text-slate-500">jugadores</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">No hay datos disponibles</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Distribución de Niveles y Clubes (Gráficos) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribución por Nivel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Distribución por Nivel</CardTitle>
              <CardDescription>Jugadores clasificados por habilidad</CardDescription>
            </CardHeader>
            <CardContent>
              {userLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={levelData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" stroke="#64748B" />
                    <YAxis dataKey="name" type="category" stroke="#64748B" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" fill={COLORS.primary} radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Distribución de Clubes por Tamaño */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Clubes por Tamaño</CardTitle>
              <CardDescription>Clasificación según número de estudiantes</CardDescription>
            </CardHeader>
            <CardContent>
              {clubLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={clubSizeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" fill={COLORS.tertiary} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Métricas de Engagement */}
        {!engagementLoading && engagementMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Clases</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">
                      {engagementMetrics.totalClasses}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Participantes</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">
                      {engagementMetrics.totalParticipants}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Tamaño Promedio</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">
                      {engagementMetrics.averageClassSize}
                    </p>
                  </div>
                  <GraduationCap className="h-8 w-8 text-amber-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Tasa Asistencia</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">
                      {engagementMetrics.classAttendanceRate}%
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-playtomic-orange">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Usuarios Activos</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">
                      {engagementMetrics.activeUsersLast30Days}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-playtomic-orange/30" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
                  Estos gráficos profesionales están diseñados para demostrar el crecimiento, engagement
                  y escalabilidad de tu plataforma. Perfectos para presentaciones a inversores, patrocinadores
                  o nuevos clubes potenciales. Todas las métricas se actualizan en tiempo real.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
};

export default OwnerMetricsPage;
