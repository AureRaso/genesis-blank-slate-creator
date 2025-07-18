
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Edit, 
  Trash2, 
  Eye,
  UserPlus,
  MoreVertical
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { useScheduledClasses, type ScheduledClassWithTemplate } from "@/hooks/useScheduledClasses";
import type { ClassFiltersData } from "./ClassFilters";

interface ClassListViewProps {
  clubId?: string;
  filters: ClassFiltersData;
}

export default function ClassListView({ clubId, filters }: ClassListViewProps) {
  const [selectedClass, setSelectedClass] = useState<ScheduledClassWithTemplate | null>(null);
  
  const { data: classes, isLoading } = useScheduledClasses({
    // Apply date range filter if needed
    startDate: undefined,
    endDate: undefined,
  });

  // Filter classes based on active filters
  const filteredClasses = classes?.filter((cls) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        cls.template.name.toLowerCase().includes(searchLower) ||
        cls.enrollments?.some(e => 
          e.student_enrollment.full_name.toLowerCase().includes(searchLower)
        ) ||
        cls.template.group?.name.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (filters.level && cls.template.level !== filters.level) return false;
    if (filters.status && cls.status !== filters.status) return false;
    if (filters.groupId && cls.template.group_id !== filters.groupId) return false;

    return true;
  }) || [];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'iniciacion': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermedio': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'avanzado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Lista de Clases ({filteredClasses.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredClasses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron clases que coincidan con los filtros seleccionados.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clase</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Alumnos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Pista</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((cls) => {
                  const enrolledCount = cls.enrollments?.length || 0;
                  const availableSpots = cls.max_students - enrolledCount;

                  return (
                    <TableRow key={cls.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{cls.template.name}</div>
                          <div className="flex items-center gap-2">
                            <Badge className={getLevelColor(cls.template.level)}>
                              {cls.template.level}
                            </Badge>
                            {cls.template.group && (
                              <Badge variant="outline">
                                {cls.template.group.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {format(parseISO(cls.class_date), "dd/MM/yyyy", { locale: es })}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {cls.start_time.slice(0, 5)} - {cls.end_time.slice(0, 5)}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span className={enrolledCount >= cls.max_students ? "text-red-600 font-medium" : ""}>
                            {enrolledCount}/{cls.max_students}
                          </span>
                          {availableSpots > 0 && (
                            <Badge variant="outline" className="ml-2">
                              {availableSpots} disponibles
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge className={getStatusColor(cls.status)}>
                          {getStatusLabel(cls.status)}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {cls.court_number && (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            Pista {cls.court_number}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedClass(cls)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Gestionar alumnos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Cancelar clase
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Class details modal */}
        <Dialog open={!!selectedClass} onOpenChange={() => setSelectedClass(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Detalles de la Clase
              </DialogTitle>
            </DialogHeader>

            {selectedClass && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedClass.template.name}</h3>
                  <Badge className={getLevelColor(selectedClass.template.level)}>
                    {selectedClass.template.level}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Fecha</div>
                    <div className="font-medium">
                      {format(parseISO(selectedClass.class_date), "dd/MM/yyyy", { locale: es })}
                    </div>
                  </div>

                  <div>
                    <div className="text-muted-foreground">Hora</div>
                    <div className="font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {selectedClass.start_time.slice(0, 5)} - {selectedClass.end_time.slice(0, 5)}
                    </div>
                  </div>

                  <div>
                    <div className="text-muted-foreground">Alumnos</div>
                    <div className="font-medium flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {selectedClass.enrollments?.length || 0}/{selectedClass.max_students}
                    </div>
                  </div>

                  {selectedClass.court_number && (
                    <div>
                      <div className="text-muted-foreground">Pista</div>
                      <div className="font-medium flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Pista {selectedClass.court_number}
                      </div>
                    </div>
                  )}
                </div>

                {selectedClass.template.group && (
                  <div>
                    <div className="text-muted-foreground text-sm">Grupo</div>
                    <div className="font-medium">{selectedClass.template.group.name}</div>
                  </div>
                )}

                {selectedClass.template.objective && (
                  <div>
                    <div className="text-muted-foreground text-sm">Objetivo</div>
                    <div className="text-sm">{selectedClass.template.objective}</div>
                  </div>
                )}

                {selectedClass.enrollments && selectedClass.enrollments.length > 0 && (
                  <div>
                    <div className="text-muted-foreground text-sm mb-2">Alumnos inscritos</div>
                    <div className="space-y-1">
                      {selectedClass.enrollments.map((enrollment) => (
                        <div key={enrollment.id} className="text-sm p-2 bg-muted rounded">
                          {enrollment.student_enrollment.full_name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Gestionar alumnos
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
