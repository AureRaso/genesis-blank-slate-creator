import { useUpdateScheduledClass } from './useScheduledClasses';
import { useToast } from './use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Day name mapping for different languages
const DAY_MAPPING_REVERSE: { [key: string]: string } = {
  'monday': 'lunes',
  'tuesday': 'martes', 
  'wednesday': 'miercoles',
  'thursday': 'jueves',
  'friday': 'viernes',
  'saturday': 'sabado',
  'sunday': 'domingo'
};

export const useClassDragDrop = () => {
  const updateClass = useUpdateScheduledClass();
  const { toast } = useToast();

  const handleClassDrop = async (classId: string, newDay: Date, newTimeSlot: string, currentClasses: any[]) => {
    try {
      // Find the class being moved
      const classToMove = currentClasses.find(cls => cls.id === classId);
      if (!classToMove) {
        throw new Error('Clase no encontrada');
      }

      // Get the new day name in Spanish (database format)
      const newDayName = format(newDay, 'EEEE', { locale: es }).toLowerCase();
      const normalizedDayName = DAY_MAPPING_REVERSE[newDayName] || newDayName;

      // Check if there's already a class at the target time slot
      const conflictingClass = currentClasses.find(cls => {
        if (cls.id === classId) return false; // Don't check against itself
        
        const classDays = cls.days_of_week.map((d: string) => d.toLowerCase().trim());
        const classTime = cls.start_time.slice(0, 5);
        
        return classDays.includes(normalizedDayName) && classTime === newTimeSlot;
      });

      if (conflictingClass) {
        toast({
          title: "Conflicto de horario",
          description: "Ya existe una clase en ese horario.",
          variant: "destructive",
        });
        return;
      }

      // Calculate if we need to update the days of the week
      const currentDays = classToMove.days_of_week;
      const targetDayInCurrent = currentDays.some((day: string) => {
        const normalized = day.toLowerCase().trim();
        return normalized === normalizedDayName;
      });

      // If the class is being moved to a different day, update the days_of_week
      let newDaysOfWeek = currentDays;
      if (!targetDayInCurrent) {
        // For now, replace the first day with the new day
        // In a more sophisticated implementation, you might want to ask the user
        newDaysOfWeek = [normalizedDayName];
      }

      // Update the class
      await updateClass.mutateAsync({
        id: classId,
        data: {
          start_time: newTimeSlot,
          days_of_week: newDaysOfWeek
        }
      });

      toast({
        title: "Clase movida",
        description: `La clase se ha movido al ${normalizedDayName} a las ${newTimeSlot}`,
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo mover la clase: " + error.message,
        variant: "destructive",
      });
    }
  };

  return {
    handleClassDrop,
    isUpdating: updateClass.isPending
  };
};