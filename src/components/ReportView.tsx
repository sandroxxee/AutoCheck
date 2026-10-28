import React, { useState, useCallback, useMemo } from 'react';
import {
  ShieldAlert,
  Car,
  Landmark,
  Gavel,
  Scale,
  Download,
  Share2,
  Printer,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Sparkles,
  Lock,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Wrench,
  RefreshCw,
  Gift,
  MessageCircle,
  Mail,
  ExternalLink,
  X,
  Send,
  Copy,
  Check,
  Fuel,
  Gauge,
  Zap
} from 'lucide-react';
import { VehicleReport, UserAccount } from '../types/index.ts';
import { generateVehiclePdf } from '../services/pdfGenerator.ts';
import { ReportSkeleton } from './ReportSkeleton.tsx';
import { removeCachedReport } from '../services/reportCache.ts';
import { MercosulPlate } from './MercosulPlate.tsx';

interface ReportViewProps {
  report?: VehicleReport | null;
  isLoading?: boolean;
  plateBeingQueried?: string;
  user: UserAccount | null;
  onUpgrade?: () => void;
  onOpenCreditModal?: () => void;
  onNewSearch: () => void;
  onRefreshReport?: (plate: string) => void;
}

const ReportViewComponent: React.FC<ReportViewProps> = ({
  report,
  isLoading = false,
  plateBeingQueried,
  user,
  onUpgrade,
  onOpenCreditModal,
  onNewSearch,
  onRefreshReport
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'cadastral' | 'security' | 'financial' | 'legal' | 'market'>('overview');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cacheRefreshed, setCacheRefreshed] = useState(false);

  const isComplete = report ? (report.queryType === 'complete' || report.queryType === 'professional') : false;

  // Format currency helpers
  const formatMoney = useCallback((val?: number) => {
    if (val === undefined || val === null || isNaN(val)) return 'R$ 0,00';
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  // PDF Download Handler
  const handleDownloadPdf = useCallback(async () => {
    if (!report) return;
    try {
      setIsGeneratingPdf(true);
      await generateVehiclePdf(report, user);
    } catch (err) {
      console.error('Falha ao gerar PDF da consulta:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [report, user]);

  // Direct Print Handler
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Copy Link Handler
  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, []);

  // Force cache refresh handler
  const handleRefreshData = useCallback(() => {
    if (report?.plate) {
      removeCachedReport(report.plate);
      setCacheRefreshed(true);
      setTimeout(() => setCacheRefreshed(false), 3000);
      if (onRefreshReport) {
        onRefreshReport(report.plate);
      } else {
        onNewSearch();
      }
    }
  }, [report, onRefreshReport, onNewSearch]);

  // Risk calculation helpers
  const riskBadge = useMemo(() => {
    const score = report?.score || 85;
    if (score >= 80) {
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        dot: 'bg-emerald-500',
        text: 'EXCELENTE • RISCO BAIXO',
        colorClass: 'text-emerald-700'
      };
    }
    if (score >= 60) {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-300',
        dot: 'bg-amber-500',
        text: 'ATENÇÃO • RISCO MODERADO',
        colorClass: 'text-amber-700'
      };
    }
    return {
      bg: 'bg-rose-50 text-rose-800 border-rose-300',
      dot: 'bg-rose-500',
      text: 'ALERTA CRÍTICO • RISCO ELEVADO',
      colorClass: 'text-rose-700'
    };
  }, [report?.score]);

  // If loading or waiting for data
  if (isLoading) {
    return <ReportSkeleton plate={plateBeingQueried} onCancel={onNewSearch} />;
  }

  // If report not provided or invalid
  if (!report) {
    return (
      <div className="py-20 max-w-xl mx-auto px-4 text-center space-y-5 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto shadow-sm">
          <Car className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900">Nenhum relatório selecionado</h2>
          <p className="text-xs text-slate-500">
            Digite uma placa na página inicial para consultar e emitir o histórico veicular consolidado.
          </p>
        </div>
        <button
          onClick={onNewSearch}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
        >
          Nova Consulta de Placa
        </button>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-slate-900 animate-in fade-in">
      {/* 1. Header & Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-200/70 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <button
              onClick={onNewSearch}
              className="hover:text-blue-600 transition-colors font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>← Nova Consulta</span>
            </button>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-mono text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Placa {report.plateFormatted || report.plate}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Relatório de Histórico Veicular
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider bg-emerald-50 text-emerald-700 border-emerald-200">
              {isComplete ? 'Oficial Completo' : 'Resumo'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="report-download-pdf-btn"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Baixar PDF'}</span>
          </button>

          <button
            id="report-share-btn"
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors shadow-xs cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Compartilhar</span>
          </button>

          <button
            id="report-print-btn"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          <button
            id="report-refresh-cache-btn"
            onClick={handleRefreshData}
            title="Atualizar dados direto das fontes oficiais"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${cacheRefreshed ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">{cacheRefreshed ? 'Atualizando...' : 'Recarregar'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Vehicle Identity Card with Mercosul Plate Graphic */}
      <div className="rounded-2xl bg-white border border-blue-200/80 p-6 sm:p-7 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Mercosul Plate + Details */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Realistic Mercosul Plate Graphic */}
            <MercosulPlate
              plate={report.plateFormatted || report.plate}
              size="sm"
              showRivets={true}
              showHologram={true}
            />

            {/* Vehicle Title and Tags */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                  {report.vehicle?.marca || 'MARCA'}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                  Ano {report.vehicle?.anoFabricacao || '-'}/{report.vehicle?.anoModelo || '-'}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                  {report.vehicle?.combustivel || 'FLEX'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {report.vehicle?.marca} {report.vehicle?.modelo}
              </h2>

              <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                <span>Cor: <strong className="text-slate-800">{report.vehicle?.cor || 'Não informada'}</strong></span>
                <span>•</span>
                <span>Município: <strong className="text-slate-800">{report.vehicle?.municipio || '-'}/{report.vehicle?.uf || '-'}</strong></span>
                <span>•</span>
                <span>Tipo: <strong className="text-slate-800">{report.vehicle?.tipoVeiculo || 'Automóvel'}</strong></span>
              </p>
            </div>
          </div>

          {/* Right: Security Score Box */}
          <div className="w-full lg:w-auto flex items-center justify-between lg:justify-end gap-5 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-200">
            <div className="space-y-1 text-left lg:text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Score de Segurança</p>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${riskBadge.bg}`}>
                <span className={`w-2 h-2 rounded-full ${riskBadge.dot}`} />
                <span>{riskBadge.text}</span>
              </div>
            </div>

            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-slate-50 border border-blue-200 flex flex-col items-center justify-center shrink-0 shadow-inner">
              <span className={`text-2xl sm:text-3xl font-black ${riskBadge.colorClass}`}>
                {report.score || 85}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">/ 100 PTS</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Loyalty Cycle Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-50 via-white to-emerald-50 border border-blue-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Programa de Fidelidade AutoCheck
            </h4>
            <p className="text-xs text-slate-600">
              A cada 10 consultas pagas, você ganha 1 consulta completa 360° grátis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            Ciclo: <strong className="text-blue-700 font-mono">{user?.loyaltyQueriesCount || 1}/10</strong>
          </span>
          <button
            onClick={onOpenCreditModal}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Recarregar
          </button>
        </div>
      </div>

      {/* 5. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-blue-200/70 pb-3 overflow-x-auto">
        {[
          { id: 'overview', label: 'Visão Geral Completa' },
          { id: 'cadastral', label: 'Dados & Chassi' },
          { id: 'security', label: 'Segurança & Leilão' },
          { id: 'financial', label: 'Débitos & Gravame' },
          { id: 'legal', label: 'Restrições & RENAJUD' },
          { id: 'market', label: 'FIPE & Consumo' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 6. Detailed Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Identificação Cadastral & RENAVAM */}
        {(activeTab === 'overview' || activeTab === 'cadastral') && (
          <div className="rounded-2xl bg-white border border-blue-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Car className="w-4 h-4 text-blue-600" />
                <span>IDENTIFICAÇÃO CADASTRAL & RENAVAM</span>
              </div>
              <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                SENATRAN / BIN
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Chassi (LGPD)</span>
                <span className="font-mono font-bold text-slate-900 text-xs truncate block">
                  {report.vehicle?.chassiMascarado || 'Auditado na base'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Motor (LGPD)</span>
                <span className="font-mono font-bold text-slate-900 text-xs truncate block">
                  {report.vehicle?.motorMascarado || 'Auditado na base'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">RENAVAM (LGPD)</span>
                <span className="font-mono font-bold text-slate-900 text-xs truncate block">
                  {report.vehicle?.renavamMascarado || 'Auditado na base'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Potência / Motorização</span>
                <span className="font-bold text-slate-900 truncate block">
                  {report.vehicle?.potencia || (report.technicalSpecs?.potenciaCv ? `${report.technicalSpecs.potenciaCv} cv` : 'Conforme Catálogo')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Câmbio / Transmissão</span>
                <span className="font-bold text-slate-900 truncate block">
                  {report.vehicle?.cambio || 'Automático / Manual'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Carroceria / Categoria</span>
                <span className="font-bold text-slate-900 truncate block">
                  {report.vehicle?.carroceria || 'Utilitário / Passeio'} ({report.vehicle?.categoria || 'Particular'})
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Eixos / Lotação</span>
                <span className="font-bold text-slate-900 truncate block">
                  {report.vehicle?.eixos ? `${report.vehicle.eixos} eixos` : '2 eixos'} • {report.vehicle?.lotacao || '5 Ocupantes'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">PBT / Capacidade Tração</span>
                <span className="font-bold text-slate-900 truncate block">
                  {report.vehicle?.pesoBrutoTotal || '1.620 kg'} / {report.vehicle?.capacidadeTracao || '450 kg'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Data do Emplacamento</span>
                <span className="font-bold text-slate-900 truncate block">
                  {report.vehicle?.dataEmplacamento || 'Regular'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Nacionalidade</span>
                <span className="font-bold text-slate-900">
                  {report.vehicle?.nacionalidade || 'Nacional'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Segmento / Espécie</span>
                <span className="font-bold text-slate-900">
                  {report.vehicle?.segmento || report.vehicle?.especieVeiculo || 'Passageiro'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Situação Cadastral</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{report.vehicle?.situacaoVeiculo === 'EM_CIRCULACAO' ? 'Em Circulação' : 'Regular na Base Nacional'}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Card 2: Furto, Roubo & Segurança Pública */}
        {(activeTab === 'overview' || activeTab === 'security') && (
          <div className="rounded-2xl bg-white border border-blue-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                <span>SEGURANÇA PÚBLICA & ROUBO</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                SINESP Cidadão
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Status de Ocorrência Policial:</p>
                <div className="flex items-center gap-2 mt-1">
                  {report.theft?.status === 'NADA_CONSTA' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="font-black text-emerald-700 text-sm">NENHUMA QUEIXA DE ROUBO OU FURTO</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-600" />
                      <span className="font-black text-rose-700 text-sm">OCORRÊNCIA POLICIAL ATIVA</span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 block">Alerta Policial:</span>
                  <span className="font-bold text-emerald-700">Inativo (Sem alerta)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 block">Data da Verificação:</span>
                  <span className="font-bold text-slate-800">
                    {new Date(report.createdAt).toLocaleDateString('pt-BR')} às {new Date(report.createdAt).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                {report.theft?.mensagem || 'Consulta efetuada em tempo real com cruzamento na Base Nacional Integrada de Segurança Pública.'}
              </p>
            </div>
          </div>
        )}

        {/* Card 3: Histórico de Leilão & Sinistro */}
        {(activeTab === 'overview' || activeTab === 'security') && (
          <div className="rounded-2xl bg-white border border-blue-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Gavel className="w-4 h-4 text-purple-600" />
                <span>HISTÓRICO DE LEILÃO & SINISTRO</span>
              </div>
              <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                Auditoria de Pátios
              </span>
            </div>

            {!isComplete ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">Histórico de Leilão Bloqueado</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    A verificação completa de histórico de leiloeiros, sinistros de seguradora e perda total é exclusiva da Consulta Completa.
                  </p>
                </div>
                <button
                  onClick={onUpgrade || onOpenCreditModal}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Desbloquear com Consulta Completa
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Status de Leilão e Sinistro:</p>
                  <div className="flex items-center gap-2 mt-1">
                    {report.auction?.status === 'SEM_REGISTRO' ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="font-black text-emerald-700 text-sm">SEM REGISTRO DE LEILÃO OU SINISTRO</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <span className="font-black text-amber-700 text-sm">REGISTRO DE LEILÃO LOCALIZADO</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block">Condição Geral:</span>
                    <span className={`font-bold ${report.auction?.status === 'SEM_REGISTRO' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {report.auction?.condicaoGeral || 'Sem avarias registradas'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block">Classificação:</span>
                    <span className="font-bold text-slate-800">
                      {report.auction?.descricao || 'Sem histórico de perda total'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {report.auction?.descricao || 'Varredura realizada em mais de 120 leiloeiros oficiais e pátios de seguradoras.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Card 4: Gravame Comercial & Financiamento */}
        {(activeTab === 'overview' || activeTab === 'financial') && (
          <div className="rounded-2xl bg-white border border-blue-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Landmark className="w-4 h-4 text-blue-600" />
                <span>GRAVAME COMERCIAL & SNG</span>
              </div>
              <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                Sistema Nacional de Gravames
              </span>
            </div>

            {!isComplete ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">Gravame e Financiamento Bloqueados</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    A auditoria de contratos de financiamento, leasing, arrendamento mercantil e banco credor é exclusiva da Consulta Completa.
                  </p>
                </div>
                <button
                  onClick={onUpgrade || onOpenCreditModal}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Desbloquear Gravame
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Situação Financeira do Veículo:</p>
                  <div className="flex items-center gap-2 mt-1">
                    {(!report.financing || report.financing.status === 'SEM_RESTRICAO') ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="font-black text-emerald-700 text-sm">VEÍCULO 100% QUITADO (DESALIENADO)</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <span className="font-black text-amber-700 text-sm">GRAVAME ATIVO / ALIENAÇÃO FIDUCIÁRIA</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block">Tipo de Gravame:</span>
                    <span className="font-bold text-slate-800">
                      {report.financing?.status !== 'SEM_RESTRICAO' ? (report.financing?.status || 'Alienação') : 'Sem gravame'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block">Agente Financeiro:</span>
                    <span className="font-bold text-slate-800">
                      {report.financing?.agenteFinanceiro || 'Nenhum'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {report.financing?.descricao || 'Verificação oficial no Sistema Nacional de Gravames (SNG/B3).'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Card 5: Débitos, IPVA & Infrações Renainf */}
        {(activeTab === 'overview' || activeTab === 'financial') && (
          <div className="rounded-2xl bg-white border border-blue-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span>DÉBITOS, IPVA & INFRAÇÕES RENAINF</span>
              </div>
              <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                SEFAZ & DETRAN
              </span>
            </div>

            {!isComplete ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">Débitos e Multas Bloqueados</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    A apuração detalhada de multas Renainf, IPVA em atraso, taxa de licenciamento e Dívida Ativa é exclusiva da Consulta Completa.
                  </p>
                </div>
                <button
                  onClick={onUpgrade || onOpenCreditModal}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Desbloquear Débitos
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Situação de Débitos & Autuações:</p>
                  <div className="flex items-center gap-2 mt-1">
                    {(report.fines?.quantidade || 0) === 0 && (!report.debitos || report.debitos.totalGeral === 0) ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="font-black text-emerald-700 text-sm">SEM REGISTROS OU DÉBITOS PENDENTES</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <span className="font-black text-amber-700 text-sm">
                          {report.fines?.quantidade || 0} AUTUAÇÃO(ÕES) / DÉBITOS PENDENTES
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Total Consolidado */}
                {((report.debitos && report.debitos.totalGeral > 0) || (report.fines && report.fines.valorTotalEstimado > 0)) ? (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-700">Total Geral de Débitos:</span>
                      <span className="text-base font-black text-amber-800">
                        {formatMoney(report.debitos?.totalGeral || report.fines?.valorTotalEstimado)}
                      </span>
                    </div>

                    {report.debitos && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/70 text-[11px]">
                        <div className="p-2 rounded bg-white border border-amber-200">
                          <span className="text-slate-500 block">Multas:</span>
                          <span className="font-bold text-slate-900">{formatMoney(report.debitos.multasRenainf)}</span>
                        </div>
                        <div className="p-2 rounded bg-white border border-amber-200">
                          <span className="text-slate-500 block">IPVA:</span>
                          <span className="font-bold text-slate-900">{formatMoney(report.debitos.ipvaAtrasado)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-700 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Veículo 100% regularizado perante os órgãos de trânsito estaduais e federais.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Card 6: Restrições Administrativas & Judiciais */}
        {(activeTab === 'overview' || activeTab === 'legal') && (
          <div className="rounded-2xl bg-white border border-blue-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Scale className="w-4 h-4 text-blue-600" />
                <span>RESTRIÇÕES ADMINISTRATIVAS & RENAJUD</span>
              </div>
              <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                Poder Judiciário & DETRAN
              </span>
            </div>

            {!isComplete ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">Restrições Judiciais Bloqueadas</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    A auditoria de penhora RENAJUD, busca e apreensão, guincho e restrições administrativas é exclusiva da Consulta Completa.
                  </p>
                </div>
                <button
                  onClick={onUpgrade || onOpenCreditModal}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Desbloquear RENAJUD
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Status de Restrições:</p>
                  <div className="flex items-center gap-2 mt-1">
                    {report.restricoesAdministrativas?.status === 'SEM_RESTRICOES' ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="font-black text-emerald-700 text-sm">NADA CONSTA (LIVRE DE RESTRIÇÕES)</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-600" />
                        <span className="font-black text-rose-700 text-sm">
                          {report.restricoesAdministrativas?.temBloqueioJudicial ? 'BLOQUEIO JUDICIAL RENAJUD' : 'RESTRIÇÃO ATIVA'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-500 block">Bloqueio Judicial:</span>
                    <span className={`font-bold ${report.restricoesAdministrativas?.temBloqueioJudicial ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {report.restricoesAdministrativas?.temBloqueioJudicial ? 'RENAJUD Ativo' : 'Nada Consta'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-500 block">Bloqueio Adm:</span>
                    <span className={`font-bold ${report.restricoesAdministrativas?.temBloqueioAdministrativo ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {report.restricoesAdministrativas?.temBloqueioAdministrativo ? 'Consta Restrição' : 'Sem Bloqueio'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {report.restricoesAdministrativas?.descricao || 'Verificação de impedimentos judiciais (Renajud) e bloqueios de transferência.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7. Open Intelligence Modules (FIPE, IPVA, Recalls) */}
      {(activeTab === 'overview' || activeTab === 'market') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Inteligência de Mercado & Dados Oficiais Abertos
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
              DADOS REAIS CRUZADOS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
            {/* Tabela FIPE Oficial */}
            {report.fipe && (
              <div className="rounded-2xl bg-white border border-blue-200/80 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>TABELA FIPE OFICIAL</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Cód: {report.fipe.codigoFipe}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Preço Médio de Mercado ({report.fipe.mesReferencia})</p>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight mt-1">
                      {report.fipe.valorFormatado}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="text-[10px] text-slate-500 font-medium">Variação 12 meses:</span>
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {report.fipe.variacao12MesesPerc}% (Estável)
                      </span>
                    </div>
                  </div>

                  {report.fipe.historicoPreco && report.fipe.historicoPreco.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Histórico Recente:</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {report.fipe.historicoPreco.slice(-3).map((item, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-center">
                            <p className="text-[9px] text-slate-500">{item.mes}</p>
                            <p className="text-[10px] font-bold text-slate-900">
                              R$ {(item.valor / 1000).toFixed(1)}k
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* IPVA & Custos Anuais por Estado */}
            {report.ipva && (
              <div className="rounded-2xl bg-white border border-blue-200/80 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    <span>IPVA & CUSTOS ANUAIS</span>
                  </div>
                  <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    UF: {report.ipva.uf} ({report.ipva.aliquotaPerc}%)
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Estimativa de IPVA Anual:</p>
                      <p className="text-xl font-black text-slate-900 mt-0.5">
                        {report.ipva.isento ? (
                          <span className="text-emerald-700">ISENTO DE IPVA</span>
                        ) : (
                          `R$ ${report.ipva.valorIpvaEstimado.toLocaleString('pt-BR')}`
                        )}
                      </p>
                    </div>
                    {report.ipva.isento ? (
                      <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                        ISENÇÃO POR IDADE
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px]">
                        Exercício {report.ipva.anoExercicio}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-2 text-[11px]">
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500">Taxa de Licenciamento:</span>
                      <span className="font-bold text-slate-900">{formatMoney(report.ipva.taxaLicenciamentoEstimada)}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500">Custo Tributário Total:</span>
                      <span className="font-black text-amber-800">{formatMoney(report.ipva.custoTotalAnual)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recalls de Fábrica */}
            {report.recall && (
              <div className="rounded-2xl bg-white border border-blue-200/80 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Wrench className="w-4 h-4 text-purple-600" />
                    <span>RECALLS DE FÁBRICA</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Montadora
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Status de Segurança:</p>
                    <div className="flex items-center gap-2 mt-1">
                      {!report.recall.possuiRecall ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span className="font-black text-emerald-700 text-sm">NENHUM RECALL PENDENTE</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                          <span className="font-black text-amber-700 text-sm">
                            {report.recall.totalRecalls} CAMPANHA(S) REGISTRADA(S)
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {!report.recall.possuiRecall
                      ? 'Veículo em conformidade de segurança. Não há registros de chamamentos de fábrica abertos para este chassi ou lote de produção.'
                      : 'Consta chamado de segurança aberto pelo fabricante. Procure uma concessionária autorizada para regularização gratuita.'}
                  </p>
                </div>
              </div>
            )}

            {/* Ficha Técnica & Eficiência Energética (INMETRO PBEV) */}
            {report.technicalSpecs && (
              <div className="rounded-2xl bg-white border border-blue-200/80 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Fuel className="w-4 h-4 text-emerald-600" />
                    <span>FICHA TÉCNICA & INMETRO</span>
                  </div>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Selo PBEV: {report.technicalSpecs.classificacaoPbev}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Potência / Cilindrada:</p>
                      <p className="text-sm font-black text-slate-900 mt-0.5">
                        {report.technicalSpecs.potenciaCv} cv ({report.technicalSpecs.cilindradasCm3} cm³)
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Autonomia Rodoviária:</p>
                      <p className="text-sm font-black text-emerald-700 mt-0.5">
                        Até {report.technicalSpecs.autonomiaRodoviariaKm} km
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-2 text-[11px]">
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500">Gasolina (Cidade / Estrada):</span>
                      <span className="font-bold text-slate-900">
                        {report.technicalSpecs.consumoUrbanoGasolinaKml} km/l • {report.technicalSpecs.consumoRodoviarioGasolinaKml} km/l
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500">Etanol (Cidade / Estrada):</span>
                      <span className="font-bold text-slate-900">
                        {report.technicalSpecs.consumoUrbanoEtanolKml} km/l • {report.technicalSpecs.consumoRodoviarioEtanolKml} km/l
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500">Capacidade do Tanque:</span>
                      <span className="font-bold text-slate-900">{report.technicalSpecs.capacidadeTanqueLitros} Litros</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. Aviso Legal & Disclaimer Obrigatório */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-slate-600 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed space-y-1">
          <p>
            <strong className="text-slate-900">Disclaimer Obrigatório:</strong> Dados informativos conforme base SENATRAN / SINESP / RENAINF / SEFAZ / DETRAN em {new Date(report.createdAt).toLocaleDateString('pt-BR')} às {new Date(report.createdAt).toLocaleTimeString('pt-BR')}. Não substitui vistoria cautelar e não garante ausência de débitos. Consulte DETRAN para validação.
          </p>
          <p className="text-slate-500">
            A emissão de laudo pericial, cautelar ou de transferência é ato privativo de Empresas Credenciadas de Vistoria (ECV) e Despachantes Oficiais. Em conformidade com a LGPD (Lei 13.709/2018), dados de proprietários não são armazenados.
          </p>
        </div>
      </div>

      {/* 10. Modal de Compartilhamento Direto */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white border border-blue-200 rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Compartilhar Histórico Veicular</h3>
                  <p className="text-xs text-slate-500">
                    Placa: <strong className="text-slate-900 font-mono">{report.plateFormatted || report.plate}</strong> • {report.vehicle?.marca} {report.vehicle?.modelo}
                  </p>
                </div>
              </div>
              <button
                id="close-share-modal-btn"
                onClick={() => setShowShareModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Opções de Envio */}
            <div className="space-y-3">
              {/* WhatsApp */}
              <a
                id="share-whatsapp-btn"
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `🚗 *Histórico Veicular AutoCheck - ${report.plateFormatted || report.plate}*\nVeículo: ${report.vehicle?.marca || ''} ${report.vehicle?.modelo || ''} (${report.vehicle?.anoFabricacao || ''}/${report.vehicle?.anoModelo || ''})\nScore de Segurança: ${report.score || 85}/100\nStatus: ${report.riskLevel === 'baixo' ? 'Aprovado sem restrições graves' : 'Atenção aos apontamentos'}\n\n📄 Acesse o histórico completo:\n${window.location.href}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-900 group-hover:text-emerald-950">Enviar via WhatsApp</p>
                    <p className="text-xs text-emerald-700">Mensagem pronta com score, placa, modelo e link da consulta</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* E-mail */}
              <a
                id="share-email-btn"
                href={`mailto:?subject=${encodeURIComponent(
                  `Histórico Veicular AutoCheck - ${report.plateFormatted || report.plate} (${report.vehicle?.marca || ''} ${report.vehicle?.modelo || ''})`
                )}&body=${encodeURIComponent(
                  `Olá,\n\nSegue o histórico veicular consolidado do veículo ${report.vehicle?.marca || ''} ${report.vehicle?.modelo || ''} (Placa: ${report.plateFormatted || report.plate}):\n\n- Score AutoCheck: ${report.score || 85}/100\n- Nível de Risco: ${(report.riskLevel || 'BAIXO').toUpperCase()}\n- Ano/Modelo: ${report.vehicle?.anoFabricacao || ''}/${report.vehicle?.anoModelo || ''}\n- Município/UF: ${report.vehicle?.municipio || ''} - ${report.vehicle?.uf || ''}\n\nPara conferir o histórico completo de leilão, sinistro, débitos e restrições, acesse o link:\n${window.location.href}\n\nAtenciosamente,\nAutoCheck Brasil`
                )}`}
                className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-900 group-hover:text-blue-950">Enviar por E-mail</p>
                    <p className="text-xs text-blue-700">Abre seu cliente de e-mail com a consulta formatada</p>
                  </div>
                </div>
                <Send className="w-4 h-4 text-blue-700 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Baixar PDF */}
              <button
                id="share-download-pdf-btn"
                onClick={() => {
                  handleDownloadPdf();
                  setShowShareModal(false);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-purple-50 hover:bg-purple-100/80 border border-purple-200 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-300 flex items-center justify-center text-purple-700">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-purple-900 group-hover:text-purple-950">Baixar Relatório Oficial em PDF</p>
                    <p className="text-xs text-purple-700">Arquivo pronto para impressão ou anexo manual</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-700 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Copiar Link Direto */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700">Link Direto da Consulta</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={window.location.href}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none select-all"
                />
                <button
                  id="share-copy-link-btn"
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                    copied
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ReportView = React.memo(ReportViewComponent);
