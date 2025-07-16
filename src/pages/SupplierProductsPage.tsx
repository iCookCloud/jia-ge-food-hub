import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Upload,
  Image as ImageIcon,
  Video,
  Package,
  BarChart3,
  TrendingUp,
  AlertCircle
} from "lucide-react";

// Import product images
import salmonImage from "@/assets/salmon-fillet.jpg";
import beefImage from "@/assets/beef-rolls.jpg";
import vegetableImage from "@/assets/vegetable-platter.jpg";
import spiceImage from "@/assets/spice-set.jpg";

// Mock supplier products data
const mockSupplierProducts = [
  {
    id: "1",
    name: "新鲜三文鱼片 挪威进口",
    image: salmonImage,
    sku: "SF001",
    category: "海鲜",
    price: "128.00",
    stock: 150,
    unit: "kg",
    status: "已上架",
    views: 234,
    inquiries: 12,
    createdAt: "2024-01-15"
  },
  {
    id: "2",
    name: "优质牛肉卷 火锅专用",
    image: beefImage,
    sku: "BF002",
    category: "肉类",
    price: "89.00",
    stock: 89,
    unit: "kg",
    status: "已上架",
    views: 156,
    inquiries: 8,
    createdAt: "2024-01-10"
  },
  {
    id: "3",
    name: "进口调味料套装",
    image: spiceImage,
    sku: "SP003",
    category: "调料",
    price: "156.00",
    stock: 0,
    unit: "套",
    status: "缺货",
    views: 98,
    inquiries: 5,
    createdAt: "2024-01-08"
  },
  {
    id: "4",
    name: "有机蔬菜拼盘",
    image: vegetableImage,
    sku: "VG004",
    category: "蔬菜",
    price: "35.00",
    stock: 45,
    unit: "份",
    status: "审核中",
    views: 67,
    inquiries: 3,
    createdAt: "2024-01-05"
  }
];

