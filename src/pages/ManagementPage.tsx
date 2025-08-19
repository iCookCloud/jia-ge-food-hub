// 管理中心页面
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { 
  Package, 
  Folder, 
  Tags, 
  User, 
  Settings,
  BarChart3,
  Shield,
  Users,
  Building2,
  FileText,
  FileImage,
  CheckCircle,
  Zap
} from 'lucide-react';

interface ManagementCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  disabled?: boolean;
}

const ManagementCard: React.FC<ManagementCardProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  badge,
  badgeVariant = 'secondary',
  disabled = false
}) => {
  const navigate = useNavigate();

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => !disabled && navigate(href)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <span>{title}</span>
          </CardTitle>
          {badge && (
            <Badge variant={badgeVariant} className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <CardDescription className="mt-2">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

const ManagementPage: React.FC = () => {
  const { user, userRole, isAdmin } = useAuth();

  // 基础管理功能（所有用户可访问）
  const basicManagementItems = [
    {
      title: '信息管理',
      description: '管理个人资料、企业信息和认证资料',
      icon: User,
      href: '/profile/management'
    },
    {
      title: '系统设置',
      description: '管理消息通知、邮件提醒和系统设置',
      icon: Settings,
      href: '/settings'
    }
  ];

  // 管理员专用功能
  const adminManagementItems = [
    {
      title: '商品审核',
      description: '审核供应商提交的商品信息，确保平台商品质量',
      icon: Package,
      href: '/admin/products',
      badge: '管理员'
    },
    {
      title: '分类管理',
      description: '管理产品分类体系、层级结构和分类属性',
      icon: Folder,
      href: '/admin/categories',
      badge: '管理员'
    },
    {
      title: '商品管理',
      description: '管理商品价格、上下架状态和分类',
      icon: Tags,
      href: '/admin/product-management',
      badge: '管理员'
    },
    {
      title: '用户管理',
      description: '管理用户账户、角色权限和访问控制',
      icon: Users,
      href: '/admin/users',
      badge: '管理员'
    },
    {
      title: '供应商认证',
      description: '审核用户的供应商申请，管理供应商认证状态',
      icon: CheckCircle,
      href: '/admin/supplier-verification',
      badge: '管理员'
    },
    {
      title: '展示案例管理',
      description: '管理和删除系统中的视频和图片展示案例',
      icon: FileImage,
      href: '/admin/materials',
      badge: '管理员'
    },
    {
      title: '数据统计',
      description: '查看业务数据、用户统计和系统分析报告',
      icon: BarChart3,
      href: '/admin/analytics',
      badge: '管理员', 
      disabled: true // 暂未实现
    },
    {
      title: '系统设置',
      description: '系统配置、安全设置和功能开关管理',
      icon: Shield,
      href: '/admin/system',
      badge: '管理员',
      disabled: true // 暂未实现
    },
    {
      title: '实时更新测试',
      description: '测试通知系统和实时更新功能',
      icon: Zap,
      href: '/admin/realtime-test',
      badge: '测试工具'
    },
    {
      title: '端到端测试',
      description: '全面验证系统功能完整性和业务流程',
      icon: CheckCircle,
      href: '/admin/e2e-test',
      badge: '测试工具'
    },
    {
      title: '综合功能测试',
      description: 'Week 4 - 完整的测试套件集合',
      icon: FileText,
      href: '/admin/comprehensive-test',
      badge: 'Week 4'
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">管理中心</h1>
          <p className="text-muted-foreground mt-2">
            管理您的账户、企业信息和系统功能
          </p>
          {user && (
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline">
                {user.email}
              </Badge>
              {userRole && (
                <Badge variant="secondary">
                  {userRole === 'admin' ? '系统管理员' : 
                   userRole === 'supplier' ? '供应商' : '买家'}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* 基础管理功能 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            个人管理
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {basicManagementItems.map((item, index) => (
              <ManagementCard key={index} {...item} />
            ))}
          </div>
        </div>

        {/* 管理员功能 */}
        {isAdmin && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              系统管理
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminManagementItems.map((item, index) => (
                <ManagementCard key={index} {...item} />
              ))}
            </div>
          </div>
        )}

        {/* 快捷操作 */}
        <div className="bg-muted/50 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">快捷操作</h3>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/products'}
            >
              <Package className="h-4 w-4 mr-2" />
              浏览商品
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/quotations'}
            >
              <FileText className="h-4 w-4 mr-2" />
              我的询价
            </Button>
            {isAdmin && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/admin/products'}
                >
                  <Package className="h-4 w-4 mr-2" />
                  商品管理
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/admin/categories'}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  分类管理
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ManagementPage;