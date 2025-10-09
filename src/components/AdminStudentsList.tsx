import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Building2
} from "lucide-react";
import { useAdminStudentEnrollments, StudentEnrollment } from "@/hooks/useStudentEnrollments";

const AdminStudentsList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  const { data: students = [], isLoading, error } = useAdminStudentEnrollments(); // No club filtering needed here
  
  console.log('📋 AdminStudentsList Data:', {
    studentsCount: students.length,
    isLoading,
    error: error?.message,
    firstFewStudents: students.slice(0, 3).map(s => ({ id: s.id, name: s.full_name, club_id: s.club_id }))
  });

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Alumnos Disponibles
          </CardTitle>
          <CardDescription>Cargando alumnos...</CardDescription>
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
      {/* Filters */}
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

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">
              {students.length === 0 ? "No hay alumnos inscritos" : "No se encontraron alumnos"}
            </h3>
            <p className="text-muted-foreground">
              {students.length === 0 
                ? "Los alumnos inscritos en tus clubes aparecerán aquí"
                : "Prueba a cambiar los filtros de búsqueda"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStudents.map((student) => (
              <div key={student.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">{student.full_name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-muted-foreground">Nivel {student.level}</span>
                      <Badge variant={getStatusBadgeVariant(student.status)}>
                        {getStatusLabel(student.status)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{student.email}</span>
                  </div>

                  <div className="flex items-center text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{student.phone}</span>
                  </div>

                  <div className="flex items-center text-muted-foreground">
                    <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{student.club_name}</span>
                    {student.club_status && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {student.club_status}
                      </Badge>
                    )}
                  </div>

                  {student.enrollment_period && (
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{getPeriodLabel(student.enrollment_period)}</span>
                    </div>
                  )}

                  {student.weekly_days && student.weekly_days.length > 0 && (
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{student.weekly_days.join(", ")}</span>
                    </div>
                  )}

                  {student.first_payment && (
                    <div className="flex items-center text-muted-foreground">
                      <Euro className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{student.first_payment}€</span>
                    </div>
                  )}
                </div>

                {student.course && (
                  <div className="pt-3 border-t mt-3">
                    <Badge variant="outline" className="text-xs">
                      {student.course}
                    </Badge>
                  </div>
                )}

                {student.observations && (
                  <div className="pt-2 mt-2">
                    <p className="text-sm text-muted-foreground">{student.observations}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

export default AdminStudentsList;