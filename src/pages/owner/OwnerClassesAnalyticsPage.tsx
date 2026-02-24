/**
 * OwnerClassesAnalyticsPage
 *
 * Página de análisis del módulo "Clases Disponibles" con datos de uso
 * a nivel global (todos los clubes). Diseñada para monitoreo interno
 * y demos comerciales a clientes potenciales.
 *
 * IMPORTANTE: Esta página solo es accesible para rol owner.
 */

import { OwnerLayout } from "@/components/OwnerLayout";
import { useOwnerClassesAnalytics } from "@/hooks/useOwnerClassesAnalytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Users,
  Calendar,
  Building2,
  UserCheck,
  AlertCircle,
  TrendingUp,
  Clock,
  Loader2,
  BookOpen,
  ListChecks,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = {
  primary: "#FF5722",
  secondary: "#3B82F6",
  tertiary: "#10B981",
  quaternary: "#8B5CF6",
  quinary: "#F59E0B",
};

const PIE_COLORS = [COLORS.tertiary, COLORS.primary, COLORS.quinary, COLORS.quaternary];

const getTierBadge = (tier: string) => {
  const config: Record<string, { className: string }> = {
    "Power User": { className: "bg-green-100 text-green-800 border-green-200" },
    Activo: { className: "bg-blue-100 text-blue-800 border-blue-200" },
    Moderado: { className: "bg-amber-100 text-amber-800 border-amber-200" },
    Bajo: { className: "bg-slate-100 text-slate-600 border-slate-200" },
  };
  const c = config[tier] || config["Bajo"];
  return <Badge className={c.className}>{tier}</Badge>;
};

