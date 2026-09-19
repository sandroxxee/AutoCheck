import * as Sentry from '@sentry/react';

let isClientSentryInitialized = false;

export function initClientSentry(): void {
  const dsn = (import.meta.env.VITE_SENTRY_DSN || '').trim();

  if (!dsn) {
    // Sentry configurado silencioso no cliente quando não houver DSN configurado
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE || 'production',
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      tracesSampleRate: 0.2,
      // Não logar erros corriqueiros de rede offline do usuário
      ignoreErrors: [
        'NetworkError',
        'Failed to fetch',
        'Load failed',
        'ResizeObserver loop'
      ]
    });
    isClientSentryInitialized = true;
    console.log('[Sentry] SDK React Web inicializado para monitoramento silencioso de erros de interface.');
  } catch (err) {
    console.warn('[Sentry] Aviso: Falha ao inicializar Sentry no cliente:', err);
  }
}

export function captureClientError(error: unknown, context?: Record<string, any>): void {
  if (!isClientSentryInitialized) return;

  try {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context);
      }
      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(String(error), 'error');
      }
    });
  } catch {
    // Silencioso
  }
}

export const SentryErrorBoundary = Sentry.ErrorBoundary;
