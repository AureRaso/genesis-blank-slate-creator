import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTodayAttendance, useCancelledClasses } from "@/hooks/useTodayAttendance";
import { useRecordActualAttendance, useAttendanceRecordExists, detectIncident, getIncidentDetails, type IncidentType } from "@/hooks/useAttendanceRecords";
import { useAllStudentScores, useCalculateStudentScore, useRecalculateAllScores, type ScoreCategory } from "@/hooks/useStudentScoring";
import { useUnreadNotificationsCount } from "@/hooks/useScoreNotifications";
import StudentScoreCard, { getScoreCategoryDetails } from "@/components/StudentScoreCard";
import NotificationsPanel from "@/components/NotificationsPanel";
import MonthlyReportCard from "@/components/MonthlyReportCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
  Save,
  ClipboardCheck,
  TrendingUp,
  User,
  RefreshCw,
  Filter,
  Search,
  Award,
  Bell,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ParticipantAttendance {
  participantId: string;
  name: string;
  email: string;
  hadConfirmedAttendance: boolean;
  hadConfirmedAbsence: boolean;
  actuallyAttended: boolean | null; // null = no marcado aún
  notes: string;
}

const TrainerReportsPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  // State
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [participantsAttendance, setParticipantsAttendance] = useState<ParticipantAttendance[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  // State para tab de métricas
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<ScoreCategory | "all">("all");
  const [showAlertOnly, setShowAlertOnly] = useState(false);

  // Queries
  const { data: classes, isLoading: loadingClasses } = useTodayAttendance(selectedDate, selectedDate);
  const { data: cancelledClasses = [] } = useCancelledClasses(selectedDate, selectedDate);
  const { data: recordExists } = useAttendanceRecordExists(selectedClassId, selectedDate);
  const { data: unreadCount = 0 } = useUnreadNotificationsCount(profile?.club_id);

  // Mutations
  const recordAttendance = useRecordActualAttendance();

  // Queries para métricas
  const { data: studentScores, isLoading: loadingScores } = useAllStudentScores(profile?.club_id);
  const calculateScore = useCalculateStudentScore();
  const recalculateAll = useRecalculateAllScores();

  // Get selected class
  const selectedClass = classes?.find(c => c.id === selectedClassId);

  // Check if class is cancelled
  const isClassCancelled = (classId: string) => {
    return cancelledClasses.some(
      (cancelled) => cancelled.programmed_class_id === classId && cancelled.cancelled_date === selectedDate
    );
  };

  // Handler: cuando selecciona una clase
  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
    setShowSummary(false);

    const selectedClassData = classes?.find(c => c.id === classId);
    if (!selectedClassData) return;

    // Inicializar estado de asistencia
    const initialAttendance: ParticipantAttendance[] = selectedClassData.participants
      .filter(p => p.student_enrollment)
      .map(p => ({
        participantId: p.id,
        name: p.student_enrollment!.full_name,
        email: p.student_enrollment!.email,
        hadConfirmedAttendance: !!p.attendance_confirmed_for_date,
        hadConfirmedAbsence: !!p.absence_confirmed,
        actuallyAttended: null, // Sin marcar
        notes: '',
      }));

    setParticipantsAttendance(initialAttendance);
  };

  // Handler: marcar asistencia individual
  const handleMarkAttendance = (participantId: string, attended: boolean) => {
    setParticipantsAttendance(prev =>
      prev.map(p =>
        p.participantId === participantId
          ? { ...p, actuallyAttended: attended }
          : p
      )
    );
  };

  // Handler: actualizar notas
  const handleUpdateNotes = (participantId: string, notes: string) => {
    setParticipantsAttendance(prev =>
      prev.map(p =>
        p.participantId === participantId
          ? { ...p, notes }
          : p
      )
    );
  };

  // Handler: guardar asistencia
  const handleSaveAttendance = async () => {
    if (!selectedClassId) return;

    // Validar que todos estén marcados
    const unmarked = participantsAttendance.filter(p => p.actuallyAttended === null);
    if (unmarked.length > 0) {
      alert(`Por favor marca la asistencia de todos los alumnos. Faltan ${unmarked.length}`);
      return;
    }

    // Preparar datos
    const input = {
      classId: selectedClassId,
      classDate: selectedDate,
      participants: participantsAttendance.map(p => ({
        participantId: p.participantId,
        actuallyAttended: p.actuallyAttended!,
        notes: p.notes || undefined,
      })),
    };

    // Guardar
    const result = await recordAttendance.mutateAsync(input);

    // Mostrar resumen
    setShowSummary(true);
  };

  // Calcular estadísticas del resumen
  const calculateSummary = () => {
    const incidents = participantsAttendance.map(p => {
      if (p.actuallyAttended === null) return null;

      const incidentType = detectIncident(
        p.hadConfirmedAttendance,
        p.hadConfirmedAbsence,
        p.actuallyAttended
      );

      const details = getIncidentDetails(incidentType, p.name);

      return {
        type: incidentType,
        name: p.name,
        message: details.message,
        severity: details.severity,
      };
    }).filter(Boolean);

    const perfect = incidents.filter(i => i?.type === 'PERFECT').length;
    const noShow = incidents.filter(i => i?.type === 'NO_SHOW_CRITICAL').length;
    const cameWithoutConfirmation = incidents.filter(i => i?.type === 'CAME_WITHOUT_CONFIRMATION').length;
    const cancelledButCame = incidents.filter(i => i?.type === 'CANCELLED_BUT_CAME').length;

    return {
      perfect,
      noShow,
      cameWithoutConfirmation,
      cancelledButCame,
      incidents,
    };
  };

  const summary = showSummary ? calculateSummary() : null;

  if (loadingClasses) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando clases...</p>
        </div>
      </div>
    );
  }

  const formattedDate = format(new Date(selectedDate), "EEEE, d 'de' MMMM", { locale: es });

  return (
    <div className="min-h-screen overflow-y-auto flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <span>Reportes de asistencia</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de asistencia y métricas de alumnos
          </p>
        </div>
        {/* FASE 3: Comentado temporalmente - Botón Ver Scores */}
        {/* <Button
          onClick={() => navigate("/dashboard/student-scores")}
          className="gap-2 border-playtomic-orange text-playtomic-orange hover:bg-playtomic-orange hover:text-white"
          variant="outline"
        >
          <Award className="h-4 w-4" />
          Ver Scores
        </Button> */}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Pasar lista</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Métricas y scoring</span>
          </TabsTrigger>
          {/* FASE 4: Comentado temporalmente - Notificaciones y Reportes */}
          {/* <TabsTrigger value="notifications" className="flex items-center gap-2 relative">
            <Bell className="h-4 w-4" />
            <span>Notificaciones</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 flex items-center justify-center p-1 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Reportes</span>
          </TabsTrigger> */}
        </TabsList>

        {/* TAB: Pasar Lista */}
        <TabsContent value="attendance" className="space-y-6">
          {/* Selector de fecha y clase */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Seleccionar clase</CardTitle>
              <CardDescription>Elige la clase para registrar la asistencia real</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date selector */}
              <div>
                <label className="text-sm font-medium mb-2 block">Fecha</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedClassId("");
                    setParticipantsAttendance([]);
                    setShowSummary(false);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              {/* Class selector */}
              <div>
                <label className="text-sm font-medium mb-2 block">Clase</label>
                <Select value={selectedClassId} onValueChange={handleClassSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una clase" />
                  </SelectTrigger>
                  <SelectContent>
                    {!classes || classes.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        No hay clases programadas para esta fecha
                      </div>
                    ) : (
                      classes.map((classData) => {
                        const isCancelled = isClassCancelled(classData.id);
                        return (
                          <SelectItem
                            key={classData.id}
                            value={classData.id}
                            disabled={isCancelled}
                          >
                            <div className="flex items-center gap-2">
                              <span>{classData.name} - {classData.start_time}</span>
                              {isCancelled && (
                                <Badge variant="destructive" className="text-xs">CANCELADA</Badge>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Warning si ya existe registro */}
              {recordExists && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Ya existe un registro de asistencia para esta clase en esta fecha.
                    Guardar de nuevo sobrescribirá los datos anteriores.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Lista de participantes para pasar lista */}
          {selectedClass && participantsAttendance.length > 0 && !showSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center justify-between">
                  <span>Lista de Alumnos</span>
                  <Badge variant="outline">
                    {participantsAttendance.length} alumnos
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Marca quién asistió y quién no a la clase de hoy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {participantsAttendance.map((participant) => {
                  const isMarked = participant.actuallyAttended !== null;

                  return (
                    <div
                      key={participant.participantId}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        isMarked
                          ? participant.actuallyAttended
                            ? 'bg-green-50 border-green-300'
                            : 'bg-red-50 border-red-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {/* Alumno info */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-slate-500" />
                            <p className="font-semibold text-slate-900">{participant.name}</p>
                          </div>
                          <p className="text-xs text-slate-500 ml-6">{participant.email}</p>

                          {/* Estado de confirmación previa */}
                          <div className="flex items-center gap-2 mt-2 ml-6">
                            {participant.hadConfirmedAttendance && (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                                ✓ Confirmó asistencia
                              </Badge>
                            )}
                            {participant.hadConfirmedAbsence && (
                              <Badge variant="default" className="text-xs bg-red-100 text-red-700">
                                ✗ Canceló
                              </Badge>
                            )}
                            {!participant.hadConfirmedAttendance && !participant.hadConfirmedAbsence && (
                              <Badge variant="outline" className="text-xs">
                                ⚪ No respondió
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Botones de asistencia */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleMarkAttendance(participant.participantId, true)}
                            className={`gap-1.5 ${
                              participant.actuallyAttended === true
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-white border-2 border-green-200 text-green-700 hover:bg-green-50'
                            }`}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Vino
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMarkAttendance(participant.participantId, false)}
                            className={`gap-1.5 ${
                              participant.actuallyAttended === false
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-white border-2 border-red-200 text-red-700 hover:bg-red-50'
                            }`}
                          >
                            <XCircle className="h-4 w-4" />
                            No vino
                          </Button>
                        </div>
                      </div>

                      {/* Notas opcionales */}
                      {isMarked && (
                        <Textarea
                          placeholder="Notas opcionales (ej: llegó tarde, se fue temprano...)"
                          value={participant.notes}
                          onChange={(e) => handleUpdateNotes(participant.participantId, e.target.value)}
                          className="text-xs"
                          rows={2}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Botón guardar */}
                <Button
                  size="lg"
                  className="w-full bg-playtomic-orange hover:bg-playtomic-orange/90 gap-2"
                  onClick={handleSaveAttendance}
                  disabled={recordAttendance.isPending || participantsAttendance.some(p => p.actuallyAttended === null)}
                >
                  <Save className="h-5 w-5" />
                  {recordAttendance.isPending ? 'Guardando...' : 'Guardar Asistencia'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Resumen después de guardar */}
          {showSummary && summary && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-green-900">
                  <CheckCircle2 className="h-6 w-6" />
                  Asistencia Registrada
                </CardTitle>
                <CardDescription className="text-green-700">
                  {format(new Date(selectedDate), "d 'de' MMMM, yyyy", { locale: es })} - {selectedClass?.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Estadísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{summary.perfect}</p>
                    <p className="text-xs text-muted-foreground">Todo perfecto</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{summary.noShow}</p>
                    <p className="text-xs text-muted-foreground">No-shows críticos</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{summary.cameWithoutConfirmation}</p>
                    <p className="text-xs text-muted-foreground">Sin confirmar</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{summary.cancelledButCame}</p>
                    <p className="text-xs text-muted-foreground">Cancelaron pero vinieron</p>
                  </div>
                </div>

                {/* Detalle de incidencias críticas */}
                {summary.noShow > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-semibold mb-2">⚠️ No-shows críticos detectados:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {summary.incidents
                          .filter(i => i?.type === 'NO_SHOW_CRITICAL')
                          .map((incident, idx) => (
                            <li key={idx}>{incident?.name}</li>
                          ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Botón para volver */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedClassId("");
                    setParticipantsAttendance([]);
                    setShowSummary(false);
                  }}
                >
                  Pasar lista de otra clase
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {!selectedClass && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecciona una clase</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Elige una fecha y clase para empezar a pasar lista
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: Métricas y Scoring */}
        <TabsContent value="metrics" className="space-y-6">
          {/* Controles superiores */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Métricas de alumnos</CardTitle>
                  <CardDescription>
                    Scores calculados basados en comportamiento de asistencia
                  </CardDescription>
                </div>
                <Button
                  onClick={() => recalculateAll.mutate(profile?.club_id)}
                  disabled={recalculateAll.isPending}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${recalculateAll.isPending ? 'animate-spin' : ''}`} />
                  Recalcular todos
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Buscador */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar alumno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md"
                  />
                </div>

                {/* Filtro por categoría */}
                <Select
                  value={filterCategory}
                  onValueChange={(value) => setFilterCategory(value as ScoreCategory | "all")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    <SelectItem value="excellent">⭐ Excelentes (90+)</SelectItem>
                    <SelectItem value="good">✓ Buenos (75-89)</SelectItem>
                    <SelectItem value="regular">⚠️ Regulares (60-74)</SelectItem>
                    <SelectItem value="problematic">🚫 Problemáticos (&lt;60)</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtro alerta */}
                <Button
                  variant={showAlertOnly ? "default" : "outline"}
                  onClick={() => setShowAlertOnly(!showAlertOnly)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {showAlertOnly ? 'Mostrando solo alertas' : 'Solo con alertas'}
                </Button>
              </div>

              {/* Estadísticas rápidas */}
              {studentScores && studentScores.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {studentScores.filter(s => s.score_category === 'excellent').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Excelentes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {studentScores.filter(s => s.score_category === 'good').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Buenos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {studentScores.filter(s => s.score_category === 'regular').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Regulares</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {studentScores.filter(s => s.score_category === 'problematic').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Problemáticos</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loading state */}
          {loadingScores && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando scores...</p>
              </div>
            </div>
          )}

          {/* Lista de alumnos */}
          {!loadingScores && studentScores && studentScores.length > 0 ? (
            <div className="space-y-4">
              {studentScores
                .filter(score => {
                  // Filtro por búsqueda
                  const matchesSearch = searchTerm
                    ? score.student_enrollment?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      score.student_enrollment?.email?.toLowerCase().includes(searchTerm.toLowerCase())
                    : true;

                  // Filtro por categoría
                  const matchesCategory = filterCategory === "all" || score.score_category === filterCategory;

                  // Filtro por alerta
                  const hasAlert = score.recent_streak_type === 'negative' || score.no_show_when_confirmed > 0;
                  const matchesAlert = !showAlertOnly || hasAlert;

                  return matchesSearch && matchesCategory && matchesAlert;
                })
                .map((score) => (
                  <StudentScoreCard
                    key={score.id}
                    scoreData={score}
                    onRecalculate={() => calculateScore.mutate(score.student_enrollment_id)}
                    isRecalculating={calculateScore.isPending}
                    compact={true}
                  />
                ))}
            </div>
          ) : (
            !loadingScores && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay scores calculados</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Los scores se calculan automáticamente después de pasar lista
                  </p>
                  <Button onClick={() => recalculateAll.mutate(profile?.club_id)} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Calcular Scores
                  </Button>
                </CardContent>
              </Card>
            )
          )}
        </TabsContent>

        {/* FASE 4: Comentado temporalmente - Tabs de Notificaciones y Reportes */}
        {/* <TabsContent value="notifications" className="space-y-6">
          <NotificationsPanel clubId={profile?.club_id} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <MonthlyReportCard clubId={profile?.club_id} />
        </TabsContent> */}
      </Tabs>
    </div>
  );
};

export default TrainerReportsPage;
