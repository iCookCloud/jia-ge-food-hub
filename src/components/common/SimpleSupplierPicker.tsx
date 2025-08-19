import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search, CheckCircle, Building2, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supplierApi } from '@/services/api';
import { UnifiedSupplier } from '@/services/supplierService';

interface SimpleSupplierPickerProps {
  // 当前选中的供应商ID
  selectedSupplierId?: string;
  // 选择变化回调
  onSelectionChange: (supplierId: string | undefined) => void;
  // 占位符文本
  placeholder?: string;
  // 是否禁用
  disabled?: boolean;
  // 自定义类名
  className?: string;
  // 是否显示企业信息
  showCompanyInfo?: boolean;
}

const SimpleSupplierPicker: React.FC<SimpleSupplierPickerProps> = ({
  selectedSupplierId,
  onSelectionChange,
  placeholder = '选择供应商',
  disabled = false,
  className = '',
  showCompanyInfo = true
}) => {
  const [open, setOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<UnifiedSupplier[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载供应商列表
  const loadSuppliers = async (search?: string) => {
    setLoading(true);
    try {
      const supplierList = await supplierApi.getAllSuppliers(search);
      setSuppliers(supplierList);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadSuppliers();
  }, []);

  // 获取选中的供应商
  const selectedSupplier = suppliers.find(supplier => supplier.id === selectedSupplierId);

  // 渲染供应商选项
  const renderSupplierOption = (supplier: UnifiedSupplier) => (
    <CommandItem
      key={supplier.id}
      value={supplier.id}
      onSelect={() => {
        const newValue = selectedSupplierId === supplier.id ? undefined : supplier.id;
        onSelectionChange(newValue);
        setOpen(false);
      }}
      className="flex items-center gap-3 p-3"
    >
      {/* 头像 */}
      <Avatar className="h-8 w-8">
        <AvatarImage src={supplier.avatar_url} />
        <AvatarFallback className="text-xs">
          {supplier.display_name[0]?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>

      {/* 供应商信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm truncate">
            {supplier.display_name}
          </span>
          
          {/* 认证标识 */}
          {supplier.is_verified && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 px-1 py-0">
              <CheckCircle className="w-3 h-3" />
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

      {/* 选中标识 */}
      <Check
        className={cn(
          "ml-auto h-4 w-4",
          selectedSupplierId === supplier.id ? "opacity-100" : "opacity-0"
        )}
      />
    </CommandItem>
  );

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedSupplier ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={selectedSupplier.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {selectedSupplier.display_name[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{selectedSupplier.display_name}</span>
                {selectedSupplier.is_verified && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="搜索供应商..." 
              onValueChange={loadSuppliers}
            />
            <CommandList>
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  加载中...
                </div>
              ) : (
                <>
                  <CommandEmpty>未找到供应商</CommandEmpty>
                  <CommandGroup>
                    {/* 清除选择选项 */}
                    {selectedSupplierId && (
                      <CommandItem
                        onSelect={() => {
                          onSelectionChange(undefined);
                          setOpen(false);
                        }}
                        className="text-muted-foreground"
                      >
                        <X className="mr-2 h-4 w-4" />
                        清除选择
                      </CommandItem>
                    )}
                    
                    {/* 供应商选项列表 */}
                    {suppliers.map(renderSupplierOption)}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SimpleSupplierPicker;