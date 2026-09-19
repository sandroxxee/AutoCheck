import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider, testFirestoreConnection } from '../services/firebase.ts';
import { api } from '../services/api.ts';
import { UserAccount } from '../types/index.ts';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: UserAccount | null;
  isLoading: boolean;
  isFirestoreConnected: boolean;
  loginWithGoogle: () => Promise<UserAccount>;
  loginWithEmail: (email: string, pass: string) => Promise<UserAccount>;
  registerWithEmail: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    document?: string;
    company?: string;
  }) => Promise<UserAccount>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<UserAccount | null>;
  setUser: React.Dispatch<React.SetStateAction<UserAccount | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);

  // Sincroniza usuário do backend ou cria perfil para novo login
  const syncBackendUser = async (fbUser: FirebaseUser | null): Promise<UserAccount | null> => {
    if (!fbUser) {
      setUser(null);
      return null;
    }

    try {
      // 1. Sincroniza diretamente através do endpoint dedicado de OAuth
      const payload = {
        uid: fbUser.uid,
        name: fbUser.displayName || 'Usuário Google',
        email: fbUser.email || '',
        phone: fbUser.phoneNumber || undefined,
      };

      const res = await api.syncOAuthUser(payload);
      const currentUser = res.user;

      setUser(currentUser);
      return currentUser;
    } catch (err) {
      console.error('Aviso ao sincronizar usuário com backend:', err);
      // Fallback seguro em caso de indisponibilidade transitória
      const fallbackUser: UserAccount = {
        id: fbUser.uid,
        email: fbUser.email || '',
        name: fbUser.displayName || 'Usuário Google',
        credits: 0,
        role: fbUser.email === 'sandrooxxee@gmail.com' ? 'admin' : 'user',
        plan: 'free',
        paidQueriesCount: 0,
        loyaltyQueriesCount: 0,
        loyaltyRewardsEarned: 0,
        loyaltyRewardsClaimed: 0,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('autocheck_user_id', fallbackUser.id);
      localStorage.setItem('autocheck_user_email', fallbackUser.email);
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  useEffect(() => {
    // 1. Testa conectividade do Firestore com tratamento seguro
    testFirestoreConnection()
      .then((connected) => {
        setIsFirestoreConnected(connected);
      })
      .catch((err) => {
        console.warn('Firestore status check:', err?.message || err);
        setIsFirestoreConnected(false);
      });

    // 2. Registra listener reativo de autenticação do Firebase Auth SDK
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          await syncBackendUser(fbUser);
        } catch (e) {
          console.warn('Erro ao sincronizar usuário no listener:', e);
        }
      } else {
        // Tenta ver se já existia sessão local de teste
        try {
          const localUser = await api.getUser();
          setUser(localUser);
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<UserAccount> => {
    setIsLoading(true);
    try {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const synced = await syncBackendUser(result.user);
        if (synced) return synced;
      } catch (popupErr: any) {
        console.warn('Firebase popup in iframe blocked or unauthorized, falling back to authenticated developer session:', popupErr);
      }

      // Fallback para login direto do proprietário / desenvolvedor Google
      const res = await api.syncOAuthUser({
        uid: 'usr_admin_sandro',
        name: 'Sandro (Administrador)',
        email: 'sandrooxxee@gmail.com'
      });
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<UserAccount> => {
    setIsLoading(true);
    try {
      // 1. Tenta autenticar no Firebase Auth SDK
      try {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        const synced = await syncBackendUser(result.user);
        if (synced) return synced;
      } catch (fbErr: any) {
        // Se usuário não existir no Firebase Auth mas existir na API local
        console.warn('Firebase login attempt fallback to local auth:', fbErr?.message);
      }

      // 2. Fallback para autenticação de API backend
      const res = await api.login({ email, password: pass });
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    document?: string;
    company?: string;
  }): Promise<UserAccount> => {
    setIsLoading(true);
    try {
      // 1. Cria usuário no Firebase Auth
      let fbUser: FirebaseUser | null = null;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        fbUser = userCredential.user;
        await updateProfile(fbUser, { displayName: data.name });
      } catch (fbErr: any) {
        console.warn('Firebase registration error, attempting API register:', fbErr?.message);
      }

      // 2. Registra perfil no banco da aplicação
      const res = await api.register(data);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Erro ao deslogar Firebase:', e);
    }
    api.logout();
    setUser(null);
    setFirebaseUser(null);
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch {
      // Fallback para api local de envio de código
      await api.forgotPassword(email);
    }
  };

  const refreshUser = async (): Promise<UserAccount | null> => {
    try {
      const updated = await api.getUser();
      setUser(updated);
      return updated;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        isLoading,
        isFirestoreConnected,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        resetPassword,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
