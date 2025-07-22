
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
import type { ClassFiltersData } from "@/contexts/ClassFiltersContext";

interface ClassListViewProps {
  clubId?: string;
  filters: ClassFiltersData;
}

export default function ClassListView({ clubId, filters }: ClassListViewProps) {
  const [selectedClass, setSelectedClass] = useState<ScheduledClassWithTemplate | null>(null);
  
  const { data: classes, isLoading } = useScheduledClasses({
    clubId: clubId,
  });

  // Aplicar todos los filtros
  const filteredClasses = classes?.filter((cls) => {
    // Filtro de búsqueda existente
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        cls.name.toLowerCase().includes(searchLower) ||
        cls.participants?.some(p => 
          p.student_enrollment.full_name.toLowerCase().includes(searchLower)
        );
      if (!matchesSearch) return false;
    }

    // Filtro por tamaño de grupo
    const participantCount = cls.participants?.length || 0;
    if (filters.minGroupSize !== undefined && participantCount < filters.minGroupSize) return false;
    if (filters.maxGroupSize !== undefined && participantCount > filters.maxGroupSize) return false;

    // Filtro por nivel numérico
    if (filters.levelFrom !== undefined && cls.level_from !== undefined && cls.level_from < filters.levelFrom) return false;
    if (filters.levelTo !== undefined && cls.level_to !== undefined && cls.level_to > filters.levelTo) return false;

    // Filtro por niveles personalizados
    if (filters.customLevels.length > 0 && cls.custom_level) {
      if (!filters.customLevels.includes(cls.custom_level)) return false;
    }

    // Filtro por días de la semana
    if (filters.weekDays.length > 0) {
      const hasMatchingDay = cls.days_of_week.some(day => 
        filters.weekDays.includes(day.toLowerCase())
      );
      if (!hasMatchingDay) return false;
    }

    // Filtro por nombre/email de alumno
    if (filters.studentName) {
      const studentNameLower = filters.studentName.toLowerCase();
      const hasMatchingStudent = cls.participants?.some(p => 
        p.student_enrollment.full_name.toLowerCase().includes(studentNameLower) ||
        p.student_enrollment.email.toLowerCase().includes(studentNameLower)
      );
      if (!hasMatchingStudent) return false;
    }

    // Filtro por descuentos
    if (filters.withDiscountOnly) {
      const hasDiscount = cls.participants?.some(p => 
        (p.discount_1 !== null && p.discount_1 > 0) ||
        (p.discount_2 !== null && p.discount_2 > 0)
      );
      if (!hasDiscount) return false;
    }

    return true;
  }) || [];

  const getLevelDisplay = (cls: ScheduledClassWithTemplate) => {
    if (cls.custom_level) {
      return cls.custom_level.replace('_', ' ');
    }
    if (cls.level_from && cls.level_to) {
      return cls.level_from === cls.level_to ? 
        `Nivel ${cls.level_from}` : 
        `Nivel ${cls.level_from}-${cls.level_to}`;
    }
    return 'Sin nivel';
  };

  const getLevelColor = (cls: ScheduledClassWithTemplate) => {
    if (cls.custom_level) {
      if (cls.custom_level.includes('primera')) return 'bg-green-100 text-green-800 border-green-200';
      if (cls.custom_level.includes('segunda')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      if (cls.custom_level.includes('tercera')) return 'bg-red-100 text-red-800 border-red-200';
    }
    
    if (cls.level_from) {
      if (cls.level_from <= 3) return 'bg-green-100 text-green-800 border-green-200';
      if (cls.level_from <= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    return 'bg-gray-100 text-gray-800 border-gray-200';
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
                  <TableHead>Horario</TableHead>
                  <TableHead>Alumnos</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Días</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((cls) => {
                  const enrolledCount = cls.participants?.length || 0;

                  return (
                    <TableRow key={cls.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{cls.name}</div>
                          <div className="flex items-center gap-2">
                            <Badge className={getLevelColor(cls)}>
                              {getLevelDisplay(cls)}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {cls.start_time.slice(0, 5)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {cls.duration_minutes} min
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{enrolledCount}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {format(parseISO(cls.start_date), "dd/MM/yy")} - {format(parseISO(cls.end_date), "dd/MM/yy")}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {cls.days_of_week.join(', ')}
                        </div>
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
                  <h3 className="font-semibold text-lg">{selectedClass.name}</h3>
                  <Badge className={getLevelColor(selectedClass)}>
                    {getLevelDisplay(selectedClass)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Horario</div>
                    <div className="font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {selectedClass.start_time.slice(0, 5)}
                    </div>
                  </div>

                  <div>
                    <div className="text-muted-foreground">Duración</div>
                    <div className="font-medium">
                      {selectedClass.duration_minutes} min
                    </div>
                  </div>

                  <div>
                    <div className="text-muted-foreground">Alumnos</div>
                    <div className="font-medium flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {selectedClass.participants?.length || 0}
                    </div>
                  </div>

                  <div>
                    <div className="text-muted-foreground">Días</div>
                    <div className="font-medium">
                      {selectedClass.days_of_week.join(', ')}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-muted-foreground text-sm">Periodo</div>
                  <div className="font-medium">
                    {format(parseISO(selectedClass.start_date), "dd/MM/yyyy")} - {format(parseISO(selectedClass.end_date), "dd/MM/yyyy")}
                  </div>
                </div>

                {selectedClass.participants && selectedClass.participants.length > 0 && (
                  <div>
                    <div className="text-muted-foreground text-sm mb-2">Alumnos inscritos</div>
                    <div className="space-y-1">
                      {selectedClass.participants.map((participant) => (
                        <div key={participant.id} className="text-sm p-2 bg-muted rounded">
                          {participant.student_enrollment.full_name}
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
