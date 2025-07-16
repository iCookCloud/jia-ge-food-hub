import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredRole?: UserRole | UserRole[];
  fallbackPath?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  requiredRole,
  fallbackPath = '/auth' 
}: ProtectedRouteProps) => {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if authentication is required
  if (requireAuth && !user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRole && user) {
    const hasRequiredRole = Array.isArray(requiredRole)
      ? requiredRole.includes(userRole as UserRole)
      : userRole === requiredRole;

    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-destructive/10 p-3">
                  <Lock className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-foreground">权限不足</h2>
              <p className="text-muted-foreground">
                您当前的角色是 <strong>{getRoleDisplayName(userRole)}</strong>，
                无法访问此页面。需要 <strong>{getRequiredRoleDisplayName(requiredRole)}</strong> 权限。
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => window.history.back()} variant="outline">
                  返回上一页
                </Button>
                <Button onClick={() => window.location.href = '/'}>
                  返回首页
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return <>{children}</>;
};

// Helper function to get role display name
const getRoleDisplayName = (role: UserRole | null): string => {
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

// Helper function to get required role display name
const getRequiredRoleDisplayName = (requiredRole: UserRole | UserRole[]): string => {
  if (Array.isArray(requiredRole)) {
    return requiredRole.map(getRoleDisplayName).join(' 或 ');
  }
  return getRoleDisplayName(requiredRole);
};

// Specific role-based route components for convenience
export const AdminRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>
);

export const SupplierRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="supplier">{children}</ProtectedRoute>
);

export const BuyerRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="buyer">{children}</ProtectedRoute>
);

export const SupplierOrAdminRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole={['supplier', 'admin']}>{children}</ProtectedRoute>
);

// Public route that doesn't require authentication
export const PublicRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requireAuth={false}>{children}</ProtectedRoute>
);