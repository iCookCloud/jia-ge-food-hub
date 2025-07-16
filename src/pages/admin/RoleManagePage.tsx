import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useRole, getRoleColor, getRoleDisplayName } from "@/hooks/useRole";
import { UserRole } from "@/hooks/useAuth";
import { Search, Shield, Users, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserWithRole {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  phone: string | null;
  email: string;
  roles: {
    role: UserRole;
    assigned_at: string;
    is_active: boolean;
  }[];
}

const RoleManagePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");
  const { assignRole, revokeRole, isAssigningRole, isRevokingRole } = useRole();

  // 获取所有用户及其角色
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users-roles'],
    queryFn: async () => {
      // 首先获取所有profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url, phone');

      if (profilesError) {
        throw new Error(profilesError.message);
      }

      // 然后获取所有用户角色
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, assigned_at, is_active');

      if (rolesError) {
        throw new Error(rolesError.message);
      }

      // 获取用户邮箱（从auth.users表无法直接查询，这里模拟）
      const usersWithRoles: UserWithRole[] = profiles.map(profile => {
        const roles = userRoles.filter(role => role.user_id === profile.id);
        return {
          ...profile,
          email: `user@example.com`, // 实际场景中需要从其他地方获取
          roles: roles,
        };
      });

      return usersWithRoles;
    },
  });

  // 过滤用户
  const filteredUsers = users?.filter(user => {
    const matchesSearch = !searchTerm || 
      user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === "all" || 
      user.roles.some(role => role.role === selectedRole && role.is_active);
    
    return matchesSearch && matchesRole;
  });

  const handleAssignRole = async (userId: string, role: UserRole) => {
    assignRole({ userId, role });
  };

  const handleRevokeRole = async (userId: string, role: UserRole) => {
    revokeRole({ userId, role });
  };

  const getActiveRole = (user: UserWithRole): UserRole | null => {
    const activeRole = user.roles.find(role => role.is_active);
    return activeRole?.role || null;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">角色管理</h1>
              <p className="text-muted-foreground mt-2">
                管理用户权限和角色分配
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{users?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">总用户数</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {users?.filter(user => getActiveRole(user) === 'supplier').length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">供应商</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {users?.filter(user => getActiveRole(user) === 'admin').length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">管理员</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索用户..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setSelectedRole(value as UserRole | "all")}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有角色</SelectItem>
                    <SelectItem value="buyer">采购商</SelectItem>
                    <SelectItem value="supplier">供应商</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>用户列表</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {filteredUsers?.map((user) => {
                  const activeRole = getActiveRole(user);
                  
                  return (
                    <div key={user.id} className="flex items-center justify-between p-4 border-b border-border last:border-0">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || ""} />
                          <AvatarFallback>
                            {(user.nickname || user.email)?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.nickname || '未设置昵称'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                          {activeRole && (
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs mt-1", getRoleColor(activeRole))}
                            >
                              {getRoleDisplayName(activeRole)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Select
                          onValueChange={(role) => handleAssignRole(user.id, role as UserRole)}
                          disabled={isAssigningRole || isRevokingRole}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="分配角色" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buyer">采购商</SelectItem>
                            <SelectItem value="supplier">供应商</SelectItem>
                            <SelectItem value="admin">管理员</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {activeRole && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeRole(user.id, activeRole)}
                            disabled={isAssigningRole || isRevokingRole}
                          >
                            撤销角色
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {filteredUsers?.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    没有找到符合条件的用户
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default RoleManagePage;