import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      loading: false,
      error: null,
      isAuthenticated: false,

      signIn: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (userError && userError.code !== 'PGRST116') {
            throw userError;
          }

          if (!userData) {
            await supabase.from('users').insert({
              id: data.user.id,
              email: data.user.email,
              role: 'user',
            });
          }

          set({
            session: data.session,
            user: userData || {
              id: data.user.id,
              email: data.user.email!,
              role: 'user',
              created_at: new Date().toISOString(),
            },
            isAuthenticated: true,
            loading: false,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Sign in failed';
          set({ error: message, loading: false });
          throw err;
        }
      },

      signUp: async (email, password, fullName) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });

          if (error) throw error;

          if (data.user) {
            await supabase.from('users').insert({
              id: data.user.id,
              email: data.user.email!,
              full_name: fullName,
              role: 'user',
            });
          }

          set({ loading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Sign up failed';
          set({ error: message, loading: false });
          throw err;
        }
      },

      signOut: async () => {
        set({ loading: true });
        try {
          await supabase.auth.signOut();
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            loading: false,
          });
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      resetPassword: async (email) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email);
          if (error) throw error;
          set({ loading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Password reset failed';
          set({ error: message, loading: false });
          throw err;
        }
      },

      clearError: () => set({ error: null }),

      initialize: async () => {
        set({ loading: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (session) {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            set({
              session,
              user: userData || {
                id: session.user.id,
                email: session.user.email!,
                role: 'user',
                created_at: new Date().toISOString(),
              },
              isAuthenticated: true,
            });
          }

          supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (event === 'SIGNED_OUT') {
              set({
                session: null,
                user: null,
                isAuthenticated: false,
              });
            } else if (newSession) {
              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', newSession.user.id)
                .single();

              set({
                session: newSession,
                user: userData || {
                  id: newSession.user.id,
                  email: newSession.user.email!,
                  role: 'user',
                  created_at: new Date().toISOString(),
                },
                isAuthenticated: true,
              });
            }
          });
        } catch (err) {
          console.error('Auth initialization error:', err);
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
