import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCreateCategory, useUpdateCategory } from '@/hooks/useCategories';
import { CategoryTree, ProductCategory } from '@/services/categoryService';
import { AlertTriangle } from 'lucide-react';

interface CategoryFormProps {
  category?: ProductCategory;
  parentCategory?: CategoryTree;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  parentCategory,
  onSuccess,
  onCancel
}) => {
  const { toast } = useToast();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    icon: category?.icon || '',
    color: category?.color || '#3B82F6',
    sort_order: category?.sort_order || 0,
  });
  
  const isEdit = !!category;
  const level = parentCategory ? parentCategory.level + 1 : 1;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: '错误',
        description: '分类名称不能为空',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      if (isEdit) {
        await updateCategory.mutateAsync({
          categoryId: category.id,
          updates: formData,
        });
        toast({
          title: '成功',
          description: '分类更新成功',
        });
      } else {
        await createCategory.mutateAsync({
          ...formData,
          parent_id: parentCategory?.id || null,
          level,
        });
        toast({
          title: '成功',
          description: '分类创建成功',
        });
      }
      onSuccess();
    } catch (error) {
      console.error('保存分类失败:', error);
    }
  };
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>
          {isEdit ? '编辑分类' : '创建分类'}
        </CardTitle>
        {parentCategory && (
          <p className="text-sm text-muted-foreground">
            在 "{parentCategory.name}" 下创建{level}级分类
          </p>
        )}
        {level > 3 && (
          <div className="flex items-center gap-2 mt-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-yellow-600">
              分类层级过深可能影响用户体验
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">分类名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：水果"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="slug">URL标识</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="例如：fruits"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">分类描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="描述此分类..."
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="icon">图标</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Lucide 图标名"
              />
            </div>
            
            <div>
              <Label htmlFor="color">颜色</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10 p-1"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3B82F6"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="sort_order">排序</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button 
              type="submit"
              disabled={createCategory.isPending || updateCategory.isPending}
            >
              {createCategory.isPending || updateCategory.isPending ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};