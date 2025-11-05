import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ITEMS_PER_PAGE = 5;

const HistorialPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  // Obtener el usuario actual
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Obtener las clases pasadas del usuario
  const { data: historicalClasses, isLoading } = useQuery({
    queryKey: ["historical-classes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const today = format(new Date(), 'yyyy-MM-dd');

      // Step 1: Get student enrollment IDs for this user
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('id')
        .or(`student_profile_id.eq.${user.id},email.eq.${user.email}`);

      if (enrollmentError) {
        console.error('Error fetching enrollments:', enrollmentError);
        throw enrollmentError;
      }

      if (!enrollments || enrollments.length === 0) {
        return [];
      }

      const enrollmentIds = enrollments.map(e => e.id);

      // Step 2: Get class participants using enrollment IDs
      const { data, error } = await supabase
        .from("class_participants")
        .select(`
          id,
          class_date,
          programmed_class:programmed_classes (
            id,
            name,
            start_time,
            end_time,
            location
          )
        `)
        .in("student_enrollment_id", enrollmentIds)
        .lt("class_date", today)
        .order("class_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Calcular paginación
  const totalPages = Math.ceil((historicalClasses?.length || 0) / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentClasses = historicalClasses?.slice(startIndex, endIndex) || [];

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl p-4 sm:p-6 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#10172a]">
              Historial de Clases
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Todas tus clases anteriores
            </p>
          </div>
        </div>
      </div>

      {/* Lista de clases */}
      {currentClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No hay clases en tu historial
          </h3>
          <p className="text-sm text-gray-500 max-w-md">
            Cuando completes tus primeras clases, aparecerán aquí para que puedas revisarlas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentClasses.map((classItem: any) => {
            const classData = classItem.programmed_class;
            const classDate = new Date(classItem.class_date);

            return (
              <div
                key={classItem.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#10172a] mb-2">
                      {classData.name}
                    </h3>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>
                          {format(classDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>
                          {classData.start_time.substring(0, 5)} - {classData.end_time.substring(0, 5)}
                        </span>
                      </div>

                      {classData.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                          <span>{classData.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          <div className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default HistorialPage;
