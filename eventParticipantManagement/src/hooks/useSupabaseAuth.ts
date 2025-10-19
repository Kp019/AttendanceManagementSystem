import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
// import { config } from '../config/env';

interface UserProfile {
  id: string;
  name: string;
  role: 'participant' | 'admin';
  email: string;
}

interface AuthState {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export const useSupabaseAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setState(prev => ({
          ...prev,
          session,
          loading: false,
        }));
        fetchUserProfile(session.user.id);
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
        }));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (session) {
          setState(prev => ({
            ...prev,
            session,
            loading: false,
            error: null,
          }));
          await fetchUserProfile(session.user.id);
        } else {
          setState({
            user: null,
            session: null,
            loading: false,
            error: null,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const { data: authUser } = await supabase.auth.getUser();
      
      setState(prev => ({
        ...prev,
        user: {
          id: userId,
          name: profile.name,
          role: profile.role,
          email: authUser.user?.email || '',
        },
      }));
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to fetch user profile',
      }));
    }
  };

  const signUp = async (email: string, password: string, name: string, role: 'participant' | 'admin' = 'participant') => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ ...prev, error: authError.message, loading: false }));
      return { data: null, error: authError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ ...prev, error: authError.message, loading: false }));
      return { data: null, error: authError };
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ ...prev, error: authError.message, loading: false }));
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      const authError = error as AuthError;
      return { error: authError };
    }
  };

  const updateProfile = async (updates: { name?: string; role?: 'participant' | 'admin' }) => {
    try {
      if (!state.user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', state.user.id);

      if (error) throw error;

      // Refresh user profile
      await fetchUserProfile(state.user.id);
      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error };
    }
  };

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    isAuthenticated: !!state.user,
    isAdmin: state.user?.role === 'admin',
    isParticipant: state.user?.role === 'participant',
  };
};
