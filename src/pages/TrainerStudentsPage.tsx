import { useState } from "react";
import { Users, UserPlus, ArrowLeft, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useStudentEnrollments, StudentEnrollment, useDeleteStudentEnrollment } from "@/hooks/useStudentEnrollments";
import { useMyTrainerProfile } from "@/hooks/useTrainers";
import StudentEnrollmentForm from "@/components/StudentEnrollmentForm";
import StudentEditModal from "@/components/StudentEditModal";
import { AssignStudentToClassModal } from "@/components/AssignStudentToClassModal";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const TrainerStudentsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentEnrollment | undefined>();
  const [assigningStudent, setAssigningStudent] = useState<StudentEnrollment | undefined>();
  const [isStudentEditModalOpen, setIsStudentEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const { data: trainerProfile } = useMyTrainerProfile();
  const { data: students = [], isLoading } = useStudentEnrollments();
  const deleteStudentMutation = useDeleteStudentEnrollment();

  // Debug: Log students data
  console.log('Students data:', students);

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    const matchesLevel = levelFilter === "all" || student.level.toString() === levelFilter;
    
    return matchesSearch && matchesStatus && matchesLevel;
  });

  const handleCreateNewStudent = () => {
    setShowStudentForm(true);
  };

  const handleEditStudent = (student: StudentEnrollment) => {
    setEditingStudent(student);
    setIsStudentEditModalOpen(true);
  };

  const handleDeleteStudent = (studentId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este alumno? Esta acción no se puede deshacer.')) {
      deleteStudentMutation.mutate(studentId);
    }
  };

  const handleAssignToClass = (student: StudentEnrollment) => {
    setAssigningStudent(student);
    setIsAssignModalOpen(true);
  };

  const handleCloseStudentForm = () => {
    setShowStudentForm(false);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "inactive": return "secondary";
      case "pending": return "outline";
      default: return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Activo";
      case "inactive": return "Inactivo";
      case "pending": return "Pendiente";
      default: return status;
    }
  };

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

  // Get club info
  const clubName = trainerProfile?.trainer_clubs?.[0]?.clubs?.name || 'Club no asignado';

  if (showStudentForm) {
    return (
      <div className="space-y-6">
        <StudentEnrollmentForm 
          onClose={handleCloseStudentForm} 
          trainerProfile={trainerProfile} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black truncate">
              Gestión de Alumnos
            </h1>
          </div>

          <Button onClick={handleCreateNewStudent} className="bg-gradient-to-r from-primary to-primary/80 flex-shrink-0" size="sm">
            <UserPlus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-sm sm:text-base">Nuevo Alumno</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Alumnos</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Activos</CardTitle>
            <div className="h-2 w-2 sm:h-3 sm:w-3 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">
              {students.filter(s => s.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Pendientes</CardTitle>
            <div className="h-2 w-2 sm:h-3 sm:w-3 bg-yellow-500 rounded-full" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">
              {students.filter(s => s.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Inactivos</CardTitle>
            <div className="h-2 w-2 sm:h-3 sm:w-3 bg-gray-500 rounded-full" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">
              {students.filter(s => s.status === 'inactive').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 sm:pl-10 text-xs sm:text-sm h-8 sm:h-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 text-xs sm:text-sm h-8 sm:h-10">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full sm:w-40 text-xs sm:text-sm h-8 sm:h-10">
                <SelectValue placeholder="Nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                  <SelectItem key={level} value={level.toString()}>
                    Nivel {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {isLoading ? (
        <div className="space-y-3 sm:space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-6 sm:h-8 bg-gray-200 rounded w-12 sm:w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 sm:py-12 px-3 sm:px-6">
            <Users className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg md:text-xl font-medium mb-2">
              {students.length === 0 ? "No hay alumnos en tu club" : "No se encontraron alumnos"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
              {students.length === 0
                ? "Los alumnos que se inscriban en tu club aparecerán aquí"
                : "Prueba a cambiar los filtros de búsqueda"
              }
            </p>
            {students.length === 0 && (
              <Button onClick={handleCreateNewStudent} className="bg-gradient-to-r from-primary to-primary/80" size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                <span className="text-sm sm:text-base">Crear Primer Alumno</span>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm sm:text-base md:text-lg truncate">{student.full_name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 sm:gap-2 flex-wrap text-xs sm:text-sm">
                      <span>Nivel {student.level}</span>
                      <Badge variant={getStatusBadgeVariant(student.status)} className="text-xs">
                        {getStatusLabel(student.status)}
                      </Badge>
                    </CardDescription>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleAssignToClass(student)}
                    className="bg-gradient-to-r from-primary to-primary/80 flex-shrink-0 text-xs h-7 sm:h-8 px-2 sm:px-3"
                  >
                    <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Asignar</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6 pt-0 sm:pt-0">
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Email:</span>
                    <span className="truncate">{student.email}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Teléfono:</span>
                    <span className="truncate">{student.phone}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Período:</span>
                    <span className="truncate">{getPeriodLabel(student.enrollment_period)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Días:</span>
                    <span className="text-right truncate">{student.weekly_days.join(", ")}</span>
                  </div>

                  {student.first_payment && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Pago inicial:</span>
                      <span className="font-medium">{student.first_payment}€</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 sm:pt-3 border-t">
                  <div className="flex gap-1 flex-wrap">
                    {student.course && (
                      <Badge variant="outline" className="text-xs">
                        {student.course}
                      </Badge>
                    )}
                    {student.club_name && (
                      <Badge variant="secondary" className="text-xs truncate max-w-[150px]">
                        {student.club_name}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditStudent(student)}
                      className="flex-1 sm:flex-none text-xs h-7 sm:h-8"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteStudent(student.id)}
                      className="text-red-600 hover:text-red-700 flex-1 sm:flex-none text-xs h-7 sm:h-8"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <StudentEditModal
        student={editingStudent || null}
        isOpen={isStudentEditModalOpen}
        onClose={() => {
          setIsStudentEditModalOpen(false);
          setEditingStudent(undefined);
        }}
      />

      <AssignStudentToClassModal
        student={assigningStudent || null}
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setAssigningStudent(undefined);
        }}
      />
    </div>
  );
};

export default TrainerStudentsPage;