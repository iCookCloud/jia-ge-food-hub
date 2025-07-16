import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Key,
  Search,
  Filter
} from "lucide-react";

// Mock supplier data
const mockSuppliers = [
  {
    id: "S001",
    companyName: "优质食材供应有限公司",
    contactPerson: "张三",
    contactPhone: "13800138000",
    contactEmail: "zhangsan@example.com",
    businessType: "食材批发",
    verificationStatus: "已认证",
    joinDate: "2024-01-15",
    lastLogin: "2024-01-16 14:30",
    apiKeyStatus: "已配置",
    monthlyOrders: 45,
    totalRevenue: "128,500.00"
  },
  {
    id: "S002", 
    companyName: "海鲜直供贸易公司",
    contactPerson: "李四",
    contactPhone: "13900139000",
    contactEmail: "lisi@example.com",
    businessType: "海鲜供应",
    verificationStatus: "待审核",
    joinDate: "2024-01-10",
    lastLogin: "2024-01-16 09:15",
    apiKeyStatus: "未配置",
    monthlyOrders: 23,
    totalRevenue: "67,800.00"
  },
  {
    id: "S003",
    companyName: "绿色农场合作社",
    contactPerson: "王五",
    contactPhone: "13700137000", 
    contactEmail: "wangwu@example.com",
    businessType: "蔬果供应",
    verificationStatus: "已拒绝",
    joinDate: "2024-01-08",
    lastLogin: "2024-01-15 16:45",
    apiKeyStatus: "未配置",
    monthlyOrders: 12,
    totalRevenue: "23,400.00"
  }
];

const AdminSuppliersPage = () => {
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const [selectedStatus, setSelectedStatus] = useState("全部");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesStatus = selectedStatus === "全部" || supplier.verificationStatus === selectedStatus;
    const matchesSearch = supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "已认证":
        return <Badge variant="secondary" className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />已认证</Badge>;
      case "待审核":
        return <Badge variant="secondary" className="bg-warning text-warning-foreground"><Clock className="w-3 h-3 mr-1" />待审核</Badge>;
      case "已拒绝":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />已拒绝</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getApiKeyBadge = (status: string) => {
    return status === "已配置" ? 
      <Badge variant="default">已配置</Badge> : 
      <Badge variant="outline">未配置</Badge>;
  };

  const handleStatusChange = (supplierId: string, newStatus: string) => {
    setSuppliers(prev => prev.map(supplier => 
      supplier.id === supplierId 
        ? { ...supplier, verificationStatus: newStatus }
        : supplier
    ));
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">供应商管理</h1>
          <p className="text-muted-foreground">审核供应商认证，管理API密钥配置</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "总供应商", value: suppliers.length, icon: Users, color: "text-primary" },
            { label: "待审核", value: suppliers.filter(s => s.verificationStatus === "待审核").length, icon: Clock, color: "text-warning" },
            { label: "已认证", value: suppliers.filter(s => s.verificationStatus === "已认证").length, icon: CheckCircle, color: "text-success" },
            { label: "API已配置", value: suppliers.filter(s => s.apiKeyStatus === "已配置").length, icon: Key, color: "text-brand-orange" }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="搜索供应商名称或联系人..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="筛选状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全部">全部状态</SelectItem>
                    <SelectItem value="待审核">待审核</SelectItem>
                    <SelectItem value="已认证">已认证</SelectItem>
                    <SelectItem value="已拒绝">已拒绝</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Table */}
        <Card>
          <CardHeader>
            <CardTitle>供应商列表</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>供应商信息</TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead>业务类型</TableHead>
                  <TableHead>认证状态</TableHead>
                  <TableHead>API状态</TableHead>
                  <TableHead>本月业绩</TableHead>
                  <TableHead>加入时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{supplier.companyName}</div>
                        <div className="text-sm text-muted-foreground">ID: {supplier.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{supplier.contactPerson}</div>
                        <div className="text-sm text-muted-foreground">{supplier.contactPhone}</div>
                        <div className="text-sm text-muted-foreground">{supplier.contactEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>{supplier.businessType}</TableCell>
                    <TableCell>{getStatusBadge(supplier.verificationStatus)}</TableCell>
                    <TableCell>{getApiKeyBadge(supplier.apiKeyStatus)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{supplier.monthlyOrders} 订单</div>
                        <div className="text-sm text-muted-foreground">¥{supplier.totalRevenue}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{supplier.joinDate}</div>
                        <div className="text-xs text-muted-foreground">最后登录: {supplier.lastLogin}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon-sm"
                              onClick={() => setSelectedSupplier(supplier)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>供应商详情 - {supplier.companyName}</DialogTitle>
                            </DialogHeader>
                            
                            {selectedSupplier && (
                              <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">基本信息</h4>
                                    <div className="space-y-2 text-sm">
                                      <div><span className="text-muted-foreground">企业名称:</span> {selectedSupplier.companyName}</div>
                                      <div><span className="text-muted-foreground">联系人:</span> {selectedSupplier.contactPerson}</div>
                                      <div><span className="text-muted-foreground">电话:</span> {selectedSupplier.contactPhone}</div>
                                      <div><span className="text-muted-foreground">邮箱:</span> {selectedSupplier.contactEmail}</div>
                                      <div><span className="text-muted-foreground">业务类型:</span> {selectedSupplier.businessType}</div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-semibold mb-2">认证状态</h4>
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm text-muted-foreground">当前状态:</span>
                                        {getStatusBadge(selectedSupplier.verificationStatus)}
                                      </div>
                                      {selectedSupplier.verificationStatus === "待审核" && (
                                        <div className="flex space-x-2">
                                          <Button 
                                            size="sm" 
                                            onClick={() => handleStatusChange(selectedSupplier.id, "已认证")}
                                          >
                                            通过认证
                                          </Button>
                                          <Button 
                                            variant="destructive" 
                                            size="sm"
                                            onClick={() => handleStatusChange(selectedSupplier.id, "已拒绝")}
                                          >
                                            拒绝认证
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* API Configuration */}
                                <div>
                                  <h4 className="font-semibold mb-2">API配置管理</h4>
                                  <div className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm">API Key状态:</span>
                                      {getApiKeyBadge(selectedSupplier.apiKeyStatus)}
                                    </div>
                                    <div className="flex space-x-2">
                                      <Button variant="outline" size="sm">
                                        <Key className="w-4 h-4 mr-2" />
                                        分配API Key
                                      </Button>
                                      <Button variant="ghost" size="sm">查看配置</Button>
                                    </div>
                                  </div>
                                </div>

                                {/* Business Performance */}
                                <div>
                                  <h4 className="font-semibold mb-2">业务表现</h4>
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 border rounded">
                                      <div className="text-2xl font-bold text-primary">{selectedSupplier.monthlyOrders}</div>
                                      <div className="text-sm text-muted-foreground">本月订单</div>
                                    </div>
                                    <div className="text-center p-3 border rounded">
                                      <div className="text-2xl font-bold text-success">¥{selectedSupplier.totalRevenue}</div>
                                      <div className="text-sm text-muted-foreground">本月营收</div>
                                    </div>
                                    <div className="text-center p-3 border rounded">
                                      <div className="text-2xl font-bold text-brand-orange">4.8</div>
                                      <div className="text-sm text-muted-foreground">平均评分</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {supplier.verificationStatus === "待审核" && (
                          <>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleStatusChange(supplier.id, "已认证")}
                            >
                              通过
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleStatusChange(supplier.id, "已拒绝")}
                            >
                              拒绝
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminSuppliersPage;