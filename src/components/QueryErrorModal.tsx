import React from 'react';
import {
  X,
  RefreshCw,
  ShieldAlert,
  CreditCard,
  MessageSquare
} from 'lucide-react';

interface QueryErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  plate: string;
  errorMessage: string;
  onRetry: () => void;
  onOpenSupport: () => void;
  onOpenCredits: () => void;
}

export const QueryErrorModal: React.FC<QueryErrorModalProps> = ({
  isOpen,
  onClose,
  plate,
  errorMessage,
  onRetry,
  onOpenSupport,
  onOpenCredits
}) => {
  if (!isOpen) return null;

  const isCreditError = errorMessage.toLowerCase().includes('crédito') || errorMessage.toLowerCase().includes('saldo');
  const isPlateFormatError = errorMessage.toLowerCase().includes('inválid') || errorMessage.toLowerCase().includes('formato');
  const isApiPlanError = errorMessage.toLowerCase().includes('plano') || errorMessage.toLowerCase().includes('apibrasil');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-rose-200 rounded-2xl shadow-2xl overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200">
        {/* Top Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

        <div className="p-6 sm:p-7">
          {/* Close button */}
          <button
            id="query-error-close-btn"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="text-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-3 shadow-xs">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Não Foi Possível Concluir a Consulta
            </h2>

            {plate && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-xs font-black text-slate-800">
                Placa: <span className="text-blue-700">{plate.toUpperCase()}</span>
              </div>
            )}
          </div>

          {/* Error Details Box */}
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1.5 mb-5 leading-relaxed font-medium">
            <p className="font-bold text-rose-950">Motivo identificado:</p>
            <p className="text-rose-900">{errorMessage || 'Falha de comunicação temporária com as bases estaduais de trânsito.'}</p>
          </div>

          {/* Suggestions List */}
          <div className="space-y-2 mb-6 text-xs text-slate-600">
            <p className="font-bold text-slate-800">Recomendações:</p>
            <ul className="space-y-1.5 list-disc list-inside text-slate-700 font-medium">
              {isPlateFormatError ? (
                <>
                  <li>Verifique se a placa contém 7 caracteres (padrão Mercosul ABC1D23 ou cinza ABC1234).</li>
                  <li>Certifique-se de que não há espaços ou caracteres especiais.</li>
                </>
              ) : isCreditError ? (
                <>
                  <li>Seu saldo atual é insuficiente para processar essa consulta com relatório detalhado.</li>
                  <li>Adicione créditos com liberação instantânea via Pix para prosseguir.</li>
                </>
              ) : isApiPlanError ? (
                <>
                  <li>Sua autenticação com a APIBrasil foi validada com sucesso pelo servidor.</li>
                  <li>A APIBrasil exige que sua conta tenha um plano de Veículos ativo contratado no painel.</li>
                  <li>Acesse o painel em <span className="text-slate-900 font-bold font-mono">app.apibrasil.io</span> para ativar o plano correspondente.</li>
                </>
              ) : (
                <>
                  <li>Tente novamente em instantes. Nosso sistema tentará uma rota de contingência alternativa.</li>
                  <li>Veículos muito recentes (0 km) podem levar até 48h para sincronização no Registro Nacional.</li>
                </>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-2.5">
            {isCreditError ? (
              <button
                id="error-buy-credits-btn"
                onClick={() => { onClose(); onOpenCredits(); }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-600/25 transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Recarregar Saldo de Consultas</span>
              </button>
            ) : (
              <button
                id="error-retry-btn"
                onClick={() => { onClose(); onRetry(); }}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tentar Novamente Agora</span>
              </button>
            )}

            <button
              id="error-support-btn"
              onClick={() => { onClose(); onOpenSupport(); }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>Falar com o Suporte Técnico</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
