import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'buyer' | 'supplier' | 'admin';

interface UserProfile {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  phone: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  userRole: UserRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  isAdmin: boolean;
  isSupplier: boolean;
  isBuyer: boolean;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          // Create or update user profile when signing in
          setTimeout(() => {
            createUserProfile(session.user);
            loadUserProfile(session.user.id);
            loadUserRole(session.user.id);
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          // Clear profile and role when signing out
          setProfile(null);
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUserProfile(session.user.id);
        loadUserRole(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url, phone')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error loading user role:', error);
        return;
      }

      setUserRole(data?.role || 'buyer');
    } catch (error) {
      console.error('Error loading user role:', error);
      setUserRole('buyer'); // Default to buyer role
    }
  };

  const createUserProfile = async (user: User | undefined) => {
    if (!user) return;

    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        // Create new profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            nickname: user.email?.split('@')[0] || '用户',
            avatar_url: null,
            phone: null,
          });

        if (error) {
          console.error('Error creating user profile:', error);
        }
      }
    } catch (error) {
      console.error('Error checking/creating user profile:', error);
    }
  };

  const refreshUserRole = async () => {
    if (user) {
      await loadUserRole(user.id);
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return userRole === role;
  };

  const isAdmin = hasRole('admin');
  const isSupplier = hasRole('supplier');
  const isBuyer = hasRole('buyer');

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "退出失败",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "已退出登录",
          description: "您已成功退出账户",
        });
      }
    } catch (error) {
      toast({
        title: "退出失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    session,
    profile,
    userRole,
    loading,
    signOut,
    hasRole,
    isAdmin,
    isSupplier,
    isBuyer,
    refreshUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};