const OwnerClassesAnalyticsPage = () => {
  const {
    globalKPIs,
    kpisLoading,
    clubUsageRanking,
    rankingLoading,
    waitlistDistribution,
    waitlistLoading,
    featureAdoption,
    adoptionLoading,
  } = useOwnerClassesAnalytics();

  // --- Chart Data Transformations ---

  const top10ClassesData = (clubUsageRanking || []).slice(0, 10).map((c) => ({
    name: c.clubName.length > 18 ? c.clubName.slice(0, 18) + "..." : c.clubName,
    totalClasses: c.totalClasses,
  }));

  const top10StudentsData = [...(clubUsageRanking || [])]
    .sort((a, b) => b.uniqueStudents - a.uniqueStudents)
    .slice(0, 10)
    .map((c) => ({
      name: c.clubName.length > 18 ? c.clubName.slice(0, 18) + "..." : c.clubName,
      uniqueStudents: c.uniqueStudents,
    }));

  const waitlistPieData = waitlistDistribution
    ? [
        { name: "Aceptados", value: waitlistDistribution.accepted },
        { name: "Rechazados", value: waitlistDistribution.rejected },
        { name: "Pendientes", value: waitlistDistribution.pending },
        { name: "Expirados", value: waitlistDistribution.expired },
      ].filter((d) => d.value > 0)
    : [];

  const adoptionData = featureAdoption
    ? [
        {
          name: "Lista de espera",
          percentage:
            featureAdoption.totalClubs > 0
              ? Math.round((featureAdoption.clubsWithWaitlist / featureAdoption.totalClubs) * 100)
              : 0,
        },
        {
          name: "Clases abiertas",
          percentage:
            featureAdoption.totalClubs > 0
              ? Math.round(
                  (featureAdoption.clubsWithOpenClasses / featureAdoption.totalClubs) * 100
                )
              : 0,
        },
        {
          name: "Multi-entrenadores",
          percentage:
            featureAdoption.totalClubs > 0
              ? Math.round(
                  (featureAdoption.clubsWithMultiTrainers / featureAdoption.totalClubs) * 100
                )
              : 0,
        },
      ]
    : [];

  // --- Insights ---

  const internalPercentage =
    globalKPIs && globalKPIs.activeClasses > 0
      ? (
          ((globalKPIs.activeClasses - globalKPIs.openClasses) / globalKPIs.activeClasses) *
          100
        ).toFixed(1)
      : "0";

  const totalWaitlistByClub = (clubUsageRanking || [])
    .map((c) => ({
      name: c.clubName,
      total: c.waitlistAccepted + c.waitlistRejected + c.waitlistPending + c.waitlistExpired,
    }))
    .sort((a, b) => b.total - a.total);
  const totalAllWaitlist = totalWaitlistByClub.reduce((sum, c) => sum + c.total, 0);
  const top3WaitlistSum = totalWaitlistByClub.slice(0, 3).reduce((sum, c) => sum + c.total, 0);
  const topWaitlistPercentage =
    totalAllWaitlist > 0 ? Math.round((top3WaitlistSum / totalAllWaitlist) * 100) : 0;

  const pendingClubsCount = (clubUsageRanking || []).filter((c) => c.waitlistPending > 0).length;

  const avgEnrollmentsPerClass =
    globalKPIs && globalKPIs.activeClasses > 0
      ? (globalKPIs.totalEnrollments / globalKPIs.activeClasses).toFixed(1)
      : "0";

  // --- Loading skeleton ---
  const KPISkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-2/3 mb-3"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-playtomic-orange" />
            Análisis de Clases Disponibles
          </h1>
          <p className="text-slate-500 mt-1">
            Uso del módulo de clases programadas en toda la plataforma — datos en tiempo real
          </p>
        </div>

        {/* Section 1: Global KPI Cards */}
        {kpisLoading ? (
          <KPISkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-playtomic-orange">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Clases</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {(globalKPIs?.totalClasses || 0).toLocaleString()}
                    </p>
                  </div>
                  <Calendar className="h-10 w-10 text-playtomic-orange/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Clases Activas</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {(globalKPIs?.activeClasses || 0).toLocaleString()}
                    </p>
                  </div>
                  <ListChecks className="h-10 w-10 text-green-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Alumnos Únicos</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {(globalKPIs?.uniqueStudents || 0).toLocaleString()}
                    </p>
                  </div>
                  <Users className="h-10 w-10 text-blue-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Inscripciones</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {(globalKPIs?.totalEnrollments || 0).toLocaleString()}
                    </p>
                  </div>
                  <UserCheck className="h-10 w-10 text-purple-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Solicitudes Waitlist</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {(globalKPIs?.totalWaitlistRequests || 0).toLocaleString()}
                    </p>
                  </div>
                  <Clock className="h-10 w-10 text-amber-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-teal-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Clubes Usando Módulo</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {globalKPIs?.clubsUsingModule || 0}
                    </p>
                  </div>
                  <Building2 className="h-10 w-10 text-teal-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-indigo-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Capacidad Media</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {globalKPIs?.averageCapacity || 0}
                    </p>
                    <p className="text-xs text-slate-400">plazas/clase</p>
                  </div>
                  <BarChart3 className="h-10 w-10 text-indigo-500/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-rose-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Clases Abiertas</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {globalKPIs?.openClasses || 0}
                    </p>
                    <p className="text-xs text-slate-400">auto-inscripción</p>
                  </div>
                  <BookOpen className="h-10 w-10 text-rose-500/30" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Section 2: Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Top 10 Clubs by Classes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top 10 Clubes por Clases</CardTitle>
              <CardDescription>
                Clubes con mayor número de clases programadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rankingLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-playtomic-orange" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={top10ClassesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748B"
                      angle={-45}
                      textAnchor="end"
                      height={90}
                      fontSize={11}
                    />
                    <YAxis stroke="#64748B" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="totalClasses"
                      fill={COLORS.primary}
                      name="Clases"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Chart 2: Waitlist Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribución de Waitlist</CardTitle>
              <CardDescription>
                Estado de todas las solicitudes de lista de espera
              </CardDescription>
            </CardHeader>
            <CardContent>
              {waitlistLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-playtomic-orange" />
                </div>
              ) : waitlistPieData.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-slate-400">
                  Sin datos de waitlist
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={waitlistPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      dataKey="value"
                    >
                      {waitlistPieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Chart 3: Top 10 Clubs by Students */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top 10 Clubes por Alumnos</CardTitle>
              <CardDescription>
                Clubes con mayor número de alumnos únicos inscritos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rankingLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-playtomic-orange" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={top10StudentsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748B"
                      angle={-45}
                      textAnchor="end"
                      height={90}
                      fontSize={11}
                    />
                    <YAxis stroke="#64748B" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="uniqueStudents"
                      fill={COLORS.secondary}
                      name="Alumnos"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Chart 4: Feature Adoption */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Adopción de Funcionalidades</CardTitle>
              <CardDescription>
                Porcentaje de clubes usando cada característica avanzada
              </CardDescription>
            </CardHeader>
            <CardContent>
              {adoptionLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-playtomic-orange" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={adoptionData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      type="number"
                      stroke="#64748B"
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#64748B"
                      width={130}
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                      }}
                      formatter={(v: number) => `${v}%`}
                    />
                    <Bar
                      dataKey="percentage"
                      fill={COLORS.tertiary}
                      name="Adopción"
                      radius={[0, 8, 8, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Section 3: Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Gestión Interna</p>
                  <p>
                    El {internalPercentage}% de las clases son gestionadas internamente
                    (no abiertas para auto-inscripción de jugadores).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-6">
              <div className="flex gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Concentración de Waitlist</p>
                  <p>
                    Los 3 clubes principales manejan el {topWaitlistPercentage}% de todas
                    las solicitudes de lista de espera.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-6">
              <div className="flex gap-3">
                <Clock className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-1">Pendientes sin Gestionar</p>
                  <p>
                    {pendingClubsCount} club{pendingClubsCount !== 1 ? "es" : ""} tienen
                    solicitudes de waitlist pendientes sin gestionar.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-6">
              <div className="flex gap-3">
                <UserCheck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-800">
                  <p className="font-semibold mb-1">Ratio de Inscripciones</p>
                  <p>
                    Media de {avgEnrollmentsPerClass} inscripciones por clase activa en toda
                    la plataforma.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 4: Club Usage Ranking Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              Ranking de Uso por Club
            </CardTitle>
            <CardDescription>
              Detalle completo del uso del módulo por cada club — ordenado por número de clases
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rankingLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-playtomic-orange" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Club</TableHead>
                      <TableHead className="text-center">Clases (Act/Total)</TableHead>
                      <TableHead className="text-center">Abiertas</TableHead>
                      <TableHead className="text-center">Alumnos</TableHead>
                      <TableHead className="text-center">Inscripciones</TableHead>
                      <TableHead className="text-center min-w-[150px]">Waitlist</TableHead>
                      <TableHead className="text-center">Trainers</TableHead>
                      <TableHead className="min-w-[180px]">Periodo</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(clubUsageRanking || []).map((club) => (
                      <TableRow key={club.clubId}>
                        <TableCell className="font-semibold">{club.clubName}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-green-600 font-medium">
                            {club.activeClasses.toLocaleString()}
                          </span>
                          <span className="text-slate-400">
                            /{club.totalClasses.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {club.openClasses > 0 ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              {club.openClasses}
                            </Badge>
                          ) : (
                            <span className="text-slate-300">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {club.uniqueStudents.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          {club.totalEnrollments.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          {club.waitlistAccepted +
                            club.waitlistRejected +
                            club.waitlistPending +
                            club.waitlistExpired >
                          0 ? (
                            <div className="flex items-center justify-center gap-1 flex-wrap">
                              <span className="text-green-600">{club.waitlistAccepted}A</span>
                              <span className="text-slate-300">/</span>
                              <span className="text-red-600">{club.waitlistRejected}R</span>
                              <span className="text-slate-300">/</span>
                              <span className="text-amber-600 font-semibold">
                                {club.waitlistPending}P
                              </span>
                              <span className="text-slate-300">/</span>
                              <span className="text-slate-400">{club.waitlistExpired}E</span>
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{club.trainerCount}</TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {club.firstClassDate && club.lastClassDate
                            ? `${club.firstClassDate} — ${club.lastClassDate}`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-center">{getTierBadge(club.tier)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 5: Commercial Note */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="text-blue-600 mt-0.5 flex-shrink-0">
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
                  Este panel muestra el uso real del módulo de Clases Disponibles por parte de
                  los clubes. Ideal para demostrar el valor de la funcionalidad a clientes
                  potenciales y para identificar oportunidades de mejora en la adopción. Los
                  datos se actualizan en tiempo real.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
};

export default OwnerClassesAnalyticsPage;
