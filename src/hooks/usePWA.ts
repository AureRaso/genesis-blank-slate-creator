import { useEffect } from 'react';

/**
 * Hook para registrar y manejar el Service Worker de la PWA
 * Actualiza automáticamente la app cuando hay una nueva versión disponible
 * Soporta Android (Service Worker completo) e iOS (limitado)
 */
export const usePWA = () => {
  useEffect(() => {
    // Detectar iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;

    // Solo registrar en producción
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    if ('serviceWorker' in navigator) {
      // Registrar el service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Verificar actualizaciones cada hora
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // 1 hora

          // Escuchar cuando hay una nueva versión esperando
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Hay una nueva versión disponible - Notificar al nuevo SW que tome control inmediatamente
                  newWorker.postMessage({ type: 'SKIP_WAITING' });

                  // Recargar la página después de 1 segundo
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                }
              });
            }
          });
        })
        .catch(() => {
          // Service Worker registration failed silently
        });
    }
  }, []);
};
