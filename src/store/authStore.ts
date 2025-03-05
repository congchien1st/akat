import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  setSession: (session: Session | null) => void;
  refreshSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
      loading: false,
    });
  },
  refreshSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ 
        session,
        user: session?.user ?? null,
        loading: false
      });
    } catch (error) {
      console.error('Error refreshing session:', error);
      set({ 
        session: null,
        user: null,
        loading: false
      });
    }
  },
  signIn: async (email, password) => {
    try {
      set({ loading: true });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      set({ user: data.user, session: data.session, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  signUp: async (email, password, phone) => {
    try {
      set({ loading: true });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            phone_number: phone
          },
          emailRedirectTo: window.location.origin,
        }
      });
      if (error) throw error;
      set({ user: data.user, session: data.session, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  signOut: async () => {
    try {
      set({ loading: true });
      await supabase.auth.signOut();
      set({ user: null, session: null, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
}));

// Initialize auth state
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState().setSession(session);
});

// Get initial session
supabase.auth.getSession().then(({ data: { session }}) => {
  useAuthStore.getState().setSession(session);
}).catch(error => {
  console.error('Error getting initial session:', error);
  useAuthStore.getState().setSession(null);
});

// Refresh session periodically
setInterval(() => {
  useAuthStore.getState().refreshSession();
}, 10 * 60 * 1000); // Refresh every 10 minutes