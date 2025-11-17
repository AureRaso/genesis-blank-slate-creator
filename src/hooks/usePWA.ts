import { useEffect } from 'react';

/**
 * Hook para registrar y manejar el Service Worker de la PWA
 * Actualiza automáticamente la app cuando hay una nueva versión disponible
 */
export const usePWA = () => {
  useEffect(() => {
    // Solo registrar en producción
    if (process.env.NODE_ENV !== 'production') {
      console.log('[PWA] Service Worker disabled in development');
      return;
    }

    if ('serviceWorker' in navigator) {
      // Registrar el service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope);

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
                  // Hay una nueva versión disponible
                  console.log('[PWA] New version available! Updating...');

                  // Notificar al nuevo SW que tome control inmediatamente
                  newWorker.postMessage({ type: 'SKIP_WAITING' });

                  // Recargar la página después de 1 segundo
                  setTimeout(() => {
                    console.log('[PWA] Reloading to activate new version...');
                    window.location.reload();
                  }, 1000);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });

      // Manejar cuando el service worker toma control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Service Worker updated and active');
      });
    } else {
      console.log('[PWA] Service Workers not supported in this browser');
    }
  }, []);
};
