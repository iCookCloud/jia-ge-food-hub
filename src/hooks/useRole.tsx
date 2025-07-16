import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, UserRole } from './useAuth';
import { useToast } from './use-toast';

interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  assigned_at: string;
  assigned_by: string | null;
  is_active: boolean;
}

export const useRole = () => {
  const { user, refreshUserRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 获取用户角色
  const { data: userRoles, isLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .order('assigned_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data as UserRoleData[];
    },
    enabled: !!user,
  });

  // 获取所有用户角色（管理员功能）
  const { data: allUserRoles } = useQuery({
    queryKey: ['all-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          profiles!user_roles_user_id_fkey(nickname, avatar_url)
        `)
        .order('assigned_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!user,
  });

  // 分配角色给用户
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role,
          assigned_by: user?.id,
        });

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
      refreshUserRole();
      toast({
        title: "角色分配成功",
        description: "用户角色已成功更新",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "角色分配失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 撤销用户角色
  const revokeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role', role);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
      refreshUserRole();
      toast({
        title: "角色撤销成功",
        description: "用户角色已成功撤销",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "角色撤销失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 申请成为供应商
  const applyToBeSupplierMutation = useMutation({
    mutationFn: async () => {
      // 检查是否已经是供应商
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user?.id)
        .eq('role', 'supplier')
        .eq('is_active', true)
        .single();

      if (existingRole) {
        throw new Error('您已经是供应商了');
      }

      // 申请供应商角色（需要管理员审批）
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user?.id,
          role: 'supplier',
          is_active: false, // 等待审批
        });

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast({
        title: "申请已提交",
        description: "您的供应商申请已提交，请等待管理员审核",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "申请失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    userRoles,
    allUserRoles,
    isLoading,
    assignRole: assignRoleMutation.mutate,
    revokeRole: revokeRoleMutation.mutate,
    applyToBeSupplier: applyToBeSupplierMutation.mutate,
    isAssigningRole: assignRoleMutation.isPending,
    isRevokingRole: revokeRoleMutation.isPending,
    isApplyingSupplier: applyToBeSupplierMutation.isPending,
  };
};

// Helper function to get role color
export const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'text-red-600 bg-red-100';
    case 'supplier':
      return 'text-blue-600 bg-blue-100';
    case 'buyer':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

// Helper function to get role display name
export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return '管理员';
    case 'supplier':
      return '供应商';
    case 'buyer':
      return '采购商';
    default:
      return '未知';
  }
};