import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  Calendar,
  Clock,
  Euro,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  GraduationCap
} from "lucide-react";
import { useStudentEnrollments, StudentEnrollment } from "@/hooks/useStudentEnrollments";

interface TrainerStudentsListProps {
  onViewStudent: (student: StudentEnrollment) => void;
  onEditStudent: (student: StudentEnrollment) => void;
  onDeleteStudent: (studentId: string) => void;
  onAssignToClass: (student: StudentEnrollment) => void;
}

const TrainerStudentsList = ({ 
  onViewStudent, 
  onEditStudent, 
  onDeleteStudent,
  onAssignToClass 
}: TrainerStudentsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  const { data: students = [], isLoading } = useStudentEnrollments();

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    const matchesPeriod = periodFilter === "all" || (student.enrollment_period || "").toLowerCase() === periodFilter;
    
    return matchesSearch && matchesStatus && matchesPeriod;
  });

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

  if (isLoading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
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
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold truncate">Alumnos Disponibles</h3>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            Alumnos de tu club que puedes asignar a clases
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary w-fit text-xs sm:text-sm">
          {filteredStudents.length} alumno{filteredStudents.length !== 1 ? 's' : ''} disponible{filteredStudents.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
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

            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full sm:w-40 text-xs sm:text-sm h-8 sm:h-10">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="mensual">Mensual</SelectItem>
                <SelectItem value="bimensual">Bimensual</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="semestral">Semestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 sm:py-12 px-3 sm:px-6">
            <Users className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg md:text-xl font-medium mb-2">
              {students.length === 0 ? "No hay alumnos en tu club" : "No se encontraron alumnos"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {students.length === 0
                ? "Los alumnos que se inscriban en tu club aparecerán aquí para que puedas asignarlos a clases"
                : "Prueba a cambiar los filtros de búsqueda"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <span className="truncate">{student.full_name}</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <span>Nivel {student.level}</span>
                        <Badge variant={getStatusBadgeVariant(student.status)} className="text-xs">
                          {getStatusLabel(student.status)}
                        </Badge>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center flex-shrink-0">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onAssignToClass(student)}
                      className="bg-gradient-to-r from-primary to-primary/80 text-xs h-7 sm:h-8 px-2 sm:px-3"
                    >
                      <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Asignar</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6 pt-0 sm:pt-0">
                <div className="grid grid-cols-1 gap-1 sm:gap-2 text-xs sm:text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{student.email}</span>
                  </div>

                  <div className="flex items-center text-muted-foreground">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{student.phone}</span>
                  </div>

                  {student.enrollment_period && (
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                      <span>{getPeriodLabel(student.enrollment_period)}</span>
                    </div>
                  )}

                  {student.weekly_days && student.weekly_days.length > 0 && (
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{student.weekly_days.join(", ")}</span>
                    </div>
                  )}

                  {student.first_payment && (
                    <div className="flex items-center text-muted-foreground">
                      <Euro className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                      <span>{student.first_payment}€</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t">
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

                  <div className="flex items-center gap-0 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewStudent(student)}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditStudent(student)}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteStudent(student.id)}
                      className="text-red-600 hover:text-red-700 h-7 w-7 sm:h-8 sm:w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainerStudentsList;