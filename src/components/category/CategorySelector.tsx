// 分类选择器组件 - 优化版本
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search, Folder, FolderOpen, X, Star, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCategoryTree, useCategoryPaths } from '@/hooks/useCategories';
import { CategoryTree, CategoryPath } from '@/services/categoryService';

interface CategorySelectorProps {
  value?: number | number[];
  onValueChange?: (value: number | number[]) => void;
  placeholder?: string;
  multiple?: boolean;
  level?: number; // 限制选择的分类层级
  includeChildren?: boolean; // 是否包含子分类
  disabled?: boolean;
  className?: string;
  showRecentUsed?: boolean; // 显示最近使用
  showPopular?: boolean; // 显示热门分类
}

// 存储最近使用的分类（简单的本地存储实现）
const RECENT_CATEGORIES_KEY = 'recent-categories';
const MAX_RECENT_COUNT = 8;

const getRecentCategories = (): number[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_CATEGORIES_KEY) || '[]');
  } catch {
    return [];
  }
};

const addRecentCategory = (categoryId: number) => {
  const recent = getRecentCategories();
  const filtered = recent.filter(id => id !== categoryId);
  const newRecent = [categoryId, ...filtered].slice(0, MAX_RECENT_COUNT);
  localStorage.setItem(RECENT_CATEGORIES_KEY, JSON.stringify(newRecent));
};

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onValueChange,
  placeholder = '选择分类...',
  multiple = false,
  level,
  includeChildren = true,
  disabled = false,
  className,
  showRecentUsed = true,
  showPopular = true
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [recentCategories, setRecentCategories] = useState<number[]>(getRecentCategories());
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { data: categoryTree, isLoading } = useCategoryTree();
  const { data: categoryPaths } = useCategoryPaths();
  
  // 热门分类（基于某种逻辑，这里先硬编码）
  const popularCategoryIds = useMemo(() => [1, 2, 3, 5, 8], []);
  
  // 扁平化分类数据用于搜索和选择
  const flatCategories = useMemo(() => {
    if (!categoryPaths) return [];
    
    return categoryPaths.filter(cat => {
      if (level && cat.level !== level) return false;
      return true;
    });
  }, [categoryPaths, level]);
  
  // 智能搜索 - 支持拼音首字母、全路径等
  const filteredCategories = useMemo(() => {
    if (!searchValue.trim()) return flatCategories;
    
    const searchTerm = searchValue.toLowerCase().trim();
    const searchWords = searchTerm.split(' ').filter(Boolean);
    
    return flatCategories.filter(cat => {
      const matchFields = [
        cat.name.toLowerCase(),
        cat.full_path.toLowerCase(),
        cat.path_names.join(' ').toLowerCase(),
        cat.slug?.toLowerCase() || ''
      ];
      
      // 支持多词搜索
      return searchWords.every(word => 
        matchFields.some(field => field.includes(word))
      );
    }).sort((a, b) => {
      // 优先显示名称完全匹配的
      const aNameMatch = a.name.toLowerCase().includes(searchTerm);
      const bNameMatch = b.name.toLowerCase().includes(searchTerm);
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      
      // 其次按层级排序，低层级优先
      return a.level - b.level;
    });
  }, [flatCategories, searchValue]);
  
  // 获取当前选中的分类
  const selectedCategories = useMemo(() => {
    if (!categoryPaths || !value) return [];
    
    const valueArray = Array.isArray(value) ? value : [value];
    return categoryPaths.filter(cat => valueArray.includes(cat.id));
  }, [categoryPaths, value]);
  
  // 获取最近使用的分类数据
  const recentCategoryData = useMemo(() => {
    if (!categoryPaths) return [];
    return recentCategories.map(id => categoryPaths.find(cat => cat.id === id)).filter(Boolean) as CategoryPath[];
  }, [categoryPaths, recentCategories]);
  
  // 获取热门分类数据
  const popularCategoryData = useMemo(() => {
    if (!categoryPaths) return [];
    return popularCategoryIds.map(id => categoryPaths.find(cat => cat.id === id)).filter(Boolean) as CategoryPath[];
  }, [categoryPaths, popularCategoryIds]);
  
  // 处理分类选择
  const handleSelect = (categoryId: number) => {
    if (multiple) {
      const currentValue = Array.isArray(value) ? value : [];
      const newValue = currentValue.includes(categoryId)
        ? currentValue.filter(id => id !== categoryId)
        : [...currentValue, categoryId];
      onValueChange?.(newValue);
    } else {
      onValueChange?.(categoryId);
      setOpen(false);
    }
    
    // 添加到最近使用
    addRecentCategory(categoryId);
    setRecentCategories(getRecentCategories());
  };
  
  // 移除选中的分类
  const handleRemove = (categoryId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (multiple) {
      const currentValue = Array.isArray(value) ? value : [];
      const newValue = currentValue.filter(id => id !== categoryId);
      onValueChange?.(newValue);
    } else {
      onValueChange?.(undefined);
    }
  };
  
  // 清空所有选择
  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange?.(multiple ? [] : undefined);
  };
  
  // 打开弹窗时聚焦搜索框
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);
  
  // 渲染选中值显示
  const renderSelectedValue = () => {
    if (selectedCategories.length === 0) {
      return <span className="text-muted-foreground">{placeholder}</span>;
    }
    
    if (multiple) {
      return (
        <div className="flex flex-wrap gap-1 max-w-full">
          {selectedCategories.slice(0, 2).map(cat => (
            <Badge 
              key={cat.id} 
              variant="secondary" 
              className="text-xs max-w-[120px] truncate cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
              onClick={(e) => handleRemove(cat.id, e)}
              title={`${cat.full_path} - 点击移除`}
            >
              {cat.name}
              <X className="ml-1 w-3 h-3" />
            </Badge>
          ))}
          {selectedCategories.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{selectedCategories.length - 2}
            </Badge>
          )}
          {selectedCategories.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleClearAll}
              title="清空所有选择"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-between w-full">
        <span className="truncate flex-1" title={selectedCategories[0]?.full_path}>
          {selectedCategories[0]?.name}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleClearAll}
          title="清除选择"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  };
  
  // 渲染分类选项
  const renderCategoryOption = (category: CategoryPath, showPath = true) => {
    const isSelected = Array.isArray(value) 
      ? value.includes(category.id)
      : value === category.id;
    
    const levelColors = {
      1: 'text-blue-600',
      2: 'text-green-600', 
      3: 'text-purple-600'
    };
    
    return (
      <CommandItem
        key={category.id}
        value={`${category.id}-${category.name}-${category.full_path}`}
        onSelect={() => handleSelect(category.id)}
        className="flex items-center gap-2 py-2 cursor-pointer hover:bg-accent"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex items-center gap-1" style={{ paddingLeft: `${showPath ? (category.level - 1) * 12 : 0}px` }}>
            {category.level === 1 && <Folder className={`w-4 h-4 ${levelColors[1]}`} />}
            {category.level === 2 && <FolderOpen className={`w-4 h-4 ${levelColors[2]}`} />}
            {category.level >= 3 && <div className={`w-2 h-2 rounded-full ${levelColors[3]?.replace('text-', 'bg-')}`} />}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{category.name}</div>
            {showPath && category.level > 1 && (
              <div className="text-xs text-muted-foreground truncate">
                {category.path_names.slice(0, -1).join(' > ')}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {isSelected && <Check className="w-4 h-4 text-primary" />}
          <Badge variant="outline" className="text-xs shrink-0">
            L{category.level}
          </Badge>
        </div>
      </CommandItem>
    );
  };
  
  if (isLoading) {
    return (
      <Button
        variant="outline"
        disabled
        className={cn("w-full justify-between", className)}
      >
        <span>加载中...</span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
      </Button>
    );
  }
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between text-left font-normal", 
            selectedCategories.length === 0 && "text-muted-foreground",
            className
          )}
        >
          {renderSelectedValue()}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)', maxWidth: '400px' }}>
        <Command className="rounded-lg border-none">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              ref={searchInputRef}
              placeholder="搜索分类名称、路径..."
              value={searchValue}
              onValueChange={setSearchValue}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none"
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setSearchValue('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {!searchValue && (
              <>
                {/* 最近使用的分类 */}
                {showRecentUsed && recentCategoryData.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      最近使用
                    </div>
                    <CommandGroup className="p-0">
                      {recentCategoryData.slice(0, 4).map(cat => renderCategoryOption(cat, false))}
                    </CommandGroup>
                    <Separator />
                  </>
                )}
                
                {/* 热门分类 */}
                {showPopular && popularCategoryData.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30 flex items-center gap-2">
                      <Star className="w-3 h-3" />
                      热门分类
                    </div>
                    <CommandGroup className="p-0">
                      {popularCategoryData.slice(0, 4).map(cat => renderCategoryOption(cat, false))}
                    </CommandGroup>
                    <Separator />
                  </>
                )}
                
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                  所有分类
                </div>
              </>
            )}
            
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              <div>未找到匹配的分类</div>
              {searchValue && (
                <div className="mt-2 text-xs">
                  尝试搜索分类名称或完整路径
                </div>
              )}
            </CommandEmpty>
            
            <CommandGroup className="p-0">
              {(searchValue ? filteredCategories : flatCategories).map(cat => renderCategoryOption(cat))}
            </CommandGroup>
          </div>
          
          {/* 多选模式下的已选择显示 */}
          {multiple && selectedCategories.length > 0 && (
            <>
              <Separator />
              <div className="p-3 bg-muted/30">
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center justify-between">
                  <span>已选择 {selectedCategories.length} 个分类</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={handleClearAll}
                  >
                    清空全部
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {selectedCategories.map(cat => (
                    <Badge
                      key={cat.id}
                      variant="secondary"
                      className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => handleSelect(cat.id)}
                      title={`${cat.full_path} - 点击移除`}
                    >
                      {cat.name} <X className="ml-1 w-3 h-3" />
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// 分类面包屑组件
interface CategoryBreadcrumbsProps {
  categoryId?: number;
  categorySlug?: string;
  showIcon?: boolean;
  className?: string;
  onCategoryClick?: (categoryId: number) => void;
}

export const CategoryBreadcrumbs: React.FC<CategoryBreadcrumbsProps> = ({
  categoryId,
  categorySlug,
  showIcon = true,
  className,
  onCategoryClick
}) => {
  const { data: categoryPaths } = useCategoryPaths();
  
  const category = useMemo(() => {
    if (!categoryPaths) return null;
    
    if (categoryId) {
      return categoryPaths.find(cat => cat.id === categoryId);
    }
    
    if (categorySlug) {
      return categoryPaths.find(cat => cat.slug === categorySlug);
    }
    
    return null;
  }, [categoryPaths, categoryId, categorySlug]);
  
  if (!category) {
    return null;
  }
  
  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}>
      {showIcon && <Folder className="w-4 h-4" />}
      {category.path_names.map((name, index, array) => (
        <React.Fragment key={index}>
          {index > 0 && <span>/</span>}
          <span 
            className={cn(
              index === array.length - 1 
                ? "text-foreground font-medium" 
                : "hover:text-foreground cursor-pointer transition-colors",
              onCategoryClick && "cursor-pointer"
            )}
            onClick={() => {
              if (onCategoryClick && category.path_ids[index]) {
                onCategoryClick(category.path_ids[index]);
              }
            }}
          >
            {name}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
};

// 分类标签组件
interface CategoryTagProps {
  categoryId: number;
  showFullPath?: boolean;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  onRemove?: () => void;
}

export const CategoryTag: React.FC<CategoryTagProps> = ({
  categoryId,
  showFullPath = false,
  variant = 'default',
  size = 'md',
  className,
  onClick,
  onRemove
}) => {
  const { data: categoryPaths } = useCategoryPaths();
  
  const category = useMemo(() => {
    return categoryPaths?.find(cat => cat.id === categoryId);
  }, [categoryPaths, categoryId]);
  
  if (!category) {
    return null;
  }
  
  const displayText = showFullPath ? category.full_path : category.name;
  
  return (
    <Badge 
      variant={variant} 
      className={cn(
        "cursor-default",
        onClick && "cursor-pointer hover:bg-accent",
        className
      )}
      onClick={onClick}
      title={showFullPath ? undefined : category.full_path}
    >
      {displayText}
      {onRemove && (
        <X 
          className="ml-1 w-3 h-3 cursor-pointer hover:bg-destructive-foreground hover:text-destructive rounded-sm transition-colors" 
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </Badge>
  );
};

export default CategorySelector;