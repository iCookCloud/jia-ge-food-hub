import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { forceSignOut, cleanupExpiredAuth } from '@/utils/auth';

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
  userRoles: UserRole[];
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
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // 清理过期的认证数据
    cleanupExpiredAuth();
    
    // 监听强制退出事件
    const handleForceSignOut = () => {
      console.log('Force signOut event received');
      setProfile(null);
      setUserRole(null);
      setUserRoles([]);
      setUser(null);
      setSession(null);
    };
    
    window.addEventListener('forceSignOut', handleForceSignOut);
    
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
          setUserRoles([]);
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

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('forceSignOut', handleForceSignOut);
    };
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
      // 获取用户的所有活跃角色
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error loading user roles:', error);
        setUserRole('buyer'); // Default to buyer role
        setUserRoles(['buyer']);
        return;
      }

      if (!data || data.length === 0) {
        setUserRole('buyer'); // Default to buyer role
        setUserRoles(['buyer']);
        return;
      }

      // 获取所有角色
      const roles = data.map(item => item.role);
      setUserRoles(roles);
      
      // 从所有角色中选择权限最高的角色 (admin > supplier > buyer)
      let highestRole: UserRole = 'buyer';
      
      if (roles.includes('admin')) {
        highestRole = 'admin';
      } else if (roles.includes('supplier')) {
        highestRole = 'supplier';
      }

      setUserRole(highestRole);
    } catch (error) {
      console.error('Error loading user role:', error);
      setUserRole('buyer'); // Default to buyer role
      setUserRoles(['buyer']);
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
    return userRoles.includes(role);
  };

  const isAdmin = hasRole('admin');
  const isSupplier = hasRole('supplier');
  const isBuyer = hasRole('buyer');

  const signOut = async () => {
    try {
      // 显示退出中消息
      toast({
        title: "正在退出...",
        description: "请稍候",
      });
      
      // 使用安全的退出登录函数
      await forceSignOut();
      
    } catch (error) {
      console.error('SignOut error:', error);
      
      // 即使出错，也要显示退出完成消息
      toast({
        title: "退出完成",
        description: "已清理登录状态",
      });
      
      // 强制跳转到登录页
      window.location.href = '/auth';
    }
  };

  const value = {
    user,
    session,
    profile,
    userRole,
    userRoles,
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