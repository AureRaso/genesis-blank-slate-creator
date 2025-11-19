/**
 * Obtiene la URL base de la aplicación, siempre con www
 * Esto asegura que todos los enlaces generados sean consistentes
 * y compartan el mismo localStorage entre sesiones
 */
export const getBaseUrl = (): string => {
  // En desarrollo, usar window.location.origin
  if (import.meta.env.DEV) {
    return window.location.origin;
  }

  // En producción, siempre usar www.padelock.com
  return 'https://www.padelock.com';
};

/**
 * Genera una URL de waitlist con el formato correcto
 */
export const getWaitlistUrl = (classId: string, date: string): string => {
  return `${getBaseUrl()}/waitlist/${classId}/${date}`;
};
