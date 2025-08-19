import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Video, 
  Image, 
  Search, 
  Trash2, 
  Eye, 
  Calendar,
  User,
  FileImage,
  Play,
  ArrowLeft,
  Filter,
  Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';

interface MaterialItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  type: 'video' | 'image';
  thumbnail_url?: string;
  public_url?: string;
  duration?: string;
  created_at: string;
  uploaded_by: string;
  supplier_company?: string;
  uploader_name?: string;
  status?: string;
}

const MaterialsManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);

  // 加载展示案例列表
  const loadMaterials = async () => {
    setLoading(true);
    try {
      // 从materials_unified视图获取数据
      let query = supabase
        .from('materials_unified')
        .select('*')
        .order('created_at', { ascending: false });

      // 应用筛选条件
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      if (typeFilter && typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setMaterials(data || []);
    } catch (error) {
      console.error('Error loading materials:', error);
      toast.error('加载展示案例失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除展示案例
  const deleteMaterial = async (material: MaterialItem) => {
    if (!material.id) return;

    setDeleting(material.id);
    try {
      let error;

      if (material.type === 'video') {
        // 删除视频记录
        const { error: videoError } = await supabase
          .from('product_videos')
          .delete()
          .eq('id', material.id);
        error = videoError;
      } else if (material.type === 'image') {
        // 删除图片记录
        const { error: imageError } = await supabase
          .from('uploaded_images')
          .delete()
          .eq('id', material.id);
        error = imageError;
      }

      if (error) {
        throw error;
      }

      toast.success(`${material.type === 'video' ? '视频' : '图片'}已删除`);
      
      // 重新加载列表
      loadMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('删除失败，请重试');
    } finally {
      setDeleting(null);
      setDeleteDialogOpen(false);
      setSelectedMaterial(null);
    }
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

  // 获取状态标识
  const getStatusBadge = (status?: string) => {
    const statusConfig = {
      ready: { label: '可用', className: 'bg-green-100 text-green-800' },
      processing: { label: '处理中', className: 'bg-yellow-100 text-yellow-800' },
      error: { label: '错误', className: 'bg-red-100 text-red-800' },
      pending: { label: '待审核', className: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ready;

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // 处理删除确认
  const handleDeleteClick = (material: MaterialItem) => {
    setSelectedMaterial(material);
    setDeleteDialogOpen(true);
  };

  // 处理删除确认
  const handleDeleteConfirm = () => {
    if (selectedMaterial) {
      deleteMaterial(selectedMaterial);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, [searchQuery, categoryFilter, typeFilter]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* 页面头部 */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/management')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回管理中心
          </Button>
          <div>
            <h1 className="text-2xl font-bold">展示案例管理</h1>
            <p className="text-muted-foreground">管理系统中的视频和图片展示案例</p>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              筛选和搜索
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">搜索关键词</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索标题或描述..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">内容类型</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="video">视频</SelectItem>
                    <SelectItem value="image">图片</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">分类</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    <SelectItem value="产品介绍">产品介绍</SelectItem>
                    <SelectItem value="制作工艺">制作工艺</SelectItem>
                    <SelectItem value="企业展示">企业展示</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">总数</p>
                  <p className="text-2xl font-bold">{materials.length}</p>
                </div>
                <FileImage className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">视频</p>
                  <p className="text-2xl font-bold">{materials.filter(m => m.type === 'video').length}</p>
                </div>
                <Video className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">图片</p>
                  <p className="text-2xl font-bold">{materials.filter(m => m.type === 'image').length}</p>
                </div>
                <Image className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">今日上传</p>
                  <p className="text-2xl font-bold">
                    {materials.filter(m => {
                      const today = new Date().toISOString().split('T')[0];
                      return m.created_at.startsWith(today);
                    }).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 展示案例列表 */}
        <Card>
          <CardHeader>
            <CardTitle>展示案例列表</CardTitle>
            <CardDescription>
              管理系统中的所有视频和图片展示案例
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">加载中...</span>
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-8">
                <FileImage className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">暂无展示案例</p>
              </div>
            ) : (
              <div className="space-y-4">
                {materials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* 缩略图 */}
                    <div className="flex-shrink-0">
                      {material.type === 'video' ? (
                        <div className="relative w-16 h-16 bg-black rounded overflow-hidden">
                          {material.thumbnail_url && (
                            <img
                              src={material.thumbnail_url}
                              alt={material.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden">
                          {material.public_url ? (
                            <img
                              src={material.public_url}
                              alt={material.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 内容信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{material.title}</h3>
                        {getTypeBadge(material.type)}
                        {material.status && getStatusBadge(material.status)}
                      </div>
                      
                      {material.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                          {material.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{material.uploader_name || '未知用户'}</span>
                        </div>
                        {material.supplier_company && (
                          <div className="flex items-center gap-1">
                            <span>企业: {material.supplier_company}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDateTime(material.created_at)}</span>
                        </div>
                        {material.duration && (
                          <div>时长: {material.duration}</div>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link to={`/materials/${material.type}/${material.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          查看
                        </Link>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(material)}
                        disabled={deleting === material.id}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        {deleting === material.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 删除确认对话框 */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                您确定要删除「{selectedMaterial?.title}」吗？此操作无法撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default MaterialsManagementPage;