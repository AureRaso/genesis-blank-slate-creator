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

  const filteredStudents = students
    .filter((student) => {
      const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || student.status === statusFilter;
      const matchesPeriod = periodFilter === "all" || (student.enrollment_period || "").toLowerCase() === periodFilter;

      return matchesSearch && matchesStatus && matchesPeriod;
    })
    .sort((a, b) => a.full_name.localeCompare(b.full_name)); // Orden alfabético

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
        <Card>
          <CardContent className="p-0">
            {/* Table Header - Desktop only */}
            <div className="hidden md:grid md:grid-cols-10 gap-4 px-6 py-3 bg-muted/50 border-b font-medium text-sm text-muted-foreground">
              <div className="col-span-4">Alumno</div>
              <div className="col-span-4">Contacto</div>
              <div className="col-span-2">Matrícula</div>
            </div>

            {/* Table Body */}
            <div className="divide-y">
              {filteredStudents.map((student) => {
                const initials = student.full_name
                  .split(' ')
                  .map(n => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <div
                    key={student.id}
                    className="grid grid-cols-1 md:grid-cols-10 gap-3 md:gap-4 px-4 md:px-6 py-4 hover:bg-muted/50 transition-colors"
                  >
                    {/* Columna 1: Alumno (Nombre + Nivel + Estado) */}
                    <div className="col-span-1 md:col-span-4 flex items-start gap-3">
                      {/* Avatar con iniciales */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-semibold text-primary text-sm">
                        {initials}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate mb-1">
                          {student.full_name}
                        </h3>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            Nivel {student.level}
                          </Badge>

                          <Badge variant={getStatusBadgeVariant(student.status)} className="text-xs">
                            {getStatusLabel(student.status)}
                          </Badge>
                        </div>

                        {student.course && (
                          <Badge variant="outline" className="text-xs mt-1.5">
                            {student.course}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Columna 2: Contacto */}
                    <div className="col-span-1 md:col-span-4 flex flex-col gap-1.5 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{student.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{student.phone}</span>
                      </div>
                    </div>

                    {/* Columna 3: Info de Matrícula */}
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

                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrainerStudentsList;