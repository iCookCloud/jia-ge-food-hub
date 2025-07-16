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
  Package, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Search,
  Filter,
  AlertTriangle
} from "lucide-react";

// Mock product data for admin review
const mockProducts = [
  {
    id: "P001",
    name: "新鲜三文鱼片 挪威进口",
    sku: "SAL001",
    supplier: "海鲜直供",
    category: "海鲜水产",
    price: "128.00",
    status: "待审核",
    submitDate: "2024-01-16",
    image: "/src/assets/salmon-fillet.jpg",
    description: "优质挪威进口三文鱼，新鲜配送",
    reason: ""
  },
  {
    id: "P002",
    name: "优质牛肉卷 火锅专用",
    sku: "BEEF002", 
    supplier: "优质肉类",
    category: "肉类制品",
    price: "89.00",
    status: "已通过",
    submitDate: "2024-01-15",
    image: "/src/assets/beef-rolls.jpg",
    description: "精选牛肉制作，适合火锅使用",
    reason: ""
  },
  {
    id: "P003",
    name: "有机蔬菜拼盘",
    sku: "VEG003",
    supplier: "绿色农场",
    category: "蔬菜类",
    price: "35.00", 
    status: "已拒绝",
    submitDate: "2024-01-14",
    image: "/src/assets/vegetable-platter.jpg",
    description: "新鲜有机蔬菜组合装",
    reason: "商品图片不清晰，缺少有机认证证明"
  },
  {
    id: "P004",
    name: "精选香料套装",
    sku: "SPI004",
    supplier: "香料专家",
    category: "调料香料",
    price: "68.00",
    status: "待审核",
    submitDate: "2024-01-16",
    image: "/src/assets/spice-set.jpg",
    description: "多种香料组合，提升菜品风味",
    reason: ""
  }
];

const AdminProductsPage = () => {
  const [products, setProducts] = useState(mockProducts);
  const [selectedStatus, setSelectedStatus] = useState("全部");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter(product => {
    const matchesStatus = selectedStatus === "全部" || product.status === selectedStatus;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "已通过":
        return <Badge variant="secondary" className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />已通过</Badge>;
      case "待审核":
        return <Badge variant="secondary" className="bg-warning text-warning-foreground"><Clock className="w-3 h-3 mr-1" />待审核</Badge>;
      case "已拒绝":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />已拒绝</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleStatusChange = (productId: string, newStatus: string, reason: string = "") => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, status: newStatus, reason }
        : product
    ));
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">商品审核管理</h1>
          <p className="text-muted-foreground">审核供应商提交的商品信息，确保平台商品质量</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "总商品", value: products.length, icon: Package, color: "text-primary" },
            { label: "待审核", value: products.filter(p => p.status === "待审核").length, icon: Clock, color: "text-warning" },
            { label: "已通过", value: products.filter(p => p.status === "已通过").length, icon: CheckCircle, color: "text-success" },
            { label: "已拒绝", value: products.filter(p => p.status === "已拒绝").length, icon: AlertTriangle, color: "text-destructive" }
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
                    placeholder="搜索商品名称、SKU或供应商..."
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
                    <SelectItem value="已通过">已通过</SelectItem>
                    <SelectItem value="已拒绝">已拒绝</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>商品审核列表</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品信息</TableHead>
                  <TableHead>供应商</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>价格</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>提交时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{product.supplier}</div>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="font-semibold">¥{product.price}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(product.status)}
                        {product.reason && (
                          <div className="text-xs text-destructive">
                            {product.reason}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{product.submitDate}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon-sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {product.status === "待审核" && (
                          <>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleStatusChange(product.id, "已通过")}
                            >
                              通过
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleStatusChange(product.id, "已拒绝", "商品信息不完整")}
                            >
                              拒绝
                            </Button>
                          </>
                        )}
                        
                        {product.status === "已拒绝" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStatusChange(product.id, "待审核", "")}
                          >
                            重新审核
                          </Button>
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

export default AdminProductsPage;