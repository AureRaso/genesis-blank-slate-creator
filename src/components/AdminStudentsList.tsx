import { useState } from "react";
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
  Clock,
  Euro,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Building2,
  Edit,
  Check,
  X,
  ArrowUpDown
} from "lucide-react";
import { useAdminStudentEnrollments, StudentEnrollment, useUpdateStudentEnrollment } from "@/hooks/useStudentEnrollments";
import { toast } from "@/hooks/use-toast";

const AdminStudentsList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("arrival"); // "arrival" or "alphabetical"
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingLevel, setEditingLevel] = useState<string>("");

  const { data: students = [], isLoading, error } = useAdminStudentEnrollments(); // No club filtering needed here
  const updateStudentMutation = useUpdateStudentEnrollment();

  // Function to normalize text (remove accents)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };
  
  console.log('📋 AdminStudentsList Data:', {
    studentsCount: students.length,
    isLoading,
    error: error?.message,
    firstFewStudents: students.slice(0, 3).map(s => ({ id: s.id, name: s.full_name, club_id: s.club_id }))
  });

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
        // Ordenar alfabéticamente por nombre
        return a.full_name.localeCompare(b.full_name, 'es', { sensitivity: 'base' });
      } else {
        // Ordenar por orden de llegada (created_at descendente - más recientes primero)
        // Si no hay created_at, usar el orden original
        if (!a.created_at || !b.created_at) return 0;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
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
        title: "Error",
        description: "El nivel debe ser un número entero entre 1 y 10",
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
      {/* Counter */}
      <Card className="bg-gradient-to-r from-playtomic-orange/10 to-orange-600/10 border-playtomic-orange/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-playtomic-orange/20 rounded-full">
                <Users className="h-6 w-6 text-playtomic-orange" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Alumnos</p>
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
                {filteredAndSortedStudents.length} de {students.length} mostrados
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

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-full md:w-48">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                <SelectValue placeholder="Ordenar" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="arrival">Orden de llegada</SelectItem>
              <SelectItem value="alphabetical">Alfabético (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Students List */}
        {filteredAndSortedStudents.length === 0 ? (
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
            {filteredAndSortedStudents.map((student) => (
              <div key={student.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">{student.full_name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      {editingStudentId === student.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            step="1"
                            value={editingLevel}
                            onChange={(e) => handleLevelChange(e.target.value)}
                            className="w-20 h-8"
                            placeholder="1-10"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSaveLevel(student.id)}
                            disabled={updateStudentMutation.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            disabled={updateStudentMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Nivel {student.level}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingStudentId(student.id);
                              setEditingLevel(student.level.toString());
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
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
                    <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{student.club_name}</span>
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