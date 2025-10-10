import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Plus, X, Search, Clock, Calendar as CalendarIcon, Award } from "lucide-react";
import { useAdminStudentEnrollments } from "@/hooks/useStudentEnrollments";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StudentAssignmentStepProps {
  classes: Array<{
    id: string;
    name: string;
    day_of_week: string;
    start_time: string;
    court_number: number;
    trainer_name: string;
    max_participants: number;
    level_from: number;
    level_to: number;
    participant_ids?: string[];
  }>;
  clubId: string;
  onAssignmentChange: (classId: string, participantIds: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

interface StudentWithAssignment {
  id: string;
  full_name: string;
  email: string;
  level: number;
  phone: string;
  weekly_days?: string[];
  preferred_times?: string[];
}

export function StudentAssignmentStep({
  classes,
  clubId,
  onAssignmentChange,
  onNext,
  onBack
}: StudentAssignmentStepProps) {
  const { data: allStudents = [] } = useAdminStudentEnrollments(clubId);
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Group classes by day + time + court (to assign same students to all dates)
  const groupedClasses = classes.reduce((acc, cls) => {
    const key = `${cls.day_of_week}-${cls.start_time}-${cls.court_number}`;
    if (!acc[key]) {
      acc[key] = {
        key,
        day_of_week: cls.day_of_week,
        start_time: cls.start_time,
        court_number: cls.court_number,
        name: cls.name,
        trainer_name: cls.trainer_name,
        max_participants: cls.max_participants,
        level_from: cls.level_from,
        level_to: cls.level_to,
        classes: []
      };
    }
    acc[key].classes.push(cls);
    return acc;
  }, {} as Record<string, {
    key: string;
    day_of_week: string;
    start_time: string;
    court_number: number;
    name: string;
    trainer_name: string;
    max_participants: number;
    level_from: number;
    level_to: number;
    classes: typeof classes;
  }>);

  const selectedGroup = selectedGroupKey ? groupedClasses[selectedGroupKey] : null;

  const getStudentById = (id: string) => allStudents.find(s => s.id === id);

  const filteredStudents = allStudents.filter(student => {
    const matchesSearch =
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());

    // If a group is selected, filter by level compatibility
    if (selectedGroup) {
      const levelMatch = student.level >= selectedGroup.level_from && student.level <= selectedGroup.level_to;
      return matchesSearch && levelMatch;
    }

    return matchesSearch;
  });

  const handleOpenDialog = (groupKey: string) => {
    setSelectedGroupKey(groupKey);
    const group = groupedClasses[groupKey];
    // Get participants from the first class in the group (they should all have the same)
    setSelectedStudents(group.classes[0]?.participant_ids || []);
    setSearchTerm("");
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        // Check if we haven't exceeded max participants
        if (selectedGroup && prev.length >= selectedGroup.max_participants) {
          return prev;
        }
        return [...prev, studentId];
      }
    });
  };

  const handleSaveSelection = () => {
    if (selectedGroupKey && selectedGroup) {
      // Assign the same students to ALL classes in this group
      selectedGroup.classes.forEach(cls => {
        onAssignmentChange(cls.id, selectedStudents);
      });
      setSelectedGroupKey(null);
    }
  };

  const getTotalAssignedStudents = () => {
    return classes.reduce((total, cls) => total + (cls.participant_ids?.length || 0), 0);
  };

  const getDayLabel = (day: string) => {
    const days: Record<string, string> = {
      lunes: "Lun",
      martes: "Mar",
      miércoles: "Mié",
      jueves: "Jue",
      viernes: "Vie",
      sábado: "Sáb",
      domingo: "Dom"
    };
    return days[day] || day;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Asignar Alumnos a Clases
          </CardTitle>
          <Badge variant="secondary">
            {getTotalAssignedStudents()} alumnos asignados
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          Asigna alumnos a cada tramo horario. Los mismos alumnos se asignarán a todas las fechas de ese tramo.
        </div>

        {/* Grid of class groups */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
          {Object.values(groupedClasses).map((group) => {
            const assignedCount = group.classes[0]?.participant_ids?.length || 0;
            const isFull = assignedCount >= group.max_participants;
            const numDates = group.classes.length;

            return (
              <Card key={group.key} className={`${isFull ? 'border-green-500' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="space-y-2">
                    <div className="font-medium text-sm truncate">{group.name}</div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {getDayLabel(group.day_of_week)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {group.start_time}
                      </span>
                      <span>Pista {group.court_number}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {numDates} {numDates === 1 ? 'clase' : 'clases'}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={assignedCount > 0 ? "default" : "outline"} className="text-xs">
                        {assignedCount}/{group.max_participants} plazas
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <Award className="h-3 w-3 mr-1" />
                        Nivel {group.level_from}-{group.level_to}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* List of assigned students */}
                  {assignedCount > 0 && (
                    <div className="space-y-1 mb-3">
                      {group.classes[0]?.participant_ids?.map(studentId => {
                        const student = getStudentById(studentId);
                        if (!student) return null;
                        return (
                          <div key={studentId} className="flex items-center justify-between bg-muted/50 p-2 rounded text-xs">
                            <span className="truncate">{student.full_name}</span>
                            <Badge variant="outline" className="text-xs">
                              N{student.level}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add students button */}
                  <Dialog open={selectedGroupKey === group.key} onOpenChange={(open) => {
                    if (!open) {
                      setSelectedGroupKey(null);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleOpenDialog(group.key)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {assignedCount > 0 ? "Editar Alumnos" : "Añadir Alumnos"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Asignar Alumnos - {group.name}</DialogTitle>
                        <div className="text-sm text-muted-foreground">
                          {getDayLabel(group.day_of_week)} {group.start_time} • Pista {group.court_number} • Nivel {group.level_from}-{group.level_to}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Se asignarán a {numDates} {numDates === 1 ? 'clase' : 'clases'}
                        </div>
                        <div className="text-xs font-medium text-primary mt-2">
                          Los mismos alumnos se asignarán a todas las fechas de este tramo horario
                        </div>
                      </DialogHeader>

                      <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar alumno por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>

                        {/* Selection counter */}
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm">Alumnos seleccionados:</span>
                          <Badge variant={selectedStudents.length >= group.max_participants ? "default" : "secondary"}>
                            {selectedStudents.length}/{group.max_participants}
                          </Badge>
                        </div>

                        {/* Student list */}
                        <ScrollArea className="h-[400px] pr-4">
                          <div className="space-y-2">
                            {filteredStudents.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                No hay alumnos disponibles
                              </div>
                            ) : (
                              filteredStudents.map(student => {
                                const isSelected = selectedStudents.includes(student.id);
                                const isDisabled = !isSelected && selectedGroup && selectedStudents.length >= selectedGroup.max_participants;

                                return (
                                  <div
                                    key={student.id}
                                    className={`flex items-center space-x-3 p-3 border rounded-lg ${
                                      isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/50'
                                    }`}
                                    onClick={() => !isDisabled && handleToggleStudent(student.id)}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      disabled={isDisabled}
                                      onCheckedChange={() => handleToggleStudent(student.id)}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium truncate">{student.full_name}</div>
                                      <div className="text-sm text-muted-foreground truncate">{student.email}</div>
                                    </div>
                                    <Badge variant="outline">Nivel {student.level}</Badge>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </ScrollArea>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={() => setSelectedGroupKey(null)}
                          >
                            Cancelar
                          </Button>
                          <Button onClick={handleSaveSelection}>
                            Asignar a {selectedGroup?.classes.length || 0} clases
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            Anterior
          </Button>
          <div className="flex gap-2 items-center">
            <Button variant="ghost" onClick={onNext}>
              Saltar este paso
            </Button>
            <Button onClick={onNext}>
              Crear Clases
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
