import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clearSupabaseAuthSession, isSupabaseConfigured, supabase } from '../lib/supabase';

const AuthContext = createContext();
let initialSessionRequest = null;

export function useAuth() {
  return useContext(AuthContext);
}

function isAuthNetworkError(error) {
  return (
    error?.name === 'AuthRetryableFetchError' ||
    error?.message?.includes('Failed to fetch') ||
    error?.cause?.message?.includes('Failed to fetch')
  );
}

function getInitialSession() {
  if (!initialSessionRequest) {
    initialSessionRequest = supabase.auth.getSession().finally(() => {
      initialSessionRequest = null;
    });
  }

  return initialSessionRequest;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const ensureProfile = useCallback(async (sessionUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', sessionUser.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        const { data: newProfile, error: insertError } = await supabase.from('profiles').insert({
          user_id: sessionUser.id,
          display_name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'Habitronaut',
          avatar_url: sessionUser.user_metadata?.avatar_url || 'default',
          coins: 50,
          premium: false,
          league_id: 1,
          weekly_score: 0,
          bio: '',
          gecko_active: false,
        }).select().single();

        if (insertError) throw insertError;
        return newProfile;
      }

      return data;
    } catch (err) {
      if (err.code !== 'PGRST116') {
        console.error('Error ensuring profile:', err);
      }

      return { display_name: sessionUser.email?.split('@')[0], avatar_url: 'default' };
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let subscription = null;

    async function applySession(session) {
      const nextUser = session?.user ?? null;
      const nextProfile = nextUser ? await ensureProfile(nextUser) : null;

      if (!isMounted) return;

      setUser(nextUser);
      setProfile(nextProfile);
      setLoading(false);
    }

    async function loadInitialSession() {
      if (!isSupabaseConfigured) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return false;
      }

      try {
        const { data: { session }, error } = await getInitialSession();

        if (error) throw error;
        await applySession(session);
        return true;
      } catch (err) {
        console.warn('Unable to restore Supabase session:', err);

        if (isAuthNetworkError(err)) {
          clearSupabaseAuthSession();
        }

        if (!isMounted) return;

        setUser(null);
        setProfile(null);
        setLoading(false);
        return false;
      }
    }

    async function startAuth() {
      const sessionLoaded = await loadInitialSession();

      if (!isMounted || !sessionLoaded) return;

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        applySession(session);
      });
      subscription = data.subscription;
    }

    startAuth();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [ensureProfile]);

  const updateProfile = async (updates) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      setProfile(data);
      return data;
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  const signUp = async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName },
      },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <img src="/parth.png" alt="Parth" style={{ width: '120px', height: '120px', objectFit: 'contain', animation: 'float 2s ease-in-out infinite' }} />
        <p className="loading-text">Loading Habitropolis...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, updateProfile, loading, signUp, signIn, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}
