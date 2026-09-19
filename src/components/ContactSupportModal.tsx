import React, { useState, useEffect } from 'react';
import {
  X,
  Headphones,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api.ts';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlate?: string;
  userEmail?: string;
  userName?: string;
}

export const ContactSupportModal: React.FC<ContactSupportModalProps> = ({
  isOpen,
  onClose,
  defaultPlate = '',
  userEmail = '',
  userName = ''
}) => {
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [plateRelated, setPlateRelated] = useState(defaultPlate);
  const [category, setCategory] = useState<'duvida_laudo' | 'financeiro' | 'b2b_api' | 'parceria' | 'outro'>('duvida_laudo');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [protocol, setProtocol] = useState<string | null>(null);

  useEffect(() => {
    if (userName) setName(userName);
    if (userEmail) setEmail(userEmail);
    if (defaultPlate) setPlateRelated(defaultPlate);
  }, [userName, userEmail, defaultPlate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await api.createSupportTicket({
        name,
        email,
        plateRelated: plateRelated || undefined,
        category,
        subject,
        message
      });
      setProtocol(res.ticket?.id || 'AC' + Math.floor(100000 + Math.random() * 900000));
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Erro ao enviar mensagem.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setProtocol(null);
    setMessage('');
    setSubject('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white border border-blue-200/90 rounded-2xl shadow-2xl overflow-hidden text-slate-900 max-h-[92vh] flex flex-col animate-in zoom-in-95">
        {/* Top Gradient Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 flex-shrink-0" />

        <div className="p-6 sm:p-7 overflow-y-auto">
          {/* Close Button */}
          <button
            id="support-modal-close-btn"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          {protocol ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Chamado Registrado!</h2>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto font-medium">
                  Nossa equipe técnica e de atendimento veicular já recebeu sua solicitação.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-sm mx-auto">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Número de Protocolo</p>
                <p className="text-xl font-mono font-black text-emerald-700 mt-0.5">#{protocol}</p>
                <p className="text-[11px] text-slate-600 mt-2 flex items-center justify-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Tempo médio de resposta: <strong className="text-slate-900">até 2 horas úteis</strong>
                </p>
              </div>

              <div className="pt-2">
                <button
                  id="support-success-close-btn"
                  onClick={handleReset}
                  className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all cursor-pointer"
                >
                  Concluir e Fechar
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 flex-shrink-0 shadow-xs">
                  <Headphones className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Central de Atendimento & Suporte</h2>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    Dúvidas sobre laudos, integrações B2B ou solicitações técnicas.
                  </p>
                </div>
              </div>

              {/* Fast Help Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
                <a
                  href="https://wa.me/5511999999999?text=Ol%C3%A1,%20preciso%20de%20suporte%20no%20AutoCheck%20Brasil"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 hover:border-emerald-300 flex items-center gap-3 transition-colors group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-950">WhatsApp Suporte</p>
                    <p className="text-[10px] text-emerald-800 font-medium">Atendimento humano em tempo real</p>
                  </div>
                </a>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-950">Encarregado DPO / LGPD</p>
                    <p className="text-[10px] text-blue-800 font-medium">dpo@autocheck.com.br</p>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Support Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Seu Nome *</label>
                    <input
                      id="support-name-input"
                      type="text"
                      required
                      placeholder="Nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">E-mail para Resposta *</label>
                    <input
                      id="support-email-input"
                      type="email"
                      required
                      placeholder="seu@email.com.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                    <select
                      id="support-category-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 font-medium"
                    >
                      <option value="duvida_laudo">Dúvida sobre Laudo Veicular</option>
                      <option value="financeiro">Financeiro / Recarga de Créditos</option>
                      <option value="b2b_api">API & Integração para Empresas</option>
                      <option value="parceria">Parceria / Concessionárias</option>
                      <option value="outro">Outro Assunto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Placa Relacionada (Opcional)</label>
                    <input
                      id="support-plate-input"
                      type="text"
                      placeholder="Ex: ABC1D23"
                      value={plateRelated}
                      onChange={(e) => setPlateRelated(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 uppercase font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assunto do Chamado *</label>
                  <input
                    id="support-subject-input"
                    type="text"
                    required
                    placeholder="Ex: Esclarecimento sobre restrição financeira no laudo"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mensagem Detalhada *</label>
                  <textarea
                    id="support-message-input"
                    required
                    rows={4}
                    placeholder="Descreva sua solicitação com o máximo de detalhes possível..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 leading-relaxed resize-none font-medium"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-500 font-medium">
                    Seus dados estão protegidos sob a LGPD (Lei 13.709/2018).
                  </p>
                  <button
                    id="support-submit-btn"
                    type="submit"
                    disabled={isLoading}
                    className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/25 disabled:opacity-50 flex-shrink-0 cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Abrir Chamado</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
