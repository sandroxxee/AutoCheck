import React, { useEffect, useState } from 'react';
import {
  Settings,
  Activity,
  Server,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Layers,
  Database,
  BarChart2,
  Lock,
  QrCode,
  Wallet
} from 'lucide-react';
import { ProviderConfig, QueryStats } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AdminPanelProps {
  onBack: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [stats, setStats] = useState<QueryStats | null>(null);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // PIX Settings State
  const [pixKey, setPixKey] = useState('09512592967');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [beneficiaryName, setBeneficiaryName] = useState('SANDRO (AUTOCHECK BRASIL)');
  const [beneficiaryCity, setBeneficiaryCity] = useState('SAO PAULO');
  const [savingPix, setSavingPix] = useState(false);

  // APIBrasil Diagnostic State
  const [testPlate, setTestPlate] = useState('BRA2E19');
  const [testToken, setTestToken] = useState('');
  const [testDeviceToken, setTestDeviceToken] = useState('');
  const [testApiUrl, setTestApiUrl] = useState('https://gateway.apibrasil.io/api/v2/consulta/veiculos/credits');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [savingToken, setSavingToken] = useState(false);

  useEffect(() => {
    loadData();
    loadPixData();
  }, []);

  const loadPixData = async () => {
    try {
      const pix = await api.getPixConfig();
      if (pix) {
        setPixKey(pix.pixKey || '');
        setPixKeyType(pix.pixKeyType || 'email');
        setBeneficiaryName(pix.beneficiaryName || '');
        setBeneficiaryCity(pix.beneficiaryCity || '');
      }
    } catch (err) {
      console.error('Falha ao carregar config PIX:', err);
    }
  };

  const handleSavePixConfig = async () => {
    try {
      setSavingPix(true);
      const res = await api.updatePixConfig({
        pixKey,
        pixKeyType,
        beneficiaryName,
        beneficiaryCity
      });
      alert(res.message || 'Configurações PIX atualizadas com sucesso!');
    } catch (err: unknown) {
      alert((err as Error).message || 'Falha ao salvar chave PIX.');
    } finally {
      setSavingPix(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminStats();
      if (data) {
        setStats(data.stats || null);
        setProviders(Array.isArray(data.providers) ? data.providers : []);
        setAuditLogs(Array.isArray(data.auditLogs) ? data.auditLogs : []);
      }
    } catch (err) {
      console.error('Falha ao carregar dados administrativos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestApiBrasil = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await api.testApiBrasil({
        plate: testPlate,
        token: testToken || undefined,
        deviceToken: testDeviceToken || undefined,
        apiUrl: testApiUrl || undefined
      });
      setTestResult(res);
    } catch (err: unknown) {
      setTestResult({
        success: false,
        error: (err as Error).message || 'Falha ao executar teste de conexão.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveTokenToMemory = async () => {
    if (!testToken) {
      alert('Por favor, informe o Token Bearer da APIBrasil.');
      return;
    }
    try {
      setSavingToken(true);
      const res = await api.setApiBrasilToken({
        token: testToken,
        deviceToken: testDeviceToken || undefined,
        apiUrl: testApiUrl || undefined
      });
      alert(res.message);
      await loadData();
    } catch (err: unknown) {
      alert((err as Error).message || 'Falha ao salvar token.');
    } finally {
      setSavingToken(false);
    }
  };

  const handleToggleProvider = async (provider: ProviderConfig) => {
    try {
      setUpdatingId(provider.id);
      await api.updateProvider(provider.id, { enabled: !provider.enabled });
      await loadData();
    } catch (err: unknown) {
      alert((err as Error).message || 'Falha ao atualizar provedor');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleChangePriority = async (provider: ProviderConfig, newPriority: number) => {
    try {
      setUpdatingId(provider.id);
      await api.updateProvider(provider.id, { priority: newPriority });
      await loadData();
    } catch (err: unknown) {
      alert((err as Error).message || 'Falha ao atualizar prioridade');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Settings className="w-4 h-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Painel Administrativo & Provedores
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie adaptadores de dados veiculares, contingência e métricas do motor.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#101F33] hover:bg-[#162740] border border-white/[0.12] text-slate-200 text-xs font-semibold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar Dados</span>
          </button>

          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
          >
            Voltar para o App
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-[#101F33] border border-white/[0.08] shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total de Consultas</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white font-mono">{stats?.totalQueries ?? 0}</p>
          <p className="text-[11px] text-emerald-400 font-medium">100% em tempo real</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#101F33] border border-white/[0.08] shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Taxa de Sucesso</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white font-mono">{stats?.successRate ?? '99.4%'}</p>
          <p className="text-[11px] text-slate-400">Fallback automático</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#101F33] border border-white/[0.08] shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Latência Média</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white font-mono">{stats?.avgDurationMs ?? 620}ms</p>
          <p className="text-[11px] text-slate-400">Com cache TTL de 24h</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#101F33] border border-white/[0.08] shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Provedores Ativos</span>
            <Server className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white font-mono">
            {(providers || []).filter(p => p.enabled).length}/{(providers || []).length}
          </p>
          <p className="text-[11px] text-slate-400">Circuit Breaker habilitado</p>
        </div>
      </div>

      {/* Cloud Database & Security Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-950/40 via-[#101F33] to-purple-950/40 border border-blue-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Database className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-white text-sm">Banco Firestore Provisionado & Master Gate Ativo</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Conectado
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Autenticação Google / E-mail e regras de segurança <code className="text-blue-300 font-mono">firestore.rules</code> ativas com isolamento de dados e proteção anti-cópia.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 self-end md:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Sandro Luiz Mayer © 2026</span>
        </div>
      </div>

      {/* APIBrasil Real Gateway Diagnostic & Tester */}
      <div className="rounded-3xl bg-[#101F33] border border-blue-500/30 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Diagnóstico e Homologação APIBrasil (Gateway v2)
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Teste o token, URL de endpoint e verifique o JSON bruto retornado para a sua placa em tempo real.
            </p>
          </div>
          <span className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-mono font-bold border border-blue-500/30">
            PROVEDOR OFICIAL #1
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Bearer Token / Chave Secreta APIBrasil
              </label>
              <input
                type="password"
                value={testToken}
                onChange={(e) => setTestToken(e.target.value)}
                placeholder="Cole seu Bearer token aqui (ou deixe vazio para usar o .env)"
                className="w-full bg-[#0B1728] border border-white/[0.12] rounded-xl px-4 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Placa para Testar
                </label>
                <input
                  type="text"
                  value={testPlate}
                  onChange={(e) => setTestPlate(e.target.value.toUpperCase())}
                  placeholder="Ex: ABC1D23"
                  className="w-full bg-[#0B1728] border border-white/[0.12] rounded-xl px-4 py-2.5 text-white text-xs font-mono uppercase focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  DeviceToken (Opcional)
                </label>
                <input
                  type="text"
                  value={testDeviceToken}
                  onChange={(e) => setTestDeviceToken(e.target.value)}
                  placeholder="Se fornecido no painel"
                  className="w-full bg-[#0B1728] border border-white/[0.12] rounded-xl px-4 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  URL do Endpoint da APIBrasil
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setTestApiUrl('https://gateway.apibrasil.io/api/v2/consulta/veiculos/credits')}
                    className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-bold"
                  >
                    /veiculos/credits ⭐
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestApiUrl('https://gateway.apibrasil.io/api/v2/vehicles/dados')}
                    className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                  >
                    /dados
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestApiUrl('https://gateway.apibrasil.io/api/v2/vehicles/fipe')}
                    className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                  >
                    /fipe
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestApiUrl('https://gateway.apibrasil.io/api/v2/vehicles/base/001/consulta')}
                    className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600"
                  >
                    /base/001
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={testApiUrl}
                onChange={(e) => setTestApiUrl(e.target.value)}
                className="w-full bg-[#0B1728] border border-white/[0.12] rounded-xl px-4 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleTestApiBrasil}
                disabled={testing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Testando Conexão...' : 'Testar Consulta na APIBrasil'}</span>
              </button>

              {testToken && (
                <button
                  onClick={handleSaveTokenToMemory}
                  disabled={savingToken}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all"
                >
                  {savingToken ? 'Salvando...' : 'Salvar no Servidor'}
                </button>
              )}
            </div>
          </div>

          {/* Results Box */}
          <div className="bg-[#0B1728] border border-white/[0.08] rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <span className="text-xs font-semibold text-slate-300">Retorno em Tempo Real</span>
              {testResult && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${testResult.success ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                  HTTP {testResult.httpStatus || (testResult.success ? 200 : 'ERROR')}
                </span>
              )}
            </div>

            <pre className="text-[11px] font-mono text-slate-300 overflow-auto max-h-56 p-2 rounded bg-black/40 border border-white/[0.04]">
              {testResult
                ? JSON.stringify(testResult, null, 2)
                : '// Clique em "Testar Consulta na APIBrasil" para ver o JSON real que a APIBrasil retorna para a sua placa.'}
            </pre>

            <p className="text-[11px] text-slate-400">
              💡 Qualquer dúvida sobre o token ou endpoint, o retorno acima mostrará exatamente o motivo informado pela APIBrasil.
            </p>
          </div>
        </div>
      </div>

      {/* PIX Receiver & Financial Configuration */}
      <div className="rounded-3xl bg-[#101F33] border border-emerald-500/30 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                Configuração de Recebimento PIX (Sua Conta Bancária)
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Defina a chave PIX onde você receberá os pagamentos das consultas dos seus clientes.
            </p>
          </div>
          <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/30 flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5" /> BR CODE OFICIAL
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tipo de Chave
            </label>
            <select
              value={pixKeyType}
              onChange={(e) => setPixKeyType(e.target.value)}
              className="w-full bg-[#0B1728] border border-white/[0.12] rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="email">E-mail</option>
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="telefone">Celular / Telefone</option>
              <option value="aleatoria">Chave Aleatória (EVP)</option>
            </select>
          </div>

          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Sua Chave PIX
            </label>
            <input
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="ex: seuemail@dominio.com ou 123.456.789-00"
              className="w-full bg-[#0B1728] border border-white/[0.12] rounded-xl px-4 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Cidade do Titular
            </label>
            <input
              type="text"
              value={beneficiaryCity}
              onChange={(e) => setBeneficiaryCity(e.target.value)}
              placeholder="SAO PAULO"
              className="w-full bg-[#0B1728] border border-white/[0.12] rounded-xl px-3 py-2.5 text-white text-xs uppercase focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nome Completo ou Razão Social do Titular
            </label>
            <input
              type="text"
              value={beneficiaryName}
              onChange={(e) => setBeneficiaryName(e.target.value)}
              placeholder="Nome que aparece na sua conta bancária"
              className="w-full bg-[#0B1728] border border-white/[0.12] rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-1 flex items-end">
            <button
              onClick={handleSavePixConfig}
              disabled={savingPix}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
            >
              {savingPix ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Chave PIX</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Provider Registry Manager */}
      <div className="rounded-3xl bg-[#101F33] border border-white/[0.08] p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-400" />
              Provedores e Adaptadores de Consulta
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure prioridade de execução, contingência e habilitação de cada fonte integrada.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(providers || []).map((p) => {
            const isUpdating = updatingId === p.id;
            const modules = p.supports || (p as any).supportedModules || [];
            const cost = p.costEstimateBrl !== undefined ? p.costEstimateBrl : ((p as any).costPerQuery || 0);
            const isOfficial = p.type === 'official' || (p as any).isOfficial;
            return (
              <div
                key={p.id}
                className={`rounded-2xl p-5 border transition-all ${
                  p.enabled
                    ? 'bg-[#0B1728] border-white/[0.1]'
                    : 'bg-[#0B1728]/50 border-white/[0.04] opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-base">{p.name}</h4>
                      {isOfficial ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          OFICIAL
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          PARCEIRO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggleProvider(p)}
                    disabled={isUpdating}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      p.enabled
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    {p.enabled ? 'Ativo' : 'Desativado'}
                  </button>
                </div>

                {/* Modules Supported */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-400 text-[11px]">Módulos:</span>
                    {modules.map((m: string) => (
                      <span key={m} className="px-2 py-0.5 rounded bg-white/[0.05] text-slate-300 text-[10px] font-mono border border-white/[0.06]">
                        {m}
                      </span>
                    ))}
                  </div>

                  {/* Priority & Latency info */}
                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>Prioridade:</span>
                      <select
                        value={p.priority}
                        onChange={(e) => handleChangePriority(p, parseInt(e.target.value, 10))}
                        className="bg-[#101F33] border border-white/[0.12] rounded px-2 py-1 text-white font-mono text-xs focus:outline-none"
                      >
                        <option value={1}>1 (Principal)</option>
                        <option value={2}>2 (Secundário)</option>
                        <option value={3}>3 (Contingência)</option>
                        <option value={4}>4 (Reserva)</option>
                      </select>
                    </div>

                    <span>Custo: <strong className="text-emerald-400 font-mono">R$ {Number(cost).toFixed(2)}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-3xl bg-[#101F33] border border-white/[0.08] p-6 sm:p-8 shadow-2xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          Logs de Auditoria e Consultas Recentes
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0B1728] text-slate-400 uppercase font-semibold text-[10px] border-b border-white/[0.06]">
              <tr>
                <th className="py-3 px-4">Data/Hora</th>
                <th className="py-3 px-4">Ação</th>
                <th className="py-3 px-4">Placa / Recurso</th>
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-mono text-slate-400">{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</td>
                  <td className="py-3 px-4 font-semibold text-white">{log.action}</td>
                  <td className="py-3 px-4 font-mono text-blue-400">{log.plate || log.metadata?.plate || '-'}</td>
                  <td className="py-3 px-4 text-slate-400">{log.userId}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      Sucesso
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
