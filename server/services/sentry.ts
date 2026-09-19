import * as Sentry from '@sentry/node';

let isSentryInitialized = false;

export function initServerSentry(): void {
  const dsn = (process.env.SENTRY_DSN || '').trim();

  if (!dsn) {
    // Sentry configurado em modo silencioso/no-op quando não houver DSN
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'production',
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.2'),
      // Ignora erros esperados de requisições de usuário (ex: validação de formato de placa)
      ignoreErrors: [
        'Placa inválida',
        'Parâmetros inválidos',
        'Usuário não autenticado',
        'Saldo insuficiente'
      ]
    });
    isSentryInitialized = true;
    console.log('[Sentry] SDK Node inicializado com sucesso para monitoramento silencioso de erros e performance.');
  } catch (err) {
    console.warn('[Sentry] Aviso: Falha ao inicializar Sentry no servidor:', err);
  }
}

/**
 * Captura exceções e falhas em APIs parceiras silenciosamente no Sentry
 */
export function captureApiException(error: unknown, context?: {
  provider?: string;
  endpoint?: string;
  plate?: string;
  status?: number;
  extras?: Record<string, any>;
}): void {
  if (!isSentryInitialized) {
    return;
  }

  try {
    Sentry.withScope((scope) => {
      if (context?.provider) scope.setTag('provider', context.provider);
      if (context?.endpoint) scope.setTag('endpoint', context.endpoint);
      if (context?.plate) scope.setExtra('plate_hash', context.plate.substring(0, 3) + '***');
      if (context?.status) scope.setTag('http_status', String(context.status));
      if (context?.extras) scope.setExtras(context.extras);

      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(String(error), 'error');
      }
    });
  } catch {
    // Falha silenciosa para nunca interromper a aplicação
  }
}

/**
 * Rastreia performance e latência de consultas aos gateways veiculares
 */
export function trackApiPerformance(provider: string, endpoint: string, durationMs: number, success: boolean): void {
  if (!isSentryInitialized) return;

  try {
    if (durationMs > 5000 || !success) {
      Sentry.captureMessage(
        `Alerta de Latência/Falha de Gateway: ${provider} demorou ${durationMs}ms (sucesso=${success})`,
        success ? 'warning' : 'error'
      );
    }
  } catch {
    // Falha silenciosa
  }
}
