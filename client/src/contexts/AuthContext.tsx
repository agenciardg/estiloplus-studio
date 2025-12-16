import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import type { User, UserRoleType } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: UserRoleType) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ error: string | null }>;
  updateProfilePhoto: (imageUrl: string, creditCost: number) => Promise<{ error: string | null }>;
  refreshCredits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function init() {
      try {
        const client = await getSupabase();
        setSupabase(client);

        const { data: { session } } = await client.auth.getSession();
        setSession(session);
        if (session?.user) {
          await fetchUserProfile(client, session.user.id);
        } else {
          setLoading(false);
        }

        const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, session) => {
          setSession(session);
          if (session?.user) {
            await fetchUserProfile(client, session.user.id);
          } else {
            setUser(null);
            setLoading(false);
          }
        });

        unsubscribe = () => subscription.unsubscribe();
      } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        setLoading(false);
      }
    }

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  async function fetchUserProfile(client: SupabaseClient, userId: string) {
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching user profile:', error);
      setUser(null);
    } else {
      console.log('User profile loaded, profile_image_url:', data.profile_image_url);
      setUser({
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        profileImageUrl: data.profile_image_url,
        credits: data.credits ?? 20,
        stripeCustomerId: data.stripe_customer_id,
        createdAt: data.created_at,
      });
    }
    setLoading(false);
  }

  async function refreshCredits() {
    if (!supabase || !user) return;
    
    const { data } = await supabase
      .from('users')
      .select('credits')
      .eq('id', user.id)
      .single();
    
    if (data) {
      setUser({ ...user, credits: data.credits ?? 0 });
    }
  }

  async function signUp(email: string, password: string, name: string, role: UserRoleType) {
    if (!supabase) return { error: 'Supabase not initialized' };

    // Passa name e role nos metadados para o trigger usar
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

    if (error) {
      return { error: error.message };
    }

    // O trigger handle_new_user criará automaticamente o registro em public.users
    // Mas tentamos criar manualmente também como fallback
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: data.user.id,
          email,
          name,
          role,
          credits: 20,
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Não retorna erro aqui pois o trigger pode ter criado
      }
    }

    return { error: null };
  }

  async function signIn(email: string, password: string) {
    if (!supabase) return { error: 'Supabase not initialized' };

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }

  async function updateProfile(data: Partial<User>) {
    if (!supabase) return { error: 'Supabase not initialized' };
    if (!user) return { error: 'Usuário não autenticado' };

    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.profileImageUrl) updateData.profile_image_url = data.profileImageUrl;

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (error) {
      return { error: error.message };
    }

    setUser({ ...user, ...data });
    return { error: null };
  }

  async function updateProfilePhoto(imageUrl: string, _creditCost: number) {
    if (!supabase) return { error: 'Supabase not initialized' };
    if (!user) return { error: 'Usuário não autenticado' };

    // TODO: Cobrança de créditos será feita no backend quando SUPABASE_SERVICE_ROLE_KEY estiver configurada
    // Por enquanto, apenas atualiza a foto sem cobrar créditos

    const { error } = await supabase
      .from('users')
      .update({ 
        profile_image_url: imageUrl
      })
      .eq('id', user.id);

    if (error) {
      return { error: error.message };
    }

    setUser({ ...user, profileImageUrl: imageUrl });
    return { error: null };
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, updateProfile, updateProfilePhoto, refreshCredits }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
