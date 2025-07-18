import { useState } from "react";
import { Calendar, Plus, Clock, Users, Edit, Trash2, Eye, UserPlus, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useMyTrainerProfile } from "@/hooks/useTrainers";
import { useMyClassSlots, useDeleteClassSlot } from "@/hooks/useClassSlots";
import TrainerClassForm from "@/components/TrainerClassForm";
import ClassDetailsModal from "@/components/ClassDetailsModal";
import StudentEnrollmentForm from "@/components/StudentEnrollmentForm";
import StudentsList from "@/components/StudentsList";
import { ClassSlot } from "@/hooks/useClassSlots";
import { StudentEnrollment } from "@/hooks/useStudentEnrollments";
import { Link } from "react-router-dom";

const TrainerDashboard = () => {
  const [showClassForm, setShowClassForm] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSlot | undefined>();
  const [viewingClass, setViewingClass] = useState<ClassSlot | undefined>();
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentEnrollment | undefined>();
  const [viewingStudent, setViewingStudent] = useState<StudentEnrollment | undefined>();
  const { data: trainerProfile, isLoading: profileLoading } = useMyTrainerProfile();
  const { data: myClasses, isLoading: classesLoading } = useMyClassSlots();
  const deleteMutation = useDeleteClassSlot();

  const handleCloseClassForm = () => {
    setShowClassForm(false);
    setEditingClass(undefined);
  };

  const handleCreateNewClass = () => {
    setEditingClass(undefined);
    setShowClassForm(true);
  };

  const handleEditClass = (classSlot: ClassSlot) => {
    setEditingClass(classSlot);
    setShowClassForm(true);
  };

  const handleViewClass = (classSlot: ClassSlot) => {
    setViewingClass(classSlot);
  };

  const handleDeleteClass = (classId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta clase?')) {
      deleteMutation.mutate(classId);
    }
  };

  const handleCreateNewStudent = () => {
    setEditingStudent(undefined);
    setShowStudentForm(true);
  };

  const handleViewStudent = (student: StudentEnrollment) => {
    setViewingStudent(student);
  };

  const handleEditStudent = (student: StudentEnrollment) => {
    setEditingStudent(student);
    setShowStudentForm(true);
  };

  const handleDeleteStudent = (studentId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta inscripción?')) {
      // TODO: Implement delete student mutation
      console.log('Delete student:', studentId);
    }
  };

  const handleCloseStudentForm = () => {
    setShowStudentForm(false);
    setEditingStudent(undefined);
  };

  // Get club info from trainer profile - Updated to handle the correct structure
  const trainerClub = trainerProfile?.trainer_clubs?.[0];
  const clubName = trainerClub?.clubs?.name || 'Club no asignado';
  const trainerName = trainerProfile?.profiles?.full_name || 'Profesor';

  console.log('Trainer profile:', trainerProfile);
  console.log('Trainer club:', trainerClub);
  console.log('Club name:', clubName);

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (showClassForm) {
    return (
      <div className="space-y-6">
        <TrainerClassForm 
          onClose={handleCloseClassForm} 
          trainerProfile={trainerProfile}
          editingClass={editingClass}
        />
      </div>
    );
  }

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
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark bg-clip-text text-transparent">
            Panel del Profesor
          </h1>
          <p className="text-muted-foreground">
            Bienvenido, {trainerName}
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/scheduled-classes">
              <CalendarCheck className="mr-2 h-4 w-4" />
              Clases Programadas
            </Link>
          </Button>
        </div>
      </div>

      {/* Club Card */}
      {trainerProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Mi Club</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-playtomic-orange border-playtomic-orange">
              {clubName}
            </Badge>
            {trainerProfile.trainer_clubs && trainerProfile.trainer_clubs.length > 0 && (
              <div className="mt-2 text-sm text-muted-foreground">
                Asignado al club: {trainerProfile.trainer_clubs[0]?.clubs?.name}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs Section */}
      <Tabs defaultValue="classes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="classes">Clases</TabsTrigger>
          <TabsTrigger value="students">Alumnos</TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Mis Clases</h2>
              <p className="text-muted-foreground">Gestiona tus clases de pádel</p>
            </div>
            <Button onClick={handleCreateNewClass} className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Clase
            </Button>
          </div>

          {classesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !myClasses || myClasses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Aún no tienes clases activas</h3>
                <p className="text-muted-foreground mb-6">
                  Crea tu primera clase para comenzar a gestionar tu disponibilidad
                </p>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={handleCreateNewClass} 
                    className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark"
                    size="lg"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Crear Primera Clase
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/scheduled-classes">
                      <CalendarCheck className="mr-2 h-5 w-5" />
                      Ver Clases Programadas
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myClasses.map((classSlot) => (
                <Card key={classSlot.id} className="hover:shadow-lg transition-all duration-300 group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">{classSlot.objective}</CardTitle>
                        <CardDescription>
                          {classSlot.clubs?.name} - Pista {classSlot.court_number}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewClass(classSlot)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditClass(classSlot)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteClass(classSlot.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {classSlot.day_of_week}
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      {classSlot.start_time} ({classSlot.duration_minutes} min)
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      {classSlot.class_reservations?.length || 0} / {classSlot.max_players} alumnos
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <Badge variant="outline" className="text-xs">
                        {classSlot.level}
                      </Badge>
                      <span className="text-sm font-medium text-playtomic-orange">
                        {classSlot.price_per_player}€/persona
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Mis Alumnos</h2>
              <p className="text-muted-foreground">Gestiona las inscripciones de tus alumnos</p>
            </div>
            <Button onClick={handleCreateNewStudent} className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark">
              <UserPlus className="mr-2 h-4 w-4" />
              Nueva Inscripción
            </Button>
          </div>

          <StudentsList
            onViewStudent={handleViewStudent}
            onEditStudent={handleEditStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        </TabsContent>
      </Tabs>

      {/* Class Details Modal */}
      {viewingClass && (
        <ClassDetailsModal
          classSlot={viewingClass}
          onClose={() => setViewingClass(undefined)}
        />
      )}
    </div>
  );
};

export default TrainerDashboard;
