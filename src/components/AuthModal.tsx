import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api.ts';
import { UserAccount } from '../types/index.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserAccount) => void;
  initialMode?: 'login' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login'
}) => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [document, setDocument] = useState('');
  const [company, setCompany] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');

  if (!isOpen) return null;

  const resetFormState = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSwitchMode = (newMode: 'login' | 'register' | 'forgot' | 'reset') => {
    resetFormState();
    setMode(newMode);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const authenticatedUser = await loginWithEmail(email, password);
      setSuccessMessage('Login efetuado com sucesso!');
      setTimeout(() => {
        onAuthSuccess(authenticatedUser);
        onClose();
      }, 500);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Erro ao realizar login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMessage('Nome, e-mail e senha são obrigatórios.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('A confirmação de senha não confere.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const newUser = await registerWithEmail({
        name,
        email,
        password,
        phone: phone || undefined,
        document: document || undefined,
        company: company || undefined
      });
      setSuccessMessage('Conta criada com sucesso!');
      setTimeout(() => {
        onAuthSuccess(newUser);
        onClose();
      }, 700);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Erro ao criar conta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Informe seu e-mail cadastrado.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      await resetPassword(email);
      setSuccessMessage('Instruções de redefinição de senha enviadas para seu e-mail.');
      setMode('login');
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Erro ao solicitar recuperação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !recoveryCode || !password) {
      setErrorMessage('Preencha o e-mail, código de verificação e a nova senha.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await api.resetPassword({
        email,
        code: recoveryCode,
        newPassword: password
      });
      setSuccessMessage(res.message);
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      }, 1200);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Erro ao redefinir senha.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const authenticatedUser = await loginWithGoogle();
      setSuccessMessage(`Conectado com sucesso via Google!`);
      setTimeout(() => {
        onAuthSuccess(authenticatedUser);
        onClose();
      }, 500);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Falha ao autenticar com Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-blue-200/90 rounded-2xl shadow-2xl overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200">
        {/* Header line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-emerald-600 to-indigo-600" />

        <div className="p-6 sm:p-7">
          {/* Close button */}
          <button
            id="auth-modal-close-btn"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto mb-3 shadow-xs">
              {mode === 'login' && <Lock className="w-6 h-6" />}
              {mode === 'register' && <User className="w-6 h-6" />}
              {(mode === 'forgot' || mode === 'reset') && <KeyRound className="w-6 h-6" />}
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {mode === 'login' && 'Acessar Conta'}
              {mode === 'register' && 'Criar Conta Gratuita'}
              {mode === 'forgot' && 'Recuperar Senha'}
              {mode === 'reset' && 'Nova Senha'}
            </h2>

            <p className="text-xs text-slate-600 mt-1 font-medium">
              {mode === 'login' && 'Acesse suas consultas, saldo de créditos e histórico de placas.'}
              {mode === 'register' && 'Acesso rápido com Google ou cadastro de e-mail.'}
              {mode === 'forgot' && 'Digite seu e-mail para receber as instruções de recuperação.'}
              {mode === 'reset' && 'Insira o código de segurança e defina sua nova senha.'}
            </p>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Google Action Button */}
          {(mode === 'login' || mode === 'register') && (
            <div className="mb-4 space-y-3">
              <button
                id="google-quick-auth-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm flex items-center justify-center gap-3 shadow-xs hover:shadow-sm transition-all border border-slate-300 hover:border-slate-400 cursor-pointer active:scale-[0.98]"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16c1.8 3.7 5.6 6.3 10.1 6.3z"
                  />
                </svg>
                <span>{mode === 'register' ? 'Cadastrar com Google' : 'Entrar com Google'}</span>
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] uppercase font-bold text-slate-500 absolute">
                  ou via e-mail
                </span>
              </div>
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">E-mail</label>
                <div className="relative">
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    placeholder="seu.email@exemplo.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Senha</label>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('forgot')}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Sua senha secreta"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Entrar com E-mail</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2 space-y-2">
                <p className="text-xs text-slate-600">
                  Ainda não possui conta?{' '}
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('register')}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Cadastre-se grátis
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* MODE: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                <div className="relative">
                  <input
                    id="register-name-input"
                    type="text"
                    required
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 font-medium"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-mail *</label>
                <div className="relative">
                  <input
                    id="register-email-input"
                    type="email"
                    required
                    placeholder="seu.email@exemplo.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 font-medium"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Senha *</label>
                  <div className="relative">
                    <input
                      id="register-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Mínimo 6 dígitos"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 font-medium"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar *</label>
                  <div className="relative">
                    <input
                      id="register-confirm-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Repita a senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 font-medium"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              <button
                id="register-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Criar Conta com E-mail</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-600">
                  Já possui cadastro?{' '}
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('login')}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Fazer Login
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* MODE: FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">E-mail Cadastrado</label>
                <div className="relative">
                  <input
                    id="forgot-email-input"
                    type="email"
                    required
                    placeholder="seu.email@exemplo.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 font-medium"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <button
                id="forgot-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enviar Código de Recuperação</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors cursor-pointer"
                >
                  ← Voltar para o login
                </button>
              </div>
            </form>
          )}

          {/* MODE: RESET PASSWORD */}
          {mode === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Código de Segurança (6 dígitos)</label>
                <div className="relative">
                  <input
                    id="reset-code-input"
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Ex: 123456"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 tracking-widest font-mono uppercase focus:outline-none focus:bg-white focus:border-blue-600 font-medium"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nova Senha</label>
                <div className="relative">
                  <input
                    id="reset-new-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 font-medium"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <button
                id="reset-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Confirmar Nova Senha</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors cursor-pointer"
                >
                  ← Cancelar e voltar ao login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
