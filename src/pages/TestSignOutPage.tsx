import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { directSignOut, safeSignOut, forceSignOut } from '@/utils/auth';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, RefreshCw, User } from 'lucide-react';

export const TestSignOutPage: React.FC = () => {
  const { user, userRole, profile } = useAuth();

  const handleDirectSignOut = async () => {
    console.log('Testing direct signOut...');
    try {
      await directSignOut();
    } catch (error) {
      console.error('Direct signOut test failed:', error);
    }
  };

  const handleSafeSignOut = async () => {
    console.log('Testing safe signOut...');
    try {
      await safeSignOut();
    } catch (error) {
      console.error('Safe signOut test failed:', error);
    }
  };

  const handleForceSignOut = async () => {
    console.log('Testing force signOut...');
    try {
      await forceSignOut();
    } catch (error) {
      console.error('Force signOut test failed:', error);
    }
  };

  const checkAuthStatus = () => {
    console.log('=== Auth Status Check ===');
    console.log('User:', user);
    console.log('User Role:', userRole);
    console.log('Profile:', profile);
    console.log('Local Storage:', localStorage);
    console.log('Session Storage:', sessionStorage);
  };

  const clearAllStorage = () => {
    console.log('Clearing all storage...');
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('Storage cleared');
      alert('所有存储已清理，请刷新页面');
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">退出登录测试页面</h1>
          <p className="text-muted-foreground">测试各种退出登录方法</p>
        </div>

        {/* 当前状态 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              当前认证状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>用户ID:</strong> {user?.id || '未登录'}</p>
              <p><strong>邮箱:</strong> {user?.email || '未登录'}</p>
              <p><strong>角色:</strong> {userRole || '未设置'}</p>
              <p><strong>昵称:</strong> {profile?.nickname || '未设置'}</p>
              <p><strong>电话:</strong> {profile?.phone || '未设置'}</p>
            </div>
          </CardContent>
        </Card>

        {/* 测试按钮 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>组件退出登录</CardTitle>
            </CardHeader>
            <CardContent>
              <SignOutButton variant="default" className="w-full">
                <LogOut className="h-4 w-4 mr-2" />
                使用组件退出
              </SignOutButton>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>直接退出登录</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleDirectSignOut} 
                variant="outline" 
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                直接退出
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>安全退出登录</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleSafeSignOut} 
                variant="secondary" 
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                安全退出
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>强制退出登录</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleForceSignOut} 
                variant="destructive" 
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                强制退出
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>检查状态</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={checkAuthStatus} 
                variant="outline" 
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                检查认证状态
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>清理存储</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={clearAllStorage} 
                variant="outline" 
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                清理所有存储
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 说明 */}
        <Card>
          <CardHeader>
            <CardTitle>测试说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>1. <strong>组件退出登录</strong>: 使用 SignOutButton 组件，包含加载状态和错误处理</p>
              <p>2. <strong>直接退出登录</strong>: 立即清理状态并跳转，最可靠的方法</p>
              <p>3. <strong>安全退出登录</strong>: 尝试 Supabase 退出，然后清理本地状态</p>
              <p>4. <strong>强制退出登录</strong>: 使用多种方法确保退出成功</p>
              <p>5. <strong>检查状态</strong>: 在控制台查看当前认证状态</p>
              <p>6. <strong>清理存储</strong>: 手动清理所有本地存储数据</p>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                <strong>注意:</strong> 打开浏览器控制台 (F12) 查看详细的退出过程日志
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};






