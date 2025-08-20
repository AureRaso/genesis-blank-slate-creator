import { useEffect, useCallback } from 'react';
import { UseFormWatch, UseFormSetValue, FieldValues, Path } from 'react-hook-form';

interface UseFormPersistenceOptions<T extends FieldValues> {
  key: string;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  exclude?: Array<Path<T>>;
}

export function useFormPersistence<T extends FieldValues>({
  key,
  watch,
  setValue,
  exclude = []
}: UseFormPersistenceOptions<T>) {
  
  // Cargar datos guardados al inicializar
  useEffect(() => {
    const savedData = localStorage.getItem(key);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        Object.keys(parsedData).forEach((fieldName) => {
          if (!exclude.includes(fieldName as Path<T>)) {
            setValue(fieldName as Path<T>, parsedData[fieldName]);
          }
        });
      } catch (error) {
        console.error('Error loading form data from localStorage:', error);
        localStorage.removeItem(key);
      }
    }
  }, [key, setValue, exclude]);

  // Guardar datos cuando cambien
  useEffect(() => {
    const subscription = watch((data) => {
      try {
        // Filtrar campos excluidos
        const dataToSave = { ...data };
        exclude.forEach(field => {
          delete dataToSave[field];
        });
        
        localStorage.setItem(key, JSON.stringify(dataToSave));
      } catch (error) {
        console.error('Error saving form data to localStorage:', error);
      }
    });

    return () => subscription.unsubscribe();
  }, [key, watch, exclude]);

  // Función para limpiar los datos guardados
  const clearPersistedData = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  return { clearPersistedData };
}