import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Save, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { productService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface ProductCreateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductCreated?: (product: any) => void;
}

export const ProductCreateForm = ({ open, onOpenChange, onProductCreated }: ProductCreateFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // 产品基本信息
  const [formData, setFormData] = useState({
    sku: "",
    standard_chinese_name: "",
    standard_english_name: "",
    category_chinese: "",
    category_english: "",
    subcategory: "",
    unit_price: "",
    unit: "",
    specifications: "",
    specification: "",
    quantity: "",
    ctn: "",
    type: "",
    vendor: "",
    Vendor: "",
    remarks: "",
    dimensions_cm: "",
    outer_size_cm: "",
    outer_box_dimensions: "",
    package_outer_size: "",
    volume_cbm: "",
    storage_requirements: "",
    is_fragile: false,
    requires_cold_chain: false,
    requires_fda_label: false,
    product_image: ""
  });

  const categories = [
    { chinese: "海鲜水产", english: "Seafood" },
    { chinese: "肉类", english: "Meat" },
    { chinese: "蔬菜", english: "Vegetables" },
    { chinese: "乳制品", english: "Dairy" },
    { chinese: "冷冻食品", english: "Frozen Foods" },
    { chinese: "调料", english: "Spices" },
    { chinese: "粮油", english: "Grains & Oils" },
    { chinese: "饮品", english: "Beverages" },
    { chinese: "烘焙", english: "Bakery" },
    { chinese: "其他", english: "Others" }
  ];

  const units = ["公斤", "箱", "包", "瓶", "袋", "件", "个", "盒", "桶", "升"];

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateSKU = () => {
    const categoryCode = formData.category_chinese ? 
      categories.find(c => c.chinese === formData.category_chinese)?.english?.substring(0, 3).toUpperCase() || 'PRD' :
      'PRD';
    const timestamp = Date.now().toString().slice(-6);
    const sku = `${categoryCode}${timestamp}`;
    updateFormData('sku', sku);
  };

  const handleCategoryChange = (chineseCategory: string) => {
    const category = categories.find(c => c.chinese === chineseCategory);
    updateFormData('category_chinese', chineseCategory);
    updateFormData('category_english', category?.english || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sku || !formData.standard_chinese_name) {
      toast({
        title: "请填写必填项",
        description: "SKU和中文名称为必填项",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const productData = {
        ...formData,
        id: formData.sku, // 使用SKU作为ID
        user_id: user?.id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = await productService.create(productData);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      toast({
        title: "商品创建成功",
        description: `商品 "${formData.standard_chinese_name}" 已创建`
      });

      onProductCreated?.(result.data);
      onOpenChange(false);
      
      // 重置表单
      setFormData({
        sku: "",
        standard_chinese_name: "",
        standard_english_name: "",
        category_chinese: "",
        category_english: "",
        subcategory: "",
        unit_price: "",
        unit: "",
        specifications: "",
        specification: "",
        quantity: "",
        ctn: "",
        type: "",
        vendor: "",
        Vendor: "",
        remarks: "",
        dimensions_cm: "",
        outer_size_cm: "",
        outer_box_dimensions: "",
        package_outer_size: "",
        volume_cbm: "",
        storage_requirements: "",
        is_fragile: false,
        requires_cold_chain: false,
        requires_fda_label: false,
        product_image: ""
      });
    } catch (error) {
      console.error('创建商品失败:', error);
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "创建商品失败，请重试",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>创建新商品</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => updateFormData('sku', e.target.value)}
                      placeholder="商品编码"
                      required
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={generateSKU}
                    className="mt-6"
                  >
                    自动生成
                  </Button>
                </div>

                <div>
                  <Label htmlFor="chinese_name">中文名称 *</Label>
                  <Input
                    id="chinese_name"
                    value={formData.standard_chinese_name}
                    onChange={(e) => updateFormData('standard_chinese_name', e.target.value)}
                    placeholder="商品中文名称"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="english_name">英文名称</Label>
                  <Input
                    id="english_name"
                    value={formData.standard_english_name}
                    onChange={(e) => updateFormData('standard_english_name', e.target.value)}
                    placeholder="商品英文名称"
                  />
                </div>

                <div>
                  <Label htmlFor="category">商品分类</Label>
                  <Select 
                    value={formData.category_chinese} 
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.chinese} value={category.chinese}>
                          {category.chinese} ({category.english})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subcategory">子分类</Label>
                  <Input
                    id="subcategory"
                    value={formData.subcategory}
                    onChange={(e) => updateFormData('subcategory', e.target.value)}
                    placeholder="商品子分类"
                  />
                </div>

                <div>
                  <Label htmlFor="vendor">供应商</Label>
                  <Input
                    id="vendor"
                    value={formData.vendor}
                    onChange={(e) => updateFormData('vendor', e.target.value)}
                    placeholder="供应商名称"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 价格和规格 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">价格和规格</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="unit_price">单价</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => updateFormData('unit_price', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">单位</Label>
                    <Select 
                      value={formData.unit} 
                      onValueChange={(value) => updateFormData('unit', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择单位" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="specifications">商品规格</Label>
                  <Textarea
                    id="specifications"
                    value={formData.specifications}
                    onChange={(e) => updateFormData('specifications', e.target.value)}
                    placeholder="详细描述商品规格，如尺寸、重量等"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">包装数量</Label>
                    <Input
                      id="quantity"
                      value={formData.quantity}
                      onChange={(e) => updateFormData('quantity', e.target.value)}
                      placeholder="每包装单位数量"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ctn">外箱装</Label>
                    <Input
                      id="ctn"
                      value={formData.ctn}
                      onChange={(e) => updateFormData('ctn', e.target.value)}
                      placeholder="每箱数量"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="type">产品类型</Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) => updateFormData('type', e.target.value)}
                    placeholder="如：新鲜、冷冻、干货等"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 物理属性 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">物理属性</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="dimensions">商品尺寸 (cm)</Label>
                  <Input
                    id="dimensions"
                    value={formData.dimensions_cm}
                    onChange={(e) => updateFormData('dimensions_cm', e.target.value)}
                    placeholder="长×宽×高，如：30×20×15"
                  />
                </div>

                <div>
                  <Label htmlFor="outer_size">外包装尺寸 (cm)</Label>
                  <Input
                    id="outer_size"
                    value={formData.outer_size_cm}
                    onChange={(e) => updateFormData('outer_size_cm', e.target.value)}
                    placeholder="外包装长×宽×高"
                  />
                </div>

                <div>
                  <Label htmlFor="volume">体积 (CBM)</Label>
                  <Input
                    id="volume"
                    value={formData.volume_cbm}
                    onChange={(e) => updateFormData('volume_cbm', e.target.value)}
                    placeholder="立方米"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fragile"
                      checked={formData.is_fragile}
                      onCheckedChange={(checked) => updateFormData('is_fragile', checked)}
                    />
                    <Label htmlFor="fragile">易碎品</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cold_chain"
                      checked={formData.requires_cold_chain}
                      onCheckedChange={(checked) => updateFormData('requires_cold_chain', checked)}
                    />
                    <Label htmlFor="cold_chain">需要冷链运输</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fda_label"
                      checked={formData.requires_fda_label}
                      onCheckedChange={(checked) => updateFormData('requires_fda_label', checked)}
                    />
                    <Label htmlFor="fda_label">需要FDA标签</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 存储和备注 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">存储和备注</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="storage">存储要求</Label>
                  <Textarea
                    id="storage"
                    value={formData.storage_requirements}
                    onChange={(e) => updateFormData('storage_requirements', e.target.value)}
                    placeholder="温度、湿度、特殊存储要求等"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="remarks">备注</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => updateFormData('remarks', e.target.value)}
                    placeholder="其他重要信息"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="image_url">商品图片URL</Label>
                  <Input
                    id="image_url"
                    value={formData.product_image}
                    onChange={(e) => updateFormData('product_image', e.target.value)}
                    placeholder="https://example.com/product.jpg"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4 mr-2" />
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "创建中..." : "创建商品"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};