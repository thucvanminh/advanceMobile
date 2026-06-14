import React, { createContext, useContext, useEffect, useReducer, useMemo, useRef } from 'react';
import { auth } from '../services/firebase';
import { db } from '../services/firebase';
import type User from '@react-native-firebase/auth';

interface AuthState {
  user: User | null;
  userData: any | null;
  loading: boolean;
}

type AuthAction =
  | { type: 'SET_USER'; user: User | null }
  | { type: 'SET_USER_DATA'; data: any }
  | { type: 'SET_LOADING'; loading: boolean };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user, loading: false };
    case 'SET_USER_DATA':
      return { ...state, userData: action.data };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    default:
      return state;
  }
}

interface AuthContextValue {
  user: User | null;
  userData: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userData: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { user: null, userData: null, loading: true });
  const unsubSnapshot = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubAuth = auth().onAuthStateChanged((firebaseUser) => {
      // Clean snapshot cũ nếu có
      if (unsubSnapshot.current) {
        unsubSnapshot.current();
        unsubSnapshot.current = null;
      }

      if (firebaseUser) {
        dispatch({ type: 'SET_USER', user: firebaseUser as any });

        // Real-time snapshot → userData luôn cập nhật khi balance đổi
        unsubSnapshot.current = db.collection('users').doc(firebaseUser.uid)
          .onSnapshot(doc => {
            if (doc.exists) {
              dispatch({ type: 'SET_USER_DATA', data: { id: doc.id, ...doc.data() } });
            }
          });
      } else {
        dispatch({ type: 'SET_USER', user: null });
        dispatch({ type: 'SET_USER_DATA', data: null });
      }
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot.current) unsubSnapshot.current();
    };
  }, []);

  const value = useMemo(() => ({
    user: state.user,
    userData: state.userData,
    loading: state.loading,
    signIn: async (email: string, password: string) => {
      await auth().signInWithEmailAndPassword(email, password);
    },
    signUp: async (email: string, password: string) => {
      const cred = await auth().createUserWithEmailAndPassword(email, password);
      await db.collection('users').doc(cred.user.uid).set({
        email,
        displayName: email.split('@')[0],
        role: 'user',
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        settings: { theme: 'dark', currency: 'USDT', notificationsEnabled: true },
        paperBalance: { USDT: 10000 },
      });
    },
    signOut: async () => {
      await auth().signOut();
    },
  }), [state.user, state.userData, state.loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
