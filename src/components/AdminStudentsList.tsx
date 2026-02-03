import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Search,
  Mail,
  AlertTriangle,
  Building2,
  Edit,
  Check,
  X,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Pencil,
  GraduationCap,
  Users2,  // MULTI-CLUB FEATURE
  Ghost
} from "lucide-react";
import {
  useAdminStudentEnrollments,
  StudentEnrollment,
  useUpdateStudentEnrollment,
  useClassTrainers,
  ClassTrainer,
  useMultiClubStudentEmails  // MULTI-CLUB FEATURE
} from "@/hooks/useStudentEnrollments";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useArchiveStudent } from "@/hooks/useArchiveStudent";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import StudentEditModal from "@/components/StudentEditModal";
import { useAllStudentScores, type StudentScoreWithDetails } from "@/hooks/useStudentScoring";
import { useBulkBehaviorMetrics, type BulkBehaviorMetric } from "@/hooks/useBulkBehaviorMetrics";
import { AttendanceLegendTooltip } from "@/components/admin/AttendanceLegendTooltip";
import { AttendanceMetricsCell } from "@/components/admin/AttendanceMetricsCell";
import { ScoreBadge } from "@/components/admin/ScoreBadge";
import { StudentMetricsDetailModal } from "@/components/admin/StudentMetricsDetailModal";

const ITEMS_PER_PAGE = 25;

