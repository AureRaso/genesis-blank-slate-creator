/**
 * OwnerAbsencesWaitlistPage
 *
 * Vista para owners: Ausencias y listas de espera de todos los clubes
 * para los próximos 10 días.
 *
 * IMPORTANTE: Esta página solo es accesible para rol owner.
 * No afecta ninguna funcionalidad existente.
 */

import { useState } from "react";
import OwnerLayout from "@/components/OwnerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, Users, Clock, UserMinus, UserPlus, Building2, ChevronDown, ChevronRight } from "lucide-react";
import { useOwnerAbsencesWaitlist, useClubsForFilter } from "@/hooks/useOwnerAbsencesWaitlist";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";

const OwnerAbsencesWaitlistPage = () => {
  const [selectedClubId, setSelectedClubId] = useState<string | undefined>(undefined);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const { data: daysData, isLoading, error } = useOwnerAbsencesWaitlist(10, selectedClubId);
  const { data: clubs } = useClubsForFilter();

  const toggleDay = (date: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  // Expandir automáticamente los días que tienen datos
  const isDayExpanded = (date: string, hasData: boolean) => {
    if (expandedDays.has(date)) return true;
    // Auto-expandir si tiene datos y no se ha tocado manualmente
    return hasData && !expandedDays.has(`collapsed-${date}`);
  };

  // Calcular totales globales
  const globalTotals = daysData?.reduce(
    (acc, day) => ({
      absences: acc.absences + day.totalAbsences,
      waitlistPending: acc.waitlistPending + day.totalWaitlistPending
    }),
    { absences: 0, waitlistPending: 0 }
  ) || { absences: 0, waitlistPending: 0 };

  return (
    <OwnerLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Ausencias y Listas de Espera
        </h1>
        <p className="text-slate-600">
          Vista consolidada de los próximos 10 días por club
        </p>
      </div>

      {/* Filtros y KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Filtro de club */}
        <Card>
          <CardContent className="pt-4">
            <label className="text-sm font-medium text-slate-600 mb-2 block">
              Filtrar por Club
            </label>
            <Select
              value={selectedClubId || "all"}
              onValueChange={(value) => setSelectedClubId(value === "all" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los clubes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clubes</SelectItem>
                {clubs?.map((club) => (
                  <SelectItem key={club.id} value={club.id}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* KPI: Total Ausencias */}
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Ausencias</p>
                <p className="text-3xl font-bold text-red-600">{globalTotals.absences}</p>
              </div>
              <UserMinus className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Próximos 10 días</p>
          </CardContent>
        </Card>

        {/* KPI: Waitlist Pendientes */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">En Lista de Espera</p>
                <p className="text-3xl font-bold text-amber-600">{globalTotals.waitlistPending}</p>
              </div>
              <UserPlus className="h-8 w-8 text-amber-500" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Solicitudes pendientes</p>
          </CardContent>
        </Card>

        {/* KPI: Clubes */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Clubes Activos</p>
                <p className="text-3xl font-bold text-blue-600">{clubs?.length || 0}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-slate-500 mt-1">En el sistema</p>
          </CardContent>
        </Card>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-playtomic-orange" />
          <span className="ml-2 text-slate-600">Cargando datos...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-red-600">Error al cargar los datos: {(error as Error).message}</p>
          </CardContent>
        </Card>
      )}

      {/* Datos por día */}
      {!isLoading && !error && daysData && (
        <div className="space-y-4">
          {daysData.map((day) => {
            const hasData = day.clubs.length > 0;
            const isExpanded = isDayExpanded(day.date, hasData);

            return (
              <Collapsible
                key={day.date}
                open={isExpanded}
                onOpenChange={() => {
                  toggleDay(day.date);
                  // Marcar como tocado manualmente
                  if (hasData) {
                    setExpandedDays(prev => {
                      const newSet = new Set(prev);
                      if (isExpanded) {
                        newSet.add(`collapsed-${day.date}`);
                        newSet.delete(day.date);
                      } else {
                        newSet.delete(`collapsed-${day.date}`);
                        newSet.add(day.date);
                      }
                      return newSet;
                    });
                  }
                }}
              >
                <Card className={hasData ? "border-l-4 border-l-playtomic-orange" : ""}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          )}
                          <Calendar className="h-5 w-5 text-playtomic-orange" />
                          <CardTitle className="text-lg capitalize">
                            {day.dateFormatted}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-4">
                          {day.totalAbsences > 0 && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <UserMinus className="h-3 w-3" />
                              {day.totalAbsences} ausencias
                            </Badge>
                          )}
                          {day.totalWaitlistPending > 0 && (
                            <Badge variant="secondary" className="flex items-center gap-1 bg-amber-100 text-amber-800">
                              <UserPlus className="h-3 w-3" />
                              {day.totalWaitlistPending} en espera
                            </Badge>
                          )}
                          {!hasData && (
                            <span className="text-sm text-slate-400">Sin ausencias ni waitlist</span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {!hasData ? (
                        <p className="text-slate-500 text-center py-4">
                          No hay ausencias ni listas de espera para este día
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {day.clubs.map((club) => (
                            <div key={club.clubId} className="border rounded-lg p-4 bg-slate-50">
                              <div className="flex items-center gap-2 mb-3">
                                <Building2 className="h-4 w-4 text-blue-600" />
                                <h3 className="font-semibold text-slate-800">{club.clubName}</h3>
                              </div>

                              <div className="space-y-3 ml-6">
                                {club.classes.map((classData) => (
                                  <div key={classData.classId} className="border-l-2 border-slate-300 pl-4 py-2">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Clock className="h-4 w-4 text-slate-500" />
                                      <span className="font-medium">{classData.startTime.slice(0, 5)}</span>
                                      <span className="text-slate-600">-</span>
                                      <span className="text-slate-700">{classData.className}</span>
                                      {classData.trainerName && (
                                        <span className="text-slate-500 text-sm">
                                          ({classData.trainerName})
                                        </span>
                                      )}
                                      <span className="text-slate-400 text-sm ml-auto">
                                        {classData.totalParticipants}/{classData.maxParticipants} participantes
                                      </span>
                                    </div>

                                    {/* Ausencias */}
                                    {classData.absences.length > 0 && (
                                      <div className="ml-6 mb-2">
                                        <div className="flex items-center gap-1 text-red-600 text-sm font-medium mb-1">
                                          <UserMinus className="h-3 w-3" />
                                          Ausencias ({classData.absences.length}):
                                        </div>
                                        <ul className="text-sm text-slate-600 ml-4 space-y-1">
                                          {classData.absences.map((absence) => (
                                            <li key={absence.participantId} className="flex items-center gap-2">
                                              <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                              <span>{absence.studentName}</span>
                                              {absence.absenceReason && (
                                                <span className="text-slate-400 text-xs">
                                                  - {absence.absenceReason}
                                                </span>
                                              )}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Waitlist */}
                                    {classData.waitlist.length > 0 && (
                                      <div className="ml-6">
                                        <div className="flex items-center gap-1 text-amber-600 text-sm font-medium mb-1">
                                          <UserPlus className="h-3 w-3" />
                                          Lista de espera ({classData.waitlist.length}):
                                        </div>
                                        <ul className="text-sm text-slate-600 ml-4 space-y-1">
                                          {classData.waitlist.map((entry) => (
                                            <li key={entry.id} className="flex items-center gap-2">
                                              <span className={`w-2 h-2 rounded-full ${
                                                entry.status === 'pending' ? 'bg-amber-400' :
                                                entry.status === 'accepted' ? 'bg-green-400' :
                                                entry.status === 'rejected' ? 'bg-red-400' :
                                                'bg-slate-400'
                                              }`}></span>
                                              <span>{entry.studentName}</span>
                                              {entry.studentLevel && (
                                                <Badge variant="outline" className="text-xs">
                                                  {entry.studentLevel}
                                                </Badge>
                                              )}
                                              <Badge
                                                variant={
                                                  entry.status === 'pending' ? 'secondary' :
                                                  entry.status === 'accepted' ? 'default' :
                                                  'destructive'
                                                }
                                                className={`text-xs ${
                                                  entry.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                                  entry.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                  ''
                                                }`}
                                              >
                                                {entry.status === 'pending' ? 'Pendiente' :
                                                 entry.status === 'accepted' ? 'Aceptado' :
                                                 entry.status === 'rejected' ? 'Rechazado' :
                                                 'Expirado'}
                                              </Badge>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-slate-500 mt-8">
        <p>Vista de Owner - Datos actualizados cada minuto</p>
        <p className="text-xs mt-1">
          Última actualización: {format(new Date(), 'HH:mm:ss')}
        </p>
      </div>
    </OwnerLayout>
  );
};

export default OwnerAbsencesWaitlistPage;
