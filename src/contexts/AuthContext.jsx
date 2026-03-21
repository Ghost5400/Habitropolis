import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureProfile(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureProfile(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const ensureProfile = async (user) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (!data) {
        await supabase.from('profiles').insert({
          user_id: user.id,
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Habitronaut',
          avatar_url: user.user_metadata?.avatar_url || null,
          coins: 50,
          premium: false,
          league_id: 1,
          weekly_score: 0,
        });
      }
    } catch (err) {
      // Profile might already exist, that's fine
      if (err.code !== 'PGRST116') {
        console.error('Error ensuring profile:', err);
      }
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
        <div className="loading-spinner" />
        <p className="loading-text">Loading Habitropolis...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}