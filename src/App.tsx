import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Helmet } from './components/Helmet.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Android16BottomNav } from './components/Android16BottomNav.tsx';
import { PlateInput } from './components/PlateInput.tsx';
import { Footer } from './components/Footer.tsx';
import { ReportView } from './components/ReportView.tsx';
import { OfflineBanner } from './components/OfflineBanner.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// Code splitting / Lazy-loaded components for fast initial load
const UserDashboard = lazy(() => import('./components/UserDashboard.tsx').then(m => ({ default: m.UserDashboard })));
const AdminPanel = lazy(() => import('./components/AdminPanel.tsx').then(m => ({ default: m.AdminPanel })));
const UserProfileView = lazy(() => import('./components/UserProfileView.tsx').then(m => ({ default: m.UserProfileView })));
const NotFoundView = lazy(() => import('./components/NotFoundView.tsx').then(m => ({ default: m.NotFoundView })));
const CreditPurchaseModal = lazy(() => import('./components/CreditPurchaseModal.tsx').then(m => ({ default: m.CreditPurchaseModal })));
const PlateCheckoutPixModal = lazy(() => import('./components/PlateCheckoutPixModal.tsx').then(m => ({ default: m.PlateCheckoutPixModal })));
const LegalModal = lazy(() => import('./components/LegalModal.tsx').then(m => ({ default: m.LegalModal })));
const AuthModal = lazy(() => import('./components/AuthModal.tsx').then(m => ({ default: m.AuthModal })));
const ContactSupportModal = lazy(() => import('./components/ContactSupportModal.tsx').then(m => ({ default: m.ContactSupportModal })));
const QueryErrorModal = lazy(() => import('./components/QueryErrorModal.tsx').then(m => ({ default: m.QueryErrorModal })));
const NoCreditsModal = lazy(() => import('./components/NoCreditsModal.tsx').then(m => ({ default: m.NoCreditsModal })));

import { ConsolidatedReport, UserAccount, CreditPackage, VehicleFreePreview } from './types/index.ts';
import { isDemoTestPlate } from '../shared/schemas/vehicle.ts';
import { api } from './services/api.ts';
import { getCachedReport } from './services/reportCache.ts';
import { saveVehicleReportToFirestore, getUserVehicleReportsFromFirestore } from './services/firebase.ts';
import { useAuth } from './contexts/AuthContext.tsx';
import { triggerHaptic } from './utils/haptics.ts';
import { FreeAnalysisPreview } from './components/FreeAnalysisPreview.tsx';
import {
  ShieldCheck,
  Zap,
  Car,
  Clock,
  ArrowRight,
  Headphones,
  CheckCircle2,
  Lock,
  Sparkles,
  Gavel,
  AlertTriangle,
  Info
} from 'lucide-react';

