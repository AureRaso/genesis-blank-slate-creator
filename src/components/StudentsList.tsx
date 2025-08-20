import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Calendar,
  Clock,
  Euro,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { useStudentEnrollments, StudentEnrollment } from "@/hooks/useStudentEnrollments";

interface StudentsListProps {
  onViewStudent: (student: StudentEnrollment) => void;
  onEditStudent: (student: StudentEnrollment) => void;
  onDeleteStudent: (studentId: string) => void;
}

const StudentsList = ({ onViewStudent, onEditStudent, onDeleteStudent }: StudentsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  const { data: students = [], isLoading } = useStudentEnrollments();

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    const matchesPeriod = periodFilter === "all" || student.enrollment_period === periodFilter;
    
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
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
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
              <SelectTrigger className="w-full md:w-40">
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
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">
              {students.length === 0 ? "No hay alumnos inscritos" : "No se encontraron alumnos"}
            </h3>
            <p className="text-muted-foreground">
              {students.length === 0 
                ? "Crea la primera inscripción para ver a tus alumnos aquí"
                : "Prueba a cambiar los filtros de búsqueda"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{student.full_name}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center space-x-2">
                        <span>Nivel {student.level}</span>
                        <Badge variant={getStatusBadgeVariant(student.status)}>
                          {getStatusLabel(student.status)}
                        </Badge>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onViewStudent(student)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onEditStudent(student)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onDeleteStudent(student.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{student.email}</span>
                  </div>
                  
                  <div className="flex items-center text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{student.phone}</span>
                  </div>

                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{getPeriodLabel(student.enrollment_period)}</span>
                  </div>

                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{student.weekly_days.join(", ")}</span>
                  </div>

                  {student.first_payment && (
                    <div className="flex items-center text-muted-foreground">
                      <Euro className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{student.first_payment}€</span>
                    </div>
                  )}
                </div>

                {student.course && (
                  <div className="pt-2 border-t">
                    <Badge variant="outline" className="text-xs">
                      {student.course}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentsList;