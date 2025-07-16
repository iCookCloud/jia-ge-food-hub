import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Plus,
  Package,
  Search,
  Edit,
  Trash2,
  Save,
  Eye,
  ShoppingCart
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProducts, Product } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProductCreateForm } from "@/components/product/ProductCreateForm";

interface SheetItem {
  id: string;
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
  markup_percentage?: number;
  custom_price?: number;
}

const SheetCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: products = [], isLoading: productsLoading } = useProducts();

  // 货单基本信息
  const [sheetName, setSheetName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isPublic, setIsPublic] = useState(false); // 默认私有
  
  // 商品列表
  const [selectedProducts, setSelectedProducts] = useState<SheetItem[]>([]);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showCreateProductDialog, setShowCreateProductDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // 编辑状态
  const [editingItem, setEditingItem] = useState<string | null>(null);

  // 过滤产品
  const filteredProducts = products.filter(product => 
    product.standard_chinese_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.standard_english_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 添加商品到货单
  const addProductToSheet = (product: Product) => {
    const existingItem = selectedProducts.find(item => item.product.id === product.id);
    
    if (existingItem) {
      toast({
        title: "商品已存在",
        description: "该商品已在货单中，请调整数量",
        variant: "destructive"
      });
      return;
    }

    const unitPrice = parseFloat(product.unit_price || "0");
    const newItem: SheetItem = {
      id: `item-${Date.now()}`,
      product,
      quantity: 1,
      unit_price: unitPrice,
      total_price: unitPrice,
      markup_percentage: 0
    };

    setSelectedProducts(prev => [...prev, newItem]);
    setShowProductDialog(false);
    
    toast({
      title: "商品已添加",
      description: `已将 ${product.standard_chinese_name || product.sku} 添加到货单`
    });
  };

  // 更新商品信息
  const updateItem = (itemId: string, updates: Partial<SheetItem>) => {
    setSelectedProducts(prev => 
      prev.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, ...updates };
          // 重新计算总价
          updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price;
          return updatedItem;
        }
        return item;
      })
    );
  };

  // 删除商品
  const removeItem = (itemId: string) => {
    setSelectedProducts(prev => prev.filter(item => item.id !== itemId));
  };

  // 计算货单总额
  const calculateTotal = () => {
    return selectedProducts.reduce((total, item) => total + item.total_price, 0);
  };

  // 保存货单
  const saveSheet = async () => {
    if (!sheetName.trim()) {
      toast({
        title: "请输入货单名称",
        variant: "destructive"
      });
      return;
    }

    if (selectedProducts.length === 0) {
      toast({
        title: "请添加商品",
        description: "货单至少需要包含一个商品",
        variant: "destructive"
      });
      return;
    }

    try {
      // 先创建产品列表
      const { data: productList, error: listError } = await supabase
        .from('product_lists')
        .insert({
          name: sheetName,
          description: description,
          supplier_id: user?.id,
          is_public: isPublic,
          is_active: true
        })
        .select()
        .single();

      if (listError) throw listError;

      // 创建货单
      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .insert({
          notes: description,
          total_amount: calculateTotal(),
          supplier_id: user?.id,
          product_list_id: productList.id,
          status: 'draft',
          is_shareable: isPublic
        })
        .select()
        .single();

      if (quotationError) throw quotationError;

      // 添加商品到产品列表
      const listItems = selectedProducts.map((item, index) => ({
        product_list_id: productList.id,
        product_id: item.product.id,
        custom_price: item.unit_price,
        markup_percentage: item.markup_percentage || 0,
        position: index
      }));

      const { error: itemsError } = await supabase
        .from('product_list_items')
        .insert(listItems);

      if (itemsError) throw itemsError;

      toast({
        title: "货单创建成功",
        description: `货单 "${sheetName}" 已创建，包含 ${selectedProducts.length} 个商品`
      });

      navigate(`/sheets/${quotation.id}`);
    } catch (error) {
      console.error('创建货单失败:', error);
      toast({
        title: "创建失败",
        description: "货单创建失败，请重试",
        variant: "destructive"
      });
    }
  };

  // 处理新商品创建成功
  const handleProductCreated = (newProduct: Product) => {
    // 刷新商品列表 - 在实际应用中应该使用react-query的invalidateQueries
    // 这里简单地将新商品添加到当前列表中（仅用于展示）
    toast({
      title: "商品创建成功",
      description: `商品 "${newProduct.standard_chinese_name || newProduct.sku}" 已创建，您可以将其添加到货单中`
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">创建货单</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 货单基本信息 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>货单信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sheetName">货单名称 *</Label>
                  <Input
                    id="sheetName"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    placeholder="请输入货单名称"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="category">商品分类</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seafood">海鲜水产</SelectItem>
                      <SelectItem value="meat">肉类</SelectItem>
                      <SelectItem value="vegetable">蔬菜</SelectItem>
                      <SelectItem value="dairy">乳制品</SelectItem>
                      <SelectItem value="frozen">冷冻食品</SelectItem>
                      <SelectItem value="spice">调料</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">货单描述</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="描述货单内容、特色等"
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={isPublic}
                    onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                  />
                  <Label htmlFor="isPublic">公开货单（其他用户可查看和分享）</Label>
                </div>

                {/* 货单统计 */}
                <div className="pt-4 border-t">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>商品数量:</span>
                      <span className="font-semibold">{selectedProducts.length} 个</span>
                    </div>
                    <div className="flex justify-between">
                      <span>货单总额:</span>
                      <span className="font-semibold text-lg">¥{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="pt-4 space-y-2">
                  <Button 
                    onClick={saveSheet} 
                    className="w-full"
                    disabled={!sheetName.trim() || selectedProducts.length === 0}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    保存货单
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    预览货单
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 商品列表 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>商品列表</CardTitle>
                  <Button onClick={() => setShowProductDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加商品
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      暂无商品
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      点击"添加商品"开始构建您的货单
                    </p>
                    <Button onClick={() => setShowProductDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      添加商品
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedProducts.map((item) => (
                      <Card key={item.id} className="border border-muted">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              {item.product.product_image && (
                                <img 
                                  src={item.product.product_image} 
                                  alt={item.product.standard_chinese_name || item.product.sku}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <h4 className="font-semibold">
                                  {item.product.standard_chinese_name || item.product.standard_english_name || item.product.sku}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  SKU: {item.product.sku}
                                </p>
                                {item.product.specifications && (
                                  <p className="text-sm text-muted-foreground">
                                    规格: {item.product.specifications}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {editingItem === item.id ? (
                              <div className="flex items-center space-x-2">
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <Label className="text-xs">数量</Label>
                                    <Input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                                      className="h-8"
                                      min="1"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">单价</Label>
                                    <Input
                                      type="number"
                                      value={item.unit_price}
                                      onChange={(e) => updateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                                      className="h-8"
                                      step="0.01"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">小计</Label>
                                    <div className="h-8 flex items-center text-sm font-semibold">
                                      ¥{item.total_price.toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                                <Button 
                                  size="sm" 
                                  onClick={() => setEditingItem(null)}
                                >
                                  确定
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-4">
                                <div className="text-right text-sm">
                                  <div>数量: {item.quantity}</div>
                                  <div>单价: ¥{item.unit_price}</div>
                                  <div className="font-semibold">小计: ¥{item.total_price.toLocaleString()}</div>
                                </div>
                                <div className="flex space-x-1">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setEditingItem(item.id)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => removeItem(item.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 商品选择对话框 */}
        <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>选择商品</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* 搜索和创建商品 */}
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="搜索商品名称、SKU..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setShowCreateProductDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  创建商品
                </Button>
              </div>

              {/* 商品列表 */}
              {productsLoading ? (
                <div className="text-center py-8">加载商品中...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">暂无匹配的商品</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          {product.product_image && (
                            <img 
                              src={product.product_image} 
                              alt={product.standard_chinese_name || product.sku}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">
                              {product.standard_chinese_name || product.standard_english_name || product.sku}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              SKU: {product.sku}
                            </p>
                            {product.unit_price && (
                              <p className="text-xs text-primary font-semibold">
                                ¥{product.unit_price}
                              </p>
                            )}
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => addProductToSheet(product)}
                            disabled={selectedProducts.some(item => item.product.id === product.id)}
                          >
                            {selectedProducts.some(item => item.product.id === product.id) ? '已添加' : '添加'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* 创建商品对话框 */}
        <ProductCreateForm
          open={showCreateProductDialog}
          onOpenChange={setShowCreateProductDialog}
          onProductCreated={handleProductCreated}
        />
      </div>
    </Layout>
  );
};

export default SheetCreatePage;