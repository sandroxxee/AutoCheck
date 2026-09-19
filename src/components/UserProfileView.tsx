import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Building,
  Shield,
  CreditCard,
  Lock,
  Key,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Zap,
  Gift
} from 'lucide-react';
import { UserAccount, CreditTransaction } from '../types/index.ts';
import { api } from '../services/api.ts';

interface UserProfileViewProps {
  user: UserAccount | null;
  onUpdateUser: (updatedUser: UserAccount) => void;
  onOpenCreditModal: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  onUpdateUser,
  onOpenCreditModal
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'statement' | 'security' | 'api'>('profile');
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [document, setDocument] = useState(user?.document || '');
  const [company, setCompany] = useState(user?.company || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      setDocument(user.document || '');
      setCompany(user.company || '');
    }
  }, [user]);

  const loadTransactions = async () => {
    try {
      setIsLoadingTx(true);
      const data = await api.getTransactions();
      setTransactions(data);
    } catch {
      setTransactions([]);
    } finally {
      setIsLoadingTx(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'statement') {
      loadTransactions();
    }
  }, [activeTab]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      setFeedback(null);
      const updated = await api.updateProfile({
        name,
        phone,
        document,
        company
      });
      if (updated.user) {
        onUpdateUser(updated.user);
      }
      setFeedback({ type: 'success', message: 'Dados cadastrais atualizados com sucesso!' });
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: (err as Error).message || 'Erro ao salvar alterações.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'A confirmação da nova senha não confere.' });
      return;
    }
    if (newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'A nova senha deve conter no mínimo 6 caracteres.' });
      return;
    }

    try {
      setIsChangingPass(true);
      setFeedback(null);
      const res = await api.changePassword({ oldPassword, newPassword });
      setFeedback({ type: 'success', message: res.message || 'Senha alterada com sucesso!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: (err as Error).message || 'Erro ao alterar senha.' });
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleCopyApiKey = () => {
    if (user?.apiKey) {
      navigator.clipboard.writeText(user.apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Profile Header Banner */}
      <div className="rounded-2xl bg-white border border-blue-200/90 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm relative overflow-hidden text-slate-900">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 border border-blue-700 flex items-center justify-center text-white text-2xl font-black shadow-md">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900">{user?.name || 'Minha Conta'}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                Plano {user?.plan?.toUpperCase() || 'FREE'}
              </span>
              {user?.role === 'admin' && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                  🛡️ Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1 font-medium">{user?.email || 'email@exemplo.com.br'}</p>
          </div>
        </div>

        {/* Balance Card & Quick Action */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto relative z-10">
          {/* Cartão de Saldo de Créditos */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Saldo de Consultas</p>
              <p className="text-xl font-black text-slate-900">{user?.credits ?? 0} <span className="text-xs font-semibold text-slate-600">créditos</span></p>
            </div>
          </div>

          {/* Cartão de Programa de Fidelidade (10 consultas pagas = 1 grátis) */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] uppercase font-bold text-blue-900 tracking-wider">Fidelidade</p>
                {(user?.loyaltyRewardsEarned ?? 0) > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                )}
              </div>
              <p className="text-xs font-black text-slate-900">
                {(user?.loyaltyRewardsEarned ?? 0) > 0 ? (
                  <span className="text-emerald-700 font-black">1 Grátis Pronta!</span>
                ) : (
                  <span>{user?.loyaltyQueriesCount ?? 0} / 10 <span className="text-slate-600 font-normal">consultas</span></span>
                )}
              </p>
            </div>
          </div>

          <button
            id="profile-buy-credits-btn"
            onClick={onOpenCreditModal}
            className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
          >
            + Recarregar
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1 text-sm font-bold">
        <button
          id="tab-profile-btn"
          onClick={() => { setActiveTab('profile'); setFeedback(null); }}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'profile' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
        >
          <User className="w-4 h-4" />
          Dados Cadastrais
        </button>

        <button
          id="tab-statement-btn"
          onClick={() => { setActiveTab('statement'); setFeedback(null); }}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'statement' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
        >
          <CreditCard className="w-4 h-4" />
          Extrato de Créditos
        </button>

        <button
          id="tab-security-btn"
          onClick={() => { setActiveTab('security'); setFeedback(null); }}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'security' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
        >
          <Lock className="w-4 h-4" />
          Segurança & Senha
        </button>

        <button
          id="tab-api-btn"
          onClick={() => { setActiveTab('api'); setFeedback(null); }}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'api' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
        >
          <Key className="w-4 h-4" />
          API & Integrações
        </button>
      </div>

      {/* Feedback Alerts */}
      {feedback && (
        <div className={`p-4 rounded-xl border text-xs font-medium flex items-start gap-3 animate-in fade-in ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* TAB CONTENT: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-blue-200/90 rounded-2xl p-6 sm:p-8 space-y-6 text-slate-900 shadow-sm">
          <div>
            <h2 className="text-lg font-black text-slate-900">Informações Pessoais e Cadastrais</h2>
            <p className="text-xs text-slate-600 mt-1 font-medium">Mantenha seus dados atualizados para emissão correta de consultas e comprovantes fiscais.</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nome Completo / Razão Social</label>
                <div className="relative">
                  <input
                    id="profile-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">E-mail Principal</label>
                <div className="relative">
                  <input
                    id="profile-email-input"
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-500 cursor-not-allowed font-medium"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Telefone / Celular</label>
                <div className="relative">
                  <input
                    id="profile-phone-input"
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">CPF ou CNPJ</label>
                <div className="relative">
                  <input
                    id="profile-document-input"
                    type="text"
                    placeholder="000.000.000-00"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Empresa / Concessionária (Opcional)</label>
                <div className="relative">
                  <input
                    id="profile-company-input"
                    type="text"
                    placeholder="Nome da loja ou revenda"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                id="profile-save-btn"
                type="submit"
                disabled={isSavingProfile}
                className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSavingProfile ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB CONTENT: STATEMENT */}
      {activeTab === 'statement' && (
        <div className="bg-white border border-blue-200/90 rounded-2xl p-6 sm:p-8 space-y-6 text-slate-900 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Extrato de Movimentação de Créditos</h2>
              <p className="text-xs text-slate-600 mt-1 font-medium">Histórico completo de compras, bônus e consumo de consultas.</p>
            </div>

            <button
              id="statement-reload-btn"
              onClick={loadTransactions}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
            >
              Atualizar extrato
            </button>
          </div>

          {isLoadingTx ? (
            <div className="py-12 text-center text-slate-600 text-xs flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Carregando extrato de movimentações...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-600 text-xs font-medium">
              Nenhuma transação registrada nesta conta até o momento.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      tx.type === 'loyalty_reward'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200 animate-pulse'
                        : tx.type === 'credit'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {tx.type === 'loyalty_reward' ? (
                        <Gift className="w-4 h-4 text-amber-600" />
                      ) : tx.type === 'credit' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">{tx.description}</p>
                        {tx.type === 'loyalty_reward' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                            100% OFF
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-0.5 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(tx.timestamp).toLocaleString('pt-BR')}</span>
                        {tx.paymentMethod && <span>• {tx.paymentMethod}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-sm font-black ${
                      tx.type === 'loyalty_reward'
                        ? 'text-amber-700'
                        : tx.type === 'credit'
                        ? 'text-emerald-700'
                        : 'text-slate-800'
                    }`}>
                      {tx.type === 'loyalty_reward'
                        ? '1 Grátis'
                        : `${tx.type === 'credit' ? '+' : '-'}${tx.amount} ${tx.amount === 1 ? 'crédito' : 'créditos'}`}
                    </span>
                    {tx.type === 'loyalty_reward' ? (
                      <p className="text-[11px] text-emerald-700 font-bold">R$ 0,00 (Fidelidade)</p>
                    ) : tx.priceBrl ? (
                      <p className="text-[11px] text-slate-600 font-medium">R$ {tx.priceBrl.toFixed(2)}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SECURITY */}
      {activeTab === 'security' && (
        <div className="bg-white border border-blue-200/90 rounded-2xl p-6 sm:p-8 space-y-6 text-slate-900 shadow-sm">
          <div>
            <h2 className="text-lg font-black text-slate-900">Alterar Senha de Acesso</h2>
            <p className="text-xs text-slate-600 mt-1 font-medium">Recomendamos utilizar uma senha forte contendo letras, números e símbolos.</p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Senha Atual</label>
              <input
                id="old-password-input"
                type="password"
                required
                placeholder="Informe sua senha atual"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Nova Senha</label>
              <input
                id="new-password-input"
                type="password"
                required
                placeholder="Mínimo de 6 dígitos"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirmar Nova Senha</label>
              <input
                id="confirm-new-password-input"
                type="password"
                required
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
              />
            </div>

            <div className="pt-2">
              <button
                id="change-password-submit-btn"
                type="submit"
                disabled={isChangingPass}
                className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isChangingPass ? 'Processando...' : 'Atualizar Senha'}
              </button>
            </div>
          </form>

          {/* Delete Account (LGPD) */}
          <div className="pt-6 border-t border-rose-200 mt-6">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-rose-800 flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  Apagar Minha Conta
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  Exclusão definitiva de todos os seus dados cadastrais, histórico e créditos conforme a LGPD.
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Tem certeza de que deseja apagar sua conta permanentemente? Esta ação não pode ser desfeita.')) {
                    try {
                      await api.deleteAccount();
                      window.location.reload();
                    } catch (err: unknown) {
                      alert((err as Error).message || 'Erro ao apagar conta.');
                    }
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 font-bold text-xs transition-colors whitespace-nowrap cursor-pointer"
              >
                Apagar Conta Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: API */}
      {activeTab === 'api' && (
        <div className="bg-white border border-blue-200/90 rounded-2xl p-6 sm:p-8 space-y-6 text-slate-900 shadow-sm">
          <div>
            <h2 className="text-lg font-black text-slate-900">Chave de API & Integração B2B</h2>
            <p className="text-xs text-slate-600 mt-1 font-medium">Conecte seus sistemas de ERP, revendas ou sistemas internos via JSON API.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700">Sua Chave Privada (Bearer Token)</label>
            <div className="flex items-center gap-2">
              <input
                id="api-key-display-input"
                type="text"
                readOnly
                value={user?.apiKey || 'ac_live_sec_demo_key_7719a'}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-emerald-800 font-mono font-bold focus:outline-none select-all"
              />
              <button
                id="copy-api-key-btn"
                type="button"
                onClick={handleCopyApiKey}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors flex-shrink-0 cursor-pointer"
                title="Copiar Chave de API"
              >
                {copiedKey ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              Nunca compartilhe sua chave de API publicamente. Ela consome diretamente do seu saldo de créditos.
            </p>
          </div>

          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 text-xs font-mono space-y-2 text-slate-200">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Exemplo de Chamada cURL:</p>
            <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`curl -X POST https://autocheck.com.br/api/vehicle/check \\
  -H "Authorization: Bearer ${user?.apiKey || 'SUA_CHAVE_AQUI'}" \\
  -H "Content-Type: application/json" \\
  -d '{"plate": "ABC1D23", "queryType": "complete"}'`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
