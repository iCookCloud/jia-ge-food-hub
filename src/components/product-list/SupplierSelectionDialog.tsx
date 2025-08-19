import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Star,
  MapPin,
  Package,
  CheckCircle2,
  Building
} from 'lucide-react';
import { supplierService, SupplierProfile } from '@/services/supplierService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SupplierSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    selectedSuppliers: SupplierProfile[], 
    settings?: { message?: string; deadline?: Date }
  ) => void;
  productListId: string;
  productCategories?: string[];
}

export const SupplierSelectionDialog: React.FC<SupplierSelectionDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  productListId,
  productCategories = []
}) => {
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<SupplierProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [shareMessage, setShareMessage] = useState('');
  const [shareDeadline, setShareDeadline] = useState('');

  // 加载认证供应商
  const loadCertifiedSuppliers = async () => {
    setLoading(true);
    try {
      const { data } = await supplierService.fetchSuppliers({
        has_certifications: true,
        product_category: filterCategory || undefined,
        search: searchQuery || undefined
      }, 50);
      
      setSuppliers(data);
    } catch (error) {
      toast.error('加载供应商失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 切换供应商选中状态
  const toggleSupplierSelection = (supplier: SupplierProfile) => {
    setSelectedSuppliers(prev => {
      const isSelected = prev.some(s => s.id === supplier.id);
      if (isSelected) {
        return prev.filter(s => s.id !== supplier.id);
      } else {
        return [...prev, supplier];
      }
    });
  };

  // 获取供应商评分星级
  const getStarRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "w-4 h-4",
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        )}
      />
    ));
  };

  // 渲染供应商卡片
  const renderSupplierCard = (supplier: SupplierProfile) => {
    const isSelected = selectedSuppliers.some(s => s.id === supplier.id);
    const rating = supplier.rating_info?.overall_rating || 0;
    const reviewCount = supplier.rating_info?.total_reviews || 0;

    return (
      <Card
        key={supplier.id}
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""
        )}
        onClick={() => toggleSupplierSelection(supplier)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-4 h-4 text-gray-500" />
                <h3 className="font-semibold">{supplier.name}</h3>
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm mb-2">
                <div className="flex items-center gap-1">
                  {getStarRating(Math.floor(rating))}
                  <span className="text-gray-600 ml-1">
                    {rating.toFixed(1)} ({reviewCount}条评价)
                  </span>
                </div>
              </div>
            </div>
            
            <Checkbox
              checked={isSelected}
              onChange={() => toggleSupplierSelection(supplier)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="space-y-2">
            {/* 服务区域 */}
            {supplier.service_areas && supplier.service_areas.length > 0 && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <div className="flex flex-wrap gap-1">
                  {supplier.service_areas.slice(0, 3).map(area => (
                    <Badge key={area} variant="outline" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                  {supplier.service_areas.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{supplier.service_areas.length - 3}个区域
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* 产品类别 */}
            {supplier.product_categories && supplier.product_categories.length > 0 && (
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                <div className="flex flex-wrap gap-1">
                  {supplier.product_categories.slice(0, 3).map(category => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                  {supplier.product_categories.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{supplier.product_categories.length - 3}个类别
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* 认证信息 */}
            {supplier.quality_certifications && supplier.quality_certifications.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {supplier.quality_certifications.slice(0, 2).map(cert => (
                  <Badge key={cert} className="text-xs bg-green-100 text-green-800">
                    {cert}
                  </Badge>
                ))}
                {supplier.quality_certifications.length > 2 && (
                  <Badge className="text-xs bg-green-100 text-green-800">
                    +{supplier.quality_certifications.length - 2}项认证
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // 处理确认选择
  const handleConfirm = () => {
    if (selectedSuppliers.length === 0) {
      toast.error('请至少选择一个供应商');
      return;
    }
    
    const settings = {
      message: shareMessage.trim() || undefined,
      deadline: shareDeadline ? new Date(shareDeadline) : undefined
    };
    
    onConfirm(selectedSuppliers, settings);
  };

  // 获取可用的产品类别
  const getAvailableCategories = () => {
    const categories = new Set<string>();
    suppliers.forEach(supplier => {
      supplier.product_categories?.forEach(cat => categories.add(cat));
    });
    return Array.from(categories);
  };

  useEffect(() => {
    if (open) {
      loadCertifiedSuppliers();
    }
  }, [open, searchQuery, filterCategory]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>选择认证供应商</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* 搜索和筛选 */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索供应商名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterCategory === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory('')}
              >
                全部类别
              </Button>
              {getAvailableCategories().map(category => (
                <Button
                  key={category}
                  variant={filterCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* 选中的供应商 */}
          {selectedSuppliers.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">
                已选择 {selectedSuppliers.length} 个供应商
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedSuppliers.map(supplier => (
                  <Badge key={supplier.id} variant="default" className="gap-1">
                    {supplier.name}
                    <button
                      onClick={() => toggleSupplierSelection(supplier)}
                      className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              
              {/* 分享设置 */}
              <div className="space-y-3 pt-2">
                <h4 className="font-semibold text-sm">分享设置</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="share-message">备注信息</Label>
                    <Textarea
                      id="share-message"
                      placeholder="给供应商的说明..."
                      value={shareMessage}
                      onChange={(e) => setShareMessage(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="share-deadline">回复截止时间</Label>
                    <Input
                      id="share-deadline"
                      type="datetime-local"
                      value={shareDeadline}
                      onChange={(e) => setShareDeadline(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
            </div>
          )}

          {/* 供应商列表 */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-8">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">没有找到匹配的认证供应商</p>
                <p className="text-sm text-gray-400 mt-1">
                  尝试调整搜索条件或选择其他类别
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suppliers.map(renderSupplierCard)}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedSuppliers.length === 0}
          >
            确认选择 ({selectedSuppliers.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};