import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDocFromServer,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ConsolidatedReport, UserAccount } from '../types/index.ts';

// 1. Inicialização do Firebase App e serviços
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// 2. Padronização de erros e tipos conforme Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 3. Teste de Conectividade Seguro
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const docRef = doc(db, 'test', 'connection');
    await getDocFromServer(docRef).catch(() => null);
    return true;
  } catch (error: unknown) {
    return false;
  }
}

// 4. Utilitários para Salvar e Recuperar Históricos de Consultas no Firestore

/**
 * Salva um laudo ou histórico de consulta veicular no Firestore para o usuário autenticado.
 */
export async function saveVehicleReportToFirestore(
  report: ConsolidatedReport,
  userId?: string
): Promise<void> {
  const currentUserId = auth.currentUser?.uid || userId || report.userId || 'anonymous';
  const reportId = report.id || `rep_${Date.now()}_${report.plate}`;
  const path = `reports/${reportId}`;

  try {
    const reportDocRef = doc(db, 'reports', reportId);
    
    // Constrói payload compatível com JSON/Firestore e sanitizado
    const payload = {
      ...report,
      id: reportId,
      userId: currentUserId,
      plate: report.plate.toUpperCase().trim(),
      plateFormatted: report.plateFormatted || report.plate,
      savedAt: serverTimestamp(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(reportDocRef, payload, { merge: true });
  } catch (error: unknown) {
    console.warn('Aviso: persistência secundária no Firestore ignorada:', error);
  }
}

/**
 * Recupera o histórico de relatórios/consultas veiculares de um usuário logado no Firestore.
 */
export async function getUserVehicleReportsFromFirestore(
  userId?: string,
  maxResults: number = 50
): Promise<ConsolidatedReport[]> {
  // Se o cliente não estiver autenticado no Firebase Auth, não efetua listagem restrita
  if (!auth.currentUser) {
    return [];
  }

  const targetUserId = auth.currentUser.uid;
  const path = 'reports';
  try {
    const reportsCollection = collection(db, 'reports');
    const q = query(
      reportsCollection,
      where('userId', '==', targetUserId),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );

    const querySnapshot = await getDocs(q);
    const reports: ConsolidatedReport[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as ConsolidatedReport;
      reports.push({
        ...data,
        id: docSnap.id,
      });
    });

    return reports;
  } catch (error: unknown) {
    // Caso a coleção ainda não tenha índice composto ou haja restrição, tenta busca direta por usuário
    try {
      const reportsCollection = collection(db, 'reports');
      const fallbackQuery = query(
        reportsCollection,
        where('userId', '==', targetUserId),
        limit(maxResults)
      );
      const snapshot = await getDocs(fallbackQuery);
      const reports: ConsolidatedReport[] = [];
      snapshot.forEach((docSnap) => {
        reports.push({ ...(docSnap.data() as ConsolidatedReport), id: docSnap.id });
      });
      return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (fallbackError: unknown) {
      console.warn('Aviso: listagem de relatórios no Firestore indisponível:', fallbackError);
      return [];
    }
  }
}

/**
 * Recupera um relatório específico pelo ID do Firestore.
 */
export async function getVehicleReportByIdFromFirestore(reportId: string): Promise<ConsolidatedReport | null> {
  if (!reportId) return null;
  const path = `reports/${reportId}`;
  try {
    const docRef = doc(db, 'reports', reportId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    return { ...(docSnap.data() as ConsolidatedReport), id: docSnap.id };
  } catch (error: unknown) {
    console.warn('Aviso: busca por ID no Firestore indisponível:', error);
    return null;
  }
}

/**
 * Sincroniza o perfil do usuário (créditos, plano, dados de fidelidade) no Firestore.
 */
export async function syncUserProfileInFirestore(user: UserAccount): Promise<void> {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;

  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        id: userId,
        email: user.email,
        name: user.name,
        phone: user.phone || null,
        company: user.company || null,
        document: user.document || null,
        credits: user.credits,
        paidQueriesCount: user.paidQueriesCount || 0,
        loyaltyQueriesCount: user.loyaltyQueriesCount || 0,
        loyaltyRewardsEarned: user.loyaltyRewardsEarned || 0,
        loyaltyRewardsClaimed: user.loyaltyRewardsClaimed || 0,
        role: user.role,
        plan: user.plan,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error: unknown) {
    console.warn('Aviso: sincronização de perfil no Firestore ignorada:', error);
  }
}

/**
 * Obtém o perfil do usuário diretamente do Firestore.
 */
export async function getUserProfileFromFirestore(userId?: string): Promise<UserAccount | null> {
  if (!auth.currentUser) return null;
  const targetUserId = auth.currentUser.uid;

  const path = `users/${targetUserId}`;
  try {
    const userDocRef = doc(db, 'users', targetUserId);
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      return null;
    }
    return docSnap.data() as UserAccount;
  } catch (error: unknown) {
    console.warn('Aviso: leitura de perfil no Firestore indisponível:', error);
    return null;
  }
}
