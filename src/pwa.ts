import { registerSW } from 'virtual:pwa-register';

export function registerPWA(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const updateSW = registerSW({
        onNeedRefresh() {
          console.log('[AutoCheck PWA] Nova versão detectada. Atualizando cache e recursos...');
          updateSW(true);
        },
        onOfflineReady() {
          console.log('[AutoCheck PWA] App shell e recursos cacheados com sucesso. Pronto para uso offline.');
        },
        onRegistered(registration) {
          if (registration) {
            console.log('[AutoCheck PWA] Service Worker ativo:', registration.scope);
          }
        },
        onRegisterError(error) {
          console.warn('[AutoCheck PWA] Falha ao registrar Service Worker:', error);
        }
      });
    } catch (err) {
      console.warn('[AutoCheck PWA] Registro ignorado ou não suportado:', err);
    }
  }
}