const SupplierProductsPage = () => {
  const [products, setProducts] = useState(mockSupplierProducts);
  const [selectedStatus, setSelectedStatus] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    stock: "",
    unit: "kg",
    description: "",
    specifications: "",
    image: null as File | null
  });

  const filteredProducts = products.filter(product => {
    const matchesStatus = selectedStatus === "全部" || product.status === selectedStatus;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "已上架":
        return <Badge variant="secondary" className="bg-success text-success-foreground">已上架</Badge>;
      case "缺货":
        return <Badge variant="destructive">缺货</Badge>;
      case "审核中":
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">审核中</Badge>;
      case "已下架":
        return <Badge variant="outline">已下架</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAddProduct = () => {
    // Add product logic here
    console.log("Adding product:", newProduct);
    setShowAddDialog(false);
    setNewProduct({
      name: "",
      sku: "",
      category: "",
      price: "",
      stock: "",
      unit: "kg",
      description: "",
      specifications: "",
      image: null
    });
  };

  const handleToggleStatus = (productId: string) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, status: product.status === "已上架" ? "已下架" : "已上架" }
        : product
    ));
  };

  const ProductForm = ({ product, onSave, onCancel }: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">商品名称</Label>
          <Input 
            id="name" 
            value={product?.name || newProduct.name}
            onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
            placeholder="请输入商品名称"
          />
        </div>
        <div>
          <Label htmlFor="sku">商品编码</Label>
          <Input 
            id="sku" 
            value={product?.sku || newProduct.sku}
            onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
            placeholder="请输入商品编码"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="category">商品分类</Label>
          <Select value={product?.category || newProduct.category} onValueChange={(value) => setNewProduct(prev => ({ ...prev, category: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-popover">
              <SelectItem value="海鲜">海鲜</SelectItem>
              <SelectItem value="肉类">肉类</SelectItem>
              <SelectItem value="蔬菜">蔬菜</SelectItem>
              <SelectItem value="调料">调料</SelectItem>
              <SelectItem value="冷冻食品">冷冻食品</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="price">价格</Label>
          <Input 
            id="price" 
            type="number" 
            value={product?.price || newProduct.price}
            onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
            placeholder="0.00"
          />
        </div>
        <div>
          <Label htmlFor="unit">单位</Label>
          <Select value={product?.unit || newProduct.unit} onValueChange={(value) => setNewProduct(prev => ({ ...prev, unit: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50 bg-popover">
              <SelectItem value="kg">千克</SelectItem>
              <SelectItem value="g">克</SelectItem>
              <SelectItem value="份">份</SelectItem>
              <SelectItem value="盒">盒</SelectItem>
              <SelectItem value="套">套</SelectItem>
              <SelectItem value="个">个</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="stock">库存数量</Label>
        <Input 
          id="stock" 
          type="number" 
          value={product?.stock || newProduct.stock}
          onChange={(e) => setNewProduct(prev => ({ ...prev, stock: e.target.value }))}
          placeholder="0"
        />
      </div>

      <div>
        <Label htmlFor="specifications">商品规格</Label>
        <Input 
          id="specifications" 
          value={newProduct.specifications}
          onChange={(e) => setNewProduct(prev => ({ ...prev, specifications: e.target.value }))}
          placeholder="如：500g/片 冷链配送"
        />
      </div>

      <div>
        <Label htmlFor="description">商品描述</Label>
        <Textarea 
          id="description" 
          value={newProduct.description}
          onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
          placeholder="请输入商品详细描述..."
          className="min-h-24"
        />
      </div>

      <div>
        <Label htmlFor="image">商品图片</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-2">点击上传或拖拽图片到此处</p>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            选择图片
          </Button>
        </div>
      </div>

      <div className="flex space-x-2 pt-4">
        <Button onClick={handleAddProduct} className="flex-1">
          {product ? "更新商品" : "添加商品"}
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1">
          取消
        </Button>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">商品管理</h1>
            <p className="text-muted-foreground">管理您的商品库存、价格和状态</p>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                添加商品
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>添加新商品</DialogTitle>
              </DialogHeader>
              <ProductForm 
                product={null}
                onSave={handleAddProduct}
                onCancel={() => setShowAddDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{products.length}</p>
                  <p className="text-sm text-muted-foreground">总商品数</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Eye className="h-8 w-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">
                    {products.filter(p => p.status === "已上架").length}
                  </p>
                  <p className="text-sm text-muted-foreground">已上架</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-2xl font-bold">
                    {products.reduce((sum, p) => sum + p.views, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">总浏览量</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-brand-orange" />
                <div>
                  <p className="text-2xl font-bold">
                    {products.reduce((sum, p) => sum + p.inquiries, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">总询价数</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Input 
                  placeholder="搜索商品名称或编码..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  <SelectItem value="全部">全部状态</SelectItem>
                  <SelectItem value="已上架">已上架</SelectItem>
                  <SelectItem value="缺货">缺货</SelectItem>
                  <SelectItem value="审核中">审核中</SelectItem>
                  <SelectItem value="已下架">已下架</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>商品列表</span>
              <span className="text-sm font-normal text-muted-foreground">
                共 {filteredProducts.length} 个商品
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品信息</TableHead>
                  <TableHead>编码</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>价格</TableHead>
                  <TableHead>库存</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>数据</TableHead>
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
                          className="w-12 h-12 rounded-lg object-cover border"
                        />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            创建于 {product.createdAt}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ¥{product.price}/{product.unit}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span className={product.stock === 0 ? "text-destructive" : "text-foreground"}>
                          {product.stock}
                        </span>
                        <span className="text-muted-foreground text-sm">{product.unit}</span>
                        {product.stock <= 10 && product.stock > 0 && (
                          <AlertCircle className="h-4 w-4 text-warning" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center space-x-2">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          <span>{product.views}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          <span>{product.inquiries}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon-sm"
                          onClick={() => handleToggleStatus(product.id)}
                        >
                          {product.status === "已上架" ? 
                            <EyeOff className="h-4 w-4" /> : 
                            <Eye className="h-4 w-4" />
                          }
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon-sm"
                          onClick={() => setEditingProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  暂无匹配的商品
                </h3>
                <p className="text-muted-foreground mb-4">
                  请尝试调整搜索条件或添加新商品
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  添加商品
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Product Dialog */}
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>编辑商品</DialogTitle>
            </DialogHeader>
            {editingProduct && (
              <ProductForm 
                product={editingProduct}
                onSave={() => setEditingProduct(null)}
                onCancel={() => setEditingProduct(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default SupplierProductsPage;