import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  isSessionExpired,
  getStoredLoginTimestamp,
  setStoredLoginTimestamp,
  clearStoredLoginTimestamp,
  getRemainingSessionHours,
  formatRemainingSession,
} from '@/lib/auth-session';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isOffline: boolean;
  hoursRemaining: number;
  sessionExpiryText: string;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [loginTimestamp, setLoginTimestamp] = useState<number | null>(getStoredLoginTimestamp());

  // Listen to network status changes
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleForcedLogout = useCallback(async () => {
    clearStoredLoginTimestamp();
    setLoginTimestamp(null);
    setUser(null);
    setSession(null);
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore offline signOut failure
      }
    }
  }, []);

  // Periodic 192-hour expiry check
  useEffect(() => {
    const checkExpiry = () => {
      const ts = getStoredLoginTimestamp();
      if (ts && isSessionExpired(ts)) {
        console.warn('Authentication session exceeded 192 hours. Forcing sign-out.');
        handleForcedLogout();
      } else {
        setLoginTimestamp(ts);
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [handleForcedLogout]);

  // Initial session hydration
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false);
        return;
      }

      try {
        const storedTs = getStoredLoginTimestamp();

        // If stored timestamp is already expired, clear everything
        if (storedTs && isSessionExpired(storedTs)) {
          await handleForcedLogout();
          if (isMounted) setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Error fetching Supabase session:', error.message);
        }

        if (data.session) {
          if (!storedTs) {
            // First time or restored session without timestamp
            setStoredLoginTimestamp();
            setLoginTimestamp(Date.now());
          }
          if (isMounted) {
            setSession(data.session);
            setUser(data.session.user);
          }
        } else {
          // No active session
          clearStoredLoginTimestamp();
          if (isMounted) {
            setSession(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initSession();

    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const currentTs = getStoredLoginTimestamp();
          if (!currentTs || event === 'SIGNED_IN') {
            setStoredLoginTimestamp();
            setLoginTimestamp(Date.now());
          }
          setSession(newSession);
          setUser(newSession?.user ?? null);
        } else if (event === 'SIGNED_OUT') {
          clearStoredLoginTimestamp();
          setLoginTimestamp(null);
          setSession(null);
          setUser(null);
        }
      });

      return () => {
        isMounted = false;
        authListener.subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, [handleForcedLogout]);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        error: 'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.session) {
        const now = Date.now();
        setStoredLoginTimestamp(now);
        setLoginTimestamp(now);
        setSession(data.session);
        setUser(data.session.user);
        return { error: null };
      }

      return { error: 'Sign-in failed. Please verify your credentials.' };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Network error during sign in',
      };
    }
  };

  const signOut = async (): Promise<void> => {
    await handleForcedLogout();
  };

  const hoursRemaining = useMemo(() => {
    return loginTimestamp ? getRemainingSessionHours(loginTimestamp) : 0;
  }, [loginTimestamp]);

  const sessionExpiryText = useMemo(() => {
    return loginTimestamp ? formatRemainingSession(loginTimestamp) : 'Expired';
  }, [loginTimestamp]);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isConfigured: isSupabaseConfigured,
      isOffline,
      hoursRemaining,
      sessionExpiryText,
      signIn,
      signOut,
    }),
    [user, session, loading, isOffline, hoursRemaining, sessionExpiryText]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
