import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ShoppingCart, 
  Package, 
  X, 
  Save,
  Eye,
  Edit3
} from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface QuickSheetCreatorProps {
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface SheetItem {
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export const QuickSheetCreator = ({ 
  products, 
  open, 
  onOpenChange, 
  onSuccess,
  onError 
}: QuickSheetCreatorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [sheetName, setSheetName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isPublic, setIsPublic] = useState(false); // 默认私有
  const [items, setItems] = useState<SheetItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 初始化商品项
  useEffect(() => {
    if (products.length > 0) {
      const initialItems: SheetItem[] = products.map(product => ({
        product,
        quantity: 1,
        unit_price: parseFloat(product.unit_price || "0"),
        total_price: parseFloat(product.unit_price || "0")
      }));
      setItems(initialItems);
    }
  }, [products]);

  const updateItemQuantity = (index: number, quantity: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const newItem = { ...item, quantity };
        newItem.total_price = newItem.quantity * newItem.unit_price;
        return newItem;
      }
      return item;
    }));
  };

  const updateItemPrice = (index: number, price: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const newItem = { ...item, unit_price: price };
        newItem.total_price = newItem.quantity * newItem.unit_price;
        return newItem;
      }
      return item;
    }));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.total_price, 0);
  };

  const handleSubmit = async () => {
    if (!sheetName.trim()) {
      toast({
        title: "请输入货单名称",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "请添加商品",
        description: "货单至少需要包含一个商品",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // 创建产品列表
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
          sheet_name: sheetName,
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
      const listItems = items.map((item, index) => ({
        product_list_id: productList.id,
        product_id: item.product.id,
        custom_price: item.unit_price,
        markup_percentage: 0,
        position: index
      }));

      const { error: itemsError } = await supabase
        .from('product_list_items')
        .insert(listItems);

      if (itemsError) throw itemsError;

      // 创建货单项
      const quotationItems = items.map(item => ({
        quotation_id: quotation.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: quotationItemsError } = await supabase
        .from('quotation_items')
        .insert(quotationItems);

      if (quotationItemsError) throw quotationItemsError;

      toast({
        title: "货单创建成功",
        description: `货单 "${sheetName}" 已创建，包含 ${items.length} 个商品`
      });

      onSuccess?.();
      onOpenChange(false);
      navigate(`/sheets/${quotation.id}`);
    } catch (error) {
      console.error('创建货单失败:', error);
      const errorMessage = error instanceof Error ? error.message : "货单创建失败，请重试";
      
      toast({
        title: "创建失败",
        description: `货单创建失败，请检查错误：${errorMessage}`,
        variant: "destructive"
      });
      
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            快速创建货单
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 货单信息 */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
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
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={isPublic}
                    onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                  />
                  <Label htmlFor="isPublic" className="text-sm">
                    公开货单（其他用户可查看和分享）
                  </Label>
                </div>

                <div className="pt-4 border-t">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>商品数量:</span>
                      <span className="font-semibold">{items.length} 个</span>
                    </div>
                    <div className="flex justify-between">
                      <span>货单总额:</span>
                      <span className="font-semibold text-lg">
                        ¥{calculateTotal().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 商品列表 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">商品列表</h3>
              <Badge variant="outline">
                {items.length} 个商品
              </Badge>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {items.map((item, index) => (
                <Card key={item.product.id} className="border border-muted">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        {item.product.product_image && (
                          <img 
                            src={item.product.product_image} 
                            alt={item.product.standard_chinese_name || item.product.sku}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm mb-1 truncate">
                            {item.product.standard_chinese_name || 
                             item.product.standard_english_name || 
                             item.product.sku}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            SKU: {item.product.sku}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="text-right text-xs">
                          <div className="mb-1">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                              className="w-16 h-6 text-xs"
                              min="1"
                            />
                          </div>
                          <div className="mb-1">
                            <Input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)}
                              className="w-20 h-6 text-xs"
                              step="0.01"
                            />
                          </div>
                          <div className="font-semibold text-primary">
                            ¥{item.total_price.toLocaleString()}
                          </div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex space-x-2 pt-4">
              <Button 
                onClick={handleSubmit}
                disabled={loading || !sheetName.trim() || items.length === 0}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? "创建中..." : "创建货单"}
              </Button>
              <Button 
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};