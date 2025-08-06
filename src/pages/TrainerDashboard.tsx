import { useState } from "react";
import { Calendar, Plus, Clock, Users, Edit, Trash2, Eye, UserPlus, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useMyTrainerProfile } from "@/hooks/useTrainers";
import { useProgrammedClasses, useDeleteProgrammedClass } from "@/hooks/useProgrammedClasses";
import ScheduledClassForm from "@/components/ScheduledClassForm";
import StudentEnrollmentForm from "@/components/StudentEnrollmentForm";
import StudentsList from "@/components/StudentsList";
import ClassGroupsManager from "@/components/ClassGroupsManager";
import TrainerNotifications from "@/components/TrainerNotifications";
import { ProgrammedClass } from "@/hooks/useProgrammedClasses";
import { StudentEnrollment } from "@/hooks/useStudentEnrollments";
import { Link } from "react-router-dom";
const TrainerDashboard = () => {
  const [showClassForm, setShowClassForm] = useState(false);
  const [editingClass, setEditingClass] = useState<ProgrammedClass | undefined>();
  const [viewingClass, setViewingClass] = useState<ProgrammedClass | undefined>();
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentEnrollment | undefined>();
  const [viewingStudent, setViewingStudent] = useState<StudentEnrollment | undefined>();
  const {
    data: trainerProfile,
    isLoading: profileLoading
  } = useMyTrainerProfile();
  
  // Get trainer's club ID
  const trainerClubId = trainerProfile?.trainer_clubs?.[0]?.club_id;
  
  const {
    data: myClasses,
    isLoading: classesLoading
  } = useProgrammedClasses(trainerClubId);
  const deleteMutation = useDeleteProgrammedClass();
  const handleCloseClassForm = () => {
    setShowClassForm(false);
    setEditingClass(undefined);
  };
  const handleCreateNewClass = () => {
    setEditingClass(undefined);
    setShowClassForm(true);
  };
  const handleEditClass = (programmedClass: ProgrammedClass) => {
    setEditingClass(programmedClass);
    setShowClassForm(true);
  };
  const handleViewClass = (programmedClass: ProgrammedClass) => {
    setViewingClass(programmedClass);
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
    return <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>;
  }
  if (showClassForm) {
    return <div className="space-y-6">
        <ScheduledClassForm 
          onClose={handleCloseClassForm} 
          clubId={trainerClubId || ""} 
          trainerProfileId={trainerProfile?.id || ""} 
        />
      </div>;
  }
  if (showStudentForm) {
    return <div className="space-y-6">
        <StudentEnrollmentForm onClose={handleCloseStudentForm} trainerProfile={trainerProfile} />
      </div>;
  }
  return <div className="space-y-6">
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
      {trainerProfile && <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Mi Club</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-playtomic-orange border-playtomic-orange">
              {clubName}
            </Badge>
            {trainerProfile.trainer_clubs && trainerProfile.trainer_clubs.length > 0 && <div className="mt-2 text-sm text-muted-foreground">
                Asignado al club: {trainerProfile.trainer_clubs[0]?.clubs?.name}
              </div>}
          </CardContent>
        </Card>}

      {/* Notifications Section */}
      <TrainerNotifications />

      {/* Tabs Section */}
      <Tabs defaultValue="classes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="classes">Clases</TabsTrigger>
          <TabsTrigger value="students">Alumnos</TabsTrigger>
          <TabsTrigger value="groups">Grupos</TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Mis Clases</h2>
              <p className="text-muted-foreground">Gestiona tus clases de pádel</p>
            </div>
            
          </div>

          {classesLoading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({
            length: 3
          }).map((_, i) => <Card key={i} className="animate-pulse">
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
                </Card>)}
            </div> : !myClasses || myClasses.length === 0 ? <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Aún no tienes clases activas</h3>
                <p className="text-muted-foreground mb-6">
                  Crea tu primera clase para comenzar a gestionar tu disponibilidad
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleCreateNewClass} className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark" size="lg">
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
            </Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myClasses.map(programmedClass => <Card key={programmedClass.id} className="hover:shadow-lg transition-all duration-300 group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">{programmedClass.name}</CardTitle>
                        <CardDescription>
                          {programmedClass.trainer?.full_name} - Pista {programmedClass.court_number || "No asignada"}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => handleViewClass(programmedClass)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditClass(programmedClass)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClass(programmedClass.id)} className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {programmedClass.days_of_week.join(", ")}
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      {programmedClass.start_time} ({programmedClass.duration_minutes} min)
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      {programmedClass.participants?.length || 0} / 4 alumnos
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <Badge variant="outline" className="text-xs">
                        {programmedClass.custom_level || `${programmedClass.level_from || 1}-${programmedClass.level_to || 10}`}
                      </Badge>
                      <span className="text-sm font-medium text-playtomic-orange">
                        {programmedClass.start_date} - {programmedClass.end_date}
                      </span>
                    </div>
                  </CardContent>
                </Card>)}
            </div>}
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

          <StudentsList onViewStudent={handleViewStudent} onEditStudent={handleEditStudent} onDeleteStudent={handleDeleteStudent} />
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-6">
          <ClassGroupsManager />
        </TabsContent>
      </Tabs>

      {/* Class Details Modal - TODO: Create ProgrammedClassDetailsModal */}
      {viewingClass && (
        <div>
          {/* Placeholder for programmed class details modal */}
        </div>
      )}
    </div>;
};
export default TrainerDashboard;