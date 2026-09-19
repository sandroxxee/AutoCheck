import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { registerPWA } from './pwa.ts';
import { initClientSentry, captureClientError } from './services/sentryClient.ts';
import './index.css';

// Inicializa o Sentry para rastreamento silencioso de erros no frontend
initClientSentry();

// Limpa service workers antigos de cache para manter o app sempre rápido e leve
registerPWA();

// Tratamento global de erros não capturados para não travar a aplicação
window.addEventListener('unhandledrejection', (event) => {
  // Evita poluição do console e reações não tratadas de rede
  if (event && event.reason) {
    console.warn('[AutoCheck] Operação assíncrona tratada:', event.reason?.message || event.reason);
    captureClientError(event.reason, { type: 'unhandledrejection' });
  }
  event.preventDefault();
});

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}





