import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FolderOpen,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  Truck,
  Users,
  Palette,
  Home,
  Eye,
  Edit3,
  MoreHorizontal,
  FileText,
  Settings,
  Archive
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

// 模拟数据类型定义
interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  progress: number;
  case_id?: number;
  case_name?: string;
  case_style?: string;
  case_area?: number;
  budget: {
    estimated: number;
    actual: number;
  };
  timeline: {
    start_date: string;
    end_date: string;
    created_at: string;
  };
  team_members: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  }[];
  orders: ProjectOrder[];
}

interface ProjectOrder {
  id: string;
  project_id: string;
  supplier_id: string;
  supplier_name: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  items_count: number;
  estimated_delivery: string;
  tracking_number?: string;
}

const ProjectManagementPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      
      // 模拟项目数据
      const mockProjects: Project[] = [
        {
          id: "proj-001",
          name: "现代简约办公室装修",
          description: "200平米办公空间现代简约风格装修项目",
          status: "in_progress",
          progress: 65,
          case_id: 1,
          case_name: "现代简约办公空间设计案例",
          case_style: "现代简约",
          case_area: 200,
          budget: {
            estimated: 150000,
            actual: 98500
          },
          timeline: {
            start_date: "2024-01-15",
            end_date: "2024-03-15",
            created_at: "2024-01-10"
          },
          team_members: [
            {
              id: "user-1",
              name: "张设计师",
              role: "主设计师",
              avatar: ""
            },
            {
              id: "user-2", 
              name: "李项目经理",
              role: "项目经理",
              avatar: ""
            }
          ],
          orders: [
            {
              id: "order-001",
              project_id: "proj-001",
              supplier_id: "sup-001",
              supplier_name: "优质办公家具供应商",
              status: "delivered",
              total_amount: 45000,
              items_count: 12,
              estimated_delivery: "2024-02-01",
              tracking_number: "SF1234567890"
            },
            {
              id: "order-002",
              project_id: "proj-001",
              supplier_id: "sup-002",
              supplier_name: "现代照明设备商",
              status: "shipped",
              total_amount: 28000,
              items_count: 8,
              estimated_delivery: "2024-02-15",
              tracking_number: "YT9876543210"
            }
          ]
        },
        {
          id: "proj-002",
          name: "温馨家庭餐厅改造",
          description: "80平米家庭餐厅北欧风格改造",
          status: "planning",
          progress: 15,
          case_id: 2,
          case_name: "北欧风格家庭餐厅",
          case_style: "北欧风",
          case_area: 80,
          budget: {
            estimated: 60000,
            actual: 5000
          },
          timeline: {
            start_date: "2024-03-01",
            end_date: "2024-04-30",
            created_at: "2024-02-20"
          },
          team_members: [
            {
              id: "user-3",
              name: "王室内设计",
              role: "设计师",
              avatar: ""
            }
          ],
          orders: [
            {
              id: "order-003",
              project_id: "proj-002",
              supplier_id: "sup-003",
              supplier_name: "北欧家居专营店",
              status: "pending",
              total_amount: 25000,
              items_count: 15,
              estimated_delivery: "2024-03-15"
            }
          ]
        },
        {
          id: "proj-003",
          name: "工业风咖啡厅设计",
          description: "150平米工业风咖啡厅完整设计项目",
          status: "completed",
          progress: 100,
          case_id: 3,
          case_name: "工业风咖啡厅设计",
          case_style: "工业风",
          case_area: 150,
          budget: {
            estimated: 120000,
            actual: 118500
          },
          timeline: {
            start_date: "2023-10-01",
            end_date: "2023-12-31",
            created_at: "2023-09-15"
          },
          team_members: [
            {
              id: "user-4",
              name: "陈首席设计师",
              role: "首席设计师",
              avatar: ""
            },
            {
              id: "user-5",
              name: "刘工程师",
              role: "工程师",
              avatar: ""
            }
          ],
          orders: [
            {
              id: "order-004",
              project_id: "proj-003",
              supplier_id: "sup-004",
              supplier_name: "工业风装饰材料",
              status: "delivered",
              total_amount: 78500,
              items_count: 25,
              estimated_delivery: "2023-11-15",
              tracking_number: "completed"
            },
            {
              id: "order-005",
              project_id: "proj-003",
              supplier_id: "sup-005",
              supplier_name: "复古家具工厂",
              status: "delivered",
              total_amount: 40000,
              items_count: 18,
              estimated_delivery: "2023-12-01",
              tracking_number: "completed"
            }
          ]
        }
      ];

      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟加载时间
      setProjects(mockProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast({
        title: "加载失败",
        description: "无法加载项目列表",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: Project['status']) => {
    const statusMap = {
      planning: { label: '规划中', variant: 'outline' as const, icon: Clock },
      in_progress: { label: '进行中', variant: 'default' as const, icon: CheckCircle },
      completed: { label: '已完成', variant: 'secondary' as const, icon: CheckCircle },
      on_hold: { label: '暂停', variant: 'destructive' as const, icon: AlertCircle }
    };
    return statusMap[status];
  };

  const getOrderStatusInfo = (status: ProjectOrder['status']) => {
    const statusMap = {
      pending: { label: '待确认', variant: 'outline' as const, color: 'text-yellow-600' },
      confirmed: { label: '已确认', variant: 'default' as const, color: 'text-blue-600' },
      shipped: { label: '已发货', variant: 'secondary' as const, color: 'text-purple-600' },
      delivered: { label: '已送达', variant: 'default' as const, color: 'text-green-600' },
      cancelled: { label: '已取消', variant: 'destructive' as const, color: 'text-red-600' }
    };
    return statusMap[status];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.case_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const ProjectCard = ({ project }: { project: Project }) => {
    const statusInfo = getStatusInfo(project.status);
    const StatusIcon = statusInfo.icon;
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <Badge variant={statusInfo.variant}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusInfo.label}
                </Badge>
              </div>
              
              {project.description && (
                <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
              )}
              
              {project.case_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Palette className="h-3 w-3" />
                  <Link to={`/cases/${project.case_id}`} className="hover:text-primary">
                    {project.case_name} • {project.case_style}
                  </Link>
                  {project.case_area && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Home className="h-3 w-3" />
                        {project.case_area}m²
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* 进度条 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>项目进度</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
          
          {/* 预算信息 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">预估预算:</span>
              <div className="font-medium">{formatCurrency(project.budget.estimated)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">实际花费:</span>
              <div className="font-medium">{formatCurrency(project.budget.actual)}</div>
            </div>
          </div>
          
          {/* 时间线 */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(project.timeline.start_date)} - {formatDate(project.timeline.end_date)}
            </span>
            <span>{project.orders.length} 个订单</span>
          </div>
          
          {/* 团队成员 */}
          {project.team_members.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">团队:</span>
              <div className="flex -space-x-2">
                {project.team_members.slice(0, 3).map(member => (
                  <Avatar key={member.id} className="w-6 h-6 border-2 border-background">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback className="text-xs">
                      {member.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {project.team_members.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                    +{project.team_members.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 操作按钮 */}
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1">
              <Eye className="h-3 w-3 mr-2" />
              查看详情
            </Button>
            <Button size="sm" variant="outline">
              <Edit3 className="h-3 w-3 mr-2" />
              编辑
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const OrderCard = ({ order }: { order: ProjectOrder }) => {
    const statusInfo = getOrderStatusInfo(order.status);
    
    return (
      <Card className="hover:shadow-sm transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">{order.supplier_name}</h4>
              <p className="text-xs text-muted-foreground">
                {order.items_count} 个商品 • 订单号: {order.id}
              </p>
            </div>
            <Badge variant={statusInfo.variant} className="text-xs">
              {statusInfo.label}
            </Badge>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">订单金额:</span>
              <span className="font-medium">{formatCurrency(order.total_amount)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">预计送达:</span>
              <span>{formatDate(order.estimated_delivery)}</span>
            </div>
            
            {order.tracking_number && order.tracking_number !== 'completed' && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">快递单号:</span>
                <span className="font-mono text-xs">{order.tracking_number}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" className="flex-1">
              <Package className="h-3 w-3 mr-1" />
              查看详情
            </Button>
            {order.status === 'shipped' && (
              <Button size="sm" variant="outline">
                <Truck className="h-3 w-3 mr-1" />
                物流跟踪
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FolderOpen className="h-6 w-6 text-primary" />
              项目管理
            </h1>
            <p className="text-muted-foreground">管理您的设计项目和相关订单</p>
          </div>
          
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新建项目
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="搜索项目名称或描述..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="项目状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="planning">规划中</SelectItem>
                  <SelectItem value="in_progress">进行中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="on_hold">暂停</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{projects.length}</div>
              <div className="text-sm text-muted-foreground">总项目数</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {projects.filter(p => p.status === 'in_progress').length}
              </div>
              <div className="text-sm text-muted-foreground">进行中</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {projects.filter(p => p.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">已完成</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(projects.reduce((sum, p) => sum + p.budget.estimated, 0))}
              </div>
              <div className="text-sm text-muted-foreground">总预算</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="projects">项目列表</TabsTrigger>
            <TabsTrigger value="orders">订单管理</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
            {filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">暂无项目</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all' ? 
                      '没有找到符合条件的项目' : 
                      '您还没有创建任何项目'
                    }
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    创建第一个项目
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.flatMap(project => 
                project.orders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))
              )}
            </div>
            
            {projects.every(p => p.orders.length === 0) && (
              <Card className="text-center py-12">
                <CardContent>
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">暂无订单</h3>
                  <p className="text-muted-foreground">
                    还没有创建任何项目订单
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ProjectManagementPage;