import React from 'react';
import { ShieldCheck, Lock, ArrowUp, Headphones, Scale } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: any) => void;
  onOpenLegal: (tab: 'privacidade' | 'termos' | 'uso-responsavel') => void;
  onOpenSupport?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenLegal, onOpenSupport }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white/75 backdrop-blur-xl text-slate-600 text-xs border-t border-blue-200/70 relative mt-auto shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-blue-100">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl icon-3d-blue flex items-center justify-center text-white font-black shadow-sm">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-[#020617] tracking-tight">AutoCheck Brasil</span>
              <p className="text-[10px] text-slate-500 font-bold">Inteligência e Histórico Veicular</p>
            </div>
          </div>

          {/* Quick Legal & Support Action Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => onOpenLegal('privacidade')}
              className="px-3.5 py-1.5 rounded-full glass-subtle hover:bg-white text-slate-700 hover:text-blue-900 border border-blue-200 transition-all cursor-pointer text-xs flex items-center gap-1.5 font-bold shadow-xs active:scale-95"
            >
              <div className="w-3.5 h-3.5 rounded-full icon-3d-green flex items-center justify-center text-white">
                <Lock className="w-2 h-2" />
              </div>
              <span>Privacidade</span>
            </button>
            <button
              onClick={() => onOpenLegal('termos')}
              className="px-3.5 py-1.5 rounded-full glass-subtle hover:bg-white text-slate-700 hover:text-blue-900 border border-blue-200 transition-all cursor-pointer text-xs flex items-center gap-1.5 font-bold shadow-xs active:scale-95"
            >
              <div className="w-3.5 h-3.5 rounded-full icon-3d-blue flex items-center justify-center text-white">
                <Scale className="w-2 h-2" />
              </div>
              <span>Termos & LGPD</span>
            </button>
            {onOpenSupport && (
              <button
                id="footer-support-btn"
                onClick={onOpenSupport}
                className="px-3.5 py-1.5 rounded-full glass-subtle hover:bg-white text-slate-700 hover:text-blue-900 border border-blue-200 transition-all cursor-pointer text-xs flex items-center gap-1.5 font-bold shadow-xs active:scale-95"
              >
                <div className="w-3.5 h-3.5 rounded-full icon-3d-purple flex items-center justify-center text-white">
                  <Headphones className="w-2 h-2" />
                </div>
                <span>Suporte</span>
              </button>
            )}
          </div>
        </div>

        {/* Disclaimer & Legal Info */}
        <div className="pt-4 pb-2 border-b border-blue-50 text-[11px] text-slate-500 leading-relaxed">
          <p>
            <strong className="text-slate-700">Aviso Legal:</strong> Consulta de histórico veicular com dados informativos conforme bases oficiais no momento da requisição. Não substitui vistoria cautelar e não garante ausência de débitos. Consulte DETRAN para validação. Em conformidade com a LGPD (Lei 13.709/2018), não armazenamos dados de proprietários.
          </p>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-semibold">
          <p>© {new Date().getFullYear()} AutoCheck Brasil • Criado por <strong className="text-slate-900 font-extrabold">Sandro Luiz Mayer</strong>. Todos os direitos reservados.</p>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 hover:text-blue-700 transition-colors cursor-pointer text-xs font-bold"
          >
            <span>Voltar ao Topo</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
