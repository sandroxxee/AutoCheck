import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Wifi } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setJustReconnected(true);
      const timer = setTimeout(() => setJustReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setJustReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (justReconnected) {
    return (
      <aside
        aria-label="Notificação de conexão restabelecida"
        className="fixed bottom-4 right-4 z-50 bg-emerald-950/95 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs animate-in slide-in-from-bottom-3 duration-300"
      >
        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Wifi className="w-4 h-4" />
        </div>
        <div>
          <p className="font-bold text-white">Conexão restabelecida</p>
          <p className="text-[11px] text-emerald-300/80">O AutoCheck Brasil voltou a operar normalmente.</p>
        </div>
      </aside>
    );
  }

  if (!isOffline) return null;

  return (
    <aside
      aria-label="Alerta de conexão perdida"
      className="fixed bottom-4 right-4 z-50 max-w-md bg-amber-950/95 border border-amber-500/40 text-amber-200 p-4 rounded-2xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
          <WifiOff className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">Você está offline</p>
          <p className="text-xs text-amber-300/80 leading-relaxed">
            Sua conexão com a internet foi interrompida. Consultas em tempo real do Detran/SINESP necessitam de rede ativa.
          </p>
          <button
            id="offline-retry-btn"
            onClick={() => window.location.reload()}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-semibold text-amber-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar reconectar
          </button>
        </div>
      </div>
    </aside>
  );
};
