import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Search,
  Mail,
  Calendar,
  Euro,
  Phone,
  AlertTriangle,
  Building2,
  Edit,
  Check,
  X,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Trash2
} from "lucide-react";
import { useStudentEnrollments, StudentEnrollment, useUpdateStudentEnrollment } from "@/hooks/useStudentEnrollments";
import { useArchiveStudent } from "@/hooks/useArchiveStudent";
import { toast } from "@/hooks/use-toast";
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
import { useTranslation } from "react-i18next";

const ITEMS_PER_PAGE = 25;

const TrainerStudentsPage = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("alphabetical");
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingLevel, setEditingLevel] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [studentToArchive, setStudentToArchive] = useState<StudentEnrollment | null>(null);
  const { data: students = [], isLoading } = useStudentEnrollments();
  const updateStudentMutation = useUpdateStudentEnrollment();
  const archiveStudentMutation = useArchiveStudent();

  // Function to normalize text (remove accents)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, periodFilter, sortOrder]);

  const filteredAndSortedStudents = students
    .filter((student) => {
      const normalizedSearch = normalizeText(searchTerm);
      const matchesSearch = normalizeText(student.full_name).includes(normalizedSearch) ||
                           normalizeText(student.email).includes(normalizedSearch);
      const matchesStatus = statusFilter === "all" || student.status === statusFilter;
      const matchesPeriod = periodFilter === "all" || (student.enrollment_period || "").toLowerCase() === periodFilter;

      return matchesSearch && matchesStatus && matchesPeriod;
    })
    .sort((a, b) => {
      if (sortOrder === "alphabetical") {
        return a.full_name.localeCompare(b.full_name, 'es', { sensitivity: 'base' });
      } else {
        if (!a.created_at || !b.created_at) return 0;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedStudents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedStudents = filteredAndSortedStudents.slice(startIndex, endIndex);

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "mensual": return "Mensual";
      case "bimensual": return "Bimensual";
      case "trimestral": return "Trimestral";
      case "semestral": return "Semestral";
      case "anual": return "Anual";
      default: return period;
    }
  };

  const handleLevelChange = (value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      setEditingLevel(value);
    }
  };

  const handleSaveLevel = async (studentId: string) => {
    const levelNum = parseInt(editingLevel);

    if (editingLevel === "" || isNaN(levelNum) || levelNum < 1 || levelNum > 10) {
      toast({
        title: "Error",
        description: t('trainerStudentsPage.levelError'),
        variant: "destructive",
      });
      return;
    }

    try {
      await updateStudentMutation.mutateAsync({
        id: studentId,
        data: { level: levelNum }
      });

      setEditingStudentId(null);
      setEditingLevel("");
    } catch (error) {
      console.error('Error updating level:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingStudentId(null);
    setEditingLevel("");
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('trainerStudentsPage.title')}
            </CardTitle>
            <CardDescription>{t('trainerStudentsPage.loading')}</CardDescription>
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
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black truncate">
              {t('trainerStudentsPage.title')}
            </h1>
          </div>
        </div>
      </div>

      {/* Counter */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('trainerStudentsPage.counter.totalPlayers')}</p>
                <p className="text-3xl font-bold">
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
                {t('trainerStudentsPage.counter.showingOf', { count: filteredAndSortedStudents.length, total: students.length })}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('trainerStudentsPage.filters.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder={t('trainerStudentsPage.filters.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('trainerStudentsPage.statusOptions.all')}</SelectItem>
            <SelectItem value="active">{t('trainerStudentsPage.statusOptions.active')}</SelectItem>
            <SelectItem value="inactive">{t('trainerStudentsPage.statusOptions.inactive')}</SelectItem>
            <SelectItem value="pending">{t('trainerStudentsPage.statusOptions.pending')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder={t('trainerStudentsPage.filters.period')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('trainerStudentsPage.statusOptions.all')}</SelectItem>
            <SelectItem value="mensual">Mensual</SelectItem>
            <SelectItem value="bimensual">Bimensual</SelectItem>
            <SelectItem value="trimestral">Trimestral</SelectItem>
            <SelectItem value="semestral">Semestral</SelectItem>
            <SelectItem value="anual">Anual</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-full md:w-48">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              <SelectValue placeholder={t('trainerStudentsPage.filters.sort')} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="arrival">{t('trainerStudentsPage.sortOptions.arrival')}</SelectItem>
            <SelectItem value="alphabetical">{t('trainerStudentsPage.sortOptions.alphabetical')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Students List */}
      {filteredAndSortedStudents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">
              {students.length === 0 ? t('trainerStudentsPage.emptyState.noStudentsInClub') : t('trainerStudentsPage.emptyState.noStudentsFound')}
            </h3>
            <p className="text-muted-foreground">
              {students.length === 0
                ? t('trainerStudentsPage.emptyState.noStudentsDescription')
                : t('trainerStudentsPage.emptyState.changeFilters')
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              {/* Table Header - Desktop only */}
              <div className="hidden md:grid md:grid-cols-11 gap-4 px-6 py-3 bg-muted/50 border-b font-medium text-sm text-muted-foreground">
                <div className="col-span-3">{t('trainerStudentsPage.tableHeaders.player')}</div>
                <div className="col-span-3">{t('trainerStudentsPage.tableHeaders.contact')}</div>
                <div className="col-span-2">{t('trainerStudentsPage.tableHeaders.club')}</div>
                <div className="col-span-2">{t('trainerStudentsPage.tableHeaders.enrollment')}</div>
                <div className="col-span-1">{t('trainerStudentsPage.tableHeaders.actions')}</div>
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

                  return (
                    <div
                      key={student.id}
                      className="grid grid-cols-1 md:grid-cols-11 gap-3 md:gap-4 px-4 md:px-6 py-4 hover:bg-muted/50 transition-colors"
                    >
                      {/* Columna 1: Alumno (Nombre + Nivel + Estado) */}
                      <div className="col-span-1 md:col-span-3 flex items-start gap-3">
                        {/* Avatar con iniciales */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-semibold text-primary text-sm">
                          {initials}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate mb-1">
                            {student.full_name}
                          </h3>

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
                                {t('trainerStudentsPage.level', { level: student.level })}
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
                      <div className="col-span-1 md:col-span-3 flex flex-col gap-1.5 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{student.email}</span>
                        </div>
                        {student.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{student.phone || 'N/A'}</span>
                          </div>
                        )}
                      </div>

                      {/* Columna 3: Club */}
                      <div className="col-span-1 md:col-span-2 flex items-start md:items-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{student.club_name}</span>
                        </div>
                      </div>

                      {/* Columna 4: Info de Matrícula */}
                      <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5 text-sm">
                        {student.enrollment_period && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{getPeriodLabel(student.enrollment_period)}</span>
                          </div>
                        )}
                        {student.first_payment && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Euro className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="font-medium text-foreground">{student.first_payment}€</span>
                          </div>
                        )}
                      </div>

                      {/* Columna 5: Acciones */}
                      <div className="col-span-1 md:col-span-1 flex items-start md:items-center justify-start">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setStudentToArchive(student)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title={t('trainerStudentsPage.deleteStudent')}
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
                {t('trainerStudentsPage.pagination.showing', { start: startIndex + 1, end: Math.min(endIndex, filteredAndSortedStudents.length), total: filteredAndSortedStudents.length })}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('trainerStudentsPage.pagination.previous')}
                </Button>
                <div className="text-sm font-medium">
                  {t('trainerStudentsPage.pagination.page', { current: currentPage, total: totalPages })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  {t('trainerStudentsPage.pagination.next')}
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
              {t('trainerStudentsPage.deleteDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold text-foreground text-base">
                {t('trainerStudentsPage.deleteDialog.aboutToDelete', { playerName: studentToArchive?.full_name })}
              </p>
              <p className="text-muted-foreground">
                {t('trainerStudentsPage.deleteDialog.warning')}
              </p>
              <p className="text-muted-foreground">
                {t('trainerStudentsPage.deleteDialog.dataRetention')}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('trainerStudentsPage.deleteDialog.cancel')}</AlertDialogCancel>
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
              {t('trainerStudentsPage.deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TrainerStudentsPage;
