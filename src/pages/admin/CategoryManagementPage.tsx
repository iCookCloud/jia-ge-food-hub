// 分类管理后台界面
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  useCategoryTree, 
  useCategoryStatistics, 
  useDeleteCategory,
  useCategoryById
} from '@/hooks/useCategories';
import { CategoryTree, ProductCategory } from '@/services/categoryService';
import { CategoryForm } from '@/components/category/CategoryForm';
import { CategoryDeleteConfirm } from '@/components/category/CategoryDeleteConfirm';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Folder,
  FolderOpen,
  BarChart3,
  Settings,
  Eye,
  Search
} from 'lucide-react';

// 分类树节点组件
interface CategoryTreeNodeProps {
  category: CategoryTree;
  onEdit: (category: ProductCategory) => void;
  onDelete: (category: ProductCategory) => void;
  onAddChild: (parent: CategoryTree) => void;
  expandedIds: Set<number>;
  onToggleExpand: (id: number) => void;
  searchQuery: string;
  deletingCategory: ProductCategory | null;
  onCancelDelete: () => void;
}

const CategoryTreeNode: React.FC<CategoryTreeNodeProps> = ({
  category,
  onEdit,
  onDelete,
  onAddChild,
  expandedIds,
  onToggleExpand,
  searchQuery,
  deletingCategory,
  onCancelDelete
}) => {
  const isExpanded = expandedIds.has(category.id);
  const hasChildren = category.children && category.children.length > 0;
  
  // 搜索高亮
  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };
  
  // 检查是否匹配搜索
  const isMatchingSearch = (cat: CategoryTree): boolean => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const isMatch = cat.name.toLowerCase().includes(query) || 
                   cat.slug.toLowerCase().includes(query);
    
    if (isMatch) return true;
    
    // 检查子分类
    if (cat.children) {
      return cat.children.some(child => isMatchingSearch(child));
    }
    
    return false;
  };
  
  if (!isMatchingSearch(category)) {
    return null;
  }
  
  const levelColors = ['text-blue-600', 'text-green-600', 'text-purple-600'];
  const levelBgColors = ['bg-blue-50', 'bg-green-50', 'bg-purple-50'];
  
  if (deletingCategory?.id === category.id) {
    return (
      <div className="mb-4" style={{ paddingLeft: `${(category.level - 1) * 2}rem` }}>
        <CategoryDeleteConfirm
          categoryName={category.name}
          hasChildren={hasChildren}
          onConfirm={() => onDelete(category)}
          onCancel={onCancelDelete}
        />
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <div 
        className={`
          flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 
          ${levelBgColors[(category.level - 1) % 3]}
        `}
        style={{ paddingLeft: `${(category.level - 1) * 2}rem` }}
      >
        <div className="flex items-center space-x-2 flex-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onToggleExpand(category.id)}
            className={!hasChildren ? 'invisible' : ''}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
          
          <div className="flex items-center space-x-2">
            {isExpanded ? (
              <FolderOpen className={`w-4 h-4 ${levelColors[(category.level - 1) % 3]}`} />
            ) : (
              <Folder className={`w-4 h-4 ${levelColors[(category.level - 1) % 3]}`} />
            )}
            
            <span 
              className="font-medium"
              dangerouslySetInnerHTML={{ __html: highlightText(category.name) }}
            />
            
            <Badge variant="outline" className="text-xs">
              {category.level}级
            </Badge>
            
            {category.product_count > 0 && (
              <Badge variant="secondary" className="text-xs">
                {category.product_count} 商品
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onAddChild(category)}
            title="添加子分类"
          >
            <Plus className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(category)}
            title="编辑"
          >
            <Edit className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(category)}
            title="删除"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {isExpanded && hasChildren && (
        <div className="ml-4">
          {category.children!.map(child => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              searchQuery={searchQuery}
              deletingCategory={deletingCategory}
              onCancelDelete={onCancelDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategoryManagementPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [parentCategory, setParentCategory] = useState<CategoryTree | undefined>();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [deletingCategory, setDeletingCategory] = useState<ProductCategory | null>(null);
  
  const { data: categoryTree, isLoading } = useCategoryTree();
  const { data: statistics } = useCategoryStatistics();
  const { data: editingCategory } = useCategoryById(editingCategoryId);
  
  // 调试日志
  console.log('CategoryManagementPage 渲染, categoryTree:', categoryTree);
  console.log('正在编辑的分类:', editingCategory);
  const deleteCategory = useDeleteCategory();
  const { toast } = useToast();
  
  const handleEdit = (category: ProductCategory) => {
    setEditingCategoryId(category.id); // 设置要编辑的分类ID，触发数据获取
    setParentCategory(undefined);
    setShowForm(true);
  };
  
  const handleDelete = async (category: ProductCategory) => {
    if (deletingCategory?.id === category.id) {
      // 执行删除
      try {
        await deleteCategory.mutateAsync(category.id);
        toast({
          title: '删除成功',
          description: `分类 "${category.name}" 已删除`,
        });
        setDeletingCategory(null);
      } catch (error) {
        console.error('删除分类失败:', error);
      }
    } else {
      // 显示确认
      setDeletingCategory(category);
    }
  };
  
  const handleAddChild = (parent: CategoryTree) => {
    setEditingCategoryId(null);
    setParentCategory(parent);
    setShowForm(true);
  };
  
  const handleAddRoot = () => {
    setEditingCategoryId(null);
    setParentCategory(undefined);
    setShowForm(true);
  };
  
  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };
  
  const expandAll = () => {
    const allIds = new Set<number>();
    const collectIds = (categories: CategoryTree[]) => {
      categories.forEach(cat => {
        if (cat.children && cat.children.length > 0) {
          allIds.add(cat.id);
          collectIds(cat.children);
        }
      });
    };
    if (categoryTree) {
      collectIds(categoryTree);
    }
    setExpandedIds(allIds);
  };
  
  const collapseAll = () => {
    setExpandedIds(new Set());
  };
  
  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">分类管理</h1>
          <p className="text-muted-foreground">管理商品分类体系，支持多级分类结构</p>
        </div>
        
        {/* 统计卡片 */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总分类数</p>
                    <p className="text-2xl font-bold">{statistics.total_categories}</p>
                  </div>
                  <Settings className="w-8 h-8 text-muted-foreground/20" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">一级分类</p>
                    <p className="text-2xl font-bold">{statistics.level1_count}</p>
                  </div>
                  <Folder className="w-8 h-8 text-blue-500/20" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">二级分类</p>
                    <p className="text-2xl font-bold">{statistics.level2_count}</p>
                  </div>
                  <Folder className="w-8 h-8 text-green-500/20" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">三级分类</p>
                    <p className="text-2xl font-bold">{statistics.level3_count}</p>
                  </div>
                  <Folder className="w-8 h-8 text-purple-500/20" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* 表单区域 */}
        {showForm && (
          <CategoryForm
            category={editingCategory}
            parentCategory={parentCategory}
            onSuccess={() => {
              setShowForm(false);
              setEditingCategoryId(null);
              setParentCategory(undefined);
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingCategoryId(null);
              setParentCategory(undefined);
            }}
          />
        )}
        
        {/* 工具栏 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索分类..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={expandAll}
                >
                  展开全部
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={collapseAll}
                >
                  收起全部
                </Button>
                {!showForm && (
                  <Button onClick={handleAddRoot}>
                    <Plus className="w-4 h-4 mr-2" />
                    添加一级分类
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 分类树 */}
        <Card>
          <CardHeader>
            <CardTitle>分类结构</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                加载中...
              </div>
            ) : categoryTree && categoryTree.length > 0 ? (
              <div className="space-y-2">
                {categoryTree.map(category => (
                  <CategoryTreeNode
                    key={category.id}
                    category={category}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddChild={handleAddChild}
                    expandedIds={expandedIds}
                    onToggleExpand={toggleExpand}
                    searchQuery={searchQuery}
                    deletingCategory={deletingCategory}
                    onCancelDelete={() => setDeletingCategory(null)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">暂无分类数据</p>
                <Button onClick={handleAddRoot}>
                  <Plus className="w-4 h-4 mr-2" />
                  创建第一个分类
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CategoryManagementPage;