import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Car,
  Clock,
  Zap,
  ArrowRight,
  Search,
  CheckCircle2,
  XCircle,
  Gift,
  Sparkles
} from 'lucide-react';
import { ConsolidatedReport, UserAccount } from '../types/index.ts';
import { api } from '../services/api.ts';
import { getUserVehicleReportsFromFirestore } from '../services/firebase.ts';
import { MercosulPlate } from './MercosulPlate.tsx';

interface UserDashboardProps {
  user: UserAccount | null;
  onSelectReport: (report: ConsolidatedReport) => void;
  onNewSearch: () => void;
  onOpenCreditModal: () => void;
}

interface LoyaltyData {
  eligible: boolean;
  paidQueriesCount: number;
  loyaltyQueriesCount: number;
  rewardsAvailable: number;
  progressPercentage: number;
}

/**
 * Memoized Individual Report Card Component
 * Prevents re-rendering all cards when filtering or changing parent states
 */
interface ReportCardItemProps {
  item: ConsolidatedReport;
  onSelect: (report: ConsolidatedReport) => void;
}

const ReportCardItem: React.FC<ReportCardItemProps> = React.memo(({ item, onSelect }) => {
  const handleClick = useCallback(() => {
    onSelect(item);
  }, [onSelect, item]);

  const scoreBadgeStyle = useMemo(() => {
    if (item.score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (item.score >= 60) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }, [item.score]);

  const formattedDate = useMemo(() => {
    return new Date(item.createdAt).toLocaleDateString('pt-BR');
  }, [item.createdAt]);

  return (
    <div
      onClick={handleClick}
      className="rounded-2xl bg-white border border-blue-200/80 hover:border-blue-500 p-5 sm:p-6 transition-all duration-200 cursor-pointer group shadow-xs hover:shadow-md flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <MercosulPlate
            plate={item.plateFormatted || item.plate}
            size="xs"
            showRivets={false}
            showHologram={false}
            showQrCode={false}
          />

          <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${scoreBadgeStyle}`}>
            Score: {item.score}/100
          </div>
        </div>

        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
          {item.vehicle?.marca} {item.vehicle?.modelo}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Ano {item.vehicle?.anoFabricacao || '-'}/{item.vehicle?.anoModelo || '-'} • {item.vehicle?.cor} • {item.vehicle?.municipio}/{item.vehicle?.uf}
        </p>

        <div className="my-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs">
          {item.theft.status === 'NADA_CONSTA' ? (
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Roubo: Nada Consta
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-700 font-medium">
              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" /> Restrição Policial
            </span>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          {formattedDate}
        </span>

        <span className="text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold">
          <span>Ver consulta</span>
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
});
ReportCardItem.displayName = 'ReportCardItem';

/**
 * Memoized Loyalty Banner Card
 */
interface LoyaltyCardProps {
  loyalty: LoyaltyData;
  remainingForBonus: number;
}

const LoyaltyCard: React.FC<LoyaltyCardProps> = React.memo(({ loyalty, remainingForBonus }) => {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-blue-50 via-white to-emerald-50 border border-blue-200 p-5 sm:p-6 shadow-sm relative overflow-hidden">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
              <Gift className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Programa de Fidelidade AutoCheck
            </span>
            {loyalty.eligible && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                <Sparkles className="w-3 h-3" /> Desconto de 1 Crédito Pronto!
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            {loyalty.eligible
              ? 'Você tem 1 Consulta Grátis disponível por Fidelidade!'
              : `A cada 10 consultas pagas, ganhe 1 consulta 100% grátis`}
          </h3>
          
          <p className="text-xs text-slate-600 leading-relaxed">
            {loyalty.eligible ? (
              <span className="text-emerald-700 font-semibold">
                O desconto de 1 crédito será aplicado automaticamente na sua próxima consulta de placa. O saldo não será debitado!
              </span>
            ) : (
              <>
                Você completou <strong className="text-slate-900">{loyalty.loyaltyQueriesCount} de 10</strong> consultas do ciclo atual (Total histórico: {loyalty.paidQueriesCount} pagas). 
                Faltam apenas <strong className="text-amber-700">{remainingForBonus} consulta(s)</strong> para resgatar 1 crédito de desconto.
              </>
            )}
          </p>
        </div>

        <div className="w-full lg:w-80 space-y-2 bg-white/90 p-4 rounded-xl border border-blue-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Progresso do Bônus</span>
            <span className="text-slate-900 font-bold font-mono">
              {loyalty.loyaltyQueriesCount} / 10 ({loyalty.progressPercentage}%)
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                loyalty.eligible
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse'
                  : 'bg-gradient-to-r from-blue-600 to-amber-500'
              }`}
              style={{ width: `${Math.max(5, loyalty.progressPercentage)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>0 consultas</span>
            <span className="text-amber-700 font-semibold">★ 10 = 1 Grátis</span>
          </div>
        </div>
      </div>
    </div>
  );
});
LoyaltyCard.displayName = 'LoyaltyCard';

export const UserDashboard: React.FC<UserDashboardProps> = React.memo(({
  user,
  onSelectReport,
  onNewSearch,
  onOpenCreditModal
}) => {
  const [queries, setQueries] = useState<ConsolidatedReport[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyData>({
    eligible: false,
    paidQueriesCount: user?.paidQueriesCount || 0,
    loyaltyQueriesCount: user?.loyaltyQueriesCount || 0,
    rewardsAvailable: user?.loyaltyRewardsEarned || 0,
    progressPercentage: Math.min(100, Math.round(((user?.loyaltyQueriesCount || 0) / 10) * 100))
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [queriesData, firestoreReports, loyaltyData] = await Promise.all([
        api.getUserQueries().catch(() => []),
        getUserVehicleReportsFromFirestore(user?.id).catch(() => []),
        api.getLoyaltyStatus().catch(() => null)
      ]);

      const mergedMap = new Map<string, ConsolidatedReport>();
      [...firestoreReports, ...queriesData].forEach((rep) => {
        if (rep && rep.id && !mergedMap.has(rep.id)) {
          mergedMap.set(rep.id, rep);
        }
      });

      const mergedQueries = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setQueries(mergedQueries.length > 0 ? mergedQueries : queriesData);
      if (loyaltyData) {
        setLoyalty(loyaltyData);
      }
    } catch (err) {
      console.error('Falha ao carregar dados do painel:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  }, []);

  const filteredQueries = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return queries;
    return queries.filter((q) =>
      q.plate.toLowerCase().includes(term) ||
      (q.plateFormatted && q.plateFormatted.toLowerCase().includes(term)) ||
      (q.vehicle?.modelo && q.vehicle.modelo.toLowerCase().includes(term)) ||
      (q.vehicle?.marca && q.vehicle.marca.toLowerCase().includes(term))
    );
  }, [queries, filter]);

  const remainingForBonus = useMemo(() => {
    return Math.max(0, 10 - loyalty.loyaltyQueriesCount);
  }, [loyalty.loyaltyQueriesCount]);

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-200/70 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Minhas Consultas Veiculares
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Acompanhe o histórico de consultas de veículos, programa de fidelidade e gerencie seu saldo de créditos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="dash-buy-credits-btn"
            onClick={onOpenCreditModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs transition-colors cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Saldo: {user?.credits ?? 0} créditos</span>
          </button>

          <button
            id="dash-new-query-btn"
            onClick={onNewSearch}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Car className="w-4 h-4" />
            <span>Nova Consulta</span>
          </button>
        </div>
      </div>

      {/* Cartão do Programa de Fidelidade Memoizado */}
      <LoyaltyCard loyalty={loyalty} remainingForBonus={remainingForBonus} />

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Filtrar por placa ou modelo..."
            value={filter}
            onChange={handleFilterChange}
            className="w-full bg-white border border-blue-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Query History Table / Cards */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Carregando consultas registradas...</p>
        </div>
      ) : filteredQueries.length === 0 ? (
        <div className="rounded-2xl bg-white border border-blue-200/80 p-12 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto">
            <Car className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Nenhuma consulta encontrada</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Você ainda não possui consultas cadastradas com estes termos. Inicie uma nova consulta pela placa.
          </p>
          <button
            onClick={onNewSearch}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer"
          >
            Fazer primeira consulta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQueries.map((item) => (
            <ReportCardItem
              key={item.id}
              item={item}
              onSelect={onSelectReport}
            />
          ))}
        </div>
      )}
    </div>
  );
});
UserDashboard.displayName = 'UserDashboard';
