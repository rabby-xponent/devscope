'use client';

/**
 * Session provider (M24B). One source of identity for the app: resolves the
 * session on mount, re-resolves on auth changes, and owns the sign-in modal
 * state so any surface (demo wall, nav, gating chips) can open it.
 *
 * Signed-out is a first-class state: the local workspace works exactly as
 * before — this provider only ADDS an account layer.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AuthUser, getSessionUser, onSessionChange, signOutSession } from '@/lib/auth';
import AuthModal from '@/components/AuthModal';

interface SessionValue {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  openSignIn: () => void;
  closeSignIn: () => void;
  signInOpen: boolean;
}

const SessionContext = createContext<SessionValue>({
  user: null,
  loading: true,
  refresh: async () => {},
  signOut: async () => {},
  openSignIn: () => {},
  closeSignIn: () => {},
  signInOpen: false,
});

export function useSession(): SessionValue {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signInOpen, setSignInOpen] = useState(false);

  const refresh = useCallback(async () => {
    const next = await getSessionUser();
    setUser(next && next.id ? next : null);
    setLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    await signOutSession();
    setUser(null);
  }, []);

  useEffect(() => {
    void refresh();
    const off = onSessionChange(() => {
      void refresh();
    });
    return () => {
      off();
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
      signOut,
      openSignIn: () => setSignInOpen(true),
      closeSignIn: () => setSignInOpen(false),
      signInOpen,
    }),
    [user, loading, refresh, signOut, signInOpen]
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
      {signInOpen && (
        <AuthModal
          onClose={() => setSignInOpen(false)}
          onSignedIn={() => {
            void refresh();
            setSignInOpen(false);
          }}
        />
      )}
    </SessionContext.Provider>
  );
}
