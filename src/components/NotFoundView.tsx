import React, { useState } from 'react';
import { Search, Home, HelpCircle, Car } from 'lucide-react';

interface NotFoundViewProps {
  onNavigateHome: () => void;
  onSearchPlate: (plate: string) => void;
  onOpenHelp: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({
  onNavigateHome,
  onSearchPlate,
  onOpenHelp
}) => {
  const [plate, setPlate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (plate.trim()) {
      onSearchPlate(plate.trim());
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in duration-300">
      <div className="max-w-xl w-full text-center space-y-8">
        {/* Visual 404 badge */}
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto shadow-sm relative z-10 text-blue-600">
            <Car className="w-10 h-10" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wider uppercase">
            Erro 404 • Rota Não Localizada
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Página ou Consulta Não Encontrada
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed font-medium">
            O endereço que você tentou acessar não existe ou o identificador da consulta expirou. Você pode realizar uma nova consulta de placa abaixo ou retornar ao início.
          </p>
        </div>

        {/* Quick Search on 404 */}
        <div className="bg-white border border-blue-200/90 rounded-2xl p-5 sm:p-6 shadow-sm max-w-md mx-auto">
          <p className="text-xs font-bold text-slate-700 mb-2.5 text-left">
            Consultar placa veicular diretamente:
          </p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="notfound-plate-input"
                type="text"
                maxLength={8}
                placeholder="Ex: ABC1D23"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 uppercase font-black"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
            <button
              id="notfound-search-btn"
              type="submit"
              disabled={!plate.trim()}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all disabled:opacity-40 cursor-pointer"
            >
              Consultar
            </button>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            id="notfound-home-btn"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Voltar para a Página Inicial</span>
          </button>

          <button
            id="notfound-help-btn"
            onClick={onOpenHelp}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Dúvidas & Ajuda</span>
          </button>
        </div>
      </div>
    </div>
  );
};
