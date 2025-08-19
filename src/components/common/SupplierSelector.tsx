import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, Building2, User, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supplierApi } from '@/services/api';
import { UnifiedSupplier } from '@/services/supplierService';

interface SupplierSelectorProps {
  // 选择模式：单选或多选
  mode?: 'single' | 'multiple';
  // 已选择的供应商ID数组
  selectedSupplierIds?: string[];
  // 选择变化回调
  onSelectionChange: (supplierIds: string[]) => void;
  // 可选的占位符文本
  placeholder?: string;
  // 是否显示企业信息
  showCompanyInfo?: boolean;
  // 最大选择数量（仅多选模式有效）
  maxSelection?: number;
  // 是否禁用
  disabled?: boolean;
  // 自定义类名
  className?: string;
}

const SupplierSelector: React.FC<SupplierSelectorProps> = ({
  mode = 'single',
  selectedSupplierIds = [],
  onSelectionChange,
  placeholder = '搜索供应商...',
  showCompanyInfo = true,
  maxSelection,
  disabled = false,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suppliers, setSuppliers] = useState<UnifiedSupplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<UnifiedSupplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 加载供应商列表
  const loadSuppliers = async (search?: string) => {
    setLoading(true);
    try {
      const supplierList = await supplierApi.getAllSuppliers(search);
      setSuppliers(supplierList);
      setFilteredSuppliers(supplierList);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadSuppliers();
  }, []);

  // 搜索过滤
  useEffect(() => {
    if (searchQuery.trim()) {
      loadSuppliers(searchQuery);
    } else {
      setFilteredSuppliers(suppliers);
    }
  }, [searchQuery, suppliers]);

  // 处理选择
  const handleSelection = (supplierId: string) => {
    if (disabled) return;

    let newSelection: string[];

    if (mode === 'single') {
      newSelection = selectedSupplierIds.includes(supplierId) ? [] : [supplierId];
    } else {
      if (selectedSupplierIds.includes(supplierId)) {
        newSelection = selectedSupplierIds.filter(id => id !== supplierId);
      } else {
        if (maxSelection && selectedSupplierIds.length >= maxSelection) {
          return; // 达到最大选择数量
        }
        newSelection = [...selectedSupplierIds, supplierId];
      }
    }

    onSelectionChange(newSelection);
    
    // 单选模式选择后关闭下拉框
    if (mode === 'single' && newSelection.length > 0) {
      setIsDropdownOpen(false);
    }
  };

  // 移除选择
  const handleRemoveSelection = (supplierId: string) => {
    const newSelection = selectedSupplierIds.filter(id => id !== supplierId);
    onSelectionChange(newSelection);
  };

  // 获取已选择的供应商信息
  const getSelectedSuppliers = () => {
    return suppliers.filter(supplier => selectedSupplierIds.includes(supplier.id));
  };

  // 渲染供应商项目
  const renderSupplierItem = (supplier: UnifiedSupplier) => {
    const isSelected = selectedSupplierIds.includes(supplier.id);
    const isDisabled = disabled || (maxSelection && !isSelected && selectedSupplierIds.length >= maxSelection);

    return (
      <div
        key={supplier.id}
        className={`
          p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors
          ${isSelected ? 'bg-primary/5 border-primary/20' : ''}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => !isDisabled && handleSelection(supplier.id)}
      >
        <div className="flex items-start gap-3">
          {/* 选择指示器 */}
          <div className="flex items-center pt-1">
            {mode === 'multiple' ? (
              <Checkbox
                checked={isSelected}
                disabled={isDisabled}
                onChange={(e) => e.stopPropagation()}
                className="h-4 w-4"
              />
            ) : (
              <div className={`w-4 h-4 rounded-full border-2 ${
                isSelected ? 'bg-primary border-primary' : 'border-gray-300'
              }`}>
                {isSelected && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />}
              </div>
            )}
          </div>

          {/* 头像 */}
          <Avatar className="h-10 w-10">
            <AvatarImage src={supplier.avatar_url} />
            <AvatarFallback>
              {supplier.display_name[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          {/* 供应商信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm truncate">
                {supplier.display_name}
              </h4>
              
              {/* 认证标识 */}
              {supplier.is_verified && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  已认证
                </Badge>
              )}
            </div>

            {showCompanyInfo && (
              <div className="text-xs text-muted-foreground space-y-0.5">
                {supplier.company_name && supplier.nickname !== supplier.company_name && (
                  <div className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate">{supplier.company_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span className="truncate">{supplier.nickname}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* 搜索输入框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsDropdownOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10"
        />
      </div>

      {/* 已选择的供应商标签 */}
      {selectedSupplierIds.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {getSelectedSuppliers().map(supplier => (
            <Badge
              key={supplier.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <Avatar className="h-4 w-4">
                <AvatarImage src={supplier.avatar_url} />
                <AvatarFallback className="text-xs">
                  {supplier.display_name[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">{supplier.display_name}</span>
              {supplier.is_verified && (
                <CheckCircle className="w-3 h-3 text-green-600" />
              )}
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSelection(supplier.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* 下拉选择列表 */}
      {isDropdownOpen && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* 下拉内容 */}
          <Card className="absolute top-full left-0 right-0 mt-1 z-20 max-h-64 overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  加载中...
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {searchQuery ? '未找到匹配的供应商' : '暂无供应商'}
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {filteredSuppliers.map(renderSupplierItem)}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* 选择状态提示 */}
      {maxSelection && mode === 'multiple' && (
        <div className="text-xs text-muted-foreground mt-1">
          已选择 {selectedSupplierIds.length}/{maxSelection} 个供应商
        </div>
      )}
    </div>
  );
};

export default SupplierSelector;