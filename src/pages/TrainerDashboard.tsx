import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Plus, Clock, Users, Edit, Trash2, Eye, UserPlus, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useMyTrainerProfile } from "@/hooks/useTrainers";
import { useProgrammedClasses, useDeleteProgrammedClass } from "@/hooks/useProgrammedClasses";
import StudentEnrollmentForm from "@/components/StudentEnrollmentForm";
import TrainerStudentsList from "@/components/TrainerStudentsList";
import ClassGroupsManager from "@/components/ClassGroupsManager";
import TrainerNotifications from "@/components/TrainerNotifications";
import WaitlistDebugger from "@/components/WaitlistDebugger";
import StudentEditModal from "@/components/StudentEditModal";
import { AssignStudentToClassModal } from "@/components/AssignStudentToClassModal";
import { ProgrammedClass } from "@/hooks/useProgrammedClasses";
import { StudentEnrollment, useDeleteStudentEnrollment } from "@/hooks/useStudentEnrollments";
import { Link } from "react-router-dom";
import { usePageStatePersistence } from "@/hooks/usePageStatePersistence";
import { useWindowVisibility } from "@/hooks/useWindowVisibility";

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const isWindowVisible = useWindowVisibility();
  const { savePageState, loadPageState, clearPageState } = usePageStatePersistence('trainer-dashboard');

  // Initialize state with persisted values
  const getInitialState = () => {
    const saved = loadPageState();
    return {
      showClassForm: saved?.showForm && saved?.formType === 'class' || false,
      showStudentForm: saved?.showForm && saved?.formType === 'student' || false,
      activeTab: saved?.activeTab || 'classes',
      editingId: saved?.editingId
    };
  };

  const initialState = getInitialState();
  const [showClassForm, setShowClassForm] = useState(initialState.showClassForm);
  const [editingClass, setEditingClass] = useState<ProgrammedClass | undefined>();
  const [viewingClass, setViewingClass] = useState<ProgrammedClass | undefined>();
  const [showStudentForm, setShowStudentForm] = useState(initialState.showStudentForm);
  const [editingStudent, setEditingStudent] = useState<StudentEnrollment | undefined>();
  const [viewingStudent, setViewingStudent] = useState<StudentEnrollment | undefined>();
  const [assigningStudent, setAssigningStudent] = useState<StudentEnrollment | undefined>();
  const [activeTab, setActiveTab] = useState(initialState.activeTab);
  const [isStudentEditModalOpen, setIsStudentEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Persist state changes
  useEffect(() => {
    if (!isWindowVisible) return; // Don't persist when window is not visible
    
    savePageState({
      activeTab,
      showForm: showClassForm || showStudentForm,
      formType: showClassForm ? 'class' : showStudentForm ? 'student' : undefined,
      editingId: editingClass?.id || editingStudent?.id
    });
  }, [activeTab, showClassForm, showStudentForm, editingClass?.id, editingStudent?.id, isWindowVisible, savePageState]);
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
  const deleteStudentMutation = useDeleteStudentEnrollment();
  const handleCloseClassForm = () => {
    setShowClassForm(false);
    setEditingClass(undefined);
  };
  const handleCreateNewClass = () => {
    navigate('/dashboard/scheduled-classes/new');
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
    setIsStudentEditModalOpen(true);
  };
  const handleDeleteStudent = (studentId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar completamente este alumno? Esta acción no se puede deshacer.')) {
      deleteStudentMutation.mutate(studentId);
    }
  };

  const handleAssignToClass = (student: StudentEnrollment) => {
    setAssigningStudent(student);
    setIsAssignModalOpen(true);
  };
  const handleCloseStudentForm = () => {
    setShowStudentForm(false);
    setEditingStudent(undefined);
    clearPageState();
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
  return <div className="space-y-3 sm:space-y-4 md:space-y-6 p-2 sm:p-0">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark bg-clip-text text-transparent truncate">
            Panel del Profesor
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground truncate">
            Bienvenido, {trainerName}
          </p>
        </div>

        {/* Desktop Quick Actions */}
        <div className="hidden sm:flex gap-2 flex-shrink-0">
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/students">
              <Users className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden lg:inline">Gestionar Alumnos</span>
              <span className="lg:hidden">Alumnos</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/scheduled-classes">
              <CalendarCheck className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden lg:inline">Clases Programadas</span>
              <span className="lg:hidden">Clases</span>
            </Link>
          </Button>
        </div>

        {/* Mobile Quick Actions */}
        <div className="flex sm:hidden gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to="/dashboard/students">
              <Users className="h-4 w-4 sm:mr-2" />
              <span className="ml-1">Alumnos</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to="/dashboard/scheduled-classes">
              <CalendarCheck className="h-4 w-4 sm:mr-2" />
              <span className="ml-1">Clases</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Debug Section - Remove in production */}
      <WaitlistDebugger />

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="classes" className="text-xs sm:text-sm">Clases</TabsTrigger>
          <TabsTrigger value="students" className="text-xs sm:text-sm">Alumnos</TabsTrigger>
          <TabsTrigger value="groups" className="text-xs sm:text-sm">Grupos</TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-3 sm:space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold truncate">Mis Clases</h2>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Gestiona tus clases de pádel</p>
            </div>
          </div>

          {classesLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {Array.from({
            length: 3
          }).map((_, i) => <Card key={i} className="animate-pulse">
                  <CardHeader className="p-3 sm:p-6">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                    <div className="space-y-2">
                      <div className="h-2 sm:h-3 bg-gray-200 rounded"></div>
                      <div className="h-2 sm:h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>)}
            </div> : !myClasses || myClasses.length === 0 ? <Card>
              <CardContent className="text-center py-8 sm:py-12 px-3 sm:px-6">
                <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg md:text-xl font-medium mb-2">Aún no tienes clases activas</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                  Crea tu primera clase para comenzar a gestionar tu disponibilidad
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                  <Button onClick={handleCreateNewClass} className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark" size="sm">
                    <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">Crear Primera Clase</span>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/scheduled-classes">
                      <CalendarCheck className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-sm sm:text-base">Ver Clases Programadas</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {myClasses.map(programmedClass => <Card key={programmedClass.id} className="hover:shadow-lg transition-all duration-300 group">
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm sm:text-base md:text-lg line-clamp-2">{programmedClass.name}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm truncate">
                          {programmedClass.trainer?.full_name} - Pista {programmedClass.court_number || "No asignada"}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-0 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => handleViewClass(programmedClass)} className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditClass(programmedClass)} className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClass(programmedClass.id)} className="text-red-600 hover:text-red-700 h-7 w-7 sm:h-8 sm:w-8 p-0">
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6 pt-0 sm:pt-0">
                    <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{programmedClass.days_of_week.join(", ")}</span>
                    </div>

                    <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{programmedClass.start_time} ({programmedClass.duration_minutes} min)</span>
                    </div>

                    <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                      {programmedClass.participants?.length || 0} / 4 alumnos
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t">
                      <Badge variant="outline" className="text-xs w-fit">
                        {programmedClass.custom_level || `${programmedClass.level_from || 1}-${programmedClass.level_to || 10}`}
                      </Badge>
                      <span className="text-xs sm:text-sm font-medium text-playtomic-orange truncate">
                        {programmedClass.start_date} - {programmedClass.end_date}
                      </span>
                    </div>
                  </CardContent>
                </Card>)}
            </div>}
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-3 sm:space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold truncate">Mis Alumnos</h2>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Gestiona las inscripciones de tus alumnos</p>
            </div>
            <Button onClick={handleCreateNewStudent} className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark flex-shrink-0" size="sm">
              <UserPlus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-sm sm:text-base">Nueva Inscripción</span>
            </Button>
          </div>

          <TrainerStudentsList 
            onViewStudent={handleViewStudent} 
            onEditStudent={handleEditStudent} 
            onDeleteStudent={handleDeleteStudent}
            onAssignToClass={handleAssignToClass}
          />
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-6">
          <ClassGroupsManager />
        </TabsContent>
      </Tabs>

      {/* Student Edit Modal */}
      <StudentEditModal
        student={editingStudent || null}
        isOpen={isStudentEditModalOpen}
        onClose={() => {
          setIsStudentEditModalOpen(false);
          setEditingStudent(undefined);
        }}
      />

      {/* Assign Student to Class Modal */}
      <AssignStudentToClassModal
        student={assigningStudent || null}
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setAssigningStudent(undefined);
        }}
      />

      {/* Class Details Modal - TODO: Create ProgrammedClassDetailsModal */}
      {viewingClass && (
        <div>
          {/* Placeholder for programmed class details modal */}
        </div>
      )}
    </div>;
};
export default TrainerDashboard;