const AdminStudentsList = () => {
  const { t } = useTranslation();
  const { effectiveClubId, isSuperAdmin, superAdminClubs } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [trainerFilter, setTrainerFilter] = useState<string>("all");
  const [ghostFilter, setGhostFilter] = useState<string>("all"); // "all" | "ghost" | "registered"
  const [sortOrder, setSortOrder] = useState<string>("alphabetical"); // "arrival" or "alphabetical"
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingLevel, setEditingLevel] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [studentToArchive, setStudentToArchive] = useState<StudentEnrollment | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<StudentEnrollment | null>(null);
  const [studentForMetrics, setStudentForMetrics] = useState<{
    student: StudentEnrollment;
    score: StudentScoreWithDetails | null;
    behavior: BulkBehaviorMetric | null;
  } | null>(null);

  const { data: students = [], isLoading, error } = useAdminStudentEnrollments(effectiveClubId);
  const { data: classTrainersFromHook = [] } = useClassTrainers(effectiveClubId);
  const updateStudentMutation = useUpdateStudentEnrollment();
  const archiveStudentMutation = useArchiveStudent();

  // Fetch attendance scores for all students
  const { data: allScores = [] } = useAllStudentScores(effectiveClubId);

  // Create lookup maps for O(1) access
  const scoresByEnrollmentId = useMemo(() => {
    return new Map(allScores.map(s => [s.student_enrollment_id, s]));
  }, [allScores]);

  // Get student enrollment IDs for bulk behavior metrics fetch
  const studentEnrollmentIds = useMemo(() => {
    return students.map(s => s.id);
  }, [students]);

  // Fetch behavior metrics (late notices, etc.) for all students
  const { data: behaviorMetrics = [] } = useBulkBehaviorMetrics(studentEnrollmentIds);

  // Create lookup map for behavior metrics
  const behaviorByEnrollmentId = useMemo(() => {
    return new Map(behaviorMetrics.map(b => [b.student_enrollment_id, b]));
  }, [behaviorMetrics]);

  // ============================================
  // MULTI-CLUB FEATURE - START
  // Hook para detectar alumnos en múltiples clubes
  // ============================================
  const { data: multiClubEmails } = useMultiClubStudentEmails();
  const isMultiClubStudent = (email: string) => multiClubEmails?.has(email) ?? false;

  // Determinar si estamos en vista "Todos los clubes" (solo superadmin sin club seleccionado)
  const isViewingAllClubs = isSuperAdmin && !effectiveClubId;

  // Filtrar duplicados cuando superadmin ve todos los clubes
  // Agrupa por email y se queda con una sola inscripción, contando cuántos clubes tiene
  interface StudentWithClubCount extends StudentEnrollment {
    clubCount?: number;
  }

  const uniqueStudents = useMemo<StudentWithClubCount[]>(() => {
    if (!isViewingAllClubs) {
      // Club específico seleccionado: mostrar todas las inscripciones normalmente
      return students;
    }

    // Vista "Todos los clubes": agrupar por email, mostrar solo una vez
    const emailMap = new Map<string, StudentWithClubCount>();
    students.forEach(student => {
      if (!emailMap.has(student.email)) {
        emailMap.set(student.email, {
          ...student,
          clubCount: 1
        });
      } else {
        const existing = emailMap.get(student.email)!;
        existing.clubCount = (existing.clubCount || 1) + 1;
      }
    });

    return Array.from(emailMap.values());
  }, [students, isViewingAllClubs]);
  // ============================================
  // MULTI-CLUB FEATURE - END
  // ============================================

  // Get unique trainer IDs from all students' class_trainer_ids
  const uniqueTrainerIdsFromStudents = [...new Set(
    students.flatMap(s => s.class_trainer_ids || [])
  )];

  // Query to get profile names for trainers derived from students (fallback when useClassTrainers doesn't return all trainers due to RLS)
  const { data: derivedTrainers = [] } = useQuery({
    queryKey: ["derived-class-trainers", uniqueTrainerIdsFromStudents],
    queryFn: async () => {
      if (uniqueTrainerIdsFromStudents.length === 0) return [];

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', uniqueTrainerIdsFromStudents);

      if (error) {
        console.error('Error fetching derived trainers:', error);
        return [];
      }

      const trainers: ClassTrainer[] = (profiles || []).map(p => ({
        profile_id: p.id,
        full_name: p.full_name || 'Sin nombre',
      }));

      trainers.sort((a, b) => a.full_name.localeCompare(b.full_name, 'es', { sensitivity: 'base' }));

      return trainers;
    },
    enabled: uniqueTrainerIdsFromStudents.length > 0,
  });

  // Merge trainers from both sources, preferring the larger set
  // This ensures we show all trainers even if RLS blocks some from the direct query
  const classTrainers = derivedTrainers.length > classTrainersFromHook.length
    ? derivedTrainers
    : classTrainersFromHook;

  // Function to normalize text (remove accents)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Format phone number for WhatsApp link
  const formatPhoneForWhatsApp = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    // If already has international prefix (more than 9 digits), use as is
    if (digits.length > 9) {
      return digits;
    }
    // Otherwise assume Spain (+34)
    return `34${digits}`;
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, periodFilter, trainerFilter, ghostFilter, sortOrder]);

  // ============================================
  // MULTI-CLUB FEATURE - Usar uniqueStudents para evitar duplicados en "Todos los clubes"
  // ============================================
  const filteredAndSortedStudents = uniqueStudents
    .filter((student) => {
      const normalizedSearch = normalizeText(searchTerm);
      const matchesSearch = normalizeText(student.full_name).includes(normalizedSearch) ||
                           normalizeText(student.email).includes(normalizedSearch);
      const matchesStatus = statusFilter === "all" || student.status === statusFilter;
      const matchesPeriod = periodFilter === "all" || (student.enrollment_period || "").toLowerCase() === periodFilter;
      const matchesTrainer = trainerFilter === "all" || (student.class_trainer_ids?.includes(trainerFilter) ?? false);
      const matchesGhost = ghostFilter === "all" ||
        (ghostFilter === "ghost" && student.is_ghost === true) ||
        (ghostFilter === "registered" && !student.is_ghost);

      return matchesSearch && matchesStatus && matchesPeriod && matchesTrainer && matchesGhost;
    })
    .sort((a, b) => {
      const scoreA = scoresByEnrollmentId.get(a.id);
      const scoreB = scoresByEnrollmentId.get(b.id);

      switch (sortOrder) {
        case "alphabetical":
          return a.full_name.localeCompare(b.full_name, 'es', { sensitivity: 'base' });
        case "arrival":
          if (!a.created_at || !b.created_at) return 0;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "score_desc":
          return (scoreB?.score ?? 0) - (scoreA?.score ?? 0);
        case "score_asc":
          return (scoreA?.score ?? 0) - (scoreB?.score ?? 0);
        case "noshows_desc":
          return (scoreB?.no_show_when_confirmed ?? 0) - (scoreA?.no_show_when_confirmed ?? 0);
        default:
          return 0;
      }
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedStudents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedStudents = filteredAndSortedStudents.slice(startIndex, endIndex);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "inactive": return "secondary";
      case "pending": return "outline";
      default: return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    const statusKeys: { [key: string]: string } = {
      active: 'active',
      inactive: 'inactive',
      pending: 'pending'
    };
    const key = statusKeys[status];
    return key ? t(`playersPage.adminStudentsList.status.${key}`) : status;
  };

  const getPeriodLabel = (period: string) => {
    const periodKeys: { [key: string]: string } = {
      mensual: 'monthly',
      bimensual: 'bimonthly',
      trimestral: 'quarterly',
      semestral: 'semiannual',
      anual: 'annual'
    };
    const key = periodKeys[period];
    return key ? t(`playersPage.adminStudentsList.period.${key}`) : period;
  };

  const handleLevelChange = (value: string) => {
    // Permitir valor vacío o solo números enteros
    if (value === "" || /^\d+$/.test(value)) {
      setEditingLevel(value);
    }
  };

  const handleSaveLevel = async (studentId: string) => {
    const levelNum = parseInt(editingLevel);
    const student = students.find(s => s.id === studentId);

    console.log('🔄 Saving level:', {
      studentId,
      student,
      editingLevel,
      levelNum,
      isValid: !isNaN(levelNum) && levelNum >= 1 && levelNum <= 10
    });

    if (editingLevel === "" || isNaN(levelNum) || levelNum < 1 || levelNum > 10) {
      toast({
        title: t('common.error'),
        description: t('playersPage.adminStudentsList.levelError'),
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('📤 Calling updateStudentMutation with:', { id: studentId, data: { level: levelNum } });

      await updateStudentMutation.mutateAsync({
        id: studentId,
        data: { level: levelNum }
      });

      console.log('✅ Level updated successfully');
      setEditingStudentId(null);
      setEditingLevel("");
    } catch (error) {
      console.error('❌ Error updating level:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingStudentId(null);
    setEditingLevel("");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('playersPage.adminStudentsList.title')}
          </CardTitle>
          <CardDescription>{t('playersPage.adminStudentsList.loading')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Counter */}
      <Card className="bg-gradient-to-r from-playtomic-orange/10 to-orange-600/10 border-playtomic-orange/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-playtomic-orange/20 rounded-full">
                <Users className="h-6 w-6 text-playtomic-orange" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('playersPage.adminStudentsList.totalStudents')}</p>
                <p className="text-3xl font-bold text-playtomic-dark">
                  {filteredAndSortedStudents.length}
                  {filteredAndSortedStudents.length !== students.length && (
                    <span className="text-lg text-muted-foreground ml-2">
                      / {students.length}
                    </span>
                  )}
                </p>
              </div>
            </div>
            {filteredAndSortedStudents.length !== students.length && (
              <Badge variant="secondary" className="text-sm">
                {t('playersPage.adminStudentsList.showingOf', { shown: filteredAndSortedStudents.length, total: students.length })}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
          {/* Search - takes more space */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('playersPage.adminStudentsList.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Trainer filter */}
            <Select value={trainerFilter} onValueChange={setTrainerFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder={t('playersPage.adminStudentsList.trainer.label')} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('playersPage.adminStudentsList.trainer.all')}</SelectItem>
                {classTrainers.map(trainer => {
                  // Show only first name and first surname
                  const nameParts = trainer.full_name.split(' ');
                  const shortName = nameParts.length >= 2
                    ? `${nameParts[0]} ${nameParts[1]}`
                    : trainer.full_name;
                  return (
                    <SelectItem key={trainer.profile_id} value={trainer.profile_id}>
                      {shortName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Ghost filter */}
            <Select value={ghostFilter} onValueChange={setGhostFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo de alumno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="registered">Registrados</SelectItem>
                <SelectItem value="ghost">Fantasmas</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort order */}
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder={t('playersPage.adminStudentsList.sort.label')} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alphabetical">{t('playersPage.adminStudentsList.sort.alphabetical')}</SelectItem>
                <SelectItem value="arrival">{t('playersPage.adminStudentsList.sort.arrival')}</SelectItem>
                <SelectItem value="score_desc">{t('playersPage.adminStudentsList.sort.scoreDesc')}</SelectItem>
                <SelectItem value="score_asc">{t('playersPage.adminStudentsList.sort.scoreAsc')}</SelectItem>
                <SelectItem value="noshows_desc">{t('playersPage.adminStudentsList.sort.noShowsDesc')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hidden filters - kept for future use */}
          {/* <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder={t('playersPage.adminStudentsList.status.label')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('playersPage.adminStudentsList.status.all')}</SelectItem>
              <SelectItem value="active">{t('playersPage.adminStudentsList.status.activeFilter')}</SelectItem>
              <SelectItem value="inactive">{t('playersPage.adminStudentsList.status.inactiveFilter')}</SelectItem>
              <SelectItem value="pending">{t('playersPage.adminStudentsList.status.pendingFilter')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder={t('playersPage.adminStudentsList.period.label')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('playersPage.adminStudentsList.period.all')}</SelectItem>
              <SelectItem value="mensual">{t('playersPage.adminStudentsList.period.monthly')}</SelectItem>
              <SelectItem value="bimensual">{t('playersPage.adminStudentsList.period.bimonthly')}</SelectItem>
              <SelectItem value="trimestral">{t('playersPage.adminStudentsList.period.quarterly')}</SelectItem>
              <SelectItem value="semestral">{t('playersPage.adminStudentsList.period.semiannual')}</SelectItem>
              <SelectItem value="anual">{t('playersPage.adminStudentsList.period.annual')}</SelectItem>
            </SelectContent>
          </Select> */}
        </div>

        {/* Students List */}
        {filteredAndSortedStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">
              {students.length === 0 ? t('playersPage.adminStudentsList.emptyState.noStudents') : t('playersPage.adminStudentsList.emptyState.noResults')}
            </h3>
            <p className="text-muted-foreground">
              {students.length === 0
                ? t('playersPage.adminStudentsList.emptyState.noStudentsHint')
                : t('playersPage.adminStudentsList.emptyState.noResultsHint')
              }
            </p>
          </div>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                {/* Table Header - Desktop only */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-muted/50 border-b font-medium text-sm text-muted-foreground">
                  <div className="col-span-3">{t('playersPage.adminStudentsList.tableHeaders.student')}</div>
                  <div className="col-span-2">{t('playersPage.adminStudentsList.tableHeaders.contact')}</div>
                  <div className="col-span-2">{t('playersPage.adminStudentsList.tableHeaders.club')}</div>
                  <div className="col-span-2 flex items-center gap-1">
                    {t('playersPage.adminStudentsList.tableHeaders.attendance')}
                    <AttendanceLegendTooltip />
                  </div>
                  <div className="col-span-1">{t('playersPage.adminStudentsList.tableHeaders.score')}</div>
                  <div className="col-span-2 text-right">{t('playersPage.adminStudentsList.tableHeaders.actions')}</div>
                </div>

                {/* Table Body */}
                <div className="divide-y">
                  {paginatedStudents.map((student) => {
                    const initials = student.full_name
                      .split(' ')
                      .map(n => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    const studentScore = scoresByEnrollmentId.get(student.id);
                    const studentBehavior = behaviorByEnrollmentId.get(student.id);

                    return (
                      <div
                        key={student.id}
                        className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-4 md:px-6 py-4 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setStudentForMetrics({
                          student,
                          score: studentScore || null,
                          behavior: studentBehavior || null
                        })}
                      >
                        {/* Columna 1: Alumno (Nombre + Nivel + Estado) */}
                        <div className="col-span-1 md:col-span-3 flex items-start gap-3">
                          {/* Avatar con iniciales */}
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-semibold text-primary text-sm">
                            {initials}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-base truncate">
                                {student.full_name}
                              </h3>
                              {student.is_ghost && (
                                <Badge variant="outline" className="text-xs gap-1 bg-gray-100 text-gray-600 border-gray-300 flex-shrink-0">
                                  <Ghost className="h-3 w-3" />
                                  Fantasma
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Nivel editable */}
                              {editingStudentId === student.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    min="1"
                                    max="10"
                                    step="1"
                                    value={editingLevel}
                                    onChange={(e) => handleLevelChange(e.target.value)}
                                    className="w-16 h-7 text-xs"
                                    placeholder="1-10"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveLevel(student.id)}
                                    disabled={updateStudentMutation.isPending}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCancelEdit}
                                    disabled={updateStudentMutation.isPending}
                                    className="h-7 w-7 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Badge variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => {
                                  setEditingStudentId(student.id);
                                  setEditingLevel(student.level.toString());
                                }}>
                                  {t('playersPage.adminStudentsList.level')} {student.level}
                                  <Edit className="h-2.5 w-2.5" />
                                </Badge>
                              )}
                            </div>

                            {student.course && (
                              <Badge variant="outline" className="text-xs mt-1.5">
                                {student.course}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Columna 2: Contacto */}
                        <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate text-xs">{student.email}</span>
                          </div>
                          {student.phone && (
                            <a
                              href={`https://wa.me/${formatPhoneForWhatsApp(student.phone)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 transition-all duration-200 text-xs font-medium border border-green-200 hover:border-green-300 hover:shadow-sm w-fit"
                              title={t('playersPage.adminStudentsList.openWhatsApp')}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <WhatsAppIcon className="h-3.5 w-3.5" />
                              <span>{student.phone}</span>
                            </a>
                          )}
                        </div>

                        {/* Columna 3: Club */}
                        <div className="col-span-1 md:col-span-2 flex items-start md:items-center">
                          <div className="flex flex-col gap-1">
                            {/* ============================================ */}
                            {/* MULTI-CLUB FEATURE - Club display START */}
                            {/* Cuando superadmin ve "Todos los clubes": */}
                            {/* - Multi-club: mostrar solo badge "Multi-club" (sin nombre de club) */}
                            {/* - No multi-club: mostrar nombre de club normal */}
                            {/* Cuando ve un club específico: comportamiento normal */}
                            {/* ============================================ */}
                            {isViewingAllClubs && isMultiClubStudent(student.email) ? (
                              // Vista "Todos los clubes" + estudiante multi-club: solo badge
                              <Badge
                                variant="outline"
                                className="text-xs w-fit gap-1 bg-purple-50 text-purple-700 border-purple-200"
                              >
                                <Users2 className="h-3 w-3" />
                                Multi-club
                              </Badge>
                            ) : (
                              // Club específico o estudiante no multi-club: mostrar nombre + badge si aplica
                              <>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="truncate">{student.club_name}</span>
                                </div>
                                {isMultiClubStudent(student.email) && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs w-fit gap-1 bg-purple-50 text-purple-700 border-purple-200"
                                  >
                                    <Users2 className="h-3 w-3" />
                                    Multi-club
                                  </Badge>
                                )}
                              </>
                            )}
                            {/* ============================================ */}
                            {/* MULTI-CLUB FEATURE - Club display END */}
                            {/* ============================================ */}
                          </div>
                        </div>

                        {/* Columna 4: Asistencia */}
                        <div className="col-span-1 md:col-span-2 flex items-center">
                          <AttendanceMetricsCell
                            score={studentScore}
                            behavior={studentBehavior}
                          />
                        </div>

                        {/* Columna 5: Score */}
                        <div className="col-span-1 md:col-span-1 flex items-center">
                          <ScoreBadge score={studentScore} />
                        </div>

                        {/* Columna 6: Acciones */}
                        <div className="col-span-1 md:col-span-2 flex items-start md:items-center justify-end gap-1">
                          {/* ============================================ */}
                          {/* MULTI-CLUB FEATURE - Hide edit when viewing all clubs */}
                          {/* El botón de editar se oculta cuando superadmin ve "Todos los clubes" */}
                          {/* porque no está claro cuál inscripción editar si el alumno tiene varias */}
                          {/* ============================================ */}
                          {!isViewingAllClubs && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setStudentToEdit(student);
                              }}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              title={t('playersPage.adminStudentsList.editStudent')}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStudentToArchive(student);
                            }}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title={t('playersPage.adminStudentsList.deleteStudent')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Observaciones (si existen) - Mobile only */}
                        {student.observations && (
                          <div className="col-span-1 text-xs text-muted-foreground italic border-t pt-2 mt-2 md:hidden">
                            <AlertTriangle className="h-3 w-3 inline mr-1 text-amber-600" />
                            {student.observations}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4">
                <div className="text-sm text-muted-foreground">
                  {t('playersPage.adminStudentsList.pagination.showing', { start: startIndex + 1, end: Math.min(endIndex, filteredAndSortedStudents.length), total: filteredAndSortedStudents.length })}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('playersPage.adminStudentsList.pagination.previous')}
                  </Button>
                  <div className="text-sm font-medium">
                    {t('playersPage.adminStudentsList.pagination.pageOf', { current: currentPage, total: totalPages })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    {t('playersPage.adminStudentsList.pagination.next')}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!studentToArchive} onOpenChange={(open) => !open && setStudentToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              {t('playersPage.adminStudentsList.deleteDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold text-foreground text-base">
                {t('playersPage.adminStudentsList.deleteDialog.aboutToDelete', { name: studentToArchive?.full_name })}
              </p>
              <p className="text-muted-foreground">
                ⚠️ <strong>{t('playersPage.adminStudentsList.deleteDialog.warning')}</strong> {t('playersPage.adminStudentsList.deleteDialog.warningText')}
              </p>
              <p className="text-muted-foreground">
                {t('playersPage.adminStudentsList.deleteDialog.dataRetention')}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('playersPage.adminStudentsList.deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (studentToArchive) {
                  archiveStudentMutation.mutate({
                    studentId: studentToArchive.id,
                    archive: true
                  });
                  setStudentToArchive(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('playersPage.adminStudentsList.deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Student Modal */}
      <StudentEditModal
        student={studentToEdit}
        isOpen={!!studentToEdit}
        onClose={() => setStudentToEdit(null)}
        isSuperAdmin={isSuperAdmin}
        superAdminClubs={superAdminClubs}
      />

      {/* Student Metrics Detail Modal */}
      <StudentMetricsDetailModal
        student={studentForMetrics?.student || null}
        score={studentForMetrics?.score || null}
        behavior={studentForMetrics?.behavior || null}
        isOpen={!!studentForMetrics}
        onClose={() => setStudentForMetrics(null)}
      />
    </div>
  );
};

export default AdminStudentsList;