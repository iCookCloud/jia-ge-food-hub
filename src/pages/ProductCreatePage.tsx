import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Upload, Save, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ProductCreatePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    standard_chinese_name: "",
    standard_english_name: "",
    sku: "",
    category_chinese: "",
    category_english: "",
    subcategory: "",
    unit: "",
    unit_price: "",
    quantity: "",
    specifications: "",
    specification: "",
    storage_requirements: "",
    requires_cold_chain: false,
    requires_fda_label: false,
    is_fragile: false,
    is_active: true,
    is_public: true, // 新增：商品是否公开
    product_image: "",
    remarks: "",
    vendor: "优质食材供应有限公司",
    dimensions_cm: "",
    outer_size_cm: "",
    volume_cbm: "",
    package_outer_size: "",
    ctn: ""
  });

  const categories = [
    { chinese: "海鲜水产", english: "Seafood" },
    { chinese: "肉类", english: "Meat" },
    { chinese: "蔬菜", english: "Vegetables" },
    { chinese: "乳制品", english: "Dairy" },
    { chinese: "冷冻食品", english: "Frozen Food" },
    { chinese: "调料", english: "Seasoning" },
    { chinese: "粮油", english: "Grain & Oil" },
    { chinese: "饮品", english: "Beverage" },
    { chinese: "烘焙", english: "Bakery" }
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoryChange = (chineseCategory: string) => {
    const category = categories.find(c => c.chinese === chineseCategory);
    setFormData(prev => ({
      ...prev,
      category_chinese: chineseCategory,
      category_english: category?.english || ""
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "请先登录",
        description: "您需要登录才能创建商品",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // 生成商品ID
      const productId = `PRD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from('products')
        .insert({
          id: productId,
          user_id: user.id,
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      toast({
        title: "商品创建成功",
        description: "您的商品已成功创建"
      });

      navigate("/");
    } catch (error) {
      console.error('创建商品失败:', error);
      toast({
        title: "创建失败",
        description: "创建商品时发生错误，请重试",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">创建商品</h1>
            <p className="text-muted-foreground">添加新的商品到您的产品库</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="standard_chinese_name">商品中文名称 *</Label>
                  <Input
                    id="standard_chinese_name"
                    value={formData.standard_chinese_name}
                    onChange={(e) => handleInputChange("standard_chinese_name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="standard_english_name">商品英文名称</Label>
                  <Input
                    id="standard_english_name"
                    value={formData.standard_english_name}
                    onChange={(e) => handleInputChange("standard_english_name", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU编码 *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange("sku", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>商品分类</Label>
                  <Select value={formData.category_chinese} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.chinese} value={category.chinese}>
                          {category.chinese}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory">子分类</Label>
                  <Input
                    id="subcategory"
                    value={formData.subcategory}
                    onChange={(e) => handleInputChange("subcategory", e.target.value)}
                  />
                </div>

                {/* 商品公开设置 */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_public">公开商品</Label>
                    <p className="text-sm text-muted-foreground">
                      公开后其他用户可以看到此商品
                    </p>
                  </div>
                  <Switch
                    id="is_public"
                    checked={formData.is_public}
                    onCheckedChange={(checked) => handleInputChange("is_public", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 价格与规格 */}
            <Card>
              <CardHeader>
                <CardTitle>价格与规格</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit_price">单价 *</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => handleInputChange("unit_price", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">单位</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => handleInputChange("unit", e.target.value)}
                      placeholder="如：件、箱、公斤"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">包装数量</Label>
                  <Input
                    id="quantity"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange("quantity", e.target.value)}
                    placeholder="如：12个/箱"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specifications">规格描述</Label>
                  <Textarea
                    id="specifications"
                    value={formData.specifications}
                    onChange={(e) => handleInputChange("specifications", e.target.value)}
                    placeholder="详细规格描述"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dimensions_cm">尺寸(cm)</Label>
                  <Input
                    id="dimensions_cm"
                    value={formData.dimensions_cm}
                    onChange={(e) => handleInputChange("dimensions_cm", e.target.value)}
                    placeholder="长×宽×高"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="volume_cbm">体积(立方米)</Label>
                  <Input
                    id="volume_cbm"
                    value={formData.volume_cbm}
                    onChange={(e) => handleInputChange("volume_cbm", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 存储与物流 */}
            <Card>
              <CardHeader>
                <CardTitle>存储与物流</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storage_requirements">存储要求</Label>
                  <Textarea
                    id="storage_requirements"
                    value={formData.storage_requirements}
                    onChange={(e) => handleInputChange("storage_requirements", e.target.value)}
                    placeholder="存储条件和要求"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="requires_cold_chain">需要冷链</Label>
                    <Switch
                      id="requires_cold_chain"
                      checked={formData.requires_cold_chain}
                      onCheckedChange={(checked) => handleInputChange("requires_cold_chain", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="requires_fda_label">需要FDA标签</Label>
                    <Switch
                      id="requires_fda_label"
                      checked={formData.requires_fda_label}
                      onCheckedChange={(checked) => handleInputChange("requires_fda_label", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_fragile">易碎商品</Label>
                    <Switch
                      id="is_fragile"
                      checked={formData.is_fragile}
                      onCheckedChange={(checked) => handleInputChange("is_fragile", checked)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product_image">商品图片URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="product_image"
                      value={formData.product_image}
                      onChange={(e) => handleInputChange("product_image", e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">备注</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => handleInputChange("remarks", e.target.value)}
                    placeholder="其他备注信息"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" asChild>
              <Link to="/">取消</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  创建商品
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default ProductCreatePage;