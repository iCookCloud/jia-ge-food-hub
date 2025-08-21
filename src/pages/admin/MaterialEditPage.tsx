import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Video, 
  Image, 
  Package,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';
import ProductRecommendationList from '@/components/materials/ProductRecommendationList';

interface MaterialData {
  id: string;
  title: string;
  description?: string;
  content?: string;
  category?: string;
  type: 'video' | 'image';
  thumbnail_url?: string;
  public_url?: string;
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
  uploaded_by: string;
  status?: string;
  // 数量相关字段
  quantity?: number;
  stock_status?: 'in_stock' | 'out_of_stock' | 'limited';
  min_quantity?: number;
  max_quantity?: number;
}

interface ProductAssociation {
  id: string;
  original_product_id: string;
  product_sku: string;
  product_name: string;
  recommended_quantity?: number;
  quantity_note?: string;
  product_snapshot: {
    id: string;
    sku: string;
    price: string;
    specification: string;
    standard_chinese_name: string;
    main_image_url?: string;
  };
}

const MaterialEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [material, setMaterial] = useState<MaterialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [associatedProducts, setAssociatedProducts] = useState<ProductAssociation[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: ''
  });

  // 加载材料数据
  const loadMaterial = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('materials_unified')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setMaterial(data);
        setFormData({
          title: data.title || '',
          description: data.description || '',
          content: data.content || '',
          category: data.category || ''
        });
        
        // 加载关联的商品
        loadAssociatedProducts(data.type);
      }
    } catch (error) {
      console.error('Error loading material:', error);
      toast.error('加载材料数据失败');
      navigate('/admin/materials');
    } finally {
      setLoading(false);
    }
  };

  // 加载关联的商品
  const loadAssociatedProducts = async (materialType: 'video' | 'image') => {
    if (!id) return;
    
    setProductsLoading(true);
    try {
      const tableName = materialType === 'video' ? 'video_product_associations' : 'image_product_associations';
      const columnName = materialType === 'video' ? 'video_id' : 'image_id';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(columnName, id);

      if (error) throw error;

      setAssociatedProducts(data || []);
    } catch (error) {
      console.error('Error loading associated products:', error);
      toast.error('加载关联商品失败');
    } finally {
      setProductsLoading(false);
    }
  };

  // 保存更改
  const handleSave = async () => {
    if (!material) return;
    
    setSaving(true);
    try {
      // 更新材料信息
      const tableName = material.type === 'video' ? 'product_videos' : 'uploaded_images';
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          title: formData.title,
          description: formData.description,
          content: formData.content,
          category: formData.category,
          updated_at: new Date().toISOString()
        })
        .eq('id', material.id);

      if (updateError) {
        throw updateError;
      }

      toast.success('展示案例信息已更新');
      navigate('/admin/materials');
    } catch (error) {
      console.error('Error saving material:', error);
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 处理表单变更
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 获取类型标识
  const getTypeBadge = (type: string) => {
    if (type === 'video') {
      return (
        <Badge variant="default" className="bg-purple-100 text-purple-800">
          <Video className="w-3 h-3 mr-1" />
          视频
        </Badge>
      );
    } else {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <Image className="w-3 h-3 mr-1" />
          图片
        </Badge>
      );
    }
  };


  useEffect(() => {
    loadMaterial();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">加载中...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!material) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <p className="text-gray-500">材料不存在或已被删除</p>
              <Button 
                className="mt-4" 
                onClick={() => navigate('/admin/materials')}
              >
                返回材料管理
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* 页面头部 */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/materials')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回材料管理
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">编辑展示案例</h1>
              {getTypeBadge(material.type)}
            </div>
            <p className="text-muted-foreground">修改展示案例信息和关联商品推荐数量</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存更改
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：预览 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>预览</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 媒体预览 */}
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {material.type === 'video' ? (
                      material.thumbnail_url ? (
                        <img
                          src={material.thumbnail_url}
                          alt={material.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-12 h-12 text-gray-400" />
                        </div>
                      )
                    ) : (
                      material.public_url ? (
                        <img
                          src={material.public_url}
                          alt={material.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-12 h-12 text-gray-400" />
                        </div>
                      )
                    )}
                  </div>

                  {/* 基本信息 */}
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">ID:</span> {material.id}
                    </div>
                    <div>
                      <span className="text-muted-foreground">类型:</span> {material.type === 'video' ? '视频' : '图片'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">创建时间:</span> {formatDateTime(material.created_at)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">更新时间:</span> {formatDateTime(material.updated_at)}
                    </div>
                    {material.duration_seconds && (
                      <div>
                        <span className="text-muted-foreground">时长:</span> {Math.floor(material.duration_seconds / 60)}:{(material.duration_seconds % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：编辑表单 */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* 基本信息 */}
              <Card>
                <CardHeader>
                  <CardTitle>基本信息</CardTitle>
                  <CardDescription>编辑材料的标题、描述等基本信息</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">标题 *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="请输入材料标题"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">描述</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="请输入材料描述"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">详细内容</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      placeholder="请输入详细内容"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">分类</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="产品介绍">产品介绍</SelectItem>
                        <SelectItem value="制作工艺">制作工艺</SelectItem>
                        <SelectItem value="企业展示">企业展示</SelectItem>
                        <SelectItem value="使用教程">使用教程</SelectItem>
                        <SelectItem value="客户案例">客户案例</SelectItem>
                        <SelectItem value="其他">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>


              {/* 关联商品推荐数量设置 */}
              {!productsLoading && (
                <ProductRecommendationList
                  materialId={material.id}
                  materialType={material.type}
                  products={associatedProducts}
                  onUpdate={setAssociatedProducts}
                />
              )}

              {productsLoading && (
                <Card>
                  <CardContent className="p-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>加载关联商品...</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MaterialEditPage;


