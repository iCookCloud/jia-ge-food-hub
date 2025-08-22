import React, { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX,
  Shield,
  Building2,
  ShoppingCart,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRole } from "@/hooks/useRole";
import { UserRole } from "@/hooks/useAuth";

interface UserProfile {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

interface UserWithRole {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  phone: string | null;
  email: string;
  created_at: string;
  updated_at: string;
  roles: {
    role: UserRole;
    assigned_at: string;
    is_active: boolean;
  }[];
  supplier_credential?: {
    company_name: string;
    verification_status: string;
  };
}

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [editForm, setEditForm] = useState({
    nickname: "",
    phone: ""
  });

  const { assignRole, revokeRole, isAssigningRole, isRevokingRole } = useRole();

  // 加载用户列表
  const loadUsers = async () => {
    setLoading(true);
    try {
      // 使用管理员视图获取所有用户档案（包含邮箱）
      const { data: profiles, error: profilesError } = await supabase
        .from('admin_users_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        throw profilesError;
      }

      // 获取所有用户角色
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('assigned_at', { ascending: false });

      if (rolesError) {
        throw rolesError;
      }

      // 获取供应商档案信息
      const { data: supplierProfiles, error: supplierError } = await supabase
        .from('supplier_profiles')
        .select('id, company_name, verification_status, created_at');

      if (supplierError) {
        console.warn('Failed to load supplier profiles:', supplierError);
      }

      // 合并用户数据
      const usersWithRoles: UserWithRole[] = profiles.map(profile => {
        const roles = userRoles.filter(role => role.user_id === profile.id);
        const supplierProfile = supplierProfiles?.find(sp => sp.id === profile.id);
        
        return {
          ...profile,
          roles: roles,
          supplier_credential: supplierProfile ? {
            company_name: supplierProfile.company_name,
            verification_status: supplierProfile.verification_status
          } : undefined
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('加载用户失败');
    } finally {
      setLoading(false);
    }
  };

  // 过滤用户
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === "all" || 
      user.roles.some(role => role.role === selectedRole && role.is_active);
    
    const matchesStatus = selectedStatus === "all" || 
      (selectedStatus === "supplier" && user.supplier_credential) ||
      (selectedStatus === "verified" && user.supplier_credential?.verification_status === 'verified') ||
      (selectedStatus === "pending" && user.supplier_credential?.verification_status === 'pending');
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // 获取用户主要角色
  const getPrimaryRole = (user: UserWithRole) => {
    const activeRole = user.roles.find(role => role.is_active);
    return activeRole?.role || 'buyer';
  };

  // 获取角色显示名称
  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'admin': return '管理员';
      case 'supplier': return '供应商';
      case 'buyer': return '买家';
      default: return '未知';
    }
  };

  // 获取角色颜色
  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'supplier': return 'bg-blue-100 text-blue-800';
      case 'buyer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 处理角色分配
  const handleAssignRole = async (userId: string, role: UserRole) => {
    try {
      await assignRole({ userId, role });
      toast.success('角色分配成功');
      loadUsers(); // 重新加载数据
    } catch (error) {
      toast.error('角色分配失败');
    }
  };

  // 处理角色撤销
  const handleRevokeRole = async (userId: string, role: UserRole) => {
    try {
      await revokeRole({ userId, role });
      toast.success('角色撤销成功');
      loadUsers(); // 重新加载数据
    } catch (error) {
      toast.error('角色撤销失败');
    }
  };

  // 处理用户编辑
  const handleEditUser = (user: UserWithRole) => {
    setEditingUser(user);
    setEditForm({
      nickname: user.nickname || "",
      phone: user.phone || ""
    });
    setShowEditDialog(true);
  };

  // 保存用户编辑
  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nickname: editForm.nickname,
          phone: editForm.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (error) {
        throw error;
      }

      toast.success('用户信息更新成功');
      setShowEditDialog(false);
      setEditingUser(null);
      loadUsers(); // 重新加载数据
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('更新用户信息失败');
    }
  };

  // 查看用户详情
  const handleViewUserDetails = (user: UserWithRole) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">用户管理</h1>
          <p className="text-muted-foreground">管理系统用户、角色权限和账户状态</p>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">总用户数</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">买家用户</p>
                  <p className="text-2xl font-bold text-green-600">
                    {users.filter(u => getPrimaryRole(u) === 'buyer').length}
                  </p>
                </div>
                <ShoppingCart className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">供应商</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {users.filter(u => getPrimaryRole(u) === 'supplier').length}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">管理员</p>
                  <p className="text-2xl font-bold text-red-600">
                    {users.filter(u => getPrimaryRole(u) === 'admin').length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索用户昵称或邮箱..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole | "all")}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有角色</SelectItem>
                  <SelectItem value="buyer">买家</SelectItem>
                  <SelectItem value="supplier">供应商</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有状态</SelectItem>
                  <SelectItem value="supplier">供应商用户</SelectItem>
                  <SelectItem value="verified">已认证供应商</SelectItem>
                  <SelectItem value="pending">待认证供应商</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 用户列表 */}
        <Card>
          <CardHeader>
            <CardTitle>用户列表</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">加载中...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                没有找到符合条件的用户
              </div>
            ) : (
              <div className="space-y-0">
                {filteredUsers.map((user) => {
                  const primaryRole = getPrimaryRole(user);
                  const isSupplier = user.supplier_credential;
                  
                  return (
                    <div key={user.id} className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-muted/50">
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
                          {user.phone && (
                            <p className="text-sm text-muted-foreground">
                              {user.phone}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getRoleColor(primaryRole)}>
                              {getRoleDisplayName(primaryRole)}
                            </Badge>
                            {isSupplier && (
                              <Badge variant="outline" className="text-xs">
                                {user.supplier_credential.verification_status === 'verified' ? '已认证' : '待认证'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewUserDetails(user)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          查看
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          编辑
                        </Button>

                        <Select
                          onValueChange={(role) => handleAssignRole(user.id, role as UserRole)}
                          disabled={isAssigningRole || isRevokingRole}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="分配角色" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buyer">买家</SelectItem>
                            <SelectItem value="supplier">供应商</SelectItem>
                            <SelectItem value="admin">管理员</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {user.roles.some(r => r.is_active) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeRole(user.id, primaryRole)}
                            disabled={isAssigningRole || isRevokingRole}
                          >
                            撤销角色
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 用户详情对话框 */}
        {showUserDetails && selectedUser && (
          <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>用户详情</DialogTitle>
                <DialogDescription>
                  查看用户的详细信息和认证状态
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedUser.avatar_url || ""} />
                    <AvatarFallback>
                      {(selectedUser.nickname || selectedUser.email)?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedUser.nickname || '未设置昵称'}
                    </h3>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                    {selectedUser.phone && (
                      <p className="text-muted-foreground">{selectedUser.phone}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">用户ID</Label>
                    <p className="font-mono text-sm">{selectedUser.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">注册时间</Label>
                    <p>{new Date(selectedUser.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">最后更新</Label>
                    <p>{new Date(selectedUser.updated_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">主要角色</Label>
                    <Badge className={getRoleColor(getPrimaryRole(selectedUser))}>
                      {getRoleDisplayName(getPrimaryRole(selectedUser))}
                    </Badge>
                  </div>
                </div>

                {selectedUser.supplier_credential && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">供应商信息</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">公司名称</Label>
                        <p>{selectedUser.supplier_credential.company_name}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">认证状态</Label>
                        <Badge variant="outline">
                          {selectedUser.supplier_credential.verification_status === 'verified' ? '已认证' : '待认证'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">角色历史</h4>
                  <div className="space-y-2">
                    {selectedUser.roles.map((role, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <Badge className={getRoleColor(role.role)}>
                          {getRoleDisplayName(role.role)}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {role.is_active ? '活跃' : '非活跃'} • 
                          {new Date(role.assigned_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* 编辑用户对话框 */}
        {showEditDialog && editingUser && (
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>编辑用户信息</DialogTitle>
                <DialogDescription>
                  修改用户的基本信息和角色权限
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nickname">昵称</Label>
                  <Input
                    id="nickname"
                    value={editForm.nickname}
                    onChange={(e) => setEditForm(prev => ({ ...prev, nickname: e.target.value }))}
                    placeholder="输入用户昵称"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">电话</Label>
                  <Input
                    id="phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="输入电话号码"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleSaveUser}>
                  保存
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
};