export function App() {
  const { user, setUser, logout, refreshUser } = useAuth();
  const [currentView, setCurrentView] = useState<'home' | 'preview' | 'report' | 'dashboard' | 'admin' | 'profile' | 'not-found' | 'legal'>('home');
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [activeReport, setActiveReport] = useState<ConsolidatedReport | null>(null);
  const [freePreviewData, setFreePreviewData] = useState<VehicleFreePreview | null>(null);
  const [recentReports, setRecentReports] = useState<ConsolidatedReport[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryingPlate, setQueryingPlate] = useState('');
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [noCreditsModalState, setNoCreditsModalState] = useState<{
    isOpen: boolean;
    plate: string;
    currentCredits: number;
  }>({
    isOpen: false,
    plate: '',
    currentCredits: 0
  });
  const [plateCheckoutState, setPlateCheckoutState] = useState<{ isOpen: boolean; plate: string }>({
    isOpen: false,
    plate: ''
  });
  const [queryErrorState, setQueryErrorState] = useState<{ isOpen: boolean; plate: string; errorMessage: string }>({
    isOpen: false,
    plate: '',
    errorMessage: ''
  });
  const [authModalState, setAuthModalState] = useState<{ isOpen: boolean; mode: 'login' | 'register' | 'forgot' }>({
    isOpen: false,
    mode: 'login'
  });
  const [legalModalState, setLegalModalState] = useState<{ isOpen: boolean; tab: 'privacidade' | 'termos' | 'uso-responsavel' }>({
    isOpen: false,
    tab: 'privacidade'
  });
  const [pendingQuery, setPendingQuery] = useState<{ plate: string; queryType: 'basic' | 'complete' | 'professional' } | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Load initial pricing and user recents
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (user) {
      loadRecentQueries();
    }
  }, [user]);

  const loadInitialData = async () => {
    try {
      const priceData = await api.getPrices();
      setCreditPackages(priceData.creditPackages);
    } catch (err) {
      console.error('Falha ao inicializar dados de preços:', err);
    }
  };

  const loadRecentQueries = useCallback(async () => {
    try {
      const [apiQueries, firestoreQueries] = await Promise.all([
        api.getUserQueries().catch(() => []),
        getUserVehicleReportsFromFirestore(user?.id).catch(() => [])
      ]);
      const mergedMap = new Map<string, ConsolidatedReport>();
      [...firestoreQueries, ...apiQueries].forEach((rep) => {
        if (rep && rep.id && !mergedMap.has(rep.id)) {
          mergedMap.set(rep.id, rep);
        }
      });
      setRecentReports(Array.from(mergedMap.values()).slice(0, 4));
    } catch (e) {
      console.warn('Erro ao carregar recentes:', e);
    }
  }, [user?.id]);

  const handleSearchPlate = useCallback(async (
    plate: string,
    queryType: 'basic' | 'complete' | 'professional' = 'complete',
    skipPreview = false
  ) => {
    const cleanPlate = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (!cleanPlate) return;

    const userCredits = user?.credits ?? 0;
    const isUnlimitedAdmin = user?.role === 'admin';
    const isDemoPlate = isDemoTestPlate(cleanPlate);

    if (!user && !isDemoPlate) {
      setPendingQuery({ plate: cleanPlate, queryType: 'complete' });
      setAuthModalState({ isOpen: true, mode: 'login' });
      return;
    }

    // Verificação de créditos ao consultar placa após estar logado:
    // Placas de teste (BRA2E19, ABC1D23, SAV1010, ROU8080) são 100% gratuitas para desenvolvimento!
    if (!isDemoPlate && !isUnlimitedAdmin && userCredits < 1 && !skipPreview) {
      triggerHaptic('warning');
      setPendingQuery({ plate: cleanPlate, queryType });
      setNoCreditsModalState({
        isOpen: true,
        plate: cleanPlate,
        currentCredits: userCredits
      });
      return;
    }

    // Direct Full Report Flow: If demo plate, user has credits, is admin, or already unlocked via PIX
    if (isDemoPlate || skipPreview || isUnlimitedAdmin || userCredits >= 1) {
      try {
        setQueryingPlate(cleanPlate);
        setIsQuerying(true);
        setActiveReport(null);
        setFreePreviewData(null);
        setCurrentView('report');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const result = await api.checkVehicle(cleanPlate, queryType);
        setActiveReport(result.report);
        setCurrentView('report');
        setPendingQuery(null);

        // Salva no Firestore se o usuário estiver autenticado
        if (user) {
          saveVehicleReportToFirestore(result.report, user.id).catch((e) => {
            console.warn('Erro não-bloqueante ao salvar no Firestore:', e);
          });
          loadRecentQueries();
        }

        // Atualiza saldo do usuário para manter visível em tempo real quantas ainda tem
        await refreshUser();
      } catch (err: any) {
        if (err?.requiresCredits) {
          setPendingQuery({ plate: cleanPlate, queryType });
          setNoCreditsModalState({
            isOpen: true,
            plate: cleanPlate,
            currentCredits: 0
          });
          return;
        }
        setCurrentView('home');
        setQueryErrorState({
          isOpen: true,
          plate: cleanPlate,
          errorMessage: err?.message || 'Falha temporária ao consultar dados do veículo.'
        });
      } finally {
        setIsQuerying(false);
      }
      return;
    }

    // Free Preliminary Analysis Flow (Análise Gratuita - Replica exata do checkout visual)
    try {
      setQueryingPlate(cleanPlate);
      setIsQuerying(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      const res = await api.getFreePreview(cleanPlate);
      setFreePreviewData(res.preview);
      setCurrentView('preview');
      setPendingQuery({ plate: cleanPlate, queryType });
    } catch (err: any) {
      // Se falhar a prévia, abre o modal de checkout direto
      setPendingQuery({ plate: cleanPlate, queryType });
      setPlateCheckoutState({ isOpen: true, plate: cleanPlate });
    } finally {
      setIsQuerying(false);
    }
  }, [user, refreshUser, loadRecentQueries]);

  const handleUpgradeReport = useCallback(async () => {
    if (!activeReport) return;
    try {
      setIsQuerying(true);
      const upgraded = await api.upgradeReport(activeReport.id);
      setActiveReport(upgraded);
      await refreshUser();
    } catch (err: unknown) {
      setQueryErrorState({
        isOpen: true,
        plate: activeReport.plate,
        errorMessage: (err as Error).message || 'Falha ao atualizar consulta para versão Completa.'
      });
    } finally {
      setIsQuerying(false);
    }
  }, [activeReport, refreshUser]);

  const handleNewSearch = useCallback(() => {
    setIsQuerying(false);
    setCurrentView('home');
  }, []);

  const handleOpenCreditModal = useCallback(() => {
    setShowCreditModal(true);
  }, []);

  const handleOpenLegal = useCallback((tab: 'privacidade' | 'termos' | 'uso-responsavel') => {
    setLegalModalState({ isOpen: true, tab });
  }, []);

  const handleAuthSuccess = useCallback((authenticatedUser: UserAccount) => {
    setUser(authenticatedUser);
    setAuthModalState((prev) => ({ ...prev, isOpen: false }));

    if (pendingQuery) {
      if (authenticatedUser.credits >= 1 || authenticatedUser.role === 'admin') {
        const query = pendingQuery;
        setPendingQuery(null);
        handleSearchPlate(query.plate, query.queryType);
      } else {
        setPlateCheckoutState({ isOpen: true, plate: pendingQuery.plate });
      }
    }
  }, [pendingQuery, handleSearchPlate, setUser]);

  const handleLogout = useCallback(async () => {
    await logout();
    setCurrentView('home');
    setRecentReports([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [logout]);

  // SEO Metadata
  const getSeoMeta = () => {
    const origin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://autocheck.com.br';

    switch (currentView) {
      case 'preview': {
        const plateText = freePreviewData?.plateFormatted || freePreviewData?.plate || 'Veículo';
        const car = freePreviewData ? `${freePreviewData.marca} ${freePreviewData.modelo}` : '';
        return {
          title: `Análise Gratuita Placa ${plateText} - ${car} | AutoCheck Brasil`,
          description: `Identificação veicular gratuita da placa ${plateText}. Desbloqueie a consulta completa oficial com leilão, sinistros, gravame e débitos.`,
          canonicalUrl: `${origin}/analise-gratuita/${encodeURIComponent(freePreviewData?.plate || '')}`,
          noindex: false,
          ogType: 'article'
        };
      }

      case 'report': {
        if (activeReport) {
          const plateText = activeReport.plateFormatted || activeReport.plate;
          const car = `${activeReport.vehicle.marca} ${activeReport.vehicle.modelo}`.trim();
          return {
            title: `Consulta de Histórico Veicular Placa ${plateText} - ${car || 'Veículo'} | AutoCheck Brasil`,
            description: `Consulta da placa ${plateText}. Verifique situação de roubo/furto, dados do Renavam, gravame, leilão e débitos.`,
            canonicalUrl: `${origin}/consulta/${encodeURIComponent(activeReport.plate)}`,
            noindex: false,
            ogType: 'article'
          };
        }
        return {
          title: 'Relatório de Consulta Veicular por Placa | AutoCheck Brasil',
          description: 'Acesse o histórico completo com dados cadastrais, restrições e procedência veicular.',
          canonicalUrl: `${origin}/consulta`,
          noindex: false,
          ogType: 'website'
        };
      }

      case 'dashboard':
        return {
          title: 'Meu Histórico de Consultas Veiculares | AutoCheck Brasil',
          description: 'Acesse suas consultas geradas, saldo de créditos e histórico de placas consultadas.',
          canonicalUrl: `${origin}/painel`,
          noindex: true,
          ogType: 'website'
        };

      case 'profile':
        return {
          title: 'Configurações de Perfil e API | AutoCheck Brasil',
          description: 'Gerenciamento de dados cadastrais, faturamento e chave de API para integração.',
          canonicalUrl: `${origin}/perfil`,
          noindex: true,
          ogType: 'website'
        };

      case 'admin':
        return {
          title: 'Painel Administrativo | AutoCheck Brasil',
          description: 'Monitoramento de integridade e gestão de provedores de dados veiculares.',
          canonicalUrl: `${origin}/admin`,
          noindex: true,
          ogType: 'website'
        };

      case 'not-found':
        return {
          title: 'Página Não Encontrada (404) | AutoCheck Brasil',
          description: 'A página solicitada não foi localizada. Realize uma nova consulta de veículo pela placa.',
          canonicalUrl: `${origin}/404`,
          noindex: true,
          ogType: 'website'
        };

      case 'legal':
        return {
          title: 'Termos de Uso e Política de Privacidade LGPD | AutoCheck Brasil',
          description: 'Termos de serviço, política de privacidade em conformidade com a LGPD e uso responsável de dados.',
          canonicalUrl: `${origin}/termos`,
          noindex: false,
          ogType: 'website'
        };

      case 'home':
      default:
        return {
          title: 'Consulta Veicular por Placa | AutoCheck Brasil',
          description: 'Consulte informações oficiais de qualquer veículo no Brasil por placa.',
          canonicalUrl: `${origin}/`,
          noindex: false,
          ogType: 'website'
        };
    }
  };

  const seoMeta = getSeoMeta();

  return (
    <div
      id="app-root-container"
      className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EFF6FF] to-[#E0F2FE] text-slate-900 flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white pb-16 md:pb-0 relative overflow-x-hidden"
    >
      {/* Dynamic SEO Meta Tags via react-helmet */}
      <Helmet>
        <title>{seoMeta.title}</title>
        <meta name="description" content={seoMeta.description} />
        <link rel="canonical" href={seoMeta.canonicalUrl} />
        <meta property="og:title" content={seoMeta.title} />
        <meta property="og:description" content={seoMeta.description} />
        <meta property="og:url" content={seoMeta.canonicalUrl} />
        <meta property="og:type" content={seoMeta.ogType} />
        <meta name="twitter:title" content={seoMeta.title} />
        <meta name="twitter:description" content={seoMeta.description} />
        {seoMeta.noindex ? (
          <meta name="robots" content="noindex, nofollow" />
        ) : (
          <meta name="robots" content="index, follow" />
        )}
      </Helmet>

      {/* Clean Top App Bar */}
      <Navbar
        user={user}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onQuickSearch={(plate) => handleSearchPlate(plate)}
        onOpenCreditModal={() => setShowCreditModal(true)}
        onOpenAuthModal={(mode = 'login') => setAuthModalState({ isOpen: true, mode })}
        onOpenSupportModal={() => setShowSupportModal(true)}
        onLogout={handleLogout}
        currentView={currentView}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* VIEW: Clean Android 16 Main Search Terminal */}
        {currentView === 'home' && (
          <div className="py-6 sm:py-10 md:py-12 max-w-3xl mx-auto px-3 sm:px-4 md:px-6 space-y-6 sm:space-y-8">
            {/* Minimalist Professional Header */}
            <div className="text-center space-y-2 pt-2 sm:pt-4">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#020617] tracking-tight">
                Compre e Venda Veículos <span className="text-blue-600">Sem Riscos Ocultos</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-medium max-w-lg mx-auto">
                Descubra em segundos o histórico real de leilão, sinistros, restrições financeiras e débitos direto pela placa.
              </p>
            </div>

            {/* Brazilian Stamped Plate Terminal Card (Frosted Glass Surface) */}
            <div className="glass-panel rounded-3xl p-4 sm:p-7 shadow-xl shadow-blue-500/10 space-y-4">
              <PlateInput
                onSearch={handleSearchPlate}
                isLoading={isQuerying}
                user={user}
                onOpenCreditModal={handleOpenCreditModal}
              />

              {/* Demo/Test Quick Tap Pills with Rich Informative Tooltips */}
              <div className="pt-2 border-t border-blue-100/90 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-600 font-bold text-[11px] flex items-center gap-1">
                  <Info className="w-3 h-3 text-blue-500" />
                  <span>Exemplos:</span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    {
                      label: 'BRA2E19',
                      desc: 'Mercosul',
                      title: 'Veículo Regular (Padrão Mercosul)',
                      info: 'Histórico 100% regular sem restrições, leilão, sinistro ou débitos em aberto.',
                      icon: ShieldCheck,
                      iconColor: 'text-emerald-400'
                    },
                    {
                      label: 'ABC1D23',
                      desc: 'Básica',
                      title: 'Dados Cadastrais e Licenciamento',
                      info: 'Consulta modelo, ano de fabricação, cor, motorização e situação ativa no DETRAN.',
                      icon: Car,
                      iconColor: 'text-blue-400'
                    },
                    {
                      label: 'SAV1010',
                      desc: 'Leilão',
                      title: 'Histórico de Leilão Identificado',
                      info: 'Detecta passagem em leilão financeiro ou seguradora, apontando lote e risco de aceitação.',
                      icon: Gavel,
                      iconColor: 'text-amber-400'
                    },
                    {
                      label: 'ROU8080',
                      desc: 'Alerta',
                      title: 'Alerta de Roubo ou Furto Ativo',
                      info: 'Identifica ocorrência policial no SINESP/Segurança Pública e impedimento de circulação.',
                      icon: AlertTriangle,
                      iconColor: 'text-red-400'
                    }
                  ].map((demo, idx) => {
                    const IconComponent = demo.icon;
                    const isTooltipOpen = activeTooltip === demo.label;
                    return (
                      <div
                        key={demo.label}
                        className="relative"
                        onMouseEnter={() => setActiveTooltip(demo.label)}
                        onMouseLeave={() => setActiveTooltip(null)}
                      >
                        <button
                          type="button"
                          id={`example-plate-btn-${demo.label.toLowerCase()}`}
                          title={`${demo.title}: ${demo.info}`}
                          onClick={() => {
                            triggerHaptic('selection');
                            setActiveTooltip(null);
                            handleSearchPlate(demo.label);
                          }}
                          onFocus={() => setActiveTooltip(demo.label)}
                          onBlur={() => setActiveTooltip(null)}
                          onTouchStart={() => {
                            // Touch toggle support
                            setActiveTooltip((prev) => (prev === demo.label ? null : demo.label));
                          }}
                          className="px-3 py-1 rounded-full glass-subtle hover:bg-blue-100/90 border border-blue-200 text-slate-900 hover:text-blue-700 font-mono text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <span className="font-black text-slate-950">{demo.label}</span>
                          <span className="text-[10px] text-slate-500 font-sans font-medium">({demo.desc})</span>
                        </button>

                        {/* Interactive Floating Tooltip */}
                        {isTooltipOpen && (
                          <div
                            role="tooltip"
                            className={`absolute bottom-full mb-2.5 z-40 pointer-events-none w-60 sm:w-64 p-3 rounded-2xl bg-slate-900/95 backdrop-blur-md text-white shadow-2xl border border-slate-700 text-left animate-in fade-in zoom-in-95 duration-150 ${
                              idx === 0
                                ? 'left-0 sm:left-1/2 sm:-translate-x-1/2'
                                : idx === 3
                                ? 'right-0 sm:left-1/2 sm:-translate-x-1/2'
                                : 'left-1/2 -translate-x-1/2'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <IconComponent className={`w-3.5 h-3.5 ${demo.iconColor} flex-shrink-0`} />
                              <span className="text-[11px] font-extrabold text-white tracking-tight leading-tight">
                                {demo.title}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                              {demo.info}
                            </p>
                            {/* Tooltip caret / arrow */}
                            <div
                              className={`absolute top-full -mt-px w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900/95 ${
                                idx === 0
                                  ? 'left-6 sm:left-1/2 sm:-translate-x-1/2'
                                  : idx === 3
                                  ? 'right-6 sm:left-1/2 sm:-translate-x-1/2'
                                  : 'left-1/2 -translate-x-1/2'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Queries Widget (If Logged In with history) */}
            {user && recentReports.length > 0 && (
              <div className="glass-panel rounded-3xl p-4 sm:p-5 shadow-lg shadow-blue-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg icon-3d-blue flex items-center justify-center text-white">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900">Consultas Recentes</h3>
                  </div>
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver todas</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {recentReports.map((rep) => (
                    <div
                      key={rep.id}
                      onClick={() => {
                        setActiveReport(rep);
                        setCurrentView('report');
                      }}
                      className="p-3.5 rounded-2xl glass-subtle hover:bg-white border border-blue-200/70 hover:border-blue-400 transition-all cursor-pointer flex items-center justify-between group active:scale-[0.98] shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl icon-3d-silver flex items-center justify-center text-blue-600 flex-shrink-0">
                          <Car className="w-4 h-4 text-blue-700" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-black text-slate-950 block">
                            {rep.plateFormatted || rep.plate}
                          </span>
                          <span className="text-[11px] text-slate-600 font-medium truncate block">
                            {rep.vehicle.marca} {rep.vehicle.modelo}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Action Navigation Grid (3D Realistic Badges & Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => {
                  if (user) {
                    setCurrentView('dashboard');
                  } else {
                    setAuthModalState({ isOpen: true, mode: 'login' });
                  }
                }}
                className="p-4 rounded-3xl glass-card hover:bg-white border border-blue-200/80 hover:border-blue-400 transition-all text-left group cursor-pointer active:scale-95 shadow-sm"
              >
                <div className="w-10 h-10 rounded-2xl icon-3d-blue flex items-center justify-center text-white mb-2.5 group-hover:scale-105 transition-transform">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-black text-slate-900 block">Minhas Consultas</span>
                <span className="text-[10px] text-slate-500 font-medium">Histórico salvo em nuvem</span>
              </button>

              <button
                onClick={() => setShowCreditModal(true)}
                className="p-4 rounded-3xl glass-card hover:bg-white border border-blue-200/80 hover:border-emerald-400 transition-all text-left group cursor-pointer active:scale-95 shadow-sm"
              >
                <div className="w-10 h-10 rounded-2xl icon-3d-green flex items-center justify-center text-white mb-2.5 group-hover:scale-105 transition-transform">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-black text-slate-900 block">Comprar Créditos</span>
                <span className="text-[10px] text-emerald-700 font-bold">Liberação PIX Imediata</span>
              </button>

              <button
                onClick={() => handleOpenLegal('privacidade')}
                className="p-4 rounded-3xl glass-card hover:bg-white border border-blue-200/80 hover:border-slate-400 transition-all text-left group cursor-pointer active:scale-95 shadow-sm"
              >
                <div className="w-10 h-10 rounded-2xl icon-3d-silver flex items-center justify-center text-slate-800 mb-2.5 group-hover:scale-105 transition-transform">
                  <Lock className="w-5 h-5 text-blue-700" />
                </div>
                <span className="text-xs font-black text-slate-900 block">Segurança</span>
                <span className="text-[10px] text-slate-500 font-medium">100% Homologado LGPD</span>
              </button>

              <button
                onClick={() => setShowSupportModal(true)}
                className="p-4 rounded-3xl glass-card hover:bg-white border border-blue-200/80 hover:border-blue-400 transition-all text-left group cursor-pointer active:scale-95 shadow-sm"
              >
                <div className="w-10 h-10 rounded-2xl icon-3d-purple flex items-center justify-center text-white mb-2.5 group-hover:scale-105 transition-transform">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-black text-slate-900 block">Ajuda & Suporte</span>
                <span className="text-[10px] text-purple-700 font-bold">Atendimento humano</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW: Free Preliminary Analysis Preview (Análise Gratuita) */}
        {currentView === 'preview' && freePreviewData && (
          <FreeAnalysisPreview
            preview={freePreviewData}
            user={user}
            onUnlockFullReport={(plateToUnlock) => {
              setPendingQuery({ plate: plateToUnlock, queryType: 'complete' });
              if (user && (user.credits >= 1 || user.role === 'admin')) {
                handleSearchPlate(plateToUnlock, 'complete', true);
              } else {
                setPlateCheckoutState({ isOpen: true, plate: plateToUnlock });
              }
            }}
            onChangePlate={() => {
              setCurrentView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* VIEW: Full Vehicle Report */}
        {currentView === 'report' && (
          <ReportView
            report={activeReport}
            isLoading={isQuerying}
            plateBeingQueried={queryingPlate}
            user={user}
            onUpgrade={handleUpgradeReport}
            onNewSearch={handleNewSearch}
            onRefreshReport={(plate) => handleSearchPlate(plate, 'complete', true)}
            onOpenCreditModal={handleOpenCreditModal}
          />
        )}

        {/* Lazy-loaded Secondary Views */}
        <Suspense fallback={<div className="py-20 text-center text-slate-400 text-xs">Carregando painel...</div>}>
          {/* VIEW: User Dashboard & History */}
          {currentView === 'dashboard' && (
            <UserDashboard
              user={user}
              onSelectReport={(rep) => {
                setActiveReport(rep);
                setCurrentView('report');
              }}
              onNewSearch={() => setCurrentView('home')}
              onOpenCreditModal={() => setShowCreditModal(true)}
            />
          )}

          {/* VIEW: User Profile, Statement & API Keys */}
          {currentView === 'profile' && (
            <UserProfileView
              user={user}
              onUpdateUser={(updated) => setUser(updated)}
              onOpenCreditModal={() => setShowCreditModal(true)}
            />
          )}

          {/* VIEW: Admin Panel */}
          {currentView === 'admin' && (
            <ErrorBoundary>
              <AdminPanel onBack={() => setCurrentView('home')} />
            </ErrorBoundary>
          )}

          {/* VIEW: 404 Not Found Page */}
          {currentView === 'not-found' && (
            <NotFoundView
              onNavigateHome={() => setCurrentView('home')}
              onSearchPlate={(plate) => handleSearchPlate(plate)}
              onOpenHelp={() => setShowSupportModal(true)}
            />
          )}
        </Suspense>
      </main>

      {/* Android 16 Bottom Navigation Bar for Mobile */}
      <Android16BottomNav
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenCreditModal={() => setShowCreditModal(true)}
        onOpenAuthModal={(mode = 'login') => setAuthModalState({ isOpen: true, mode })}
        user={user}
      />

      {/* Clean Compact Footer */}
      <Footer
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenLegal={handleOpenLegal}
        onOpenSupport={() => setShowSupportModal(true)}
      />

      {/* Offline Status Detector & Banner */}
      <OfflineBanner />

      {/* Modals wrapped in Suspense for zero initial load weight */}
      <Suspense fallback={null}>
        {/* Query Error Modal with Troubleshooting & Contingency Actions */}
        {queryErrorState.isOpen && (
          <QueryErrorModal
            isOpen={queryErrorState.isOpen}
            onClose={() => setQueryErrorState({ ...queryErrorState, isOpen: false })}
            plate={queryErrorState.plate}
            errorMessage={queryErrorState.errorMessage}
            onRetry={() => {
              if (queryErrorState.plate) {
                handleSearchPlate(queryErrorState.plate);
              }
            }}
            onOpenSupport={() => setShowSupportModal(true)}
            onOpenCredits={() => setShowCreditModal(true)}
          />
        )}

        {/* Support & Contact Ticket Modal */}
        {showSupportModal && (
          <ContactSupportModal
            isOpen={showSupportModal}
            onClose={() => setShowSupportModal(false)}
            defaultPlate={activeReport?.plate || queryingPlate}
            userEmail={user?.email || ''}
            userName={user?.name || ''}
          />
        )}

        {/* No Credits Notification Modal */}
        {noCreditsModalState.isOpen && (
          <NoCreditsModal
            isOpen={noCreditsModalState.isOpen}
            onClose={() => setNoCreditsModalState({ isOpen: false, plate: '', currentCredits: 0 })}
            plate={noCreditsModalState.plate}
            currentCredits={noCreditsModalState.currentCredits}
            onOpenPixCheckout={(plateToCheckout) => {
              setPlateCheckoutState({ isOpen: true, plate: plateToCheckout });
            }}
            onOpenPackagesModal={() => {
              setShowCreditModal(true);
            }}
            onSelectSamplePlate={(samplePlate) => {
              handleSearchPlate(samplePlate);
            }}
            onClaimSandboxCredits={async () => {
              await api.claimSandboxCredits();
              await refreshUser();
            }}
          />
        )}

        {/* Authentication Modal (Login / Register / Forgot Password) */}
        {authModalState.isOpen && (
          <AuthModal
            isOpen={authModalState.isOpen}
            initialMode={authModalState.mode}
            onClose={() => setAuthModalState({ ...authModalState, isOpen: false })}
            onAuthSuccess={handleAuthSuccess}
          />
        )}

        {/* Plate Checkout PIX Modal (Exclusive Consulta Completa R$ 49,90 Flow) */}
        {plateCheckoutState.isOpen && (
          <PlateCheckoutPixModal
            isOpen={plateCheckoutState.isOpen}
            plate={plateCheckoutState.plate || pendingQuery?.plate || ''}
            user={user}
            onClose={() => setPlateCheckoutState({ isOpen: false, plate: '' })}
            onOpenAuth={() => {
              setPlateCheckoutState({ isOpen: false, plate: '' });
              setAuthModalState({ isOpen: true, mode: 'register' });
            }}
            onConfirmAndSearch={async (plateToSearch) => {
              setPlateCheckoutState({ isOpen: false, plate: '' });
              await refreshUser();
              handleSearchPlate(plateToSearch, 'complete', true);
            }}
          />
        )}

        {/* Credits Purchase Modal */}
        {showCreditModal && (
          <CreditPurchaseModal
            isOpen={showCreditModal}
            onClose={() => setShowCreditModal(false)}
            packages={creditPackages}
            targetReportId={activeReport?.id}
            onReportUnlocked={() => {
              if (activeReport) {
                handleUpgradeReport();
              }
            }}
            onSuccess={(added) => {
              if (user) {
                setUser({ ...user, credits: user.credits + added });
              }
              if (pendingQuery) {
                const query = pendingQuery;
                setPendingQuery(null);
                handleSearchPlate(query.plate, query.queryType);
              }
            }}
          />
        )}

        {/* Legal & Compliance Modal */}
        {legalModalState.isOpen && (
          <LegalModal
            isOpen={legalModalState.isOpen}
            onClose={() => setLegalModalState({ ...legalModalState, isOpen: false })}
            initialTab={legalModalState.tab}
          />
        )}
      </Suspense>
    </div>
  );
}

export default App;
